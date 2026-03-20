import React from 'react';
import { useApp } from '../context/AppContext';
import ChatLayout from './ChatLayout';
import SchoolsCabinet from './SchoolsCabinet';
import MentoringCabinet from './MentoringCabinet';
import CRMPage from './CRMPage';
import AdminDashboard from './AdminDashboard';
import ProfilePage from './ProfilePage';

const ROLE_LABELS = {
  admin: 'Руководство', teacher: 'Преподаватель', student: 'Ученик',
  mentor: 'Наставник', mentee: 'Наставляемый', guest: 'Гость', member: 'Участник',
};

function NavItem({ icon, label, view, badge, currentView, setView }) {
  const active = currentView === view;
  return (
    <div
      onClick={() => setView(view)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
        cursor: 'pointer', fontSize: 13, position: 'relative',
        color: active ? '#E8A83E' : 'rgba(255,255,255,0.55)',
        background: active ? 'rgba(201,146,42,0.1)' : 'transparent',
        borderLeft: active ? '2px solid #C9922A' : '2px solid transparent',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>{badge}</span>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.22)', padding: '10px 16px 4px' }}>{children}</div>;
}

function getNavItems(role) {
  const items = [];

  // Always visible (except chat is context-filtered by role)
  items.push({ section: 'Главное', items: [
    { icon: '💬', label: 'Сообщения', view: 'chat', badge: role !== 'guest' ? 4 : 0 },
  ]});

  // School cabinet
  if (['student', 'teacher', 'admin'].includes(role)) {
    items.push({ section: 'Обучение', items: [
      { icon: '🎓', label: role === 'teacher' ? 'Моя школа' : 'Кабинет ученика', view: 'schools' },
    ]});
  }

  // Mentoring
  if (['mentor', 'mentee', 'admin'].includes(role)) {
    const mentorSection = items.find(s => s.section === 'Обучение');
    const item = { icon: '🌱', label: role === 'mentor' ? 'Мои наставляемые' : role === 'mentee' ? 'Моё наставничество' : 'Наставничество', view: 'mentoring' };
    if (mentorSection) mentorSection.items.push(item);
    else items.push({ section: 'Наставничество', items: [item] });
  }

  // Admin tools
  if (role === 'admin') {
    items.push({ section: 'Управление', items: [
      { icon: '📊', label: 'Дашборд', view: 'dashboard' },
      { icon: '👥', label: 'CRM / Участники', view: 'crm' },
    ]});
  }

  // Always: profile
  items.push({ section: 'Аккаунт', items: [
    { icon: '👤', label: 'Мой профиль', view: 'profile' },
  ]});

  return items;
}

function getViewTitle(view, role) {
  const map = {
    chat: 'Сообщения',
    schools: role === 'teacher' ? 'Кабинет преподавателя' : 'Кабинет ученика',
    mentoring: role === 'mentor' ? 'Кабинет наставника' : 'Наставничество',
    crm: 'CRM · Участники',
    dashboard: 'Панель управления',
    profile: 'Мой профиль',
  };
  return map[view] || '';
}

export default function AppShell() {
  const { currentUser, logout, activeView, setActiveView, notification } = useApp();
  const role = currentUser?.role;
  const navGroups = getNavItems(role);

  // Default view by role
  React.useEffect(() => {
    if (role === 'admin') setActiveView('dashboard');
    else setActiveView('chat');
  }, [role]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#0F1117', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #C9922A, #E8A83E)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>T</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#E8A83E', letterSpacing: 2 }}>ТЕРРА</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Бизнес Клуб</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className={`badge badge-${role}`} style={{ fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 4 }} />
            {ROLE_LABELS[role]}
          </span>
        </div>

        {/* Navigation */}
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

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar avatar-sm" style={{ background: currentUser?.color, flexShrink: 0 }}>{currentUser?.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{currentUser?.email}</div>
          </div>
          <button onClick={logout} title="Выйти" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, padding: 4, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >⏻</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {/* Topbar */}
        {activeView !== 'chat' && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{getViewTitle(activeView, role)}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-ghost" style={{ fontSize: 13 }}>🔔</button>
              <div className="avatar avatar-sm" style={{ background: currentUser?.color, cursor: 'pointer' }} onClick={() => setActiveView('profile')}>{currentUser?.initials}</div>
            </div>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeView === 'chat' && <ChatLayout />}
          {activeView === 'schools' && <SchoolsCabinet />}
          {activeView === 'mentoring' && <MentoringCabinet />}
          {activeView === 'crm' && <CRMPage />}
          {activeView === 'dashboard' && <AdminDashboard />}
          {activeView === 'profile' && <ProfilePage />}
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className={`notification ${notification.type}`}>{notification.msg}</div>
      )}
    </div>
  );
}
