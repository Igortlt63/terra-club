import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CITY_CHANNELS, SCHOOLS, CITIES } from '../data/db';

// ── Роли ────────────────────────────────────────────────────
const ROLE_BADGE = {
  admin:   ['badge-admin',   'Руководство'],
  teacher: ['badge-teacher', 'Преподаватель'],
  student: ['badge-student', 'Ученик'],
  mentor:  ['badge-mentor',  'Наставник'],
  mentee:  ['badge-mentee',  'Наставляемый'],
  guest:   ['badge-guest',   'Гость'],
  member:  ['badge-member',  'Участник'],
};

// ── Одно сообщение ──────────────────────────────────────────
function MessageBubble({ msg }) {
  const { currentUser, getProfile } = useApp();
  const isMe   = msg.userId === currentUser?.id;
  const sender = isMe ? currentUser : (getProfile(msg.userId) || { name: 'Участник', initials: '?', color: '#888', role: 'guest' });
  const [cls, roleLabel] = ROLE_BADGE[sender.role] || ROLE_BADGE.guest;

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isMe ? 'row-reverse' : 'row' }}>
      <div className="avatar avatar-sm" style={{ background: sender.color, marginTop: 2, flexShrink: 0 }}>
        {sender.initials}
      </div>
      <div style={{ maxWidth: '72%' }}>
        {!isMe && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{sender.name}</span>
            <span className={`badge ${cls}`} style={{ fontSize: 10 }}>{roleLabel}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{msg.time}</span>
          </div>
        )}
        <div style={{
          padding: '9px 13px',
          borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isMe ? 'var(--gold)' : 'var(--bg2)',
          color: isMe ? '#fff' : 'var(--text)',
          fontSize: 14, lineHeight: 1.5,
          border: isMe ? 'none' : '1px solid var(--border)',
          wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
        {isMe && (
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 3 }}>
            {msg.time}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Список сообщений ────────────────────────────────────────
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  if (!loaded) {
    return (
      <div className="empty-state" style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Загрузка сообщений...</div>
      </div>
    );
  }

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

// ── Поле ввода ──────────────────────────────────────────────
function MessageInput({ channelKey, readonly }) {
  const { sendMessage, currentUser } = useApp();
  const [text, setText] = useState('');
  const textareaRef = useRef();

  const handleSend = async () => {
    if (!text.trim()) return;
    const t = text;
    setText('');
    await sendMessage(channelKey, t);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (readonly) {
    return (
      <div style={{
        padding: '12px 16px', background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        textAlign: 'center', fontSize: 13, color: 'var(--text3)',
      }}>
        📢 Этот канал только для чтения
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div className="avatar avatar-sm" style={{ background: currentUser?.color, marginBottom: 2, flexShrink: 0 }}>
          {currentUser?.initials}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение... (Enter — отправить, Shift+Enter — новая строка)"
            rows={2}
            style={{
              width: '100%', borderRadius: 10, fontSize: 14,
              padding: '8px 12px', resize: 'none',
              border: '1px solid var(--border2)', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: text.trim() ? 'var(--gold)' : 'var(--bg3)',
            color: text.trim() ? '#fff' : 'var(--text3)',
            border: 'none', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0, cursor: text.trim() ? 'pointer' : 'default',
          }}
        >→</button>
      </div>
    </div>
  );
}

// ── Пункт в сайдбаре ────────────────────────────────────────
function ChannelItem({ icon, name, active, unread, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', cursor: 'pointer', fontSize: 13,
        background: active ? 'rgba(201,146,42,0.09)' : 'transparent',
        borderLeft: active ? '2px solid #C9922A' : '2px solid transparent',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{
        flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        color: active ? '#E8A83E' : 'rgba(255,255,255,0.6)',
      }}>{name}</span>
      {unread > 0 && (
        <span style={{
          background: '#EF4444', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '1px 5px',
          borderRadius: 10, minWidth: 18, textAlign: 'center',
        }}>{unread}</span>
      )}
    </div>
  );
}

// ── Главный компонент ───────────────────────────────────────
export default function ChatLayout() {
  const { currentUser } = useApp();
  const role   = currentUser?.role;
  const cityId = currentUser?.city_id || currentUser?.cityId || 'moscow';
  const city   = CITIES.find(c => c.id === cityId);
  const cityName = city?.name || 'Ваш город';

  const [selected, setSelected] = useState(null);

  // Общие каналы города
  const cityChannels = CITY_CHANNELS.map(ch => ({
    key: `${cityId}_${ch.id}`,
    name: ch.name,
    icon: ch.icon,
    description: ch.description,
    readonly: ch.readonly || (role === 'guest' && ch.id !== 'news' && ch.id !== 'rules'),
    section: `${cityName} — Общие`,
  }));

  // Каналы школы
  const schoolChannels = [];
  if (['student', 'teacher', 'admin'].includes(role)) {
    const schoolId = currentUser?.school_id || currentUser?.schoolId;
    const school   = SCHOOLS.find(s => s.id === schoolId);
    if (school) {
      schoolChannels.push(
        { key: `school_${schoolId}_general`,  name: 'Общий чат школы',    icon: '💬', section: `${school.icon} ${school.name}` },
        { key: `school_${schoolId}_homework`, name: 'Домашние задания',    icon: '📝', section: `${school.icon} ${school.name}` },
        { key: `school_${schoolId}_materials`,name: 'Материалы урока',     icon: '📚', section: `${school.icon} ${school.name}`, readonly: role === 'student' },
        { key: `school_${schoolId}_results`,  name: 'Результаты',          icon: '🏆', section: `${school.icon} ${school.name}` },
      );
    }
  }

  // Каналы наставничества
  const mentorChannels = [];
  if (['mentor', 'mentee', 'admin'].includes(role)) {
    const mentorId = role === 'mentor'
      ? currentUser?.id
      : (currentUser?.mentor_id || currentUser?.mentorId);

    if (mentorId) {
      mentorChannels.push(
        { key: `mentor_${mentorId}_general`,  name: 'Группа наставничества', icon: '🌱', section: '◎ Наставничество' },
        { key: `mentor_${mentorId}_tasks`,    name: 'Задания и цели',         icon: '🎯', section: '◎ Наставничество' },
      );
      if (role === 'mentee') {
        mentorChannels.push({ key: `mentor_${mentorId}_personal_${currentUser.id}`, name: 'Личный чат с наставником', icon: '👤', section: '◎ Наставничество' });
      }
    }
  }

  // Админские каналы
  const adminChannels = [];
  if (role === 'admin') {
    adminChannels.push(
      { key: 'admin_managers', name: 'Руководство (все города)', icon: '🌍', section: '⚙️ Администрирование' },
      { key: 'admin_teachers', name: 'Канал преподавателей',     icon: '👨‍🏫', section: '⚙️ Администрирование' },
    );
  }

  const allChannels = [...cityChannels, ...schoolChannels, ...mentorChannels, ...adminChannels];

  // Авто-выбор первого канала
  useEffect(() => {
    if (!selected && allChannels.length > 0) setSelected(allChannels[0]);
  }, [role]); // eslint-disable-line

  // Группировка по секциям
  const sections = {};
  allChannels.forEach(ch => {
    if (!sections[ch.section]) sections[ch.section] = [];
    sections[ch.section].push(ch);
  });

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Сайдбар каналов */}
      <div style={{ width: 220, background: 'var(--sidebar-bg)', overflowY: 'auto', flexShrink: 0 }}>
        {Object.entries(sections).map(([section, channels]) => (
          <div key={section}>
            <div className="section-label" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
              {section}
            </div>
            {channels.map(ch => (
              <ChannelItem
                key={ch.key}
                icon={ch.icon}
                name={ch.name}
                active={selected?.key === ch.key}
                onClick={() => setSelected(ch)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Область сообщений */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            {/* Шапка канала */}
            <div style={{
              padding: '12px 18px', borderBottom: '1px solid var(--border)',
              background: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{selected.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{selected.description || selected.section}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(role === 'teacher' || role === 'admin') && (
                  <button className="btn-ghost" style={{ fontSize: 12 }}>📌 Закрепить</button>
                )}
              </div>
            </div>

            {/* Плашка для гостей */}
            {role === 'guest' && selected.readonly && (
              <div style={{
                background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
                padding: '10px 18px', fontSize: 13, color: '#92400E',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>🔒</span>
                <span>Этот раздел доступен только участникам клуба.</span>
              </div>
            )}

            <MessageList channelKey={selected.key} />
            <MessageInput channelKey={selected.key} readonly={selected.readonly} />
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
