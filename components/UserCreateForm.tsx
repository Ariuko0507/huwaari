import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Role = "student" | "teacher" | "admin";
type ClassItem = { id: string; name: string };

export default function UserCreateForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from("classes").select("id,name").order("name", { ascending: true });
      setClasses((data || []) as ClassItem[]);
    };

    void fetchClasses();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      alert("И-мэйл болон нууц үг оруулна уу.");
      return;
    }
    if (role === "student" && !classId) {
      alert("Сурагчийн ангийг сонгоно уу.");
      return;
    }

    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      alert("Таны session дууссан байна. Дахин нэвтэрнэ үү.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        role,
        name: role === "teacher" ? name.trim() : undefined,
        classId: role === "student" ? classId : null,
      }),
    });

    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      alert(data.message || "Хэрэглэгч үүсгэхэд алдаа гарлаа.");
      setLoading(false);
      return;
    }

    alert("Хэрэглэгч амжилттай нэмэгдлээ.");
    setEmail("");
    setPassword("");
    setName("");
    setClassId("");
    setLoading(false);
    window.dispatchEvent(new Event("admin:data-updated"));
  };

  return (
    <div className="admin-form">
      <h2 className="admin-form-title">Сурагч / Багш / Админ нэмэх</h2>

      <label className="admin-field">
        <span className="admin-label">Role</span>
        <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <label className="admin-field">
        <span className="admin-label">И-мэйл</span>
        <input
          className="admin-input"
          type="email"
          placeholder="name@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="admin-field">
        <span className="admin-label">Нууц үг</span>
        <input
          className="admin-input"
          type="password"
          placeholder="Хамгийн багадаа 6 тэмдэгт"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {role === "teacher" && (
        <label className="admin-field">
          <span className="admin-label">Багшийн нэр</span>
          <input
            className="admin-input"
            type="text"
            placeholder="Жишээ: Б. Наран"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      )}

      {role === "student" && (
        <label className="admin-field">
          <span className="admin-label">Анги</span>
          <select className="admin-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Анги сонгох</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex gap-2">
        <button className="admin-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Нэмж байна..." : "Хэрэглэгч нэмэх"}
        </button>
      </div>
    </div>
  );
}
