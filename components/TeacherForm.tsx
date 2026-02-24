import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type TeacherItem = { id: string; name: string; email: string };

export default function TeacherForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from("teachers").select("id,name,email").order("name", { ascending: true });
    if (!error) setItems(data || []);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleSubmit = async () => {
    const { error } = editingId
      ? await supabase.from("teachers").update({ name, email }).eq("id", editingId)
      : await supabase.from("teachers").insert([{ name, email }]);

    if (error) return alert(error.message);

    setName("");
    setEmail("");
    setEditingId(null);
    await fetchTeachers();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  const handleEdit = (item: TeacherItem) => {
    setEditingId(item.id);
    setName(item.name);
    setEmail(item.email);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ багшийг устгах уу?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) return alert(error.message);

    if (editingId === id) {
      setEditingId(null);
      setName("");
      setEmail("");
    }

    await fetchTeachers();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  return (
    <div className="admin-form">
      <h2 className="admin-form-title">Багш нэмэх</h2>
      <label className="admin-field">
        <span className="admin-label">Багшийн нэр</span>
        <input className="admin-input" type="text" placeholder="Багшийн нэр оруулна уу" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="admin-field">
        <span className="admin-label">И-мэйл</span>
        <input className="admin-input" type="email" placeholder="name@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <div className="flex gap-2">
        <button className="admin-submit" onClick={handleSubmit}>{editingId ? "Шинэчлэх" : "Хадгалах"}</button>
        {editingId && (
          <button className="admin-action-btn" onClick={() => { setEditingId(null); setName(""); setEmail(""); }}>
            Болих
          </button>
        )}
      </div>

      <div className="admin-list-wrap">
        <p className="admin-list-title">Бүртгэсэн багш нар</p>
        {items.length === 0 ? <p className="admin-empty">Багш байхгүй байна.</p> : (
          <ul className="admin-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>{item.email}</span>
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