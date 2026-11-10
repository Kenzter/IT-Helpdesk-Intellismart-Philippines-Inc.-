import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api, { errorMessage, type User } from "../api/client";
import { useAuth } from "../App";
import AuthShell from "../components/AuthShell";

// Staff login only (IT admins and IT assistants). Employees use /new-ticket and need no account.
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ access_token: string; user: User }>("/auth/login", { email, password });
      login(data.access_token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Incorrect email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="mb-1 text-2xl font-bold text-brand">Welcome back</h2>
      <p className="mb-5 text-sm text-slate-700">IT Admins and IT Assistants sign in here.</p>
      <form onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" required
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" maxLength={72} className="input" required autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Please wait..." : "Sign in"}</button>
      </form>
    </AuthShell>
  );
}
