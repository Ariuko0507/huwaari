import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import ScheduleMatrixView from "../../components/ScheduleMatrixView";
import { supabase } from "../../lib/supabaseClient";

type ViewMode = "all" | "mine";
type ClassItem = { id: string; name: string };
type ScheduleItem = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_name: string;
  teacher_name: string;
  teacher_id: string | null;
};

type BoardResponse = {
  classes?: ClassItem[];
  schedules?: ScheduleItem[];
  role?: string;
  userId?: string;
  message?: string;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [mode, setMode] = useState<ViewMode>("all");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const res = await fetch(`/api/schedule/board?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const data = (await res.json()) as BoardResponse;

    if (!res.ok) {
      alert(data.message || "Хуваарь уншихад алдаа гарлаа.");
      setClasses([]);
      setSchedules([]);
      setLoading(false);
      return;
    }

    if (data.role !== "teacher") {
      if (data.role === "admin") router.replace("/admin");
      else if (data.role === "student") router.replace("/student");
      else router.replace("/login");
      return;
    }

    setTeacherId(data.userId || "");
    setClasses(data.classes || []);
    setSchedules(data.schedules || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setTeacherEmail(user.email || "");
      setChecking(false);
      await fetchSchedules();
    };

    void checkAccess();
  }, [router, fetchSchedules]);

  const filteredSchedules = useMemo(
    () => (mode === "mine" ? schedules.filter((s) => s.teacher_id === teacherId) : schedules),
    [mode, schedules, teacherId]
  );

  const fallbackClasses = useMemo(() => {
    const map = new Map<string, ClassItem>();
    filteredSchedules.forEach((s) => {
      if (s.class_id) map.set(s.class_id, { id: s.class_id, name: s.class_id });
    });
    return Array.from(map.values());
  }, [filteredSchedules]);

  const matrixClasses = useMemo(() => {
    if (classes.length > 0) {
      const ids = new Set(filteredSchedules.map((s) => s.class_id));
      return mode === "mine" ? classes.filter((c) => ids.has(c.id)) : classes;
    }
    return fallbackClasses;
  }, [mode, classes, filteredSchedules, fallbackClasses]);

  const matrixItems = useMemo(
    () =>
      filteredSchedules.map((s) => ({
        id: s.id,
        class_id: s.class_id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        subject_name: s.subject_name,
        room_name: s.room_name,
        teacher_name: s.teacher_name,
      })),
    [filteredSchedules]
  );

  if (checking) return null;

  return (
    <div className="admin-page-bg">
      <div className="admin-shell">
        <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
          <div className="admin-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Багш</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Хуваарийн самбар</h1>
            <p className="text-sm text-gray-600 mt-1">
              {teacherEmail ? `Нэвтэрсэн багш: ${teacherEmail}` : "Нэвтэрсэн хэрэглэгч олдсонгүй"}
            </p>
          </div>

          <div className="admin-card p-6 space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("all")}
                className={`px-4 py-2 rounded-md border text-sm font-semibold transition ${
                  mode === "all"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Нийт хуваарь
              </button>

              <button
                onClick={() => setMode("mine")}
                className={`px-4 py-2 rounded-md border text-sm font-semibold transition ${
                  mode === "mine"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Миний хуваарь
              </button>
            </div>

            <div className="border-t pt-6">
              {loading ? (
                <p className="text-sm text-gray-500">Ачааллаж байна...</p>
              ) : matrixItems.length > 0 && matrixClasses.length > 0 ? (
                <ScheduleMatrixView classes={matrixClasses} schedules={matrixItems} />
              ) : (
                <p className="text-sm text-gray-500">Хуваарь олдсонгүй.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
