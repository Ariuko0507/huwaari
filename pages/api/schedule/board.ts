import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type ClassItem = { id: string; name: string };
type ScheduleItem = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_name: string;
  teacher_name: string;
  teacher_id: string | null;
};

type ApiResponse = {
  classes?: ClassItem[];
  schedules?: ScheduleItem[];
  role?: string;
  userId?: string;
  myClassId?: string | null;
  message?: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "GET") {
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

  const requesterClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user: requester },
    error: requesterErr,
  } = await requesterClient.auth.getUser();
  if (requesterErr || !requester) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { data: requesterProfile, error: profileErr } = await adminClient
    .from("users")
    .select("role,class_id")
    .eq("id", requester.id)
    .maybeSingle();
  if (profileErr || !requesterProfile?.role) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const role = requesterProfile.role;
  if (!["admin", "teacher", "student"].includes(role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const [classRes, scheduleRes] = await Promise.all([
    adminClient.from("classes").select("id,name").order("name", { ascending: true }),
    adminClient
      .from("schedules")
      .select("id,class_id,day_of_week,start_time,end_time,classes(id,name),subjects(name,teacher_id,teachers(name)),rooms(name)")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (classRes.error) return res.status(400).json({ message: classRes.error.message });
  if (scheduleRes.error) return res.status(400).json({ message: scheduleRes.error.message });

  const schedules: ScheduleItem[] = ((scheduleRes.data || []) as Array<Record<string, unknown>>).map((row) => {
    const cls = firstRelation<{ name?: string }>(row.classes as { name?: string } | { name?: string }[] | null);
    const sub = firstRelation<{ name?: string; teacher_id?: string | null; teachers?: { name?: string } | { name?: string }[] | null }>(
      row.subjects as
        | { name?: string; teacher_id?: string | null; teachers?: { name?: string } | { name?: string }[] | null }
        | { name?: string; teacher_id?: string | null; teachers?: { name?: string } | { name?: string }[] | null }[]
        | null
    );
    const room = firstRelation<{ name?: string }>(row.rooms as { name?: string } | { name?: string }[] | null);
    const teacher = firstRelation<{ name?: string }>(sub?.teachers as { name?: string } | { name?: string }[] | null | undefined);

    return {
      id: String(row.id),
      class_id: String(row.class_id),
      day_of_week: Number(row.day_of_week),
      start_time: String(row.start_time),
      end_time: String(row.end_time),
      class_name: cls?.name || "-",
      subject_name: sub?.name || "-",
      room_name: room?.name || "-",
      teacher_name: teacher?.name || "-",
      teacher_id: sub?.teacher_id || null,
    };
  });

  return res.status(200).json({
    classes: (classRes.data || []) as ClassItem[],
    schedules,
    role,
    userId: requester.id,
    myClassId: requesterProfile.class_id || null,
  });
}
