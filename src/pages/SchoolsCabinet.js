import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SCHOOLS, MEDIA_FILES, DEMO_USERS } from '../data/db';

function ProgressRing({ pct, size = 48, stroke = 4, color = '#C9922A' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1EFE8" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function MediaItem({ file }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{file.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{file.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Модуль {file.module} · {file.duration || file.size}</div>
      </div>
      <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
        {file.type === 'video' ? '▶ Смотреть' : file.type === 'audio' ? '▶ Слушать' : '📥 Скачать'}
      </button>
    </div>
  );
}

function StudentRow({ user, mod }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="avatar avatar-sm" style={{ background: user.color }}>{user.initials}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Модуль {user.currentModule || 1} из {mod}</div>
      </div>
      <div style={{ width: 120 }}>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round(((user.currentModule || 1) / mod) * 100)}%` }} /></div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text3)', width: 32, textAlign: 'right' }}>{Math.round(((user.currentModule || 1) / mod) * 100)}%</span>
      <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>Написать</button>
    </div>
  );
}

export default function SchoolsCabinet() {
  const { currentUser } = useApp();
  const role = currentUser?.role;
  const [activeTab, setActiveTab] = useState('overview');

  // Teacher sees their school; student sees their school; admin sees all
  const mySchoolId = currentUser?.schoolId;
  const school = SCHOOLS.find(s => s.id === mySchoolId) || SCHOOLS[0];
  const files = MEDIA_FILES.filter(f => f.schoolId === mySchoolId);
  const students = DEMO_USERS.filter(u => u.role === 'student' && u.schoolId === mySchoolId);
  const currentModule = currentUser?.currentModule || 1;
  const totalModules = school?.modules || 8;
  const progress = Math.round((currentModule / totalModules) * 100);

  if (role === 'admin') {
    return <AdminSchoolsOverview />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* School header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${school.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{school.icon}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{school.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>
              Поток 12 · {role === 'teacher' ? `${students.length} учеников` : `Модуль ${currentModule} из ${totalModules}`}
            </div>
          </div>
          {role === 'student' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ProgressRing pct={progress} color={school.color} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: school.color }}>{progress}%</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>пройдено</div>
              </div>
            </div>
          )}
          {role === 'teacher' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary">📎 Загрузить материал</button>
              <button className="btn-primary">📝 Создать задание</button>
            </div>
          )}
        </div>
        <div className="tabs">
          {['overview', 'modules', 'students', 'media', 'homework'].filter(t => {
            if (t === 'students' && role !== 'teacher') return false;
            return true;
          }).map(t => {
            const labels = { overview: '📊 Обзор', modules: '📋 Модули', students: '👥 Ученики', media: '📁 Медиатека', homework: '📝 Задания' };
            return <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{labels[t]}</div>;
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {role === 'student' ? (
                <>
                  <StatCard icon="📚" label="Текущий модуль" value={`${currentModule} из ${totalModules}`} />
                  <StatCard icon="✅" label="Заданий сдано" value="7 / 12" />
                  <StatCard icon="⭐" label="Средняя оценка" value="4.8 / 5" />
                </>
              ) : (
                <>
                  <StatCard icon="👥" label="Учеников" value={students.length || 12} />
                  <StatCard icon="📊" label="Средний прогресс" value="61%" />
                  <StatCard icon="📅" label="Следующая встреча" value="Чт 19:00" />
                </>
              )}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">📅 Ближайшие встречи</span></div>
              <div className="card-body">
                {[
                  { date: '16 янв, Чт', time: '19:00', topic: 'Офлайн-встреча потока · Модуль 4. Практика переговоров', loc: 'Садовая 24' },
                  { date: '23 янв, Чт', time: '19:00', topic: 'Офлайн-встреча потока · Модуль 5', loc: 'Садовая 24' },
                ].map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>{ev.date}</div>
                      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{ev.time}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.topic}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>📍 {ev.loc}</div>
                    </div>
                    <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12, alignSelf: 'center' }}>+ В календарь</button>
                  </div>
                ))}
              </div>
            </div>

            {role === 'student' && (
              <div className="card" style={{ border: `1px solid ${school.color}30`, background: `${school.color}06` }}>
                <div className="card-header"><span className="card-title">📝 Текущее задание</span></div>
                <div className="card-body">
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Модуль 4: Проведите реальные переговоры</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
                    Примените технику BATNA в реальных переговорах (с поставщиком, клиентом, партнёром). Запишите результат: с кем, о чём, какой исход. Дедлайн — воскресенье 19 января.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary">📤 Сдать задание</button>
                    <button className="btn-secondary">❓ Задать вопрос</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'modules' && (
          <div>
            {Array.from({ length: totalModules }, (_, i) => i + 1).map(mod => {
              const done = mod < currentModule;
              const current = mod === currentModule;
              return (
                <div key={mod} className="card" style={{ marginBottom: 10, borderLeft: current ? `3px solid ${school.color}` : done ? '3px solid #16A34A' : '3px solid var(--border)', opacity: mod > currentModule + 1 ? 0.5 : 1 }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#16A34A' : current ? school.color : 'var(--bg3)', color: done || current ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      {done ? '✓' : mod}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: current ? 600 : 500 }}>Модуль {mod}: {['Введение в переговоры', 'Психология переговоров', 'Метод BATNA', 'Активное слушание', 'Работа с возражениями', 'Торг и компромисс', 'Кросс-культурные переговоры', 'Итоговая практика'][mod - 1] || `Урок ${mod}`}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{done ? 'Завершён ✓' : current ? 'В процессе — текущий' : 'Заблокирован'}</div>
                    </div>
                    {(done || current) && <button className="btn-ghost" style={{ fontSize: 12 }}>{done ? 'Повторить' : 'Продолжить →'}</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'students' && role === 'teacher' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ученики · Поток 12</span>
              <button className="btn-ghost" style={{ fontSize: 12 }}>📤 Экспорт</button>
            </div>
            <div className="card-body">
              {students.length > 0 ? students.map(u => <StudentRow key={u.id} user={u} mod={totalModules} />) : (
                [{ id: 'x1', name: 'Мария Карпова', initials: 'МК', color: '#8B5CF6', currentModule: 4 },
                 { id: 'x2', name: 'Игорь Смирнов', initials: 'ИС', color: '#3B82F6', currentModule: 3 },
                 { id: 'x3', name: 'Наталья Орлова', initials: 'НО', color: '#EF4444', currentModule: 5 }].map(u => <StudentRow key={u.id} user={u} mod={totalModules} />)
              )}
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Медиатека школы</span>
                {role === 'teacher' && <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}>+ Загрузить</button>}
              </div>
              <div className="card-body">
                {files.length > 0 ? files.map(f => <MediaItem key={f.id} file={f} />) : (
                  [
                    { id: 'f1', icon: '🎥', title: 'Введение в переговоры', type: 'video', module: 1, duration: '22:10' },
                    { id: 'f2', icon: '🎥', title: 'Метод BATNA', type: 'video', module: 3, duration: '31:15' },
                    { id: 'f3', icon: '📄', title: 'Рабочая тетрадь. Модуль 4', type: 'doc', module: 4, size: '2.4 MB' },
                  ].map(f => <MediaItem key={f.id} file={f} />)
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'homework' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { mod: 1, title: 'Написать эссе: «Мой опыт переговоров»', status: 'done', grade: 5, feedback: 'Отлично! Хорошо раскрыта тема.' },
              { mod: 2, title: 'Найти партнёра и провести учебные переговоры', status: 'done', grade: 4, feedback: 'Хорошая работа. Обратите внимание на паузы.' },
              { mod: 3, title: 'Применить BATNA в реальной ситуации', status: 'done', grade: 5, feedback: 'Блестящий результат! -15% с поставщика.' },
              { mod: 4, title: 'Практика активного слушания — 3 случая', status: 'pending', deadline: '19 янв' },
            ].map((hw, i) => (
              <div key={i} className="card" style={{ borderLeft: hw.status === 'done' ? '3px solid #16A34A' : '3px solid var(--gold)' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 20 }}>{hw.status === 'done' ? '✅' : '📝'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Модуль {hw.mod}: {hw.title}</div>
                    {hw.status === 'done' ? (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>Оценка: {hw.grade}/5 ⭐</span>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>💬 {hw.feedback}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>⏰ Дедлайн: {hw.deadline}</div>
                    )}
                  </div>
                  {hw.status === 'pending' && <button className="btn-primary" style={{ fontSize: 12, flexShrink: 0 }}>Сдать</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function AdminSchoolsOverview() {
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Все школы Терра — Обзор</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {SCHOOLS.map(s => (
          <div key={s.id} className="card" style={{ cursor: 'pointer' }}>
            <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.modules} модулей</div>
              </div>
            </div>
            <div style={{ padding: '0 16px 14px' }}>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round(Math.random() * 60 + 20)}%`, background: s.color }} /></div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Поток 12 — {Math.floor(Math.random() * 150 + 50)} учеников</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
