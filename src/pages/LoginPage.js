import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';
import Logo from '../components/Logo';

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
    e.preventDefault(); setError(''); setLoading(true);
    const res = await login(email, password);
    if (!res.success) setError(res.error || 'Неверный email или пароль');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!name.trim()) { setError('Введите имя'); setLoading(false); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); setLoading(false); return; }
    const { data, error: err } = await supabase.auth.signUp({ email, password, options:{data:{name}} });
    if (err) { setError(err.message==='User already registered'?'Email уже зарегистрирован':err.message); setLoading(false); return; }
    if (data?.user) {
      const initials = name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      const colors = ['#3B82F6','#60A5FA','#34D399','#FBBF24','#A78BFA','#F87171'];
      await supabase.from('profiles').insert({ id:data.user.id, name:name.trim(), initials, role:'guest', color:colors[Math.floor(Math.random()*colors.length)], email });
    }
    setSuccess('Готово! Проверьте почту и подтвердите email.');
    setMode('login'); setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess('Ссылка отправлена на почту.'); setLoading(false);
  };

  const sw = m => { setMode(m); setError(''); setSuccess(''); };

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-base)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'flex-start',
      padding:'40px 20px 60px',
      overflowY:'auto',
      backgroundImage:'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)',
    }}>

      {/* Лого */}
      <div style={{ textAlign:'center', marginBottom:36, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <Logo size={80} showText={false} />
        <div style={{ fontSize:28, fontWeight:900, color:'var(--text)', letterSpacing:-0.5, marginTop:12 }}>Терра Клуб</div>
        <div style={{ fontSize:14, color:'var(--text3)', marginTop:5, letterSpacing:0.5 }}>Бизнес сообщество</div>
      </div>

      {/* Карточка */}
      <div style={{
        width:'100%', maxWidth:400,
        background:'rgba(255,255,255,0.05)',
        border:'1px solid rgba(255,255,255,0.12)',
        borderRadius:28,
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}>
        {/* Переключатель */}
        {mode!=='forgot' && (
          <div style={{ padding:'20px 20px 0' }}>
            <div style={{
              display:'flex', background:'rgba(255,255,255,0.06)',
              borderRadius:14, padding:4, gap:4,
            }}>
              {[['login','Войти'],['register','Регистрация']].map(([m,l])=>(
                <button
                  key={m}
                  onClick={()=>sw(m)}
                  style={{
                    flex:1, padding:'9px', border:'none',
                    borderRadius:10, fontFamily:'inherit', fontWeight:600, fontSize:14, cursor:'pointer',
                    background: mode===m ? 'rgba(59,130,246,0.25)' : 'transparent',
                    color: mode===m ? 'var(--accent-bright)' : 'var(--text3)',
                    boxShadow: mode===m ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                    transition:'all 0.18s',
                  }}
                >{l}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding:'24px 24px 28px' }}>
          {mode==='forgot' && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>Восстановление</div>
              <div style={{ fontSize:14, color:'var(--text3)', marginTop:4 }}>Введите email — пришлём ссылку</div>
            </div>
          )}

          {error   && <div style={{ background:'var(--red-dim)', color:'var(--red)', padding:'11px 14px', borderRadius:12, fontSize:14, fontWeight:500, marginBottom:14 }}>{error}</div>}
          {success && <div style={{ background:'var(--green-dim)', color:'var(--green)', padding:'11px 14px', borderRadius:12, fontSize:14, fontWeight:500, marginBottom:14 }}>{success}</div>}

          {mode==='login' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <F label="Email"  type="email"    val={email}    set={e=>setEmail(e.target.value)}    ph="your@email.com" />
              <F label="Пароль" type="password" val={password} set={e=>setPassword(e.target.value)} ph="••••••••" />
              <button type="submit" disabled={loading} style={BS.submit}>{loading?'Вхожу...':'Войти'}</button>
              <button type="button" onClick={()=>sw('forgot')} style={BS.link}>Забыли пароль?</button>
            </form>
          )}

          {mode==='register' && (
            <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <F label="Имя и фамилия" type="text"     val={name}     set={e=>setName(e.target.value)}     ph="Иван Иванов" />
              <F label="Email"          type="email"    val={email}    set={e=>setEmail(e.target.value)}    ph="your@email.com" />
              <F label="Пароль"         type="password" val={password} set={e=>setPassword(e.target.value)} ph="Минимум 6 символов" />
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6, background:'rgba(255,255,255,0.04)', padding:'10px 14px', borderRadius:10 }}>
                После регистрации придёт письмо с подтверждением. Роль назначит администратор.
              </div>
              <button type="submit" disabled={loading} style={BS.submit}>{loading?'Создаю...':'Зарегистрироваться'}</button>
            </form>
          )}

          {mode==='forgot' && (
            <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <F label="Email" type="email" val={email} set={e=>setEmail(e.target.value)} ph="your@email.com" />
              <button type="submit" disabled={loading} style={BS.submit}>{loading?'Отправляю...':'Отправить ссылку'}</button>
              <button type="button" onClick={()=>sw('login')} style={BS.link}>← Назад</button>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop:28, fontSize:12, color:'var(--text4)', textAlign:'center', letterSpacing:0.3 }}>
        37 городов · 6 стран · Бизнес Клуб Терра
      </div>
    </div>
  );
}

function F({ label, type, val, set, ph }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>
      <input type={type} value={val} onChange={set} placeholder={ph} required />
    </div>
  );
}

const BS = {
  submit: { width:'100%', padding:'14px', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(59,130,246,0.35)', letterSpacing:-0.2 },
  link:   { background:'none', border:'none', color:'var(--accent-bright)', fontSize:14, cursor:'pointer', fontFamily:'inherit', padding:'4px 0', textAlign:'center', fontWeight:500 },
};
