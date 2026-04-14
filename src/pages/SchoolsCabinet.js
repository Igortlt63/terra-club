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

function StatCard({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

// ── Модалка: сдать задание (ученик) ─────────────────────────
function SubmitModal({ task, onClose, onSubmitted }) {
  const { currentUser } = useApp();
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async () => {
    if (!answer.trim()) { setError('Напишите ваш ответ'); return; }
    setSaving(true);
    const { error: err } = await supabase
      .from('tasks')
      .update({ status: 'submitted', answer: answer.trim() })
      .eq('id', task.id);
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
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{task.title}</div>
          {task.description && (
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>{task.description}</div>
          )}
          <label style={MS.label}>Ваш ответ</label>
          <textarea
            value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="Опишите что вы сделали, какие результаты получили..."
            rows={5}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
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

// ── Модалка: проверить задание (преподаватель) ───────────────
function GradeModal({ task, studentName, onClose, onGraded }) {
  const [grade,    setGrade]    = useState('5');
  const [feedback, setFeedback] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleGrade = async () => {
    setSaving(true);
    const { error: err } = await supabase
      .from('tasks')
      .update({ status: 'done', grade: parseInt(grade), feedback: feedback.trim() || null })
      .eq('id', task.id);
    if (err) { setError(err.message); setSaving(false); return; }
    onGraded();
    onClose();
  };

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.modal} onClick={e => e.stopPropagation()}>
        <div style={MS.header}>
          <span style={MS.title}>✅ Проверить задание</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
          {studentName && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Ученик: {studentName}</div>}
          {task.answer && (
            <div style={{ background: 'var(--bg2)', padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, lineHeight: 1.6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ответ ученика</div>
              {task.answer}
            </div>
          )}
          <div style={MS.field}>
            <label style={MS.label}>Оценка</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 4, 3, 2, 1].map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(String(g))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    border: grade === String(g) ? '2px solid #C9922A' : '1px solid var(--border2)',
                    background: grade === String(g) ? 'rgba(201,146,42,0.1)' : '#fff',
                    fontWeight: grade === String(g) ? 700 : 400,
                    color: grade === String(g) ? '#C9922A' : 'var(--text2)',
                    cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                  }}
                >{g}⭐</button>
              ))}
            </div>
          </div>
          <div style={MS.field}>
            <label style={MS.label}>Отзыв (необязательно)</label>
            <textarea
              value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Комментарий для ученика..."
              rows={3}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {error && <div style={MS.error}>{error}</div>}
        </div>
        <div style={MS.footer}>
          <button onClick={onClose} style={MS.btnCancel}>Отмена</button>
          <button onClick={handleGrade} disabled={saving} style={MS.btnPrimary}>
            {saving ? 'Сохраняю...' : '✅ Поставить оценку'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Модалка: создать задание (преподаватель) ─────────────────
function CreateTaskModal({ schoolId, modules, onClose, onCreated }) {
  const { currentUser } = useApp();
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [deadline, setDeadline] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleCreate = async () => {
    if (!title.trim()) { setError('Введите название задания'); return; }
    setSaving(true);

    const selectedModule = modules.find(m => m.id === moduleId);

    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('school_id', schoolId)
      .eq('role', 'student');

    const baseTask = {
      title:       title.trim(),
      description: desc.trim() || null,
      school_id:   schoolId,
      module:      selectedModule?.number || null,
      deadline:    deadline || null,
      created_by:  currentUser.id,
      status:      'pending',
    };

    if (!students || students.length === 0) {
      const { error: err } = await supabase.from('tasks').insert(baseTask);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const rows = students.map(s => ({ ...baseTask, assigned_to: s.id }));
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
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Например: Провести реальные переговоры"
              style={{ ...MS.inputStyle }} />
          </div>
          <div style={MS.field}>
            <label style={MS.label}>Описание</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Подробное описание что нужно сделать..."
              rows={3}
              style={{ ...MS.inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={MS.field}>
              <label style={MS.label}>Модуль</label>
              <select value={moduleId} onChange={e => setModuleId(e.target.value)}
                style={{ ...MS.inputStyle, background: 'var(--bg-raised)' }}>
                <option value="">— не выбран —</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>Модуль {m.number}: {m.title}</option>
                ))}
              </select>
            </div>
            <div style={MS.field}>
              <label style={MS.label}>Дедлайн</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                style={{ ...MS.inputStyle }} />
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

// ── Модалка: создать/редактировать модуль (преподаватель) ────
function ModuleModal({ module, schoolId, nextNumber, onClose, onSaved }) {
  const { currentUser } = useApp();
  const [title,   setTitle]   = useState(module?.title   || '');
  const [desc,    setDesc]    = useState(module?.description || '');
  const [content, setContent] = useState(module?.content || '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const handleSave = async () => {
    if (!title.trim()) { setError('Введите название модуля'); return; }
    setSaving(true);

    if (module?.id) {
      // Редактирование
      const { error: err } = await supabase.from('modules')
        .update({ title: title.trim(), description: desc.trim() || null, content: content.trim() || null })
        .eq('id', module.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      // Создание
      const { error: err } = await supabase.from('modules')
        .insert({ school_id: schoolId, number: nextNumber, title: title.trim(), description: desc.trim() || null, content: content.trim() || null, created_by: currentUser.id });
      if (err) { setError(err.message); setSaving(false); return; }
    }

    onSaved();
    onClose();
  };

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={{ ...MS.modal, width: 560 }} onClick={e => e.stopPropagation()}>
        <div style={MS.header}>
          <span style={MS.title}>{module ? '✏️ Редактировать модуль' : `➕ Новый модуль ${nextNumber}`}</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>
          <div style={MS.field}>
            <label style={MS.label}>Название модуля *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Например: Техники активного слушания"
              style={{ ...MS.inputStyle }} />
          </div>
          <div style={MS.field}>
            <label style={MS.label}>Краткое описание</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Что изучат ученики в этом модуле..."
              rows={2} style={{ ...MS.inputStyle, resize: 'vertical' }} />
          </div>
          <div style={MS.field}>
            <label style={MS.label}>Содержание / материалы урока</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Основные темы, ссылки на материалы, конспект урока..."
              rows={6} style={{ ...MS.inputStyle, resize: 'vertical' }} />
          </div>
          {error && <div style={MS.error}>{error}</div>}
        </div>
        <div style={MS.footer}>
          <button onClick={onClose} style={MS.btnCancel}>Отмена</button>
          <button onClick={handleSave} disabled={saving} style={MS.btnPrimary}>
            {saving ? 'Сохраняю...' : '💾 Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Обзор всех школ для администратора ──────────────────────
function AdminSchoolsOverview() {
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Все школы Терра</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {SCHOOLS.map(s => (
          <div key={s.id} className="card">
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

// ── Главный компонент ────────────────────────────────────────
export default function SchoolsCabinet() {
  const { currentUser } = useApp();
  const role = currentUser?.role;

  const [activeTab,       setActiveTab]       = useState('overview');
  const [tasks,           setTasks]           = useState([]);
  const [students,        setStudents]        = useState([]);
  const [studentMap,      setStudentMap]      = useState({});
  const [modules,         setModules]         = useState([]);
  const [loadingTasks,    setLoadingTasks]    = useState(false);
  const [loadingModules,  setLoadingModules]  = useState(false);
  const [submitTask,      setSubmitTask]      = useState(null);
  const [gradeTask,       setGradeTask]       = useState(null);
  const [showCreateTask,  setShowCreateTask]  = useState(false);
  const [moduleModal,     setModuleModal]     = useState(null); // null | 'new' | module object

  const schoolId      = currentUser?.school_id;
  const school        = SCHOOLS.find(s => s.id === schoolId);
  const currentModule = currentUser?.current_module || 1;
  const totalModules  = modules.length || school?.modules || 1;
  const progress      = totalModules > 0 ? Math.round((currentModule / totalModules) * 100) : 0;

  // ── Загрузка заданий ──────────────────────────────────────
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

    const { data, error } = await query;
    if (error) console.error('loadTasks error:', error.message);
    setTasks(data || []);
    setLoadingTasks(false);
  }, [schoolId, role, currentUser?.id]);

  // ── Загрузка учеников ─────────────────────────────────────
  const loadStudents = useCallback(async () => {
    if (!schoolId || role !== 'teacher') return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)
      .eq('role', 'student');
    const list = data || [];
    setStudents(list);
    // Карта id -> profile для быстрого поиска имени
    const map = {};
    list.forEach(s => { map[s.id] = s; });
    setStudentMap(map);
  }, [schoolId, role]);

  // ── Загрузка модулей ──────────────────────────────────────
  const loadModules = useCallback(async () => {
    if (!schoolId) return;
    setLoadingModules(true);
    const { data } = await supabase
      .from('modules')
      .select('*')
      .eq('school_id', schoolId)
      .order('number', { ascending: true });
    setModules(data || []);
    setLoadingModules(false);
  }, [schoolId]);

  useEffect(() => {
    loadTasks();
    loadStudents();
    loadModules();
  }, [loadTasks, loadStudents, loadModules]);

  // ── Обновить текущий модуль ученика ───────────────────────
  const setStudentModule = async (moduleNumber) => {
    await supabase
      .from('profiles')
      .update({ current_module: moduleNumber })
      .eq('id', currentUser.id);
    window.location.reload(); // обновляем страницу чтобы подхватить новое значение
  };

  // ── Удалить модуль ────────────────────────────────────────
  const deleteModule = async (moduleId) => {
    if (!window.confirm('Удалить этот модуль?')) return;
    await supabase.from('modules').delete().eq('id', moduleId);
    loadModules();
  };

  if (role === 'admin') return <AdminSchoolsOverview />;

  if (!school) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="icon">🎓</div>
        <p>Школа не назначена.<br />Обратитесь к администратору.</p>
      </div>
    );
  }

  const tasksDone      = tasks.filter(t => t.status === 'done').length;
  const tasksSubmitted = tasks.filter(t => t.status === 'submitted').length;
  const tasksPending   = tasks.filter(t => t.status === 'pending').length;

  const statusInfo = {
    done:      { icon: '✅', label: 'Проверено',              color: 'var(--green)' },
    submitted: { icon: '🟡', label: 'Сдано, ждёт проверки',  color: '#D97706' },
    pending:   { icon: '📝', label: 'Не сдано',               color: '#C9922A' },
    overdue:   { icon: '🔴', label: 'Просрочено',             color: 'var(--red)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Шапка */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${school.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
            {school.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{school.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>
              {role === 'teacher'
                ? `${students.length} учеников · ${modules.length} модулей`
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModuleModal('new')} style={BS.ghost}>➕ Модуль</button>
              <button onClick={() => setShowCreateTask(true)} style={BS.primary}>📝 Задание</button>
            </div>
          )}
        </div>

        {/* Вкладки */}
        <div className="tabs">
          {[
            ['overview',  '📊 Обзор'],
            ['modules',   '📋 Модули'],
            ['homework',  '📝 Задания'],
            ...(role === 'teacher' ? [['students', '👥 Ученики']] : []),
          ].map(([t, l]) => (
            <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{l}</div>
          ))}
        </div>
      </div>

      {/* Контент */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ── ОБЗОР ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {role === 'student' ? (
                <>
                  <StatCard icon="📚" label="Текущий модуль"  value={`${currentModule} из ${totalModules}`} />
                  <StatCard icon="✅" label="Заданий сдано"   value={`${tasksDone} из ${tasks.length}`} />
                  <StatCard icon="📝" label="Ожидают сдачи"   value={tasksPending} />
                </>
              ) : (
                <>
                  <StatCard icon="👥" label="Учеников"          value={students.length} />
                  <StatCard icon="🟡" label="Ждут проверки"     value={tasksSubmitted} />
                  <StatCard icon="📋" label="Модулей создано"   value={modules.length} />
                </>
              )}
            </div>

            {/* Задания ждут проверки — для преподавателя */}
            {role === 'teacher' && tasksSubmitted > 0 && (
              <div className="card" style={{ marginBottom: 16, border: '1px solid #FDE68A', background: '#FFFBEB' }}>
                <div className="card-header">
                  <span className="card-title">🟡 Ждут проверки ({tasksSubmitted})</span>
                </div>
                <div className="card-body">
                  {tasks.filter(t => t.status === 'submitted').map(task => (
                    <div key={task.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                          Ученик: {studentMap[task.assigned_to]?.name || task.assigned_to?.slice(0, 8) + '...'}
                        </div>
                        {task.answer && (
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6, lineHeight: 1.5 }}>
                            💬 {task.answer}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setGradeTask(task)} style={BS.primary}>✓ Проверить</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Текущее задание для ученика */}
            {role === 'student' && tasksPending > 0 && (
              <div className="card" style={{ border: `1px solid ${school.color}30`, background: `${school.color}06` }}>
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
                      <button onClick={() => setSubmitTask(task)} style={BS.primary}>📤 Сдать задание</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── МОДУЛИ ── */}
        {activeTab === 'modules' && (
          <div>
            {role === 'teacher' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => setModuleModal('new')} style={BS.primary}>➕ Добавить модуль</button>
              </div>
            )}

            {loadingModules && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Загрузка модулей...</div>
            )}

            {!loadingModules && modules.length === 0 && (
              <div className="empty-state" style={{ padding: 60 }}>
                <div className="icon">📋</div>
                <p>{role === 'teacher' ? 'Модулей пока нет. Нажмите «Добавить модуль» чтобы создать первый.' : 'Преподаватель ещё не добавил модули.'}</p>
              </div>
            )}

            {modules.map(mod => {
              const isDone    = mod.number < currentModule;
              const isCurrent = mod.number === currentModule;

              return (
                <div key={mod.id} className="card" style={{
                  marginBottom: 10,
                  borderLeft: isCurrent ? `3px solid ${school.color}` : isDone ? '3px solid #16A34A' : '3px solid var(--border)',
                }}>
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Номер модуля */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? '#16A34A' : isCurrent ? school.color : 'var(--bg3)',
                      color: isDone || isCurrent ? '#fff' : 'var(--text3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                    }}>
                      {isDone ? '✓' : mod.number}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 500 }}>
                        Модуль {mod.number}: {mod.title}
                      </div>
                      {mod.description && (
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>
                          {mod.description}
                        </div>
                      )}
                      {mod.content && isCurrent && (
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, lineHeight: 1.6, borderLeft: `3px solid ${school.color}` }}>
                          {mod.content}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: isDone ? '#16A34A' : isCurrent ? school.color : 'var(--text3)', marginTop: 6 }}>
                        {isDone ? '✓ Завершён' : isCurrent ? '▶ Текущий модуль' : 'Предстоит'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {/* Кнопка «Начать/Завершить» для ученика */}
                      {role === 'student' && isCurrent && mod.number < (modules[modules.length - 1]?.number || 999) && (
                        <button
                          onClick={() => setStudentModule(mod.number + 1)}
                          style={BS.primary}>
                          Завершить →
                        </button>
                      )}
                      {role === 'student' && !isCurrent && !isDone && mod.number === currentModule + 1 && (
                        <button onClick={() => setStudentModule(mod.number)} style={BS.ghost}>Начать</button>
                      )}

                      {/* Кнопки редактирования для преподавателя */}
                      {role === 'teacher' && (
                        <>
                          <button onClick={() => setModuleModal(mod)} style={BS.ghost}>✏️</button>
                          <button onClick={() => deleteModule(mod.id)} style={{ ...BS.ghost, color: 'var(--red)', borderColor: 'var(--red)' }}>🗑</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ЗАДАНИЯ ── */}
        {activeTab === 'homework' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {role === 'teacher' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <button onClick={() => setShowCreateTask(true)} style={BS.primary}>📝 Создать задание</button>
              </div>
            )}

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
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{st.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>

                      {/* Показываем имя ученика для преподавателя */}
                      {role === 'teacher' && task.assigned_to && (
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                          Ученик: {studentMap[task.assigned_to]?.name || '—'}
                        </div>
                      )}

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
                        <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
                          ✅ Отзыв: {task.feedback}
                        </div>
                      )}
                      {task.grade && (
                        <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 3, fontWeight: 600 }}>
                          Оценка: {task.grade}/5 ⭐
                        </div>
                      )}
                    </div>

                    {/* Кнопки действий */}
                    {role === 'student' && task.status === 'pending' && (
                      <button onClick={() => setSubmitTask(task)} style={BS.primary}>Сдать</button>
                    )}
                    {role === 'teacher' && task.status === 'submitted' && (
                      <button onClick={() => setGradeTask(task)} style={BS.primary}>✓ Проверить</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── УЧЕНИКИ (преподаватель) ── */}
        {activeTab === 'students' && role === 'teacher' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ученики школы</span>
              <button onClick={loadStudents} style={BS.ghost}>🔄 Обновить</button>
            </div>
            <div className="card-body">
              {students.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 30 }}>Учеников пока нет</div>
              ) : students.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar avatar-sm" style={{ background: u.color || '#888' }}>{u.initials || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Модуль {u.current_module || 1} из {modules.length || totalModules}
                    </div>
                  </div>
                  <div style={{ width: 100 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.round(((u.current_module || 1) / (modules.length || totalModules)) * 100)}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', width: 32, textAlign: 'right' }}>
                    {Math.round(((u.current_module || 1) / (modules.length || totalModules)) * 100)}%
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
      {gradeTask && (
        <GradeModal
          task={gradeTask}
          studentName={studentMap[gradeTask.assigned_to]?.name}
          onClose={() => setGradeTask(null)}
          onGraded={() => { loadTasks(); setGradeTask(null); }}
        />
      )}
      {showCreateTask && (
        <CreateTaskModal
          schoolId={schoolId}
          modules={modules}
          onClose={() => setShowCreateTask(false)}
          onCreated={loadTasks}
        />
      )}
      {moduleModal && (
        <ModuleModal
          module={moduleModal === 'new' ? null : moduleModal}
          schoolId={schoolId}
          nextNumber={modules.length + 1}
          onClose={() => setModuleModal(null)}
          onSaved={loadModules}
        />
      )}
    </div>
  );
}

const BS = {
  primary: { padding: '7px 14px', borderRadius: 8, background: '#C9922A', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 },
  ghost:   { padding: '6px 12px', borderRadius: 8, background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
};
const MS = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: 'var(--bg-surface)', borderRadius: 14, width: 480, maxWidth: '92vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
  header:     { padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:      { fontSize: 15, fontWeight: 600 },
  close:      { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text3)', lineHeight: 1, padding: 0 },
  body:       { padding: '18px 20px', overflowY: 'auto', flex: 1 },
  footer:     { padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  field:      { marginBottom: 14 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 },
  inputStyle: { width: '100%', padding: '9px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  error:      { color: 'var(--red)', fontSize: 13, marginTop: 8, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 6 },
  btnCancel:  { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg-raised)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C9922A', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
};
