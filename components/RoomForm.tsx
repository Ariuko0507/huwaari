import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type RoomItem = { id: string; name: string; capacity: number };

export default function RoomForm() {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [items, setItems] = useState<RoomItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchRooms = async () => {
    const { data, error } = await supabase.from("rooms").select("id,name,capacity").order("name", { ascending: true });
    if (!error) setItems(data || []);
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleSubmit = async () => {
    const { error } = editingId
      ? await supabase.from("rooms").update({ name, capacity }).eq("id", editingId)
      : await supabase.from("rooms").insert([{ name, capacity }]);

    if (error) return alert(error.message);

    setName("");
    setCapacity(0);
    setEditingId(null);
    await fetchRooms();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  const handleEdit = (item: RoomItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCapacity(item.capacity);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ кабинетыг устгах уу?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return alert(error.message);

    if (editingId === id) {
      setEditingId(null);
      setName("");
      setCapacity(0);
    }

    await fetchRooms();
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  return (
    <div className="admin-form">
      <h2 className="admin-form-title">Кабинет нэмэх</h2>
      <label className="admin-field">
        <span className="admin-label">Кабинетын нэр</span>
        <input className="admin-input" type="text" placeholder="Кабинетын нэр оруулна уу" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="admin-field">
        <span className="admin-label">Суудлын тоо</span>
        <input className="admin-input" type="number" placeholder="Суудлын тоо оруулна уу" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
      </label>

      <div className="flex gap-2">
        <button className="admin-submit" onClick={handleSubmit}>{editingId ? "Шинэчлэх" : "Хадгалах"}</button>
        {editingId && (
          <button className="admin-action-btn" onClick={() => { setEditingId(null); setName(""); setCapacity(0); }}>
            Болих
          </button>
        )}
      </div>

      <div className="admin-list-wrap">
        <p className="admin-list-title">Бүртгэсэн кабинетууд</p>
        {items.length === 0 ? <p className="admin-empty">Кабинет байхгүй байна.</p> : (
          <ul className="admin-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>{item.capacity} суудал</span>
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