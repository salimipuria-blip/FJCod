import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Calculator, Crown, Eye, EyeOff, KeyRound, LogIn, ShieldCheck, Sparkles, Store, UserCog } from 'lucide-react';
import type { RoleId, User } from '../core/types';
import { ROLES, ROLE_ORDER } from '../core/permissions';
import { login, useStore } from '../core/store';
import { Avatar, Emblem } from '../components/ui';

export const ROLE_ICONS: Record<RoleId, typeof Crown> = {
  owner: Crown,
  manager: Store,
  deputy: UserCog,
  cashier: Calculator,
  consultant: Sparkles,
};

export function Login({ onSuccess }: { onSuccess: (password: string, mustChange: boolean) => void }) {
  const { db } = useStore();
  const [role, setRole] = useState<RoleId | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const usersByRole = useMemo(() => {
    const m = new Map<RoleId, User[]>();
    for (const r of ROLE_ORDER) m.set(r, db.users.filter((u) => u.role === r && u.active));
    return m;
  }, [db.users]);

  const pickRole = (r: RoleId) => {
    setRole(r);
    setError('');
    setPassword('');
    const list = usersByRole.get(r) ?? [];
    setUser(list.length === 1 ? list[0] : null);
  };

  const back = () => {
    setError('');
    setPassword('');
    if (user && (usersByRole.get(role!)?.length ?? 0) > 1) setUser(null);
    else {
      setUser(null);
      setRole(null);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!user || !password) return;
    setBusy(true);
    // let the button state paint before the (synchronous) key-stretching runs
    setTimeout(() => {
      const res = login(user.id, password);
      setBusy(false);
      if (res.ok) onSuccess(password, res.mustChange);
      else setError(res.error);
    }, 10);
  };

  const step = !role ? 1 : !user ? 2 : 3;

  return (
    <div className="login">
      <aside className="login-art">
        <div className="girih" aria-hidden />
        <div className="row" style={{ gap: 14 }}>
          <Emblem size={44} />
          <span className="latin" style={{ letterSpacing: '0.3em', color: '#e6be62' }}>STORE OS</span>
        </div>
        <div className="stack" style={{ gap: 18 }}>
          <div className="login-hero-name">{db.settings.storeName}</div>
          <div className="login-hero-en">{db.settings.storeNameEn}</div>
          <p style={{ maxWidth: 420, color: '#d6d3d1', margin: 0, fontSize: 15 }}>
            سامانهٔ مدیریت فروشگاه — رشد، و تکرار رشد. هر فروش، یک قدم در چرخهٔ بازگشت مشتری.
          </p>
          <div className="pillars">
            {['لوکس', 'شیک', 'اصیل', 'اقتصادی'].map((p) => (
              <span key={p} className="pillar">{p}</span>
            ))}
          </div>
        </div>
        <div className="row between" style={{ fontSize: 12, color: '#a8a29e' }}>
          <span>
            طراحی و توسعه: <span className="latin" style={{ color: '#e6be62', letterSpacing: '0.2em' }}>FJCOD</span>
          </span>
          <span>بهره‌بردار: {db.license.licensee}</span>
        </div>
      </aside>

      <main className="login-panel">
        <div className="stack" style={{ gap: 8 }}>
          <div className="step-dots" aria-hidden>
            {[1, 2, 3].map((i) => (
              <i key={i} className={i <= step ? 'on' : ''} />
            ))}
          </div>
          <h1 style={{ fontSize: 26 }}>{step === 1 ? 'ورود به پنل کاربری' : step === 2 ? 'کاربر را انتخاب کنید' : 'رمز عبور'}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {step === 1 && 'پوزیشن خود را انتخاب کنید.'}
            {step === 2 && `${ROLES[role!].title} — چند کاربر در این پوزیشن تعریف شده است.`}
            {step === 3 && `${ROLES[role!].title} · ${user!.name}`}
          </p>
        </div>

        {step === 1 && (
          <div className="role-grid">
            {ROLE_ORDER.map((r) => {
              const Icon = ROLE_ICONS[r];
              const count = usersByRole.get(r)?.length ?? 0;
              return (
                <button key={r} className={`role-card ${r}`} onClick={() => pickRole(r)} disabled={count === 0} data-role={r}>
                  <span className="ic"><Icon size={22} /></span>
                  <span>
                    <b>{ROLES[r].title}</b>
                    <small>{r === 'owner' ? 'FJCOD — مولد و ایده‌پرداز سیستم' : count > 1 ? `${count.toLocaleString('fa-IR')} کاربر` : ROLES[r].titleEn}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="user-list">
            {usersByRole.get(role!)!.map((u) => (
              <button key={u.id} className="role-card" onClick={() => setUser(u)}>
                <Avatar name={u.name} />
                <span>
                  <b>{u.name}</b>
                  <small>{ROLES[u.role].title}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <form className="stack" onSubmit={submit} style={{ maxWidth: 420 }}>
            <label className="field">
              <span>رمز عبور</span>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete="current-password"
                  dir="ltr"
                  name="password"
                  aria-invalid={!!error}
                  style={{ paddingInlineStart: 44 }}
                />
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShow((s) => !s)} aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'} style={{ position: 'absolute', insetInlineStart: 2, top: 1 }}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <div className="error-text" role="alert">{error}</div>}
            <button className="btn btn-primary btn-lg" type="submit" disabled={!password || busy}>
              <LogIn size={18} /> {busy ? 'در حال بررسی…' : 'ورود'}
            </button>
          </form>
        )}

        <div className="row between">
          {step > 1 ? (
            <button className="btn btn-ghost" onClick={back}>
              <ArrowRight size={16} /> بازگشت
            </button>
          ) : (
            <span />
          )}
          <span className="subtle row" style={{ gap: 6 }}>
            <ShieldCheck size={14} /> رمزها رمزنگاری‌شده ذخیره می‌شوند · <KeyRound size={14} /> قفل خودکار
          </span>
        </div>
      </main>
    </div>
  );
}
