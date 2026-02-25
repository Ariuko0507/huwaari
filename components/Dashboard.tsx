import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import ClassForm from "./ClassForm";
import TeacherForm from "./TeacherForm";
import RoomForm from "./RoomForm";
import SubjectForm from "./SubjectForm";
import ScheduleGrid from "./ScheduleGrid";
import UserCreateForm from "./UserCreateForm";
import { supabase } from "../lib/supabaseClient";

type Tab = "classes" | "teachers" | "rooms" | "subjects" | "schedule" | "users";

type NamedItem = { id: string; name: string };

type DashboardSummary = {
  classes: NamedItem[];
  teachers: NamedItem[];
  rooms: NamedItem[];
  subjects: NamedItem[];
};

const tabTitle: Record<Tab, string> = {
  classes: "Classes",
  teachers: "Teachers",
  rooms: "Rooms",
  subjects: "Subjects",
  schedule: "Schedule",
  users: "Users",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [summary, setSummary] = useState<DashboardSummary>({
    classes: [],
    teachers: [],
    rooms: [],
    subjects: [],
  });

  const fetchSummary = async () => {
    const [classesRes, teachersRes, roomsRes, subjectsRes] = await Promise.all([
      supabase.from("classes").select("id,name").order("name", { ascending: true }),
      supabase.from("teachers").select("id,name").order("name", { ascending: true }),
      supabase.from("rooms").select("id,name").order("name", { ascending: true }),
      supabase.from("subjects").select("id,name").order("name", { ascending: true }),
    ]);

    setSummary({
      classes: classesRes.data || [],
      teachers: teachersRes.data || [],
      rooms: roomsRes.data || [],
      subjects: subjectsRes.data || [],
    });
  };

  useEffect(() => {
    fetchSummary();

    const onDataUpdated = () => {
      fetchSummary();
    };

    window.addEventListener("admin:data-updated", onDataUpdated);
    return () => {
      window.removeEventListener("admin:data-updated", onDataUpdated);
    };
  }, []);

  const activeDescription = useMemo(() => {
    if (activeTab === "schedule") return "Manage weekly schedule and time slots";
    if (activeTab === "users") return "Create student, teacher, or admin users";
    return `Manage ${tabTitle[activeTab].toLowerCase()} records`;
  }, [activeTab]);

  const stats = [
    { label: "Total Classes", value: String(summary.classes.length), hint: "Stored in database" },
    { label: "Total Teachers", value: String(summary.teachers.length), hint: "Stored in database" },
    { label: "Total Rooms", value: String(summary.rooms.length), hint: "Stored in database" },
    { label: "Total Subjects", value: String(summary.subjects.length), hint: "Stored in database" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "classes":
        return <ClassForm />;
      case "teachers":
        return <TeacherForm />;
      case "rooms":
        return <RoomForm />;
      case "subjects":
        return <SubjectForm />;
      case "schedule":
        return <ScheduleGrid />;
      case "users":
        return <UserCreateForm />;
    }
  };

  return (
    <div className="admin-page-bg">
      <div className="admin-shell">
        <div className="admin-main">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="admin-content">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <article key={item.label} className="admin-card">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{item.value}</p>
                  <p className="mt-2 text-xs text-green-600">{item.hint}</p>
                </article>
              ))}
            </section>

            <section className="admin-card admin-panel">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{tabTitle[activeTab]}</h2>
                  <p className="text-sm text-gray-500">{activeDescription}</p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Live</span>
              </div>
              {renderTab()}
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
