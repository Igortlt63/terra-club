import React, { useState } from 'react';
import { SCHOOLS, CITIES } from '../data/db';

function StatCard({ icon, label, value, change, changeDir }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      {change && <div style={{ fontSize: 12, color: changeDir === 'up' ? '#16A34A' : '#DC2626', marginTop: 4 }}>{changeDir === 'up' ? '↑' : '↓'} {change}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedCity, setSelectedCity] = useState('all');

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Панель управления</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>Бизнес Клуб Терра · 22 города · 6 стран</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select style={{ width: 180 }} value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
            <option value="all">🌍 Все города</option>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
          <button className="btn-primary">📥 Отчёт</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="👥" label="Всего участников" value="2 847" change="+143 этот поток" changeDir="up" />
        <StatCard icon="🎓" label="Активных школ" value="18" change="+2 новых" changeDir="up" />
        <StatCard icon="🌱" label="Пар наставничества" value="184" change="Поток 12" changeDir="up" />
        <StatCard icon="🏙️" label="Городов" value="22" change="6 стран" />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Top schools */}
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Топ школ по участникам</span><span style={{ fontSize: 12, color: 'var(--text3)' }}>Поток 12</span></div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            {SCHOOLS.slice(0, 6).map((s, i) => {
              const count = [284, 241, 198, 177, 164, 142][i];
              const pct = Math.round((count / 284) * 100);
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 14, width: 20 }}>{s.icon}</span>
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <div style={{ width: 80 }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: s.color }} /></div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', width: 36, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cities */}
        <div className="card">
          <div className="card-header"><span className="card-title">🌍 Участники по городам</span></div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            {CITIES.map((c, i) => {
              const count = [620, 480, 350, 310, 280, 240][i] || 100;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 16 }}>{c.flag}</span>
                  <span style={{ fontSize: 13, flex: 1 }}>{c.name}</span>
                  <div style={{ width: 80 }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round((count / 620) * 100)}%` }} /></div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', width: 36, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="card">
        <div className="card-header"><span className="card-title">🔔 Последняя активность</span><button className="btn-ghost" style={{ fontSize: 12 }}>Все события</button></div>
        <div className="card-body" style={{ padding: '8px 16px' }}>
          {[
            { icon: '✅', text: 'Мария Карпова завершила модуль 3 · Школа переговоров · Москва', time: '10 мин назад', color: '#16A34A' },
            { icon: '🌱', text: 'Дмитрий Панков добавил новое задание группе наставляемых · Алматы', time: '25 мин назад', color: '#22C55E' },
            { icon: '📢', text: 'Открыт новый поток 13 в 5 городах', time: '1 час назад', color: '#C9922A' },
            { icon: '🎓', text: 'Школа ИИ завершила набор — 241 ученик · 12 городов', time: '2 часа назад', color: '#6366F1' },
            { icon: '👤', text: 'Зарегистрировано 12 новых участников · Ташкент, Баку', time: '3 часа назад', color: '#3B82F6' },
          ].map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ev.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{ev.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{ev.text}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
