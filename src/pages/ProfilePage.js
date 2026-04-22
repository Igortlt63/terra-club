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
const DESIRED_ROLE_LABELS = {
  student:'Ученик школы', mentee:'Наставляемый',
  member:'Участник клуба', management:'Руководство / Спикер',
};
const ADMIN_ROLES = ['admin'];

function canSeeContacts(viewer, target) {
  // Admin/руководство видят всегда
  if (ADMIN_ROLES.includes(viewer?.role)) return { phone:true, email:true, telegram:true };
  // Своя запись
  if (viewer?.id === target?.id) return { phone:true, email:true, telegram:true };
  // Публичные поля — определяются настройками пользователя
  return {
    phone:    !!target?.phone_visible,
    email:    !!target?.email_visible,
    telegram: !!target?.telegram_visible,
  };
}

function Toggle({ on, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange} style={{
      width:50, height:30, borderRadius:15, flexShrink:0,
      background: on ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
      border: on ? 'none' : '1px solid var(--border2)',
      position:'relative', cursor: disabled ? 'default' : 'pointer',
      transition:'background 0.22s, border 0.22s',
      boxShadow: on ? '0 0 12px var(--accent-glow)' : 'none',
    }}>
      <div style={{
        position:'absolute', top:3, left: on ? 23 : 3,
        width:22, height:22, borderRadius:'50%', background:'#fff',
        boxShadow:'0 2px 6px rgba(0,0,0,0.3)',
        transition:'left 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </div>
  );
}

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
    { label:'Общий чат города',  sub:'Городские каналы',           has: true },
    { label:'Кабинет школы',     sub:'Модули, задания, медиатека',  has: ['student','teacher','admin'].includes(role) },
    { label:'Наставничество',    sub:'Группа наставника',           has: ['mentor','mentee','admin'].includes(role) },
    { label:'Загрузка файлов',   sub:'Видео и документы',           has: ['teacher','admin'].includes(role) },
    { label:'CRM участников',    sub:'Просмотр профилей',           has: role==='admin' },
    { label:'Аналитика',         sub:'Статистика по городам',       has: role==='admin' },
    { label:'Управление ролями', sub:'Назначение ролей',            has: role==='admin' },
    { label:'Все города',        sub:'Данные всех филиалов',        has: role==='admin' },
  ];
}

