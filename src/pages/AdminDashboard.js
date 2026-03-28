import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { SCHOOLS, CITIES } from '../data/db';

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'16px 18px' }}>
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>{value===null?'…':value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedCity, setSelectedCity] = useState('all');
  const [stats,        setStats]        = useState({ total:null, students:null, mentors:null, guests:null });
  const [byCity,       setByCity]       = useState([]);
  const [bySchool,     setBySchool]     = useState([]);
  const [cityDetail,   setCityDetail]   = useState(null); // данные выбранного города
  const [recentUsers,  setRecentUsers]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  const ROLE_LABELS = { admin:'Руководство', teacher:'Преподаватель', student:'Ученик', mentor:'Наставник', mentee:'Наставляемый', guest:'Гость', member:'Участник' };
  const ROLE_BADGE  = { admin:'badge-admin', teacher:'badge-teacher', student:'badge-student', mentor:'badge-mentor', mentee:'badge-mentee', guest:'badge-guest', member:'badge-member' };

  const loadStats = useCallback(async (cityFilter='all') => {
    setLoading(true);

    // Базовые запросы — с учётом фильтра города
    const withCity = q => cityFilter!=='all' ? q.eq('city_id', cityFilter) : q;

    const [
      { count: total },
      { count: students },
      { count: mentors },
      { count: guests },
    ] = await Promise.all([
      withCity(supabase.from('profiles').select('*',{count:'exact',head:true})),
      withCity(supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','student')),
      withCity(supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','mentor')),
      withCity(supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','guest')),
    ]);
    setStats({ total, students, mentors, guests });

    // По школам
    const { data: schoolProfiles } = await withCity(
      supabase.from('profiles').select('school_id').eq('role','student')
    );
    if (schoolProfiles) {
      const cnt = {};
      schoolProfiles.forEach(p => { if(p.school_id) cnt[p.school_id]=(cnt[p.school_id]||0)+1; });
      setBySchool(Object.entries(cnt).map(([id,count])=>({id,count})).sort((a,b)=>b.count-a.count));
    }

    // По городам (только если фильтр = все)
    if (cityFilter==='all') {
      const { data: allP } = await supabase.from('profiles').select('city_id');
      if (allP) {
        const cnt = {};
        allP.forEach(p=>{ if(p.city_id) cnt[p.city_id]=(cnt[p.city_id]||0)+1; });
        setByCity(Object.entries(cnt).map(([id,count])=>({id,count})).sort((a,b)=>b.count-a.count));
      }
      setCityDetail(null);
    } else {
      // Детали выбранного города
      const { data: cityProfiles } = await supabase.from('profiles')
        .select('role').eq('city_id', cityFilter);
      if (cityProfiles) {
        const roleCnt = {};
        cityProfiles.forEach(p=>{ roleCnt[p.role]=(roleCnt[p.role]||0)+1; });
        setCityDetail(roleCnt);
      }
    }

    // Последние участники
    const { data: recent } = await withCity(
      supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(5)
    );
    setRecentUsers(recent||[]);

    setLoading(false);
  }, []);

  useEffect(() => { loadStats('all'); }, [loadStats]);

  const handleCityChange = (cityId) => {
    setSelectedCity(cityId);
    loadStats(cityId);
  };

  const selectedCityData = CITIES.find(c=>c.id===selectedCity);
  const maxSchoolCount = bySchool[0]?.count || 1;
  const maxCityCount   = byCity[0]?.count   || 1;

  return (
    <div style={{ padding:24, overflowY:'auto', height:'100%', background:'var(--bg-surface)' }}>

      {/* Заголовок */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>Дашборд</h2>
          <p style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            {selectedCity==='all' ? 'Все города' : selectedCityData ? `${selectedCityData.flag} ${selectedCityData.name}` : selectedCity}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select
            value={selectedCity}
            onChange={e=>handleCityChange(e.target.value)}
            style={{ padding:'9px 14px', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', fontSize:14, background:'var(--bg-raised)', color:'var(--text)', minWidth:160 }}
          >
            <option value="all">🌍 Все города</option>
            {CITIES.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
          <button
            onClick={()=>loadStats(selectedCity)}
            className="btn-secondary"
            style={{ whiteSpace:'nowrap', padding:'9px 16px' }}
          >
            {loading ? '...' : '↺ Обновить'}
          </button>
        </div>
      </div>

      {/* Цифры */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
        <StatCard icon="👥" label="Участников" value={stats.total}    sub={loading?'Загрузка…':null} />
        <StatCard icon="🎓" label="Учеников"   value={stats.students} />
        <StatCard icon="🌱" label="Наставников" value={stats.mentors} />
        <StatCard icon="👤" label="Гостей"      value={stats.guests}  />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* По школам */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">По школам</span>
            <span style={{ fontSize:12, color:'var(--text3)' }}>{stats.students||0} учеников</span>
          </div>
          <div className="card-body" style={{ padding:'8px 18px' }}>
            {loading && <p style={{ color:'var(--text3)', fontSize:13, padding:'12px 0' }}>Загрузка...</p>}
            {!loading && bySchool.length===0 && <p style={{ color:'var(--text3)', fontSize:13, padding:'12px 0' }}>Нет данных</p>}
            {bySchool.slice(0,8).map((item,i)=>{
              const school = SCHOOLS.find(s=>s.id===item.id);
              if (!school) return null;
              return (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i<bySchool.slice(0,8).length-1?'1px solid var(--border)':'none' }}>
                  <span style={{ fontSize:14, width:20, flexShrink:0 }}>{school.icon}</span>
                  <span style={{ fontSize:13, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{school.name}</span>
                  <div style={{ width:60, flexShrink:0 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${Math.round((item.count/maxSchoolCount)*100)}%`, background:school.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize:12, color:'var(--text3)', width:24, textAlign:'right', flexShrink:0 }}>{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* По городам ИЛИ детали города */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{selectedCity==='all' ? 'По городам' : 'Состав города'}</span>
          </div>
          <div className="card-body" style={{ padding:'8px 18px' }}>
            {loading && <p style={{ color:'var(--text3)', fontSize:13, padding:'12px 0' }}>Загрузка...</p>}

            {/* Все города */}
            {!loading && selectedCity==='all' && (
              byCity.length===0
                ? <p style={{ color:'var(--text3)', fontSize:13 }}>Нет данных</p>
                : byCity.map((item,i)=>{
                    const city = CITIES.find(c=>c.id===item.id);
                    return (
                      <div
                        key={item.id}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i<byCity.length-1?'1px solid var(--border)':'none', cursor:'pointer' }}
                        onClick={()=>handleCityChange(item.id)}
                      >
                        <span style={{ fontSize:14 }}>{city?.flag||'🌍'}</span>
                        <span style={{ fontSize:13, flex:1, color:'var(--text)' }}>{city?.name||item.id}</span>
                        <div style={{ width:60, flexShrink:0 }}>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width:`${Math.round((item.count/maxCityCount)*100)}%` }} />
                          </div>
                        </div>
                        <span style={{ fontSize:12, color:'var(--text3)', width:24, textAlign:'right', flexShrink:0 }}>{item.count}</span>
                      </div>
                    );
                  })
            )}

            {/* Детали города */}
            {!loading && selectedCity!=='all' && cityDetail && (
              Object.entries(cityDetail).map(([role,count],i)=>(
                <div key={role} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span className={`badge ${ROLE_BADGE[role]||'badge-guest'}`} style={{ flexShrink:0 }}>{ROLE_LABELS[role]||role}</span>
                  <div style={{ flex:1 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${Math.round((count/(stats.total||1))*100)}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', width:24, textAlign:'right' }}>{count}</span>
                </div>
              ))
            )}

            {!loading && selectedCity!=='all' && !cityDetail && (
              <p style={{ color:'var(--text3)', fontSize:13 }}>Нет данных для этого города</p>
            )}
          </div>
        </div>
      </div>

      {/* Последние участники */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Последние участники</span>
          <span style={{ fontSize:12, color:'var(--text3)' }}>
            {selectedCity==='all' ? 'Последние 5' : selectedCityData?.name}
          </span>
        </div>
        <div className="card-body" style={{ padding:'8px 18px' }}>
          {loading && <p style={{ color:'var(--text3)', fontSize:13, padding:'12px 0' }}>Загрузка...</p>}
          {recentUsers.map((u,i)=>(
            <div key={u.id} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:i<recentUsers.length-1?'1px solid var(--border)':'none', alignItems:'center' }}>
              <div className="avatar avatar-sm" style={{ background:u.color||'var(--accent)', flexShrink:0 }}>{u.initials||'?'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{u.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{u.email}</div>
              </div>
              <span className={`badge ${ROLE_BADGE[u.role]||'badge-guest'}`}>{ROLE_LABELS[u.role]||'Гость'}</span>
              <span style={{ fontSize:11, color:'var(--text3)', flexShrink:0 }}>{new Date(u.created_at).toLocaleDateString('ru')}</span>
            </div>
          ))}
          {!loading && recentUsers.length===0 && <p style={{ color:'var(--text3)', fontSize:13, padding:'12px 0' }}>Нет участников</p>}
        </div>
      </div>
    </div>
  );
}
