import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]     = useState(null);
  const [profiles, setProfiles]           = useState({});   // id -> profile
  const [messages, setMessages]           = useState({});   // channelKey -> []
  const [activeView, setActiveView]       = useState('chat');
  const [activeChannel, setActiveChannel] = useState(null);
  const [notification, setNotification]   = useState(null);
  const [loading, setLoading]             = useState(true);

  // ── Загрузить профиль по userId ──────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfiles(prev => ({ ...prev, [data.id]: data }));
    }
    return data;
  }, []);

  // ── Восстановить сессию при загрузке страницы ────────────
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) setCurrentUser(profile);
      }
      setLoading(false);
    };
    restoreSession();

    // Слушаем изменения авторизации (вход / выход)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) setCurrentUser(profile);
        }
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setMessages({});
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Real-time: новые сообщения ───────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel('realtime:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const msg = payload.new;
        // Подгрузить профиль отправителя если ещё нет
        if (!profiles[msg.user_id]) {
          await fetchProfile(msg.user_id);
        }
        const formatted = {
          id:     msg.id,
          userId: msg.user_id,
          text:   msg.text,
          time:   new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
          date:   msg.created_at.slice(0, 10),
        };
        setMessages(prev => ({
          ...prev,
          [msg.channel_key]: [...(prev[msg.channel_key] || []), formatted],
        }));
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [currentUser, profiles, fetchProfile]);

  // ── ВХОД ────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: 'Неверный email или пароль' };

    let profile = await fetchProfile(data.user.id);

    // Создать профиль автоматически если его нет
    if (!profile) {
      const meta = data.user.user_metadata || {};
      const name = meta.name || email.split('@')[0];
      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const colors = ['#C9922A', '#3B82F6', '#8B5CF6', '#22C55E', '#EF4444', '#F97316'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, name, initials, role: 'guest', color, email: data.user.email })
        .select()
        .single();

      profile = created;
      if (profile) setProfiles(prev => ({ ...prev, [profile.id]: profile }));
    }

    if (profile) {
      setCurrentUser(profile);
      return { success: true, user: profile };
    }
    return { success: false, error: 'Ошибка загрузки профиля' };
  }, [fetchProfile]);

  // ── ВЫХОД ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMessages({});
    setActiveView('chat');
    setActiveChannel(null);
  }, []);

  // ── Загрузить сообщения канала ───────────────────────────
  const loadMessages = useCallback(async (channelKey) => {
    // Если уже загружены — не грузим снова
    if (messages[channelKey]) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_key', channelKey)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      // Подгрузить профили всех отправителей
      const uniqueIds = [...new Set(data.map(m => m.user_id))];
      await Promise.all(uniqueIds.map(id => profiles[id] ? null : fetchProfile(id)));

      const formatted = data.map(m => ({
        id:     m.id,
        userId: m.user_id,
        text:   m.text,
        time:   new Date(m.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
        date:   m.created_at.slice(0, 10),
      }));

      setMessages(prev => ({ ...prev, [channelKey]: formatted }));
    }
  }, [messages, profiles, fetchProfile]);

  // ── Отправить сообщение ──────────────────────────────────
  const sendMessage = useCallback(async (channelKey, text) => {
    if (!text.trim() || !currentUser) return;
    const { error } = await supabase
      .from('messages')
      .insert({ channel_key: channelKey, user_id: currentUser.id, text: text.trim() });
    if (error) console.error('Ошибка отправки:', error.message);
  }, [currentUser]);

  // ── Получить профиль из кэша ─────────────────────────────
  const getProfile = useCallback((userId) => {
    return profiles[userId] || null;
  }, [profiles]);

  // ── Уведомление ─────────────────────────────────────────
  const showNotification = useCallback((msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, loading,
      login, logout,
      messages, sendMessage, loadMessages,
      profiles, getProfile, fetchProfile,
      activeView, setActiveView,
      activeChannel, setActiveChannel,
      notification, showNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
