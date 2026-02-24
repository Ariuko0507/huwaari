import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Teacher = { id: string; name: string };
type SubjectItem = { id: string; name: string; teacher_id?: string | null; teachers: Array<{ name: string }> | null };

export default function SubjectForm() {
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [items, setItems] = useState<SubjectItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTeachers = async () => {
    const { data } = await supabase.from("teachers").select("id,name").order("name", { ascending: true });
    setTeachers(data || []);
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id,name,teacher_id,teachers(name)")
      .order("name", { ascending: true });
    if (!error) setItems((data as SubjectItem[]) || []);
  };

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const handleSubmit = async () => {
    const payload = { name, teacher_id: teacherId || null };
    const { error } = editingId
      ? await supabase.from("subjects").update(payload).eq("id", editingId)
      : await supabase.from("subjects").insert([payload]);

    if (error) return alert(error.message);

    setName("");
    setTeacherId("");
    setEditingId(null);
    await fetchSubjects();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  const handleEdit = (item: SubjectItem) => {
    setEditingId(item.id);
    setName(item.name);
    setTeacherId(item.teacher_id || "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ хичээлийг устгах уу?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return alert(error.message);

    if (editingId === id) {
      setEditingId(null);
      setName("");
      setTeacherId("");
    }

    await fetchSubjects();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  return (
    <div className="admin-form">
      <h2 className="admin-form-title">Хичээл нэмэх</h2>
      <label className="admin-field">
        <span className="admin-label">Хичээлийн нэр</span>
        <input className="admin-input" type="text" placeholder="Хичээлийн нэр оруулна уу" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="admin-field">
        <span className="admin-label">Хариуцсан багш</span>
        <select className="admin-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="">Багш сонгох</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <button className="admin-submit" onClick={handleSubmit}>{editingId ? "Шинэчлэх" : "Хадгалах"}</button>
        {editingId && (
          <button className="admin-action-btn" onClick={() => { setEditingId(null); setName(""); setTeacherId(""); }}>
            Болих
          </button>
        )}
      </div>

      <div className="admin-list-wrap">
        <p className="admin-list-title">Бүртгэсэн хичээлүүд</p>
        {items.length === 0 ? <p className="admin-empty">Хичээл байхгүй байна.</p> : (
          <ul className="admin-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>{item.teachers?.[0]?.name || "Багшгүй"}</span>
                <span className="admin-row-actions">
                  <button className="admin-action-btn" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="admin-action-btn danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}