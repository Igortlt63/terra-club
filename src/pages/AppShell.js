import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ChatLayout from './ChatLayout';
import SchoolsCabinet from './SchoolsCabinet';
import MentoringCabinet from './MentoringCabinet';
import CRMPage from './CRMPage';
import AdminDashboard from './AdminDashboard';
import ProfilePage from './ProfilePage';
import DevPanel from './DevPanel';

const ROLE_LABELS = {
  admin:     'Руководство',
  teacher:   'Преподаватель',
  student:   'Ученик',
  mentor:    'Наставник',
  mentee:    'Наставляемый',
  guest:     'Гость',
  member:    'Участник',
  developer: 'Разработчик',
};

function NavItem({ icon, label, view, badge, currentView, setView }) {
  const active = currentView === view;
  return (
    <div
      onClick={() => setView(view)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
        cursor: 'pointer', fontSize: 13,
        color: active ? '#E8A83E' : 'rgba(255,255,255,0.55)',
        background: active ? 'rgba(201,146,42,0.1)' : 'transparent',
        borderLeft: active ? '2px solid #C9922A' : '2px solid transparent',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.22)', padding: '10px 16px 4px' }}>
      {children}
    </div>
  );
}

function getNavItems(role) {
  const items = [];

  // Чат — для всех
  items.push({ section: 'Главное', items: [
    { icon: '💬', label: 'Сообщения', view: 'chat' },
  ]});

  // Кабинет школы
  if (['student', 'teacher', 'admin'].includes(role)) {
    items.push({ section: 'Обучение', items: [
      { icon: '🎓', label: role === 'teacher' ? 'Моя школа' : 'Кабинет ученика', view: 'schools' },
    ]});
  }

  // Наставничество
  if (['mentor', 'mentee', 'admin'].includes(role)) {
    const learningSection = items.find(s => s.section === 'Обучение');
    const item = {
      icon: '🌱',
      label: role === 'mentor' ? 'Мои наставляемые' : role === 'mentee' ? 'Моё наставничество' : 'Наставничество',
      view: 'mentoring',
    };
    if (learningSection) learningSection.items.push(item);
    else items.push({ section: 'Наставничество', items: [item] });
  }

  // Инструменты администратора
  if (role === 'admin') {
    items.push({ section: 'Управление', items: [
      { icon: '📊', label: 'Дашборд',        view: 'dashboard' },
      { icon: '👥', label: 'CRM / Участники', view: 'crm' },
    ]});
  }

  // Панель разработчика
  if (role === 'developer') {
    items.push({ section: 'Разработка', items: [
      { icon: '🛠️', label: 'Панель разработчика', view: 'devpanel' },
    ]});
  }

  // Профиль — для всех
  items.push({ section: 'Аккаунт', items: [
    { icon: '👤', label: 'Мой профиль', view: 'profile' },
  ]});

  return items;
}

const VIEW_TITLES = {
  chat:      (role) => 'Сообщения',
  schools:   (role) => role === 'teacher' ? 'Кабинет преподавателя' : 'Кабинет ученика',
  mentoring: (role) => role === 'mentor' ? 'Кабинет наставника' : 'Наставничество',
  crm:       () => 'CRM · Участники',
  dashboard: () => 'Панель управления',
  profile:   () => 'Мой профиль',
  devpanel:  () => '🛠️ Панель разработчика',
};

export default function AppShell() {
  const { currentUser, logout, activeView, setActiveView, notification } = useApp();
  const role      = currentUser?.role;
  const navGroups = getNavItems(role);

  // Начальный экран по роли
  useEffect(() => {
    if (role === 'admin')     setActiveView('dashboard');
    else if (role === 'developer') setActiveView('devpanel');
    else setActiveView('chat');
  }, [role]); // eslint-disable-line

  const viewTitle = VIEW_TITLES[activeView]?.(role) || '';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Сайдбар */}
      <div style={{ width: 220, background: '#0F1117', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Логотип */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #C9922A, #E8A83E)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>T</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#E8A83E', letterSpacing: 2 }}>ТЕРРА</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Бизнес Клуб</div>
            </div>
          </div>
        </div>

        {/* Бейдж роли */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className={`badge badge-${role}`} style={{ fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 4 }} />
            {ROLE_LABELS[role] || 'Гость'}
          </span>
        </div>

        {/* Навигация */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          {navGroups.map(group => (
            <div key={group.section}>
              <SectionLabel>{group.section}</SectionLabel>
              {group.items.map(item => (
                <NavItem key={item.view} {...item} currentView={activeView} setView={setActiveView} />
              ))}
            </div>
          ))}
        </div>

        {/* Футер пользователя */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar avatar-sm" style={{ background: currentUser?.color || '#888', flexShrink: 0 }}>
            {currentUser?.initials || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.name}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.email}
            </div>
          </div>
          <button
            onClick={logout} title="Выйти"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, padding: 4, transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >⏻</button>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

        {/* Топбар (не показываем для чата — у него своя шапка) */}
        {activeView !== 'chat' && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{viewTitle}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div
                className="avatar avatar-sm"
                style={{ background: currentUser?.color || '#888', cursor: 'pointer' }}
                onClick={() => setActiveView('profile')}
              >
                {currentUser?.initials || '?'}
              </div>
            </div>
          </div>
        )}

        {/* Страницы */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeView === 'chat'      && <ChatLayout />}
          {activeView === 'schools'   && <SchoolsCabinet />}
          {activeView === 'mentoring' && <MentoringCabinet />}
          {activeView === 'crm'       && <CRMPage />}
          {activeView === 'dashboard' && <AdminDashboard />}
          {activeView === 'profile'   && <ProfilePage />}
          {activeView === 'devpanel'  && <DevPanel />}
        </div>
      </div>

      {/* Уведомление */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}
