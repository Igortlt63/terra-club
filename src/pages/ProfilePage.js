import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';
import { CITIES, SCHOOLS } from '../data/db';
import DevPanel from './DevPanel';

const ROLE_LABELS = {
  admin:'Руководство', teacher:'Преподаватель', student:'Ученик',
  mentor:'Наставник', mentee:'Наставляемый', guest:'Гость',
  member:'Участник', developer:'Разработчик',
};
const ROLE_BADGE = {
  admin:'badge-admin', teacher:'badge-teacher', student:'badge-student',
  mentor:'badge-mentor', mentee:'badge-mentee', guest:'badge-guest',
  member:'badge-member', developer:'badge-developer',
};

// ── iOS-стиль Toggle ────────────────────────────────────────
function Toggle({ on, onChange, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        width:50, height:30, borderRadius:15, flexShrink:0,
        background: on ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
        border: on ? 'none' : '1px solid var(--border2)',
        position:'relative', cursor: disabled ? 'default' : 'pointer',
        transition:'background 0.22s, border 0.22s',
        boxShadow: on ? '0 0 12px var(--accent-glow)' : 'none',
      }}
    >
      <div style={{
        position:'absolute', top:3, left: on ? 23 : 3,
        width:22, height:22, borderRadius:'50%',
        background:'#fff',
        boxShadow:'0 2px 6px rgba(0,0,0,0.3)',
        transition:'left 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </div>
  );
}

