import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("И-мэйл болон нууц үгээ оруулна уу.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      alert("Нэвтэрсэн хэрэглэгч олдсонгүй.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "teacher") router.push("/teacher");
    else if (profile?.role === "student") router.push("/student");
    else router.push("/admin");
  };

  return (
    <div className="admin-page-bg">
      <div className="admin-shell max-w-xl">
        <div className="p-8">
          <div className="admin-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Huwaari</p>
            <h1 className="mt-1 text-2xl font-bold text-black">Нэвтрэх</h1>
            <p className="mt-1 text-sm text-black">Системд нэвтэрч өөрийн хуудас руу орно уу.</p>

            <div className="mt-6 admin-form">
              <label className="admin-field">
                <span className="admin-label">И-мэйл</span>
                <input
                  className="admin-input"
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
                  placeholder="Нууц үгээ оруулна уу"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                />
              </label>

              <button className="admin-submit" onClick={handleLogin} disabled={loading}>
                {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
