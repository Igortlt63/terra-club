import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';

export default function LoginPage() {
  const { login } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.error || 'Неверный email или пароль');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (!name.trim()) { setError('Введите ваше имя'); setLoading(false); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); setLoading(false); return; }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      setError(
        signUpError.message === 'User already registered'
          ? 'Этот email уже зарегистрирован. Войдите или восстановите пароль.'
          : signUpError.message
      );
      setLoading(false);
      return;
    }

    if (data?.user) {
      const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const colors = ['#C9922A','#3B82F6','#8B5CF6','#22C55E','#EF4444','#F97316','#06B6D4'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: name.trim(),
        initials,
        role: 'guest',
        color,
        email,
      });
    }

    setSuccess('Аккаунт создан! Проверьте почту и подтвердите email, затем войдите.');
    setMode('login');
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (resetError) { setError(resetError.message); setLoading(false); return; }
    setSuccess('Письмо отправлено! Проверьте почту и перейдите по ссылке для сброса пароля.');
    setLoading(false);
  };

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.brand}>
          <div style={S.gem}>T</div>
          <div>
            <div style={S.brandName}>ТЕРРА</div>
            <div style={S.brandSub}>Бизнес Клуб</div>
          </div>
        </div>
        <div style={S.tagline}>
          Объединяем начинающих предпринимателей<br />в 22 городах и 6 странах
        </div>
        <div style={S.stats}>
          {[['2 847','участников'],['18','школ'],['22','города'],['6','стран']].map(([v,l]) => (
            <div key={l} style={S.stat}>
              <span style={S.statVal}>{v}</span>
              <span style={S.statLabel}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.right}>
        <div style={S.card}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={S.title}>
              {mode === 'login' && 'Войти в кабинет'}
              {mode === 'register' && 'Регистрация'}
              {mode === 'forgot' && 'Восстановление пароля'}
            </h2>
            <p style={S.sub}>
              {mode === 'login' && 'Введите email и пароль'}
              {mode === 'register' && 'Создайте аккаунт участника'}
              {mode === 'forgot' && 'Введите email — пришлём ссылку для сброса'}
            </p>
          </div>

          {mode !== 'forgot' && (
            <div style={S.tabs}>
              <button onClick={() => switchMode('login')} style={{...S.tab, ...(mode==='login' ? S.tabActive : {})}}>
                Войти
              </button>
              <button onClick={() => switchMode('register')} style={{...S.tab, ...(mode==='register' ? S.tabActive : {})}}>
                Регистрация
              </button>
            </div>
          )}

          {error   && <div style={S.errBox}>{error}</div>}
          {success && <div style={S.okBox}>{success}</div>}

          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
              <Field label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="submit" disabled={loading} style={S.submitBtn}>
                {loading ? 'Вхожу...' : 'Войти →'}
              </button>
              <button type="button" onClick={() => switchMode('forgot')} style={S.linkBtn}>
                Забыли пароль?
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <Field label="Имя и фамилия" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов" />
              <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
              <Field label="Пароль (минимум 6 символов)" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <div style={S.hint}>
                После регистрации придёт письмо для подтверждения email.<br />
                Администратор назначит вашу роль в системе.
              </div>
              <button type="submit" disabled={loading} style={S.submitBtn}>
                {loading ? 'Создаю аккаунт...' : 'Зарегистрироваться →'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot}>
              <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
              <button type="submit" disabled={loading} style={S.submitBtn}>
                {loading ? 'Отправляю...' : 'Отправить ссылку →'}
              </button>
              <button type="button" onClick={() => switchMode('login')} style={S.linkBtn}>
                ← Вернуться ко входу
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5A5A5A', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
    </div>
  );
}

const S = {
  page:      { display: 'flex', height: '100vh', overflow: 'hidden' },
  left:      { flex: 1, background: 'linear-gradient(160deg, #0F1117 0%, #1A1A2E 60%, #16213E 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 60px', gap: 32 },
  brand:     { display: 'flex', alignItems: 'center', gap: 16 },
  gem:       { width: 52, height: 52, background: 'linear-gradient(135deg, #C9922A, #E8A83E)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff' },
  brandName: { fontSize: 28, fontWeight: 700, color: '#E8A83E', letterSpacing: 3 },
  brandSub:  { fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  tagline:   { fontSize: 20, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontWeight: 300 },
  stats:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  stat:      { display: 'flex', flexDirection: 'column', gap: 4 },
  statVal:   { fontSize: 26, fontWeight: 700, color: '#E8A83E' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  right:     { width: 460, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, overflowY: 'auto' },
  card:      { width: '100%', maxWidth: 380 },
  title:     { fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 },
  sub:       { fontSize: 14, color: '#9A9A9A' },
  tabs:      { display: 'flex', border: '1px solid #E5E2DA', borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  tab:       { flex: 1, padding: '10px 0', fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', fontFamily: 'inherit', transition: 'all 0.15s' },
  tabActive: { background: '#C9922A', color: '#fff', fontWeight: 500 },
  errBox:    { background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14, border: '1px solid #FCA5A5' },
  okBox:     { background: '#F0FDF4', color: '#15803D', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14, border: '1px solid #86EFAC' },
  submitBtn: { width: '100%', padding: 11, fontSize: 14, marginTop: 4, borderRadius: 8, background: '#C9922A', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  linkBtn:   { display: 'block', width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#C9922A', fontSize: 13, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' },
  hint:      { fontSize: 12, color: '#9A9A9A', background: '#F9F8F6', padding: '10px 12px', borderRadius: 8, lineHeight: 1.6, marginBottom: 14 },
};
