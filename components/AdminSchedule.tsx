import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import CreateButton from "./buttons/CreateButton";
import EditButton from "./buttons/EditButton";
import DeleteButton from "./buttons/DeleteButton";
import UpdateButton from "./buttons/UpdateButton";

type ScheduleItem = {
  id: string;
  class_id: string;
  subject_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
  room_name?: string;
};

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    class_id: "",
    subject_id: "",
    room_id: "",
    day_of_week: 1,
    start_time: "08:00",
    end_time: "09:00"
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const { data: c } = await supabase.from("classes").select("*");
    const { data: s } = await supabase.from("subjects").select("*, teachers(name)");
    const { data: r } = await supabase.from("rooms").select("*");
    const { data: sched } = await supabase.from("schedules").select(`
      *,
      classes(name),
      subjects(name, teachers(name)),
      rooms(name)
    `);

    setClasses(c || []);
    setSubjects(s || []);
    setRooms(r || []);
    setSchedules(
      (sched || []).map((sch: any) => ({
        id: sch.id,
        class_id: sch.class_id,
        subject_id: sch.subject_id,
        room_id: sch.room_id,
        day_of_week: sch.day_of_week,
        start_time: sch.start_time,
        end_time: sch.end_time,
        class_name: sch.classes?.name,
        subject_name: sch.subjects?.name,
        teacher_name: sch.subjects?.teachers?.name,
        room_name: sch.rooms?.name
      }))
    );
  };

  const checkCollisions = (newSchedule: any, excludeId?: string) => {
    const conflicts = schedules.filter((s) => {
      if (excludeId && s.id === excludeId) return false;
      
      const sameDay = s.day_of_week === newSchedule.day_of_week;
      const sameTime = s.start_time === newSchedule.start_time;

      if (!sameDay || !sameTime) return false;

      // Check teacher conflict
      const newSubject = subjects.find((sub) => sub.id === newSchedule.subject_id);
      const existingSubject = subjects.find((sub) => sub.id === s.subject_id);
      if (newSubject?.teacher_id === existingSubject?.teacher_id) {
        return true;
      }

      // Check room conflict
      if (s.room_id === newSchedule.room_id) {
        return true;
      }

      return false;
    });

    return conflicts;
  };

  const handleSubmit = async () => {
    if (!form.class_id || !form.subject_id || !form.room_id) {
      alert("Бүх талбарыг бөглөнө үү!");
      return;
    }

    const conflicts = checkCollisions(form, editingId || undefined);

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      if (conflict.teacher_name) {
        alert(`Давхардал: ${conflict.teacher_name} багш энэ цагт өөр ангид хичээл орж байна!`);
      } else if (conflict.room_name) {
        alert(`Давхардал: ${conflict.room_name} кабинет энэ цагт ашиглагдаж байна!`);
      }
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("schedules")
        .update(form)
        .eq("id", editingId);

      if (error) {
        alert(error.message);
      } else {
        alert("Хуваарь амжилттай шинэчлэгдлээ!");
        setEditingId(null);
        setForm({
          class_id: "",
          subject_id: "",
          room_id: "",
          day_of_week: 1,
          start_time: "08:00",
          end_time: "09:00"
        });
        fetchAll();
      }
    } else {
      const { error } = await supabase.from("schedules").insert([form]);

      if (error) {
        alert(error.message);
      } else {
        alert("Хуваарь амжилттай нэмэгдлээ!");
        setForm({
          class_id: "",
          subject_id: "",
          room_id: "",
          day_of_week: 1,
          start_time: "08:00",
          end_time: "09:00"
        });
        fetchAll();
      }
    }
  };

  const handleEdit = (sched: ScheduleItem) => {
    setEditingId(sched.id);
    setForm({
      class_id: sched.class_id,
      subject_id: sched.subject_id,
      room_id: sched.room_id,
      day_of_week: sched.day_of_week,
      start_time: sched.start_time,
      end_time: sched.end_time
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ хуваарийг устгах уу?")) return;

    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      alert("Хуваарь амжилттай устгагдлаа!");
      fetchAll();
    }
  };

  const dayNames = ["", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан"];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Хуваарь</h2>

      <div style={{ marginBottom: 30, padding: 20, backgroundColor: "#f5f5f5", borderRadius: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Анги:</label>
            <select
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd" }}
            >
              <option value="">Анги сонгох</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Хичээл:</label>
            <select
              value={form.subject_id}
              onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd" }}
            >
              <option value="">Хичээл сонгох</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.teachers?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Кабинет:</label>
            <select
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd" }}
            >
              <option value="">Кабинет сонгох</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Өдөр:</label>
            <select
              value={form.day_of_week}
              onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd" }}
            >
              {[1, 2, 3, 4, 5].map((day) => (
                <option key={day} value={day}>
                  {dayNames[day]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Эхлэх цаг:</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Дуусах цаг:</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd" }}
            />
          </div>
        </div>

        {editingId ? (
          <div>
            <UpdateButton onClick={handleSubmit} />
            <button
              onClick={() => {
                setEditingId(null);
                setForm({
                  class_id: "",
                  subject_id: "",
                  room_id: "",
                  day_of_week: 1,
                  start_time: "08:00",
                  end_time: "09:00"
                });
              }}
              style={{
                padding: "10px 16px",
                backgroundColor: "#999",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              Цуцлах
            </button>
          </div>
        ) : (
          <CreateButton onClick={handleSubmit} />
        )}
      </div>

      <table
        border={1}
        cellPadding={8}
        style={{ borderCollapse: "collapse", width: "100%", backgroundColor: "white" }}
      >
        <thead style={{ backgroundColor: "#2196F3", color: "white" }}>
          <tr>
            <th>Өдөр</th>
            <th>Цаг</th>
            <th>Анги</th>
            <th>Хичээл</th>
            <th>Багш</th>
            <th>Кабинет</th>
            <th>Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {schedules
            .sort((a, b) => {
              if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
              return a.start_time.localeCompare(b.start_time);
            })
            .map((s) => (
              <tr key={s.id}>
                <td>{dayNames[s.day_of_week]}</td>
                <td>
                  {s.start_time} - {s.end_time}
                </td>
                <td>{s.class_name}</td>
                <td>{s.subject_name}</td>
                <td>{s.teacher_name}</td>
                <td>{s.room_name}</td>
                <td>
                  <EditButton onClick={() => handleEdit(s)} />
                  <DeleteButton onClick={() => handleDelete(s.id)} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
