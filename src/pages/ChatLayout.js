import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS, CITY_CHANNELS, SCHOOLS, CITIES } from '../data/db';

function getUserById(id) {
  return DEMO_USERS.find(u => u.id === id) || { name: 'Участник', initials: '?', color: '#999' };
}

function getRoleBadge(role) {
  const map = {
    admin: ['badge-admin', 'Руководство'],
    teacher: ['badge-teacher', 'Преподаватель'],
    student: ['badge-student', 'Ученик'],
    mentor: ['badge-mentor', 'Наставник'],
    mentee: ['badge-mentee', 'Наставляемый'],
    guest: ['badge-guest', 'Гость'],
    member: ['badge-member', 'Участник'],
  };
  return map[role] || ['badge-guest', role];
}

function MessageBubble({ msg }) {
  const { currentUser } = useApp();
  const sender = getUserById(msg.userId);
  const isMe = msg.userId === currentUser?.id;
  const [cls, roleLabel] = getRoleBadge(sender.role);

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isMe ? 'row-reverse' : 'row' }}>
      <div className="avatar avatar-sm" style={{ background: sender.color, marginTop: 2 }}>{sender.initials}</div>
      <div style={{ maxWidth: '72%' }}>
        {!isMe && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{sender.name}</span>
            <span className={`badge ${cls}`} style={{ fontSize: 10 }}>{roleLabel}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{msg.time}</span>
          </div>
        )}
        <div style={{
          padding: '9px 13px', borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isMe ? 'var(--gold)' : 'var(--bg2)',
          color: isMe ? '#fff' : 'var(--text)',
          fontSize: 14, lineHeight: 1.5, border: isMe ? 'none' : '1px solid var(--border)',
        }}>
          {msg.text}
        </div>
        {isMe && <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 3 }}>{msg.time}</div>}
      </div>
    </div>
  );
}

