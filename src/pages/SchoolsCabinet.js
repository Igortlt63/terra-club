import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { SCHOOLS } from '../data/db';
import { supabase } from '../supabase';

// ── Прогресс-кольцо ─────────────────────────────────────────
function ProgressRing({ pct, size = 48, stroke = 4, color = '#C9922A' }) {
  const r    = (size - stroke) / 2;
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

// ── Карточка статистики ─────────────────────────────────────
function StatCard({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

// ── Модалка: сдать задание ──────────────────────────────────
function SubmitModal({ task, onClose, onSubmitted }) {
  const { currentUser } = useApp();
  const [answer,  setAnswer]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async () => {
    if (!answer.trim()) { setError('Напишите ваш ответ'); return; }
    setSaving(true);
    const { error: err } = await supabase
      .from('tasks')
      .update({ status: 'submitted', answer: answer.trim() })
      .eq('id', task.id)
      .eq('assigned_to', currentUser.id);
    if (err) { setError(err.message); setSaving(false); return; }
    onSubmitted();
    onClose();
  };

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.modal} onClick={e => e.stopPropagation()}>
        <div style={MS.header}>
          <span style={MS.title}>📤 Сдать задание</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
          {task.description && (
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>{task.description}</div>
          )}
          <label style={MS.label}>Ваш ответ</label>
          <textarea
            value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="Опишите что вы сделали, какие результаты получили..."
            rows={5}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
          />
          {error && <div style={MS.error}>{error}</div>}
        </div>
        <div style={MS.footer}>
          <button onClick={onClose} style={MS.btnCancel}>Отмена</button>
          <button onClick={handleSubmit} disabled={saving} style={MS.btnPrimary}>
            {saving ? 'Отправляю...' : '📤 Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Модалка: создать задание (для преподавателя) ────────────
function CreateTaskModal({ schoolId, streamNumber, onClose, onCreated }) {
  const { currentUser } = useApp();
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [deadline, setDeadline] = useState('');
  const [module,   setModule]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleCreate = async () => {
    if (!title.trim()) { setError('Введите название задания'); return; }
    setSaving(true);

    // Получаем всех учеников этой школы
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('school_id', schoolId)
      .eq('role', 'student');

    if (!students || students.length === 0) {
      // Создаём задание без привязки к конкретному ученику
      const { error: err } = await supabase.from('tasks').insert({
        title:       title.trim(),
        description: desc.trim() || null,
        school_id:   schoolId,
        module:      module ? parseInt(module) : null,
        deadline:    deadline || null,
        created_by:  currentUser.id,
        status:      'pending',
      });
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      // Создаём задание для каждого ученика
      const rows = students.map(s => ({
        title:       title.trim(),
        description: desc.trim() || null,
        school_id:   schoolId,
        module:      module ? parseInt(module) : null,
        deadline:    deadline || null,
        created_by:  currentUser.id,
        assigned_to: s.id,
        status:      'pending',
      }));
      const { error: err } = await supabase.from('tasks').insert(rows);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    onCreated();
    onClose();
  };

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.modal} onClick={e => e.stopPropagation()}>
        <div style={MS.header}>
          <span style={MS.title}>📝 Создать задание</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>
          <div style={MS.field}>
            <label style={MS.label}>Название задания *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Провести реальные переговоры" style={MS.input} />
          </div>
          <div style={MS.field}>
            <label style={MS.label}>Описание</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Подробное описание что нужно сделать..." rows={3} style={{ ...MS.input, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={MS.field}>
              <label style={MS.label}>Номер модуля</label>
              <input type="number" value={module} onChange={e => setModule(e.target.value)} placeholder="например: 4" style={MS.input} />
            </div>
            <div style={MS.field}>
              <label style={MS.label}>Дедлайн</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={MS.input} />
            </div>
          </div>
          {error && <div style={MS.error}>{error}</div>}
        </div>
        <div style={MS.footer}>
          <button onClick={onClose} style={MS.btnCancel}>Отмена</button>
          <button onClick={handleCreate} disabled={saving} style={MS.btnPrimary}>
            {saving ? 'Создаю...' : '✅ Создать для всех учеников'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Обзор всех школ для администратора ─────────────────────
function AdminSchoolsOverview() {
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Все школы Терра</h2>
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
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Главный компонент ───────────────────────────────────────
export default function SchoolsCabinet() {
  const { currentUser } = useApp();
  const role = currentUser?.role;

  const [activeTab,      setActiveTab]      = useState('overview');
  const [tasks,          setTasks]          = useState([]);
  const [students,       setStudents]       = useState([]);
  const [loadingTasks,   setLoadingTasks]   = useState(false);
  const [submitTask,     setSubmitTask]     = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const schoolId      = currentUser?.school_id || currentUser?.schoolId;
  const school        = SCHOOLS.find(s => s.id === schoolId);
  const currentModule = currentUser?.current_module || currentUser?.currentModule || 1;
  const totalModules  = school?.modules || 8;
  const progress      = Math.round((currentModule / totalModules) * 100);

  // Загрузить задания
  const loadTasks = useCallback(async () => {
    if (!schoolId) return;
    setLoadingTasks(true);
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });

    if (role === 'student') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data } = await query;
    setTasks(data || []);
    setLoadingTasks(false);
  }, [schoolId, role, currentUser]);

  // Загрузить учеников (для преподавателя)
  const loadStudents = useCallback(async () => {
    if (!schoolId || role !== 'teacher') return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)
      .eq('role', 'student');
    setStudents(data || []);
  }, [schoolId, role]);

  useEffect(() => {
    loadTasks();
    loadStudents();
  }, [loadTasks, loadStudents]);

  if (role === 'admin') return <AdminSchoolsOverview />;

  if (!school) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="icon">🎓</div>
        <p>Школа не назначена.<br />Обратитесь к администратору.</p>
      </div>
    );
  }

  // Статусы заданий
  const tasksDone    = tasks.filter(t => t.status === 'done').length;
  const tasksPending = tasks.filter(t => ['pending', 'submitted'].includes(t.status)).length;

  const statusInfo = {
    done:      { icon: '✅', label: 'Проверено',             color: '#16A34A' },
    submitted: { icon: '🟡', label: 'Сдано, ждёт проверки', color: '#D97706' },
    pending:   { icon: '📝', label: 'Не сдано',              color: '#C9922A' },
    overdue:   { icon: '🔴', label: 'Просрочено',            color: '#DC2626' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Шапка школы */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${school.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
            {school.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{school.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>
              {role === 'teacher'
                ? `${students.length} учеников`
                : `Модуль ${currentModule} из ${totalModules}`}
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
            <button onClick={() => setShowCreateTask(true)} style={BS.primary}>
              📝 Создать задание
            </button>
          )}
        </div>

        {/* Вкладки */}
        <div className="tabs">
          {[
            ['overview',  '📊 Обзор'],
            ['homework',  '📝 Задания'],
            ...(role === 'teacher' ? [['students', '👥 Ученики']] : []),
          ].map(([t, l]) => (
            <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{l}</div>
          ))}
        </div>
      </div>

      {/* Контент вкладок */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ОБЗОР */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {role === 'student' ? (
                <>
                  <StatCard icon="📚" label="Текущий модуль" value={`${currentModule} из ${totalModules}`} />
                  <StatCard icon="✅" label="Заданий сдано"  value={`${tasksDone} из ${tasks.length}`} />
                  <StatCard icon="📝" label="Ожидают сдачи"  value={tasksPending} />
                </>
              ) : (
                <>
                  <StatCard icon="👥" label="Учеников"         value={students.length || 0} />
                  <StatCard icon="📝" label="Активных заданий" value={tasks.filter(t => t.status === 'pending').length} />
                  <StatCard icon="🟡" label="Ждут проверки"    value={tasks.filter(t => t.status === 'submitted').length} />
                </>
              )}
            </div>

            {/* Текущее задание для ученика */}
            {role === 'student' && tasks.filter(t => t.status === 'pending').length > 0 && (
              <div className="card" style={{ border: `1px solid ${school.color}30`, background: `${school.color}06`, marginBottom: 16 }}>
                <div className="card-header"><span className="card-title">📝 Текущее задание</span></div>
                <div className="card-body">
                  {tasks.filter(t => t.status === 'pending').slice(0, 1).map(task => (
                    <div key={task.id}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{task.description}</div>
                      )}
                      {task.deadline && (
                        <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 12 }}>
                          ⏰ Дедлайн: {new Date(task.deadline).toLocaleDateString('ru')}
                        </div>
                      )}
                      <button onClick={() => setSubmitTask(task)} style={BS.primary}>
                        📤 Сдать задание
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Задания ждут проверки — для преподавателя */}
            {role === 'teacher' && tasks.filter(t => t.status === 'submitted').length > 0 && (
              <div className="card" style={{ border: '1px solid #FDE68A', background: '#FFFBEB' }}>
                <div className="card-header"><span className="card-title">🟡 Ждут проверки</span></div>
                <div className="card-body">
                  {tasks.filter(t => t.status === 'submitted').map(task => (
                    <div key={task.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                        {task.answer && (
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>
                            💬 {task.answer}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleGradeTask(task.id)} style={BS.ghost}>✓ Проверить</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ЗАДАНИЯ */}
        {activeTab === 'homework' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingTasks && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Загрузка...</div>
            )}
            {!loadingTasks && tasks.length === 0 && (
              <div className="empty-state" style={{ padding: 60 }}>
                <div className="icon">📝</div>
                <p>{role === 'teacher' ? 'Заданий пока нет. Создайте первое!' : 'Заданий пока нет.'}</p>
              </div>
            )}
            {tasks.map(task => {
              const st = statusInfo[task.status] || statusInfo.pending;
              return (
                <div key={task.id} className="card" style={{ borderLeft: `3px solid ${st.color}` }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{st.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3, lineHeight: 1.5 }}>{task.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: st.color, fontWeight: 500 }}>{st.label}</span>
                        {task.deadline && (
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                            ⏰ {new Date(task.deadline).toLocaleDateString('ru')}
                          </span>
                        )}
                        {task.module && (
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Модуль {task.module}</span>
                        )}
                      </div>
                      {task.answer && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, padding: '6px 10px', background: 'var(--bg2)', borderRadius: 6, lineHeight: 1.5 }}>
                          💬 Ответ: {task.answer}
                        </div>
                      )}
                      {task.feedback && (
                        <div style={{ fontSize: 12, color: '#16A34A', marginTop: 6 }}>
                          ✅ Отзыв преподавателя: {task.feedback}
                        </div>
                      )}
                      {task.grade && (
                        <div style={{ fontSize: 12, color: '#16A34A', marginTop: 3, fontWeight: 600 }}>
                          Оценка: {task.grade}/5 ⭐
                        </div>
                      )}
                    </div>
                    {role === 'student' && task.status === 'pending' && (
                      <button onClick={() => setSubmitTask(task)} style={BS.primary}>Сдать</button>
                    )}
                    {role === 'teacher' && task.status === 'submitted' && (
                      <GradeButton task={task} onGraded={loadTasks} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* УЧЕНИКИ (для преподавателя) */}
        {activeTab === 'students' && role === 'teacher' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ученики школы</span>
              <button onClick={loadStudents} style={BS.ghost}>🔄</button>
            </div>
            <div className="card-body">
              {students.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 30 }}>
                  Учеников пока нет
                </div>
              ) : students.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar avatar-sm" style={{ background: u.color || '#888' }}>{u.initials || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Модуль {u.current_module || 1} из {totalModules}
                    </div>
                  </div>
                  <div style={{ width: 100 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.round(((u.current_module || 1) / totalModules) * 100)}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', width: 32, textAlign: 'right' }}>
                    {Math.round(((u.current_module || 1) / totalModules) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модалки */}
      {submitTask && (
        <SubmitModal
          task={submitTask}
          onClose={() => setSubmitTask(null)}
          onSubmitted={loadTasks}
        />
      )}
      {showCreateTask && (
        <CreateTaskModal
          schoolId={schoolId}
          streamNumber={currentUser?.stream_number}
          onClose={() => setShowCreateTask(false)}
          onCreated={loadTasks}
        />
      )}
    </div>
  );
}

// ── Кнопка оценить задание ──────────────────────────────────
function GradeButton({ task, onGraded }) {
  const [open,     setOpen]     = useState(false);
  const [grade,    setGrade]    = useState('5');
  const [feedback, setFeedback] = useState('');
  const [saving,   setSaving]   = useState(false);

  const handleGrade = async () => {
    setSaving(true);
    await supabase.from('tasks').update({
      status:   'done',
      grade:    parseInt(grade),
      feedback: feedback.trim() || null,
    }).eq('id', task.id);
    onGraded();
    setOpen(false);
    setSaving(false);
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} style={BS.primary}>✓ Проверить</button>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
      <select value={grade} onChange={e => setGrade(e.target.value)}
        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border2)', fontSize: 13, background: '#fff' }}>
        {[5,4,3,2,1].map(g => <option key={g} value={g}>{g}/5 ⭐</option>)}
      </select>
      <input value={feedback} onChange={e => setFeedback(e.target.value)}
        placeholder="Отзыв (необязательно)"
        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border2)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setOpen(false)} style={BS.ghost}>✕</button>
        <button onClick={handleGrade} disabled={saving} style={BS.primary}>{saving ? '...' : 'Сохранить'}</button>
      </div>
    </div>
  );
}

// ── Стили кнопок ────────────────────────────────────────────
const BS = {
  primary: { padding: '7px 14px', borderRadius: 8, background: '#C9922A', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 },
  ghost:   { padding: '6px 12px', borderRadius: 8, background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
};

// ── Стили модалок ────────────────────────────────────────────
const MS = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: '#fff', borderRadius: 14, width: 480, maxWidth: '92vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
  header:     { padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:      { fontSize: 15, fontWeight: 600 },
  close:      { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text3)', lineHeight: 1, padding: 0 },
  body:       { padding: '18px 20px', overflowY: 'auto', flex: 1 },
  footer:     { padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  field:      { marginBottom: 14 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 },
  input:      { width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  error:      { color: '#DC2626', fontSize: 13, marginTop: 8, padding: '8px 12px', background: '#FEF2F2', borderRadius: 6 },
  btnCancel:  { padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C9922A', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
};
