import { useMemo, useState } from "react";

type ClassItem = { id: string; name: string };
type SubjectItem = { id: string; name: string };
type RoomItem = { id: string; name: string };

type ScheduleItem = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: string;
  room_id: string;
  subject_name: string;
  room_name: string;
  teacher_name: string;
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

type Props = {
  classes: ClassItem[];
  subjects: SubjectItem[];
  rooms: RoomItem[];
  schedules: ScheduleItem[];
  onUpsertCell: (payload: CellPayload) => Promise<void>;
  onDeleteCell: (id: string) => Promise<void>;
};

type SelectedCell = {
  classId: string;
  className: string;
  day: number;
  start: string;
  end: string;
  schedule?: ScheduleItem;
};

const dayNames: Record<number, string> = {
  1: "1 дэх",
  2: "2 дахь",
  3: "3 дахь",
  4: "4 дэх",
  5: "5 дахь",
};

const periods = [
  { start: "08:00", end: "09:20", label: "8:00:00 AM" },
  { start: "09:25", end: "10:45", label: "9:25:00 AM" },
  { start: "10:50", end: "12:10", label: "10:50:00 AM" },
  { start: "12:10", end: "13:30", label: "12:10:00 AM" },
];

export default function EditableScheduleMatrix({
  classes,
  subjects,
  rooms,
  schedules,
  onUpsertCell,
  onDeleteCell,
}: Props) {
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [saving, setSaving] = useState(false);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    schedules.forEach((s) => {
      const key = `${s.day_of_week}|${s.start_time.slice(0, 5)}|${s.class_id}`;
      map.set(key, s);
    });
    return map;
  }, [schedules]);

  const pickCell = (day: number, start: string, end: string, classId: string, className: string) => {
    const key = `${day}|${start}|${classId}`;
    const existing = scheduleMap.get(key);
    setSelected({ day, start, end, classId, className, schedule: existing });
    setSubjectId(existing?.subject_id || "");
    setRoomId(existing?.room_id || "");
  };

  const handleSave = async () => {
    if (!selected) {
      alert("Эхлээд хүснэгтээс нүд сонгоно уу.");
      return;
    }
    if (!subjectId || !roomId) {
      alert("Хичээл болон кабинет сонгоно уу.");
      return;
    }

    setSaving(true);
    await onUpsertCell({
      id: selected.schedule?.id,
      class_id: selected.classId,
      day_of_week: selected.day,
      start_time: selected.start,
      end_time: selected.end,
      subject_id: subjectId,
      room_id: roomId,
    });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected?.schedule?.id) return;
    if (!confirm("Энэ slot-оос хуваарь устгах уу?")) return;

    setSaving(true);
    await onDeleteCell(selected.schedule.id);
    setSaving(false);
    setSubjectId("");
    setRoomId("");
  };

  return (
    <div className="admin-form">
      <div className="schedule-board-wrap schedule-board-wrap-excel">
        <table className="schedule-board-table schedule-board-table-excel">
          <thead>
            <tr>
              <th className="schedule-board-head schedule-board-head-excel">Цаг</th>
              {classes.map((c) => (
                <th key={c.id} className="schedule-board-head schedule-board-head-excel">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].flatMap((day) => [
              <tr key={`d-${day}`}>
                <td className="schedule-board-day schedule-board-day-excel" colSpan={classes.length + 1}>
                  {dayNames[day]} өдөр
                </td>
              </tr>,
              ...periods.map((p) => (
                <tr key={`${day}-${p.start}`}>
                  <td className="schedule-board-time schedule-board-time-excel">{p.label}</td>
                  {classes.map((c) => {
                    const key = `${day}|${p.start}|${c.id}`;
                    const cell = scheduleMap.get(key);
                    return (
                      <td
                        key={`${key}-cell`}
                        className={`schedule-board-cell schedule-board-cell-excel ${
                          selected && selected.day === day && selected.start === p.start && selected.classId === c.id
                            ? "ring-2 ring-green-500"
                            : ""
                        }`}
                        onClick={() => pickCell(day, p.start, p.end, c.id, c.name)}
                        style={{ cursor: "pointer" }}
                      >
                        {cell ? (
                          <div className="schedule-board-content">
                            <div className="schedule-board-subject">{cell.subject_name}</div>
                            <div className="schedule-board-meta">{cell.teacher_name}</div>
                            <div className="schedule-board-meta">{cell.room_name}</div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    );
                  })}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <p className="text-sm font-semibold text-gray-800">
          {selected
            ? `Засварлах: ${dayNames[selected.day]} өдөр, ${selected.start} - ${selected.end}, ${selected.className}`
            : "Нэмэх / засварлахын тулд хүснэгтийн нэг нүд сонгоно уу."}
        </p>

        <div className="grid gap-3 md:grid-cols-2 mt-3">
          <label className="admin-field">
            <span className="admin-label">Хичээл</span>
            <select
              className="admin-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={saving}
            >
              <option value="">Сонгох</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-label">Кабинет</span>
            <select
              className="admin-select"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={saving}
            >
              <option value="">Сонгох</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-2 mt-3">
          <button className="admin-submit" onClick={handleSave} disabled={saving || !selected}>
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
          {selected?.schedule ? (
            <button className="admin-action-btn danger" onClick={handleDelete} disabled={saving}>
              Устгах
            </button>
          ) : null}
          <button className="admin-action-btn" onClick={() => setSelected(null)} disabled={saving || !selected}>
            Болих
          </button>
        </div>
      </div>
    </div>
  );
}