// ── Строка с переключателем ─────────────────────────────────
function ToggleRow({ label, sublabel, on, onChange, disabled }) {
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'13px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, marginRight:16 }}>
        <div style={{ fontSize:15, color:'var(--text)', fontWeight:500 }}>{label}</div>
        {sublabel && <div style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>{sublabel}</div>}
      </div>
      <Toggle on={on} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function getPermissions(role) {
  return [
    { label:'Общий чат города',   sub:'Городские каналы',             has: true },
    { label:'Кабинет школы',      sub:'Модули, задания, медиатека',    has: ['student','teacher','admin'].includes(role) },
    { label:'Наставничество',     sub:'Группа наставника',             has: ['mentor','mentee','admin'].includes(role) },
    { label:'Загрузка файлов',    sub:'Видео и документы для школы',   has: ['teacher','admin'].includes(role) },
    { label:'CRM участников',     sub:'Просмотр профилей',             has: role==='admin' },
    { label:'Аналитика',          sub:'Статистика по городам',         has: role==='admin' },
    { label:'Управление ролями',  sub:'Назначение ролей',              has: role==='admin' },
    { label:'Все города',         sub:'Данные всех филиалов',          has: role==='admin' },
  ];
}

export default function ProfilePage({ viewUserId, onClear }) {
  const { currentUser, logout, fetchProfile, setCurrentUser, getProfile } = useApp();
  const [viewedProfile, setViewedProfile] = React.useState(null);

  // Load other user profile if viewUserId passed
  React.useEffect(()=>{
    if (!viewUserId || viewUserId === currentUser?.id) { setViewedProfile(null); return; }
    const cached = getProfile(viewUserId);
    if (cached) { setViewedProfile(cached); return; }
    fetchProfile(viewUserId).then(p => setViewedProfile(p||null));
  },[viewUserId, currentUser?.id, getProfile, fetchProfile]); // eslint-disable-line

  const displayUser = viewedProfile || currentUser;
  const isOwnProfile = !viewedProfile || viewedProfile?.id === currentUser?.id;
  const role = currentUser?.role; const displayRole = displayUser?.role;

  const [activeTab, setActiveTab] = useState('profile');
  const [name,      setName]      = useState(currentUser?.name || '');
  const [bio,       setBio]       = useState(currentUser?.bio  || '');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');

  // ── Тема ────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const t = localStorage.getItem('terra-theme');
    return t ? t === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('terra-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Инициализация темы при монтировании
  useEffect(() => {
    const saved = localStorage.getItem('terra-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const city   = CITIES.find(c=>c.id===(currentUser?.city_id||currentUser?.cityId));
  const school = SCHOOLS.find(s=>s.id===(currentUser?.school_id||currentUser?.schoolId));
  const perms  = getPermissions(role);

  const handleSave = async () => {
    if (!name.trim()) { setError('Имя не может быть пустым'); return; }
    setSaving(true); setError('');
    const initials = name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const { error:err } = await supabase.from('profiles')
      .update({ name:name.trim(), initials, bio:bio.trim()||null })
      .eq('id', currentUser.id);
    if (err) { setError(err.message); setSaving(false); return; }
    const fresh = await fetchProfile(currentUser.id);
    if (fresh && setCurrentUser) setCurrentUser(fresh);
    setSaved(true); setSaving(false);
    setTimeout(()=>setSaved(false), 2500);
  };

  const tabs = [
    ['profile', 'Профиль'],
    ['settings','Настройки'],
    ['access',  'Доступ'],
    ['dev',     '🛠 Dev'],
  ];

  return (
    <div style={{ maxWidth:680, margin:'0 auto', overflowY:'auto', height:'100%', paddingBottom:32 }}>

      {/* ── Шапка профиля ── */}
      <div style={{ padding:'28px 22px 20px', display:'flex', gap:18, alignItems:'center' }}>
        <div style={{
          width:72, height:72, borderRadius:24, flexShrink:0,
          background: currentUser?.color || 'var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:26, fontWeight:800, color:'#fff',
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
        }}>{currentUser?.initials||'?'}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>
              {currentUser?.name}
            </h2>
            <span className={`badge ${ROLE_BADGE[role]||'badge-guest'}`}>{ROLE_LABELS[role]||'Гость'}</span>
          </div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:5 }}>
            {city ? `${city.flag} ${city.name}` : '—'}
            {school ? ` · ${school.icon} ${school.name}` : ''}
          </div>
          {currentUser?.bio && (
            <p style={{ fontSize:14, color:'var(--text2)', marginTop:8, lineHeight:1.5 }}>{currentUser.bio}</p>
          )}
        </div>
      </div>

      {/* ── Вкладки ── */}
      <div className="tabs" style={{ margin:'0 22px 22px' }}>
        {tabs.map(([t,l])=>(
          <div key={t} className={`tab${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>{l}</div>
        ))}
      </div>

      <div style={{ padding:'0 22px' }}>

        {/* ── ПРОФИЛЬ ── */}
        {activeTab==='profile' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Контакты</span></div>
              <div style={{ padding:'0 18px' }}>
                {[
                  ['📧','Email',   currentUser?.email],
                  ['🌍','Город',   city ? `${city.flag} ${city.name}` : null],
                  ['📚','Школа',   school ? `${school.icon} ${school.name}` : null],
                  ['🔄','Поток',   currentUser?.stream_number ? `Поток ${currentUser.stream_number}` : null],
                  ['📖','Модуль',  currentUser?.current_module ? `Модуль ${currentUser.current_module}` : null],
                ].filter(([,,v])=>v).map(([icon,label,val])=>(
                  <div key={label} style={{ display:'flex', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:18, width:24, textAlign:'center', flexShrink:0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{label}</div>
                      <div style={{ fontSize:15, marginTop:1, color:'var(--text)' }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={logout} className="btn-danger" style={{ alignSelf:'flex-start' }}>
              Выйти из аккаунта
            </button>
          </div>
        )}

        {/* ── НАСТРОЙКИ ── */}
        {activeTab==='settings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Редактировать профиль</span></div>
              <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label className="form-label">Имя и фамилия</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" value={currentUser?.email||''} disabled style={{ opacity:0.5, cursor:'not-allowed' }} />
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Email изменить нельзя</div>
                </div>
                <div>
                  <label className="form-label">О себе</label>
                  <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Расскажите о себе..." />
                </div>
                {error && <div style={{ background:'var(--red-dim)', color:'var(--red)', padding:'10px 14px', borderRadius:12, fontSize:14 }}>{error}</div>}
                {saved && <div style={{ background:'var(--green-dim)', color:'var(--green)', padding:'10px 14px', borderRadius:12, fontSize:14 }}>✅ Сохранено!</div>}
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ alignSelf:'flex-start' }}>
                  {saving ? 'Сохраняю...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>

            {/* Тема оформления */}
            <div className="card">
              <div className="card-header"><span className="card-title">Внешний вид</span></div>
              <div className="card-body">
                <ToggleRow
                  label="Тёмная тема"
                  sublabel={isDark ? 'Включена — тёмный фон' : 'Выключена — светлый фон'}
                  on={isDark}
                  onChange={() => setIsDark(v => !v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── ДОСТУП ── */}
        {activeTab==='access' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Права доступа</span>
              <span className={`badge ${ROLE_BADGE[role]||'badge-guest'}`}>{ROLE_LABELS[role]}</span>
            </div>
            <div style={{ padding:'0 18px' }}>
              {perms.map(perm => (
                <ToggleRow
                  key={perm.label}
                  label={perm.label}
                  sublabel={perm.sub}
                  on={perm.has}
                  disabled={true}
                />
              ))}
            </div>
            {role==='guest' && (
              <div style={{ margin:'0 18px 18px', padding:'12px 14px', background:'var(--amber-dim)', borderRadius:12, fontSize:13, color:'var(--amber)' }}>
                💡 У вас роль «Гость». Обратитесь к администратору для получения доступа.
              </div>
            )}
          </div>
        )}

        {/* ── РАЗРАБОТЧИК ── */}
        {activeTab==='dev' && <DevPanel inline />}

      </div>
    </div>
  );
}
