import { useMemo } from "react";

type Item = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_name: string;
};

type Props = {
  items: Item[];
};

const DAYS = [1, 2, 3, 4, 5];

const DAY_LABEL: Record<number, string> = {
  1: "1 дэх",
  2: "2 дахь",
  3: "3 дахь",
  4: "4 дахь",
  5: "5 дахь",
};

const TIME_SLOTS = [
  { start: "08:00", end: "09:25" },
  { start: "09:25", end: "10:50" },
  { start: "10:50", end: "12:10" },
  { start: "12:10", end: "13:35" },
];

export default function WeeklyScheduleBoard({ items }: Props) {
  const lessonMap = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((i) => {
      const key = `${i.day_of_week}|${i.start_time.slice(0, 5)}`;
      const list = map.get(key) || [];
      list.push(i);
      map.set(key, list);
    });
    return map;
  }, [items]);

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-2 w-28">Цаг</th>
            {DAYS.map((day) => (
              <th key={day} className="border p-2">
                {DAY_LABEL[day]}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot.start}>
              <td className="border p-2 font-medium">
                {slot.start} - {slot.end}
              </td>

              {DAYS.map((day) => {
                const lessons = lessonMap.get(`${day}|${slot.start}`) || [];

                return (
                  <td key={day} className="border p-2 align-top">
                    {lessons.length > 0 ? (
                      <div className="space-y-2">
                        {lessons.map((lesson) => (
                          <div key={lesson.id} className="rounded border border-slate-200 p-2">
                            <div className="font-semibold">{lesson.subject_name}</div>
                            <div className="text-xs text-gray-600">{lesson.class_name}</div>
                            <div className="text-xs text-gray-500">{lesson.room_name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-300 text-center">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
