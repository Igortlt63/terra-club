import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CITIES, SCHOOLS } from '../data/db';

const ROLE_LABELS = {
  admin:   'Руководство',
  teacher: 'Преподаватель',
  student: 'Ученик',
  mentor:  'Наставник',
  mentee:  'Наставляемый',
  guest:   'Гость',
  member:  'Участник',
};
const ROLE_BADGE = {
  admin:   'badge-admin',
  teacher: 'badge-teacher',
  student: 'badge-student',
  mentor:  'badge-mentor',
  mentee:  'badge-mentee',
  guest:   'badge-guest',
  member:  'badge-member',
};

// ── Модалка редактирования роли ─────────────────────────────
function EditModal({ user, onClose, onSaved }) {
  const [role,         setRole]         = useState(user.role || 'guest');
  const [cityId,       setCityId]       = useState(user.city_id || '');
  const [schoolId,     setSchoolId]     = useState(user.school_id || '');
  const [streamNumber, setStreamNumber] = useState(user.stream_number || '');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({
        role,
        city_id:       cityId       || null,
        school_id:     schoolId     || null,
        stream_number: streamNumber || null,
      })
      .eq('id', user.id);

    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-raised)', borderRadius: 'var(--r-lg)', padding: 24, width: 400,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          Редактировать участника
        </div>

        {/* Имя (только показ) */}
        <div style={S.field}>
          <label style={S.label}>Участник</label>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#9A9A9A' }}>{user.email}</div>
        </div>

        {/* Роль */}
        <div style={S.field}>
          <label style={S.label}>Роль в системе</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={S.select}>
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Город */}
        <div style={S.field}>
          <label style={S.label}>Город</label>
          <select value={cityId} onChange={e => setCityId(e.target.value)} style={S.select}>
            <option value="">— не выбран —</option>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
        </div>

        {/* Школа (только для student/teacher) */}
        {['student', 'teacher'].includes(role) && (
          <div style={S.field}>
            <label style={S.label}>Школа</label>
            <select value={schoolId} onChange={e => setSchoolId(e.target.value)} style={S.select}>
              <option value="">— не выбрана —</option>
              {SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
        )}

        {/* Поток */}
        {['student', 'mentee'].includes(role) && (
          <div style={S.field}>
            <label style={S.label}>Номер потока</label>
            <input
              type="number" value={streamNumber}
              onChange={e => setStreamNumber(e.target.value)}
              placeholder="например: 12"
              style={{ ...S.select, fontFamily: 'inherit' }}
            />
          </div>
        )}

        {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={S.btnCancel}>Отмена</button>
          <button onClick={handleSave} disabled={saving} style={S.btnSave}>
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Главный компонент ───────────────────────────────────────
export default function CRMPage() {
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [selected,   setSelected]   = useState(null);
  const [editUser,   setEditUser]   = useState(null);

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('CRM load error:', error.message);
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, []);

  const filtered = members.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase())
      || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchCity = filterCity === 'all' || u.city_id === filterCity;
    return matchSearch && matchRole && matchCity;
  });

  const city   = id => CITIES.find(c => c.id === id);
  const school = id => SCHOOLS.find(s => s.id === id);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Таблица */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Панель фильтров */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="  Поиск по имени или email..."
            style={{ width: 240, padding: '7px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, background: 'var(--bg-raised)' }}>
            <option value="all">Все роли</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, background: 'var(--bg-raised)' }}>
            <option value="all">Все города</option>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
          <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 4 }}>
            {loading ? 'Загрузка...' : `${filtered.length} участников`}
          </span>
          <button onClick={loadMembers} style={{
            marginLeft: 'auto', padding: '7px 14px', border: '1px solid var(--border2)',
            borderRadius: 8, fontSize: 12, background: 'var(--bg-raised)', cursor: 'pointer',
          }}>🔄 Обновить</button>
        </div>

        {/* Таблица участников */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
              Загружаю участников...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Участник', 'Роль', 'Город', 'Школа / Группа', 'Действия'].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    style={{
                      borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      background: selected?.id === u.id ? 'rgba(201,146,42,0.06)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (selected?.id !== u.id) e.currentTarget.style.background = 'var(--bg2)'; }}
                    onMouseLeave={e => { if (selected?.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: u.color || '#888' }}>
                          {u.initials || '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge ${ROLE_BADGE[u.role] || 'badge-guest'}`}>
                        {ROLE_LABELS[u.role] || u.role || 'Гость'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>
                      {city(u.city_id) ? `${city(u.city_id).flag} ${city(u.city_id).name}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>
                      {u.school_id
                        ? `${school(u.school_id)?.icon || ''} ${school(u.school_id)?.name || u.school_id}`
                        : u.role === 'mentor' ? '🌱 Ведёт группу'
                        : u.stream_number ? `Поток ${u.stream_number}`
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={e => { e.stopPropagation(); setEditUser(u); }}
                      >✏️ Роль</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
                    Никого не найдено
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Боковая карточка */}
      {selected && (
        <div style={{
          width: 300, borderLeft: '1px solid var(--border)',
          overflowY: 'auto', flexShrink: 0, background: 'var(--bg-raised)',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Карточка участника</span>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', fontSize: 20,
              color: 'var(--text3)', cursor: 'pointer', lineHeight: 1,
            }}>×</button>
          </div>

          <div style={{ padding: '20px 16px' }}>
            {/* Аватар и имя */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20, textAlign: 'center' }}>
              <div className="avatar avatar-xl" style={{ background: selected.color || '#888', width: 64, height: 64, fontSize: 24 }}>
                {selected.initials || '?'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.name}</div>
                <span className={`badge ${ROLE_BADGE[selected.role] || 'badge-guest'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                  {ROLE_LABELS[selected.role] || 'Гость'}
                </span>
              </div>
              {selected.bio && (
                <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{selected.bio}</p>
              )}
            </div>

            {/* Детали */}
            {[
              ['📧', 'Email',   selected.email],
              ['🌍', 'Город',   city(selected.city_id) ? `${city(selected.city_id).flag} ${city(selected.city_id).name}` : null],
              ['📚', 'Школа',   selected.school_id ? school(selected.school_id)?.name : null],
              ['🔄', 'Поток',   selected.stream_number ? `Поток ${selected.stream_number}` : null],
              ['📖', 'Модуль',  selected.current_module ? `Модуль ${selected.current_module}` : null],
            ].map(([icon, label, val]) => val ? (
              <div key={label} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
                  <div style={{ fontSize: 13, marginTop: 1 }}>{val}</div>
                </div>
              </div>
            ) : null)}

            {/* Кнопки */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setEditUser(selected)}
                style={{
                  width: '100%', padding: '9px', borderRadius: 8,
                  background: 'var(--gold)', color: '#fff',
                  border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                ✏️ Изменить роль / город
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования */}
      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); setSelected(null); loadMembers(); }}
        />
      )}
    </div>
  );
}

const S = {
  field:     { marginBottom: 14 },
  label:     { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 },
  select:    { width: '100%', padding: '8px 10px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--bg-raised)' },
  btnCancel: { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg-raised)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  btnSave:   { padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C9922A', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
};
