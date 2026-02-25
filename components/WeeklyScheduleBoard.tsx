type WeeklyScheduleItem = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_name?: string;
  teacher_name?: string;
};

type Props = {
  items: WeeklyScheduleItem[];
  emptyText?: string;
  variant?: "default" | "excel";
};

const dayNames: Record<number, string> = {
  1: "1 дэх өдөр (Даваа)",
  2: "2 дахь өдөр (Мягмар)",
  3: "3 дахь өдөр (Лхагва)",
  4: "4 дэх өдөр (Пүрэв)",
  5: "5 дахь өдөр (Баасан)",
};

function sortTimes(a: string, b: string): number {
  return a.localeCompare(b);
}

function normalizeTime(raw: string): string {
  return raw.slice(0, 5);
}

function toAmPmLabel(time24: string): string {
  const [hRaw, mRaw] = time24.split(":");
  const hour = Number(hRaw);
  const minute = Number(mRaw);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, "0");
  return `${hour12}:${mm}:00 ${ampm}`;
}

export default function WeeklyScheduleBoard({ items, emptyText = "Хуваарь олдсонгүй.", variant = "default" }: Props) {
  if (items.length === 0) {
    return <p className="admin-empty">{emptyText}</p>;
  }

  const classNames = Array.from(new Set(items.map((x) => x.class_name))).sort((a, b) => a.localeCompare(b));
  const timeSlots =
    variant === "excel"
      ? Array.from(new Set(["08:00", "09:25", "10:50", "12:10", ...items.map((x) => normalizeTime(x.start_time))])).sort(sortTimes)
      : Array.from(new Set(items.map((x) => `${x.start_time}-${x.end_time}`)))
          .sort((a, b) => sortTimes(a, b))
          .map((key) => {
            const [start, end] = key.split("-");
            return { key, start, end };
          });

  const findCell = (day: number, className: string, timeKey: string): WeeklyScheduleItem | undefined => {
    const [start, end] = variant === "excel" ? [timeKey, ""] : timeKey.split("-");
    return items.find(
      (x) =>
        x.day_of_week === day &&
        x.class_name === className &&
        normalizeTime(x.start_time) === normalizeTime(start) &&
        (variant === "excel" || normalizeTime(x.end_time) === normalizeTime(end))
    );
  };

  return (
    <div className={variant === "excel" ? "schedule-board-wrap schedule-board-wrap-excel" : "schedule-board-wrap"}>
      <table className={variant === "excel" ? "schedule-board-table schedule-board-table-excel" : "schedule-board-table"}>
        <thead>
          <tr>
            <th className={variant === "excel" ? "schedule-board-head schedule-board-head-excel" : "schedule-board-head"}>Цаг</th>
            {classNames.map((name) => (
              <th key={name} className={variant === "excel" ? "schedule-board-head schedule-board-head-excel" : "schedule-board-head"}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].flatMap((day) => {
            const dayRows = timeSlots.map((slot) => (
              <tr key={`${day}-${typeof slot === "string" ? slot : slot.key}`}>
                <td className={variant === "excel" ? "schedule-board-time schedule-board-time-excel" : "schedule-board-time"}>
                  {variant === "excel" ? toAmPmLabel(slot as string) : `${(slot as { start: string; end: string }).start} - ${(slot as { start: string; end: string }).end}`}
                </td>
                {classNames.map((className) => {
                  const key = typeof slot === "string" ? slot : slot.key;
                  const cell = findCell(day, className, key);
                  return (
                    <td key={`${day}-${key}-${className}`} className={variant === "excel" ? "schedule-board-cell schedule-board-cell-excel" : "schedule-board-cell"}>
                      {cell ? (
                        <div className="schedule-board-content">
                          <div className="schedule-board-subject">{cell.subject_name}</div>
                          {cell.room_name ? <div className="schedule-board-meta">{cell.room_name}</div> : null}
                          {cell.teacher_name ? <div className="schedule-board-meta">{cell.teacher_name}</div> : null}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  );
                })}
              </tr>
            ));

            return [
              <tr key={`day-${day}`}>
                <td className={variant === "excel" ? "schedule-board-day schedule-board-day-excel" : "schedule-board-day"} colSpan={classNames.length + 1}>
                  {dayNames[day]}
                </td>
              </tr>,
              ...dayRows,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
