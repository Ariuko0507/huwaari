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
      <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-xl items-center justify-center p-2">
        <div className="admin-card w-full border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Huwaari</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Нэвтрэх</h1>
          <p className="mt-2 text-sm text-slate-600">Системд нэвтэрч өөрийн хуудсанд орно уу.</p>

          <div className="mt-6 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

          <form
            className="mt-6 admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <label className="admin-field">
              <span className="admin-label">И-мэйл</span>
              <input
                className="admin-input"
                type="email"
                placeholder="name@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </label>

            <button className="admin-submit mt-2 w-full justify-center py-3 text-sm" type="submit" disabled={loading}>
              {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
