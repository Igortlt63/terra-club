// ============================================================
// БАЗА ДАННЫХ ПРИЛОЖЕНИЯ (имитация, для замены на реальный backend)
// ============================================================

export const CITIES = [
  { id: 'moscow', name: 'Москва', country: 'Россия', flag: '🇷🇺' },
  { id: 'almaty', name: 'Алматы', country: 'Казахстан', flag: '🇰🇿' },
  { id: 'minsk', name: 'Минск', country: 'Беларусь', flag: '🇧🇾' },
  { id: 'tashkent', name: 'Ташкент', country: 'Узбекистан', flag: '🇺🇿' },
  { id: 'baku', name: 'Баку', country: 'Азербайджан', flag: '🇦🇿' },
  { id: 'astana', name: 'Астана', country: 'Казахстан', flag: '🇰🇿' },
];

export const SCHOOLS = [
  { id: 'negotiations', name: 'Школа переговоров', icon: '🤝', color: '#C9922A', modules: 8 },
  { id: 'english', name: 'Школа английского языка', icon: '🇬🇧', color: '#3B82F6', modules: 12 },
  { id: 'nutrition', name: 'Школа нутрициологии', icon: '🥗', color: '#22C55E', modules: 6 },
  { id: 'speed_reading', name: 'Школа скорочтения', icon: '📚', color: '#8B5CF6', modules: 5 },
  { id: 'style', name: 'Школа стиля', icon: '👗', color: '#EC4899', modules: 6 },
  { id: 'public_speaking', name: 'Школа публичных выступлений', icon: '🎤', color: '#EF4444', modules: 8 },
  { id: 'management', name: 'Школа управления', icon: '📊', color: '#F97316', modules: 10 },
  { id: 'health', name: 'Школа здоровья', icon: '💪', color: '#06B6D4', modules: 6 },
  { id: 'b2b', name: 'Школа больших сделок B2B', icon: '🏢', color: '#6366F1', modules: 8 },
  { id: 'parents_kids', name: 'Школа родители-дети', icon: '👨‍👧', color: '#F59E0B', modules: 6 },
  { id: 'acting', name: 'Школа актёрского мастерства', icon: '🎭', color: '#A855F7', modules: 6 },
  { id: 'vk_sales', name: 'Школа продаж ВК', icon: '📱', color: '#0EA5E9', modules: 8 },
  { id: 'flexibility', name: 'Школа гибкости ума и тела', icon: '🧘', color: '#10B981', modules: 6 },
  { id: 'wisdom_med', name: 'Школа PRO Мудрое лекарство', icon: '💊', color: '#14B8A6', modules: 6 },
  { id: 'ai', name: 'Школа искусственного интеллекта', icon: '🤖', color: '#6366F1', modules: 6 },
  { id: 'automation', name: 'Школа выхода из автоматизма', icon: '⚙️', color: '#78716C', modules: 5 },
  { id: 'content', name: 'Контент который продаёт', icon: '✍️', color: '#EC4899', modules: 7 },
  { id: 'oratory', name: 'Школа ораторского искусства', icon: '🗣️', color: '#D97706', modules: 7 },
];

// РОЛИ ПОЛЬЗОВАТЕЛЕЙ
// guest   — новый пользователь (только общие группы города)
// member  — участник (общие группы города)
// student — ученик школы (общие группы + кабинет школы)
// teacher — преподаватель (кабинет школы + управление)
// mentee  — наставляемый (группа наставника)
// mentor  — наставник (управление своей группой наставляемых)
// admin   — руководство (всё)

