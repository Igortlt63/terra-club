import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS } from '../data/db';

const MENTEES = [
  { id: 'u5', name: 'Анна Кириллова', initials: 'АК', color: '#EF4444', goal: 'Масштабировать кафе до сети', progress: 68, lastContact: '2 дня назад', nextMeeting: '22 янв', status: 'active', notes: 'Хорошая динамика. Нужно проработать финансовую модель.' },
  { id: 'u7', name: 'Руслан Мирзаев', initials: 'РМ', color: '#3B82F6', goal: 'Систематизировать отдел продаж', progress: 41, lastContact: '5 дней назад', nextMeeting: '23 янв', status: 'needs_attention', notes: 'Застрял на построении CRM. Обсудить на встрече.' },
  { id: 'u8', name: 'Наталья Тихонова', initials: 'НТ', color: '#16A34A', goal: 'Выйти на международный рынок', progress: 85, lastContact: 'Вчера', nextMeeting: '25 янв', status: 'active', notes: 'Почти готова. Помочь с юридической стороной экспорта.' },
  { id: 'u9', name: 'Олег Лапин', initials: 'ОЛ', color: '#C9922A', goal: 'Нанять первых 5 сотрудников', progress: 23, lastContact: '1 неделю назад', nextMeeting: '21 янв', status: 'needs_attention', notes: 'Страх делегирования. Проработать психологический барьер.' },
];

const TASKS = [
  { id: 't1', title: 'Описать финансовую модель на 6 месяцев', menteeId: 'u5', deadline: '20 янв', status: 'submitted', submittedAt: '18 янв' },
  { id: 't2', title: 'Составить скрипт продаж для менеджеров', menteeId: 'u7', deadline: '22 янв', status: 'pending' },
  { id: 't3', title: 'Изучить требования к экспорту в ЕС', menteeId: 'u8', deadline: '19 янв', status: 'done', grade: 5 },
  { id: 't4', title: 'Написать вакансию для первого сотрудника', menteeId: 'u9', deadline: '21 янв', status: 'overdue' },
];

