import { useMemo } from "react";

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

type Props = {
  classes: ClassItem[];
  schedules: ScheduleItem[];
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

export default function ScheduleMatrixView({ classes, schedules }: Props) {
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    schedules.forEach((s) => {
      const key = `${s.day_of_week}|${s.start_time.slice(0, 5)}|${s.class_id}`;
      map.set(key, s);
    });
    return map;
  }, [schedules]);

  return (
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
                    <td key={`${key}-cell`} className="schedule-board-cell schedule-board-cell-excel">
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
  );
}
