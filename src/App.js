import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import AppShell from './pages/AppShell';
import './index.css';

function AppRouter() {
  const { currentUser } = useApp();
  return currentUser ? <AppShell /> : <LoginPage />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