function MenteeCard({ mentee, selected, onClick }) {
  const statusColor = { active: '#16A34A', needs_attention: '#C9922A', inactive: '#94A3B8' };
  return (
    <div onClick={onClick} style={{ padding: '12px 16px', cursor: 'pointer', background: selected ? 'var(--gold-dim)' : 'transparent', borderBottom: '1px solid var(--border)', borderLeft: selected ? '3px solid var(--gold)' : '3px solid transparent', transition: 'all 0.12s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="avatar avatar-sm" style={{ background: mentee.color }}>{mentee.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mentee.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[mentee.status], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Прогресс: {mentee.progress}%</span>
          </div>
        </div>
      </div>
      <div className="progress-bar" style={{ marginTop: 8 }}>
        <div className="progress-fill" style={{ width: `${mentee.progress}%` }} />
      </div>
    </div>
  );
}

function MentorView() {
  const [selectedMentee, setSelectedMentee] = useState(MENTEES[0]);
  const [activeTab, setActiveTab] = useState('profile');
  const menteeTasks = TASKS.filter(t => t.menteeId === selectedMentee?.id);

  const statusLabel = { submitted: ['🟡', 'Сдано, ждёт проверки'], pending: ['⏳', 'В процессе'], done: ['✅', 'Проверено'], overdue: ['🔴', 'Просрочено'] };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Mentee list */}
      <div style={{ width: 220, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Мои наставляемые</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{MENTEES.length} чел.</span>
        </div>
        {MENTEES.map(m => <MenteeCard key={m.id} mentee={m} selected={selectedMentee?.id === m.id} onClick={() => setSelectedMentee(m)} />)}
        <div style={{ padding: '12px 16px' }}>
          <button className="btn-secondary" style={{ width: '100%', fontSize: 12 }}>+ Добавить наставляемого</button>
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedMentee ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar avatar-lg" style={{ background: selectedMentee.color }}>{selectedMentee.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{selectedMentee.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>🎯 {selectedMentee.goal}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    Последний контакт: {selectedMentee.lastContact} · Следующая встреча: {selectedMentee.nextMeeting}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)' }}>{selectedMentee.progress}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>прогресс</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ fontSize: 12 }}>💬 Написать</button>
                  <button className="btn-primary" style={{ fontSize: 12 }}>📝 Задание</button>
                </div>
              </div>
              <div className="progress-bar" style={{ marginTop: 14 }}>
                <div className="progress-fill" style={{ width: `${selectedMentee.progress}%` }} />
              </div>
            </div>

            <div className="tabs" style={{ flexShrink: 0 }}>
              {[['profile', '👤 Профиль'], ['tasks', '📋 Задания'], ['notes', '📝 Заметки'], ['history', '📅 История']].map(([t, l]) => (
                <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{l}</div>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {activeTab === 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Цель на поток</span></div>
                    <div className="card-body">
                      <p style={{ fontSize: 14, lineHeight: 1.6 }}>{selectedMentee.goal}</p>
                      <div style={{ marginTop: 12 }}>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${selectedMentee.progress}%` }} /></div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Выполнено на {selectedMentee.progress}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Заметки наставника</span></div>
                    <div className="card-body">
                      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{selectedMentee.notes}</p>
                      <button className="btn-ghost" style={{ fontSize: 12, marginTop: 12 }}>✏️ Редактировать</button>
                    </div>
                  </div>
                  <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header"><span className="card-title">Статистика</span></div>
                    <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      {[['8', 'Встреч проведено'], ['5', 'Заданий выдано'], ['4', 'Заданий сдано'], ['4.7', 'Средняя оценка']].map(([v, l]) => (
                        <div key={l} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg2)', borderRadius: 8 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{v}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Задания</h3>
                    <button className="btn-primary" style={{ fontSize: 12 }}>+ Новое задание</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {menteeTasks.map(task => {
                      const [icon, label] = statusLabel[task.status];
                      return (
                        <div key={task.id} className="card">
                          <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 20 }}>{icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{label} · Дедлайн: {task.deadline}</div>
                            </div>
                            {task.status === 'submitted' && <button className="btn-primary" style={{ fontSize: 12 }}>✓ Проверить</button>}
                          </div>
                        </div>
                      );
                    })}
                    {menteeTasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Заданий пока нет</div>}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="card">
                  <div className="card-header"><span className="card-title">Личные заметки</span><button className="btn-ghost" style={{ fontSize: 12 }}>Сохранить</button></div>
                  <div className="card-body">
                    <textarea defaultValue={selectedMentee.notes} style={{ width: '100%', minHeight: 200, fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { date: '15 янв', type: '🗓️', text: 'Онлайн-встреча 45 минут. Обсудили финансовую модель.' },
                    { date: '13 янв', type: '📝', text: 'Выдано задание: Финансовая модель на 6 месяцев' },
                    { date: '08 янв', type: '🗓️', text: 'Первая встреча. Знакомство, постановка целей.' },
                    { date: '06 янв', type: '✅', text: 'Задание «Описание проекта» проверено. Оценка 5/5.' },
                  ].map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 18 }}>{ev.type}</span>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{ev.date}</div>
                        <div style={{ fontSize: 13 }}>{ev.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state"><div className="icon">👥</div><p>Выберите наставляемого</p></div>
        )}
      </div>
    </div>
  );
}

function MenteeView() {
  const { currentUser } = useApp();
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Мой наставник</span>
        </div>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="avatar avatar-lg" style={{ background: '#22C55E' }}>ДП</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Дмитрий Панков</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Алматы · 10 лет опыта в бизнесе</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Следующая встреча: <strong>22 января, 19:00</strong></div>
          </div>
          <button className="btn-primary" style={{ marginLeft: 'auto', fontSize: 13 }}>💬 Написать</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">🎯 Моя цель</span></div>
          <div className="card-body">
            <p style={{ fontSize: 14 }}>Запустить свой продукт к марту</p>
            <div className="progress-bar" style={{ marginTop: 10 }}><div className="progress-fill" style={{ width: '68%' }} /></div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>68% выполнено</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Текущее задание</span></div>
          <div className="card-body">
            <p style={{ fontSize: 13 }}>Описать финансовую модель на 6 месяцев</p>
            <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 6 }}>⏰ Дедлайн: 20 января</div>
            <button className="btn-primary" style={{ fontSize: 12, marginTop: 10 }}>📤 Сдать задание</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">👥 Группа наставничества</span></div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>Другие участники вашей группы:</p>
          {[
            { name: 'Руслан Мирзаев', initials: 'РМ', color: '#3B82F6', goal: 'Систематизировать отдел продаж' },
            { name: 'Наталья Тихонова', initials: 'НТ', color: '#16A34A', goal: 'Международный рынок' },
            { name: 'Олег Лапин', initials: 'ОЛ', color: '#C9922A', goal: 'Нанять первых сотрудников' },
          ].map(m => (
            <div key={m.name} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="avatar avatar-sm" style={{ background: m.color }}>{m.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.goal}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MentoringCabinet() {
  const { currentUser } = useApp();
  if (currentUser?.role === 'mentor') return <MentorView />;
  if (currentUser?.role === 'mentee') return <MenteeView />;
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Наставничество — Общий обзор</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[['184', 'Активных пар'], ['22', 'Наставника'], ['78%', 'Средний прогресс']].map(([v, l]) => (
          <div key={l} style={{ background: 'var(--bg2)', padding: '20px', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>{v}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
