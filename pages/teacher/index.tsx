import { useEffect, useMemo, useState } from "react";
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

const dayNames: Record<number, string> = { 1: "Даваа", 2: "Мягмар", 3: "Лхагва", 4: "Пүрэв", 5: "Баасан" };

export default function TeacherDashboard() {
  const [allSchedules, setAllSchedules] = useState<ScheduleRow[]>([]);
  const [mySchedules, setMySchedules] = useState<ScheduleRow[]>([]);
  const [mode, setMode] = useState<ViewMode>("all");
  const [loading, setLoading] = useState(true);
  const [teacherEmail, setTeacherEmail] = useState("");

  const fetchSchedule = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setTeacherEmail(user?.email || "");

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
    setMySchedules(user?.id ? rows.filter((row) => row.subjects?.teacher_id === user.id) : []);
    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const visibleSchedules = useMemo(() => (mode === "all" ? allSchedules : mySchedules), [mode, allSchedules, mySchedules]);

  return (
    <div className="admin-page-bg">
      <div className="admin-shell">
        <div className="p-6 grid gap-4">
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
              <button className="admin-submit" onClick={fetchSchedule}>Шинэчлэх</button>
            </div>
          </div>

          <div className="admin-card admin-grid-wrap">
            {loading ? <p className="admin-empty">Ачааллаж байна...</p> : visibleSchedules.length === 0 ? <p className="admin-empty">Хуваарь олдсонгүй.</p> : (
              <table className="admin-grid-table">
                <thead><tr><th className="admin-grid-head">Өдөр</th><th className="admin-grid-head">Цаг</th><th className="admin-grid-head">Анги</th><th className="admin-grid-head">Хичээл</th><th className="admin-grid-head">Кабинет</th></tr></thead>
                <tbody>
                  {visibleSchedules.map((s) => (
                    <tr key={s.id}><td className="admin-grid-cell">{dayNames[s.day_of_week] || s.day_of_week}</td><td className="admin-grid-cell">{s.start_time} - {s.end_time}</td><td className="admin-grid-cell">{s.classes?.name || "-"}</td><td className="admin-grid-cell">{s.subjects?.name || "-"}</td><td className="admin-grid-cell">{s.rooms?.name || "-"}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}