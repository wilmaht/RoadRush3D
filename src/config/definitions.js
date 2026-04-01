export const BODY_DEFS = [
    { id:'sedan',     name:'Седан',        price:0,    color:0x888888 },
    { id:'pickup',    name:'Пикап',        price:300,  color:0x8D6E63 },
    { id:'sports',    name:'Спорткар',     price:800,  color:0xE53935 },
    { id:'suv',       name:'Внедорожник',  price:500,  color:0x546E7A },
    { id:'ambulance', name:'Скорая',       price:1000, color:0xEEEEEE },
    { id:'firetruck', name:'Пожарная',     price:1200, color:0xCC0000 },
    { id:'police2',   name:'Полицейская',  price:1500, color:0xEEEEEE },
];

export const COLOR_DEFS = [
    { hex:0x1565C0, name:'Синий',      price:0    },
    { hex:0xD32F2F, name:'Красный',    price:100  },
    { hex:0x2E7D32, name:'Зелёный',    price:100  },
    { hex:0x212121, name:'Чёрный',     price:200  },
    { hex:0xEEEEEE, name:'Белый',      price:150  },
    { hex:0xE65100, name:'Оранжевый',  price:150  },
    { hex:0x7B1FA2, name:'Фиолетовый', price:300  },
    { hex:0xFFD700, name:'Золотой',    price:1000 },
];

export const UPGRADE_DEFS = [
    { id:'engine',   icon:'⚡', name:'Двигатель',      costs:[50,150,400,800,1500] },
    { id:'brakes',   icon:'🛑', name:'Тормоза',        costs:[30,100,250,500,1000] },
    { id:'nos',      icon:'🔥', name:'Нитро',          costs:[40,120,300,600,1200] },
    { id:'handling', icon:'🔄', name:'Манёвренность',  costs:[30,80,200,450,900]   },
    { id:'tank',     icon:'⛽', name:'Бак',            costs:[40,100,250,500,1000] },
    { id:'magnet',   icon:'🧲', name:'Магнит',         costs:[200,500,1000,2000]   },
];

export const BIOMES = [
    { name:'Шоссе',   sky:0x81D4FA, fog:0x81D4FA, ground:0x00E676, ambient:0xffffff, dir:0xfffaee, dirI:1.2, fogN:200, fogF:600, env:'highway' },
    { name:'Город',   sky:0x87CEEB, fog:0x87CEEB, ground:0x6B7A83, ambient:0xffffff, dir:0xfff0dd, dirI:1.4, fogN:100, fogF:600, env:'city'    },
    { name:'Каньон',  sky:0xFFCC80, fog:0xFFB74D, ground:0xD84315, ambient:0xffe0b2, dir:0xffcc80, dirI:1.5, fogN:150, fogF:600, env:'canyon'  },
    { name:'Тоннель', sky:0x111118, fog:0x0a0a12, ground:0x333338, ambient:0x222233, dir:0x4466aa, dirI:0.2, fogN:40,  fogF:150, env:'tunnel'  },
    { name:'Ночь',    sky:0x0a0a2e, fog:0x0a0a20, ground:0x151530, ambient:0x334466, dir:0x6688bb, dirI:0.5, fogN:100, fogF:400, env:'night'   },
    { name:'Закат',   sky:0xdd5533, fog:0xdd7755, ground:0x557744, ambient:0x995533, dir:0xffaa55, dirI:1.1, fogN:180, fogF:550, env:'sunset'  },
];

export const MISSIONS_POOL = [
    { id:'collect_coins_30',   i18n:'m_coins30',  check: s => s.coins >= 30,          reward: 50  },
    { id:'collect_coins_50',   i18n:'m_coins50',  check: s => s.coins >= 50,          reward: 100 },
    { id:'dodge_15',           i18n:'m_dodge15',  check: s => s.dodged >= 15,         reward: 75  },
    { id:'dodge_25',           i18n:'m_dodge25',  check: s => s.dodged >= 25,         reward: 120 },
    { id:'score_2000',         i18n:'m_score2000',check: s => s.score >= 2000,        reward: 80  },
    { id:'score_5000',         i18n:'m_score5000',check: s => s.score >= 5000,        reward: 150 },
    { id:'dist_1500',          i18n:'m_dist1500', check: s => s.dist >= 1500/0.4,     reward: 60  },
    { id:'dist_3000',          i18n:'m_dist3000', check: s => s.dist >= 3000/0.4,     reward: 100 },
    { id:'use_nos_3',          i18n:'m_nos3',     check: s => s.nosUseCount >= 3,     reward: 40  },
    { id:'brake_dodge',        i18n:'m_brake',    check: s => s.brakeDodges >= 5,     reward: 60  },
    { id:'win_duel',           i18n:'m_duel',     check: s => s.duelWon === true,     reward: 100 },
    { id:'survive_police_60',  i18n:'m_police60', check: s => s.policeTimer > 65,     reward: 120 },
];

export const WEATHERS = ['clear', 'rain', 'snow', 'fog'];
export const WEATHER_ICONS = { clear: '☀️', rain: '🌧️', snow: '❄️', fog: '🌫️' };
