// ============================================================
// СПРАВОЧНИКИ ПРИЛОЖЕНИЯ
// ============================================================

export const CITIES = [
  { id: 'moscow',       name: 'Москва',             country: 'Россия',      flag: '🇷🇺' },
  { id: 'spb',           name: 'Санкт-Петербург',   country: 'Россия',     flag: '🇷🇺' },
  { id: 'novosibirsk',   name: 'Новосибирск',        country: 'Россия',     flag: '🇷🇺' },
  { id: 'vladimir',      name: 'Владимир',            country: 'Россия',     flag: '🇷🇺' },
  { id: 'minsk',         name: 'Минск',               country: 'Беларусь',   flag: '🇧🇾' },
  { id: 'chelyabinsk',   name: 'Челябинск',           country: 'Россия',     flag: '🇷🇺' },
  { id: 'krasnoyarsk',   name: 'Красноярск',          country: 'Россия',     flag: '🇷🇺' },
  { id: 'kazakhstan',    name: 'Казахстан',            country: 'Казахстан',  flag: '🇰🇿' },
  { id: 'tashkent',      name: 'Ташкент',              country: 'Узбекистан', flag: '🇺🇿' },
  { id: 'dubai',         name: 'Дубай',                country: 'ОАЭ',        flag: '🇦🇪' },
  { id: 'kaliningrad',   name: 'Калининград',          country: 'Россия',     flag: '🇷🇺' },
  { id: 'samara',        name: 'Самара',               country: 'Россия',     flag: '🇷🇺' },
  { id: 'togliatti',     name: 'Тольятти',             country: 'Россия',     flag: '🇷🇺' },
  { id: 'perm',          name: 'Пермь',                country: 'Россия',     flag: '🇷🇺' },
  { id: 'sochi',         name: 'Сочи',                 country: 'Россия',     flag: '🇷🇺' },
  { id: 'omsk',          name: 'Омск',                 country: 'Россия',     flag: '🇷🇺' },
  { id: 'tyumen',        name: 'Тюмень',               country: 'Россия',     flag: '🇷🇺' },
  { id: 'penza',         name: 'Пенза',                country: 'Россия',     flag: '🇷🇺' },
  { id: 'bryansk',       name: 'Брянск',               country: 'Россия',     flag: '🇷🇺' },
  { id: 'orel',          name: 'Орёл',                 country: 'Россия',     flag: '🇷🇺' },
  { id: 'blagoveshensk', name: 'Благовещенск',         country: 'Россия',     flag: '🇷🇺' },
  { id: 'bishkek',       name: 'Бишкек',               country: 'Кыргызстан', flag: '🇰🇬' },
  { id: 'kazan',         name: 'Казань',               country: 'Россия',     flag: '🇷🇺' },
  { id: 'bali',          name: 'Бали',                 country: 'Индонезия',  flag: '🇮🇩' },
  { id: 'thailand',      name: 'Таиланд',              country: 'Таиланд',    flag: '🇹🇭' },
  { id: 'tbilisi',       name: 'Тбилиси',              country: 'Грузия',     flag: '🇬🇪' },
  { id: 'ekaterinburg',  name: 'Екатеринбург',         country: 'Россия',     flag: '🇷🇺' },
  { id: 'nn',            name: 'Нижний Новгород',      country: 'Россия',     flag: '🇷🇺' },
  { id: 'rostov',        name: 'Ростов',               country: 'Россия',     flag: '🇷🇺' },
  { id: 'dagestan',      name: 'Дагестан',             country: 'Россия',     flag: '🇷🇺' },
  { id: 'krasnodar',     name: 'Краснодар',            country: 'Россия',     flag: '🇷🇺' },
  { id: 'istanbul',      name: 'Стамбул',              country: 'Турция',     flag: '🇹🇷' },
  { id: 'antalya',       name: 'Анталья',              country: 'Турция',     flag: '🇹🇷' },
  { id: 'volgograd',     name: 'Волгоград',            country: 'Россия',     flag: '🇷🇺' },
  { id: 'barnaul',       name: 'Барнаул',              country: 'Россия',     flag: '🇷🇺' },
  { id: 'ufa',           name: 'Уфа',                  country: 'Россия',     flag: '🇷🇺' },
  { id: 'irkutsk',       name: 'Иркутск',              country: 'Россия',     flag: '🇷🇺' },
  { id: 'kaluga',        name: 'Калуга',               country: 'Россия',     flag: '🇷🇺' },
];

