import { useEffect, useMemo, useState } from "react";
import EditableScheduleMatrix from "./EditableScheduleMatrix";
import { supabase } from "../lib/supabaseClient";

type ClassItem = { id: string; name: string };
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

type CellPayload = {
  id?: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: string;
  room_id: string;
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
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const fetchAll = async () => {
    const [classRes, subjectRes, roomRes, scheduleRes] = await Promise.all([
      supabase.from("classes").select("id,name").order("name", { ascending: true }),
      supabase.from("subjects").select("id,name,teacher_id").order("name", { ascending: true }),
      supabase.from("rooms").select("id,name").order("name", { ascending: true }),
      supabase
        .from("schedules")
        .select("id,class_id,subject_id,room_id,day_of_week,start_time,end_time,classes(name),subjects(name,teacher_id,teachers(name)),rooms(name)")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

    setClasses((classRes.data || []) as ClassItem[]);
    setSubjects((subjectRes.data || []) as SubjectItem[]);
    setRooms((roomRes.data || []) as RoomItem[]);

    const mapped: ScheduleItem[] = ((scheduleRes.data || []) as Array<Record<string, unknown>>).map((row) => {
      const cls = firstRelation<{ name: string }>(row.classes as { name: string } | { name: string }[] | null);
      const sub = firstRelation<{ name: string; teacher_id: string | null; teachers?: { name?: string } | { name?: string }[] | null }>(
        row.subjects as
          | { name: string; teacher_id: string | null; teachers?: { name?: string } | { name?: string }[] | null }
          | { name: string; teacher_id: string | null; teachers?: { name?: string } | { name?: string }[] | null }[]
          | null
      );
      const room = firstRelation<{ name: string }>(row.rooms as { name: string } | { name: string }[] | null);
      const teacher = firstRelation<{ name?: string }>(sub?.teachers as { name?: string } | { name?: string }[] | null | undefined);

      return {
        id: String(row.id),
        class_id: String(row.class_id),
        subject_id: String(row.subject_id),
        room_id: String(row.room_id),
        day_of_week: Number(row.day_of_week),
        start_time: String(row.start_time).slice(0, 5),
        end_time: String(row.end_time).slice(0, 5),
        class_name: cls?.name || "-",
        subject_name: sub?.name || "-",
        room_name: room?.name || "-",
        teacher_name: teacher?.name || "-",
        teacher_id: sub?.teacher_id || null,
      };
    });

    setSchedules(mapped);
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const subjectById = useMemo(() => {
    const map = new Map<string, SubjectItem>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const checkCollisions = (candidate: CellPayload): string[] => {
    const selectedSubject = subjectById.get(candidate.subject_id);
    const selectedTeacherId = selectedSubject?.teacher_id || null;

    const conflicts: string[] = [];
    schedules.forEach((s) => {
      if (candidate.id && s.id === candidate.id) return;
      if (s.day_of_week !== candidate.day_of_week) return;
      if (!overlaps(candidate.start_time, candidate.end_time, s.start_time, s.end_time)) return;

      if (s.class_id === candidate.class_id) conflicts.push("Ижил өдөр, цаг дээр энэ анги давхцаж байна.");
      if (s.room_id === candidate.room_id) conflicts.push("Ижил өдөр, цаг дээр энэ кабинет давхцаж байна.");
      if (selectedTeacherId && s.teacher_id && selectedTeacherId === s.teacher_id) {
        conflicts.push("Ижил өдөр, цаг дээр энэ багшийн хичээл давхцаж байна.");
      }
    });

    return Array.from(new Set(conflicts));
  };

  const upsertCell = async (payload: CellPayload) => {
    const collisions = checkCollisions(payload);
    if (collisions.length > 0) {
      alert(collisions[0]);
      return;
    }

    const result = payload.id
      ? await supabase
          .from("schedules")
          .update({
            class_id: payload.class_id,
            subject_id: payload.subject_id,
            room_id: payload.room_id,
            day_of_week: payload.day_of_week,
            start_time: payload.start_time,
            end_time: payload.end_time,
          })
          .eq("id", payload.id)
      : await supabase.from("schedules").insert([
          {
            class_id: payload.class_id,
            subject_id: payload.subject_id,
            room_id: payload.room_id,
            day_of_week: payload.day_of_week,
            start_time: payload.start_time,
            end_time: payload.end_time,
          },
        ]);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    await fetchAll();
  };

  const deleteCell = async (id: string) => {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }

    await fetchAll();
  };

  return (
    <div className="admin-form">
      <h2 className="admin-form-title">Хуваарь (editable table)</h2>
      <EditableScheduleMatrix
        classes={classes}
        subjects={subjects}
        rooms={rooms}
        schedules={schedules}
        onUpsertCell={upsertCell}
        onDeleteCell={deleteCell}
      />
    </div>
  );
}
