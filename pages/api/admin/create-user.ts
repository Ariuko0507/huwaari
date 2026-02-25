import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type CreateUserBody = {
  email?: string;
  password?: string;
  role?: "admin" | "teacher" | "student";
  name?: string;
  classId?: string | null;
};

type ApiResponse = {
  message: string;
  userId?: string;
};

const validRoles = new Set(["admin", "teacher", "student"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ message: "Supabase environment variables are missing" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const body = (req.body || {}) as CreateUserBody;
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const role = body.role || "student";
  const name = (body.name || "").trim();
  const classId = body.classId || null;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  if (!validRoles.has(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const requesterClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: requester },
    error: requesterErr,
  } = await requesterClient.auth.getUser();
  if (requesterErr || !requester) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { data: requesterProfile, error: roleErr } = await requesterClient
    .from("users")
    .select("role")
    .eq("id", requester.id)
    .maybeSingle();
  if (roleErr || requesterProfile?.role !== "admin") {
    return res.status(403).json({ message: "Only admin can create users" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    return res.status(400).json({ message: createErr?.message || "User create failed" });
  }

  const userId = created.user.id;

  const { error: upsertUserErr } = await adminClient.from("users").upsert({
    id: userId,
    email,
    role,
    class_id: role === "student" ? classId : null,
  });

  if (upsertUserErr) {
    await adminClient.auth.admin.deleteUser(userId);
    return res.status(400).json({ message: upsertUserErr.message });
  }

  if (role === "teacher") {
    const teacherName = name || email.split("@")[0] || "Teacher";
    const { error: teacherErr } = await adminClient.from("teachers").upsert({
      id: userId,
      name: teacherName,
      email,
    });
    if (teacherErr) {
      await adminClient.from("users").delete().eq("id", userId);
      await adminClient.auth.admin.deleteUser(userId);
      return res.status(400).json({ message: teacherErr.message });
    }
  }

  return res.status(200).json({ message: "User created", userId });
}
