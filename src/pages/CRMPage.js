import React, { useState } from 'react';
import { DEMO_USERS, CITIES, SCHOOLS } from '../data/db';

const ALL_MEMBERS = [
  ...DEMO_USERS,
  { id: 'x1', name: 'Игорь Смирнов', initials: 'ИС', role: 'student', cityId: 'moscow', schoolId: 'negotiations', currentModule: 3, color: '#3B82F6' },
  { id: 'x2', name: 'Наталья Орлова', initials: 'НО', role: 'student', cityId: 'almaty', schoolId: 'ai', currentModule: 2, color: '#EF4444' },
  { id: 'x3', name: 'Тимур Ахметов', initials: 'ТА', role: 'mentor', cityId: 'tashkent', color: '#22C55E' },
  { id: 'x4', name: 'Светлана Иванова', initials: 'СИ', role: 'teacher', cityId: 'minsk', schoolId: 'content', color: '#8B5CF6' },
  { id: 'x5', name: 'Аскар Джаксыбеков', initials: 'АД', role: 'mentee', cityId: 'astana', mentorId: 'x3', color: '#F97316' },
];

const ROLE_LABELS = {
  admin: 'Руководство', teacher: 'Преподаватель', student: 'Ученик',
  mentor: 'Наставник', mentee: 'Наставляемый', guest: 'Гость', member: 'Участник',
};
const ROLE_BADGE = {
  admin: 'badge-admin', teacher: 'badge-teacher', student: 'badge-student',
  mentor: 'badge-mentor', mentee: 'badge-mentee', guest: 'badge-guest', member: 'badge-member',
};

export default function CRMPage() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = ALL_MEMBERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchCity = filterCity === 'all' || u.cityId === filterCity;
    return matchSearch && matchRole && matchCity;
  });

  const city = (id) => CITIES.find(c => c.id === id);
  const school = (id) => SCHOOLS.find(s => s.id === id);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Поиск по имени..." style={{ width: 220, flex: 'none' }} />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 160 }}>
            <option value="all">Все роли</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ width: 160 }}>
            <option value="all">Все города</option>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
          <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 4 }}>{filtered.length} участников</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 12 }}>📤 Экспорт</button>
            <button className="btn-primary" style={{ fontSize: 12 }}>+ Добавить</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Участник', 'Роль', 'Город', 'Школа / Группа', 'Действия'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} onClick={() => setSelectedUser(u)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedUser?.id === u.id ? 'var(--gold-dim)' : 'transparent', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = 'var(--bg2)'; }}
                  onMouseLeave={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: u.color }}>{u.initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>
                    {city(u.cityId) ? `${city(u.cityId).flag} ${city(u.cityId).name}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>
                    {u.schoolId ? `${school(u.schoolId)?.icon || ''} ${school(u.schoolId)?.name || u.schoolId}` : u.role === 'mentor' ? '🌱 Ведёт группу' : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={e => { e.stopPropagation(); }}>✉️</button>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={e => { e.stopPropagation(); setSelectedUser(u); }}>👁</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: 60 }}>
              <div className="icon">🔍</div>
              <p>Ничего не найдено по вашим фильтрам</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: user detail */}
      {selectedUser && (
        <div style={{ width: 300, borderLeft: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0, background: '#fff' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Карточка участника</span>
            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text3)', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ padding: '20px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20, textAlign: 'center' }}>
              <div className="avatar avatar-xl" style={{ background: selectedUser.color }}>{selectedUser.initials}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedUser.name}</div>
                <span className={`badge ${ROLE_BADGE[selectedUser.role]}`} style={{ marginTop: 4 }}>{ROLE_LABELS[selectedUser.role]}</span>
              </div>
              {selectedUser.bio && <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{selectedUser.bio}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                ['📧', 'Email', selectedUser.email || '—'],
                ['🌍', 'Город', city(selectedUser.cityId) ? `${city(selectedUser.cityId).flag} ${city(selectedUser.cityId).name}` : '—'],
                ['📚', 'Школа', selectedUser.schoolId ? school(selectedUser.schoolId)?.name : '—'],
                ['🔄', 'Поток', selectedUser.streamNumber ? `Поток ${selectedUser.streamNumber}` : '—'],
              ].map(([icon, label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
                    <div style={{ fontSize: 13, marginTop: 1 }}>{val || '—'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" style={{ width: '100%' }}>💬 Написать сообщение</button>
              <button className="btn-secondary" style={{ width: '100%' }}>✏️ Редактировать</button>
              <button className="btn-danger" style={{ width: '100%' }}>🚫 Заблокировать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
