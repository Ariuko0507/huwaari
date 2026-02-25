import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import WeeklyScheduleBoard from "../../components/WeeklyScheduleBoard";
import { supabase } from "../../lib/supabaseClient";

type ScheduleRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes: { name: string } | null;
  subjects: { id: string; name: string; teacher_id: string | null } | null;
  rooms: { name: string } | null;
};

type ScheduleRaw = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes: Array<{ name: string }> | null;
  subjects: Array<{ id: string; name: string; teacher_id: string | null }> | null;
  rooms: Array<{ name: string }> | null;
};

type ViewMode = "all" | "mine";

export default function TeacherDashboard() {
  const router = useRouter();
  const [allSchedules, setAllSchedules] = useState<ScheduleRow[]>([]);
  const [mySchedules, setMySchedules] = useState<ScheduleRow[]>([]);
  const [mode, setMode] = useState<ViewMode>("all");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const fetchSchedule = async (currentTeacherId = teacherId) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("schedules")
      .select("id,day_of_week,start_time,end_time,classes(name),subjects(id,name,teacher_id),rooms(name)")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      alert(error.message);
      setAllSchedules([]);
      setMySchedules([]);
      setLoading(false);
      return;
    }

    const rows: ScheduleRow[] = ((data || []) as ScheduleRaw[]).map((row) => ({
      id: row.id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      classes: row.classes?.[0] || null,
      subjects: row.subjects?.[0] || null,
      rooms: row.rooms?.[0] || null,
    }));

    setAllSchedules(rows);
    setMySchedules(currentTeacherId ? rows.filter((row) => row.subjects?.teacher_id === currentTeacherId) : []);
    setLoading(false);
  };

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

      if (role !== "teacher") {
        if (role === "admin") router.replace("/admin");
        else if (role === "student") router.replace("/student");
        else router.replace("/login");
        return;
      }

      setTeacherId(user.id);
      setTeacherEmail(user.email || "");
      setChecking(false);
      await fetchSchedule(user.id);
    };

    void checkAccess();
  }, [router]);

  const visibleSchedules = useMemo(() => (mode === "all" ? allSchedules : mySchedules), [mode, allSchedules, mySchedules]);

  const boardItems = useMemo(
    () =>
      visibleSchedules.map((s) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        class_name: s.classes?.name || "-",
        subject_name: s.subjects?.name || "-",
        room_name: s.rooms?.name || "-",
      })),
    [visibleSchedules]
  );

  if (checking) return null;

  return (
    <div className="admin-page-bg">
      <div className="admin-shell">
        <div className="w-full p-6 grid gap-4">
          <div className="admin-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Багш</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Хуваарийн самбар</h1>
            <p className="text-sm text-gray-600 mt-1">{teacherEmail ? `Нэвтэрсэн багш: ${teacherEmail}` : "Нэвтэрсэн хэрэглэгч олдсонгүй"}</p>
          </div>

          <div className="admin-card">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setMode("all")} className={`px-4 py-2 rounded-md border text-sm font-semibold ${mode === "all" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700"}`}>Нийт хуваарь</button>
                <button onClick={() => setMode("mine")} className={`px-4 py-2 rounded-md border text-sm font-semibold ${mode === "mine" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700"}`}>Миний хуваарь</button>
              </div>
              <button className="admin-submit" onClick={() => fetchSchedule()}>Шинэчлэх</button>
            </div>
          </div>

          <div className="admin-card admin-grid-wrap">
            {loading ? <p className="admin-empty">Ачааллаж байна...</p> : <WeeklyScheduleBoard items={boardItems} />}
          </div>
        </div>
      </div>
    </div>
  );
}
