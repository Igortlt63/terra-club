import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CITY_CHANNELS, SCHOOLS, CITIES } from '../data/db';

const ROLE_BADGE = {
  admin:'badge-admin', teacher:'badge-teacher', student:'badge-student',
  mentor:'badge-mentor', mentee:'badge-mentee', guest:'badge-guest', member:'badge-member',
};

// ── Сообщение ──────────────────────────────────────────────
function MessageBubble({ msg }) {
  const { currentUser, getProfile } = useApp();
  const isMe   = msg.userId === currentUser?.id;
  const sender = isMe ? currentUser : (getProfile(msg.userId) || { name:'Участник', initials:'?', color:'#888', role:'guest' });
  const [cls] = [ROLE_BADGE[sender.role] || 'badge-guest'];
  return (
    <div style={{ display:'flex', gap:10, marginBottom:16, flexDirection: isMe?'row-reverse':'row' }}>
      <div className="avatar avatar-sm" style={{ background:sender.color, marginTop:2, flexShrink:0 }}>{sender.initials}</div>
      <div style={{ maxWidth:'75%' }}>
        {!isMe && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{sender.name}</span>
            <span className={`badge ${cls}`} style={{ fontSize:10 }}>{sender.role}</span>
            <span style={{ fontSize:11, color:'var(--text3)' }}>{msg.time}</span>
          </div>
        )}
        <div className={isMe ? 'bubble-me' : 'bubble-other'}>{msg.text}</div>
        {isMe && <div style={{ fontSize:11, color:'var(--text3)', textAlign:'right', marginTop:3 }}>{msg.time}</div>}
      </div>
    </div>
  );
}

