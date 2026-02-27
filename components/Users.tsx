import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import UpdateButton from "./buttons/UpdateButton";

type User = {
  id: string;
  email: string;
  role?: string;
  class_name?: string;
};

type UserRow = {
  id: string;
  email: string;
  role?: string;
  classes?: Array<{ name: string }> | null;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("id, email, role, classes(name)");

    if (error) {
      alert("Users fetch failed: " + error.message);
      setLoading(false);
      return;
    }

    const mapped = ((data || []) as UserRow[]).map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      class_name: u.classes?.[0]?.name || "-",
    }));

    setUsers(mapped);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, []);

  const updateRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("users").update({ role }).eq("id", userId);

    if (error) {
      alert("Role update failed: " + error.message);
    } else {
      alert(`Эрх амжилттай солигдлоо: ${role}`);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
    }
  };

  if (loading) return <div>Уншиж байна...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Хэрэглэгчид</h2>

      <table border={1} cellPadding={10} style={{ borderCollapse: "collapse", width: "100%", backgroundColor: "white" }}>
        <thead style={{ backgroundColor: "#2196F3", color: "white" }}>
          <tr>
            <th>Имэйл</th>
            <th>Эрх</th>
            <th>Анги</th>
            <th>Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    backgroundColor: u.role === "admin" ? "#f44336" : u.role === "teacher" ? "#2196F3" : "#4CAF50",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {u.role || "none"}
                </span>
              </td>
              <td>{u.role === "student" ? u.class_name : "-"}</td>
              <td>
                <UpdateButton onClick={() => updateRole(u.id, "admin")} label="Admin" />
                <UpdateButton onClick={() => updateRole(u.id, "teacher")} label="Багш" />
                <UpdateButton onClick={() => updateRole(u.id, "student")} label="Сурагч" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
