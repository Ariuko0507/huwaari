import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type ClassItem = { id: string; name: string; grade_level: number };

export default function ClassForm() {
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState(0);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchClasses = async () => {
    const { data, error } = await supabase.from("classes").select("id,name,grade_level").order("name", { ascending: true });
    if (!error) setItems(data || []);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async () => {
    const { error } = editingId
      ? await supabase.from("classes").update({ name, grade_level: gradeLevel }).eq("id", editingId)
      : await supabase.from("classes").insert([{ name, grade_level: gradeLevel }]);
    if (error) return alert(error.message);
    setName("");
    setGradeLevel(0);
    setEditingId(null);
    await fetchClasses();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  const handleEdit = (item: ClassItem) => {
    setEditingId(item.id);
    setName(item.name);
    setGradeLevel(item.grade_level);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ ангийг устгах уу?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) return alert(error.message);
    if (editingId === id) {
      setEditingId(null);
      setName("");
      setGradeLevel(0);
    }
    await fetchClasses();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  return (
    <div className="admin-form">
      <h2 className="admin-form-title">Анги нэмэх</h2>
      <label className="admin-field">
        <span className="admin-label">Ангийн нэр</span>
        <input className="admin-input" type="text" placeholder="Ангийн нэр оруулна уу" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="admin-field">
        <span className="admin-label">Ангийн түвшин</span>
        <input className="admin-input" type="number" placeholder="Түвшин оруулна уу" value={gradeLevel} onChange={(e) => setGradeLevel(Number(e.target.value))} />
      </label>
      <div className="flex gap-2">
        <button className="admin-submit" onClick={handleSubmit}>{editingId ? "Шинэчлэх" : "Хадгалах"}</button>
        {editingId && (
          <button className="admin-action-btn" onClick={() => { setEditingId(null); setName(""); setGradeLevel(0); }}>
            Болих
          </button>
        )}
      </div>
      <div className="admin-list-wrap">
        <p className="admin-list-title">Бүртгэсэн ангиуд</p>
        {items.length === 0 ? <p className="admin-empty">Анги байхгүй байна.</p> : (
          <ul className="admin-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>{item.grade_level}-р түвшин</span>
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