export const SCHOOLS = [
  { id: 'negotiations',    name: 'Школа переговоров',               icon: '🤝', color: '#3B82F6', modules: 8  },
  { id: 'english',         name: 'Школа английского языка',         icon: '🇬🇧', color: '#60A5FA', modules: 12 },
  { id: 'nutrition',       name: 'Школа нутрициологии',             icon: '🥗',  color: '#34D399', modules: 6  },
  { id: 'speed_reading',   name: 'Школа скорочтения',               icon: '📚',  color: '#818CF8', modules: 5  },
  { id: 'style',           name: 'Школа стиля',                     icon: '👗',  color: '#F472B6', modules: 6  },
  { id: 'public_speaking', name: 'Школа публичных выступлений',     icon: '🎤',  color: '#F87171', modules: 8  },
  { id: 'management',      name: 'Школа управления',                icon: '📊',  color: '#FB923C', modules: 10 },
  { id: 'health',          name: 'Школа здоровья',                  icon: '💪',  color: '#22D3EE', modules: 6  },
  { id: 'b2b',             name: 'Школа больших сделок B2B',        icon: '🏢',  color: '#818CF8', modules: 8  },
  { id: 'parents_kids',    name: 'Школа родители-дети',             icon: '👨‍👧', color: '#FBBF24', modules: 6  },
  { id: 'acting',          name: 'Школа актёрского мастерства',     icon: '🎭',  color: '#A78BFA', modules: 6  },
  { id: 'vk_sales',        name: 'Школа продаж ВК',                 icon: '📱',  color: '#38BDF8', modules: 8  },
  { id: 'flexibility',     name: 'Школа гибкости ума и тела',       icon: '🧘',  color: '#34D399', modules: 6  },
  { id: 'wisdom_med',      name: 'Школа PRO Мудрое лекарство',      icon: '💊',  color: '#2DD4BF', modules: 6  },
  { id: 'ai',              name: 'Школа искусственного интеллекта', icon: '🤖',  color: '#818CF8', modules: 6  },
  { id: 'automation',      name: 'Школа выхода из автоматизма',     icon: '⚙️',  color: '#9CA3AF', modules: 5  },
  { id: 'content',         name: 'Контент который продаёт',         icon: '✍️',  color: '#F472B6', modules: 7  },
  { id: 'oratory',         name: 'Школа ораторского искусства',     icon: '🗣️',  color: '#FBBF24', modules: 7  },
];

// ── Роли пользователей ──────────────────────────────────────
// guest      — новый пользователь
// member     — участник (без школы)
// student    — ученик школы
// teacher    — преподаватель школы
// mentor     — наставник
// mentee     — наставляемый
// management — руководство (имеет должность position_id)
// admin      — глобальный администратор системы
// developer  — разработчик (панель тестирования)

// ── Должности руководства ───────────────────────────────────
// Устанавливаются Президентом города через CRM
// Каждый член руководства может ТАКЖЕ быть teacher или mentor
export const POSITIONS = [
  {
    id:          'president',
    name:        'Президент',
    level:       1,  // уровень иерархии (1 = высший)
    description: 'Главный руководитель города',
    permissions: [
      'manage_positions',   // единственная роль с правом назначать должности
      'manage_members',
      'manage_schools',
      'manage_mentors',
      'manage_events',
      'view_analytics',
      'send_announcements',
    ],
  },
  {
    id:          'vp',
    name:        'Вице-президент',
    level:       2,
    description: 'Заместитель президента',
    permissions: [
      'manage_members',
      'manage_schools',
      'manage_mentors',
      'manage_events',
      'view_analytics',
      'send_announcements',
    ],
  },
  {
    id:          'head_education',
    name:        'Руководитель образования',
    level:       3,
    description: 'Отвечает за все школы и обучение',
    permissions: [
      'manage_schools',
      'manage_mentors',
      'view_analytics',
    ],
  },
  {
    id:          'head_networking',
    name:        'Руководитель нетворкинга',
    level:       3,
    description: 'Организация нетворкинга и мероприятий',
    permissions: [
      'manage_events',
      'send_announcements',
    ],
  },
  {
    id:          'head_pr',
    name:        'Руководитель PR',
    level:       3,
    description: 'Связи с общественностью',
    permissions: [
      'send_announcements',
    ],
  },
  {
    id:          'coordinator',
    name:        'Координатор',
    level:       4,
    description: 'Координация участников',
    permissions: [
      'manage_members',
    ],
  },
  {
    id:          'curator',
    name:        'Куратор',
    level:       4,
    description: 'Куратор группы участников',
    permissions: [],
  },
];

export const POSITION_PERMISSIONS = {
  manage_positions:   'Назначать должности',
  manage_members:     'Управлять участниками',
  manage_schools:     'Управлять школами',
  manage_mentors:     'Управлять наставниками',
  manage_events:      'Создавать события',
  view_analytics:     'Просматривать аналитику',
  send_announcements: 'Отправлять анонсы',
};

// ── Каналы города ───────────────────────────────────────────
export const CITY_CHANNELS = [
  { id: 'news',        name: 'Новости и анонсы', icon: '📢', description: 'Официальные новости клуба',       readonly: true  },
  { id: 'main',        name: 'Основной чат',     icon: '💬', description: 'Общение участников'                               },
  { id: 'networking',  name: 'Нетворкинг',       icon: '🤝', description: 'Деловые знакомства'                               },
  { id: 'dobro',       name: 'ДОБРО',            icon: '❤️', description: 'Добрые дела и помощь'                              },
  { id: 'masterclass', name: 'Мастер-классы',    icon: '🎓', description: 'Анонсы мастер-классов'                             },
  { id: 'sport',       name: 'Спорт',            icon: '⚡', description: 'Спортивные активности'                             },
  { id: 'rules',       name: 'Правила Терры',    icon: '📋', description: 'Правила и ценности клуба',       readonly: true  },
  { id: 'kids',        name: 'Дети',             icon: '👶', description: 'Тема для родителей'                                },
];
