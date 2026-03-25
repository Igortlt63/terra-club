import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import AppShell from './pages/AppShell';
import './index.css';

function AppRouter() {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div style={{
        height:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:20,
        background:'var(--bg-base)',
        backgroundImage:'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.10) 0%, transparent 60%)',
      }}>
        <div style={{
          width:64, height:64,
          background:'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:28, fontWeight:900, color:'#fff',
          boxShadow:'0 0 32px rgba(59,130,246,0.4)',
          animation:'pulse 2s ease-in-out infinite',
        }}>T</div>
        <div style={{ color:'var(--text4)', fontSize:14, letterSpacing:0.5 }}>Загрузка...</div>
        <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 32px rgba(59,130,246,0.4)} 50%{box-shadow:0 0 48px rgba(59,130,246,0.7)} }`}</style>
      </div>
    );
  }

  return currentUser ? <AppShell /> : <LoginPage />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
