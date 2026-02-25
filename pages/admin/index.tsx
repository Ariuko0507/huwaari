import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Dashboard from "../../components/Dashboard";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      const role = (profile as { role?: string } | null)?.role;

      if (role !== "admin") {
        if (role === "teacher") router.replace("/teacher");
        else if (role === "student") router.replace("/student");
        else router.replace("/login");
        return;
      }

      setChecking(false);
    };

    void checkAccess();
  }, [router]);

  if (checking) return null;
  return <Dashboard />;
}
