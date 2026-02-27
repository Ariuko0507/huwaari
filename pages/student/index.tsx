import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import ScheduleMatrixView from "../../components/ScheduleMatrixView";
import { supabase } from "../../lib/supabaseClient";

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
};

type BoardResponse = {
  classes?: ClassItem[];
  schedules?: Array<ScheduleItem & { teacher_id?: string | null }>;
  role?: string;
  myClassId?: string | null;
  message?: string;
};

export default function StudentDashboard() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);
  const [myClassId, setMyClassId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  const fetchData = useCallback(async () => {
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
      setAllSchedules([]);
      setLoading(false);
      return;
    }

    if (data.role !== "student") {
      if (data.role === "admin") router.replace("/admin");
      else if (data.role === "teacher") router.replace("/teacher");
      else router.replace("/login");
      return;
    }

    setClasses(data.classes || []);
    setAllSchedules((data.schedules || []).map((s) => ({
      id: s.id,
      class_id: s.class_id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      subject_name: s.subject_name,
      room_name: s.room_name,
      teacher_name: s.teacher_name,
    })));
    setMyClassId(data.myClassId || "");
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

      setStudentEmail(user.email || "");
      setChecking(false);
      await fetchData();
    };

    void checkAccess();
  }, [router, fetchData]);

  const allMatrixClasses = useMemo(() => {
    if (classes.length > 0) return classes;

    const map = new Map<string, ClassItem>();
    allSchedules.forEach((s) => {
      if (s.class_id) map.set(s.class_id, { id: s.class_id, name: s.class_id });
    });
    return Array.from(map.values());
  }, [classes, allSchedules]);

  const myClassMatrixItems = useMemo(
    () => allSchedules.filter((s) => (myClassId ? s.class_id === myClassId : false)),
    [allSchedules, myClassId]
  );

  const myClassName = useMemo(() => {
    if (!myClassId) return "";
    return allMatrixClasses.find((c) => c.id === myClassId)?.name || "";
  }, [allMatrixClasses, myClassId]);

  if (checking) return null;

  return (
    <div className="admin-page-bg">
      <div className="admin-shell">
        <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
          <div className="admin-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Сурагч</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Хуваарийн самбар</h1>
            <p className="text-sm text-gray-600 mt-1">
              {studentEmail ? `Нэвтэрсэн сурагч: ${studentEmail}` : "Нэвтэрсэн хэрэглэгч олдсонгүй"}
            </p>
          </div>

          <div className="admin-card p-6 space-y-6">
            <div className="border-t pt-6 space-y-8">
              {loading ? (
                <p className="text-sm text-gray-500">Ачааллаж байна...</p>
              ) : (
                <>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Миний ангийн хуваарь</h2>
                      <span className="text-sm text-gray-600">{myClassName ? `Анги: ${myClassName}` : "Ангийн мэдээлэл олдсонгүй"}</span>
                    </div>
                    {myClassMatrixItems.length > 0 && myClassId ? (
                      <ScheduleMatrixView
                        classes={allMatrixClasses.filter((c) => c.id === myClassId)}
                        schedules={myClassMatrixItems}
                      />
                    ) : (
                      <p className="text-sm text-gray-500">Таны ангид оноосон хуваарь одоогоор алга.</p>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Нийт ангиудын хуваарь</h2>
                    <ScheduleMatrixView classes={allMatrixClasses} schedules={allSchedules} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