function MessageInput({ channelKey, readonly }) {
  const { sendMessage, currentUser } = useApp();
  const [text, setText] = useState('');
  const textareaRef = useRef();

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(channelKey, text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (readonly) {
    return (
      <div style={{ padding: '12px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
        📢 Этот канал только для чтения
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div className="avatar avatar-sm" style={{ background: currentUser?.color, marginBottom: 2 }}>{currentUser?.initials}</div>
        <div style={{ flex: 1 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение... (Enter — отправить, Shift+Enter — новая строка)"
            rows={2}
            style={{ width: '100%', borderRadius: 10, fontSize: 14, padding: '8px 12px', resize: 'none', border: '1px solid var(--border2)', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: 38, height: 38, borderRadius: '50%', background: text.trim() ? 'var(--gold)' : 'var(--bg3)',
            color: text.trim() ? '#fff' : 'var(--text3)', border: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0,
          }}
        >→</button>
      </div>
    </div>
  );
}

function MessageList({ channelKey }) {
  const { messages } = useApp();
  const msgs = messages[channelKey] || [];
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  if (msgs.length === 0) {
    return (
      <div className="empty-state" style={{ flex: 1 }}>
        <div className="icon">💬</div>
        <p>Здесь пока нет сообщений.<br />Напишите первым!</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
      {msgs.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Sidebar channel list ──────────────────────────────────────
function ChannelItem({ icon, name, active, unread, onClick, muted }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
      background: active ? 'rgba(201,146,42,0.09)' : 'transparent',
      color: active ? '#C9922A' : muted ? 'var(--sidebar-text)' : 'var(--sidebar-text)',
      cursor: 'pointer', fontSize: 13, borderRadius: 0,
      borderLeft: active ? '2px solid #C9922A' : '2px solid transparent',
      transition: 'all 0.12s',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: active ? '#E8A83E' : 'rgba(255,255,255,0.6)' }}>{name}</span>
      {unread > 0 && <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>{unread}</span>}
    </div>
  );
}

// ── Main ChatLayout ───────────────────────────────────────────
export default function ChatLayout() {
  const { currentUser, messages, activeChannel, setActiveChannel } = useApp();
  const role = currentUser?.role;
  const cityId = currentUser?.cityId;
  const city = CITIES.find(c => c.id === cityId);

  // Build channel list based on role
  const [selected, setSelected] = useState(null);

  const selectChannel = (ch) => setSelected(ch);

  // City general channels — available to all
  const cityChannels = CITY_CHANNELS.map(ch => ({
    key: `${cityId}_${ch.id}`,
    name: ch.name,
    icon: ch.icon,
    description: ch.description,
    readonly: ch.readonly || (role === 'guest' && ch.id !== 'news' && ch.id !== 'rules'),
    section: `${city?.name || 'Ваш город'} — Общие`,
  }));

  // School cabinet channels — for student, teacher
  const schoolChannels = [];
  if (['student', 'teacher', 'admin'].includes(role)) {
    const schoolId = currentUser?.schoolId || 'negotiations';
    const school = SCHOOLS.find(s => s.id === schoolId);
    if (school) {
      schoolChannels.push(
        { key: `school_${schoolId}_general`, name: 'Общий чат школы', icon: '💬', section: `${school.icon} ${school.name}` },
        { key: `school_${schoolId}_homework`, name: 'Домашние задания', icon: '📝', section: `${school.icon} ${school.name}` },
        { key: `school_${schoolId}_materials`, name: 'Материалы урока', icon: '📚', section: `${school.icon} ${school.name}`, readonly: role === 'student' },
        { key: `school_${schoolId}_results`, name: 'Результаты', icon: '🏆', section: `${school.icon} ${school.name}` },
      );
    }
  }

  // Mentor/mentee channels
  const mentorChannels = [];
  if (['mentor', 'mentee', 'admin'].includes(role)) {
    mentorChannels.push(
      { key: 'mentor_group_general', name: 'Группа наставничества', icon: '🌱', section: '◎ Наставничество' },
      { key: 'mentor_group_tasks', name: 'Задания и цели', icon: '🎯', section: '◎ Наставничество' },
      { key: 'mentor_group_progress', name: 'Прогресс участников', icon: '📈', section: '◎ Наставничество' },
    );
    if (role === 'mentor') {
      mentorChannels.push({ key: 'mentor_personal_anna', name: 'Личный чат: Анна К.', icon: '👤', section: '◎ Наставничество' });
    }
    if (role === 'mentee') {
      mentorChannels.push({ key: 'mentor_personal_anna', name: 'Личный чат с наставником', icon: '👤', section: '◎ Наставничество' });
    }
  }

  // Admin extra
  const adminChannels = [];
  if (role === 'admin') {
    adminChannels.push(
      { key: 'admin_managers', name: 'Руководство (все города)', icon: '🌍', section: '⚙️ Администрирование' },
      { key: 'admin_teachers', name: 'Канал преподавателей', icon: '👨‍🏫', section: '⚙️ Администрирование' },
    );
  }

  const allChannels = [...cityChannels, ...schoolChannels, ...mentorChannels, ...adminChannels];

  // Auto-select first
  useEffect(() => {
    if (!selected && allChannels.length > 0) setSelected(allChannels[0]);
  }, []);

  // Group by section
  const sections = {};
  allChannels.forEach(ch => {
    if (!sections[ch.section]) sections[ch.section] = [];
    sections[ch.section].push(ch);
  });

  const activeChannelData = selected;
  const channelKey = selected?.key;

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Channel sidebar */}
      <div style={{ width: 220, background: 'var(--sidebar-bg)', overflowY: 'auto', flexShrink: 0 }}>
        {Object.entries(sections).map(([section, channels]) => (
          <div key={section}>
            <div className="section-label" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{section}</div>
            {channels.map(ch => (
              <ChannelItem
                key={ch.key}
                icon={ch.icon}
                name={ch.name}
                active={selected?.key === ch.key}
                unread={ch.key === 'moscow_main' ? 3 : ch.key === 'school_negotiations_homework' ? 1 : 0}
                onClick={() => selectChannel(ch)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeChannelData ? (
          <>
            {/* Channel header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{activeChannelData.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{activeChannelData.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{activeChannelData.description || activeChannelData.section}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" style={{ fontSize: 12 }}>👥 Участники</button>
                {(role === 'teacher' || role === 'admin') && <button className="btn-ghost" style={{ fontSize: 12 }}>📌 Закрепить</button>}
              </div>
            </div>

            {/* Guest restriction notice */}
            {role === 'guest' && activeChannelData.readonly && activeChannelData.section?.includes('Общие') && (
              <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '10px 18px', fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔒</span>
                <span>Этот раздел доступен только участникам клуба. <strong>Оформите членство</strong> чтобы присоединиться.</span>
              </div>
            )}

            <MessageList channelKey={channelKey} />
            <MessageInput channelKey={channelKey} readonly={activeChannelData.readonly} />
          </>
        ) : (
          <div className="empty-state">
            <div className="icon">💬</div>
            <p>Выберите канал слева для начала общения</p>
          </div>
        )}
      </div>
    </div>
  );
}
