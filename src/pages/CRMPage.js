import { useApp } from '../context/AppContext';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CITIES, SCHOOLS } from '../data/db';

const ROLE_LABELS = {
  admin:'Руководство', teacher:'Преподаватель', student:'Ученик',
  mentor:'Наставник',  mentee:'Наставляемый',   guest:'Гость', member:'Участник',
};
const ROLE_BADGE = {
  admin:'badge-admin', teacher:'badge-teacher', student:'badge-student',
  mentor:'badge-mentor', mentee:'badge-mentee', guest:'badge-guest', member:'badge-member',
};
const DESIRED_ROLE_LABELS = {
  student:'Ученик школы', mentee:'Наставляемый',
  member:'Участник клуба', management:'Руководство / Спикер',
};

// ── Модалка редактирования ───────────────────────────────────
function EditModal({ user, onClose, onSaved }) {
  const [role,         setRole]         = useState(user.role||'guest');
  const [cityId,       setCityId]       = useState(user.city_id||'');
  const [schoolId,     setSchoolId]     = useState(user.school_id||'');
  const [mentorId,     setMentorId]     = useState(user.mentor_id||'');
  const [streamNumber, setStreamNumber] = useState(user.stream_number||'');
  const [mentors,      setMentors]      = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  useEffect(()=>{
    supabase.from('profiles').select('id,name,initials,color').eq('role','mentor')
      .then(({data})=>setMentors(data||[]));
  },[]);

  const handleSave = async () => {
    setSaving(true); setError('');
    const { error:err } = await supabase.from('profiles').update({
      role, city_id:cityId||null, school_id:schoolId||null,
      mentor_id:mentorId||null, stream_number:streamNumber||null,
    }).eq('id',user.id);
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }} onClick={onClose}>
      <div style={{ background:'var(--bg-raised)',borderRadius:16,padding:24,width:420,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:16,fontWeight:700,marginBottom:4,color:'var(--text)' }}>Редактировать участника</div>
        <div style={{ fontSize:13,color:'var(--text3)',marginBottom:20 }}>{user.name} · {user.email}</div>

        {/* Заявка при регистрации — видна только для гостей */}
        {user.role==='guest' && user.desired_role && (
          <div style={{ background:'var(--amber-dim)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px',marginBottom:16 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--amber)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8 }}>📋 Заявка при регистрации</div>
            <div style={{ fontSize:13,color:'var(--text)',marginBottom:4 }}>
              Желаемая роль: <strong>{DESIRED_ROLE_LABELS[user.desired_role]||user.desired_role}</strong>
            </div>
            {user.desired_school_id && (()=>{
              const sch = SCHOOLS.find(s=>s.id===user.desired_school_id);
              return sch ? <div style={{ fontSize:13,color:'var(--text)' }}>Школа: <strong>{sch.icon} {sch.name}</strong></div> : null;
            })()}
            {user.phone    && <div style={{ fontSize:13,color:'var(--text)',marginTop:4 }}>📱 {user.phone}</div>}
            {user.telegram && <div style={{ fontSize:13,color:'var(--text)' }}>✈️ @{user.telegram.replace(/^@/,'')}</div>}
          </div>
        )}

        <div style={S.field}>
          <label style={S.label}>Роль в системе</label>
          <select value={role} onChange={e=>setRole(e.target.value)} style={S.select}>
            {Object.entries(ROLE_LABELS).map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
          </select>
        </div>
        <div style={S.field}>
          <label style={S.label}>Город</label>
          <select value={cityId} onChange={e=>setCityId(e.target.value)} style={S.select}>
            <option value="">— не выбран —</option>
            {CITIES.map(c=>(<option key={c.id} value={c.id}>{c.flag} {c.name}</option>))}
          </select>
        </div>
        {['student','teacher'].includes(role) && (
          <div style={S.field}>
            <label style={S.label}>Школа</label>
            <select value={schoolId} onChange={e=>setSchoolId(e.target.value)} style={S.select}>
              <option value="">— не выбрана —</option>
              {SCHOOLS.map(s=>(<option key={s.id} value={s.id}>{s.icon} {s.name}</option>))}
            </select>
          </div>
        )}
        {role==='mentee' && (
          <div style={S.field}>
            <label style={S.label}>Наставник</label>
            <select value={mentorId} onChange={e=>setMentorId(e.target.value)} style={S.select}>
              <option value="">— не назначен —</option>
              {mentors.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </div>
        )}
        {['student','mentee'].includes(role) && (
          <div style={S.field}>
            <label style={S.label}>Номер потока</label>
            <input type="number" value={streamNumber} onChange={e=>setStreamNumber(e.target.value)} placeholder="например: 12" style={{ ...S.select,fontFamily:'inherit' }}/>
          </div>
        )}
        {error && <div style={{ color:'var(--red)',fontSize:13,marginBottom:12 }}>{error}</div>}
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:8 }}>
          <button onClick={onClose} style={S.btnCancel}>Отмена</button>
          <button onClick={handleSave} disabled={saving} style={S.btnSave}>{saving?'Сохраняю...':'Сохранить'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────
export default function CRMPage({ onOpenDm, onOpenProfile }) {
  const { currentUser } = useApp();
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [selected,   setSelected]   = useState(null);
  const [editUser,   setEditUser]   = useState(null);

  const isAdmin = ['admin'].includes(currentUser?.role);

  const loadMembers = async () => {
    setLoading(true);
    const { data,error } = await supabase.from('profiles').select('*').order('created_at',{ascending:false});
    if (error) console.error('CRM load error:', error.message);
    setMembers(data||[]); setLoading(false);
  };
  useEffect(()=>{ loadMembers(); },[]);

  const filtered = members.filter(u=>{
    const ms = (u.name||'').toLowerCase().includes(search.toLowerCase())||(u.email||'').toLowerCase().includes(search.toLowerCase());
    const mr = filterRole==='all' || u.role===filterRole;
    const mc = filterCity==='all' || u.city_id===filterCity;
    return ms&&mr&&mc;
  });

  const city   = id => CITIES.find(c=>c.id===id);
  const school = id => SCHOOLS.find(s=>s.id===id);

  return (
    <div style={{ display:'flex',height:'100%',overflow:'hidden' }}>

      {/* ── Список ── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
        {/* Фильтры */}
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',gap:10,flexShrink:0,flexWrap:'wrap',alignItems:'center' }}>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по имени или email..."
            style={{ width:240,padding:'7px 12px',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit',background:'var(--bg-overlay)',color:'var(--text)' }}/>
          <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
            style={{ padding:'7px 12px',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,background:'var(--bg-raised)',color:'var(--text)' }}>
            <option value="all">Все роли</option>
            {Object.entries(ROLE_LABELS).map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
          </select>
          <select value={filterCity} onChange={e=>setFilterCity(e.target.value)}
            style={{ padding:'7px 12px',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,background:'var(--bg-raised)',color:'var(--text)' }}>
            <option value="all">Все города</option>
            {CITIES.map(c=>(<option key={c.id} value={c.id}>{c.flag} {c.name}</option>))}
          </select>
          <span style={{ fontSize:13,color:'var(--text3)',marginLeft:4 }}>{loading?'Загрузка...':`${filtered.length} участников`}</span>
          <button onClick={loadMembers} style={{ marginLeft:'auto',padding:'7px 14px',border:'1px solid var(--border2)',borderRadius:8,fontSize:12,background:'var(--bg-raised)',color:'var(--text)',cursor:'pointer' }}>🔄 Обновить</button>
        </div>

        {/* Таблица */}
        <div style={{ flex:1,overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:40,textAlign:'center',color:'var(--text3)',fontSize:14 }}>Загружаю участников...</div>
          ) : (
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg2)',position:'sticky',top:0,zIndex:1 }}>
                  {['Участник','Роль','Город','Школа / Группа','Действия'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u=>(
                  <tr key={u.id} onClick={()=>setSelected(u)}
                    style={{ borderBottom:'1px solid var(--border)',cursor:'pointer',background:selected?.id===u.id?'rgba(201,146,42,0.06)':'transparent' }}
                    onMouseEnter={e=>{ if(selected?.id!==u.id) e.currentTarget.style.background='var(--bg2)'; }}
                    onMouseLeave={e=>{ if(selected?.id!==u.id) e.currentTarget.style.background='transparent'; }}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div className="avatar avatar-sm" style={{ background:u.color||'#888' }}>{u.initials||'?'}</div>
                        <div>
                          <div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{u.name||'—'}</div>
                          <div style={{ fontSize:11,color:'var(--text3)' }}>{u.email||'—'}</div>
                          {/* Телефон/telegram для admin — видны сразу в таблице */}
                          {isAdmin && u.phone    && <div style={{ fontSize:11,color:'var(--text3)' }}>📱 {u.phone}</div>}
                          {isAdmin && u.telegram && <div style={{ fontSize:11,color:'var(--text3)' }}>✈️ @{u.telegram.replace(/^@/,'')}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span className={`badge ${ROLE_BADGE[u.role]||'badge-guest'}`}>{ROLE_LABELS[u.role]||'Гость'}</span>
                      {/* Желаемая роль для гостей */}
                      {isAdmin && u.role==='guest' && u.desired_role && (
                        <div style={{ fontSize:10,color:'var(--amber)',marginTop:3 }}>
                          → {DESIRED_ROLE_LABELS[u.desired_role]||u.desired_role}
                        </div>
                      )}
                    </td>
                    <td style={{ padding:'10px 14px',fontSize:13,color:'var(--text2)' }}>
                      {city(u.city_id) ? `${city(u.city_id).flag} ${city(u.city_id).name}` : '—'}
                    </td>
                    <td style={{ padding:'10px 14px',fontSize:13,color:'var(--text2)' }}>
                      {u.school_id ? `${school(u.school_id)?.icon||''} ${school(u.school_id)?.name||u.school_id}`
                        : u.role==='mentor' ? '🌱 Ведёт группу'
                        : u.stream_number ? `Поток ${u.stream_number}` : '—'}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex',gap:6 }}>
                        <button className="btn-ghost" style={{ fontSize:11,padding:'4px 10px' }} onClick={e=>{e.stopPropagation();setEditUser(u);}}>✏️ Роль</button>
                        <button className="btn-ghost" style={{ fontSize:11,padding:'4px 10px' }} onClick={e=>{e.stopPropagation();onOpenDm?.(u);}}>💬</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && !loading && (
                  <tr><td colSpan={5} style={{ padding:40,textAlign:'center',color:'var(--text3)' }}>Никого не найдено</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Боковая карточка ── */}
      {selected && (
        <div style={{ width:320,borderLeft:'1px solid var(--border)',overflowY:'auto',flexShrink:0,background:'var(--bg-raised)' }}>
          <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span style={{ fontSize:14,fontWeight:600,color:'var(--text)' }}>Карточка участника</span>
            <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',fontSize:20,color:'var(--text3)',cursor:'pointer',lineHeight:1 }}>×</button>
          </div>

          <div style={{ padding:'20px 16px' }}>
            {/* Аватар */}
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:20,textAlign:'center' }}>
              <div style={{ width:64,height:64,borderRadius:20,background:selected.color||'#888',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:'#fff' }}>
                {selected.initials||'?'}
              </div>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:'var(--text)' }}>{selected.name}</div>
                <span className={`badge ${ROLE_BADGE[selected.role]||'badge-guest'}`} style={{ marginTop:6,display:'inline-block' }}>
                  {ROLE_LABELS[selected.role]||'Гость'}
                </span>
              </div>
              {selected.bio && <p style={{ fontSize:12,color:'var(--text3)',lineHeight:1.5 }}>{selected.bio}</p>}
            </div>

            {/* Заявка при регистрации — только для admin, только для гостей */}
            {isAdmin && selected.role==='guest' && selected.desired_role && (
              <div style={{ background:'var(--amber-dim)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px',marginBottom:14 }}>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--amber)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8 }}>📋 Заявка при регистрации</div>
                <DetailRow icon="🎯" label="Желаемая роль" val={DESIRED_ROLE_LABELS[selected.desired_role]||selected.desired_role}/>
                {selected.desired_school_id && (()=>{
                  const sch = SCHOOLS.find(s=>s.id===selected.desired_school_id);
                  return sch ? <DetailRow icon={sch.icon} label="Желаемая школа" val={sch.name}/> : null;
                })()}
                {selected.desired_mentor_id && <DesiredMentorDetail mentorId={selected.desired_mentor_id}/>}
              </div>
            )}

            {/* Контакты — admin видит всегда */}
            {[
              ['📧','Email',   selected.email],
              ['📱','Телефон', isAdmin ? selected.phone : (selected.phone_visible ? selected.phone : null)],
              ['✈️','Telegram', isAdmin && selected.telegram ? `@${selected.telegram.replace(/^@/,'')}` : (selected.telegram_visible && selected.telegram ? `@${selected.telegram.replace(/^@/,'')}` : null)],
              ['🌍','Город',   city(selected.city_id) ? `${city(selected.city_id).flag} ${city(selected.city_id).name}` : null],
              ['📚','Школа',   selected.school_id ? `${school(selected.school_id)?.icon||''} ${school(selected.school_id)?.name||''}` : null],
              ['🔄','Поток',   selected.stream_number ? `Поток ${selected.stream_number}` : null],
              ['📖','Модуль',  selected.current_module ? `Модуль ${selected.current_module}` : null],
            ].map(([icon,label,val]) => val ? <DetailRow key={label} icon={icon} label={label} val={val}/> : null)}

            {/* Кнопки действий */}
            <div style={{ marginTop:16,display:'flex',flexDirection:'column',gap:8 }}>
              <button onClick={()=>onOpenDm?.(selected)}
                style={{ width:'100%',padding:'10px',borderRadius:10,background:'var(--accent-dim)',border:'1px solid var(--border)',color:'var(--accent-bright)',cursor:'pointer',fontFamily:'inherit',fontSize:14,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Написать сообщение
              </button>
              {onOpenProfile && (
                <button onClick={()=>onOpenProfile(selected.id)}
                  style={{ width:'100%',padding:'9px',borderRadius:8,background:'var(--bg-overlay)',border:'1px solid var(--border)',color:'var(--text2)',cursor:'pointer',fontFamily:'inherit',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  👤 Открыть профиль
                </button>
              )}
              <button onClick={()=>setEditUser(selected)}
                style={{ width:'100%',padding:'9px',borderRadius:8,background:'var(--gold)',color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>
                ✏️ Изменить роль / город
              </button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <EditModal user={editUser} onClose={()=>setEditUser(null)}
          onSaved={()=>{ setEditUser(null); setSelected(null); loadMembers(); }}/>
      )}
    </div>
  );
}

function DetailRow({ icon, label, val }) {
  return (
    <div style={{ display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:15,width:20,textAlign:'center',flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:11,color:'var(--text3)' }}>{label}</div>
        <div style={{ fontSize:13,marginTop:1,color:'var(--text)',wordBreak:'break-all' }}>{val}</div>
      </div>
    </div>
  );
}

function DesiredMentorDetail({ mentorId }) {
  const [name, setName] = useState('Загрузка...');
  useEffect(()=>{
    supabase.from('profiles').select('name').eq('id',mentorId).single()
      .then(({data})=>setName(data?.name||'Наставник'));
  },[mentorId]);
  return <DetailRow icon="🌱" label="Желаемый наставник" val={name}/>;
}

const S = {
  field:     { marginBottom:14 },
  label:     { display:'block',fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:6 },
  select:    { width:'100%',padding:'8px 10px',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,outline:'none',background:'var(--bg-overlay)',color:'var(--text)' },
  btnCancel: { padding:'8px 16px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg-raised)',color:'var(--text)',fontSize:13,cursor:'pointer',fontFamily:'inherit' },
  btnSave:   { padding:'8px 20px',borderRadius:8,border:'none',background:'#C9922A',color:'#fff',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500 },
};
