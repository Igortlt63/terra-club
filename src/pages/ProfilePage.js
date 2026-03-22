import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';
import { CITIES, SCHOOLS } from '../data/db';

const ROLE_LABELS = {
  admin: 'Руководство', teacher: 'Преподаватель', student: 'Ученик',
  mentor: 'Наставник',  mentee: 'Наставляемый',   guest: 'Гость', member: 'Участник',
};
const ROLE_BADGE = {
  admin: 'badge-admin', teacher: 'badge-teacher', student: 'badge-student',
  mentor: 'badge-mentor', mentee: 'badge-mentee', guest: 'badge-guest', member: 'badge-member',
};

function getPermissions(role) {
  return [
    ['💬', 'Общий чат города',    true],
    ['📚', 'Кабинет школы',       ['student','teacher','admin'].includes(role)],
    ['🌱', 'Наставничество',      ['mentor','mentee','admin'].includes(role)],
    ['📤', 'Загрузка материалов', ['teacher','admin'].includes(role)],
    ['👥', 'CRM участников',      role === 'admin'],
    ['📊', 'Аналитика',           role === 'admin'],
    ['⚙️', 'Управление ролями',   role === 'admin'],
    ['🌍', 'Все города',          role === 'admin'],
  ];
}

export default function ProfilePage() {
  const { currentUser, setActiveView, logout, fetchProfile } = useApp();

  // Поля формы
  const [name,    setName]    = useState(currentUser?.name    || '');
  const [bio,     setBio]     = useState(currentUser?.bio     || '');

  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const city   = CITIES.find(c => c.id === (currentUser?.city_id || currentUser?.cityId));
  const school = SCHOOLS.find(s => s.id === (currentUser?.school_id || currentUser?.schoolId));

  const handleSave = async () => {
    if (!name.trim()) { setError('Имя не может быть пустым'); return; }
    setSaving(true);
    setError('');

    const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const { error: err } = await supabase
      .from('profiles')
      .update({ name: name.trim(), initials, bio: bio.trim() || null })
      .eq('id', currentUser.id);

    if (err) {
      setError('Ошибка сохранения: ' + err.message);
      setSaving(false);
      return;
    }

    // Обновляем кэш профиля
    await fetchProfile(currentUser.id);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 24, overflowY: 'auto', height: '100%' }}>

      {/* Шапка профиля */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div className="avatar" style={{ background: currentUser?.color, width: 64, height: 64, fontSize: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
            {currentUser?.initials || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{currentUser?.name}</h2>
              <span className={`badge ${ROLE_BADGE[currentUser?.role] || 'badge-guest'}`}>
                {ROLE_LABELS[currentUser?.role] || 'Гость'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>
              {city ? `${city.flag} ${city.name}, ${city.country}` : '—'}
              {school ? ` · ${school.icon} ${school.name}` : ''}
            </div>
            {currentUser?.bio && (
              <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>{currentUser.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[['profile','👤 Профиль'],['settings','⚙️ Настройки'],['access','🔒 Доступ']].map(([t, l]) => (
          <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{l}</div>
        ))}
      </div>

      {/* ПРОФИЛЬ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Контактная информация</span></div>
            <div className="card-body">
              {[
                ['📧', 'Email',  currentUser?.email],
                ['🌍', 'Город',  city ? `${city.flag} ${city.name}` : '—'],
                ['📚', 'Школа',  school ? `${school.icon} ${school.name}` : '—'],
                ['🔄', 'Поток',  currentUser?.stream_number ? `Поток ${currentUser.stream_number}` : '—'],
                ['📖', 'Модуль', currentUser?.current_module ? `Модуль ${currentUser.current_module}` : '—'],
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

          <button
            onClick={logout}
            style={{ alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            🚪 Выйти из аккаунта
          </button>
        </div>
      )}

      {/* НАСТРОЙКИ */}
      {activeTab === 'settings' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Редактировать профиль</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={LS.label}>Имя и фамилия</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                style={LS.input}
              />
            </div>

            <div>
              <label style={LS.label}>Email</label>
              <input
                type="email" value={currentUser?.email || ''} disabled
                style={{ ...LS.input, background: 'var(--bg2)', color: 'var(--text3)', cursor: 'not-allowed' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Email изменить нельзя — он используется для входа
              </div>
            </div>

            <div>
              <label style={LS.label}>О себе</label>
              <textarea
                value={bio} onChange={e => setBio(e.target.value)}
                rows={3} placeholder="Расскажите о себе, о своём проекте..."
                style={{ ...LS.input, resize: 'vertical' }}
              />
            </div>

            {error && (
              <div style={{ color: '#DC2626', fontSize: 13, padding: '8px 12px', background: '#FEF2F2', borderRadius: 6, border: '1px solid #FCA5A5' }}>
                {error}
              </div>
            )}

            {saved && (
              <div style={{ color: '#16A34A', fontSize: 13, padding: '8px 12px', background: '#F0FDF4', borderRadius: 6, border: '1px solid #86EFAC' }}>
                ✅ Изменения сохранены!
              </div>
            )}

            <button
              onClick={handleSave} disabled={saving}
              style={{ alignSelf: 'flex-start', padding: '9px 22px', borderRadius: 8, background: '#C9922A', color: '#fff', border: 'none', fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              {saving ? 'Сохраняю...' : '💾 Сохранить изменения'}
            </button>
          </div>
        </div>
      )}

      {/* ДОСТУП */}
      {activeTab === 'access' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Права доступа — {ROLE_LABELS[currentUser?.role]}</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {getPermissions(currentUser?.role).map(([icon, label, has]) => (
                <div key={label} style={{
                  display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
                  background: has ? '#F0FDF4' : 'var(--bg2)', borderRadius: 8,
                  border: `1px solid ${has ? '#BBF7D0' : 'var(--border)'}`,
                }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: has ? '#15803D' : 'var(--text3)', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 14 }}>{has ? '✅' : '🔒'}</span>
                </div>
              ))}
            </div>
            {currentUser?.role === 'guest' && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 13, color: '#92400E' }}>
                💡 У вас роль «Гость». Обратитесь к администратору чтобы получить доступ к школам и наставничеству.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const LS = {
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
};
