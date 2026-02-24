import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type ClassItem = { id: string; name: string };
type TeacherItem = { id: string; name: string };
type SubjectItem = { id: string; name: string; teacher_id: string | null };
type RoomItem = { id: string; name: string };

type ScheduleItem = {
  id: string;
  class_id: string;
  subject_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_name: string;
  teacher_name: string;
  teacher_id: string | null;
};

type FormState = {
  class_id: string;
  teacher_id: string;
  subject_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const dayNames: Record<number, string> = {
  1: "Даваа",
  2: "Мягмар",
  3: "Лхагва",
  4: "Пүрэв",
  5: "Баасан",
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

export default function ScheduleGrid() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    class_id: "",
    teacher_id: "",
    subject_id: "",
    room_id: "",
    day_of_week: 1,
    start_time: "08:00",
    end_time: "09:00",
  });

  const fetchAll = async () => {
    const [classRes, teacherRes, subjectRes, roomRes, scheduleRes] = await Promise.all([
      supabase.from("classes").select("id,name").order("name", { ascending: true }),
      supabase.from("teachers").select("id,name").order("name", { ascending: true }),
      supabase.from("subjects").select("id,name,teacher_id").order("name", { ascending: true }),
      supabase.from("rooms").select("id,name").order("name", { ascending: true }),
      supabase
        .from("schedules")
        .select("id,class_id,subject_id,room_id,day_of_week,start_time,end_time,classes(name),subjects(name,teacher_id,teachers(name)),rooms(name)")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

    setClasses((classRes.data || []) as ClassItem[]);
    setTeachers((teacherRes.data || []) as TeacherItem[]);
    setSubjects((subjectRes.data || []) as SubjectItem[]);
    setRooms((roomRes.data || []) as RoomItem[]);

    const mapped: ScheduleItem[] = ((scheduleRes.data || []) as Array<Record<string, unknown>>).map((row) => {
      const cls = firstRelation<{ name: string }>(row.classes as { name: string } | { name: string }[] | null);
      const sub = firstRelation<{ name: string; teacher_id: string | null; teachers?: { name: string } | { name: string }[] | null }>(
        row.subjects as { name: string; teacher_id: string | null; teachers?: { name: string } | { name: string }[] | null } | { name: string; teacher_id: string | null; teachers?: { name: string } | { name: string }[] | null }[] | null
      );
      const room = firstRelation<{ name: string }>(row.rooms as { name: string } | { name: string }[] | null);
      const teacherRel = firstRelation<{ name: string }>(sub?.teachers as { name: string } | { name: string }[] | null | undefined);

      return {
        id: String(row.id),
        class_id: String(row.class_id),
        subject_id: String(row.subject_id),
        room_id: String(row.room_id),
        day_of_week: Number(row.day_of_week),
        start_time: String(row.start_time),
        end_time: String(row.end_time),
        class_name: cls?.name || "-",
        subject_name: sub?.name || "-",
        room_name: room?.name || "-",
        teacher_name: teacherRel?.name || "-",
        teacher_id: sub?.teacher_id || null,
      };
    });

    setSchedules(mapped);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!form.teacher_id) return subjects;
    return subjects.filter((s) => s.teacher_id === form.teacher_id);
  }, [subjects, form.teacher_id]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const checkCollisions = (): string[] => {
    const selectedSubject = subjects.find((s) => s.id === form.subject_id);
    const selectedTeacherId = selectedSubject?.teacher_id || null;

    const collisions: string[] = [];

    schedules.forEach((s) => {
      if (editingId && s.id === editingId) return;
      if (s.day_of_week !== form.day_of_week) return;
      if (!overlaps(form.start_time, form.end_time, s.start_time, s.end_time)) return;

      if (s.class_id === form.class_id) {
        collisions.push("Ижил өдөр, цаг дээр энэ анги давхцаж байна.");
      }
      if (s.room_id === form.room_id) {
        collisions.push("Ижил өдөр, цаг дээр энэ кабинет давхцаж байна.");
      }
      if (selectedTeacherId && s.teacher_id && selectedTeacherId === s.teacher_id) {
        collisions.push("Ижил өдөр, цаг дээр энэ багшийн хичээл давхцаж байна.");
      }
    });

    return Array.from(new Set(collisions));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      class_id: "",
      teacher_id: "",
      subject_id: "",
      room_id: "",
      day_of_week: 1,
      start_time: "08:00",
      end_time: "09:00",
    });
  };

  const handleSubmit = async () => {
    if (!form.class_id || !form.teacher_id || !form.subject_id || !form.room_id) {
      alert("Анги, багш, хичээл, кабинет бүгдийг сонгоно уу.");
      return;
    }

    if (form.end_time <= form.start_time) {
      alert("Дуусах цаг эхлэх цагаас хойш байх ёстой.");
      return;
    }

    const collisions = checkCollisions();
    if (collisions.length > 0) {
      alert(collisions[0]);
      return;
    }

    const payload = {
      class_id: form.class_id,
      subject_id: form.subject_id,
      room_id: form.room_id,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
    };

    const result = editingId
      ? await supabase.from("schedules").update(payload).eq("id", editingId)
      : await supabase.from("schedules").insert([payload]);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    resetForm();
    await fetchAll();
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setForm({
      class_id: item.class_id,
      teacher_id: item.teacher_id || "",
      subject_id: item.subject_id,
      room_id: item.room_id,
      day_of_week: item.day_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ хуваарийг устгах уу?")) return;

    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) return alert(error.message);

    if (editingId === id) resetForm();
    await fetchAll();
  };

  return (
    <div className="admin-form">
      <h2 className="admin-form-title">Хуваарь үүсгэх</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="admin-field">
          <span className="admin-label">Анги</span>
          <select className="admin-select" value={form.class_id} onChange={(e) => setField("class_id", e.target.value)}>
            <option value="">Анги сонгох</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">Багш</span>
          <select
            className="admin-select"
            value={form.teacher_id}
            onChange={(e) => {
              const nextTeacher = e.target.value;
              setForm((prev) => ({ ...prev, teacher_id: nextTeacher, subject_id: "" }));
            }}
          >
            <option value="">Багш сонгох</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">Хичээл</span>
          <select className="admin-select" value={form.subject_id} onChange={(e) => setField("subject_id", e.target.value)}>
            <option value="">Хичээл сонгох</option>
            {filteredSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">Кабинет</span>
          <select className="admin-select" value={form.room_id} onChange={(e) => setField("room_id", e.target.value)}>
            <option value="">Кабинет сонгох</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">Өдөр</span>
          <select className="admin-select" value={form.day_of_week} onChange={(e) => setField("day_of_week", Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>{dayNames[d]}</option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">Эхлэх цаг</span>
          <input className="admin-input" type="time" value={form.start_time} onChange={(e) => setField("start_time", e.target.value)} />
        </label>

        <label className="admin-field">
          <span className="admin-label">Дуусах цаг</span>
          <input className="admin-input" type="time" value={form.end_time} onChange={(e) => setField("end_time", e.target.value)} />
        </label>
      </div>

      <div className="flex gap-2">
        <button className="admin-submit" onClick={handleSubmit}>{editingId ? "Шинэчлэх" : "Create"}</button>
        {editingId && <button className="admin-action-btn" onClick={resetForm}>Болих</button>}
      </div>

      <div className="admin-list-wrap">
        <p className="admin-list-title">Үүсгэсэн хуваариуд</p>
        {schedules.length === 0 ? (
          <p className="admin-empty">Хуваарь байхгүй байна.</p>
        ) : (
          <div className="admin-grid-wrap">
            <table className="admin-grid-table">
              <thead>
                <tr>
                  <th className="admin-grid-head">Өдөр</th>
                  <th className="admin-grid-head">Цаг</th>
                  <th className="admin-grid-head">Анги</th>
                  <th className="admin-grid-head">Багш</th>
                  <th className="admin-grid-head">Хичээл</th>
                  <th className="admin-grid-head">Кабинет</th>
                  <th className="admin-grid-head">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className="admin-grid-cell">{dayNames[s.day_of_week]}</td>
                    <td className="admin-grid-cell">{s.start_time} - {s.end_time}</td>
                    <td className="admin-grid-cell">{s.class_name}</td>
                    <td className="admin-grid-cell">{s.teacher_name}</td>
                    <td className="admin-grid-cell">{s.subject_name}</td>
                    <td className="admin-grid-cell">{s.room_name}</td>
                    <td className="admin-grid-cell">
                      <span className="admin-row-actions">
                        <button className="admin-action-btn" onClick={() => handleEdit(s)}>Edit</button>
                        <button className="admin-action-btn danger" onClick={() => handleDelete(s.id)}>Delete</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}