import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';

// ── Модалка: создать задание ────────────────────────────────
function CreateTaskModal({ menteeId, menteeName, onClose, onCreated }) {
  const { currentUser } = useApp();
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleCreate = async () => {
    if (!title.trim()) { setError('Введите название задания'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('tasks').insert({
      title:       title.trim(),
      description: desc.trim() || null,
      deadline:    deadline || null,
      created_by:  currentUser.id,
      assigned_to: menteeId,
      status:      'pending',
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onCreated();
    onClose();
  };

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.modal} onClick={e => e.stopPropagation()}>
        <div style={MS.header}>
          <span style={MS.title}>📝 Задание для {menteeName}</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>
          <div style={MS.field}>
            <label style={MS.label}>Название *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Что нужно сделать" style={MS.input} />
          </div>
          <div style={MS.field}>
            <label style={MS.label}>Описание</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Подробности..." rows={3} style={{ ...MS.input, resize: 'vertical' }} />
          </div>
          <div style={MS.field}>
            <label style={MS.label}>Дедлайн</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={MS.input} />
          </div>
          {error && <div style={MS.error}>{error}</div>}
        </div>
        <div style={MS.footer}>
          <button onClick={onClose} style={MS.btnCancel}>Отмена</button>
          <button onClick={handleCreate} disabled={saving} style={MS.btnPrimary}>
            {saving ? 'Создаю...' : '✅ Создать задание'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Модалка: сохранить заметку ──────────────────────────────
function NoteModal({ mentee, onClose, onSaved }) {
  const [note,   setNote]   = useState(mentee.mentor_note || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ mentor_note: note.trim() }).eq('id', mentee.id);
    onSaved(note.trim());
    onClose();
    setSaving(false);
  };

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.modal} onClick={e => e.stopPropagation()}>
        <div style={MS.header}>
          <span style={MS.title}>📝 Заметки о {mentee.name}</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Ваши заметки о прогрессе, целях, договорённостях..."
            rows={6}
            style={{ ...MS.input, resize: 'vertical', width: '100%' }}
          />
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

// ── Вид наставника ──────────────────────────────────────────
function MentorView() {
  const { currentUser, setActiveView } = useApp();
  const [mentees,      setMentees]      = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [tasks,        setTasks]        = useState([]);
  const [activeTab,    setActiveTab]    = useState('profile');
  const [loadingAll,   setLoadingAll]   = useState(true);
  const [createTask,   setCreateTask]   = useState(false);
  const [editNote,     setEditNote]     = useState(false);

  // Загрузить наставляемых
  const loadMentees = useCallback(async () => {
    setLoadingAll(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('mentor_id', currentUser.id)
      .eq('role', 'mentee');
    const list = data || [];
    setMentees(list);
    if (list.length > 0 && !selected) setSelected(list[0]);
    setLoadingAll(false);
  }, [currentUser.id]); // eslint-disable-line

  // Загрузить задания выбранного наставляемого
  const loadTasks = useCallback(async (menteeId) => {
    if (!menteeId) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', menteeId)
      .eq('created_by', currentUser.id)
      .order('created_at', { ascending: false });
    setTasks(data || []);
  }, [currentUser.id]);

  useEffect(() => { loadMentees(); }, [loadMentees]);
  useEffect(() => { if (selected) { loadTasks(selected.id); setActiveTab('profile'); } }, [selected, loadTasks]);

  const statusInfo = {
    done:      { icon: '✅', label: 'Проверено',             color: '#16A34A' },
    submitted: { icon: '🟡', label: 'Сдано, ждёт проверки', color: '#D97706' },
    pending:   { icon: '📝', label: 'Не сдано',              color: '#C9922A' },
    overdue:   { icon: '🔴', label: 'Просрочено',            color: '#DC2626' },
  };

  const handleGrade = async (taskId, grade) => {
    await supabase.from('tasks').update({ status: 'done', grade }).eq('id', taskId);
    loadTasks(selected.id);
  };

  if (loadingAll) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Загрузка...</div>;
  }

  if (mentees.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="icon">🌱</div>
        <p>У вас пока нет наставляемых.<br />Администратор назначит их вам.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Список наставляемых */}
      <div style={{ width: 220, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Мои наставляемые</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{mentees.length} чел.</span>
        </div>
        {mentees.map(m => (
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            style={{
              padding: '12px 16px', cursor: 'pointer',
              background: selected?.id === m.id ? 'rgba(201,146,42,0.09)' : 'transparent',
              borderBottom: '1px solid var(--border)',
              borderLeft: selected?.id === m.id ? '3px solid var(--gold)' : '3px solid transparent',
              transition: 'all 0.12s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar avatar-sm" style={{ background: m.color || '#888' }}>{m.initials || '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {tasks.filter(t => t.status === 'submitted').length > 0
                    ? <span style={{ color: '#D97706' }}>🟡 Ждут проверки</span>
                    : 'Активен'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Детали */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Шапка */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="avatar avatar-lg" style={{ background: selected.color || '#888' }}>{selected.initials || '?'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{selected.name}</div>
                {selected.bio && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{selected.bio}</div>}
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{selected.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setActiveView('chat')}
                  style={BS.ghost}>💬 Написать</button>
                <button
                  onClick={() => setCreateTask(true)}
                  style={BS.primary}>📝 Задание</button>
              </div>
            </div>
          </div>

          {/* Вкладки */}
          <div className="tabs" style={{ flexShrink: 0 }}>
            {[['profile','👤 Профиль'],['tasks','📋 Задания'],['notes','📝 Заметки']].map(([t, l]) => (
              <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{l}</div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

            {/* ПРОФИЛЬ */}
            {activeTab === 'profile' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card">
                  <div className="card-header"><span className="card-title">Контакты</span></div>
                  <div className="card-body">
                    {[
                      ['📧', 'Email', selected.email],
                      ['🌍', 'Город', selected.city_id],
                      ['🔄', 'Поток', selected.stream_number ? `Поток ${selected.stream_number}` : '—'],
                    ].map(([icon, label, val]) => (
                      <div key={label} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                        <span>{icon}</span>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
                          <div style={{ fontSize: 13 }}>{val || '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Статистика</span>
                  </div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      [tasks.length,                                        'Заданий выдано'],
                      [tasks.filter(t => t.status === 'done').length,      'Выполнено'],
                      [tasks.filter(t => t.status === 'submitted').length, 'На проверке'],
                      [tasks.filter(t => t.status === 'pending').length,   'В процессе'],
                    ].map(([v, l]) => (
                      <div key={l} style={{ textAlign: 'center', padding: 10, background: 'var(--bg2)', borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{v}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ЗАДАНИЯ */}
            {activeTab === 'tasks' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>Задания</h3>
                  <button onClick={() => setCreateTask(true)} style={BS.primary}>+ Новое задание</button>
                </div>
                {tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Заданий пока нет</div>
                ) : tasks.map(task => {
                  const st = statusInfo[task.status] || statusInfo.pending;
                  return (
                    <div key={task.id} className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${st.color}` }}>
                      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 18 }}>{st.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{st.label}{task.deadline ? ` · до ${new Date(task.deadline).toLocaleDateString('ru')}` : ''}</div>
                          {task.answer && (
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, padding: '6px 10px', background: 'var(--bg2)', borderRadius: 6 }}>
                              💬 {task.answer}
                            </div>
                          )}
                          {task.status === 'submitted' && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              {[5,4,3].map(g => (
                                <button key={g} onClick={() => handleGrade(task.id, g)} style={{ ...BS.ghost, padding: '4px 10px', fontSize: 11 }}>
                                  {g}⭐
                                </button>
                              ))}
                            </div>
                          )}
                          {task.grade && <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4, fontWeight: 600 }}>Оценка: {task.grade}/5 ⭐</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ЗАМЕТКИ */}
            {activeTab === 'notes' && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Личные заметки</span>
                  <button onClick={() => setEditNote(true)} style={BS.ghost}>✏️ Редактировать</button>
                </div>
                <div className="card-body">
                  {selected.mentor_note ? (
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.mentor_note}</p>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20, fontSize: 13 }}>
                      Заметок пока нет. Нажмите «Редактировать» чтобы добавить.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state"><div className="icon">👥</div><p>Выберите наставляемого</p></div>
      )}

      {/* Модалки */}
      {createTask && selected && (
        <CreateTaskModal
          menteeId={selected.id}
          menteeName={selected.name}
          onClose={() => setCreateTask(false)}
          onCreated={() => loadTasks(selected.id)}
        />
      )}
      {editNote && selected && (
        <NoteModal
          mentee={selected}
          onClose={() => setEditNote(false)}
          onSaved={note => {
            setSelected(prev => ({ ...prev, mentor_note: note }));
            setMentees(prev => prev.map(m => m.id === selected.id ? { ...m, mentor_note: note } : m));
          }}
        />
      )}
    </div>
  );
}

// ── Вид наставляемого ───────────────────────────────────────
function MenteeView() {
  const { currentUser } = useApp();
  const [mentor,   setMentor]   = useState(null);
  const [tasks,    setTasks]    = useState([]);
  const [groupMates, setGroupMates] = useState([]);
  const [submitTask, setSubmitTask] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      const mentorId = currentUser.mentor_id || currentUser.mentorId;
      if (!mentorId) { setLoading(false); return; }

      // Загружаем наставника
      const { data: mentorData } = await supabase
        .from('profiles').select('*').eq('id', mentorId).single();
      setMentor(mentorData);

      // Загружаем задания
      const { data: tasksData } = await supabase
        .from('tasks').select('*')
        .eq('assigned_to', currentUser.id)
        .order('created_at', { ascending: false });
      setTasks(tasksData || []);

      // Загружаем группу наставляемых
      const { data: group } = await supabase
        .from('profiles').select('*')
        .eq('mentor_id', mentorId)
        .eq('role', 'mentee')
        .neq('id', currentUser.id);
      setGroupMates(group || []);

      setLoading(false);
    };
    load();
  }, [currentUser]);

  const handleSubmit = async (task, answer) => {
    await supabase.from('tasks')
      .update({ status: 'submitted', answer })
      .eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'submitted', answer } : t));
    setSubmitTask(null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Загрузка...</div>;

  if (!mentor) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="icon">🌱</div>
        <p>Наставник ещё не назначен.<br />Обратитесь к администратору.</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* Карточка наставника */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Мой наставник</span></div>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="avatar avatar-lg" style={{ background: mentor.color || '#888' }}>{mentor.initials || '?'}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{mentor.name}</div>
            {mentor.bio && <div style={{ fontSize: 13, color: 'var(--text3)' }}>{mentor.bio}</div>}
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{mentor.email}</div>
          </div>
        </div>
      </div>

      {/* Активные задания */}
      {pendingTasks.length > 0 && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid #FDE68A', background: '#FFFBEB' }}>
          <div className="card-header"><span className="card-title">📝 Активные задания</span></div>
          <div className="card-body">
            {pendingTasks.map(task => (
              <div key={task.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                  {task.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{task.description}</div>}
                  {task.deadline && <div style={{ fontSize: 12, color: '#C9922A', marginTop: 3 }}>⏰ до {new Date(task.deadline).toLocaleDateString('ru')}</div>}
                </div>
                <button onClick={() => setSubmitTask(task)} style={BS.primary}>📤 Сдать</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Все задания */}
      {tasks.filter(t => t.status !== 'pending').length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">История заданий</span></div>
          <div className="card-body">
            {tasks.filter(t => t.status !== 'pending').map(task => (
              <div key={task.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{task.status === 'done' ? '✅' : '🟡'}</span>
                  <span style={{ flex: 1 }}>{task.title}</span>
                  {task.grade && <span style={{ color: '#16A34A', fontWeight: 600 }}>{task.grade}/5⭐</span>}
                </div>
                {task.feedback && <div style={{ fontSize: 12, color: '#16A34A', marginTop: 3, marginLeft: 22 }}>💬 {task.feedback}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Группа */}
      {groupMates.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">👥 Группа наставничества</span></div>
          <div className="card-body">
            {groupMates.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="avatar avatar-sm" style={{ background: m.color || '#888' }}>{m.initials || '?'}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                  {m.bio && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.bio}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модалка сдачи */}
      {submitTask && (
        <SubmitMenteeModal
          task={submitTask}
          onClose={() => setSubmitTask(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ── Модалка сдачи задания для наставляемого ─────────────────
function SubmitMenteeModal({ task, onClose, onSubmit }) {
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.modal} onClick={e => e.stopPropagation()}>
        <div style={MS.header}>
          <span style={MS.title}>📤 Сдать задание</span>
          <button onClick={onClose} style={MS.close}>×</button>
        </div>
        <div style={MS.body}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>{task.title}</div>
          <label style={MS.label}>Ваш ответ</label>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5} placeholder="Опишите что сделали..." style={{ ...MS.input, width: '100%', resize: 'vertical' }} />
        </div>
        <div style={MS.footer}>
          <button onClick={onClose} style={MS.btnCancel}>Отмена</button>
          <button onClick={async () => { setSaving(true); await onSubmit(task, answer); setSaving(false); }} disabled={saving || !answer.trim()} style={MS.btnPrimary}>
            {saving ? 'Отправляю...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Главный экспорт ──────────────────────────────────────────
export default function MentoringCabinet() {
  const { currentUser } = useApp();
  const role = currentUser?.role;

  if (role === 'mentor') return <MentorView />;
  if (role === 'mentee') return <MenteeView />;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Наставничество</h2>
      <p style={{ fontSize: 14, color: 'var(--text3)' }}>
        Этот раздел доступен наставникам и наставляемым.
      </p>
    </div>
  );
}

const BS = {
  primary: { padding: '7px 14px', borderRadius: 8, background: '#C9922A', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 },
  ghost:   { padding: '6px 12px', borderRadius: 8, background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
};
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
