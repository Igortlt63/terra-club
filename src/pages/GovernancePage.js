import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';
import { CITIES } from '../data/db';

// ── Уровни должностей ───────────────────────────────────────
const LEVELS = [
  { value: 1, label: 'Президент',              color: '#F59E0B' },
  { value: 2, label: 'Руководитель отдела',    color: '#3B82F6' },
  { value: 3, label: 'Заместитель',             color: '#8B5CF6' },
  { value: 4, label: 'Руководитель направления',color: '#10B981' },
  { value: 5, label: 'Куратор',                 color: '#6B7280' },
];

const DEPARTMENTS = [
  'Образование', 'Наставничество', 'Маркетинг', 'HR',
  'Финансы', 'Мероприятия', 'IT', 'PR', 'Продажи', 'Другое',
];

function getLevelInfo(level) {
  return LEVELS.find(l => l.value === level) || LEVELS[4];
}

// ── Проверка: является ли текущий пользователь президентом города ──
function useIsPresident(cityId) {
  const { currentUser } = useApp();
  const [isPresident, setIsPresident] = useState(false);

  useEffect(() => {
    if (!currentUser || !cityId) return;
    // admin всегда может управлять
    if (currentUser.role === 'admin') { setIsPresident(true); return; }

    supabase
      .from('positions')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('city_id', cityId)
      .eq('level', 1)
      .single()
      .then(({ data }) => setIsPresident(!!data));
  }, [currentUser, cityId]);

  return isPresident;
}

