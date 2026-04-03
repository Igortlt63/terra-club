import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { CITY_CHANNELS, SCHOOLS, CITIES } from '../data/db';
import { supabase } from '../supabase';

const ADMIN_ROLES = ['admin'];
const CAN_CREATE_CHANNELS = ['admin', 'teacher', 'mentor'];
const CAN_MANAGE_MESSAGES = ['admin', 'teacher', 'mentor'];

function canWrite(role, channel) {
  if (channel.readonly) return ADMIN_ROLES.includes(role);
  return true;
}

const IC = {
  send:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  reply:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>,
  pin:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  del:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  dm:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  menu:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

const REACTIONS = ['👍','❤️','😂','😮','😢','🔥'];
const ROLE_BADGE = { admin:'badge-admin', teacher:'badge-teacher', student:'badge-student', mentor:'badge-mentor', mentee:'badge-mentee', guest:'badge-guest', member:'badge-member' };
const ICONS_LIST = ['💬','📢','📝','🎓','🤝','❤️','⚡','🏆','📚','🎯','🌱','📊','🗣️','👥'];

// ── Модалка канала ──────────────────────────────────────────
function ChannelModal({ channel, cityId, schoolId, mentorId, onClose, onSaved }) {
  const { currentUser } = useApp();
  const [name,     setName]     = useState(channel?.name || '');
  const [desc,     setDesc]     = useState(channel?.description || '');
  const [icon,     setIcon]     = useState(channel?.icon || '💬');
  const [readonly, setReadonly] = useState(channel ? (channel.readonly_roles||[]).includes('student') : true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Введите название'); return; }
    setSaving(true);
    const payload = {
      name: name.trim(), description: desc.trim() || null, icon,
      city_id: cityId || null, school_id: schoolId || null,
      mentor_id: mentorId || null,
      type: schoolId ? 'school' : mentorId ? 'mentor' : 'city',
      readonly_roles: readonly ? ['guest','student','member','mentee'] : [],
      write_roles: ['admin','teacher','mentor'],
      created_by: currentUser.id,
    };
    const { error: err } = channel?.id
      ? await supabase.from('channels').update(payload).eq('id', channel.id)
      : await supabase.from('channels').insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  return (
    <div style={MOD.overlay} onClick={onClose}>
      <div style={MOD.sheet} onClick={e=>e.stopPropagation()}>
        <div style={MOD.handle}/>
        <div style={MOD.header}>
          <span style={MOD.title}>{channel ? 'Редактировать канал' : 'Новый канал'}</span>
          <button onClick={onClose} style={MOD.close}>{IC.close}</button>
        </div>
        <div style={MOD.body}>
          <div style={F.field}>
            <label style={F.label}>Иконка</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {ICONS_LIST.map(ic=>(
                <button key={ic} onClick={()=>setIcon(ic)} style={{width:36,height:36,fontSize:18,borderRadius:8,border:'none',cursor:'pointer',background:icon===ic?'var(--accent-dim)':'var(--bg-overlay)',outline:icon===ic?'2px solid var(--accent)':'none'}}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={F.field}>
            <label style={F.label}>Название *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Название канала"/>
          </div>
          <div style={F.field}>
            <label style={F.label}>Описание</label>
            <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Краткое описание"/>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
            <div>
              <div style={{fontSize:15,color:'var(--text)',fontWeight:500}}>Только для чтения</div>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>Ученики и участники не могут писать</div>
            </div>
            <div onClick={()=>setReadonly(v=>!v)} style={{width:46,height:28,borderRadius:14,cursor:'pointer',position:'relative',background:readonly?'var(--accent)':'rgba(255,255,255,0.12)',border:readonly?'none':'1px solid var(--border2)',transition:'all 0.22s'}}>
              <div style={{position:'absolute',top:3,left:readonly?21:3,width:20,height:20,borderRadius:'50%',background:'#fff',boxShadow:'0 2px 6px rgba(0,0,0,0.3)',transition:'left 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}/>
            </div>
          </div>
          {error && <div style={{background:'var(--red-dim)',color:'var(--red)',padding:'10px 14px',borderRadius:10,fontSize:13}}>{error}</div>}
        </div>
        <div style={MOD.footer}>
          <button onClick={onClose} className="btn-secondary">Отмена</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving?'Сохраняю...':channel?'Сохранить':'Создать'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Выбор пользователя для DM ───────────────────────────────
function DMPickerModal({ onClose, onSelect }) {
  const { currentUser } = useApp();
  const [users,  setUsers]  = useState([]);
  const [search, setSearch] = useState('');
  const ROLE_LABELS = {admin:'Руководство',teacher:'Преподаватель',student:'Ученик',mentor:'Наставник',mentee:'Наставляемый',member:'Участник'};

  useEffect(()=>{
    supabase.from('profiles').select('id,name,initials,color,role,email')
      .in('role',['admin','teacher','mentor','mentee','student','member'])
      .then(({data})=>setUsers((data||[]).filter(u=>u.id!==currentUser.id)));
  },[currentUser.id]);

  const filtered = users.filter(u=>
    (u.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={MOD.overlay} onClick={onClose}>
      <div style={MOD.sheet} onClick={e=>e.stopPropagation()}>
        <div style={MOD.handle}/>
        <div style={MOD.header}>
          <span style={MOD.title}>Новое личное сообщение</span>
          <button onClick={onClose} style={MOD.close}>{IC.close}</button>
        </div>
        <div style={{padding:'12px 20px 0'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..."
            style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid var(--border2)',background:'var(--bg-overlay)',color:'var(--text)',fontFamily:'inherit',fontSize:14,outline:'none'}}/>
        </div>
        <div style={{overflowY:'auto',maxHeight:380,padding:'8px 0'}}>
          {filtered.map(u=>(
            <div key={u.id} onClick={()=>{onSelect(u);onClose();}}
              style={{display:'flex',alignItems:'center',gap:12,padding:'10px 20px',cursor:'pointer',transition:'background 0.12s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div className="avatar avatar-sm" style={{background:u.color||'var(--accent)'}}>{u.initials}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500,color:'var(--text)'}}>{u.name}</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{ROLE_LABELS[u.role]||u.role} · {u.email}</div>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div style={{textAlign:'center',color:'var(--text3)',padding:20,fontSize:13}}>Никого не найдено</div>}
        </div>
      </div>
    </div>
  );
}

// ── Сообщение ───────────────────────────────────────────────
function MessageBubble({ msg, onReply, onPin, onEdit, onDelete, onReact, canManage }) {
  const { currentUser, getProfile } = useApp();
  const uid    = msg.userId || msg.from_user_id;
  const isMe   = uid === currentUser?.id;
  const sender = isMe ? currentUser : (getProfile(uid)||{name:'Участник',initials:'?',color:'#888',role:'guest'});
  const [showMenu,  setShowMenu]  = useState(false);
  const [showReact, setShowReact] = useState(false);
  const isDeleted = !!msg.deleted_at;
  const text = isDeleted ? 'Сообщение удалено' : (msg.text||'');
  const reactions = msg.reactions||{};
  const hasReactions = Object.keys(reactions).some(k=>(reactions[k]||[]).length>0);

  return (
    <div style={{display:'flex',gap:8,marginBottom:14,flexDirection:isMe?'row-reverse':'row',position:'relative'}}
      onMouseEnter={()=>setShowMenu(true)} onMouseLeave={()=>{setShowMenu(false);setShowReact(false);}}>
      <div className="avatar avatar-sm" style={{background:sender.color,marginTop:2,flexShrink:0}}>{sender.initials}</div>
      <div style={{maxWidth:'75%'}}>
        {!isMe && !isDeleted && (
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{sender.name}</span>
            <span className={`badge ${ROLE_BADGE[sender.role]||'badge-guest'}`} style={{fontSize:10}}>{sender.role}</span>
            <span style={{fontSize:11,color:'var(--text3)'}}>{msg.time}</span>
          </div>
        )}
        {isMe && !isDeleted && <div style={{fontSize:11,color:'var(--text3)',textAlign:'right',marginBottom:2}}>{msg.time}</div>}

        {msg.replyText && (
          <div style={{padding:'5px 10px',borderRadius:'8px 8px 0 0',background:'rgba(255,255,255,0.06)',borderLeft:'2px solid var(--accent)',marginBottom:1,fontSize:12,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {msg.replyText}
          </div>
        )}

        <div className={isMe?'bubble-me':'bubble-other'} style={isDeleted?{opacity:0.5,fontStyle:'italic'}:{}}>
          {text}
          {msg.edited_at&&!isDeleted&&<span style={{fontSize:10,opacity:0.6,marginLeft:6}}>изм.</span>}
        </div>

        {hasReactions && (
          <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap',justifyContent:isMe?'flex-end':'flex-start'}}>
            {Object.entries(reactions).filter(([,u])=>(u||[]).length>0).map(([emoji,users])=>(
              <button key={emoji} onClick={()=>onReact&&onReact(msg,emoji)}
                style={{padding:'2px 6px',borderRadius:12,border:'1px solid var(--border)',background:'var(--bg-overlay)',cursor:'pointer',fontSize:12,color:'var(--text2)'}}>
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
      </div>

      {showMenu && !isDeleted && (
        <div style={{position:'absolute',top:-8,right:isMe?'auto':'-8px',left:isMe?'-8px':'auto',display:'flex',gap:4,background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:10,padding:'4px',boxShadow:'var(--shadow-md)',zIndex:10}}>
          <MsgBtn title="Ответить"  icon={IC.reply} onClick={()=>onReply&&onReply(msg)}/>
          <MsgBtn title="Реакция"   icon="😊" emoji  onClick={()=>setShowReact(v=>!v)}/>
          {canManage&&<MsgBtn title="Закрепить" icon={IC.pin}  onClick={()=>onPin&&onPin(msg)}/>}
          {isMe&&     <MsgBtn title="Изменить"  icon={IC.edit} onClick={()=>onEdit&&onEdit(msg)}/>}
          {(isMe||canManage)&&<MsgBtn title="Удалить" icon={IC.del} onClick={()=>onDelete&&onDelete(msg)} danger/>}
        </div>
      )}

      {showReact && (
        <div style={{position:'absolute',top:-42,right:isMe?'auto':8,left:isMe?8:'auto',display:'flex',gap:4,background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:20,padding:'6px 10px',boxShadow:'var(--shadow-md)',zIndex:11}}>
          {REACTIONS.map(e=>(
            <button key={e} onClick={()=>{onReact&&onReact(msg,e);setShowReact(false);}}
              style={{fontSize:18,background:'none',border:'none',cursor:'pointer',padding:'2px',borderRadius:6,transition:'transform 0.15s'}}
              onMouseEnter={ev=>ev.currentTarget.style.transform='scale(1.3)'}
              onMouseLeave={ev=>ev.currentTarget.style.transform='scale(1)'}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function MsgBtn({icon,title,onClick,danger,emoji}) {
  return (
    <button title={title} onClick={onClick} style={{width:28,height:28,borderRadius:8,border:'none',cursor:'pointer',background:'transparent',color:danger?'var(--red)':'var(--text2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:emoji?16:12,transition:'background 0.12s'}}
      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      {icon}
    </button>
  );
}

// ── Список сообщений ────────────────────────────────────────
function MessageList({ channelKey, isDM, dmUserId, onReply, onPin, onEdit, onDelete, onReact, canManage }) {
  const { messages, loadMessages, currentUser } = useApp();
  const [dmMsgs,  setDmMsgs]  = useState([]);
  const [dmReady, setDmReady] = useState(false);
  const [ready,   setReady]   = useState(false);
  const bottomRef = useRef();

  useEffect(()=>{
    if (!isDM||!dmUserId) return;
    setDmReady(false);
    const load = async()=>{
      const {data} = await supabase.from('direct_messages').select('*')
        .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${dmUserId}),and(from_user_id.eq.${dmUserId},to_user_id.eq.${currentUser.id})`)
        .order('created_at',{ascending:true}).limit(100);
      setDmMsgs((data||[]).map(m=>({
        id:m.id, userId:m.from_user_id, from_user_id:m.from_user_id, text:m.text,
        is_pinned:m.is_pinned, edited_at:m.edited_at, deleted_at:m.deleted_at, reactions:m.reactions||{},
        time:new Date(m.created_at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}),
      })));
      setDmReady(true);
      await supabase.from('direct_messages').update({is_read:true}).eq('to_user_id',currentUser.id).eq('from_user_id',dmUserId).eq('is_read',false);
    };
    load();
    const sub = supabase.channel(`dm-${currentUser.id}-${dmUserId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages'},payload=>{
        const m=payload.new;
        if((m.from_user_id===currentUser.id&&m.to_user_id===dmUserId)||(m.from_user_id===dmUserId&&m.to_user_id===currentUser.id)){
          setDmMsgs(prev=>[...prev,{id:m.id,userId:m.from_user_id,text:m.text,reactions:m.reactions||{},time:new Date(m.created_at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}]);
        }
      }).subscribe();
    return ()=>sub.unsubscribe();
  },[isDM,dmUserId,currentUser.id]);

  useEffect(()=>{
    if(isDM) return;
    setReady(false);
    loadMessages(channelKey).then(()=>setReady(true));
  },[channelKey]); // eslint-disable-line

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[isDM?dmMsgs.length:(messages[channelKey]||[]).length]);

  const msgs = isDM ? dmMsgs : (messages[channelKey]||[]);
  const isReady = isDM ? dmReady : ready;

  if(!isReady) return <div className="empty-state" style={{flex:1}}><div style={{fontSize:13,color:'var(--text3)'}}>Загрузка...</div></div>;
  if(msgs.length===0) return <div className="empty-state" style={{flex:1}}><div className="icon">💬</div><p>Нет сообщений.<br/>Напишите первым!</p></div>;

  return (
    <div style={{flex:1,overflowY:'auto',padding:'16px 16px 8px'}}>
      {msgs.map(msg=>(
        <MessageBubble key={msg.id} msg={msg}
          onReply={onReply} onPin={onPin} onEdit={onEdit}
          onDelete={onDelete} onReact={onReact} canManage={canManage}/>
      ))}
      <div ref={bottomRef}/>
    </div>
  );
}

// ── Поле ввода ──────────────────────────────────────────────
function MessageInput({ channelKey, readonly, isDM, dmUserId, replyTo, onClearReply }) {
  const { sendMessage, currentUser } = useApp();
  const [text, setText] = useState('');

  const handleSend = async()=>{
    if(!text.trim()) return;
    const t = text; setText('');
    if(isDM&&dmUserId){
      await supabase.from('direct_messages').insert({from_user_id:currentUser.id,to_user_id:dmUserId,text:t.trim(),reply_to:replyTo?.id||null});
    } else {
      await sendMessage(channelKey,t,replyTo?.id||null);
    }
    onClearReply?.();
  };

  const handleKey = e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} };

  if(readonly) return (
    <div style={{padding:'12px 16px',background:'var(--bg-raised)',borderTop:'1px solid var(--border)',textAlign:'center',fontSize:13,color:'var(--text3)'}}>
      Только для чтения
    </div>
  );

  return (
    <div style={{borderTop:'1px solid var(--border)',background:'var(--bg-surface)'}}>
      {replyTo && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 16px 0'}}>
          <div style={{flex:1,fontSize:12,color:'var(--accent-bright)',padding:'4px 10px',background:'var(--accent-dim)',borderRadius:8,borderLeft:'2px solid var(--accent)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            Ответ: {replyTo.text?.slice(0,60)}
          </div>
          <button onClick={onClearReply} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4}}>{IC.close}</button>
        </div>
      )}
      <div style={{display:'flex',gap:8,alignItems:'flex-end',padding:'10px 14px'}}>
        <div className="avatar avatar-sm" style={{background:currentUser?.color||'var(--accent)',marginBottom:2,flexShrink:0}}>{currentUser?.initials}</div>
        <div style={{flex:1}}>
          <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={handleKey}
            placeholder="Написать... (Enter — отправить)"
            rows={1}
            style={{width:'100%',borderRadius:20,fontSize:15,padding:'9px 14px',resize:'none',minHeight:38,maxHeight:120,background:'var(--bg-overlay)',border:'1px solid var(--border2)',color:'var(--text)',fontFamily:'inherit',outline:'none'}}/>
        </div>
        <button onClick={handleSend} disabled={!text.trim()} style={{width:38,height:38,borderRadius:'50%',flexShrink:0,background:text.trim()?'var(--accent)':'var(--bg-overlay)',color:text.trim()?'#fff':'var(--text3)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:text.trim()?'0 0 12px var(--accent-glow)':'none',transition:'all 0.18s'}}>
          {IC.send}
        </button>
      </div>
    </div>
  );
}

function ChannelItem({ icon, name, active, unread, onClick, compact }) {
  return (
    <div className={`channel-item${active?' active':''}`} onClick={onClick}
      title={compact?name:undefined}
      style={{justifyContent:compact?'center':'flex-start',padding:compact?'10px 0':'9px 18px'}}>
      <span style={{fontSize:18,width:22,textAlign:'center',flexShrink:0}}>{icon}</span>
      {!compact&&<span style={{flex:1,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>}
      {unread>0&&<span style={{background:'var(--red)',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:10,minWidth:16,textAlign:'center',flexShrink:0}}>{unread}</span>}
    </div>
  );
}

// ── Главный компонент ───────────────────────────────────────
export default function ChatLayout() {
  const { currentUser } = useApp();
  const role   = currentUser?.role;
  const cityId = currentUser?.city_id || 'moscow';
  const city   = CITIES.find(c=>c.id===cityId);

  const [selected,        setSelected]        = useState(null);
  const [showSidebar,     setShowSidebar]      = useState(false);
  const [compact,         setCompact]          = useState(false);
  const [channelModal,    setChannelModal]     = useState(null);
  const [dmPicker,        setDmPicker]         = useState(false);
  const [dmUser,          setDmUser]           = useState(null);
  const [replyTo,         setReplyTo]          = useState(null);
  const [pinnedMsg,       setPinnedMsg]        = useState(null);
  const [searchQuery,     setSearchQuery]      = useState('');
  const [showSearch,      setShowSearch]       = useState(false);
  const [dynamicChannels, setDynamicChannels]  = useState([]);
  const [dmUnread,        setDmUnread]         = useState(0);

  const isAdmin   = ADMIN_ROLES.includes(role);
  const canManage = CAN_MANAGE_MESSAGES.includes(role);
  const canCreate = CAN_CREATE_CHANNELS.includes(role);

  const loadDynamicChannels = useCallback(async()=>{
    const {data} = await supabase.from('channels').select('*').eq('is_archived',false).order('created_at',{ascending:true});
    setDynamicChannels(data||[]);
  },[]);

  useEffect(()=>{ loadDynamicChannels(); },[loadDynamicChannels]);

  useEffect(()=>{
    if(!currentUser) return;
    supabase.from('direct_messages').select('id',{count:'exact',head:true}).eq('to_user_id',currentUser.id).eq('is_read',false)
      .then(({count})=>setDmUnread(count||0));
  },[currentUser]);

  const cityChannels = CITY_CHANNELS.map(ch=>({
    key:`${cityId}_${ch.id}`, name:ch.name, icon:ch.icon, description:ch.description,
    readonly:ch.readonly&&!isAdmin, section:city?.name||'Город', static:true,
  }));

  const schoolChannels = [];
  if(['student','teacher'].includes(role)||isAdmin){
    const schoolId=currentUser?.school_id;
    const school=SCHOOLS.find(s=>s.id===schoolId);
    if(school&&schoolId){
      schoolChannels.push(
        {key:`school_${schoolId}_general`,  name:'Общий чат',    icon:'💬', section:school.name},
        {key:`school_${schoolId}_homework`, name:'Задания',       icon:'📝', section:school.name},
        {key:`school_${schoolId}_materials`,name:'Материалы',     icon:'📚', section:school.name, readonly:role==='student'},
        {key:`school_${schoolId}_results`,  name:'Результаты',    icon:'🏆', section:school.name},
      );
    }
  }

  const mentorChannels = [];
  if(['mentor','mentee'].includes(role)||isAdmin){
    const mentorId=role==='mentor'?currentUser?.id:currentUser?.mentor_id;
    if(mentorId){
      mentorChannels.push(
        {key:`mentor_${mentorId}_general`,name:'Группа наставничества',icon:'🌱',section:'Наставничество'},
        {key:`mentor_${mentorId}_tasks`,  name:'Задания и цели',       icon:'🎯',section:'Наставничество'},
      );
      if(role==='mentee')
        mentorChannels.push({key:`mentor_${mentorId}_personal_${currentUser.id}`,name:'Личный чат с наставником',icon:'👤',section:'Наставничество'});
    }
  }

  const adminChannels = isAdmin ? [
    {key:'admin_managers',name:'Руководство',  icon:'🌍',section:'Администрирование'},
    {key:'admin_teachers',name:'Преподаватели',icon:'👨‍🏫',section:'Администрирование'},
  ] : [];

  const dynFormatted = dynamicChannels.map(ch=>({
    key:`dyn_${ch.id}`, dynId:ch.id, name:ch.name, icon:ch.icon||'💬',
    description:ch.description, section:'Дополнительные',
    readonly:(ch.readonly_roles||[]).includes(role)&&!isAdmin,
  }));

  const allChannels = [...cityChannels,...schoolChannels,...mentorChannels,...adminChannels,...dynFormatted];

  const dmCh = dmUser ? {key:`dm_${dmUser.id}`,name:dmUser.name,icon:'💬',isDM:true,dmUserId:dmUser.id,section:'Личные сообщения'} : null;

  useEffect(()=>{
    if(!selected&&allChannels.length>0) setSelected(allChannels[0]);
  },[role]); // eslint-disable-line

  const sections = {};
  const all = dmCh ? [dmCh,...allChannels] : allChannels;
  all.forEach(ch=>{
    if(!sections[ch.section]) sections[ch.section]=[];
    sections[ch.section].push(ch);
  });

  const selectCh = ch=>{ setSelected(ch); setShowSidebar(false); setPinnedMsg(null); setReplyTo(null); };

  const handlePin = async msg=>{ const v=!msg.is_pinned; await supabase.from('messages').update({is_pinned:v}).eq('id',msg.id); if(v) setPinnedMsg(msg); else setPinnedMsg(null); };
  const handleDelete = async msg=>{ if(!window.confirm('Удалить?')) return; const t=selected?.isDM?'direct_messages':'messages'; await supabase.from(t).update({deleted_at:new Date().toISOString()}).eq('id',msg.id); };
  const handleEdit = async msg=>{ const nt=window.prompt('Редактировать:',msg.text); if(!nt||nt===msg.text) return; const t=selected?.isDM?'direct_messages':'messages'; await supabase.from(t).update({text:nt,edited_at:new Date().toISOString()}).eq('id',msg.id); };
  const handleReact = async(msg,emoji)=>{ const t=selected?.isDM?'direct_messages':'messages'; const {data}=await supabase.from(t).select('reactions').eq('id',msg.id).single(); const r=data?.reactions||{}; const u=r[emoji]||[]; const nu=u.includes(currentUser.id)?u.filter(x=>x!==currentUser.id):[...u,currentUser.id]; await supabase.from(t).update({reactions:{...r,[emoji]:nu}}).eq('id',msg.id); };
  const handleDelCh = async ch=>{ if(!window.confirm(`Удалить «${ch.name}»?`)) return; await supabase.from('channels').delete().eq('id',ch.dynId); loadDynamicChannels(); if(selected?.key===ch.key) setSelected(allChannels[0]||null); };

  const isWriteable = selected && canWrite(role, selected);

  return (
    <div style={{display:'flex',flex:1,height:'100%',overflow:'hidden',position:'relative'}}>

      {showSidebar&&<div onClick={()=>setShowSidebar(false)} className="mobile-chat-overlay"
        style={{display:'none',position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',zIndex:50}}/>}

      {/* Сайдбар */}
      <div style={{width:compact?52:240,background:'var(--bg-raised)',borderRight:'1px solid var(--border)',overflowY:'auto',flexShrink:0,transition:'width 0.2s ease',display:'flex',flexDirection:'column'}} className="chat-sidebar">
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:compact?'center':'space-between',gap:6,flexShrink:0}}>
          {!compact&&(
            <button onClick={()=>setShowSearch(v=>!v)} style={{flex:1,padding:'6px 10px',borderRadius:8,background:'var(--bg-overlay)',border:'1px solid var(--border2)',color:'var(--text3)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13}}>
              {IC.search} Поиск
            </button>
          )}
          <button onClick={()=>setCompact(v=>!v)} className="btn-ghost" style={{padding:'6px 8px',fontSize:13}}>{compact?'›':'‹'}</button>
        </div>

        {showSearch&&!compact&&(
          <div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)'}}>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Поиск по каналам..."
              style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg-overlay)',color:'var(--text)',fontFamily:'inherit',fontSize:13,outline:'none'}}/>
          </div>
        )}

        <div style={{flex:1,overflowY:'auto',paddingBottom:8}}>
          <div style={{padding:'10px 12px 4px'}}>
            <button onClick={()=>setDmPicker(true)} style={{width:'100%',padding:compact?'8px 0':'8px 12px',borderRadius:10,background:'var(--accent-dim)',border:'1px solid var(--accent-border,var(--border))',color:'var(--accent-bright)',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',justifyContent:compact?'center':'flex-start',gap:6,transition:'all 0.15s'}}>
              {IC.dm}
              {!compact&&<span>Написать напрямую</span>}
              {dmUnread>0&&<span style={{marginLeft:'auto',background:'var(--red)',color:'#fff',fontSize:10,padding:'1px 5px',borderRadius:10}}>{dmUnread}</span>}
            </button>
          </div>

          {Object.entries(sections).map(([section,channels])=>{
            const filtered = searchQuery ? channels.filter(c=>c.name.toLowerCase().includes(searchQuery.toLowerCase())) : channels;
            if(filtered.length===0) return null;
            return (
              <div key={section}>
                {!compact&&(
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 18px 4px'}}>
                    <span className="section-label" style={{padding:0,fontSize:10}}>{section}</span>
                    {canCreate&&(
                      <button onClick={()=>setChannelModal({})} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:2,display:'flex',alignItems:'center',gap:3,fontSize:11}}>
                        {IC.plus}
                      </button>
                    )}
                  </div>
                )}
                {filtered.map(ch=>(
                  <div key={ch.key} style={{display:'flex',alignItems:'center',position:'relative'}}>
                    <div style={{flex:1}}>
                      <ChannelItem icon={ch.icon} name={ch.name} active={selected?.key===ch.key} compact={compact} unread={0} onClick={()=>selectCh(ch)}/>
                    </div>
                    {!compact&&ch.dynId&&canManage&&selected?.key===ch.key&&(
                      <button onClick={()=>handleDelCh(ch)} style={{position:'absolute',right:8,background:'none',border:'none',color:'var(--red)',cursor:'pointer',padding:4,fontSize:11}}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Основная область */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {selected ? (
          <>
            <div style={{padding:'11px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg-surface)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
              <button className="mobile-menu-btn" onClick={()=>setShowSidebar(true)}
                style={{display:'none',width:34,height:34,borderRadius:10,background:'var(--bg-overlay)',border:'none',color:'var(--text2)',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {IC.menu}
              </button>
              <span style={{fontSize:20,flexShrink:0}}>{selected.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected.name}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{selected.description||selected.section}</div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                {canCreate&&!selected.isDM&&(
                  <button onClick={()=>setChannelModal(selected.dynId?dynamicChannels.find(c=>c.id===selected.dynId)||{}:{})}
                    className="btn-ghost" style={{padding:'6px 10px',fontSize:12,display:'flex',alignItems:'center',gap:4}}>
                    {IC.plus} Канал
                  </button>
                )}
              </div>
            </div>

            {pinnedMsg&&(
              <div style={{padding:'8px 16px',background:'var(--accent-dim)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                <span style={{color:'var(--accent)',fontSize:13,flexShrink:0}}>{IC.pin}</span>
                <div style={{flex:1,fontSize:13,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pinnedMsg.text}</div>
                {canManage&&<button onClick={()=>setPinnedMsg(null)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer'}}>{IC.close}</button>}
              </div>
            )}

            {!isWriteable&&!selected.isDM&&role==='guest'&&(
              <div style={{padding:'8px 16px',background:'var(--amber-dim)',borderBottom:'1px solid var(--border)',fontSize:13,color:'var(--amber)'}}>
                Этот канал только для участников клуба.
              </div>
            )}

            <MessageList channelKey={selected.key} isDM={!!selected.isDM} dmUserId={selected.dmUserId}
              onReply={setReplyTo} onPin={canManage?handlePin:null}
              onEdit={handleEdit} onDelete={handleDelete} onReact={handleReact} canManage={canManage}/>

            <MessageInput channelKey={selected.key} readonly={!isWriteable&&!selected.isDM}
              isDM={!!selected.isDM} dmUserId={selected.dmUserId}
              replyTo={replyTo} onClearReply={()=>setReplyTo(null)}/>
          </>
        ) : (
          <div className="empty-state"><div className="icon">💬</div><p>Выберите канал</p></div>
        )}
      </div>

      {channelModal!==null&&(
        <ChannelModal channel={channelModal?.id?channelModal:null} cityId={cityId}
          schoolId={currentUser?.school_id} mentorId={role==='mentor'?currentUser?.id:null}
          onClose={()=>setChannelModal(null)} onSaved={()=>{setChannelModal(null);loadDynamicChannels();}}/>
      )}
      {dmPicker&&(
        <DMPickerModal onClose={()=>setDmPicker(false)}
          onSelect={u=>{setDmUser(u);selectCh({key:`dm_${u.id}`,name:u.name,icon:'💬',isDM:true,dmUserId:u.id,section:'Личные сообщения'});}}/>
      )}

      <style>{`
        @media(max-width:768px){
          .chat-sidebar{position:absolute!important;top:0;left:0;bottom:0;width:240px!important;z-index:60;transform:translateX(${showSidebar?'0':'-100%'});transition:transform 0.28s cubic-bezier(0.4,0,0.2,1);box-shadow:${showSidebar?'4px 0 24px rgba(0,0,0,0.4)':'none'};}
          .mobile-chat-overlay{display:block!important;}
          .mobile-menu-btn{display:flex!important;}
        }
      `}</style>
    </div>
  );
}

const MOD = {
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)'},
  sheet:  {background:'var(--bg-raised)',border:'1px solid var(--glass-border2,var(--border))',borderRadius:'var(--r-xl) var(--r-xl) 0 0',width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column'},
  handle: {width:38,height:4,borderRadius:2,background:'var(--border2)',margin:'10px auto 0',flexShrink:0},
  header: {padding:'16px 20px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0},
  title:  {fontSize:17,fontWeight:700,color:'var(--text)'},
  close:  {width:30,height:30,borderRadius:'50%',background:'var(--bg-overlay)',border:'none',color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'},
  body:   {padding:'16px 20px',overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:14},
  footer: {padding:'12px 20px',borderTop:'1px solid var(--border)',display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0},
};
const F = {
  field:{display:'flex',flexDirection:'column',gap:7},
  label:{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:0.5},
};
