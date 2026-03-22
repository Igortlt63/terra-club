import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { SCHOOLS, CITIES } from '../data/db';

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
        {value === null ? '...' : value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedCity, setSelectedCity] = useState('all');
  const [stats,        setStats]        = useState({ total: null, students: null, mentors: null, teachers: null, guests: null });
  const [byCity,       setByCity]       = useState([]);
  const [bySchool,     setBySchool]     = useState([]);
  const [recentUsers,  setRecentUsers]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  const loadStats = async () => {
    setLoading(true);

    // Общее количество участников
    const { count: total }    = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: mentors }  = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor');
    const { count: teachers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
    const { count: guests }   = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guest');

    setStats({ total, students, mentors, teachers, guests });

    // По городам
    const { data: profiles } = await supabase.from('profiles').select('city_id');
    if (profiles) {
      const cityCount = {};
      profiles.forEach(p => {
        if (p.city_id) cityCount[p.city_id] = (cityCount[p.city_id] || 0) + 1;
      });
      const sorted = Object.entries(cityCount)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count);
      setByCity(sorted);
    }

    // По школам
    const { data: schoolProfiles } = await supabase.from('profiles').select('school_id').eq('role', 'student');
    if (schoolProfiles) {
      const schoolCount = {};
      schoolProfiles.forEach(p => {
        if (p.school_id) schoolCount[p.school_id] = (schoolCount[p.school_id] || 0) + 1;
      });
      const sorted = Object.entries(schoolCount)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count);
      setBySchool(sorted);
    }

    // Последние зарегистрированные
    const { data: recent } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentUsers(recent || []);

    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  // Фильтрация по городу
  const filteredBySchool = selectedCity === 'all'
    ? bySchool
    : bySchool; // TODO: фильтр по городу когда появятся данные

  const maxCityCount = byCity[0]?.count || 1;
  const maxSchoolCount = bySchool[0]?.count || 1;

  const ROLE_LABELS = {
    admin: 'Руководство', teacher: 'Преподаватель', student: 'Ученик',
    mentor: 'Наставник',  mentee: 'Наставляемый',   guest: 'Гость', member: 'Участник',
  };
  const ROLE_BADGE = {
    admin: 'badge-admin', teacher: 'badge-teacher', student: 'badge-student',
    mentor: 'badge-mentor', mentee: 'badge-mentee', guest: 'badge-guest', member: 'badge-member',
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>

      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Панель управления</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>Бизнес Клуб Терра · реальные данные</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            style={{ padding: '7px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, background: '#fff' }}
            value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
          >
            <option value="all">🌍 Все города</option>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
          <button
            onClick={loadStats}
            style={{ padding: '7px 14px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, background: '#fff', cursor: 'pointer' }}
          >🔄 Обновить</button>
        </div>
      </div>

      {/* Статистика по ролям */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="👥" label="Всего участников"  value={stats.total}    sub={loading ? 'Загрузка...' : null} />
        <StatCard icon="🎓" label="Учеников"          value={stats.students} />
        <StatCard icon="🌱" label="Наставников"       value={stats.mentors}  />
        <StatCard icon="👨‍🏫" label="Гостей (без роли)" value={stats.guests}   />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* По школам */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Ученики по школам</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{stats.students} учеников</span>
          </div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            {loading && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>Загрузка...</div>}
            {!loading && bySchool.length === 0 && (
              <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>Учеников пока нет</div>
            )}
            {bySchool.slice(0, 8).map((item, i) => {
              const school = SCHOOLS.find(s => s.id === item.id);
              if (!school) return null;
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < bySchool.slice(0,8).length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 14, width: 20, flexShrink: 0 }}>{school.icon}</span>
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school.name}</span>
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.round((item.count / maxSchoolCount) * 100)}%`, background: school.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', width: 28, textAlign: 'right', flexShrink: 0 }}>{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* По городам */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🌍 Участники по городам</span>
          </div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            {loading && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>Загрузка...</div>}
            {!loading && byCity.length === 0 && (
              <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>Нет данных по городам</div>
            )}
            {byCity.map((item, i) => {
              const city = CITIES.find(c => c.id === item.id);
              const label = city ? `${city.flag} ${city.name}` : item.id;
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < byCity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.round((item.count / maxCityCount) * 100)}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', width: 28, textAlign: 'right', flexShrink: 0 }}>{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Последние зарегистрированные */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🆕 Последние участники</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Последние 5</span>
        </div>
        <div className="card-body" style={{ padding: '8px 16px' }}>
          {loading && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>Загрузка...</div>}
          {recentUsers.map((u, i) => (
            <div key={u.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < recentUsers.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
              <div className="avatar avatar-sm" style={{ background: u.color || '#888', flexShrink: 0 }}>{u.initials || '?'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
              </div>
              <span className={`badge ${ROLE_BADGE[u.role] || 'badge-guest'}`}>
                {ROLE_LABELS[u.role] || 'Гость'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                {new Date(u.created_at).toLocaleDateString('ru')}
              </span>
            </div>
          ))}
          {!loading && recentUsers.length === 0 && (
            <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>Нет участников</div>
          )}
        </div>
      </div>
    </div>
  );
}
