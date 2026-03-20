import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const DEMO_ACCOUNTS = [
  { label: 'Руководство', email: 'admin@terra.club', password: 'admin123', badge: 'badge-admin', desc: 'Видит всё' },
  { label: 'Преподаватель', email: 'elena@terra.club', password: 'teacher123', badge: 'badge-teacher', desc: 'Кабинет школы' },
  { label: 'Ученик', email: 'maria@terra.club', password: 'student123', badge: 'badge-student', desc: 'Своя школа' },
  { label: 'Наставник', email: 'dmitry@terra.club', password: 'mentor123', badge: 'badge-mentor', desc: 'Группа наставляемых' },
  { label: 'Наставляемый', email: 'anna@terra.club', password: 'mentee123', badge: 'badge-mentee', desc: 'Группа наставника' },
  { label: 'Гость', email: 'ivan@terra.club', password: 'guest123', badge: 'badge-guest', desc: 'Только общий чат' },
];

export default function LoginPage() {
  const { login, showNotification } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) setError(result.error);
      setLoading(false);
    }, 400);
  };

  const quickLogin = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setTimeout(() => {
      login(acc.email, acc.password);
    }, 100);
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.brand}>
          <div style={S.gemWrap}><span style={S.gem}>T</span></div>
          <div>
            <div style={S.brandName}>ТЕРРА</div>
            <div style={S.brandSub}>Бизнес Клуб</div>
          </div>
        </div>
        <div style={S.tagline}>Объединяем начинающих предпринимателей<br />в 22 городах и 6 странах</div>
        <div style={S.stats}>
          {[['2 847', 'участников'], ['18', 'школ'], ['22', 'города'], ['6', 'стран']].map(([v, l]) => (
            <div key={l} style={S.stat}>
              <span style={S.statVal}>{v}</span>
              <span style={S.statLabel}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.right}>
        <div style={S.formCard}>
          <h2 style={S.formTitle}>Добро пожаловать</h2>
          <p style={S.formSub}>Войдите в свой кабинет</p>

          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={S.field}>
              <label style={S.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div style={S.field}>
              <label style={S.label}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <div style={S.errBox}>{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px', fontSize: 14, marginTop: 4 }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div style={S.demoSection}>
            <div style={S.demoTitle}>Демо-доступ — выберите роль:</div>
            <div style={S.demoGrid}>
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} onClick={() => quickLogin(acc)} style={S.demoBtn}>
                  <span className={`badge ${acc.badge}`} style={{ marginBottom: 4 }}>{acc.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{acc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display: 'flex', height: '100vh', overflow: 'hidden' },
  left: {
    flex: 1, background: 'linear-gradient(160deg, #0F1117 0%, #1A1A2E 60%, #16213E 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '40px 60px', gap: 32,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 16 },
  gemWrap: { width: 52, height: 52, background: 'linear-gradient(135deg, #C9922A, #E8A83E)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gem: { fontSize: 28, fontWeight: 700, color: '#fff' },
  brandName: { fontSize: 28, fontWeight: 700, color: '#E8A83E', letterSpacing: 3 },
  brandSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  tagline: { fontSize: 20, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontWeight: 300 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 8 },
  stat: { display: 'flex', flexDirection: 'column', gap: 4 },
  statVal: { fontSize: 26, fontWeight: 700, color: '#E8A83E' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  right: {
    width: 440, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 32, overflowY: 'auto',
  },
  formCard: { width: '100%', maxWidth: 360 },
  formTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text)' },
  formSub: { fontSize: 14, color: 'var(--text3)', marginTop: 4 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 },
  errBox: { background: '#FEF2F2', color: '#DC2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 10, border: '1px solid #FCA5A5' },
  demoSection: { marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' },
  demoTitle: { fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 500, textAlign: 'center' },
  demoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  demoBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg2)', cursor: 'pointer', gap: 4, transition: 'all 0.15s' },
};
