import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ChatLayout from './ChatLayout';
import SchoolsCabinet from './SchoolsCabinet';
import MentoringCabinet from './MentoringCabinet';
import CRMPage from './CRMPage';
import AdminDashboard from './AdminDashboard';
import ProfilePage from './ProfilePage';
import DevPanel from './DevPanel';
import GovernancePage from './GovernancePage';
import Logo from '../components/Logo';

const ROLE_LABELS = {
  admin:'Руководство', teacher:'Преподаватель', student:'Ученик',
  mentor:'Наставник', mentee:'Наставляемый', guest:'Гость',
  member:'Участник', developer:'Разработчик',
};

const Icons = {
  chat:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  school:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  mentoring:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  governance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><path d="M12 11v4M8 21h8M12 15v1"/><path d="M5 21a7 7 0 0114 0"/></svg>,
  dashboard:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  crm:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-4-4H0M20 8a3 3 0 010 6"/></svg>,
  profile:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  dev:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  logout:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

function getNavGroups(role) {
  const g = [];
  g.push({ section:'Главное', items:[
    { icon:Icons.chat, label:'Сообщения', view:'chat' },
  ]});

  if (['student','teacher','admin'].includes(role)) {
    g.push({ section:'Обучение', items:[
      { icon:Icons.school, label: role==='teacher' ? 'Моя школа' : 'Учёба', view:'schools' },
    ]});
  }
  if (['mentor','mentee','admin'].includes(role)) {
    const sec = g.find(s=>s.section==='Обучение');
    const item = { icon:Icons.mentoring, label: role==='mentor'?'Наставляемые':'Наставничество', view:'mentoring' };
    if (sec) sec.items.push(item);
    else g.push({ section:'Наставничество', items:[item] });
  }

  // Руководство — видят admin и те у кого есть должность (проверяется на самой странице)
  if (['admin','teacher','mentor','member'].includes(role)) {
    g.push({ section:'Управление', items:[
      { icon:Icons.governance, label:'Руководство', view:'governance' },
    ]});
  }

  if (role === 'admin') {
    const mgmt = g.find(s=>s.section==='Управление');
    if (mgmt) {
      mgmt.items.push(
        { icon:Icons.dashboard, label:'Дашборд',    view:'dashboard' },
        { icon:Icons.crm,       label:'Участники',  view:'crm'       },
      );
    }
  }

  g.push({ section:'Аккаунт', items:[
    { icon:Icons.profile, label:'Профиль',     view:'profile'  },
    { icon:Icons.dev,     label:'Разработчик', view:'devpanel' },
  ]});

  return g;
}

function getMobileTabs(role) {
  const tabs = [{ icon:Icons.chat, label:'Чат', view:'chat' }];
  if (['student','teacher','admin'].includes(role))
    tabs.push({ icon:Icons.school, label:'Учёба', view:'schools' });
  if (['mentor','mentee'].includes(role))
    tabs.push({ icon:Icons.mentoring, label:'Наставник', view:'mentoring' });
  tabs.push({ icon:Icons.governance, label:'Структура', view:'governance' });
  if (role === 'admin')
    tabs.push({ icon:Icons.dashboard, label:'Дашборд', view:'dashboard' });
  tabs.push({ icon:Icons.profile, label:'Профиль', view:'profile' });
  return tabs.slice(0, 5);
}

const VIEW_TITLES = {
  chat:'Сообщения', schools:'Учёба', mentoring:'Наставничество',
  governance:'Руководство', crm:'Участники', dashboard:'Дашборд',
  profile:'Профиль', devpanel:'Разработчик',
};

function NavItem({ icon, label, view, currentView, setView }) {
  const active = currentView === view;
  return (
    <div className={`channel-item${active?' active':''}`} onClick={()=>setView(view)}>
      <span style={{ width:18, height:18, flexShrink:0, opacity:active?1:0.6 }}>{icon}</span>
      <span style={{ flex:1, letterSpacing:'-0.1px', fontSize:14 }}>{label}</span>
    </div>
  );
}

export default function AppShell() {
  const { currentUser, logout, activeView, setActiveView, notification } = useApp();

  const handleSetView = React.useCallback((view) => {
    setActiveView(view);
    // Сбрасываем просмотр чужого профиля при навигации
    if (view !== 'profile') setProfileUserId(null);
  }, [setActiveView, setProfileUserId]); // eslint-disable-line
  const [openDmWithUser, setOpenDmWithUser] = React.useState(null);
  const [profileUserId,  setProfileUserId]  = React.useState(null);
  const role = currentUser?.role;
  const navGroups  = getNavGroups(role);
  const mobileTabs = getMobileTabs(role);

  useEffect(() => {
    if (role === 'admin')          setActiveView('dashboard');
    else if (role === 'developer') setActiveView('devpanel');
    else                           setActiveView('chat');
  }, [role]); // eslint-disable-line

  const viewTitle = VIEW_TITLES[activeView] || '';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-base)' }}>

      {/* Десктопный сайдбар */}
      <div className="desktop-sidebar" style={{
        width:248, flexShrink:0,
        background:'rgba(15,15,24,0.95)',
        borderRight:'1px solid var(--glass-border)',
        display:'flex', flexDirection:'column',
      }}>
        {/* Лого */}
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Logo size={38} showText={false} />
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', letterSpacing:-0.3 }}>Терра</div>
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:1, letterSpacing:0.3 }}>Бизнес Клуб</div>
            </div>
          </div>
        </div>

        {/* Роль */}
        <div style={{ padding:'10px 20px', borderBottom:'1px solid var(--border)' }}>
          <span className={`badge badge-${role}`}>{ROLE_LABELS[role]||'Гость'}</span>
        </div>

        {/* Навигация */}
        <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
          {navGroups.map(g=>(
            <div key={g.section}>
              <div className="section-label">{g.section}</div>
              {g.items.map(item=>(
                <NavItem key={item.view} {...item} currentView={activeView} setView={handleSetView} />
              ))}
            </div>
          ))}
        </div>

        {/* Пользователь */}
        <div style={{ padding:'14px 18px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div className="avatar avatar-sm" style={{ background:currentUser?.color||'var(--accent)', flexShrink:0 }}>
            {currentUser?.initials||'?'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentUser?.name}</div>
            <div style={{ fontSize:11, color:'var(--text4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentUser?.email}</div>
          </div>
          <button onClick={logout}
            style={{ width:28, height:28, borderRadius:8, background:'transparent', border:'1px solid var(--border2)', color:'var(--text3)', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}
          >
            <span style={{ width:14, height:14 }}>{Icons.logout}</span>
          </button>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'var(--bg-surface)' }}>
        {activeView !== 'chat' && (
          <div className="desktop-topbar" style={{
            padding:'14px 24px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexShrink:0, background:'rgba(15,15,24,0.8)', backdropFilter:'blur(20px)',
          }}>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>{viewTitle}</div>
            <div className="avatar avatar-sm" style={{ background:currentUser?.color||'var(--accent)', cursor:'pointer' }}
              onClick={()=>setActiveView('profile')}>{currentUser?.initials||'?'}</div>
          </div>
        )}
        {activeView !== 'chat' && (
          <div className="mobile-header">
            <div className="mobile-header-title">{viewTitle}</div>
          </div>
        )}

        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }} className="main-scroll-area">
          {activeView==='chat'       && <ChatLayout openDmWithUser={openDmWithUser} onDmOpened={()=>setOpenDmWithUser(null)} onOpenProfile={uid=>{ setProfileUserId(uid); setActiveView('profile'); }} />}
          {activeView==='schools'    && <SchoolsCabinet />}
          {activeView==='mentoring'  && <MentoringCabinet />}
          {activeView==='governance' && <GovernancePage />}
          {activeView==='crm'        && <CRMPage onOpenDm={u=>{ setOpenDmWithUser(u); setActiveView('chat'); }} />}
          {activeView==='dashboard'  && <AdminDashboard />}
          {activeView==='profile'    && <ProfilePage viewUserId={profileUserId} onClear={()=>setProfileUserId(null)} onWriteDm={u=>{ setOpenDmWithUser(u); setProfileUserId(null); setActiveView('chat'); }} />}
          {activeView==='devpanel'   && <DevPanel />}
        </div>
      </div>

      {/* Мобильная нижняя панель */}
      <nav className="mobile-nav">
        {mobileTabs.map(tab=>(
          <div key={tab.view} className={`mobile-nav-item${activeView===tab.view?' active':''}`} onClick={()=>handleSetView(tab.view)}>
            <div className="nav-icon-wrap">
              <span style={{ width:24, height:24, display:'block' }}>{tab.icon}</span>
            </div>
            <span>{tab.label}</span>
          </div>
        ))}
      </nav>

      {notification && <div className={`notification ${notification.type||''}`}>{notification.msg}</div>}
    </div>
  );
}
