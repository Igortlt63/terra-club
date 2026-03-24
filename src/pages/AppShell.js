import React, { useEffect, useState } from 'react';
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

// ── Навигационные группы для десктопного сайдбара ────────
function getNavGroups(role) {
  const groups = [];

  groups.push({ section: 'Главное', items: [
    { icon: '💬', label: 'Сообщения', view: 'chat' },
  ]});

  if (['student','teacher','admin'].includes(role)) {
    groups.push({ section: 'Обучение', items: [
      { icon: '🎓', label: role === 'teacher' ? 'Моя школа' : 'Кабинет ученика', view: 'schools' },
    ]});
  }

  if (['mentor','mentee','admin'].includes(role)) {
    const sec = groups.find(g => g.section === 'Обучение');
    const item = {
      icon: '🌱',
      label: role === 'mentor' ? 'Наставляемые' : role === 'mentee' ? 'Наставничество' : 'Наставничество',
      view: 'mentoring',
    };
    if (sec) sec.items.push(item);
    else groups.push({ section: 'Наставничество', items: [item] });
  }

  if (role === 'admin') {
    groups.push({ section: 'Управление', items: [
      { icon: '📊', label: 'Дашборд',   view: 'dashboard' },
      { icon: '👥', label: 'Участники', view: 'crm' },
    ]});
  }

  groups.push({ section: 'Аккаунт', items: [
    { icon: '👤', label: 'Профиль',     view: 'profile'  },
    { icon: '🛠️', label: 'Разработчик', view: 'devpanel' },
  ]});

  return groups;
}

// ── Пункты нижней мобильной панели ───────────────────────
function getMobileTabs(role) {
  const tabs = [
    { icon: '💬', label: 'Чат',     view: 'chat'    },
  ];

  if (['student','teacher','admin'].includes(role)) {
    tabs.push({ icon: '🎓', label: 'Учёба', view: 'schools' });
  }
  if (['mentor','mentee'].includes(role)) {
    tabs.push({ icon: '🌱', label: 'Наставник', view: 'mentoring' });
  }
  if (role === 'admin') {
    tabs.push({ icon: '📊', label: 'Дашборд', view: 'dashboard' });
    tabs.push({ icon: '👥', label: 'CRM',     view: 'crm'       });
  }

  // Профиль всегда последний
  tabs.push({ icon: '👤', label: 'Профиль', view: 'profile' });

  // Обрезаем до 5 максимум
  return tabs.slice(0, 5);
}

const VIEW_TITLES = {
  chat:      r => 'Сообщения',
  schools:   r => r === 'teacher' ? 'Моя школа' : 'Учёба',
  mentoring: r => r === 'mentor' ? 'Наставляемые' : 'Наставничество',
  crm:       () => 'Участники',
  dashboard: () => 'Дашборд',
  profile:   () => 'Профиль',
  devpanel:  () => '🛠 Разработчик',
};

// ── Десктопный пункт навигации ────────────────────────────
function NavItem({ icon, label, view, currentView, setView }) {
  const active = currentView === view;
  return (
    <div
      className={`channel-item${active ? ' active' : ''}`}
      onClick={() => setView(view)}
    >
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, letterSpacing: '-0.1px' }}>{label}</span>
    </div>
  );
}

// ── Лейбл секции ─────────────────────────────────────────
function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>;
}

export default function AppShell() {
  const { currentUser, logout, activeView, setActiveView, notification } = useApp();
  const role = currentUser?.role;
  const navGroups = getNavGroups(role);
  const mobileTabs = getMobileTabs(role);

  // Начальный экран
  useEffect(() => {
    if (role === 'admin')          setActiveView('dashboard');
    else if (role === 'developer') setActiveView('devpanel');
    else                           setActiveView('chat');
  }, [role]); // eslint-disable-line

  const viewTitle = VIEW_TITLES[activeView]?.(role) || '';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg2)' }}>

      {/* ── Десктопный сайдбар (скрыт на мобильных) ────── */}
      <div
        className="desktop-sidebar"
        style={{
          width: 240,
          background: 'var(--sidebar-bg)',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Логотип */}
        <div style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #007AFF, #32ADE6)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            boxShadow: '0 2px 8px rgba(0,122,255,0.35)',
            flexShrink: 0,
          }}>T</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>ТЕРРА</div>
            <div style={{ fontSize: 11, color: 'rgba(235,235,245,0.45)', marginTop: 1 }}>Бизнес Клуб</div>
          </div>
        </div>

        {/* Бейдж роли */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <span className={`badge badge-${role}`} style={{ fontSize: 12 }}>
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

        {/* Пользователь */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--sidebar-border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div
            className="avatar avatar-sm"
            style={{ background: currentUser?.color || 'var(--blue)', flexShrink: 0 }}
          >{currentUser?.initials || '?'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(235,235,245,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.email}
            </div>
          </div>
          <button
            onClick={logout} title="Выйти"
            style={{
              background: 'none', border: 'none',
              color: 'rgba(235,235,245,0.3)',
              cursor: 'pointer', fontSize: 18, padding: 4,
              transition: 'color 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(235,235,245,0.3)'}
          >⏻</button>
        </div>
      </div>

      {/* ── Основной контент ─────────────────────────────── */}
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', background: 'var(--bg)',
          minWidth: 0,
        }}
        className="main-content-area"
      >
        {/* Десктопный топбар (не для чата — у него своя шапка) */}
        {activeView !== 'chat' && (
          <div
            className="desktop-topbar"
            style={{
              padding: '13px 22px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, background: 'var(--bg)',
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>{viewTitle}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div
                className="avatar avatar-sm"
                style={{ background: currentUser?.color || 'var(--blue)', cursor: 'pointer' }}
                onClick={() => setActiveView('profile')}
              >{currentUser?.initials || '?'}</div>
            </div>
          </div>
        )}

        {/* Мобильный заголовок */}
        {activeView !== 'chat' && (
          <div className="mobile-page-header">
            <div className="mobile-page-title">{viewTitle}</div>
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

      {/* ── Мобильная нижняя панель ──────────────────────── */}
      <div className="mobile-tab-bar">
        {mobileTabs.map(tab => (
          <div
            key={tab.view}
            className={`mobile-tab-bar-item${activeView === tab.view ? ' active' : ''}`}
            onClick={() => setActiveView(tab.view)}
            style={{ position: 'relative' }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Уведомление */}
      {notification && (
        <div className={`notification ${notification.type || ''}`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}
