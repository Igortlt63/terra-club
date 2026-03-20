import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DEMO_USERS, MESSAGES } from '../data/db';
import { supabase } from '../supabase'

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState(MESSAGES);
  const [activeView, setActiveView] = useState('chat');
  const [activeChannel, setActiveChannel] = useState(null);
  const [notification, setNotification] = useState(null);


const login = useCallback(async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })
  if (error) {
    return { success: false, error: 'Неверный email или пароль' }
  }
  // Загружаем профиль пользователя из таблицы profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()
  if (profile) {
    setCurrentUser(profile)
    return { success: true, user: profile }
  }
  return { success: false, error: 'Профиль не найден' }
}, [])


const logout = useCallback(async () => {
  await supabase.auth.signOut()
  setCurrentUser(null)
  setActiveView('chat')
}, [])


const sendMessage = useCallback(async (channelKey, text) => {
  if (!text.trim() || !currentUser) return
  const { error } = await supabase
    .from('messages')
    .insert({
      channel_key: channelKey,
      user_id: currentUser.id,
      text: text.trim()
    })
  if (error) {
    console.error('Ошибка отправки:', error.message)
  }
}, [currentUser])


// Подписка на новые сообщения (real-time)
useEffect(() => {
  const subscription = supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages'
    }, (payload) => {
      const msg = payload.new
      setMessages(prev => ({
        ...prev,
        [msg.channel_key]: [...(prev[msg.channel_key] || []), msg]
      }))
    })
    .subscribe()
  return () => subscription.unsubscribe()
}, [])


  const showNotification = useCallback((msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);
// Подписка на новые сообщения в реальном времени
useEffect(() => {
  const subscription = supabase
    .channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const newMsg = payload.new
        setMessages(prev => ({
          ...prev,
          [newMsg.channel_key]: [
            ...(prev[newMsg.channel_key] || []),
            {
              id: newMsg.id,
              userId: newMsg.user_id,
              text: newMsg.text,
              time: new Date(newMsg.created_at).toLocaleTimeString('ru', {
                hour: '2-digit', minute: '2-digit'
              }),
              date: newMsg.created_at.slice(0,10)
            }
          ]
        }))
      }
    )
    .subscribe()
  // Отписываемся когда компонент удаляется
  return () => subscription.unsubscribe()
}, [])

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      messages, sendMessage,
      activeView, setActiveView,
      activeChannel, setActiveChannel,
      notification, showNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
