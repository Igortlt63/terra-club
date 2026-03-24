import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';

export default function LoginPage() {
  const { login } = useApp();
  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

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
      email, password, options: { data: { name } },
    });
    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'Этот email уже зарегистрирован'
        : signUpError.message);
      setLoading(false); return;
    }
    if (data?.user) {
      const initials = name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      const colors   = ['#007AFF','#32ADE6','#34C759','#FF9500','#AF52DE','#FF3B30'];
      const color    = colors[Math.floor(Math.random()*colors.length)];
      await supabase.from('profiles').insert({ id: data.user.id, name: name.trim(), initials, role: 'guest', color, email });
    }
    setSuccess('Аккаунт создан! Проверьте почту и подтвердите email.');
    setMode('login'); setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess('Письмо отправлено! Проверьте почту.');
    setLoading(false);
  };

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px',
    }}>
      {/* Логотип */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #007AFF, #32ADE6)',
          borderRadius: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, fontWeight: 800, color: '#fff',
          boxShadow: '0 4px 20px rgba(0,122,255,0.35)',
        }}>T</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Терра Клуб</div>
        <div style={{ fontSize: 15, color: 'var(--text3)', marginTop: 4 }}>Бизнес сообщество</div>
      </div>

      {/* Карточка формы */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Переключатель вкладок */}
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', padding: '16px 16px 0' }}>
            <div className="tabs" style={{ flex: 1, margin: 0 }}>
              {[['login','Войти'],['register','Регистрация']].map(([m,l])=>(
                <div key={m} className={`tab${mode===m?' active':''}`} onClick={()=>switchMode(m)}>{l}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '20px 24px 28px' }}>
          {mode === 'forgot' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Восстановление пароля</div>
              <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Введите email — пришлём ссылку</div>
            </div>
          )}

          {error   && <div style={S.errorBox}>{error}</div>}
          {success && <div style={S.successBox}>{success}</div>}

          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <Field label="Email"  type="email"    value={email}    onChange={e=>setEmail(e.target.value)}    placeholder="your@email.com" />
              <Field label="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
              <button type="submit" disabled={loading} style={{ ...S.submitBtn, marginTop: 4 }}>
                {loading ? 'Вхожу...' : 'Войти'}
              </button>
              <button type="button" onClick={()=>switchMode('forgot')} style={S.linkBtn}>Забыли пароль?</button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <Field label="Имя и фамилия" type="text"     value={name}     onChange={e=>setName(e.target.value)}     placeholder="Иван Иванов" />
              <Field label="Email"          type="email"    value={email}    onChange={e=>setEmail(e.target.value)}    placeholder="your@email.com" />
              <Field label="Пароль"         type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Минимум 6 символов" />
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, background: 'var(--bg2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                После регистрации придёт письмо для подтверждения email. Роль назначит администратор.
              </div>
              <button type="submit" disabled={loading} style={S.submitBtn}>
                {loading ? 'Создаю аккаунт...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <Field label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" />
              <button type="submit" disabled={loading} style={S.submitBtn}>
                {loading ? 'Отправляю...' : 'Отправить ссылку'}
              </button>
              <button type="button" onClick={()=>switchMode('login')} style={S.linkBtn}>← Вернуться ко входу</button>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text4)', textAlign: 'center' }}>
        22 города · 6 стран · Бизнес Клуб Терра
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div className="form-field" style={{ marginBottom: 0 }}>
      <label className="form-label">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required />
    </div>
  );
}

const S = {
  errorBox:   { background: 'var(--red-dim)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 4, fontWeight: 500 },
  successBox: { background: 'var(--green-dim)', color: '#1A8C3A', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 4, fontWeight: 500 },
  submitBtn:  { width: '100%', padding: '13px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  linkBtn:    { background: 'none', border: 'none', color: 'var(--blue)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', textAlign: 'center', fontWeight: 500 },
};