// ── Модалка: назначить / редактировать должность ────────────
function PositionModal({ position, cityId, onClose, onSaved }) {
  const { currentUser } = useApp();
  const [userId,     setUserId]     = useState(position?.user_id || '');
  const [title,      setTitle]      = useState(position?.title || '');
  const [department, setDepartment] = useState(position?.department || '');
  const [level,      setLevel]      = useState(position?.level || 2);
  const [canEditRoles,  setCanEditRoles]  = useState(position?.permissions?.can_edit_roles  || false);
  const [canInvite,     setCanInvite]     = useState(position?.permissions?.can_invite      || false);
  const [canManageChat, setCanManageChat] = useState(position?.permissions?.can_manage_chat || false);
  const [users,   setUsers]   = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Загружаем участников города
  useEffect(() => {
    supabase.from('profiles').select('id, name, initials, color, role, email')
      .eq('city_id', cityId)
      .then(({ data }) => setUsers(data || []));
  }, [cityId]);

  const handleSave = async () => {
    if (!userId)    { setError('Выберите участника'); return; }
    if (!title.trim()) { setError('Введите название должности'); return; }
    setSaving(true); setError('');

    const payload = {
      city_id:     cityId,
      user_id:     userId,
      title:       title.trim(),
      department:  department || null,
      level,
      permissions: { can_edit_roles: canEditRoles, can_invite: canInvite, can_manage_chat: canManageChat },
      assigned_by: currentUser.id,
    };

    const { error: err } = position?.id
      ? await supabase.from('positions').update(payload).eq('id', position.id)
      : await supabase.from('positions').insert(payload);

    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  const selectedUser = users.find(u => u.id === userId);

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.sheet} onClick={e => e.stopPropagation()}>
        <div style={MS.handle} />
        <div style={MS.header}>
          <span style={MS.title}>{position ? 'Редактировать должность' : 'Назначить должность'}</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>

          {/* Участник */}
          <div style={F.field}>
            <label style={F.label}>Участник города</label>
            <select value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Выберите участника...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.role} ({u.email})</option>
              ))}
            </select>
            {selectedUser && (
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, padding:'8px 12px', background:'var(--accent-dim)', borderRadius:10 }}>
                <div className="avatar avatar-sm" style={{ background:selectedUser.color||'var(--accent)' }}>{selectedUser.initials}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{selectedUser.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{selectedUser.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* Уровень */}
          <div style={F.field}>
            <label style={F.label}>Уровень должности</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {LEVELS.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => { setLevel(l.value); if (l.value === 1) setTitle('Президент'); }}
                  style={{
                    padding:'10px 14px', borderRadius:10, border:'none', cursor:'pointer',
                    background: level === l.value ? l.color : 'var(--bg-overlay)',
                    color: level === l.value ? '#fff' : 'var(--text2)',
                    fontFamily:'inherit', fontSize:13, fontWeight: level===l.value ? 600 : 400,
                    textAlign:'left', transition:'all 0.15s',
                    boxShadow: level===l.value ? `0 0 12px ${l.color}50` : 'none',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Название должности */}
          <div style={F.field}>
            <label style={F.label}>Название должности</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Например: Президент Терра-Тольятти"
            />
          </div>

          {/* Отдел */}
          <div style={F.field}>
            <label style={F.label}>Отдел / департамент</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">Общее руководство</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Права доступа */}
          <div style={F.field}>
            <label style={F.label}>Дополнительные права</label>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                [canEditRoles,  setCanEditRoles,  'Управление ролями участников',      'Может назначать роли (student, teacher, mentor...)'],
                [canInvite,     setCanInvite,     'Приглашение участников',            'Может приглашать новых участников в город'],
                [canManageChat, setCanManageChat, 'Управление каналами чата',          'Может создавать и удалять каналы'],
              ].map(([val, setter, label, sub]) => (
                <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-overlay)', borderRadius:10 }}>
                  <div>
                    <div style={{ fontSize:14, color:'var(--text)', fontWeight:500 }}>{label}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{sub}</div>
                  </div>
                  <div
                    onClick={() => setter(v => !v)}
                    style={{
                      width:46, height:28, borderRadius:14, flexShrink:0, cursor:'pointer',
                      background: val ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                      border: val ? 'none' : '1px solid var(--border2)',
                      position:'relative', transition:'all 0.22s',
                      boxShadow: val ? '0 0 12px var(--accent-glow)' : 'none',
                    }}
                  >
                    <div style={{
                      position:'absolute', top:3, left: val ? 21 : 3,
                      width:20, height:20, borderRadius:'50%', background:'#fff',
                      boxShadow:'0 2px 6px rgba(0,0,0,0.3)',
                      transition:'left 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ background:'var(--red-dim)', color:'var(--red)', padding:'10px 14px', borderRadius:10, fontSize:13 }}>{error}</div>}
        </div>
        <div style={MS.footer}>
          <button onClick={onClose} className="btn-secondary">Отмена</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Сохраняю...' : position ? 'Сохранить' : 'Назначить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Карточка должности ──────────────────────────────────────
function PositionCard({ pos, profile, onEdit, onDelete, canManage }) {
  const lvl = getLevelInfo(pos.level);
  const perms = pos.permissions || {};

  return (
    <div style={{
      background:'var(--bg-raised)', border:'1px solid var(--border)',
      borderRadius:'var(--r)', overflow:'hidden',
      borderLeft: `3px solid ${lvl.color}`,
    }}>
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          {/* Аватар */}
          <div className="avatar avatar-md" style={{ background: profile?.color||'var(--accent)', flexShrink:0 }}>
            {profile?.initials||'?'}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            {/* Имя и уровень */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <span style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{profile?.name||'—'}</span>
              <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background: lvl.color+'25', color: lvl.color }}>
                {lvl.label}
              </span>
            </div>

            {/* Должность */}
            <div style={{ fontSize:14, fontWeight:600, color:'var(--accent-bright)', marginBottom:2 }}>{pos.title}</div>

            {/* Отдел и роль */}
            <div style={{ fontSize:12, color:'var(--text3)' }}>
              {pos.department && <span>{pos.department} · </span>}
              <span>{profile?.email}</span>
            </div>

            {/* Доп права */}
            {(perms.can_edit_roles || perms.can_invite || perms.can_manage_chat) && (
              <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                {perms.can_edit_roles  && <span style={TAG}>Роли</span>}
                {perms.can_invite      && <span style={TAG}>Приглашения</span>}
                {perms.can_manage_chat && <span style={TAG}>Чат</span>}
              </div>
            )}
          </div>

          {/* Кнопки управления */}
          {canManage && (
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button onClick={() => onEdit(pos)} className="btn-ghost" style={{ padding:'6px 10px', fontSize:12 }}>✏️</button>
              <button onClick={() => onDelete(pos.id)} style={{ ...BTN_DEL }}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Главный компонент ───────────────────────────────────────
export default function GovernancePage() {
  const { currentUser } = useApp();
  const role = currentUser?.role;

  const [selectedCity, setSelectedCity] = useState(currentUser?.city_id || '');
  const [positions,    setPositions]    = useState([]);
  const [profiles,     setProfiles]     = useState({});
  const [loading,      setLoading]      = useState(false);
  const [modal,        setModal]        = useState(null); // null | 'new' | position object
  const isPresident = useIsPresident(selectedCity);

  // Загрузить должности города
  const loadPositions = useCallback(async () => {
    if (!selectedCity) return;
    setLoading(true);

    const { data: pos } = await supabase
      .from('positions')
      .select('*')
      .eq('city_id', selectedCity)
      .order('level', { ascending: true });

    if (pos && pos.length > 0) {
      // Загружаем профили всех назначенных
      const ids = [...new Set(pos.map(p => p.user_id).filter(Boolean))];
      const { data: prof } = await supabase
        .from('profiles').select('*').in('id', ids);

      const profMap = {};
      (prof || []).forEach(p => { profMap[p.id] = p; });
      setProfiles(profMap);
    }

    setPositions(pos || []);
    setLoading(false);
  }, [selectedCity]);

  useEffect(() => { loadPositions(); }, [loadPositions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту должность?')) return;
    await supabase.from('positions').delete().eq('id', id);
    loadPositions();
  };

  // Группировка по уровням
  const grouped = {};
  positions.forEach(pos => {
    const key = pos.level;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(pos);
  });

  const city = CITIES.find(c => c.id === selectedCity);

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'20px 20px 32px', background:'var(--bg-surface)' }}>

      {/* Шапка */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>Руководство</h2>
          <p style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            Должности и структура управления
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            style={{ padding:'9px 14px', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', fontSize:14, background:'var(--bg-raised)', color:'var(--text)', minWidth:180 }}
          >
            <option value="">Выберите город...</option>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
          {isPresident && selectedCity && (
            <button onClick={() => setModal('new')} className="btn-primary">
              + Назначить
            </button>
          )}
        </div>
      </div>

      {/* Подсказка для не-президентов */}
      {selectedCity && !isPresident && role !== 'admin' && (
        <div style={{ background:'var(--amber-dim)', border:'1px solid var(--amber)', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--amber)' }}>
          Управлять должностями может только Президент города или администратор системы.
        </div>
      )}

      {/* Нет города */}
      {!selectedCity && (
        <div className="empty-state">
          <div className="icon">🏛</div>
          <p>Выберите город чтобы увидеть структуру руководства</p>
        </div>
      )}

      {/* Загрузка */}
      {loading && selectedCity && (
        <div style={{ textAlign:'center', color:'var(--text3)', padding:40 }}>Загрузка...</div>
      )}

      {/* Нет должностей */}
      {!loading && selectedCity && positions.length === 0 && (
        <div className="empty-state">
          <div className="icon">🏛</div>
          <p>Должности ещё не назначены.<br/>{isPresident ? 'Нажмите «Назначить» чтобы добавить первую.' : 'Обратитесь к президенту города.'}</p>
        </div>
      )}

      {/* Структура по уровням */}
      {!loading && Object.entries(grouped)
        .sort(([a],[b]) => Number(a)-Number(b))
        .map(([level, items]) => {
          const lvl = getLevelInfo(Number(level));
          return (
            <div key={level} style={{ marginBottom:28 }}>
              {/* Заголовок уровня */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:lvl.color, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:700, color:lvl.color, textTransform:'uppercase', letterSpacing:0.5 }}>
                  {lvl.label}
                </span>
                <span style={{ fontSize:12, color:'var(--text4)', marginLeft:4 }}>{items.length} чел.</span>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>

              {/* Карточки */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12 }}>
                {items.map(pos => (
                  <PositionCard
                    key={pos.id}
                    pos={pos}
                    profile={profiles[pos.user_id]}
                    onEdit={p => setModal(p)}
                    onDelete={handleDelete}
                    canManage={isPresident}
                  />
                ))}
              </div>
            </div>
          );
        })
      }

      {/* Инфо о правах */}
      {selectedCity && positions.length > 0 && (
        <div style={{ marginTop:8, padding:'12px 16px', background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:13, color:'var(--text3)' }}>
          Должности в Терра Клуб не заменяют роли — участник может одновременно быть Президентом города и Преподавателем школы или Наставником.
        </div>
      )}

      {/* Модалка */}
      {modal && (
        <PositionModal
          position={modal === 'new' ? null : modal}
          cityId={selectedCity}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadPositions(); }}
        />
      )}
    </div>
  );
}

// ── Стили ──────────────────────────────────────────────────
const MS = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000, backdropFilter:'blur(8px)' },
  sheet:   { background:'var(--bg-raised)', border:'1px solid var(--glass-border2)', borderRadius:'var(--r-xl) var(--r-xl) 0 0', width:'100%', maxWidth:560, maxHeight:'92vh', display:'flex', flexDirection:'column', paddingBottom:'env(safe-area-inset-bottom,0px)' },
  handle:  { width:38, height:4, borderRadius:2, background:'var(--border2)', margin:'10px auto 0', flexShrink:0 },
  header:  { padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  title:   { fontSize:17, fontWeight:700, color:'var(--text)' },
  close:   { width:30, height:30, borderRadius:'50%', background:'var(--bg-overlay)', border:'none', color:'var(--text3)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  body:    { padding:'16px 20px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:16 },
  footer:  { padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 },
};
const F = {
  field: { display:'flex', flexDirection:'column', gap:7 },
  label: { fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5 },
};
const TAG = { fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--accent-dim)', color:'var(--accent-bright)' };
const BTN_DEL = { width:28, height:28, borderRadius:8, background:'var(--red-dim)', border:'none', color:'var(--red)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' };
