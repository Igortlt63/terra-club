import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser,    setCurrentUser]    = useState(null);
  const [profiles,       setProfiles]       = useState({});
  const [messages,       setMessages]       = useState({});
  const [dmMessages,     setDmMessages]     = useState({});
  const [unreadChannels, setUnreadChannels] = useState({});
  const [unreadDm,       setUnreadDm]       = useState({});
  const [activeView,     setActiveView]     = useState('chat');
  const [activeChannel,  setActiveChannel]  = useState(null);
  const [notification,   setNotification]   = useState(null);
  const [loading,        setLoading]        = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setProfiles(prev => ({ ...prev, [data.id]: data }));
      return data || null;
    } catch { return null; }
  }, []);

  const getProfile = useCallback((userId) => profiles[userId] || null, [profiles]);

  const fmtMsg = useCallback((m) => ({
    id:          m.id,
    userId:      m.user_id || m.from_user_id,
    from_user_id:m.from_user_id,
    text:        m.text,
    reply_to:    m.reply_to   || null,
    replyTo:     m.reply_to   || null,
    is_pinned:   m.is_pinned  || false,
    edited_at:   m.edited_at  || null,
    deleted_at:  m.deleted_at || null,
    reactions:   m.reactions  || {},
    time:        new Date(m.created_at).toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }),
    date:        m.created_at?.slice(0, 10),
  }), []);

  // Восстановить сессию
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const timeout        = new Promise(resolve => setTimeout(() => resolve(null), 8000));
        const sessionRequest = supabase.auth.getSession();
        const result         = await Promise.race([sessionRequest, timeout]);
        if (cancelled) return;
        const session = result?.data?.session;
        if (session?.user) {
          const { data: fp } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (!cancelled && fp) { setProfiles(prev => ({ ...prev, [fp.id]: fp })); setCurrentUser(fp); }
        }
      } catch (err) { console.error('Session restore error:', err); }
      finally { if (!cancelled) setLoading(false); }
    };
    restoreSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT' && !cancelled) {
        setCurrentUser(null); setMessages({}); setDmMessages({});
        setProfiles({}); setUnreadChannels({}); setUnreadDm({});
      }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // Real-time: сообщения каналов
  useEffect(() => {
    if (!currentUser) return;
    const sub = supabase.channel('rt:messages')
      .on('postgres_changes', { event:'*', schema:'public', table:'messages' }, async (payload) => {
        const msg = payload.new || payload.old;
        if (!msg) return;
        if (msg.user_id && !profiles[msg.user_id]) await fetchProfile(msg.user_id);
        if (payload.eventType === 'INSERT') {
          const formatted = fmtMsg(msg);
          setMessages(prev => ({ ...prev, [msg.channel_key]: [...(prev[msg.channel_key] || []), formatted] }));
          if (msg.user_id !== currentUser.id) {
            setUnreadChannels(prev => ({ ...prev, [msg.channel_key]: (prev[msg.channel_key] || 0) + 1 }));
          }
        }
        if (payload.eventType === 'UPDATE') {
          setMessages(prev => {
            const msgs = prev[msg.channel_key] || [];
            return { ...prev, [msg.channel_key]: msgs.map(m => m.id === msg.id ? { ...m, ...fmtMsg(msg) } : m) };
          });
        }
      }).subscribe();
    return () => sub.unsubscribe();
  }, [currentUser, profiles, fetchProfile, fmtMsg]);

  // Real-time: входящие DM
  useEffect(() => {
    if (!currentUser) return;
    const sub = supabase.channel(`rt:dm:in:${currentUser.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'direct_messages',
        filter: `to_user_id=eq.${currentUser.id}`,
      }, async (payload) => {
        const msg = payload.new || payload.old;
        if (!msg) return;
        if (!profiles[msg.from_user_id]) await fetchProfile(msg.from_user_id);
        const dmKey = `dm_${msg.from_user_id}`;
        if (payload.eventType === 'INSERT') {
          const fmt = fmtMsg({ ...msg, user_id: msg.from_user_id });
          setDmMessages(prev => ({ ...prev, [dmKey]: [...(prev[dmKey] || []), fmt] }));
          setUnreadDm(prev => ({ ...prev, [msg.from_user_id]: (prev[msg.from_user_id] || 0) + 1 }));
        }
        if (payload.eventType === 'UPDATE') {
          setDmMessages(prev => ({
            ...prev,
            [dmKey]: (prev[dmKey]||[]).map(m => m.id===msg.id ? { ...m, ...fmtMsg({ ...msg, user_id: msg.from_user_id }) } : m),
          }));
        }
      }).subscribe();
    return () => sub.unsubscribe();
  }, [currentUser, profiles, fetchProfile, fmtMsg]);

  // Real-time: свои отправленные DM
  useEffect(() => {
    if (!currentUser) return;
    const sub = supabase.channel(`rt:dm:out:${currentUser.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'direct_messages',
        filter: `from_user_id=eq.${currentUser.id}`,
      }, async (payload) => {
        const msg = payload.new || payload.old;
        if (!msg) return;
        const dmKey = `dm_${msg.to_user_id}`;
        if (payload.eventType === 'INSERT') {
          const fmt = fmtMsg({ ...msg, user_id: msg.from_user_id });
          setDmMessages(prev => ({ ...prev, [dmKey]: [...(prev[dmKey] || []), fmt] }));
        }
        if (payload.eventType === 'UPDATE') {
          setDmMessages(prev => ({
            ...prev,
            [dmKey]: (prev[dmKey]||[]).map(m => m.id===msg.id ? { ...m, ...fmtMsg({ ...msg, user_id: msg.from_user_id }) } : m),
          }));
        }
      }).subscribe();
    return () => sub.unsubscribe();
  }, [currentUser, fmtMsg]);

  // Вход
  const login = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: 'Неверный email или пароль' };
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profile) {
        setProfiles(prev => ({ ...prev, [profile.id]: profile }));
        setCurrentUser(profile);
        return { success: true, user: profile };
      }
      const meta     = data.user.user_metadata || {};
      const name     = meta.name || email.split('@')[0];
      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const colors   = ['#3B82F6','#60A5FA','#34D399','#FBBF24','#A78BFA','#F87171'];
      const color    = colors[Math.floor(Math.random() * colors.length)];
      const { data: created } = await supabase.from('profiles')
        .insert({ id: data.user.id, name, initials, role: 'guest', color, email: data.user.email })
        .select().single();
      if (created) {
        setProfiles(prev => ({ ...prev, [created.id]: created }));
        setCurrentUser(created);
        return { success: true, user: created };
      }
      return { success: false, error: 'Не удалось создать профиль' };
    } catch { return { success: false, error: 'Ошибка соединения. Попробуйте ещё раз.' }; }
  }, []);

  // Выход
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null); setMessages({}); setDmMessages({});
    setProfiles({}); setUnreadChannels({}); setUnreadDm({});
    setActiveView('chat'); setActiveChannel(null);
  }, []);

  // Загрузить сообщения канала
  const loadMessages = useCallback(async (channelKey) => {
    try {
      const { data } = await supabase.from('messages').select('*')
        .eq('channel_key', channelKey)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }).limit(150);
      if (data && data.length > 0) {
        const ids = [...new Set(data.map(m => m.user_id))];
        await Promise.all(ids.filter(id => !profiles[id]).map(id => fetchProfile(id)));
        setMessages(prev => ({ ...prev, [channelKey]: data.map(fmtMsg) }));
      } else {
        setMessages(prev => ({ ...prev, [channelKey]: [] }));
      }
    } catch (err) {
      console.error('loadMessages error:', err);
      setMessages(prev => ({ ...prev, [channelKey]: [] }));
    }
  }, [profiles, fetchProfile, fmtMsg]);

  // Загрузить DM
  const loadDmMessages = useCallback(async (otherUserId) => {
    if (!currentUser) return;
    const dmKey = `dm_${otherUserId}`;
    try {
      const { data } = await supabase.from('direct_messages').select('*')
        .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${currentUser.id})`)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }).limit(150);
      const ids = [...new Set((data||[]).map(m => m.from_user_id))];
      await Promise.all(ids.filter(id => !profiles[id]).map(id => fetchProfile(id)));
      setDmMessages(prev => ({ ...prev, [dmKey]: (data||[]).map(m => fmtMsg({ ...m, user_id: m.from_user_id })) }));
      // Пометить прочитанными
      await supabase.from('direct_messages').update({ is_read: true })
        .eq('to_user_id', currentUser.id).eq('from_user_id', otherUserId).eq('is_read', false);
      setUnreadDm(prev => ({ ...prev, [otherUserId]: 0 }));
    } catch (err) { console.error('loadDmMessages error:', err); }
  }, [currentUser, profiles, fetchProfile, fmtMsg]);

  // Отправить сообщение
  const sendMessage = useCallback(async (channelKey, text, replyToId = null) => {
    if (!text.trim() || !currentUser) return;
    const { error } = await supabase.from('messages').insert({
      channel_key: channelKey, user_id: currentUser.id,
      text: text.trim(), reply_to: replyToId || null,
    });
    if (error) console.error('sendMessage error:', error.message);
  }, [currentUser]);

  // Пометить канал прочитанным
  const markChannelRead = useCallback((channelKey) => {
    setUnreadChannels(prev => ({ ...prev, [channelKey]: 0 }));
  }, []);

  // Уведомление
  const showNotification = useCallback((msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, loading,
      login, logout,
      profiles, getProfile, fetchProfile,
      messages,   sendMessage,  loadMessages,
      dmMessages, loadDmMessages, updateLocalMessage, updateLocalDmMessage,
      unreadChannels, unreadDm, markChannelRead, setUnreadDm,
      activeView, setActiveView,
      activeChannel, setActiveChannel,
      notification, showNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
