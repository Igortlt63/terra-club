import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';
import { SCHOOLS, CITIES } from '../data/db';

const ROLES = [
  { id: 'admin',   label: 'Руководство',    icon: '⚙️',  badge: 'badge-admin',   desc: 'Дашборд, CRM, все города' },
  { id: 'teacher', label: 'Преподаватель',  icon: '👨‍🏫', badge: 'badge-teacher', desc: 'Кабинет школы, задания, модули' },
  { id: 'student', label: 'Ученик',         icon: '🎓',  badge: 'badge-student', desc: 'Кабинет ученика, задания' },
  { id: 'mentor',  label: 'Наставник',      icon: '🌱',  badge: 'badge-mentor',  desc: 'Наставляемые, задания' },
  { id: 'mentee',  label: 'Наставляемый',   icon: '🌿',  badge: 'badge-mentee',  desc: 'Группа наставника' },
  { id: 'guest',   label: 'Гость',          icon: '👤',  badge: 'badge-guest',   desc: 'Только общий чат' },
  { id: 'developer', label: 'Разработчик',  icon: '🛠️',  badge: 'badge-admin',   desc: 'Эта панель' },
];

export default function DevPanel() {
  const { currentUser, fetchProfile, setActiveView } = useApp();
  const [saving,      setSaving]      = useState(false);
  const [savedRole,   setSavedRole]   = useState(null);
  const [schoolId,    setSchoolId]    = useState(currentUser?.school_id || '');
  const [cityId,      setCityId]      = useState(currentUser?.city_id   || '');
  const [mentorId,    setMentorId]    = useState(currentUser?.mentor_id || '');
  const [error,       setError]       = useState('');

  // Применить роль — обновляем профиль в Supabase и перезагружаем currentUser
  const applyRole = async (role) => {
    setSaving(true);
    setError('');

    const update = {
      role,
      school_id: ['student', 'teacher'].includes(role) ? (schoolId || null) : null,
      city_id:   cityId || null,
      mentor_id: role === 'mentee' ? (mentorId || null) : null,
    };

    const { error: err } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', currentUser.id);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    // Перезагружаем профиль — currentUser обновится
    await fetchProfile(currentUser.id);

    setSavedRole(role);
    setSaving(false);

    // Переходим на нужный экран
    setTimeout(() => {
      if (role === 'admin')   setActiveView('dashboard');
      else if (['student','teacher'].includes(role)) setActiveView('schools');
      else if (['mentor','mentee'].includes(role))   setActiveView('mentoring');
      else setActiveView('chat');
    }, 800);
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', maxWidth: 700, margin: '0 auto' }}>

      {/* Заголовок */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1E1E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛠️</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Панель разработчика</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Переключайте роли без смены аккаунта</p>
          </div>
        </div>
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E' }}>
          ⚠️ Изменения применяются к вашему реальному профилю в базе данных. После переключения роли вы попадёте в соответствующий кабинет.
        </div>
      </div>

      {/* Текущий профиль */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Текущий профиль</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar avatar-md" style={{ background: currentUser?.color }}>{currentUser?.initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{currentUser?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{currentUser?.email}</div>
            </div>
            <span className={`badge ${ROLES.find(r => r.id === currentUser?.role)?.badge || 'badge-guest'}`} style={{ marginLeft: 'auto' }}>
              {ROLES.find(r => r.id === currentUser?.role)?.label || currentUser?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Настройки контекста */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">⚙️ Настройки контекста</span></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={LS.label}>Город</label>
            <select value={cityId} onChange={e => setCityId(e.target.value)} style={LS.select}>
              <option value="">— не выбран —</option>
              {CITIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LS.label}>Школа (для ученика / преподавателя)</label>
            <select value={schoolId} onChange={e => setSchoolId(e.target.value)} style={LS.select}>
              <option value="">— не выбрана —</option>
              {SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={LS.label}>ID наставника (для роли «Наставляемый»)</label>
            <input
              value={mentorId} onChange={e => setMentorId(e.target.value)}
              placeholder="UUID наставника из Supabase → profiles"
              style={LS.input}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Найдите UUID в Supabase → Table Editor → profiles → строка наставника → поле id
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки ролей */}
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Выберите роль для симуляции:
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {ROLES.map(role => {
          const isActive  = currentUser?.role === role.id;
          const isSaved   = savedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => applyRole(role.id)}
              disabled={saving || isActive}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 10, cursor: isActive ? 'default' : 'pointer',
                border: isActive ? '2px solid #C9922A' : '1px solid var(--border2)',
                background: isActive ? 'rgba(201,146,42,0.08)' : isSaved ? '#F0FDF4' : '#fff',
                textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
                opacity: saving && !isActive ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#C9922A'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border2)'; }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{role.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{role.label}</span>
                  {isActive && <span style={{ fontSize: 10, background: '#C9922A', color: '#fff', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>СЕЙЧАС</span>}
                  {isSaved && !isActive && <span style={{ fontSize: 10, background: '#16A34A', color: '#fff', padding: '1px 6px', borderRadius: 8 }}>✓</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{role.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {saving && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>
          Применяю роль...
        </div>
      )}

      {savedRole && !saving && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803D' }}>
          ✅ Роль «{ROLES.find(r => r.id === savedRole)?.label}» применена. Переключаю кабинет...
        </div>
      )}

      {/* Подсказки */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><span className="card-title">💡 Как пользоваться</span></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['1.', 'Выберите город и школу в настройках контекста выше'],
            ['2.', 'Нажмите на нужную роль — профиль обновится в базе'],
            ['3.', 'Вы автоматически попадёте в кабинет этой роли'],
            ['4.', 'Чтобы вернуться — нажмите «Разработчик» снова'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
              <span style={{ color: '#C9922A', fontWeight: 700, flexShrink: 0 }}>{n}</span>
              <span style={{ color: 'var(--text2)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LS = {
  label:  { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit' },
  input:  { width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
};
