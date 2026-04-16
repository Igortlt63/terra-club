import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { CITY_CHANNELS, SCHOOLS, CITIES } from '../data/db';
import { supabase } from '../supabase';

const ADMIN_ROLES = ['admin'];
const CAN_CREATE  = ['admin', 'teacher', 'mentor'];
const CAN_MANAGE  = ['admin', 'teacher', 'mentor'];

const ROLE_RU = {
  admin:'Руководство', teacher:'Преподаватель', student:'Ученик',
  mentor:'Наставник',  mentee:'Наставляемый',   member:'Участник',
  guest:'Гость',       developer:'Разработчик',
};

// ── Поле ввода ──────────────────────────────────────────────
const IC = {
  send:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  reply:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>,
  pin:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  del:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  dm:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  plus:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  menu:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  check:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  emoji:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
};

function MessageInput({ channelKey, readonly, isDM, dmUserId, replyTo, onClearReply, editingMsg, onCancelEdit }) {
  const { sendMessage, currentUser } = useApp();
  const [text,        setText]       = useState('');
  const [showEmoji,   setShowEmoji]  = useState(false);
  const taRef  = useRef();
  const wrapRef = useRef();

  useEffect(()=>{
    if (editingMsg) { setText(editingMsg.text||''); setTimeout(()=>taRef.current?.focus(),50); }
  },[editingMsg]);

  const insertText = (str) => {
    const ta = taRef.current;
    if (!ta) { setText(t=>t+str); return; }
    const start = ta.selectionStart || text.length;
    const end   = ta.selectionEnd   || text.length;
    const newText = text.slice(0,start) + str + text.slice(end);
    setText(newText);
    setTimeout(()=>{ ta.focus(); ta.setSelectionRange(start+str.length, start+str.length); },0);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const t = text; setText('');
    if (editingMsg) {
      const table = isDM ? 'direct_messages' : 'messages';
      await supabase.from(table).update({text:t.trim(),edited_at:new Date().toISOString()}).eq('id',editingMsg.id);
      onCancelEdit?.(); return;
    }
    if (isDM&&dmUserId) {
      await supabase.from('direct_messages').insert({from_user_id:currentUser.id,to_user_id:dmUserId,text:t.trim(),reply_to:replyTo?.id||null});
    } else {
      await sendMessage(channelKey,t.trim(),replyTo?.id||null);
    }
    onClearReply?.();
  };

  const handleKey = e=>{
    if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key==='Escape') { if(editingMsg){setText('');onCancelEdit?.();}else{onClearReply?.();} setShowEmoji(false); }
  };

  if (readonly) return (
    <div style={{padding:'12px 16px',background:'var(--bg-raised)',borderTop:'1px solid var(--border)',textAlign:'center',fontSize:13,color:'var(--text3)'}}>
      Только для чтения
    </div>
  );

  const isEditing = !!editingMsg;

  return (
    <div style={{borderTop:'1px solid var(--border)',background:'var(--bg-surface)'}}>
      {replyTo&&!isEditing&&(
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 16px',background:'rgba(59,130,246,0.06)',borderBottom:'1px solid var(--border)'}}>
          <div style={{width:2,alignSelf:'stretch',background:'var(--accent)',borderRadius:2,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,color:'var(--accent-bright)',fontWeight:600,marginBottom:1}}>Ответ</div>
            <div style={{fontSize:13,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{replyTo.text?.slice(0,80)}</div>
          </div>
          <button onClick={onClearReply} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4,flexShrink:0}}>{IC.close}</button>
        </div>
      )}
      {isEditing&&(
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 16px',background:'rgba(251,191,36,0.08)',borderBottom:'1px solid var(--border)'}}>
          <div style={{width:2,alignSelf:'stretch',background:'#FBBF24',borderRadius:2,flexShrink:0}}/>
          <div style={{flex:1,fontSize:12,color:'#FBBF24'}}>Редактирование · Esc — отмена</div>
          <button onClick={()=>{setText('');onCancelEdit?.();}} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4,flexShrink:0}}>{IC.close}</button>
        </div>
      )}
      <div ref={wrapRef} style={{display:'flex',gap:6,alignItems:'flex-end',padding:'10px 12px',position:'relative'}}>
        <div className="avatar avatar-sm" style={{background:currentUser?.color||'var(--accent)',marginBottom:2,flexShrink:0}}>{currentUser?.initials||'?'}</div>
        {/* Кнопка эмодзи */}
        <div style={{position:'relative',flexShrink:0}}>
          <button onClick={()=>setShowEmoji(v=>!v)}
            style={{width:34,height:34,borderRadius:10,border:'none',cursor:'pointer',background:showEmoji?'var(--accent-dim)':'var(--bg-overlay)',color:showEmoji?'var(--accent-bright)':'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
            {IC.emoji}
          </button>
          {showEmoji&&<EmojiPicker onSelect={e=>{insertText(e);}} onClose={()=>setShowEmoji(false)}/>}
        </div>
        <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={handleKey}
          placeholder={isEditing?'Редактировать...':'Написать... (Enter — отправить)'}
          rows={1}
          style={{flex:1,borderRadius:20,fontSize:15,padding:'9px 14px',resize:'none',minHeight:38,maxHeight:120,background:'var(--bg-overlay)',border:isEditing?'1px solid #FBBF24':'1px solid var(--border2)',color:'var(--text)',fontFamily:'inherit',outline:'none',transition:'border-color 0.15s'}}/>
        <button onClick={handleSend} disabled={!text.trim()}
          style={{width:38,height:38,borderRadius:'50%',flexShrink:0,background:text.trim()?'var(--accent)':'var(--bg-overlay)',color:text.trim()?'#fff':'var(--text3)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:text.trim()?'0 0 12px var(--accent-glow)':'none',transition:'all 0.18s'}}>
          {isEditing ? IC.check : IC.send}
        </button>
      </div>
    </div>
  );
}

// ── Пункт сайдбара ──────────────────────────────────────────
function ChannelItem({ icon, name, active, unread, onClick, compact, onClose: onCloseItem }) {
  const [hov, setHov] = useState(false);
  return (
    <div className={`channel-item${active?' active':''}`} onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      title={compact?name:undefined}
      style={{justifyContent:compact?'center':'flex-start',padding:compact?'10px 0':'9px 18px',position:'relative'}}>
      <span style={{fontSize:18,width:22,textAlign:'center',flexShrink:0}}>{icon}</span>
      {!compact&&<span style={{flex:1,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>}
      {!compact&&unread>0&&<span style={{background:'var(--red)',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:10,minWidth:16,textAlign:'center',flexShrink:0}}>{unread>99?'99+':unread}</span>}
      {!compact&&onCloseItem&&hov&&(
        <span onClick={e=>{e.stopPropagation();onCloseItem();}}
          style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',width:18,height:18,borderRadius:4,background:'var(--bg-overlay)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'var(--text3)',cursor:'pointer',zIndex:2}}>✕</span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ГЛАВНЫЙ КОМПОНЕНТ
// ══════════════════════════════════════════════════════════
export default function ChatLayout({ openDmWithUser, onDmOpened, onOpenProfile }) {
  const {
    currentUser, messages, dmMessages,
    unreadChannels, unreadDm, markChannelRead, setUnreadDm,
    loadDmMessages, getProfile, fetchProfile,
    updateLocalMessage, updateLocalDmMessage,
  } = useApp();

  const role   = currentUser?.role;
  const cityId = currentUser?.city_id || 'moscow';
  const city   = CITIES.find(c=>c.id===cityId);

  // ── Флаг: DM уже открыт, не сбрасывать selected ──────────
  const dmOpenedRef = useRef(false);

  const [activeDMs,    setActiveDMs]    = useState(()=>loadActiveDMs());
  const [selected,     setSelected]     = useState(null);
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [compact,      setCompact]      = useState(false);
  const [channelModal, setChannelModal] = useState(null);
  const [dmPicker,     setDmPicker]     = useState(false);
  const [replyTo,      setReplyTo]      = useState(null);
  const [editingMsg,   setEditingMsg]   = useState(null);
  const [pinnedMsg,    setPinnedMsg]    = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showSearch,   setShowSearch]   = useState(false);
  const [dynChannels,  setDynChannels]  = useState([]);

  const isAdmin   = ADMIN_ROLES.includes(role);
  const canManage = CAN_MANAGE.includes(role);
  const canCreate = CAN_CREATE.includes(role);

  useEffect(()=>{ saveActiveDMs(activeDMs); },[activeDMs]);

  const loadDynChannels = useCallback(async()=>{
    const {data} = await supabase.from('channels').select('*').eq('is_archived',false).order('created_at',{ascending:true});
    setDynChannels(data||[]);
  },[]);

  useEffect(()=>{ loadDynChannels(); },[loadDynChannels]);

  // Загружаем профили собеседников из localStorage
  useEffect(()=>{
    if (!currentUser) return;
    Object.keys(activeDMs).forEach(uid=>{ if (!getProfile(uid)) fetchProfile(uid); });
  },[currentUser]); // eslint-disable-line

  // Новые непрочитанные DM → добавить в activeDMs
  useEffect(()=>{
    if (!unreadDm) return;
    setActiveDMs(prev=>{
      let changed = false;
      const next = {...prev};
      Object.entries(unreadDm).forEach(([uid,cnt])=>{
        if (cnt>0 && !next[uid]) { next[uid]={uid,since:Date.now()}; changed=true; }
      });
      return changed ? next : prev;
    });
  },[unreadDm]);

  // ── openDM — устанавливаем флаг чтобы начальный useEffect не сбросил ──
  const openDM = useCallback((user)=>{
    dmOpenedRef.current = true; // ← ключевой fix
    setActiveDMs(prev=>{
      const u = {...prev,[user.id]:{uid:user.id,name:user.name,initials:user.initials,color:user.color,since:Date.now()}};
      saveActiveDMs(u);
      return u;
    });
    const ch = {key:`dm_${user.id}`,name:user.name,icon:'💬',isDM:true,dmUserId:user.id,section:'Личные сообщения'};
    setSelected(ch);
    setShowSidebar(false);
    setReplyTo(null);
    setEditingMsg(null);
    setUnreadDm?.(prev=>({...prev,[user.id]:0}));
    loadDmMessages?.(user.id);
  },[setUnreadDm, loadDmMessages]);

  useEffect(()=>{
    if (openDmWithUser) { openDM(openDmWithUser); onDmOpened?.(); }
  },[openDmWithUser]); // eslint-disable-line

  // Каналы
  const cityChannels = CITY_CHANNELS.map(ch=>({
    key:`${cityId}_${ch.id}`,name:ch.name,icon:ch.icon,description:ch.description,
    readonly:ch.readonly&&!isAdmin,section:city?.name||'Город',static:true,
  }));

  const schoolChannels = [];
  if (['student','teacher'].includes(role)||isAdmin) {
    const sid=currentUser?.school_id; const sch=SCHOOLS.find(s=>s.id===sid);
    if (sid&&sch) schoolChannels.push(
      {key:`school_${sid}_general`,  name:'Общий чат',  icon:'💬',section:sch.name},
      {key:`school_${sid}_homework`, name:'Задания',     icon:'📝',section:sch.name},
      {key:`school_${sid}_materials`,name:'Материалы',   icon:'📚',section:sch.name,readonly:role==='student'},
      {key:`school_${sid}_results`,  name:'Результаты',  icon:'🏆',section:sch.name},
    );
  }

  const mentorChannels = [];
  if (['mentor','mentee'].includes(role)||isAdmin) {
    const mid=role==='mentor'?currentUser?.id:currentUser?.mentor_id;
    if (mid) {
      mentorChannels.push(
        {key:`mentor_${mid}_general`,name:'Группа',        icon:'🌱',section:'Наставничество'},
        {key:`mentor_${mid}_tasks`,  name:'Задания и цели', icon:'🎯',section:'Наставничество'},
      );
      if (role==='mentee') mentorChannels.push({key:`mentor_${mid}_personal_${currentUser.id}`,name:'Личный чат',icon:'👤',section:'Наставничество'});
    }
  }

  const adminChannels = isAdmin ? [
    {key:'admin_managers',name:'Руководство',  icon:'🌍',section:'Администрирование'},
    {key:'admin_teachers',name:'Преподаватели',icon:'👨‍🏫',section:'Администрирование'},
  ] : [];

  const dynFmt = dynChannels.map(ch=>({
    key:`dyn_${ch.id}`,dynId:ch.id,name:ch.name,icon:ch.icon||'💬',
    description:ch.description,section:'Дополнительные',
    readonly:(ch.readonly_roles||[]).includes(role)&&!isAdmin,
  }));

  const allChannels = [...cityChannels,...schoolChannels,...mentorChannels,...adminChannels,...dynFmt];

  // Начальный выбор — ТОЛЬКО если DM не был открыт через prop
  useEffect(()=>{
    if (dmOpenedRef.current) return; // ← не сбрасываем если DM открыт
    if (!selected && allChannels.length>0) setSelected(allChannels[0]);
  },[role]); // eslint-disable-line

  // DM-каналы из activeDMs
  const dmChannelsList = Object.values(activeDMs).map(dm=>{
    const profile = getProfile(dm.uid)||{name:dm.name||'Участник',initials:dm.initials||'?',color:dm.color};
    return {key:`dm_${dm.uid}`,name:profile.name||dm.name||'Участник',icon:'💬',isDM:true,dmUserId:dm.uid,section:'Личные сообщения'};
  });

  const sections = {};
  if (dmChannelsList.length>0) sections['Личные сообщения'] = dmChannelsList;
  allChannels.forEach(ch=>{
    if (!sections[ch.section]) sections[ch.section]=[];
    sections[ch.section].push(ch);
  });

  const selectCh = ch=>{
    setSelected(ch); setShowSidebar(false);
    setPinnedMsg(null); setReplyTo(null); setEditingMsg(null);
    if (ch.isDM) {
      setUnreadDm?.(prev=>({...prev,[ch.dmUserId]:0}));
      loadDmMessages?.(ch.dmUserId);
    } else {
      markChannelRead?.(ch.key);
    }
  };

  const closeDM = uid=>{
    setActiveDMs(prev=>{ const u={...prev}; delete u[uid]; saveActiveDMs(u); return u; });
    if (selected?.key===`dm_${uid}`) setSelected(allChannels[0]||null);
  };

  // Действия
  const handlePin = async msg=>{ const v=!msg.is_pinned; await supabase.from('messages').update({is_pinned:v}).eq('id',msg.id); setPinnedMsg(v?msg:null); };
  const handleDelete = async msg=>{ if(!window.confirm('Удалить?'))return; await supabase.from(selected?.isDM?'direct_messages':'messages').update({deleted_at:new Date().toISOString()}).eq('id',msg.id); };

  const handleReact = async (msg, emoji) => {
    // Optimistic update
    const updater = m => {
      const r = {...(m.reactions||{})};
      const u = r[emoji]||[];
      r[emoji] = u.includes(currentUser.id) ? u.filter(x=>x!==currentUser.id) : [...u,currentUser.id];
      return {...m, reactions:r};
    };
    if (selected?.isDM) updateLocalDmMessage?.(selected.dmUserId, msg.id, updater);
    else                updateLocalMessage?.(selected.key, msg.id, updater);
    // Supabase update
    const t = selected?.isDM?'direct_messages':'messages';
    const {data} = await supabase.from(t).select('reactions').eq('id',msg.id).single();
    const r = data?.reactions||{}; const u = r[emoji]||[];
    await supabase.from(t).update({reactions:{...r,[emoji]:u.includes(currentUser.id)?u.filter(x=>x!==currentUser.id):[...u,currentUser.id]}}).eq('id',msg.id);
  };

  const handleDelDynCh = async ch=>{ if(!window.confirm(`Удалить «${ch.name}»?`))return; await supabase.from('channels').delete().eq('id',ch.dynId); loadDynChannels(); if(selected?.key===ch.key) setSelected(allChannels[0]||null); };

  const totalDmUnread = Object.values(unreadDm||{}).reduce((a,b)=>a+b,0);
  const isWriteable   = selected && canWrite(role, selected);

  return (
    <div style={{display:'flex',flex:1,height:'100%',overflow:'hidden',position:'relative'}}>
      {showSidebar&&<div onClick={()=>setShowSidebar(false)} className="mobile-chat-overlay" style={{display:'none',position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',zIndex:50}}/>}

      {/* ── Сайдбар ── */}
      <div style={{width:compact?52:240,background:'var(--bg-raised)',borderRight:'1px solid var(--border)',overflowY:'auto',flexShrink:0,transition:'width 0.2s ease',display:'flex',flexDirection:'column'}} className="chat-sidebar">
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:compact?'center':'space-between',gap:6,flexShrink:0}}>
          {!compact&&<button onClick={()=>setShowSearch(v=>!v)} style={{flex:1,padding:'6px 10px',borderRadius:8,background:'var(--bg-overlay)',border:'1px solid var(--border2)',color:'var(--text3)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13}}>{IC.search} Поиск</button>}
          <button onClick={()=>setCompact(v=>!v)} className="btn-ghost" style={{padding:'6px 8px',fontSize:13}}>{compact?'›':'‹'}</button>
        </div>
        {showSearch&&!compact&&(
          <div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)'}}>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Поиск каналов..."
              style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg-overlay)',color:'var(--text)',fontFamily:'inherit',fontSize:13,outline:'none'}}/>
          </div>
        )}
        <div style={{flex:1,overflowY:'auto',paddingBottom:8}}>
          <div style={{padding:'10px 12px 4px'}}>
            <button onClick={()=>setDmPicker(true)} style={{width:'100%',padding:compact?'8px 0':'8px 12px',borderRadius:10,background:'var(--accent-dim)',border:'1px solid var(--border)',color:'var(--accent-bright)',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',justifyContent:compact?'center':'flex-start',gap:6,transition:'all 0.15s'}}>
              {IC.dm}
              {!compact&&<span>Написать напрямую</span>}
              {totalDmUnread>0&&<span style={{marginLeft:'auto',background:'var(--red)',color:'#fff',fontSize:10,padding:'1px 5px',borderRadius:10,flexShrink:0}}>{totalDmUnread>99?'99+':totalDmUnread}</span>}
            </button>
          </div>
          {Object.entries(sections).map(([section,channels])=>{
            const filtered=searchQuery?channels.filter(c=>c.name.toLowerCase().includes(searchQuery.toLowerCase())):channels;
            if(filtered.length===0) return null;
            return (
              <div key={section}>
                {!compact&&(
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 18px 4px'}}>
                    <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--text4)'}}>{section}</span>
                    {canCreate&&section!=='Личные сообщения'&&<button onClick={()=>setChannelModal({})} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:2}}>{IC.plus}</button>}
                  </div>
                )}
                {filtered.map(ch=>(
                  <div key={ch.key} style={{display:'flex',alignItems:'center',position:'relative'}}>
                    <div style={{flex:1}}>
                      <ChannelItem icon={ch.icon} name={ch.name} active={selected?.key===ch.key} compact={compact}
                        unread={ch.isDM?(unreadDm?.[ch.dmUserId]||0):(unreadChannels?.[ch.key]||0)}
                        onClick={()=>selectCh(ch)}
                        onClose={ch.isDM?()=>closeDM(ch.dmUserId):null}/>
                    </div>
                    {!compact&&ch.dynId&&canManage&&selected?.key===ch.key&&(
                      <button onClick={()=>handleDelDynCh(ch)} style={{position:'absolute',right:8,background:'none',border:'none',color:'var(--red)',cursor:'pointer',padding:4,fontSize:11}}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Основная область ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {selected?(
          <>
            <div style={{padding:'11px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg-surface)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
              <button className="mobile-menu-btn" onClick={()=>setShowSidebar(true)}
                style={{display:'none',width:34,height:34,borderRadius:10,background:'var(--bg-overlay)',border:'none',color:'var(--text2)',alignItems:'center',justifyContent:'center',flexShrink:0}}>{IC.menu}</button>
              <span style={{fontSize:20,flexShrink:0}}>{selected.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div
                  onClick={selected.isDM?()=>onOpenProfile&&onOpenProfile(selected.dmUserId):undefined}
                  style={{fontSize:15,fontWeight:600,color:selected.isDM?'var(--accent-bright)':'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:selected.isDM?'pointer':'default'}}>
                  {selected.name}
                </div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{selected.isDM?'Личное сообщение':selected.description||selected.section}</div>
              </div>
              {canCreate&&!selected.isDM&&<button onClick={()=>setChannelModal(selected.dynId?dynChannels.find(c=>c.id===selected.dynId)||{}:{})} className="btn-ghost" style={{padding:'6px 10px',fontSize:12,display:'flex',alignItems:'center',gap:4,flexShrink:0}}>{IC.plus} Канал</button>}
            </div>

            {pinnedMsg&&(
              <div style={{padding:'8px 16px',background:'var(--accent-dim)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                <span style={{color:'var(--accent)',flexShrink:0}}>{IC.pin}</span>
                <div style={{flex:1,fontSize:13,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pinnedMsg.text}</div>
                {canManage&&<button onClick={()=>setPinnedMsg(null)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',flexShrink:0}}>{IC.close}</button>}
              </div>
            )}
            {!isWriteable&&!selected.isDM&&role==='guest'&&(
              <div style={{padding:'8px 16px',background:'var(--amber-dim)',borderBottom:'1px solid var(--border)',fontSize:13,color:'var(--amber)'}}>
                Этот канал только для участников клуба.
              </div>
            )}

            <MessageList channelKey={selected.key} isDM={!!selected.isDM} dmUserId={selected.dmUserId}
              onReply={setReplyTo}
              onPin={canManage?handlePin:null}
              onEdit={msg=>{setEditingMsg(msg);setReplyTo(null);}}
              onDelete={handleDelete} onReact={handleReact} canManage={canManage}
              onOpenProfile={uid=>onOpenProfile&&onOpenProfile(uid)}/>

            <MessageInput channelKey={selected.key} readonly={!isWriteable&&!selected.isDM}
              isDM={!!selected.isDM} dmUserId={selected.dmUserId}
              replyTo={replyTo} onClearReply={()=>setReplyTo(null)}
              editingMsg={editingMsg} onCancelEdit={()=>setEditingMsg(null)}/>
          </>
        ):(
          <div className="empty-state"><div className="icon">💬</div><p>Выберите канал</p></div>
        )}
      </div>

      {channelModal!==null&&<ChannelModal channel={channelModal?.id?channelModal:null} cityId={cityId} schoolId={currentUser?.school_id} mentorId={role==='mentor'?currentUser?.id:null} onClose={()=>setChannelModal(null)} onSaved={()=>{setChannelModal(null);loadDynChannels();}}/>}
      {dmPicker&&<DMPickerModal onClose={()=>setDmPicker(false)} onSelect={u=>openDM(u)}/>}

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
  sheet:  {background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:'var(--r-xl,20px) var(--r-xl,20px) 0 0',width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column'},
  handle: {width:38,height:4,borderRadius:2,background:'var(--border2)',margin:'10px auto 0',flexShrink:0},
  header: {padding:'16px 20px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0},
  title:  {fontSize:17,fontWeight:700,color:'var(--text)'},
  closeBt:{width:30,height:30,borderRadius:'50%',background:'var(--bg-overlay)',border:'none',color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'},
  body:   {padding:'16px 20px',overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:14},
  footer: {padding:'12px 20px',borderTop:'1px solid var(--border)',display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0},
};
const F = {
  field:{display:'flex',flexDirection:'column',gap:7},
  label:{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:0.5},
};

function canWrite(role, channel) {
  if (channel?.readonly) return ADMIN_ROLES.includes(role);
  return true;
}

const REACTIONS  = ['👍','❤️','😂','😮','😢','🔥'];
const ROLE_BADGE = {
  admin:'badge-admin', teacher:'badge-teacher', student:'badge-student',
  mentor:'badge-mentor', mentee:'badge-mentee', guest:'badge-guest', member:'badge-member',
};
const ICONS_LIST = ['💬','📢','📝','🎓','🤝','❤️','⚡','🏆','📚','🎯','🌱','📊','🗣️','👥'];

const DM_STORAGE_KEY = 'terra_active_dms';
function loadActiveDMs() {
  try { return JSON.parse(localStorage.getItem(DM_STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveActiveDMs(dms) {
  try { localStorage.setItem(DM_STORAGE_KEY, JSON.stringify(dms)); } catch {}
}

// ── Telegram-style emoji picker ─────────────────────────────
const EMOJI_CATEGORIES = [
  { label:'😊', emojis:['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀'] },
  { label:'👋', emojis:['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🤝','🙏','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','🫦'] },
  { label:'❤️', emojis:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','✡️','🔯','🗯','💬','💭','💤','🔥','✨','⭐','🌟','💫','⚡','🌈','🎯','🎉','🎊','🎁','🎈'] },
  { label:'🐶', emojis:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🦂','🐢','🐍','🦎','🦖','🐙','🦑','🦐','🦞','🦀','🐡','🐟','🐠','🐬','🐳','🐋','🦈','🐊','🦧','🦍'] },
  { label:'🍕', emojis:['🍕','🍔','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥗','🍿','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🥪','🥫','🧀','🍱','🍣','🍛','🍜','🍝','🥟','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯'] },
  { label:'⚽', emojis:['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥍','🏑','🪃','🏹','🎣','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🏋','🤼','🤸','🏊','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖','🎪','🎭','🎨','🎬','🎤','🎧','🎵','🎶','🎹','🥁','🪘','🎸','🎺','🎻','🪗'] },
  { label:'🚗', emojis:['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍','🛵','🚲','🛴','🛺','🚁','🛸','🚀','✈️','🛩','🚂','🚢','⛵','🛥','🛳','🚤','🛶','⛴','🚆','🚇','🚈','🚊','🚉','🏔','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🏘','🏚','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏧'] },
];

function EmojiPicker({ onSelect, onClose }) {
  const [category, setCategory] = useState(0);
  const [search,   setSearch]   = useState('');
  const ref = useRef();

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const emojis = search
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(search))
    : EMOJI_CATEGORIES[category].emojis;

  return (
    <div ref={ref} style={{
      position:'absolute', bottom:'calc(100% + 8px)',
      left:0, width:320, maxHeight:320,
      background:'var(--bg-raised)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-lg)',
      zIndex:200, display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      {/* Поиск */}
      <div style={{padding:'8px 10px', borderBottom:'1px solid var(--border)'}}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Поиск эмодзи..."
          style={{width:'100%',padding:'6px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg-overlay)',color:'var(--text)',fontSize:13,outline:'none',fontFamily:'inherit'}}
        />
      </div>
      {/* Категории */}
      {!search && (
        <div style={{display:'flex',borderBottom:'1px solid var(--border)',overflowX:'auto',flexShrink:0}}>
          {EMOJI_CATEGORIES.map((cat,i)=>(
            <button key={i} onClick={()=>setCategory(i)}
              style={{padding:'6px 10px',border:'none',cursor:'pointer',fontSize:16,background:category===i?'var(--accent-dim)':'transparent',borderBottom:category===i?'2px solid var(--accent)':'2px solid transparent',transition:'all 0.15s',flexShrink:0}}>
              {cat.label}
            </button>
          ))}
        </div>
      )}
      {/* Эмодзи */}
      <div style={{display:'flex',flexWrap:'wrap',padding:8,overflowY:'auto',gap:2}}>
        {emojis.map(e=>(
          <button key={e} onClick={()=>onSelect(e)}
            style={{width:34,height:34,fontSize:20,border:'none',cursor:'pointer',background:'transparent',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.1s'}}
            onMouseEnter={ev=>ev.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} style={{width:46,height:28,borderRadius:14,cursor:'pointer',position:'relative',background:on?'var(--accent)':'rgba(255,255,255,0.12)',border:on?'none':'1px solid var(--border2)',transition:'all 0.22s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:on?21:3,width:20,height:20,borderRadius:'50%',background:'#fff',boxShadow:'0 2px 6px rgba(0,0,0,0.3)',transition:'left 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}/>
    </div>
  );
}

// ── Модалка канала ──────────────────────────────────────────
function ChannelModal({ channel, cityId, schoolId, mentorId, onClose, onSaved }) {
  const { currentUser } = useApp();
  const [name,     setName]     = useState(channel?.name||'');
  const [desc,     setDesc]     = useState(channel?.description||'');
  const [icon,     setIcon]     = useState(channel?.icon||'💬');
  const [readonly, setReadonly] = useState(channel?(channel.readonly_roles||[]).includes('student'):true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Введите название'); return; }
    setSaving(true);
    const payload = {
      name:name.trim(), description:desc.trim()||null, icon,
      city_id:cityId||null, school_id:schoolId||null, mentor_id:mentorId||null,
      type:schoolId?'school':mentorId?'mentor':'city',
      readonly_roles:readonly?['guest','student','member','mentee']:[],
      write_roles:['admin','teacher','mentor'],
      created_by:currentUser.id,
    };
    const { error:err } = channel?.id
      ? await supabase.from('channels').update(payload).eq('id',channel.id)
      : await supabase.from('channels').insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  return (
    <div style={MOD.overlay} onClick={onClose}>
      <div style={MOD.sheet} onClick={e=>e.stopPropagation()}>
        <div style={MOD.handle}/>
        <div style={MOD.header}>
          <span style={MOD.title}>{channel?'Редактировать канал':'Новый канал'}</span>
          <button onClick={onClose} style={MOD.closeBt}>{IC.close}</button>
        </div>
        <div style={MOD.body}>
          <div style={F.field}>
            <label style={F.label}>Иконка</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {ICONS_LIST.map(ic=>(
                <button key={ic} onClick={()=>setIcon(ic)} style={{width:36,height:36,fontSize:18,borderRadius:8,border:'none',cursor:'pointer',background:icon===ic?'var(--accent-dim)':'var(--bg-overlay)',outline:icon===ic?'2px solid var(--accent)':'none',transition:'all 0.15s'}}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={F.field}><label style={F.label}>Название *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Название канала"/></div>
          <div style={F.field}><label style={F.label}>Описание</label><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Краткое описание"/></div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0'}}>
            <div>
              <div style={{fontSize:15,color:'var(--text)',fontWeight:500}}>Только для чтения</div>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>Ученики и участники не могут писать</div>
            </div>
            <Toggle on={readonly} onChange={()=>setReadonly(v=>!v)}/>
          </div>
          {error&&<div style={{background:'var(--red-dim)',color:'var(--red)',padding:'10px 14px',borderRadius:10,fontSize:13}}>{error}</div>}
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

  useEffect(()=>{
    supabase.from('profiles').select('id,name,initials,color,role,email')
      .then(({data})=>setUsers((data||[]).filter(u=>u.id!==currentUser.id)));
  },[currentUser.id]);

  const filtered = users.filter(u=>(u.name||'').toLowerCase().includes(search.toLowerCase())||(u.email||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={MOD.overlay} onClick={onClose}>
      <div style={MOD.sheet} onClick={e=>e.stopPropagation()}>
        <div style={MOD.handle}/>
        <div style={MOD.header}>
          <span style={MOD.title}>Новое личное сообщение</span>
          <button onClick={onClose} style={MOD.closeBt}>{IC.close}</button>
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
              <div className="avatar avatar-sm" style={{background:u.color||'var(--accent)'}}>{u.initials||'?'}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500,color:'var(--text)'}}>{u.name}</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{ROLE_RU[u.role]||u.role} · {u.email}</div>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div style={{textAlign:'center',color:'var(--text3)',padding:24,fontSize:13}}>Никого не найдено</div>}
        </div>
      </div>
    </div>
  );
}

function MsgBtn({ icon, title, onClick, danger, emoji }) {
  return (
    <button title={title} onClick={onClick}
      style={{width:28,height:28,borderRadius:8,border:'none',cursor:'pointer',background:'transparent',color:danger?'var(--red)':'var(--text2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:emoji?16:12,transition:'background 0.12s'}}
      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      {icon}
    </button>
  );
}

// ── Одно сообщение ──────────────────────────────────────────
function MessageBubble({ msg, allMsgs, onReply, onPin, onEdit, onDelete, onReact, canManage, onOpenProfile }) {
  const { currentUser, getProfile } = useApp();
  const uid    = msg.userId || msg.from_user_id;
  const isMe   = uid === currentUser?.id;
  const sender = isMe ? currentUser : (getProfile(uid)||{name:'Участник',initials:'?',color:'#888',role:'guest'});
  const [showMenu,  setShowMenu]  = useState(false);
  const [showReact, setShowReact] = useState(false);
  const isDeleted = !!msg.deleted_at;
  const text = isDeleted ? 'Сообщение удалено' : (msg.text||'');

  const replyId     = msg.reply_to || msg.replyTo;
  const replyOrigin = replyId ? allMsgs.find(m=>m.id===replyId) : null;
  const replyText   = replyOrigin?.text || null;
  const replyAuthorUid = replyOrigin ? (replyOrigin.userId||replyOrigin.from_user_id) : null;
  const replyAuthor    = replyAuthorUid ? (getProfile(replyAuthorUid)||{name:'Участник'}) : null;

  const reactions    = msg.reactions||{};
  const hasReactions = Object.keys(reactions).some(k=>(reactions[k]||[]).length>0);
  const roleLabel    = ROLE_RU[sender.role] || sender.role;

  return (
    <div style={{display:'flex',gap:8,marginBottom:14,flexDirection:isMe?'row-reverse':'row',position:'relative'}}
      onMouseEnter={()=>setShowMenu(true)}
      onMouseLeave={()=>{setShowMenu(false);setShowReact(false);}}>
      {/* Аватар */}
      <div className="avatar avatar-sm"
        style={{background:sender.color,marginTop:2,flexShrink:0,cursor:!isMe?'pointer':'default'}}
        onClick={()=>!isMe&&onOpenProfile&&onOpenProfile(uid)}>
        {sender.initials||'?'}
      </div>
      <div style={{maxWidth:'72%',minWidth:0}}>
        {!isMe&&!isDeleted&&(
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
            <span
              onClick={()=>onOpenProfile&&onOpenProfile(uid)}
              style={{fontSize:12,fontWeight:600,color:'var(--accent-bright)',cursor:'pointer',transition:'opacity 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.7'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
              {sender.name}
            </span>
            <span className={`badge ${ROLE_BADGE[sender.role]||'badge-guest'}`} style={{fontSize:10}}>{roleLabel}</span>
            <span style={{fontSize:11,color:'var(--text3)'}}>{msg.time}</span>
          </div>
        )}
        {isMe&&!isDeleted&&<div style={{fontSize:11,color:'var(--text3)',textAlign:'right',marginBottom:3}}>{msg.time}</div>}

        {/* Цитата */}
        {replyText&&(
          <div style={{padding:'5px 10px',marginBottom:3,borderRadius:isMe?'10px 10px 0 0':'0 10px 10px 0',borderLeft:isMe?'none':'2px solid var(--accent)',borderRight:isMe?'2px solid var(--accent)':'none',background:'rgba(59,130,246,0.08)',fontSize:12,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {replyAuthor&&<span style={{fontWeight:600,color:'var(--accent-bright)',marginRight:4}}>{replyAuthor.name}</span>}
            {replyText.slice(0,80)}{replyText.length>80?'…':''}
          </div>
        )}

        {/* Текст */}
        <div className={isMe?'bubble-me':'bubble-other'}
          style={isDeleted?{opacity:0.5,fontStyle:'italic'}:{wordBreak:'break-word',overflowWrap:'break-word'}}>
          {text}
          {msg.edited_at&&!isDeleted&&<span style={{fontSize:10,opacity:0.55,marginLeft:6,whiteSpace:'nowrap'}}>изм.</span>}
        </div>

        {/* Реакции */}
        {hasReactions&&(
          <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap',justifyContent:isMe?'flex-end':'flex-start'}}>
            {Object.entries(reactions).filter(([,u])=>(u||[]).length>0).map(([emoji,users])=>(
              <button key={emoji} onClick={()=>onReact&&onReact(msg,emoji)}
                style={{padding:'2px 7px',borderRadius:12,border:'1px solid var(--border)',background:(users||[]).includes(currentUser?.id)?'var(--accent-dim)':'var(--bg-overlay)',cursor:'pointer',fontSize:12,color:'var(--text2)'}}>
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Меню */}
      {showMenu&&!isDeleted&&(
        <div style={{position:'absolute',top:-8,right:isMe?'auto':'-8px',left:isMe?'-8px':'auto',display:'flex',gap:3,background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:10,padding:'3px',boxShadow:'var(--shadow-md)',zIndex:10}}>
          <MsgBtn title="Ответить"  icon={IC.reply} onClick={()=>onReply&&onReply(msg)}/>
          <MsgBtn title="Реакция"   icon="😊" emoji   onClick={()=>setShowReact(v=>!v)}/>
          {canManage&&<MsgBtn title="Закрепить" icon={IC.pin}  onClick={()=>onPin&&onPin(msg)}/>}
          {isMe&&     <MsgBtn title="Изменить"  icon={IC.edit} onClick={()=>onEdit&&onEdit(msg)}/>}
          {(isMe||canManage)&&<MsgBtn title="Удалить" icon={IC.del} onClick={()=>onDelete&&onDelete(msg)} danger/>}
        </div>
      )}
      {/* Быстрые реакции */}
      {showReact&&(
        <div style={{position:'absolute',top:-44,right:isMe?'auto':8,left:isMe?8:'auto',display:'flex',gap:4,background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:20,padding:'6px 10px',boxShadow:'var(--shadow-md)',zIndex:11}}>
          {REACTIONS.map(e=>(
            <button key={e} onClick={()=>{onReact&&onReact(msg,e);setShowReact(false);}}
              style={{fontSize:18,background:'none',border:'none',cursor:'pointer',padding:'2px',borderRadius:6,transition:'transform 0.12s'}}
              onMouseEnter={ev=>ev.currentTarget.style.transform='scale(1.3)'}
              onMouseLeave={ev=>ev.currentTarget.style.transform='scale(1)'}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Список сообщений ────────────────────────────────────────
function MessageList({ channelKey, isDM, dmUserId, onReply, onPin, onEdit, onDelete, onReact, canManage, onOpenProfile }) {
  const { messages, loadMessages, dmMessages, loadDmMessages, markChannelRead } = useApp();
  const [ready,   setReady]   = useState(false);
  const [dmReady, setDmReady] = useState(false);
  const bottomRef = useRef();

  useEffect(()=>{
    if (isDM) return;
    setReady(false);
    loadMessages(channelKey).then(()=>{ setReady(true); markChannelRead?.(channelKey); });
  },[channelKey]); // eslint-disable-line

  useEffect(()=>{
    if (!isDM||!dmUserId) return;
    setDmReady(false);
    loadDmMessages?.(dmUserId).then(()=>setDmReady(true));
  },[isDM,dmUserId]); // eslint-disable-line

  const msgs = isDM ? (dmMessages?.[`dm_${dmUserId}`]||[]) : (messages[channelKey]||[]);
  const isOk = isDM ? dmReady : ready;

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs.length]);

  if (!isOk) return <div className="empty-state" style={{flex:1}}><div style={{fontSize:13,color:'var(--text3)'}}>Загрузка...</div></div>;
  if (msgs.length===0) return <div className="empty-state" style={{flex:1}}><div className="icon">💬</div><p>Нет сообщений.<br/>Напишите первым!</p></div>;

  return (
    <div style={{flex:1,overflowY:'auto',padding:'16px 16px 8px'}}>
      {msgs.map(msg=>(
        <MessageBubble key={msg.id} msg={msg} allMsgs={msgs}
          onReply={onReply} onPin={onPin} onEdit={onEdit}
          onDelete={onDelete} onReact={onReact} canManage={canManage}
          onOpenProfile={onOpenProfile}/>
      ))}
      <div ref={bottomRef}/>
    </div>
  );
}

