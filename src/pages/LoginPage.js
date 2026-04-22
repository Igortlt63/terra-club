import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';
import { SCHOOLS } from '../data/db';
import Logo from '../components/Logo';

const DESIRED_ROLES = [
  { id: 'student',    label: 'Ученик школы',       icon: '🎓', hint: 'Хочу учиться в одной из школ клуба' },
  { id: 'mentee',     label: 'Наставляемый',        icon: '🤝', hint: 'Хочу получить личного наставника' },
  { id: 'member',     label: 'Участник клуба',      icon: '👥', hint: 'Хочу быть участником без обучения' },
  { id: 'management', label: 'Руководство / Спикер', icon: '👑', hint: 'Хочу быть наставником или преподавателем' },
];

export default function LoginPage() {
  const { login } = useApp();
  const [mode,        setMode]        = useState('login');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [password2,   setPassword2]   = useState('');
  const [name,        setName]        = useState('');
  const [phone,       setPhone]       = useState('');
  const [telegram,    setTelegram]    = useState('');
  const [desiredRole, setDesiredRole] = useState('');
  const [desiredSchool, setDesiredSchool] = useState('');
  const [mentors,     setMentors]     = useState([]);
  const [desiredMentor, setDesiredMentor] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showPass2,   setShowPass2]   = useState(false);

  // Загружаем список наставников для выбора
  useEffect(() => {
    if (mode === 'register') {
      supabase.from('profiles').select('id,name,initials,color').eq('role','mentor')
        .then(({data}) => setMentors(data||[]));
    }
  }, [mode]);

  const sw = m => { setMode(m); setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await login(email, password);
    if (!res.success) setError(res.error || 'Неверный email или пароль');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!name.trim())        { setError('Введите имя и фамилию'); setLoading(false); return; }
    if (!phone.trim())       { setError('Введите номер телефона'); setLoading(false); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); setLoading(false); return; }
    if (password !== password2) { setError('Пароли не совпадают'); setLoading(false); return; }
    if (desiredRole === 'student' && !desiredSchool) { setError('Выберите желаемую школу'); setLoading(false); return; }
    if (desiredRole === 'mentee' && !desiredMentor)  { setError('Выберите желаемого наставника'); setLoading(false); return; }

    const { data, error: err } = await supabase.auth.signUp({ email, password, options:{data:{name}} });
    if (err) {
      setError(err.message === 'User already registered' ? 'Email уже зарегистрирован' : err.message);
      setLoading(false); return;
    }
    if (data?.user) {
      const initials = name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      const colors   = ['#3B82F6','#60A5FA','#34D399','#FBBF24','#A78BFA','#F87171'];
      const color    = colors[Math.floor(Math.random()*colors.length)];
      // Чистим telegram — убираем @ если написали с ним
      const tgClean = telegram.trim().replace(/^@/, '');
      await supabase.from('profiles').insert({
        id:               data.user.id,
        name:             name.trim(),
        initials,
        role:             'guest',
        color,
        email,
        phone:            phone.trim(),
        telegram:         tgClean || null,
        desired_role:     desiredRole || null,
        desired_school_id:desiredRole==='student' ? desiredSchool : null,
        desired_mentor_id:desiredRole==='mentee'  ? desiredMentor : null,
        phone_visible:    false,
        email_visible:    false,
        telegram_visible: false,
      });
    }
    setSuccess('Готово! Проверьте почту и подтвердите email. Роль назначит администратор.');
    sw('login'); setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess('Ссылка отправлена на почту.'); setLoading(false);
  };

  const schoolsOptions = SCHOOLS.map(s => ({ id: s.id, label: s.name, icon: s.icon }));

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-base)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'flex-start',
      padding:'40px 20px 60px', overflowY:'auto',
      backgroundImage:'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)',
    }}>
      <div style={{ textAlign:'center', marginBottom:28, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <Logo size={70} showText={false} />
        <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:-0.5, marginTop:10 }}>Терра Клуб</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:4, letterSpacing:0.5 }}>Бизнес сообщество</div>
      </div>

      <div style={{
        width:'100%', maxWidth: mode==='register' ? 440 : 400,
        background:'rgba(255,255,255,0.05)',
        border:'1px solid rgba(255,255,255,0.12)',
        borderRadius:28,
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        transition:'max-width 0.3s ease',
      }}>
        {mode !== 'forgot' && (
          <div style={{ padding:'20px 20px 0' }}>
            <div style={{ display:'flex', background:'rgba(255,255,255,0.06)', borderRadius:14, padding:4, gap:4 }}>
              {[['login','Войти'],['register','Регистрация']].map(([m,l]) => (
                <button key={m} onClick={()=>sw(m)} style={{
                  flex:1, padding:'9px', border:'none', borderRadius:10,
                  fontFamily:'inherit', fontWeight:600, fontSize:14, cursor:'pointer',
                  background: mode===m ? 'rgba(59,130,246,0.25)' : 'transparent',
                  color: mode===m ? 'var(--accent-bright)' : 'var(--text3)',
                  boxShadow: mode===m ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                  transition:'all 0.18s',
                }}>{l}</button>
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
          {error   && <div style={{ background:'var(--red-dim)',   color:'var(--red)',   padding:'11px 14px', borderRadius:12, fontSize:14, fontWeight:500, marginBottom:14 }}>{error}</div>}
          {success && <div style={{ background:'var(--green-dim)', color:'var(--green)', padding:'11px 14px', borderRadius:12, fontSize:14, fontWeight:500, marginBottom:14 }}>{success}</div>}

          {/* ── ВХОД ── */}
          {mode==='login' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <F label="Email"  type="email"    val={email}    set={e=>setEmail(e.target.value)}    ph="your@email.com" />
              <FPass label="Пароль" val={password} set={e=>setPassword(e.target.value)} show={showPass} toggle={()=>setShowPass(v=>!v)} />
              <button type="submit" disabled={loading} style={BS.submit}>{loading?'Вхожу...':'Войти'}</button>
              <button type="button" onClick={()=>sw('forgot')} style={BS.link}>Забыли пароль?</button>
            </form>
          )}

          {/* ── РЕГИСТРАЦИЯ ── */}
          {mode==='register' && (
            <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Основные данные */}
              <FSec label="Основные данные"/>
              <F label="Имя и фамилия *" type="text"  val={name}  set={e=>setName(e.target.value)}  ph="Иван Иванов" />
              <F label="Email *"          type="email" val={email} set={e=>setEmail(e.target.value)} ph="your@email.com" />
              <F label="Номер телефона *" type="tel"   val={phone} set={e=>setPhone(e.target.value)} ph="+7 (999) 123-45-67" />
              <F label="Ник в Telegram"   type="text"  val={telegram} set={e=>setTelegram(e.target.value)} ph="@username (необязательно)" required={false} />

              {/* Пароль */}
              <FSec label="Придумайте пароль"/>
              <FPass label="Пароль *"          val={password}  set={e=>setPassword(e.target.value)}  show={showPass}  toggle={()=>setShowPass(v=>!v)}  ph="Минимум 6 символов" />
              <FPass label="Повторите пароль *" val={password2} set={e=>setPassword2(e.target.value)} show={showPass2} toggle={()=>setShowPass2(v=>!v)} ph="Введите пароль ещё раз" />
              {password && password2 && password !== password2 && (
                <div style={{ fontSize:12, color:'var(--red)', marginTop:-8 }}>Пароли не совпадают</div>
              )}
              {password && password2 && password === password2 && password.length >= 6 && (
                <div style={{ fontSize:12, color:'var(--green)', marginTop:-8 }}>✓ Пароли совпадают</div>
              )}

              {/* Желаемая роль */}
              <FSec label="Чем хотите заниматься в клубе?"/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {DESIRED_ROLES.map(r => (
                  <div key={r.id} onClick={()=>{ setDesiredRole(r.id); setDesiredSchool(''); setDesiredMentor(''); }}
                    style={{
                      padding:'10px 12px', borderRadius:12, cursor:'pointer', transition:'all 0.15s',
                      border: desiredRole===r.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: desiredRole===r.id ? 'var(--accent-dim)' : 'var(--bg-overlay)',
                    }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{r.icon}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{r.label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:3, lineHeight:1.4 }}>{r.hint}</div>
                  </div>
                ))}
              </div>

              {/* Уточнение школы */}
              {desiredRole === 'student' && (
                <div>
                  <label style={LS.label}>Какую школу хотите посещать? *</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto', border:'1px solid var(--border)', borderRadius:12, padding:8 }}>
                    {schoolsOptions.map(s => (
                      <div key={s.id} onClick={()=>setDesiredSchool(s.id)}
                        style={{
                          display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                          borderRadius:8, cursor:'pointer', transition:'background 0.12s',
                          background: desiredSchool===s.id ? 'var(--accent-dim)' : 'transparent',
                          border: desiredSchool===s.id ? '1px solid var(--accent)' : '1px solid transparent',
                        }}>
                        <span style={{ fontSize:16 }}>{s.icon}</span>
                        <span style={{ fontSize:13, color:'var(--text)' }}>{s.label}</span>
                        {desiredSchool===s.id && <span style={{ marginLeft:'auto', fontSize:14, color:'var(--accent)' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Уточнение наставника */}
              {desiredRole === 'mentee' && (
                <div>
                  <label style={LS.label}>Желаемый наставник *</label>
                  {mentors.length === 0 ? (
                    <div style={{ fontSize:13, color:'var(--text3)', padding:'12px 14px', background:'var(--bg-overlay)', borderRadius:10, border:'1px solid var(--border)' }}>
                      Загрузка наставников...
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto', border:'1px solid var(--border)', borderRadius:12, padding:8 }}>
                      {mentors.map(m => (
                        <div key={m.id} onClick={()=>setDesiredMentor(m.id)}
                          style={{
                            display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                            borderRadius:8, cursor:'pointer', transition:'background 0.12s',
                            background: desiredMentor===m.id ? 'var(--accent-dim)' : 'transparent',
                            border: desiredMentor===m.id ? '1px solid var(--accent)' : '1px solid transparent',
                          }}>
                          <div style={{ width:28, height:28, borderRadius:9, background:m.color||'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff', flexShrink:0 }}>{m.initials||'?'}</div>
                          <span style={{ fontSize:13, color:'var(--text)' }}>{m.name}</span>
                          {desiredMentor===m.id && <span style={{ marginLeft:'auto', fontSize:14, color:'var(--accent)' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6, background:'rgba(255,255,255,0.04)', padding:'10px 14px', borderRadius:10 }}>
                Телефон и Telegram по умолчанию скрыты от других пользователей. Вы сможете изменить это в настройках профиля.
              </div>
              <button type="submit" disabled={loading} style={BS.submit}>{loading?'Создаю...':'Зарегистрироваться'}</button>
            </form>
          )}

          {/* ── ВОССТАНОВЛЕНИЕ ── */}
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

// ── Компоненты полей ─────────────────────────────────────────
function F({ label, type, val, set, ph, required=true }) {
  return (
    <div>
      <label style={LS.label}>{label}</label>
      <input type={type} value={val} onChange={set} placeholder={ph} required={required}
        style={{ width:'100%' }} />
    </div>
  );
}

function FPass({ label, val, set, show, toggle, ph='Минимум 6 символов' }) {
  return (
    <div>
      <label style={LS.label}>{label}</label>
      <div style={{ position:'relative' }}>
        <input type={show?'text':'password'} value={val} onChange={set} placeholder={ph} required
          style={{ width:'100%', paddingRight:42 }} />
        <button type="button" onClick={toggle}
          style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:13, padding:0 }}>
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );
}

function FSec({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 -2px' }}>
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      <span style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.8, whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
    </div>
  );
}

const LS = {
  label: { display:'block', fontSize:11, fontWeight:600, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:0.5 },
};
const BS = {
  submit: { width:'100%', padding:'14px', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(59,130,246,0.35)', letterSpacing:-0.2 },
  link:   { background:'none', border:'none', color:'var(--accent-bright)', fontSize:14, cursor:'pointer', fontFamily:'inherit', padding:'4px 0', textAlign:'center', fontWeight:500 },
};
