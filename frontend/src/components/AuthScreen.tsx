import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../lib/AuthContext";

interface AuthScreenProps {
  error?: string | null;
  success?: string | null;
}

export function AuthScreen({ error: externalError, success: externalSuccess }: AuthScreenProps) {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(externalError ?? null);
  const [success, setSuccess] = useState<string | null>(externalSuccess ?? null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await login(form.email, form.password, remember);
      setSuccess(`Welcome back, ${user.name}.`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex min-h-screen items-center">
      <section className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#090b12]/80 shadow-none backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="relative min-h-[280px] overflow-hidden p-6 md:p-8 lg:min-h-[640px] lg:p-10"
          style={authHeroStyle}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/58 to-indigo-950/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-200">
                TechMinds Academy
              </span>
              <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
                Manage income, budgets and approvals in one place.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200/90 md:text-base">
                Simple staff login. Clean access. No confusion.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoPill title="Staff only" value="Secure access" />
              <InfoPill title="Fast login" value="Email + password" />
              <InfoPill title="Easy flow" value="Straight to work" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-8 lg:p-10">
          <section className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Login</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Enter your email and password to continue.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="label-text" htmlFor="login-email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    inputMode="email"
                    spellCheck={false}
                    className="input-field pl-11"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="label-text !mb-0" htmlFor="current-password">
                    Password
                  </label>
                  <span className="text-xs text-slate-500">Secure access</span>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="current-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="input-field pl-11 pr-14"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30"
                />
                Remember me
              </label>

              {error ? <StatusText tone="error" message={error} /> : null}
              {success ? <StatusText tone="success" message={success} /> : null}

              <button type="submit" className="primary-button w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatusText({ tone, message }: { tone: "error" | "success"; message: string }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={
        tone === "error"
          ? "rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          : "rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
      }
    >
      {message}
    </p>
  );
}

function InfoPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4 backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-300/80">{title}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

const authHeroStyle = {
  backgroundImage:
    'url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80")',
  backgroundSize: "cover",
  backgroundPosition: "center",
} as const;