export const DEMO_USERS = [
  {
    id: 'u1', name: 'Алексей Новиков', initials: 'АН',
    role: 'admin', cityId: 'moscow',
    password: 'admin123',
    email: 'admin@terra.club',
    color: '#C9922A',
    bio: 'Основатель Бизнес Клуб Терра'
  },
  {
    id: 'u2', name: 'Александра Варго', initials: 'АВ',
    role: 'teacher', cityId: 'moscow',
    schoolId: 'negotiations',
    password: 'teacher123',
    email: 'vargo@terra.club',
    color: '#3B82F6',
    bio: 'Преподаватель школы переговоров'
  },
  {
    id: 'u3', name: 'Мария Карпова', initials: 'МК',
    role: 'student', cityId: 'moscow',
    schoolId: 'negotiations', streamNumber: 12, currentModule: 4,
    password: 'student123',
    email: 'maria@terra.club',
    color: '#8B5CF6',
    bio: 'Предприниматель, основатель интернет-магазина'
  },
  {
    id: 'u4', name: 'Дмитрий Панков', initials: 'ДП',
    role: 'mentor', cityId: 'almaty',
    password: 'mentor123',
    email: 'dmitry@terra.club',
    color: '#22C55E',
    bio: 'Бизнес-наставник, 10 лет опыта'
  },
  {
    id: 'u5', name: 'Анна Кириллова', initials: 'АК',
    role: 'mentee', cityId: 'almaty',
    mentorId: 'u4', streamNumber: 12,
    password: 'mentee123',
    email: 'anna@terra.club',
    color: '#EF4444',
    bio: 'Развиваю своё кафе'
  },
  {
    id: 'u6', name: 'Иван Волков', initials: 'ИВ',
    role: 'guest', cityId: 'moscow',
    password: 'guest123',
    email: 'ivan@terra.club',
    color: '#64748B',
    bio: 'Новый участник'
  },
];

// ОБЩИЕ ГРУППЫ ГОРОДА (как в Telegram)
export const CITY_CHANNELS = [
  { id: 'news', name: 'Новости и анонсы', icon: '📢', description: 'Официальные новости клуба', readonly: true },
  { id: 'main', name: 'Основной чат', icon: '💬', description: 'Общение участников города' },
  { id: 'networking', name: 'Нетворкинг', icon: '🤝', description: 'Деловые знакомства и партнёрства' },
  { id: 'dobro', name: 'ДОБРО', icon: '❤️', description: 'Добрые дела и взаимопомощь' },
  { id: 'masterclass', name: 'Мастер-классы', icon: '🎓', description: 'Анонсы и записи мастер-классов' },
  { id: 'sport', name: 'Спорт', icon: '⚡', description: 'Спортивные активности участников' },
  { id: 'rules', name: 'Правила Терры', icon: '📋', description: 'Правила и ценности клуба', readonly: true },
  { id: 'kids', name: 'Дети', icon: '👶', description: 'Тема для родителей' },
];

