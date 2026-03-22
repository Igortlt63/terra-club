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
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: '#0F1117',
      }}>
        <div style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #C9922A, #E8A83E)',
          borderRadius: 14, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff',
        }}>T</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Загрузка...</div>
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