export default function ProfilePage({ viewUserId, onClear, onWriteDm }) {
  const { currentUser, logout, fetchProfile, setCurrentUser, getProfile } = useApp();

  // ── Загрузка профиля ─────────────────────────────────────
  const [viewedProfile, setViewedProfile] = useState(null);
  useEffect(() => {
    if (!viewUserId || viewUserId === currentUser?.id) { setViewedProfile(null); return; }
    const cached = getProfile(viewUserId);
    if (cached) { setViewedProfile(cached); return; }
    fetchProfile(viewUserId).then(p => setViewedProfile(p || null));
  }, [viewUserId, currentUser?.id]); // eslint-disable-line

  const displayUser  = (viewUserId && viewUserId !== currentUser?.id) ? viewedProfile : currentUser;
  const isOwnProfile = !viewUserId || viewUserId === currentUser?.id;
  const dRole        = displayUser?.role;
  const isAdmin      = ADMIN_ROLES.includes(currentUser?.role);
  const visibility   = canSeeContacts(currentUser, displayUser);

  // ── Tabs ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('profile');
  useEffect(() => { setActiveTab('profile'); }, [viewUserId]);

  // ── Поля настроек ────────────────────────────────────────
  const [name,    setName]    = useState('');
  const [bio,     setBio]     = useState('');
  const [phone,   setPhone]   = useState('');
  const [tg,      setTg]      = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  // Privacy toggles (локальное состояние — сохраняем немедленно)
  const [phonePub, setPhonePub]   = useState(false);
  const [emailPub, setEmailPub]   = useState(false);
  const [tgPub,    setTgPub]      = useState(false);

  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setName(currentUser.name   || '');
      setBio (currentUser.bio    || '');
      setPhone(currentUser.phone || '');
      setTg   (currentUser.telegram || '');
      setPhonePub(!!currentUser.phone_visible);
      setEmailPub(!!currentUser.email_visible);
      setTgPub   (!!currentUser.telegram_visible);
    }
  }, [currentUser, isOwnProfile]);

  // Тема
  const [isDark, setIsDark] = useState(() => {
    const t = localStorage.getItem('terra-theme');
    return t ? t==='dark' : true;
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('terra-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  useEffect(() => {
    const s = localStorage.getItem('terra-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', s);
  }, []);

  const dCity   = CITIES.find(c => c.id === (displayUser?.city_id   || displayUser?.cityId));
  const dSchool = SCHOOLS.find(s => s.id === (displayUser?.school_id || displayUser?.schoolId));
  const desiredSchool  = displayUser?.desired_school_id ? SCHOOLS.find(s=>s.id===displayUser.desired_school_id) : null;
  const perms = getPermissions(dRole);

  const handleSave = async () => {
    if (!name.trim()) { setError('Имя не может быть пустым'); return; }
    setSaving(true); setError('');
    const initials = name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const { error:err } = await supabase.from('profiles').update({
      name: name.trim(), initials, bio: bio.trim()||null,
      phone: phone.trim()||null, telegram: tg.trim().replace(/^@/,'')||null,
    }).eq('id', currentUser.id);
    if (err) { setError(err.message); setSaving(false); return; }
    const fresh = await fetchProfile(currentUser.id);
    if (fresh && setCurrentUser) setCurrentUser(fresh);
    setSaved(true); setSaving(false);
    setTimeout(()=>setSaved(false), 2500);
  };

  // Сохранение privacy отдельно при изменении ползунков
  const savePrivacy = async (field, val) => {
    await supabase.from('profiles').update({ [field]: val }).eq('id', currentUser.id);
    const fresh = await fetchProfile(currentUser.id);
    if (fresh && setCurrentUser) setCurrentUser(fresh);
  };

  const togglePhonePub = () => { const v=!phonePub; setPhonePub(v); savePrivacy('phone_visible',v); };
  const toggleEmailPub = () => { const v=!emailPub; setEmailPub(v); savePrivacy('email_visible',v); };
  const toggleTgPub    = () => { const v=!tgPub;    setTgPub(v);    savePrivacy('telegram_visible',v); };

  if (viewUserId && viewUserId !== currentUser?.id && !viewedProfile) {
    return (
      <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 22px', textAlign:'center' }}>
        <div style={{ color:'var(--text3)', fontSize:14 }}>Загрузка профиля...</div>
      </div>
    );
  }

  const tabs = isOwnProfile
    ? [['profile','Профиль'],['settings','Настройки'],['privacy','Приватность'],['access','Доступ'],['dev','🛠 Dev']]
    : [];

  return (
    <div style={{ maxWidth:680, margin:'0 auto', overflowY:'auto', height:'100%', paddingBottom:32 }}>

      {/* Шапка при просмотре чужого профиля */}
      {!isOwnProfile && (
        <div style={{ padding:'16px 22px 0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <button onClick={onClear} className="btn-ghost" style={{ fontSize:13, display:'flex', alignItems:'center', gap:6 }}>← Назад</button>
          {onWriteDm && (
            <button onClick={()=>onWriteDm(displayUser)} style={{ padding:'9px 18px', borderRadius:20, background:'var(--accent)', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8, boxShadow:'0 0 12px var(--accent-glow)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Написать сообщение
            </button>
          )}
        </div>
      )}

      {/* Шапка профиля */}
      <div style={{ padding:'24px 22px 20px', display:'flex', gap:18, alignItems:'center' }}>
        <div style={{ width:72, height:72, borderRadius:24, flexShrink:0, background:displayUser?.color||'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'#fff', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
          {displayUser?.initials||'?'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>{displayUser?.name||'—'}</h2>
            <span className={`badge ${ROLE_BADGE[dRole]||'badge-guest'}`}>{ROLE_LABELS[dRole]||'Гость'}</span>
          </div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:5 }}>
            {dCity ? `${dCity.flag} ${dCity.name}` : '—'}{dSchool ? ` · ${dSchool.icon} ${dSchool.name}` : ''}
          </div>
          {displayUser?.bio && <p style={{ fontSize:14, color:'var(--text2)', marginTop:8, lineHeight:1.5 }}>{displayUser.bio}</p>}
        </div>
      </div>

      {/* Вкладки */}
      {tabs.length > 0 && (
        <div className="tabs" style={{ margin:'0 22px 22px' }}>
          {tabs.map(([t,l]) => (
            <div key={t} className={`tab${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>{l}</div>
          ))}
        </div>
      )}

      <div style={{ padding:'0 22px' }}>

        {/* ── ПРОФИЛЬ ── */}
        {(activeTab==='profile' || !isOwnProfile) && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Контакты</span></div>
              <div style={{ padding:'0 18px' }}>

                {/* Email — виден если email_visible или admin или свой */}
                {visibility.email && displayUser?.email && (
                  <ContactRow icon="📧" label="Email" val={displayUser.email}/>
                )}
                {/* Телефон */}
                {visibility.phone && displayUser?.phone && (
                  <ContactRow icon="📱" label="Телефон" val={displayUser.phone}/>
                )}
                {/* Telegram */}
                {visibility.telegram && displayUser?.telegram && (
                  <ContactRow icon="✈️" label="Telegram" val={`@${displayUser.telegram.replace(/^@/,'')}`}/>
                )}
                {/* Если ничего не видно и это чужой профиль */}
                {!isOwnProfile && !visibility.phone && !visibility.email && !visibility.telegram && (
                  <div style={{ padding:'14px 0', fontSize:13, color:'var(--text3)' }}>
                    Пользователь скрыл свои контактные данные.
                  </div>
                )}

                {/* Всегда видимые поля */}
                {[
                  ['🌍','Город',  dCity  ? `${dCity.flag} ${dCity.name}`   : null],
                  ['📚','Школа',  dSchool? `${dSchool.icon} ${dSchool.name}`: null],
                  ['🔄','Поток',  displayUser?.stream_number  ? `Поток ${displayUser.stream_number}` : null],
                  ['📖','Модуль', displayUser?.current_module ? `Модуль ${displayUser.current_module}`: null],
                ].filter(([,,v])=>v).map(([icon,label,val])=>(
                  <ContactRow key={label} icon={icon} label={label} val={val}/>
                ))}
              </div>
            </div>

            {/* Заявка при регистрации — только для admin и только если гость */}
            {isAdmin && dRole==='guest' && (displayUser?.desired_role) && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📋 Заявка при регистрации</span>
                  <span style={{ fontSize:11, color:'var(--amber)', background:'var(--amber-dim)', padding:'2px 8px', borderRadius:8 }}>Только для руководства</span>
                </div>
                <div style={{ padding:'0 18px' }}>
                  <ContactRow icon="🎯" label="Желаемая роль" val={DESIRED_ROLE_LABELS[displayUser.desired_role]||displayUser.desired_role}/>
                  {desiredSchool && <ContactRow icon={desiredSchool.icon} label="Желаемая школа" val={desiredSchool.name}/>}
                  {displayUser?.desired_mentor_id && <DesiredMentorRow mentorId={displayUser.desired_mentor_id}/>}
                  {/* Контакты гостя — всегда видны для admin */}
                  {displayUser?.phone    && <ContactRow icon="📱" label="Телефон" val={displayUser.phone}/>}
                  {displayUser?.telegram && <ContactRow icon="✈️" label="Telegram" val={`@${displayUser.telegram.replace(/^@/,'')}`}/>}
                </div>
              </div>
            )}

            {/* У admin — показываем desired_role и после назначения роли (не гость) */}
            {isAdmin && dRole!=='guest' && displayUser?.desired_role && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">История заявки</span>
                  <span style={{ fontSize:11, color:'var(--text3)' }}>Только для руководства</span>
                </div>
                <div style={{ padding:'0 18px' }}>
                  <ContactRow icon="🎯" label="Изначально хотел" val={DESIRED_ROLE_LABELS[displayUser.desired_role]||displayUser.desired_role}/>
                  {desiredSchool && <ContactRow icon={desiredSchool.icon} label="Школа из заявки" val={desiredSchool.name}/>}
                </div>
              </div>
            )}

            {isOwnProfile && (
              <button onClick={logout} className="btn-danger" style={{ alignSelf:'flex-start' }}>Выйти из аккаунта</button>
            )}
          </div>
        )}

        {/* ── НАСТРОЙКИ ── */}
        {activeTab==='settings' && isOwnProfile && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Основные данные</span></div>
              <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label className="form-label">Имя и фамилия</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)}/>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" value={currentUser?.email||''} disabled style={{ opacity:0.5, cursor:'not-allowed' }}/>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Email изменить нельзя — обратитесь к администратору</div>
                </div>
                <div>
                  <label className="form-label">Номер телефона</label>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 (999) 123-45-67"/>
                </div>
                <div>
                  <label className="form-label">Telegram</label>
                  <input type="text" value={tg} onChange={e=>setTg(e.target.value)} placeholder="@username"/>
                </div>
                <div>
                  <label className="form-label">О себе</label>
                  <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Расскажите о себе..."/>
                </div>
                {error && <div style={{ background:'var(--red-dim)', color:'var(--red)', padding:'10px 14px', borderRadius:12, fontSize:14 }}>{error}</div>}
                {saved && <div style={{ background:'var(--green-dim)', color:'var(--green)', padding:'10px 14px', borderRadius:12, fontSize:14 }}>✅ Сохранено!</div>}
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ alignSelf:'flex-start' }}>{saving?'Сохраняю...':'Сохранить изменения'}</button>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Внешний вид</span></div>
              <div className="card-body">
                <ToggleRow label="Тёмная тема" sublabel={isDark?'Включена':'Выключена'} on={isDark} onChange={()=>setIsDark(v=>!v)}/>
              </div>
            </div>
          </div>
        )}

        {/* ── ПРИВАТНОСТЬ ── */}
        {activeTab==='privacy' && isOwnProfile && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Видимость контактов</span></div>
              <div style={{ padding:'8px 18px 4px', fontSize:13, color:'var(--text3)' }}>
                Руководство и администратор всегда видят ваши данные. Ниже вы управляете видимостью для остальных участников.
              </div>
              <div style={{ padding:'0 18px' }}>
                <ToggleRow
                  label="Показывать Email"
                  sublabel={emailPub ? `${currentUser?.email} — виден всем` : 'Скрыт от других участников'}
                  on={emailPub} onChange={toggleEmailPub}/>
                <ToggleRow
                  label="Показывать телефон"
                  sublabel={phonePub ? (currentUser?.phone||'Телефон не указан') + ' — виден всем' : 'Скрыт от других участников'}
                  on={phonePub} onChange={togglePhonePub}/>
                <ToggleRow
                  label="Показывать Telegram"
                  sublabel={tgPub ? (currentUser?.telegram ? `@${currentUser.telegram.replace(/^@/,'')}` : 'Telegram не указан') + ' — виден всем' : 'Скрыт от других участников'}
                  on={tgPub} onChange={toggleTgPub}/>
              </div>
              <div style={{ padding:'12px 18px', margin:'0 0 4px', background:'var(--amber-dim)', borderRadius:'0 0 var(--r) var(--r)', fontSize:12, color:'var(--amber)' }}>
                💡 По умолчанию все данные скрыты. Включайте только то, чем готовы поделиться со всеми участниками клуба.
              </div>
            </div>
          </div>
        )}

        {/* ── ДОСТУП ── */}
        {activeTab==='access' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Права доступа</span>
              <span className={`badge ${ROLE_BADGE[dRole]||'badge-guest'}`}>{ROLE_LABELS[dRole]}</span>
            </div>
            <div style={{ padding:'0 18px' }}>
              {perms.map(p=>(<ToggleRow key={p.label} label={p.label} sublabel={p.sub} on={p.has} disabled={true}/>))}
            </div>
            {dRole==='guest' && (
              <div style={{ margin:'0 18px 18px', padding:'12px 14px', background:'var(--amber-dim)', borderRadius:12, fontSize:13, color:'var(--amber)' }}>
                💡 Роль «Гость». Обратитесь к администратору.
              </div>
            )}
          </div>
        )}

        {/* ── DEV ── */}
        {activeTab==='dev' && <DevPanel inline/>}
      </div>
    </div>
  );
}

// ── Строка контакта ──────────────────────────────────────────
function ContactRow({ icon, label, val }) {
  return (
    <div style={{ display:'flex', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:18, width:24, textAlign:'center', flexShrink:0 }}>{icon}</span>
      <div><div style={{ fontSize:12, color:'var(--text3)' }}>{label}</div><div style={{ fontSize:15, marginTop:1, color:'var(--text)' }}>{val}</div></div>
    </div>
  );
}

// Подгружаем имя наставника по id
function DesiredMentorRow({ mentorId }) {
  const [name, setName] = useState('Загрузка...');
  useEffect(()=>{
    supabase.from('profiles').select('name').eq('id',mentorId).single()
      .then(({data})=>setName(data?.name||'Наставник'));
  },[mentorId]);
  return <ContactRow icon="🌱" label="Желаемый наставник" val={name}/>;
}