// СООБЩЕНИЯ ПО КАНАЛАМ
export const MESSAGES = {
  moscow_news: [
    { id: 'm1', userId: 'u1', text: '🎉 Поток 12 стартует в следующий понедельник! Все участники получили приглашения на почту. Встречаемся офлайн в пятницу в 19:00 по адресу Садовая 24.', time: '10:32', date: '2025-01-15' },
    { id: 'm2', userId: 'u1', text: '📚 Школа искусственного интеллекта открывает дополнительный набор. Осталось 5 мест. Успейте записаться до среды!', time: '14:15', date: '2025-01-15' },
    { id: 'm3', userId: 'u1', text: '🏆 Поздравляем участников потока 11 с успешным завершением! Вы молодцы!', time: '09:00', date: '2025-01-14' },
  ],
  moscow_main: [
    { id: 'm4', userId: 'u3', text: 'Всем привет! Кто идёт на пятничную встречу? Можем скоординироваться и вместе добраться.', time: '11:20', date: '2025-01-15' },
    { id: 'm5', userId: 'u2', text: 'Мария, я тоже буду! Можем встретиться у метро Садовая в 18:45', time: '11:35', date: '2025-01-15' },
    { id: 'm6', userId: 'u3', text: 'Отлично, договорились! 👍', time: '11:37', date: '2025-01-15' },
  ],
  moscow_networking: [
    { id: 'm7', userId: 'u3', text: '🔍 Ищу партнёра для совместного проекта в сфере онлайн-образования. Если есть идеи — пишите в личку!', time: '15:00', date: '2025-01-14' },
  ],
  moscow_dobro: [
    { id: 'm8', userId: 'u2', text: '❤️ Собираем вещи для детского дома. Принимаем в офисе до пятницы. Детская одежда, книги, игрушки.', time: '10:00', date: '2025-01-13' },
  ],
  moscow_sport: [
    { id: 'm9', userId: 'u1', text: '🏃 Утренние пробежки по Парку Горького — каждую субботу в 08:00. Все желающие присоединяйтесь!', time: '20:00', date: '2025-01-12' },
  ],
  // Кабинет школы переговоров
  school_negotiations_general: [
    { id: 'sm1', userId: 'u2', text: '👋 Добро пожаловать в Школу переговоров! Я ваш преподаватель Елена. Здесь мы будем обсуждать материалы и практиковаться.', time: '09:00', date: '2025-01-10' },
    { id: 'sm2', userId: 'u3', text: 'Елена, здравствуйте! Очень рада быть здесь. Уже посмотрела первый модуль — очень интересно!', time: '12:30', date: '2025-01-10' },
    { id: 'sm3', userId: 'u2', text: '📌 Домашнее задание к модулю 4: проведите переговоры с реальным партнёром и запишите результат. Дедлайн — воскресенье.', time: '18:00', date: '2025-01-14' },
  ],
  school_negotiations_homework: [
    { id: 'sh1', userId: 'u3', text: '📝 Сдаю ДЗ по модулю 3. Провела переговоры с поставщиком. Удалось снизить цену на 15%! Применила технику BATNA.', time: '21:00', date: '2025-01-13' },
    { id: 'sh2', userId: 'u2', text: 'Мария, отлично! 15% — прекрасный результат. Хорошо применили концепцию. Оценка: 5/5 ⭐', time: '22:30', date: '2025-01-13' },
  ],
  // Группа наставника
  mentor_group_general: [
    { id: 'mg1', userId: 'u4', text: '👋 Приветствую всю нашу группу! Я Дмитрий, ваш наставник. Встречаемся каждую среду в 19:00 онлайн. Жду всех!', time: '10:00', date: '2025-01-10' },
    { id: 'mg2', userId: 'u5', text: 'Дмитрий, здравствуйте! Анна, очень рада знакомству. Уже подготовила описание своего проекта.', time: '11:00', date: '2025-01-10' },
    { id: 'mg3', userId: 'u4', text: '📋 На эту неделю задание: опишите свою главную бизнес-цель на ближайшие 3 месяца. Максимум одна страница.', time: '19:30', date: '2025-01-13' },
  ],
};

export const MEDIA_FILES = [
  { id: 'v1', schoolId: 'negotiations', type: 'video', title: 'Техники активного слушания', module: 4, duration: '24:38', size: '340 MB', icon: '🎥' },
  { id: 'v2', schoolId: 'negotiations', type: 'video', title: 'Метод BATNA. Теория и практика', module: 3, duration: '31:15', size: '420 MB', icon: '🎥' },
  { id: 'v3', schoolId: 'negotiations', type: 'doc', title: 'Рабочая тетрадь. Модуль 4', module: 4, size: '2.4 MB', icon: '📄' },
  { id: 'v4', schoolId: 'negotiations', type: 'audio', title: 'Практика: разбор переговоров', module: 4, duration: '18:00', size: '25 MB', icon: '🎵' },
  { id: 'v5', schoolId: 'ai', type: 'video', title: 'ChatGPT для бизнеса: введение', module: 2, duration: '41:12', size: '560 MB', icon: '🎥' },
  { id: 'v6', schoolId: 'ai', type: 'doc', title: 'Промпт-инжиниринг: шпаргалка', module: 2, size: '1.1 MB', icon: '📄' },
  { id: 'v7', schoolId: 'vk_sales', type: 'video', title: 'Контент-воронка ВКонтакте', module: 6, duration: '33:05', size: '450 MB', icon: '🎥' },
];

export const STREAMS = [
  { id: 's12', number: 12, startDate: '2025-01-13', endDate: '2025-04-13', status: 'active' },
  { id: 's11', number: 11, startDate: '2024-09-01', endDate: '2024-12-01', status: 'completed' },
];
