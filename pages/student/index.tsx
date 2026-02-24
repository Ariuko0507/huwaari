import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type ClassItem = { id: string; name: string };
type ScheduleRow = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes: { id: string; name: string } | null;
  subjects: { name: string } | null;
  rooms: { name: string } | null;
};

type ScheduleRaw = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes: Array<{ id: string; name: string }> | null;
  subjects: Array<{ name: string }> | null;
  rooms: Array<{ name: string }> | null;
};

type ViewMode = "all" | "my-class";

const dayNames: Record<number, string> = { 1: "Даваа", 2: "Мягмар", 3: "Лхагва", 4: "Пүрэв", 5: "Баасан" };

export default function StudentDashboard() {
  const [allSchedules, setAllSchedules] = useState<ScheduleRow[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [myClassId, setMyClassId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [mode, setMode] = useState<ViewMode>("my-class");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setStudentEmail(user?.email || "");

    const [classRes, scheduleRes] = await Promise.all([
      supabase.from("classes").select("id,name").order("name", { ascending: true }),
      supabase.from("schedules").select("id,class_id,day_of_week,start_time,end_time,classes(id,name),subjects(name),rooms(name)").order("day_of_week", { ascending: true }).order("start_time", { ascending: true }),
    ]);

    const classRows = (classRes.data || []) as ClassItem[];
    setClasses(classRows);
    if (!selectedClassId && classRows.length > 0) setSelectedClassId(classRows[0].id);

    if (scheduleRes.error) {
      alert(scheduleRes.error.message);
      setAllSchedules([]);
      setLoading(false);
      return;
    }

    const rows: ScheduleRow[] = ((scheduleRes.data || []) as ScheduleRaw[]).map((row) => ({
      id: row.id,
      class_id: row.class_id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      classes: row.classes?.[0] || null,
      subjects: row.subjects?.[0] || null,
      rooms: row.rooms?.[0] || null,
    }));
    setAllSchedules(rows);

    if (user?.id) {
      const profileRes = await supabase.from("users").select("class_id").eq("id", user.id).maybeSingle();
      const resolvedClassId = (profileRes.data as { class_id?: string } | null)?.class_id || "";
      if (resolvedClassId) {
        setMyClassId(resolvedClassId);
        setSelectedClassId(resolvedClassId);
      }
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const activeClassId = myClassId || selectedClassId;
  const visibleSchedules = useMemo(() => {
    if (mode === "all") return allSchedules;
    if (!activeClassId) return [];
    return allSchedules.filter((row) => row.class_id === activeClassId);
  }, [mode, allSchedules, activeClassId]);

  return (
    <div className="admin-page-bg">
      <div className="admin-shell">
        <div className="p-6 grid gap-4">
          <div className="admin-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Сурагч</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Хуваарийн самбар</h1>
            <p className="text-sm text-gray-600 mt-1">{studentEmail ? `Нэвтэрсэн сурагч: ${studentEmail}` : "Нэвтэрсэн хэрэглэгч олдсонгүй"}</p>
          </div>

          <div className="admin-card">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setMode("all")} className={`px-4 py-2 rounded-md border text-sm font-semibold ${mode === "all" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700"}`}>Нийт хуваарь</button>
                <button onClick={() => setMode("my-class")} className={`px-4 py-2 rounded-md border text-sm font-semibold ${mode === "my-class" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700"}`}>Миний ангийн хуваарь</button>
              </div>
              <div className="flex items-center gap-2">
                <select className="admin-select" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} disabled={Boolean(myClassId)}>
                  {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                <button className="admin-submit" onClick={fetchData}>Шинэчлэх</button>
              </div>
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