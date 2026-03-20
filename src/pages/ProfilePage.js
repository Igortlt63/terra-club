import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CITIES, SCHOOLS } from '../data/db';

const ROLE_LABELS = {
  admin: 'Руководство', teacher: 'Преподаватель', student: 'Ученик',
  mentor: 'Наставник', mentee: 'Наставляемый', guest: 'Гость', member: 'Участник',
};

export default function ProfilePage() {
  const { currentUser, logout } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const city = CITIES.find(c => c.id === currentUser?.cityId);
  const school = SCHOOLS.find(s => s.id === currentUser?.schoolId);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* Profile header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div className="avatar avatar-xl" style={{ background: currentUser?.color, width: 80, height: 80, fontSize: 28 }}>{currentUser?.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{currentUser?.name}</h2>
              <span className={`badge badge-${currentUser?.role}`}>{ROLE_LABELS[currentUser?.role]}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>
              {city ? `${city.flag} ${city.name}, ${city.country}` : '—'}
              {school ? ` · ${school.icon} ${school.name}` : ''}
            </div>
            {currentUser?.bio && <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>{currentUser.bio}</p>}
          </div>
          <button className="btn-secondary" style={{ fontSize: 13, flexShrink: 0 }}>✏️ Редактировать</button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {[['profile', '👤 Профиль'], ['settings', '⚙️ Настройки'], ['notifications', '🔔 Уведомления']].map(([t, l]) => (
          <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{l}</div>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Контактная информация</span></div>
            <div className="card-body">
              {[
                ['📧', 'Email', currentUser?.email],
                ['🏙️', 'Город', city ? `${city.flag} ${city.name}` : '—'],
                ['🎓', 'Школа / роль', school ? `${school.icon} ${school.name}` : ROLE_LABELS[currentUser?.role]],
                ['🔄', 'Текущий поток', currentUser?.streamNumber ? `Поток ${currentUser.streamNumber}` : '—'],
              ].map(([icon, label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
                    <div style={{ fontSize: 14, marginTop: 1 }}>{val || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Права доступа</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {getPermissions(currentUser?.role).map(([icon, label, has]) => (
                  <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px', background: has ? '#F0FDF4' : 'var(--bg2)', borderRadius: 8, border: `1px solid ${has ? '#BBF7D0' : 'var(--border)'}` }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: has ? '#15803D' : 'var(--text3)' }}>{label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 14 }}>{has ? '✅' : '🔒'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="btn-danger" onClick={logout} style={{ alignSelf: 'flex-start', fontSize: 13 }}>
            🚪 Выйти из аккаунта
          </button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Настройки профиля</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[['Имя', currentUser?.name], ['Email', currentUser?.email], ['О себе', currentUser?.bio]].map(([label, val]) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>
                {label === 'О себе' ? <textarea defaultValue={val} rows={3} /> : <input type="text" defaultValue={val} />}
              </div>
            ))}
            <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Сохранить изменения</button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Уведомления</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Сообщения в чате', true],
              ['Новые задания', true],
              ['Встречи и события', true],
              ['Новости клуба', true],
              ['Email-дайджест', false],
            ].map(([label, on]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14 }}>{label}</span>
                <div style={{ width: 44, height: 24, background: on ? 'var(--gold)' : 'var(--border2)', borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getPermissions(role) {
  const all = [
    ['💬', 'Общий чат города', true],
    ['📚', 'Кабинет школы', ['student', 'teacher', 'admin'].includes(role)],
    ['🌱', 'Наставничество', ['mentor', 'mentee', 'admin'].includes(role)],
    ['📤', 'Загрузка материалов', ['teacher', 'admin'].includes(role)],
    ['👥', 'CRM участников', role === 'admin'],
    ['📊', 'Аналитика', role === 'admin'],
    ['⚙️', 'Управление школами', role === 'admin'],
    ['🌍', 'Все города', role === 'admin'],
  ];
  return all;
}
