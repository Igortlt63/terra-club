import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import AppShell from './pages/AppShell';
import './index.css';

// ── Экран загрузки с анимацией затмения ─────────────────────
function LoadingScreen() {
  return (
    <div style={{
      height:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'#000008',
      backgroundImage:'radial-gradient(ellipse at 50% 50%, #0a0a1a 0%, #000000 70%)',
      overflow:'hidden', position:'relative',
    }}>

      {/* Звёздный фон */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        {Array.from({length:80}).map((_,i)=>(
          <div key={i} style={{
            position:'absolute',
            width: i%5===0 ? 2 : 1,
            height: i%5===0 ? 2 : 1,
            background:'#fff',
            borderRadius:'50%',
            left:`${(i*137.5)%100}%`,
            top:`${(i*97.3)%100}%`,
            opacity: 0.2 + (i%5)*0.12,
            animation:`twinkle ${2+(i%3)}s ease-in-out ${(i%7)*0.3}s infinite alternate`,
          }}/>
        ))}
      </div>

      <style>{`
        @keyframes twinkle {
          from { opacity: 0.15; }
          to   { opacity: 0.8; }
        }

        /* Корона солнечного затмения */
        @keyframes coronaPulse {
          0%   { opacity:0.6; transform:scale(1); }
          50%  { opacity:1;   transform:scale(1.05); }
          100% { opacity:0.6; transform:scale(1); }
        }

        /* Планета Земля выходит из тени */
        @keyframes earthReveal {
          0%   { clip-path: inset(0 100% 0 0); opacity:0; }
          20%  { clip-path: inset(0 80% 0 0);  opacity:0.3; }
          60%  { clip-path: inset(0 20% 0 0);  opacity:0.8; }
          100% { clip-path: inset(0 0% 0 0);   opacity:1; }
        }

        /* Кольцо планеты появляется */
        @keyframes ringDraw {
          0%   { stroke-dashoffset: 400; opacity:0; }
          30%  { opacity: 0.5; }
          100% { stroke-dashoffset: 0;   opacity:1; }
        }

        /* Текст TERRA появляется */
        @keyframes textReveal {
          0%   { opacity:0; letter-spacing:12px; }
          100% { opacity:1; letter-spacing:4px; }
        }

        /* Луна (тень затмения) уходит */
        @keyframes moonExit {
          0%   { transform:translateX(0); }
          100% { transform:translateX(140px); }
        }

        /* Свечение появляется */
        @keyframes glowIn {
          0%   { opacity:0; r:40; }
          100% { opacity:0.15; r:80; }
        }

        /* Лучи короны */
        @keyframes rayPulse {
          0%,100% { opacity:0.3; transform:scaleY(1); }
          50%     { opacity:0.7; transform:scaleY(1.3); }
        }

        .moon-shadow { animation: moonExit 2.2s cubic-bezier(0.4,0,0.2,1) 0.5s both; }
        .ring-path   { animation: ringDraw 1.8s cubic-bezier(0.4,0,0.2,1) 0.8s both; }
        .terra-text  { animation: textReveal 1s ease-out 2.2s both; }
        .corona      { animation: coronaPulse 2.5s ease-in-out 0.5s infinite; }
        .glow-circle { animation: glowIn 2s ease-out 1.5s both; }
      `}</style>

      {/* SVG анимация */}
      <svg width="260" height="200" viewBox="0 0 260 200" style={{ position:'relative', zIndex:2 }}>
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#40D9F0"/>
            <stop offset="50%"  stopColor="#1AABCC"/>
            <stop offset="100%" stopColor="#0B7BAA"/>
          </linearGradient>
          <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFF8E0" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#FFD060" stopOpacity="0.2"/>
          </linearGradient>
          <radialGradient id="coronaGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFE066" stopOpacity="0.6"/>
            <stop offset="60%"  stopColor="#FF9900" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#FF6600" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1AABCC" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#1AABCC" stopOpacity="0"/>
          </radialGradient>
          <clipPath id="scene">
            <rect x="0" y="0" width="260" height="170"/>
          </clipPath>
        </defs>

        {/* Фоновое свечение вокруг планеты */}
        <circle className="glow-circle" cx="130" cy="82" r="80"
          fill="url(#glowGrad)" opacity="0"/>

        {/* Корона солнечного затмения (уходит вместе с луной) */}
        <g className="moon-shadow" clipPath="url(#scene)">
          {/* Лучи короны */}
          {Array.from({length:16}).map((_,i)=>{
            const angle = (i/16)*Math.PI*2;
            const r1 = 48, r2 = 48 + 12 + (i%3)*8;
            const x1 = 130 + r1*Math.cos(angle);
            const y1 = 82  + r1*Math.sin(angle);
            const x2 = 130 + r2*Math.cos(angle);
            const y2 = 82  + r2*Math.sin(angle);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#FFE066" strokeWidth={i%2===0 ? 1.5 : 0.8} opacity="0.4"
                style={{ animation:`rayPulse ${1.5+(i%4)*0.3}s ease-in-out ${i*0.1}s infinite` }}
              />
            );
          })}
          {/* Корона */}
          <circle cx="130" cy="82" r="44"
            fill="url(#coronaGrad)" className="corona"/>
          {/* Луна (чёрный диск) */}
          <circle cx="130" cy="82" r="38" fill="#000008"/>
          {/* Бликовая дуга края луны */}
          <path d="M 92 82 A 38 38 0 0 1 168 82" fill="none"
            stroke="#FFE066" strokeWidth="1.5" opacity="0.6"/>
        </g>

        {/* Кольцо планеты Земля */}
        <ellipse cx="130" cy="82" rx="42" ry="46"
          fill="none"
          stroke="url(#lg1)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="400"
          className="ring-path"
          filter="url(#gf)"
        />

        {/* Свечение кольца */}
        <ellipse cx="130" cy="82" rx="42" ry="46"
          fill="none"
          stroke="#40D9F0"
          strokeWidth="8"
          opacity="0.12"
          strokeDasharray="400"
          className="ring-path"
        />

        <defs>
          <filter id="gf">
            <feGaussianBlur stdDeviation="1.2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Текст TERRA */}
        <text x="130" y="158"
          fontFamily="-apple-system, 'Inter', sans-serif"
          fontSize="16" fontWeight="700"
          textAnchor="middle" fill="white" opacity="1"
          className="terra-text"
        >TERRA</text>

        {/* Подзаголовок */}
        <text x="130" y="176"
          fontFamily="-apple-system, 'Inter', sans-serif"
          fontSize="9.5" fontWeight="400"
          letterSpacing="2"
          textAnchor="middle" fill="rgba(255,255,255,0.4)"
          className="terra-text"
        >БИЗНЕС КЛУБ</text>
      </svg>

      {/* Индикатор загрузки */}
      <div style={{
        position:'relative', zIndex:2,
        marginTop:32,
        display:'flex', gap:6, alignItems:'center',
      }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:5, height:5, borderRadius:'50%',
            background:'rgba(64,217,240,0.6)',
            animation:`twinkle 1s ease-in-out ${i*0.2}s infinite alternate`,
          }}/>
        ))}
      </div>
    </div>
  );
}

function AppRouter() {
  const { currentUser, loading } = useApp();
  if (loading) return <LoadingScreen />;
  return currentUser ? <AppShell /> : <LoginPage />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