// ── Список сообщений ───────────────────────────────────────
function MessageList({ channelKey }) {
  const { messages, loadMessages } = useApp();
  const msgs      = messages[channelKey] || [];
  const bottomRef = useRef();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    loadMessages(channelKey).then(() => setLoaded(true));
  }, [channelKey]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs.length]);

  if (!loaded) return (
    <div className="empty-state" style={{ flex:1 }}>
      <div style={{ fontSize:13, color:'var(--text3)' }}>Загрузка...</div>
    </div>
  );
  if (msgs.length === 0) return (
    <div className="empty-state" style={{ flex:1 }}>
      <div className="icon">💬</div>
      <p>Здесь пока нет сообщений.<br/>Напишите первым!</p>
    </div>
  );
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px' }}>
      {msgs.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Поле ввода ─────────────────────────────────────────────
function MessageInput({ channelKey, readonly }) {
  const { sendMessage, currentUser } = useApp();
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    const t = text; setText('');
    await sendMessage(channelKey, t);
  };
  const handleKey = e => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (readonly) return (
    <div style={{ padding:'12px 16px', background:'var(--bg-raised)', borderTop:'1px solid var(--border)', textAlign:'center', fontSize:13, color:'var(--text3)' }}>
      📢 Только для чтения
    </div>
  );

  return (
    <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', background:'var(--bg-surface)' }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
        <div className="avatar avatar-sm" style={{ background:currentUser?.color||'var(--accent)', marginBottom:2, flexShrink:0 }}>
          {currentUser?.initials}
        </div>
        <div style={{ flex:1 }}>
          <textarea
            value={text} onChange={e=>setText(e.target.value)} onKeyDown={handleKey}
            placeholder="Написать... (Enter — отправить)"
            rows={1}
            style={{ width:'100%', borderRadius:20, fontSize:15, padding:'9px 14px', resize:'none', minHeight:38, maxHeight:120 }}
          />
        </div>
        <button
          onClick={handleSend} disabled={!text.trim()}
          style={{
            width:38, height:38, borderRadius:'50%', flexShrink:0,
            background: text.trim() ? 'var(--accent)' : 'var(--bg-overlay)',
            color: text.trim() ? '#fff' : 'var(--text3)',
            border:'none', display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: text.trim() ? '0 0 12px var(--accent-glow)' : 'none',
            transition:'all 0.18s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Пункт канала ───────────────────────────────────────────
function ChannelItem({ icon, name, active, unread, onClick, compact }) {
  return (
    <div
      className={`channel-item${active?' active':''}`}
      onClick={onClick}
      title={compact ? name : undefined}
      style={{ justifyContent: compact ? 'center' : 'flex-start', padding: compact ? '10px 0' : '9px 18px' }}
    >
      <span style={{ fontSize:18, width:22, textAlign:'center', flexShrink:0 }}>{icon}</span>
      {!compact && <span style={{ flex:1, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>}
      {unread > 0 && (
        <span style={{ background:'var(--red)', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:10, minWidth:16, textAlign:'center', flexShrink:0 }}>
          {unread}
        </span>
      )}
    </div>
  );
}

// ── Главный компонент ──────────────────────────────────────
export default function ChatLayout() {
  const { currentUser } = useApp();
  const role   = currentUser?.role;
  const cityId = currentUser?.city_id || currentUser?.cityId || 'moscow';
  const city   = CITIES.find(c=>c.id===cityId);

  const [selected,     setSelected]     = useState(null);
  // На мобиле: true = показать боковую панель, false = скрыть
  const [showSidebar,  setShowSidebar]  = useState(false);
  // compact = только иконки (десктоп узкий или пользователь нажал)
  const [compact,      setCompact]      = useState(false);

  // Строим список каналов
  const cityChannels = CITY_CHANNELS.map(ch => ({
    key: `${cityId}_${ch.id}`,
    name: ch.name, icon: ch.icon,
    description: ch.description,
    readonly: ch.readonly || (role==='guest' && ch.id!=='news' && ch.id!=='rules'),
    section: `${city?.name||'Ваш город'}`,
  }));

  const schoolChannels = [];
  if (['student','teacher','admin'].includes(role)) {
    const schoolId = currentUser?.school_id || currentUser?.schoolId;
    const school   = SCHOOLS.find(s=>s.id===schoolId);
    if (school) {
      schoolChannels.push(
        { key:`school_${schoolId}_general`,  name:'Общий чат',      icon:'💬', section:school.name },
        { key:`school_${schoolId}_homework`, name:'Задания',         icon:'📝', section:school.name },
        { key:`school_${schoolId}_materials`,name:'Материалы',       icon:'📚', section:school.name, readonly:role==='student' },
        { key:`school_${schoolId}_results`,  name:'Результаты',      icon:'🏆', section:school.name },
      );
    }
  }

  const mentorChannels = [];
  if (['mentor','mentee','admin'].includes(role)) {
    const mentorId = role==='mentor' ? currentUser?.id : (currentUser?.mentor_id||currentUser?.mentorId);
    if (mentorId) {
      mentorChannels.push(
        { key:`mentor_${mentorId}_general`, name:'Группа',          icon:'🌱', section:'Наставничество' },
        { key:`mentor_${mentorId}_tasks`,   name:'Задания',          icon:'🎯', section:'Наставничество' },
      );
      if (role==='mentee')
        mentorChannels.push({ key:`mentor_${mentorId}_personal_${currentUser.id}`, name:'Личный чат', icon:'👤', section:'Наставничество' });
    }
  }

  const adminChannels = role==='admin' ? [
    { key:'admin_managers', name:'Руководство', icon:'🌍', section:'Администрирование' },
    { key:'admin_teachers', name:'Преподаватели',icon:'👨‍🏫', section:'Администрирование' },
  ] : [];

  const allChannels = [...cityChannels, ...schoolChannels, ...mentorChannels, ...adminChannels];

  useEffect(() => {
    if (!selected && allChannels.length > 0) setSelected(allChannels[0]);
  }, [role]); // eslint-disable-line

  const sections = {};
  allChannels.forEach(ch => {
    if (!sections[ch.section]) sections[ch.section] = [];
    sections[ch.section].push(ch);
  });

  // ── МОБИЛЬ: когда выбрали канал — скрываем панель ──────
  const selectChannel = ch => {
    setSelected(ch);
    setShowSidebar(false); // скрыть на мобиле после выбора
  };

  return (
    <div style={{ display:'flex', flex:1, height:'100%', overflow:'hidden', position:'relative' }}>

      {/* ── Мобильный оверлей (затемнение за сайдбаром) ─── */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{
            display:'none',
            position:'absolute', inset:0, background:'rgba(0,0,0,0.5)',
            zIndex:50, backdropFilter:'blur(2px)',
          }}
          className="mobile-chat-overlay"
        />
      )}

      {/* ── Сайдбар каналов ────────────────────────────── */}
      <div style={{
        width: compact ? 52 : 220,
        background:'var(--bg-raised)',
        borderRight:'1px solid var(--border)',
        overflowY:'auto', flexShrink:0,
        transition:'width 0.2s ease',
        // Мобиль: абсолютное позиционирование
      }}
      className="chat-sidebar"
      >
        {/* Кнопка compact / expand на десктопе */}
        <div style={{ display:'flex', justifyContent: compact?'center':'flex-end', padding:'10px 12px 4px' }}>
          <button
            onClick={() => setCompact(v=>!v)}
            className="btn-ghost"
            style={{ padding:'4px 8px', fontSize:12 }}
            title={compact ? 'Развернуть' : 'Свернуть'}
          >
            {compact ? '›' : '‹'}
          </button>
        </div>

        {Object.entries(sections).map(([section, channels]) => (
          <div key={section}>
            {!compact && (
              <div className="section-label" style={{ fontSize:10, padding:'12px 18px 4px' }}>{section}</div>
            )}
            {channels.map(ch => (
              <ChannelItem
                key={ch.key}
                icon={ch.icon}
                name={ch.name}
                active={selected?.key === ch.key}
                compact={compact}
                unread={0}
                onClick={() => selectChannel(ch)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Область сообщений ───────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {selected ? (
          <>
            {/* Шапка канала */}
            <div style={{
              padding:'12px 16px', borderBottom:'1px solid var(--border)',
              background:'var(--bg-surface)',
              display:'flex', alignItems:'center', gap:12, flexShrink:0,
            }}>
              {/* Мобильная кнопка открытия сайдбара */}
              <button
                className="mobile-menu-btn"
                onClick={() => setShowSidebar(true)}
                style={{
                  display:'none', // показывается через CSS на мобиле
                  width:34, height:34, borderRadius:10,
                  background:'var(--bg-overlay)', border:'none',
                  color:'var(--text2)', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <span style={{ fontSize:20, flexShrink:0 }}>{selected.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{selected.description || selected.section}</div>
              </div>
            </div>

            {/* Плашка для гостей */}
            {role==='guest' && selected.readonly && (
              <div style={{ background:'var(--amber-dim)', borderBottom:'1px solid var(--border)', padding:'10px 18px', fontSize:13, color:'var(--amber)', display:'flex', alignItems:'center', gap:8 }}>
                🔒 Этот раздел доступен только участникам клуба.
              </div>
            )}

            <MessageList channelKey={selected.key} />
            <MessageInput channelKey={selected.key} readonly={selected.readonly} />
          </>
        ) : (
          <div className="empty-state">
            <div className="icon">💬</div>
            <p>Выберите канал для начала общения</p>
          </div>
        )}
      </div>

      {/* Мобильный сайдбар поверх контента */}
      <style>{`
        @media(max-width:768px) {
          .chat-sidebar {
            position: absolute !important;
            top: 0; left: 0; bottom: 0;
            width: 240px !important;
            z-index: 60;
            transform: translateX(${showSidebar ? '0' : '-100%'});
            transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
            box-shadow: ${showSidebar ? '4px 0 24px rgba(0,0,0,0.4)' : 'none'};
          }
          .mobile-chat-overlay { display: block !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
