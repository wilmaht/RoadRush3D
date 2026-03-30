import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// ======================== MOBILE DETECTION ========================
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

// ======================== AUDIO ========================
class GameAudio {
    constructor() {
        this.ctx = null; this.mg = null; this.sg = null; this.on = false;
        this.beat = 0; this.next = 0; this.tid = null; this.bpm = 150;
        this.engOsc = null; this.engGain = null;
        this.sirenOsc = null; this.sirenGain = null; this.sirenOn = false;
        this.trackIdx = 0; this.trackBars = 0; this.muted = false;
    }
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.mg = this.ctx.createGain(); this.mg.gain.value = 0.10; this.mg.connect(this.ctx.destination);
        this.sg = this.ctx.createGain(); this.sg.gain.value = 0.3; this.sg.connect(this.ctx.destination);
        this.engGain = this.ctx.createGain(); this.engGain.gain.value = 0.04; this.engGain.connect(this.ctx.destination);
        this.engOsc = this.ctx.createOscillator(); this.engOsc.type = 'sawtooth'; this.engOsc.frequency.value = 60;
        const filt = this.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 120;
        this.engOsc.connect(filt); filt.connect(this.engGain); this.engOsc.start();
    }
    setEngine(speed) {
        if (this.engOsc) {
            this.engOsc.frequency.value = 40 + speed * 1.2;
            this.engGain.gain.value = 0.02 + speed * 0.0003;
        }
    }
    startSiren() {
        if (this.sirenOn) return;
        this.init();
        this.sirenOn = true;
        this.sirenGain = this.ctx.createGain();
        this.sirenGain.gain.value = 0.06;
        this.sirenGain.connect(this.ctx.destination);
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc.type = 'sine';
        this.sirenOsc.frequency.value = 600;
        this.sirenOsc.connect(this.sirenGain);
        this.sirenOsc.start();
        this._sirenLoop();
    }
    _sirenLoop() {
        if (!this.sirenOn || !this.sirenOsc) return;
        const t = this.ctx.currentTime;
        this.sirenOsc.frequency.setValueAtTime(600, t);
        this.sirenOsc.frequency.linearRampToValueAtTime(900, t + 0.3);
        this.sirenOsc.frequency.linearRampToValueAtTime(600, t + 0.6);
        setTimeout(() => this._sirenLoop(), 600);
    }
    stopSiren() {
        this.sirenOn = false;
        if (this.sirenOsc) {
            try { this.sirenOsc.stop(); } catch(e) {}
            this.sirenOsc = null;
        }
        if (this.sirenGain) {
            this.sirenGain.disconnect();
            this.sirenGain = null;
        }
    }
    setSirenVolume(vol) { if (this.sirenGain) this.sirenGain.gain.value = Math.max(0, Math.min(0.15, vol)); }
    startMusic() { if (this.on) return; this.init(); this.on = true; this.beat = 0; this.next = this.ctx.currentTime + 0.05; this._s(); }
    stopMusic() { this.on = false; if (this.tid) clearTimeout(this.tid); this.stopSiren(); }
    stopEngine() { if (this.engGain) this.engGain.gain.value = 0; }
    startEngine() { if (this.engGain && !this.muted) this.engGain.gain.value = 0.02; }
    mute() {
        this.muted = true;
        if (this.ctx) this.ctx.suspend();
    }
    unmute() {
        this.muted = false;
        if (this.ctx) this.ctx.resume();
    }
    toggleMute() {
        if (this.muted) this.unmute(); else this.mute();
        return this.muted;
    }
    _s() { if (!this.on) return; while (this.next < this.ctx.currentTime + 0.1) { this._b(this.next); this.next += 60/this.bpm/2; this.beat++; } this.tid = setTimeout(() => this._s(), 20); }
    _b(t) {
        const b = this.beat % 32;
        // Смена трека каждые 4 бара (128 ударов)
        this.trackBars++;
        if (this.trackBars >= 128) { this.trackBars = 0; this.trackIdx = (this.trackIdx + 1) % 4; }
        // Общий ритм
        if (b%8===0||b%8===4) this._kick(t);
        if (b%2===0) this._hh(t);
        if (b%8===2||b%8===6) this._snare(t);
        // 4 разных трека — разные басовые и мелодии
        const tracks = [
            {bass:[55,55,73.4,73.4,82.4,82.4,73.4,73.4, 49,49,65.4,65.4,82.4,82.4,98,98, 55,55,73.4,73.4,98,98,82.4,82.4, 49,49,55,55,58.3,58.3,65.4,65.4],
             mel:[330,0,392,0,440,0,392,0, 523,0,440,0,392,0,330,0, 294,0,330,0,392,0,440,0, 523,0,587,0,523,0,440,0]},
            {bass:[65.4,65.4,82.4,82.4,98,98,82.4,82.4, 73.4,73.4,98,98,110,110,98,98, 65.4,65.4,73.4,73.4,82.4,82.4,98,98, 55,55,65.4,65.4,73.4,73.4,82.4,82.4],
             mel:[440,0,523,0,587,0,523,0, 659,0,587,0,523,0,440,0, 392,0,440,0,523,0,587,0, 659,0,784,0,659,0,587,0]},
            {bass:[49,49,55,55,65.4,65.4,73.4,73.4, 82.4,82.4,73.4,73.4,65.4,65.4,55,55, 49,49,65.4,65.4,82.4,82.4,98,98, 82.4,82.4,73.4,73.4,65.4,65.4,55,55],
             mel:[523,0,587,0,659,0,784,0, 659,0,587,0,523,0,440,0, 349,0,392,0,440,0,523,0, 587,0,659,0,587,0,523,0]},
            {bass:[73.4,73.4,98,98,110,110,98,98, 82.4,82.4,110,110,130.8,130.8,110,110, 73.4,73.4,82.4,82.4,98,98,110,110, 65.4,65.4,73.4,73.4,82.4,82.4,98,98],
             mel:[262,0,330,0,392,0,440,0, 523,0,440,0,330,0,262,0, 220,0,262,0,330,0,440,0, 523,0,659,0,523,0,440,0]}
        ];
        const trk = tracks[this.trackIdx];
        if(b%2===0) this._bass(t,trk.bass[b]);
        if(b%4===0&&trk.mel[b]>0) this._mel(t,trk.mel[b]);
    }
    _kick(t){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(25,t+0.1);g.gain.setValueAtTime(0.7,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);o.connect(g);g.connect(this.mg);o.start(t);o.stop(t+0.12);}
    _snare(t){const n=this.ctx.sampleRate*0.07,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(0.3,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.07);const f=this.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1500;s.connect(f);f.connect(g);g.connect(this.mg);s.start(t);s.stop(t+0.07);}
    _hh(t){const n=this.ctx.sampleRate*0.025,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.02);const f=this.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=7000;s.connect(f);f.connect(g);g.connect(this.mg);s.start(t);s.stop(t+0.025);}
    _bass(t,freq){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.15);const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=180;o.connect(f);f.connect(g);g.connect(this.mg);o.start(t);o.stop(t+0.15);}
    _mel(t,freq){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(0.05,t);g.gain.setValueAtTime(0.05,t+0.08);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.connect(g);g.connect(this.mg);o.start(t);o.stop(t+0.2);}
    coin(){this.init();const t=this.ctx.currentTime;[880,1320,1760].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.2,t+i*0.04);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.04+0.12);o.connect(g);g.connect(this.sg);o.start(t+i*0.04);o.stop(t+i*0.04+0.12);});}
    nearMiss(){this.init();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.08);g.gain.setValueAtTime(0.15,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.connect(g);g.connect(this.sg);o.start(t);o.stop(t+0.1);}
    crash(){this.init();const t=this.ctx.currentTime;const n=this.ctx.sampleRate*0.6,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(n*0.15));const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);s.connect(g);g.connect(this.sg);s.start(t);const o=this.ctx.createOscillator(),g2=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(15,t+0.4);g2.gain.setValueAtTime(0.6,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.4);o.connect(g2);g2.connect(this.sg);o.start(t);o.stop(t+0.4);}
    lane(){this.init();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(500,t+0.04);g.gain.setValueAtTime(0.08,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.05);o.connect(g);g.connect(this.sg);o.start(t);o.stop(t+0.05);}
    biome(){this.init();const t=this.ctx.currentTime;[523,659,784].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.1,t+i*0.06);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.06+0.18);o.connect(g);g.connect(this.sg);o.start(t+i*0.06);o.stop(t+i*0.06+0.18);});}
    speedUp(){this.init();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(800,t+0.15);g.gain.setValueAtTime(0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.connect(g);g.connect(this.sg);o.start(t);o.stop(t+0.2);}
    victory(){this.init();const t=this.ctx.currentTime;[523,659,784,1047].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.15,t+i*0.1);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.1+0.3);o.connect(g);g.connect(this.sg);o.start(t+i*0.1);o.stop(t+i*0.1+0.3);});}
    defeat(){this.init();const t=this.ctx.currentTime;[440,330,262].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.value=f;g.gain.setValueAtTime(0.12,t+i*0.15);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.15+0.25);o.connect(g);g.connect(this.sg);o.start(t+i*0.15);o.stop(t+i*0.15+0.25);});}
}
const sfx = new GameAudio();

// ======================== GARAGE DATA ========================
const BODY_DEFS = [
    { id:'sedan', name:'Седан', price:0, color:0x888888 },
    { id:'pickup', name:'Пикап', price:300, color:0x8D6E63 },
    { id:'sports', name:'Спорткар', price:800, color:0xE53935 },
    { id:'suv', name:'Внедорожник', price:500, color:0x546E7A },
    { id:'ambulance', name:'Скорая', price:1000, color:0xEEEEEE },
    { id:'firetruck', name:'Пожарная', price:1200, color:0xCC0000 },
    { id:'police2', name:'Полицейская', price:1500, color:0xEEEEEE },
];
const COLOR_DEFS = [
    { hex:0x1565C0, name:'Синий', price:0 },
    { hex:0xD32F2F, name:'Красный', price:100 },
    { hex:0x2E7D32, name:'Зелёный', price:100 },
    { hex:0x212121, name:'Чёрный', price:200 },
    { hex:0xEEEEEE, name:'Белый', price:150 },
    { hex:0xE65100, name:'Оранжевый', price:150 },
    { hex:0x7B1FA2, name:'Фиолетовый', price:300 },
    { hex:0xFFD700, name:'Золотой', price:1000 },
];
const UPGRADE_DEFS = [
    { id:'engine', icon:'⚡', name:'Двигатель', costs:[50,150,400,800,1500] },
    { id:'brakes', icon:'🛑', name:'Тормоза', costs:[30,100,250,500,1000] },
    { id:'nos', icon:'🔥', name:'Нитро', costs:[40,120,300,600,1200] },
    { id:'handling', icon:'🔄', name:'Манёвренность', costs:[30,80,200,450,900] },
    { id:'tank', icon:'⛽', name:'Бак', costs:[40,100,250,500,1000] },
    { id:'magnet', icon:'🧲', name:'Магнит', costs:[200,500,1000,2000] },
];

// Persistent garage state
const garage = {
    wallet: parseInt(localStorage.getItem('rr3d_wallet') || '0'),
    ownedBodies: JSON.parse(localStorage.getItem('rr3d_owned_bodies') || '["sedan"]'),
    selectedBody: localStorage.getItem('rr3d_selected_body') || 'sedan',
    ownedColors: JSON.parse(localStorage.getItem('rr3d_owned_colors') || '[0]'), // indices
    selectedColor: parseInt(localStorage.getItem('rr3d_selected_color') || '0'), // index into COLOR_DEFS
    upgrades: JSON.parse(localStorage.getItem('rr3d_upgrades') || '{"engine":1,"brakes":1,"nos":1,"handling":1,"tank":1,"magnet":1}'),
};
function saveGarage() {
    localStorage.setItem('rr3d_wallet', garage.wallet);
    localStorage.setItem('rr3d_owned_bodies', JSON.stringify(garage.ownedBodies));
    localStorage.setItem('rr3d_selected_body', garage.selectedBody);
    localStorage.setItem('rr3d_owned_colors', JSON.stringify(garage.ownedColors));
    localStorage.setItem('rr3d_selected_color', garage.selectedColor);
    localStorage.setItem('rr3d_upgrades', JSON.stringify(garage.upgrades));
}
// Ensure defaults are owned
if (!garage.ownedBodies.includes('sedan')) garage.ownedBodies.push('sedan');
if (!garage.ownedColors.includes(0)) garage.ownedColors.push(0);
if (!garage.upgrades.magnet) garage.upgrades.magnet = 1;
saveGarage();

// ======================== BIOMES ========================
const BIOMES = [
    { name:'Шоссе', sky:0x4a90d9, fog:0x8ab8e8, ground:0x4CAF50, ambient:0x99aacc, dir:0xfff5e0, dirI:1.3, fogN:200, fogF:600, env:'highway' },
    { name:'Город', sky:0x5577aa, fog:0x8899bb, ground:0x666666, ambient:0x8899aa, dir:0xfff0dd, dirI:1.0, fogN:150, fogF:500, env:'city' },
    { name:'Каньон', sky:0xdd8844, fog:0xddaa77, ground:0xC49535, ambient:0xaa8866, dir:0xffddaa, dirI:1.5, fogN:200, fogF:600, env:'canyon' },
    { name:'Тоннель', sky:0x111118, fog:0x0a0a12, ground:0x333338, ambient:0x222233, dir:0x4466aa, dirI:0.2, fogN:40, fogF:150, env:'tunnel' },
    { name:'Ночь', sky:0x0a0a2e, fog:0x0a0a20, ground:0x151530, ambient:0x334466, dir:0x6688bb, dirI:0.5, fogN:100, fogF:400, env:'night' },
    { name:'Закат', sky:0xdd5533, fog:0xdd7755, ground:0x557744, ambient:0x995533, dir:0xffaa55, dirI:1.1, fogN:180, fogF:550, env:'sunset' },
];

// ======================== DAILY MISSIONS ========================
const MISSIONS_POOL = [
    { id:'collect_coins_30', desc:'Собери 30 монет за гонку', check: s => s.coins >= 30, reward: 50 },
    { id:'collect_coins_50', desc:'Собери 50 монет за гонку', check: s => s.coins >= 50, reward: 100 },
    { id:'dodge_15', desc:'Обгони 15 машин вплотную', check: s => s.dodged >= 15, reward: 75 },
    { id:'dodge_25', desc:'Обгони 25 машин вплотную', check: s => s.dodged >= 25, reward: 120 },
    { id:'score_2000', desc:'Набери 2000 очков', check: s => s.score >= 2000, reward: 80 },
    { id:'score_5000', desc:'Набери 5000 очков', check: s => s.score >= 5000, reward: 150 },
    { id:'dist_1500', desc:'Проедь 1500м без аварий', check: s => s.dist >= 1500/0.4, reward: 60 },
    { id:'dist_3000', desc:'Проедь 3000м', check: s => s.dist >= 3000/0.4, reward: 100 },
    { id:'use_nos_3', desc:'Используй NOS 3 раза', check: s => s.nosUseCount >= 3, reward: 40 },
    { id:'brake_dodge', desc:'Затормози и уклонись 5 раз', check: s => s.brakeDodges >= 5, reward: 60 },
    { id:'win_duel', desc:'Выиграй дуэль', check: s => s.duelWon === true, reward: 100 },
    { id:'survive_police_60', desc:'Продержись 60с от полиции', check: s => s.policeTimer > 65, reward: 120 },
];

function getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function loadDailyMissions() {
    const stored = localStorage.getItem('rr3d_missions');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.date === getTodayStr() && Array.isArray(data.missions) && data.missions.length === 3) {
                return data;
            }
        } catch(e) {}
    }
    // Generate new missions
    const shuffled = MISSIONS_POOL.slice().sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3).map(m => ({
        id: m.id, completed: false, claimed: false
    }));
    const data = { date: getTodayStr(), missions: picked };
    localStorage.setItem('rr3d_missions', JSON.stringify(data));
    return data;
}

function saveMissions(data) {
    localStorage.setItem('rr3d_missions', JSON.stringify(data));
}

function checkMissions(gameState) {
    const data = loadDailyMissions();
    let changed = false;
    data.missions.forEach(m => {
        if (m.completed || m.claimed) return;
        const def = MISSIONS_POOL.find(p => p.id === m.id);
        if (def && def.check(gameState)) {
            m.completed = true;
            changed = true;
        }
    });
    if (changed) saveMissions(data);
}

function renderMissions() {
    const list = document.getElementById('missions-list');
    if (!list) return;
    const data = loadDailyMissions();
    list.innerHTML = '';
    data.missions.forEach((m, idx) => {
        const def = MISSIONS_POOL.find(p => p.id === m.id);
        if (!def) return;
        const card = document.createElement('div');
        let cls = 'mission-card';
        if (m.claimed) cls += ' claimed';
        else if (m.completed) cls += ' done';
        card.className = cls;

        let statusText = '';
        let statusCls = 'mission-status ';
        if (m.claimed) { statusText = '\u2713 Получено'; statusCls += 'claimed-text'; }
        else if (m.completed) { statusText = '\u2191 Забрать!'; statusCls += 'completed'; }
        else { statusText = 'В процессе...'; statusCls += 'pending'; }

        card.innerHTML = '<div class="mission-desc">' + def.desc + '</div>' +
            '<div class="mission-reward">\uD83E\uDE99 ' + def.reward + '</div>' +
            '<div class="' + statusCls + '">' + statusText + '</div>';

        if (m.completed && !m.claimed) {
            card.style.cursor = 'pointer';
            card.onclick = () => {
                m.claimed = true;
                garage.wallet += def.reward;
                saveGarage();
                saveMissions(data);
                renderMissions();
                updateWalletDisplays();
            };
        }
        list.appendChild(card);
    });
}

// ======================== WEATHER SYSTEM ========================
const WEATHERS = ['clear', 'rain', 'snow', 'fog'];
const WEATHER_ICONS = { clear: '\u2600\uFE0F', rain: '\uD83C\uDF27\uFE0F', snow: '\u2744\uFE0F', fog: '\uD83C\uDF2B\uFE0F' };

class WeatherParticles {
    constructor(sc) {
        this.scene = sc;
        this.type = 'clear';
        this.rainPool = [];
        this.snowPool = [];
        // Create rain pool (thin lines)
        const rainMat = new THREE.MeshBasicMaterial({color:0xaabbdd, transparent:true, opacity:0.4});
        for (let i = 0; i < (isMobile ? 20 : 80); i++) {
            const geo = new THREE.BoxGeometry(0.02, 0.8, 0.02);
            const mesh = new THREE.Mesh(geo, rainMat);
            mesh.visible = false;
            this.rainPool.push({ mesh, vy: -25 - Math.random()*10, active: false });
            sc.add(mesh);
        }
        // Create snow pool (small spheres)
        const snowMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.7});
        for (let i = 0; i < (isMobile ? 15 : 60); i++) {
            const geo = new THREE.SphereGeometry(0.06, 4, 3);
            const mesh = new THREE.Mesh(geo, snowMat);
            mesh.visible = false;
            this.snowPool.push({ mesh, vy: -3 - Math.random()*2, vx: (Math.random()-0.5)*2, active: false });
            sc.add(mesh);
        }
    }

    setWeather(type) {
        this.type = type;
        // Hide all particles first
        this.rainPool.forEach(p => { p.mesh.visible = false; p.active = false; });
        this.snowPool.forEach(p => { p.mesh.visible = false; p.active = false; });
    }

    update(dt, playerPos) {
        if (this.type === 'rain') {
            this.rainPool.forEach(p => {
                if (!p.active) {
                    // Respawn
                    p.mesh.position.set(
                        playerPos.x + (Math.random()-0.5)*20,
                        playerPos.y + 8 + Math.random()*5,
                        playerPos.z + Math.random()*30
                    );
                    p.mesh.visible = true;
                    p.active = true;
                }
                p.mesh.position.y += p.vy * dt;
                p.mesh.position.z += dt * 2; // slight forward drift
                if (p.mesh.position.y < playerPos.y - 1 || p.mesh.position.z < playerPos.z - 10) {
                    p.active = false; // will respawn next frame
                }
            });
        } else if (this.type === 'snow') {
            this.snowPool.forEach(p => {
                if (!p.active) {
                    p.mesh.position.set(
                        playerPos.x + (Math.random()-0.5)*20,
                        playerPos.y + 6 + Math.random()*5,
                        playerPos.z + Math.random()*25
                    );
                    p.mesh.visible = true;
                    p.active = true;
                    p.vx = (Math.random()-0.5)*2;
                }
                p.mesh.position.y += p.vy * dt;
                p.mesh.position.x += p.vx * dt;
                p.mesh.position.z += dt * 1.5;
                if (p.mesh.position.y < playerPos.y - 1 || p.mesh.position.z < playerPos.z - 10) {
                    p.active = false;
                }
            });
        }
        // rain and snow are hidden in setWeather for clear/fog
    }

    dispose() {
        this.rainPool.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); });
        this.snowPool.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); });
    }
}

// ======================== DUEL WIN STREAK ========================
function loadDuelStreak() {
    return parseInt(localStorage.getItem('rr3d_duel_streak') || '0');
}
function saveDuelStreak(val) {
    localStorage.setItem('rr3d_duel_streak', String(val));
}

// ======================== 3D MODELS ========================
const M = c => new THREE.MeshStandardMaterial({ color:c, flatShading:true });
const ME = (c,e=0.5) => new THREE.MeshStandardMaterial({color:c,flatShading:true,emissive:c,emissiveIntensity:e});

function buildCar(color, isPlayer=false) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.5), M(color));
    body.position.y = 0.5; g.add(body);
    // Cabin - tapered
    const cabGeo = new THREE.BufferGeometry();
    const w=0.85, h=0.55, l1=1.8, l2=1.2;
    const verts = new Float32Array([
        -w,0,-l1, w,0,-l1, w,0,l1, -w,0,l1,
        -w+0.1,h,-l2, w-0.1,h,-l2, w-0.1,h,l2-0.3, -w+0.1,h,l2-0.3,
    ]);
    const idx = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cabGeo.setAttribute('position', new THREE.BufferAttribute(verts,3));
    cabGeo.setIndex(idx);
    cabGeo.computeVertexNormals();
    const cab = new THREE.Mesh(cabGeo, M(new THREE.Color(color).multiplyScalar(1.1)));
    cab.position.y = 0.75; g.add(cab);
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5), gMat);
    ws.position.set(0,1.05,0.9); ws.rotation.x=-0.3; g.add(ws);
    const rs = new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.45), gMat);
    rs.position.set(0,1.0,-1.0); rs.rotation.x=0.2; rs.rotation.y=Math.PI; g.add(rs);
    // Wheels
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.3,0.12,8,12), M(0x1a1a1a));
        tire.rotation.y = Math.PI/2;
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.15,8), M(0xcccccc));
        rim.rotation.z = Math.PI/2;
        wg.add(tire); wg.add(rim);
        wg.position.set(x, 0.3, z);
        return wg;
    };
    g.add(wheelShape(-1.0, 1.3)); g.add(wheelShape(1.0, 1.3));
    g.add(wheelShape(-1.0, -1.3)); g.add(wheelShape(1.0, -1.3));
    // Lights
    if (isPlayer) {
        // Rear brake lights (red) - we name them so we can brighten on brake
        [[-0.65,0.6,-2.28],[0.65,0.6,-2.28]].forEach((p,i) => {
            const brakeLight = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.06), ME(0xff0000,0.8));
            brakeLight.position.set(p[0],p[1],p[2]);
            brakeLight.name = 'brakeLight' + i;
            g.add(brakeLight);
        });
        // Front headlights
        [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.5));
            hl.position.set(p[0],p[1],p[2]); g.add(hl);
        });
    } else {
        // Front headlights (yellow) — ярче чтобы были видны ночью
        [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,1.2));
            hl.position.set(p[0],p[1],p[2]); g.add(hl);
        });
        // Rear red
        [[-0.65,0.6,-2.28],[0.65,0.6,-2.28]].forEach(p => {
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.06), ME(0xff2200,0.6));
            tl.position.set(p[0],p[1],p[2]); g.add(tl);
        });
    }
    // Shadow
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.8), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildTruck() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.4,2.2,5.5).translate(0,1.4,-0.3), M(0x546E7A)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.3,1.3,2.0).translate(0,0.95,2.8), M(0x37474F)));
    const gm = new THREE.MeshStandardMaterial({color:0x80CBC4,transparent:true,opacity:0.5,flatShading:true});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.9).translate(0,1.4,3.82), gm));
    const wm = M(0x1a1a1a);
    [[-1.2,0.38,2.0],[1.2,0.38,2.0],[-1.2,0.38,-1.5],[1.2,0.38,-1.5],[-1.2,0.38,-2.8],[1.2,0.38,-2.8]].forEach(p => {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.35,0.14,8,10), wm);
        t.rotation.y=Math.PI/2; t.position.set(p[0],p[1],p[2]); g.add(t);
    });
    [[-0.8,0.8,3.82],[0.8,0.8,3.82]].forEach(p => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.25,0.06),ME(0xffffaa,0.7));
        hl.position.set(p[0],p[1],p[2]); g.add(hl);
    });
    // Rear red lights
    [[-0.8,0.8,-3.05],[0.8,0.8,-3.05]].forEach(p => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.15,0.06),ME(0xff2200,0.5));
        tl.position.set(p[0],p[1],p[2]); g.add(tl);
    });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.8,6.0), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildPoliceCar() {
    const g = new THREE.Group();
    // White body with blue stripe
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.5), M(0xEEEEEE));
    body.position.y = 0.5; g.add(body);
    // Blue stripe along the side
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 4.5), M(0x1565C0));
    stripe.position.y = 0.55; g.add(stripe);
    // Cabin
    const cabGeo = new THREE.BufferGeometry();
    const w=0.85, h=0.55, l1=1.8, l2=1.2;
    const verts = new Float32Array([
        -w,0,-l1, w,0,-l1, w,0,l1, -w,0,l1,
        -w+0.1,h,-l2, w-0.1,h,-l2, w-0.1,h,l2-0.3, -w+0.1,h,l2-0.3,
    ]);
    const idx = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cabGeo.setAttribute('position', new THREE.BufferAttribute(verts,3));
    cabGeo.setIndex(idx); cabGeo.computeVertexNormals();
    const cab = new THREE.Mesh(cabGeo, M(0xCCCCCC));
    cab.position.y = 0.75; g.add(cab);
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5), gMat).translateY(1.05).translateZ(0.9));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.45), gMat).translateY(1.0).translateZ(-1.0));
    // Lightbar on roof
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), M(0x222222));
    barBase.position.set(0, 1.35, 0); g.add(barBase);
    // Red light (left)
    const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0xff0000, 1.5));
    redLight.position.set(-0.35, 1.45, 0); redLight.name = 'policeRed'; g.add(redLight);
    // Blue light (right)
    const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0x0044ff, 1.5));
    blueLight.position.set(0.35, 1.45, 0); blueLight.name = 'policeBlue'; g.add(blueLight);
    // Point lights for the lightbar (desktop only)
    if (!isMobile) {
    const redPL = new THREE.PointLight(0xff0000, 2, 15);
    redPL.position.set(-0.35, 1.5, 0); redPL.name = 'policeRedPL'; g.add(redPL);
    const bluePL = new THREE.PointLight(0x0044ff, 2, 15);
    bluePL.position.set(0.35, 1.5, 0); bluePL.name = 'policeBluePL'; g.add(bluePL);
    }
    // Wheels
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.3,0.12,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.15,8), M(0xcccccc)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.3, z); return wg;
    };
    g.add(wheelShape(-1.0, 1.3)); g.add(wheelShape(1.0, 1.3));
    g.add(wheelShape(-1.0, -1.3)); g.add(wheelShape(1.0, -1.3));
    // Headlights
    [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.9)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
    });
    // Shadow
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.8), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildRivalCar() {
    const g = new THREE.Group();
    // Lower, wider sporty body - orange/red
    const bodyColor = 0xFF5722;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 4.8), M(bodyColor));
    body.position.y = 0.45; g.add(body);
    // Lower cabin (sporty)
    const cabGeo = new THREE.BufferGeometry();
    const w=0.9, h=0.45, l1=1.6, l2=1.0;
    const verts = new Float32Array([
        -w,0,-l1, w,0,-l1, w,0,l1, -w,0,l1,
        -w+0.15,h,-l2, w-0.15,h,-l2, w-0.15,h,l2-0.4, -w+0.15,h,l2-0.4,
    ]);
    const idx = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cabGeo.setAttribute('position', new THREE.BufferAttribute(verts,3));
    cabGeo.setIndex(idx); cabGeo.computeVertexNormals();
    const cab = new THREE.Mesh(cabGeo, M(0xE64A19));
    cab.position.y = 0.68; g.add(cab);
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.4), gMat).translateY(0.95).translateZ(0.8));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.35), gMat).translateY(0.9).translateZ(-0.9));
    // Wheels
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.3,0.12,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.15,8), M(0xFFD700)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.3, z); return wg;
    };
    g.add(wheelShape(-1.1, 1.4)); g.add(wheelShape(1.1, 1.4));
    g.add(wheelShape(-1.1, -1.4)); g.add(wheelShape(1.1, -1.4));
    // Headlights
    [[-0.8,0.5,2.42],[0.8,0.5,2.42]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.32,0.14,0.06), ME(0xffffaa,0.9)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
    });
    // Rear lights
    [[-0.8,0.5,-2.42],[0.8,0.5,-2.42]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
    });
    // Shadow
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.4,5.0), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

// ======================== PLAYER CAR BUILDERS ========================
function buildSedan(color, isPlayer=false) {
    return buildCar(color, isPlayer);
}

function buildPickup(color, isPlayer=false) {
    const g = new THREE.Group();
    // Longer body, higher
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 5.0), M(color));
    body.position.y = 0.55; g.add(body);
    // Cabin (front half)
    const cabGeo = new THREE.BufferGeometry();
    const w=0.85, h=0.55, l1=1.2, l2=0.8;
    const verts = new Float32Array([
        -w,0,-l1, w,0,-l1, w,0,l1, -w,0,l1,
        -w+0.1,h,-l2, w-0.1,h,-l2, w-0.1,h,l2-0.2, -w+0.1,h,l2-0.2,
    ]);
    const idx = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cabGeo.setAttribute('position', new THREE.BufferAttribute(verts,3));
    cabGeo.setIndex(idx); cabGeo.computeVertexNormals();
    const cab = new THREE.Mesh(cabGeo, M(new THREE.Color(color).multiplyScalar(1.1)));
    cab.position.set(0, 0.8, 0.8); g.add(cab);
    // Open bed (rear)
    const bedSide = M(new THREE.Color(color).multiplyScalar(0.85));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 0.08).translate(0,0.55,-2.0), bedSide));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 2.2).translate(-1.0,0.55,-0.9), bedSide));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 2.2).translate(1.0,0.55,-0.9), bedSide));
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5), gMat).translateY(1.1).translateZ(1.5));
    // Wheels (bigger, higher)
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.35,0.14,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.17,8), M(0xcccccc)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.35, z); return wg;
    };
    g.add(wheelShape(-1.05, 1.5)); g.add(wheelShape(1.05, 1.5));
    g.add(wheelShape(-1.05, -1.5)); g.add(wheelShape(1.05, -1.5));
    // Lights
    if (isPlayer) {
        [[-0.65,0.65,-2.52],[0.65,0.65,-2.52]].forEach((p,i) => {
            const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.06), ME(0xff0000,0.8));
            bl.position.set(p[0],p[1],p[2]); bl.name = 'brakeLight' + i; g.add(bl);
        });
        [[-0.7,0.65,2.52],[0.7,0.65,2.52]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.5)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    } else {
        [[-0.7,0.65,2.52],[0.7,0.65,2.52]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,1.2)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
        [[-0.65,0.65,-2.52],[0.65,0.65,-2.52]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.3,5.2), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildSportsCar(color, isPlayer=false) {
    const g = new THREE.Group();
    // Lower, wider body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 4.8), M(color));
    body.position.y = 0.4; g.add(body);
    // Low cabin
    const cabGeo = new THREE.BufferGeometry();
    const w=0.9, h=0.4, l1=1.5, l2=1.0;
    const verts = new Float32Array([
        -w,0,-l1, w,0,-l1, w,0,l1, -w,0,l1,
        -w+0.15,h,-l2, w-0.15,h,-l2, w-0.15,h,l2-0.4, -w+0.15,h,l2-0.4,
    ]);
    const idx = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cabGeo.setAttribute('position', new THREE.BufferAttribute(verts,3));
    cabGeo.setIndex(idx); cabGeo.computeVertexNormals();
    const cab = new THREE.Mesh(cabGeo, M(new THREE.Color(color).multiplyScalar(1.05)));
    cab.position.y = 0.6; g.add(cab);
    // Rear spoiler
    const spoilerColor = new THREE.Color(color).multiplyScalar(0.7);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.3).translate(0,1.0,-2.0), M(spoilerColor)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.15).translate(-0.8,0.85,-2.0), M(spoilerColor)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.15).translate(0.8,0.85,-2.0), M(spoilerColor)));
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.4), gMat).translateY(0.85).translateZ(0.7));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.35), gMat).translateY(0.8).translateZ(-0.9));
    // Wheels
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.3,0.14,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.18,8), M(0xDDDDDD)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.3, z); return wg;
    };
    g.add(wheelShape(-1.15, 1.4)); g.add(wheelShape(1.15, 1.4));
    g.add(wheelShape(-1.15, -1.4)); g.add(wheelShape(1.15, -1.4));
    if (isPlayer) {
        [[-0.8,0.5,-2.42],[0.8,0.5,-2.42]].forEach((p,i) => {
            const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.12,0.06), ME(0xff0000,0.8));
            bl.position.set(p[0],p[1],p[2]); bl.name = 'brakeLight' + i; g.add(bl);
        });
        [[-0.8,0.5,2.42],[0.8,0.5,2.42]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.32,0.14,0.06), ME(0xffffaa,0.5)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    } else {
        [[-0.8,0.5,2.42],[0.8,0.5,2.42]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.32,0.14,0.06), ME(0xffffaa,1.2)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
        [[-0.8,0.5,-2.42],[0.8,0.5,-2.42]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.5,5.0), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildSUV(color, isPlayer=false) {
    const g = new THREE.Group();
    // Tall boxy body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4.8), M(color));
    body.position.y = 0.7; g.add(body);
    // Tall cabin
    const cabGeo = new THREE.BufferGeometry();
    const w=0.95, h=0.7, l1=2.0, l2=1.4;
    const verts = new Float32Array([
        -w,0,-l1, w,0,-l1, w,0,l1, -w,0,l1,
        -w+0.08,h,-l2, w-0.08,h,-l2, w-0.08,h,l2-0.3, -w+0.08,h,l2-0.3,
    ]);
    const idx = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cabGeo.setAttribute('position', new THREE.BufferAttribute(verts,3));
    cabGeo.setIndex(idx); cabGeo.computeVertexNormals();
    const cab = new THREE.Mesh(cabGeo, M(new THREE.Color(color).multiplyScalar(1.05)));
    cab.position.y = 1.05; g.add(cab);
    // Roof rack
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 2.4).translate(0,1.78,0), M(0x444444)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.4).translate(-0.75,1.82,0), M(0x444444)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.4).translate(0.75,1.82,0), M(0x444444)));
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.6), gMat).translateY(1.4).translateZ(1.3));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.55), gMat).translateY(1.35).translateZ(-1.2));
    // Bigger wheels
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.38,0.16,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.18,8), M(0xaaaaaa)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.38, z); return wg;
    };
    g.add(wheelShape(-1.1, 1.5)); g.add(wheelShape(1.1, 1.5));
    g.add(wheelShape(-1.1, -1.5)); g.add(wheelShape(1.1, -1.5));
    if (isPlayer) {
        [[-0.7,0.8,-2.42],[0.7,0.8,-2.42]].forEach((p,i) => {
            const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.06), ME(0xff0000,0.8));
            bl.position.set(p[0],p[1],p[2]); bl.name = 'brakeLight' + i; g.add(bl);
        });
        [[-0.7,0.8,2.42],[0.7,0.8,2.42]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.5)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    } else {
        [[-0.7,0.8,2.42],[0.7,0.8,2.42]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,1.2)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
        [[-0.7,0.8,-2.42],[0.7,0.8,-2.42]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.4,5.0), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildAmbulance(color, isPlayer=false) {
    const g = new THREE.Group();
    // Van-like body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.4, 5.0), M(color));
    body.position.y = 1.0; g.add(body);
    // Cabin front
    const cabMat = M(new THREE.Color(color).multiplyScalar(0.95));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 1.2).translate(0,0.75,2.5), cabMat));
    // Red cross on sides
    const crossMat = ME(0xff0000, 0.6);
    [1.06, -1.06].forEach(x => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.15).translate(x,1.2,0), crossMat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.6).translate(x,1.2,0), crossMat));
    });
    // Lightbar on roof (red/white)
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.4).translate(0,1.74,0.5), M(0x333333)));
    const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.25), ME(0xff0000, 1.2));
    sirenRed.position.set(-0.3, 1.82, 0.5); sirenRed.name = 'sirenRed'; g.add(sirenRed);
    const sirenWhite = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.25), ME(0xffffff, 1.2));
    sirenWhite.position.set(0.3, 1.82, 0.5); sirenWhite.name = 'sirenWhite'; g.add(sirenWhite);
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.7), gMat).translateY(1.15).translateZ(3.12));
    // Wheels
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.32,0.13,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.16,8), M(0xcccccc)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.32, z); return wg;
    };
    g.add(wheelShape(-1.05, 1.6)); g.add(wheelShape(1.05, 1.6));
    g.add(wheelShape(-1.05, -1.6)); g.add(wheelShape(1.05, -1.6));
    if (isPlayer) {
        [[-0.65,0.8,-2.52],[0.65,0.8,-2.52]].forEach((p,i) => {
            const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.06), ME(0xff0000,0.8));
            bl.position.set(p[0],p[1],p[2]); bl.name = 'brakeLight' + i; g.add(bl);
        });
        [[-0.7,0.8,3.12],[0.7,0.8,3.12]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.5)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    } else {
        [[-0.7,0.8,3.12],[0.7,0.8,3.12]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,1.2)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
        [[-0.65,0.8,-2.52],[0.65,0.8,-2.52]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.3,5.2), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildFireTruck(color, isPlayer=false) {
    const g = new THREE.Group();
    // Long red truck body
    const bodyColor = 0xCC0000;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 5.5), M(bodyColor));
    body.position.y = 0.9; g.add(body);
    // Cabin front
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.5).translate(0,0.95,2.5), M(0xBB0000)));
    // Yellow stripes
    const stripeMat = M(0xFFD600);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.08, 5.5).translate(0,0.55,0), stripeMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.08, 5.5).translate(0,1.25,0), stripeMat));
    // Ladder on top
    const ladderMat = M(0xBBBBBB);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 4.0).translate(-0.4,1.48,-0.3), ladderMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 4.0).translate(0.4,1.48,-0.3), ladderMat));
    for (let z = -2.0; z < 2.0; z += 0.5) {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 0.04).translate(0,1.5,z), ladderMat));
    }
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.8), gMat).translateY(1.2).translateZ(3.27));
    // Wheels (6 wheels)
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.35,0.14,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.16,8), M(0xcccccc)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.35, z); return wg;
    };
    g.add(wheelShape(-1.1, 2.0)); g.add(wheelShape(1.1, 2.0));
    g.add(wheelShape(-1.1, -0.8)); g.add(wheelShape(1.1, -0.8));
    g.add(wheelShape(-1.1, -2.2)); g.add(wheelShape(1.1, -2.2));
    if (isPlayer) {
        [[-0.7,0.7,-2.78],[0.7,0.7,-2.78]].forEach((p,i) => {
            const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.06), ME(0xff0000,0.8));
            bl.position.set(p[0],p[1],p[2]); bl.name = 'brakeLight' + i; g.add(bl);
        });
        [[-0.8,0.9,3.27],[0.8,0.9,3.27]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.2,0.06), ME(0xffffaa,0.5)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    } else {
        [[-0.8,0.9,3.27],[0.8,0.9,3.27]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.2,0.06), ME(0xffffaa,1.2)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
        [[-0.7,0.7,-2.78],[0.7,0.7,-2.78]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.4,5.8), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

function buildPoliceCar2(color, isPlayer=false) {
    const g = new THREE.Group();
    // White body with blue stripe
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.5), M(0xEEEEEE));
    body.position.y = 0.5; g.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 4.5), M(0x1565C0));
    stripe.position.y = 0.55; g.add(stripe);
    // Cabin
    const cabGeo = new THREE.BufferGeometry();
    const w=0.85, h=0.55, l1=1.8, l2=1.2;
    const verts = new Float32Array([
        -w,0,-l1, w,0,-l1, w,0,l1, -w,0,l1,
        -w+0.1,h,-l2, w-0.1,h,-l2, w-0.1,h,l2-0.3, -w+0.1,h,l2-0.3,
    ]);
    const idx = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cabGeo.setAttribute('position', new THREE.BufferAttribute(verts,3));
    cabGeo.setIndex(idx); cabGeo.computeVertexNormals();
    const cab = new THREE.Mesh(cabGeo, M(0xCCCCCC));
    cab.position.y = 0.75; g.add(cab);
    // Glass
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5), gMat).translateY(1.05).translateZ(0.9));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.45), gMat).translateY(1.0).translateZ(-1.0));
    // Lightbar on roof (red/blue emissive meshes, NO PointLights for player)
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), M(0x222222)).translateY(1.35));
    const redL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0xff0000, 1.5));
    redL.position.set(-0.35, 1.45, 0); redL.name = 'playerPoliceRed'; g.add(redL);
    const blueL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0x0044ff, 1.5));
    blueL.position.set(0.35, 1.45, 0); blueL.name = 'playerPoliceBlue'; g.add(blueL);
    // Wheels
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.3,0.12,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.15,8), M(0xcccccc)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.3, z); return wg;
    };
    g.add(wheelShape(-1.0, 1.3)); g.add(wheelShape(1.0, 1.3));
    g.add(wheelShape(-1.0, -1.3)); g.add(wheelShape(1.0, -1.3));
    if (isPlayer) {
        [[-0.65,0.6,-2.28],[0.65,0.6,-2.28]].forEach((p,i) => {
            const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.06), ME(0xff0000,0.8));
            bl.position.set(p[0],p[1],p[2]); bl.name = 'brakeLight' + i; g.add(bl);
        });
        [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.5)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    } else {
        [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,1.2)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
        [[-0.65,0.6,-2.28],[0.65,0.6,-2.28]].forEach(p => {
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
        });
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.8), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

const BODY_BUILDERS = {
    sedan: buildSedan,
    pickup: buildPickup,
    sports: buildSportsCar,
    suv: buildSUV,
    ambulance: buildAmbulance,
    firetruck: buildFireTruck,
    police2: buildPoliceCar2,
};

const BODY_PREVIEW_COLORS = {
    sedan: '#1565C0',
    pickup: '#8D6E63',
    sports: '#E53935',
    suv: '#546E7A',
    ambulance: '#EEEEEE',
    firetruck: '#CC0000',
    police2: '#EEEEEE',
};

function buildPlayerCar() {
    const bodyId = garage.selectedBody;
    const colorIdx = garage.selectedColor;
    const colorHex = COLOR_DEFS[colorIdx].hex;
    const builder = BODY_BUILDERS[bodyId] || buildSedan;
    return builder(colorHex, true);
}

function makeCoin3D() {
    const g = new THREE.Group();
    const coinMat = new THREE.MeshStandardMaterial({color:0xFFD740,metalness:0.95,roughness:0.05,flatShading:true,emissive:0xFFA000,emissiveIntensity:0.5});
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.08,14), coinMat);
    g.add(disk);
    const rimMat = new THREE.MeshStandardMaterial({color:0xFFAB00,metalness:0.9,roughness:0.1,flatShading:true,emissive:0xFF8F00,emissiveIntensity:0.3});
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.38,0.05,8,14), rimMat));
    const ringMat = new THREE.MeshBasicMaterial({color:0xFFD740,transparent:true,opacity:0.2,side:THREE.DoubleSide});
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5,0.65,16), ringMat);
    ring.name = 'coinRing'; g.add(ring);
    if (!isMobile) { const pl = new THREE.PointLight(0xFFD740, 1, 8); pl.position.y = 0.3; g.add(pl); }
    return g;
}

function makeFuelCanister() {
    const g = new THREE.Group();
    // Канистра — зелёный цилиндр с ручкой
    const bodyMat = ME(0x4CAF50, 0.6);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.3,0.8,8), bodyMat));
    // Крышка
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.15,6).translate(0,0.47,0), ME(0x2E7D32,0.4)));
    // Ручка
    const handleMat = M(0x333333);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.12,0.03,6,8).translate(0,0.55,0), handleMat));
    // Метка ⛽
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.15,0.15,0.02).translate(0,0,0.31), ME(0xFFFFFF,0.5)));
    // Зелёное свечение
    const glowMat = new THREE.MeshBasicMaterial({color:0x4CAF50,transparent:true,opacity:0.15,side:THREE.DoubleSide});
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4,0.6,12), glowMat);
    ring.name = 'fuelRing'; g.add(ring);
    if (!isMobile) g.add(new THREE.PointLight(0x4CAF50, 1.5, 10));
    return g;
}

function makeSpeedBoost() {
    const g = new THREE.Group();
    const bodyMat = ME(0x00B8D4, 1.0);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,0.9,8), bodyMat));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.2,0.4,8).translate(0,0.65,0), ME(0x00E5FF,1.0)));
    const flameMat = new THREE.MeshBasicMaterial({color:0x40C4FF,transparent:true,opacity:0.7});
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.18,0.5,6).rotateX(Math.PI).translate(0,-0.7,0), flameMat));
    const glowMat = new THREE.MeshBasicMaterial({color:0x00E5FF,transparent:true,opacity:0.15,side:THREE.DoubleSide});
    const glow1 = new THREE.Mesh(new THREE.RingGeometry(0.4,0.7,12), glowMat);
    glow1.name = 'boostRing1'; g.add(glow1);
    const glow2 = new THREE.Mesh(new THREE.RingGeometry(0.3,0.55,12), glowMat);
    glow2.name = 'boostRing2'; glow2.position.y=0.3; g.add(glow2);
    if (!isMobile) g.add(new THREE.PointLight(0x00E5FF, 2, 12));
    return g;
}

// ======================== ENVIRONMENT ========================
// Reusable materials (created once for performance)
const matTrunk = M(0x795548);
const matTrunkDark = M(0x5D4037);
const matBirchTrunk = M(0xEEEEDD);
const matBirchMark = M(0x444444);
const matGreen1 = M(0x2E7D32);
const matGreen2 = M(0x4CAF50);
const matGreen3 = M(0x388E3C);
const matGreenDark = M(0x1B5E20);
const matGreenPine = M(0x2E7D32);
const matGreenLight = M(0x7CB342);
const matGreenYellow = M(0x9CCC65);
const matRock = M(0x8D8D8D);
const matRockDark = M(0x6D6D6D);
const matCactus = M(0x388E3C);
const matCactusDark = M(0x2E7D32);
const matPole = M(0x888888);
const matMetal = M(0xAAAAAA);
const matWhite = M(0xEEEEEE);
const matWood = M(0x8D6E63);
const matWoodDark = M(0x5D4037);
const matRoof = M(0x8D4E2A);
const matWindow = M(0x88BBEE);
const matSnow = M(0xEEEEFF);
const matYellow = M(0xFFB300);
const matRed = M(0xCC0000);
const matGolden = M(0xD4A843);
const matDoor = M(0x5D4037);
const matReedTop = M(0x8D6E63);
const matReedStem = M(0x558B2F);
const matFence = M(0xA1887F);
const matFencePost = M(0x795548);
const matCanopy = M(0x546E7A);
const matPumpBody = M(0xCFD8DC);
const matBillboardFrame = M(0x666666);

// City block shared materials (Synthwave / Vector Art)
const CITY_WALL_COLORS = [0x9C27B0, 0x673AB7, 0x3F51B5, 0x03A9F4, 0x00BCD4, 0x009688, 0xFF9800, 0xFF5722, 0xE91E63, 0xF50057, 0xFFEB3B, 0x7B1FA2];
const cityWallMats = CITY_WALL_COLORS.map(c => M(c));
const cityWallDarkMats = CITY_WALL_COLORS.map(c => M(new THREE.Color(c).multiplyScalar(0.7)));

const AWNING_COLORS = [0xE21A4B, 0xFF4081, 0x00E5FF, 0xFFD740, 0x7E57C2];
const cityAwningMats = AWNING_COLORS.map(c => M(c));

const matCityLedge = M(0x283593);
const matCityRoof = M(0x1A237E);
const matGlass = new THREE.MeshStandardMaterial({color:0xB2EBF2, transparent:true, opacity:0.8, flatShading:true});
const nightWinMats = [ME(0x00E5FF, 1.2), ME(0xFF4081, 1.2), ME(0xFFEA00, 1.2), ME(0x00E676, 1.2)];

function makeCityBlock() {
    const group = new THREE.Group();
    const buildingCount = isMobile ? (1 + Math.floor(Math.random() * 2)) : (2 + Math.floor(Math.random() * 2));
    let zCursor = 0;
    const isNight = typeof isNightBiome === 'function' && isNightBiome();

    for (let b = 0; b < buildingCount; b++) {
        const bw = 5 + Math.random() * 4;
        const bhBase = 7 + Math.random() * 8;
        const bd = 5 + Math.random() * 3;
        const colorIdx = Math.floor(Math.random() * CITY_WALL_COLORS.length);
        const wallMat = cityWallMats[colorIdx];
        const darkMat = cityWallDarkMats[colorIdx];
        const bg = new THREE.Group();

        // Основное здание
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw, bhBase, bd).translate(0, bhBase / 2, 0), wallMat));
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.4, 0.4, bd + 0.4).translate(0, bhBase + 0.2, 0), matCityLedge));

        if (!isMobile) {
            // Верхние ярусы (Ступенчатые крыши как на референсе)
            if (Math.random() < 0.7) {
                const bw2 = bw * (0.6 + Math.random() * 0.3);
                const bh2 = 4 + Math.random() * 6;
                const bd2 = bd * (0.6 + Math.random() * 0.3);
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw2, bh2, bd2).translate(0, bhBase + bh2/2, 0), darkMat));
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw2 + 0.3, 0.3, bd2 + 0.3).translate(0, bhBase + bh2 + 0.15, 0), matCityLedge));
                
                // Третий ярус
                if (Math.random() < 0.4) {
                    const bw3 = bw2 * 0.6;
                    const bh3 = 2 + Math.random() * 4;
                    const bd3 = bd2 * 0.6;
                    bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw3, bh3, bd3).translate(0, bhBase + bh2 + bh3/2, 0), wallMat));
                }
            }

            // Темный первый этаж
            const baseH = 3.0;
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.1, baseH, bd + 0.1).translate(0, baseH / 2, 0), matCityRoof));

            const winCount = Math.max(2, Math.floor(bw / 1.8));
            const winW = (bw * 0.8) / winCount - 0.2;
            const startX = -(winCount - 1) * (winW + 0.2) / 2;
            
            const activeWinMat = nightWinMats[Math.floor(Math.random() * nightWinMats.length)];

            // Окна первого этажа (+Z и -Z)
            for (let w = 0; w < winCount; w++) {
                const wx = startX + w * (winW + 0.2);
                const isLit = isNight && Math.random() < 0.5;
                const wMat = isLit ? activeWinMat : matGlass;
                // +Z
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(winW, 1.8, 0.08).translate(wx, 1.4, bd / 2 + 0.06), wMat));
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(winW + 0.1, 1.9, 0.05).translate(wx, 1.4, bd / 2 + 0.05), matCityLedge));
                // -Z
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(winW, 1.8, 0.08).translate(wx, 1.4, -bd / 2 - 0.06), wMat));
            }

            // Стилизованный козырёк (Awning) как на векторной графике
            const awnMat = cityAwningMats[Math.floor(Math.random() * AWNING_COLORS.length)];
            // +Z Awning
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.15, 1.0).translate(0, baseH + 0.1, bd / 2 + 0.5), awnMat));
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.4, 0.08).translate(0, baseH - 0.1, bd / 2 + 0.95), awnMat));
            // -Z Awning
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.15, 1.0).translate(0, baseH + 0.1, -bd / 2 - 0.5), awnMat));
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.4, 0.08).translate(0, baseH - 0.1, -bd / 2 - 0.95), awnMat));

            // Межэтажный пояс
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.2, 0.2, bd + 0.2).translate(0, baseH + 0.3, 0), awnMat));

            // Верхние окна
            const floorH = 2.8;
            for (let y = baseH + 1.8; y < bhBase - 1.0; y += floorH) {
                if (Math.random() < 0.5) {
                    bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.15, 0.15, bd + 0.15).translate(0, y - 0.6, 0), darkMat));
                }

                const fww = (bw * 0.7) / winCount - 0.1;
                const fsx = -(winCount - 1) * (fww + 0.1) / 2;
                for (let w = 0; w < winCount; w++) {
                    const fx = fsx + w * (fww + 0.1);
                    const isLit = isNight && Math.random() < 0.6;
                    const cMat = isLit ? activeWinMat : matGlass;
                    
                    bg.add(new THREE.Mesh(new THREE.BoxGeometry(fww, 1.2, 0.08).translate(fx, y + 0.4, bd / 2 + 0.06), cMat));
                    bg.add(new THREE.Mesh(new THREE.BoxGeometry(fww, 1.2, 0.08).translate(fx, y + 0.4, -bd / 2 - 0.06), cMat));

                    // Если горит свет, добавляем неоновый подоконник/блик
                    if (isLit) {
                        bg.add(new THREE.Mesh(new THREE.BoxGeometry(fww, 0.05, 0.15).translate(fx, y - 0.2, bd / 2 + 0.08), activeWinMat));
                    }
                }
            }
            
            // Боковое длинное стекло (как лента-лифт)
            if (Math.random() < 0.6) {
                const sw = bd * 0.5;
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, bhBase * 0.6, sw).translate(bw / 2 + 0.05, bhBase * 0.5, 0), matGlass));
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, bhBase * 0.6, sw).translate(-bw / 2 - 0.05, bhBase * 0.5, 0), matGlass));
            }
        } else {
             bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw*0.8, 3, bd*0.8).translate(0, bhBase + 1.5, 0), matCityRoof));
        }

        bg.position.z = zCursor + bd / 2;
        group.add(bg);
        zCursor += bd + Math.random() * 0.5;
    }

    const totalZ = zCursor;
    group.children.forEach(ch => { ch.position.z -= totalZ / 2; });
    return group;
}

function makeTree(c1=0x2E7D32,c2=0x4CAF50,trunk=0x795548) {
    const g = new THREE.Group();
    const sc = 0.85 + Math.random()*0.3;
    const h = (1.8 + Math.random()*1.2) * sc;
    const trunkMat = trunk===0x795548 ? matTrunk : M(trunk);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1*sc,0.2*sc,h,6).translate(0,h/2,0), trunkMat));
    const foliageMat1 = c1===0x2E7D32 ? matGreen1 : M(c1);
    const foliageMat2 = c2===0x4CAF50 ? matGreen2 : M(c2);
    // Main canopy - multiple overlapping spheres
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.9*sc,0).translate(0,h+0.6*sc,0), foliageMat1));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.7*sc,0).translate(0.35*sc,h+1.1*sc,0.2*sc), foliageMat2));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.6*sc,0).translate(-0.25*sc,h+1.0*sc,-0.15*sc), foliageMat1));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5*sc,5,4).translate(0.1*sc,h+1.5*sc,0.1*sc), foliageMat2));
    return g;
}

function makeBirch() {
    const g = new THREE.Group();
    const h = 3.0 + Math.random()*2.0;
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.1,h,6).translate(0,h/2,0), matBirchTrunk));
    // Dark marks on trunk
    for(let y=0.4;y<h-0.3;y+=0.5+Math.random()*0.3) {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.04,0.12).translate((Math.random()-0.5)*0.04,y,0), matBirchMark));
    }
    // Lighter/yellower foliage
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.8,0).translate(0,h+0.4,0), matGreenLight));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55,0).translate(0.25,h+0.9,0.15), matGreenYellow));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45,5,4).translate(-0.2,h+1.1,-0.1), matGreenLight));
    return g;
}

function makeBush(c=0x388E3C) {
    const g = new THREE.Group();
    const bushMat = c===0x388E3C ? matGreen3 : M(c);
    // Multiple overlapping spheres for organic look
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45+Math.random()*0.2,5,4).translate(0,0.35,0), bushMat));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3+Math.random()*0.15,5,3).translate(0.3,0.3,0.15), matGreen2));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.25+Math.random()*0.1,4,3).translate(-0.25,0.28,-0.1), bushMat));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.2,4,3).translate(0.05,0.55,0.08), matGreen2));
    return g;
}

function makePine(c=0x1B5E20) {
    const g = new THREE.Group();
    const h = 1.4+Math.random()*0.8;
    const piMat = c===0x1B5E20 ? matGreenDark : M(c);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.14,h,6).translate(0,h/2,0), matTrunkDark));
    // 3 cone layers, getting smaller toward top
    const r1 = 0.9+Math.random()*0.3, h1 = 1.4+Math.random()*0.4;
    const r2 = 0.7+Math.random()*0.2, h2 = 1.2+Math.random()*0.3;
    const r3 = 0.45+Math.random()*0.15, h3 = 0.9+Math.random()*0.2;
    g.add(new THREE.Mesh(new THREE.ConeGeometry(r1,h1,6).translate(0,h+h1*0.4,0), piMat));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(r2,h2,6).translate(0,h+h1*0.5+h2*0.35,0), matGreenPine));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(r3,h3,6).translate(0,h+h1*0.5+h2*0.5+h3*0.3,0), piMat));
    // Snow cap on some variants
    if (Math.random() < 0.35) {
        g.add(new THREE.Mesh(new THREE.ConeGeometry(0.15,0.25,5).translate(0,h+h1*0.5+h2*0.5+h3*0.7,0), matSnow));
    }
    return g;
}

function makeTreeCluster(type='mixed') {
    const g = new THREE.Group();
    const count = 3 + Math.floor(Math.random()*2); // 3-4 trees
    for (let i=0;i<count;i++) {
        let tree;
        if (type==='pine') tree = makePine();
        else if (type==='birch') tree = makeBirch();
        else tree = Math.random()<0.4 ? makeTree() : (Math.random()<0.5 ? makeBirch() : makePine());
        tree.position.set((Math.random()-0.5)*6, 0, (Math.random()-0.5)*6);
        tree.scale.setScalar(0.6 + Math.random()*0.5);
        g.add(tree);
    }
    // Bushes between trees
    const bushCount = 1 + Math.floor(Math.random()*2);
    for (let i=0;i<bushCount;i++) {
        const bush = makeBush();
        bush.position.set((Math.random()-0.5)*4, 0, (Math.random()-0.5)*4);
        bush.scale.setScalar(0.7+Math.random()*0.5);
        g.add(bush);
    }
    return g;
}

function makeBuilding(w,h,d,color,night=false) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d).translate(0,h/2,0), M(color)));
    // Roof ledge
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w+0.3,0.25,d+0.3).translate(0,h+0.12,0), M(0x555555)));
    const wc = night?0xFFEB3B:0x88BBEE;
    const wm = night?ME(wc,0.9):matWindow;
    const awningMat = M(0x78909C);
    let meshCount = 0;
    for(let y=2;y<h-1 && meshCount<6;y+=2.5) {
        for(let x=-w/2+1;x<w/2 && meshCount<6;x+=1.8) {
            if(night && Math.random()>0.5) continue;
            // Front face window
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7,0.9,0.1),wm).translateX(x).translateY(y).translateZ(d/2+0.05));
            meshCount++;
            // Awning over some windows on ground floor
            if (y < 3.5 && Math.random()<0.4) {
                g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9,0.05,0.4).translate(x,y+0.6,d/2+0.25), awningMat));
            }
            // AC unit on some upper windows
            if (y > 4 && Math.random()<0.3) {
                g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4,0.3,0.3).translate(x,y-0.7,d/2+0.2), matMetal));
            }
        }
    }
    // Door
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9,1.6,0.1).translate(0,0.8,d/2+0.05), matDoor));
    return g;
}

function makeHouse() {
    const g = new THREE.Group();
    const colors = [0xA1887F,0xBCAAA4,0xD7CCC8,0x8D6E63,0xC5B9A8,0xB39DDB];
    const c = colors[Math.floor(Math.random()*colors.length)];
    const wallMat = M(c);
    // Main body
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.5,2.5,3.5).translate(0,1.25,0), wallMat));
    // Peaked roof (box triangulated by scaling)
    const roofGeo = new THREE.BufferGeometry();
    const rw=2.0, rh=1.2, rl=2.1;
    const rv = new Float32Array([
        -rw,0,-rl, rw,0,-rl, rw,0,rl, -rw,0,rl,
        0,rh,-rl, 0,rh,rl
    ]);
    const ri = [0,1,4, 1,2,5, 1,5,4, 2,3,5, 3,0,4, 3,4,5, 0,2,1, 0,3,2];
    roofGeo.setAttribute('position', new THREE.BufferAttribute(rv,3));
    roofGeo.setIndex(ri);
    roofGeo.computeVertexNormals();
    const roof = new THREE.Mesh(roofGeo, matRoof);
    roof.position.y = 2.5;
    g.add(roof);
    // Chimney
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.35,1.0,0.35).translate(0.8,3.2,0), matRockDark));
    // Windows
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.1).translate(-0.8,1.5,1.76), matWindow));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.1).translate(0.8,1.5,1.76), matWindow));
    // Door
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7,1.3,0.1).translate(0,0.65,1.76), matDoor));
    // Small fence around
    const fp = matFencePost;
    [-2.2,2.2].forEach(x => {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.8,5).translate(x,0.4,2.5), fp));
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.8,5).translate(x,0.4,-2.5), fp));
    });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.4,0.06,0.06).translate(0,0.65,2.5), matFence));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.4,0.06,0.06).translate(0,0.35,2.5), matFence));
    return g;
}

function makeWater() {
    const g = new THREE.Group();
    const w = 8+Math.random()*8, d = 4+Math.random()*5;
    // Wave mesh - sine-displaced plane
    const segs = 8;
    const waterGeo = new THREE.PlaneGeometry(w, d, segs, segs);
    waterGeo.rotateX(-Math.PI/2);
    const pos = waterGeo.attributes.position;
    for (let i=0; i<pos.count; i++) {
        pos.setY(i, 0.05 + Math.sin(pos.getX(i)*0.8)*0.08 + Math.sin(pos.getZ(i)*1.2)*0.06);
    }
    waterGeo.computeVertexNormals();
    const waterMat = new THREE.MeshStandardMaterial({color:0x1565C0,metalness:0.6,roughness:0.2,transparent:true,opacity:0.7,flatShading:true});
    g.add(new THREE.Mesh(waterGeo, waterMat));
    // Banks
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w+1,0.2,0.6).translate(0,0.05,d/2+0.3), matWood));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w+1,0.2,0.6).translate(0,0.05,-d/2-0.3), matWood));
    // Reeds/cattails on edges
    for (let i=0;i<3;i++) {
        const rx = (Math.random()-0.5)*w*0.6;
        const rz = (Math.random()<0.5?1:-1)*(d/2+0.1);
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.2,4).translate(rx,0.6,rz), matReedStem));
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,4,3).translate(rx,1.2,rz), matReedTop));
    }
    return g;
}

function makeBridge() {
    const g = new THREE.Group();
    const bridgeMat = M(0x9E9E9E);
    const archMat = M(0x757575);
    // Road surface
    g.add(new THREE.Mesh(new THREE.BoxGeometry(12,0.35,5).translate(0,1.2,0), bridgeMat));
    // Arches underneath
    for (let z=-1.5;z<=1.5;z+=3) {
        const archGeo = new THREE.TorusGeometry(0.8, 0.15, 6, 8, Math.PI);
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.rotation.y = Math.PI/2;
        arch.position.set(0, 0.4, z);
        g.add(arch);
    }
    // Support pillars
    [[-5,0],[-5,3],[5,0],[5,3],[-5,-3],[5,-3]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,1.2,0.3).translate(p[0],0.6,p[1]-1.5), archMat));
    });
    // Railings with posts
    const railMat = M(0x616161);
    [-5.8,5.8].forEach(x => {
        for(let z=-2;z<=2;z+=1) g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.0,5).translate(x,1.7,z), railMat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,5).translate(x,2.2,0), railMat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,5).translate(x,1.6,0), railMat));
    });
    return g;
}

function makeBarrier() {
    const g = new THREE.Group();
    // Highway guardrail: horizontal bar on posts with reflective strips
    const postCount = 4;
    for (let i=0;i<postCount;i++) {
        const px = i*1.0 - (postCount-1)*0.5;
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08,0.7,0.08).translate(px,0.35,0), matPole));
    }
    // Horizontal rail
    const railW = (postCount-1)*1.0 + 0.3;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(railW,0.12,0.06).translate(0,0.55,0), matMetal));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(railW,0.12,0.06).translate(0,0.3,0), matMetal));
    // Reflective strips
    for (let i=0;i<postCount-1;i++) {
        const sx = i*1.0 - (postCount-2)*0.5;
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.08).translate(sx,0.55,0.04), matYellow));
    }
    return g;
}

function makeRock(s=1) {
    const g = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(0.7*s, 1);
    // Vertex displacement for irregular natural shape
    const pos = geo.attributes.position;
    for (let i=0;i<pos.count;i++) {
        const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
        const disp = 0.85 + Math.random()*0.3;
        pos.setXYZ(i, x*disp, y*0.6*disp, z*0.9*disp);
    }
    geo.computeVertexNormals();
    const rockMat = s>1.2 ? matRockDark : matRock;
    const mesh = new THREE.Mesh(geo, rockMat);
    mesh.position.y = 0.25*s;
    g.add(mesh);
    return g;
}

function makeCactus() {
    const g = new THREE.Group();
    // Main trunk
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,3.0,6).translate(0,1.5,0), matCactus));
    // Arms at different angles
    const armAngles = [
        {x:-0.55, y:2.2, z:0, rot:1.0},
        {x:0.45, y:1.7, z:0.1, rot:-0.85},
    ];
    if (Math.random()<0.6) armAngles.push({x:0.1, y:2.6, z:-0.35, rot:0.7});
    armAngles.forEach(a => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.12,1.0+Math.random()*0.4,5), matCactusDark);
        arm.rotation.z = a.rot;
        arm.position.set(a.x,a.y,a.z);
        g.add(arm);
    });
    // Flowers on tips of some arms
    if (Math.random()<0.5) {
        const flowerColors = [0xFF4081,0xFFEB3B,0xFF6D00,0xE040FB];
        const fc = flowerColors[Math.floor(Math.random()*flowerColors.length)];
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.1,5,4).translate(-0.8,2.7,0), M(fc)));
    }
    if (Math.random()<0.3) {
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,4,3).translate(0,3.1,0), M(0xFFEB3B)));
    }
    return g;
}

function makeSign(type) {
    const g = new THREE.Group();
    // Proper pole
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,3.0,6).translate(0,1.5,0), matPole));
    // Base plate
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4,0.05,0.4).translate(0,0.02,0), matPole));
    if (type==='speed') {
        // Round white sign with red border
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.06,12).translate(0,3.0,0), matWhite));
        g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,3.0,0.03), matRed));
    } else if (type==='warning') {
        // Yellow triangle
        g.add(new THREE.Mesh(new THREE.ConeGeometry(0.5,0.55,3).rotateZ(Math.PI).translate(0,3.1,0), M(0xFFEB3B)));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.06).translate(0,3.0,0.03), matRed));
    } else {
        // Blue info rectangle
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9,0.6,0.06).translate(0,3.0,0), M(0x1976D2)));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5,0.2,0.07).translate(0,3.0,0.01), matWhite));
    }
    return g;
}

// New environment objects
function makeGasStation() {
    const g = new THREE.Group();
    // Small building
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5,2.0,2.0).translate(0,1.0,-1.5), M(0xCFD8DC)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.7,0.15,2.2).translate(0,2.05,-1.5), matRockDark));
    // Door and window on building
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6,1.2,0.1).translate(0,0.6,-0.49), matDoor));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.1).translate(0.8,1.3,-0.49), matWindow));
    // Canopy extending out
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.0,0.12,3.5).translate(0,3.0,1.0), matCanopy));
    // Canopy pillars
    [[-1.6,1.8],[1.6,1.8],[-1.6,2.8],[1.6,2.8]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,3.0,6).translate(p[0],1.5,p[1]), matMetal));
    });
    // Fuel pumps
    [-0.6,0.6].forEach(x => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,1.2,0.3).translate(x,0.6,1.5), matPumpBody));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.35,0.1,0.35).translate(x,1.25,1.5), matRockDark));
    });
    return g;
}

function makeBillboard() {
    const g = new THREE.Group();
    // Two tall poles
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.12,6.0,6).translate(-1.5,3.0,0), matBillboardFrame));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.12,6.0,6).translate(1.5,3.0,0), matBillboardFrame));
    // Billboard rectangle
    const adColors = [0x1976D2,0xD32F2F,0x388E3C,0xFF8F00,0x7B1FA2];
    const adColor = adColors[Math.floor(Math.random()*adColors.length)];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.0,2.0,0.15).translate(0,5.5,0), M(adColor)));
    // Frame border
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.2,0.1,0.2).translate(0,6.55,0), matBillboardFrame));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.2,0.1,0.2).translate(0,4.45,0), matBillboardFrame));
    return g;
}

function makeFenceRow() {
    const g = new THREE.Group();
    const length = 6 + Math.floor(Math.random()*4);
    // Posts
    for (let i=0; i<length; i++) {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.0,5).translate(i*1.2-(length-1)*0.6,0.5,0), matFencePost));
    }
    // Horizontal bars
    const barW = (length-1)*1.2 + 0.2;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(barW,0.06,0.06).translate(0,0.75,0), matFence));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(barW,0.06,0.06).translate(0,0.4,0), matFence));
    return g;
}

function makeHayBale() {
    const g = new THREE.Group();
    // Round cylinder on its side
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.9,8), matGolden);
    bale.rotation.z = Math.PI/2;
    bale.position.y = 0.6;
    g.add(bale);
    // End caps slightly darker
    const capMat = M(0xBB9030);
    const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.58,0.58,0.03,8), capMat);
    cap1.rotation.z = Math.PI/2;
    cap1.position.set(-0.46,0.6,0);
    g.add(cap1);
    return g;
}

// Магазин со светящейся вывеской
function makeShop() {
    const g = new THREE.Group();
    const shopColors = [0x9C27B0,0x03A9F4,0xE91E63,0xFF9800];
    const wallColor = shopColors[Math.floor(Math.random()*shopColors.length)];
    // Стены
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4,3,3).translate(0,1.5,0), M(wallColor)));
    // Крыша
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.4,0.2,3.4).translate(0,3.1,0), M(0x666666)));
    // Витрина (большое стекло)
    const vitrinaMat = new THREE.MeshStandardMaterial({color:0xBBDDFF,flatShading:true,transparent:true,opacity:0.4,metalness:0.3});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5,1.8,0.08).translate(0,1.4,1.52), vitrinaMat));
    // Дверь
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.8,2.0,0.08).translate(-1.5,1.0,1.52), M(0x5D4037)));
    // ВЫВЕСКА — светящаяся!
    const signColors = [0xFF1744,0x2979FF,0x00E676,0xFFD600,0xFF6D00];
    const signColor = signColors[Math.floor(Math.random()*signColors.length)];
    const signMat = ME(signColor, 1.2);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.0,0.6,0.12).translate(0,2.9,1.55), signMat));
    // Козырёк над входом
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.2,0.08,1.0).translate(0,2.5,2.0), M(0x555555)));
    // Свет у входа (маленький)
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.1,4,3).translate(1.2,2.4,1.6), ME(0xFFDD88,0.8)));
    return g;
}

// Заправка со светящимся лого
function makeGasStationLit() {
    const g = new THREE.Group();
    // Здание (яркое)
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3,2.5,2.5).translate(0,1.25,-2), M(0x03A9F4)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.2,0.15,2.7).translate(0,2.55,-2), M(0xE91E63)));
    // Витрина
    const glassMat = new THREE.MeshStandardMaterial({color:0xBBDDFF,flatShading:true,transparent:true,opacity:0.4});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8,1.2,0.08).translate(0,1.2,-0.74), glassMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7,1.5,0.08).translate(-0.9,0.75,-0.74), M(0x5D4037)));
    // Навес
    g.add(new THREE.Mesh(new THREE.BoxGeometry(5,0.15,4).translate(0,3.5,1), M(0x3F51B5)));
    // Колонны навеса
    [[-2,1.5],[2,1.5],[-2,3],[2,3]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,3.5,6).translate(p[0],1.75,p[1]), M(0xFFEB3B)));
    });
    // Колонки бензина
    [-0.8,0.8].forEach(x => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4,1.4,0.4).translate(x,0.7,1.5), M(0xE53935)));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.45,0.1,0.45).translate(x,1.45,1.5), M(0x424242)));
        // Экран на колонке
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25,0.2,0.05).translate(x,1.1,1.72), ME(0x4CAF50,0.6)));
    });
    // ВЫВЕСКА — большая светящаяся
    const logoColors = [0xFF0000,0x2196F3,0x4CAF50,0xFFC107];
    const logoColor = logoColors[Math.floor(Math.random()*logoColors.length)];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5,0.8,0.12).translate(0,2.4,-0.74), ME(logoColor,1.0)));
    // Лого на навесе (снизу)
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.5,0.05,1.5).translate(0,3.42,1.5), ME(logoColor,0.5)));
    return g;
}

function makeLamp(on=false){
    const g = new THREE.Group();
    // Столб
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,5.0,6).translate(0,2.5,0),M(0x666666)));
    // Козырёк — направлен ПО X к дороге (не по Z)
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.5,0.06,0.06).translate(0.75,4.9,0),M(0x666666)));
    if(on){
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.18,6,4).translate(1.4,4.85,0),ME(0xFFDD88,1.0)));
        if(!isMobile){const pl=new THREE.PointLight(0xFFDD88,2,12);pl.position.set(1.4,4.7,0);g.add(pl);}
        const cone=new THREE.Mesh(new THREE.CylinderGeometry(0.05,1.5,4.5,8,1,true),
            new THREE.MeshBasicMaterial({color:0xFFDD88,transparent:true,opacity:0.04,side:THREE.DoubleSide}));
        cone.position.set(1.4,2.4,0); g.add(cone);
    } else {
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.14,6,4).translate(1.4,4.85,0),M(0xaaaaaa)));
    }
    return g;
}

function makeTrafficLight(){
    const g = new THREE.Group();
    // Tall black pole
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,5.5,6).translate(0,2.75,0),M(0x222222)));
    // Horizontal arm extending over the road (toward road center, negative x since placed on right side)
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.0,0.08,0.08).translate(-1.5,5.5,0),M(0x222222)));
    // Traffic light box hanging from arm
    const boxX = -3.0;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.8,0.3).translate(boxX,5.1,0),M(0x1a1a1a)));
    // Pick which light is active (0=red, 1=yellow, 2=green)
    const activeLight = Math.floor(Math.random()*3);
    const darkMat = M(0x444444);
    // Red (top)
    const redMat = activeLight===0 ? ME(0xff0000,1.5) : darkMat;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4).translate(boxX,5.35,0.16),redMat));
    // Yellow (middle)
    const yellowMat = activeLight===1 ? ME(0xffcc00,1.5) : darkMat;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4).translate(boxX,5.1,0.16),yellowMat));
    // Green (bottom)
    const greenMat = activeLight===2 ? ME(0x00cc44,1.5) : darkMat;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4).translate(boxX,4.85,0.16),greenMat));
    return g;
}

function makeRoadSign60(){
    const g = new THREE.Group();
    // Pole
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.5,6).translate(0,1.25,0),matPole));
    // White disc face
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.05,12).translate(0,2.7,0),matWhite));
    // Red ring
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,2.7,0.03),matRed));
    // "60" using small boxes
    const matBlack = M(0x111111);
    // 6: top bar, left bar full, middle bar, right-bottom bar, bottom bar
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(-0.18,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(-0.06,2.625,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.55,0.04),matBlack));
    // 0: outline rectangle
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.06,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.18,2.7,0.04),matBlack));
    return g;
}

function makeRoadSign90(){
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.5,6).translate(0,1.25,0),matPole));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.05,12).translate(0,2.7,0),matWhite));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,2.7,0.03),matRed));
    const matBlack = M(0x111111);
    // 9: top bar, left-top, right full, middle bar, bottom bar
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(-0.18,2.775,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(-0.06,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.55,0.04),matBlack));
    // 0
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.06,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.18,2.7,0.04),matBlack));
    return g;
}

function makeRoadSign120(){
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.5,6).translate(0,1.25,0),matPole));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.05,12).translate(0,2.7,0),matWhite));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,2.7,0.03),matRed));
    const matBlack = M(0x111111);
    // 1: single vertical bar
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(-0.2,2.7,0.04),matBlack));
    // 2: top bar, right-top, middle, left-bottom, bottom bar
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(-0.04,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(0.01,2.775,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(-0.04,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(-0.09,2.625,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(-0.04,2.55,0.04),matBlack));
    // 0
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(0.16,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(0.16,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.11,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.21,2.7,0.04),matBlack));
    return g;
}

function spawnEnvObject(type) {
    const r = Math.random();
    let mesh, cat='tree';
    switch(type) {
        case 'highway':
            if(r<0.12){ mesh=makeTreeCluster('mixed'); cat='tree'; }
            else if(r<0.22){ mesh=makeBirch(); cat='tree'; }
            else if(r<0.30){ mesh=makeBush(); cat='bush'; }
            else if(r<0.38){ mesh=makeSign(Math.random()<0.5?'speed':'info'); cat='sign'; }
            else if(r<0.46){ mesh=makeBarrier(); cat='barrier'; }
            else if(r<0.54){ mesh=makeHouse(); cat='building'; }
            else if(r<0.62){ mesh=makeTree(0x388E3C,0x66BB6A); cat='tree'; }
            else if(r<0.68){ mesh=makeGasStation(); cat='building'; }
            else if(r<0.74){ mesh=makeBillboard(); cat='billboard'; }
            else if(r<0.80){ mesh=makeHayBale(); cat='rock'; }
            else if(r<0.86){ mesh=makeFenceRow(); cat='fence'; }
            else if(r<0.92){ mesh=makeWater(); cat='tree'; }
            else { mesh=makeTree(); cat='tree'; }
            break;
        case 'city':
            if(r<0.60){ mesh=makeCityBlock(); cat='building'; }
            else if(r<0.72){ mesh=makeShop(); cat='building'; }
            else if(r<0.80){ mesh=makeGasStationLit(); cat='building'; }
            else if(r<0.88){ mesh=makeBillboard(); cat='billboard'; }
            else if(r<0.94){ mesh=makeSign('speed'); cat='sign'; }
            else { mesh=makeBush(0x558B2F); cat='bush'; }
            break;
        case 'canyon':
            if(r<0.30){ mesh=makeRock(1+Math.random()*2); cat='rock'; }
            else if(r<0.50){ mesh=makeCactus(); cat='rock'; }
            else if(r<0.62){ mesh=makeSign('warning'); cat='sign'; }
            else if(r<0.78){ mesh=makeRock(0.4+Math.random()*0.5); cat='rock'; }
            else { mesh=makeBush(0x8D6E63); cat='bush'; }
            break;
        case 'tunnel':
            if(r<0.6){ mesh=makeBarrier(); cat='barrier'; }
            else { mesh=makeSign('info'); cat='sign'; }
            break;
        case 'night':
            if(r<0.15){ mesh=makeTreeCluster('pine'); cat='tree'; }
            else if(r<0.25){ mesh=makePine(0x0A1A0A); cat='tree'; }
            else if(r<0.38){ mesh=makeBuilding(3,6+Math.random()*10,3,0x1A1A2E,true); cat='building'; }
            else if(r<0.46){ mesh=makeShop(); cat='building'; }
            else if(r<0.54){ mesh=makeGasStationLit(); cat='building'; }
            else if(r<0.62){ mesh=makeBush(0x0D1A0D); cat='bush'; }
            else if(r<0.74){ mesh=makeTree(0x0D1A0D,0x1A2E1A,0x3E2723); cat='tree'; }
            else if(r<0.84){ mesh=makeHouse(); cat='building'; }
            else { mesh=makeBarrier(); cat='barrier'; }
            break;
        case 'sunset':
            if(r<0.14){ mesh=makeTreeCluster('birch'); cat='tree'; }
            else if(r<0.26){ mesh=makeTree(0x4E342E,0x6D4C41); cat='tree'; }
            else if(r<0.36){ mesh=makePine(0x33691E); cat='tree'; }
            else if(r<0.46){ mesh=makeBirch(); cat='tree'; }
            else if(r<0.55){ mesh=makeWater(); cat='tree'; }
            else if(r<0.63){ mesh=makeHouse(); cat='building'; }
            else if(r<0.71){ mesh=makeFenceRow(); cat='fence'; }
            else if(r<0.80){ mesh=makeBush(0x6D4C41); cat='bush'; }
            else if(r<0.88){ mesh=makeSign('speed'); cat='sign'; }
            else { mesh=makeBridge(); cat='building'; }
            break;
        default:
            mesh=makeTree(); cat='tree';
    }
    return {mesh:mesh, cat:cat};
}

// ======================== LAMP SYSTEM ========================
const LAMP_SPACING = 50;
const LAMP_OFFSET_X = 12/2 + 1.5;

// ======================== PARTICLES ========================
class Particles {
    constructor(sc) { this.scene = sc; this.sparks = []; }
    burst(pos, count=15, color=0xFF6D00) {
        if (isMobile) count = Math.min(count, 5);
        for (let i=0; i<count; i++) {
            const geo = new THREE.BoxGeometry(0.08,0.08,0.08);
            const mat = new THREE.MeshBasicMaterial({color: [0xFF6D00,0xFF3D00,0xFFAB00,0xFFFFFF,0xFF1744][Math.floor(Math.random()*5)]});
            const m = new THREE.Mesh(geo, mat);
            m.position.copy(pos);
            const vel = new THREE.Vector3((Math.random()-0.5)*15, Math.random()*12, (Math.random()-0.5)*15);
            this.sparks.push({m, vel, life:0.6+Math.random()*0.4});
            this.scene.add(m);
        }
    }
    speedParticle(pos) {
        const geo = new THREE.BoxGeometry(0.03,0.03,0.5);
        const mat = new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.3});
        const m = new THREE.Mesh(geo, mat);
        m.position.set(pos.x+(Math.random()-0.5)*3, pos.y+Math.random()*2, pos.z+5+Math.random()*10);
        this.sparks.push({m, vel:new THREE.Vector3(0,0,-40), life:0.3});
        this.scene.add(m);
    }
    update(dt) {
        for (let i=this.sparks.length-1; i>=0; i--) {
            const s = this.sparks[i];
            s.life -= dt;
            if (s.life <= 0) { this.scene.remove(s.m); s.m.geometry.dispose(); s.m.material.dispose(); this.sparks.splice(i,1); continue; }
            s.vel.y -= 20*dt;
            s.m.position.addScaledVector(s.vel, dt);
            s.m.material.opacity = s.life;
            s.m.rotation.x += dt*10; s.m.rotation.z += dt*8;
        }
    }
}

// ======================== GAME STATE ========================
const LANE_X = [-3.5, 0, 3.5];
const ROAD_W = 12;
const nosParticles = [];
const lampObjects = [];
let nextLampZ = 0;
let lampSideLeft = true;

const TRAFFIC_LIGHT_SPACING = 300;
let nextTrafficLightZ = 0;
const trafficLightObjects = [];

const ROAD_SIGN_SPACING = 150;
let nextRoadSignZ = 0;
let roadSignSideLeft = true;
const roadSignObjects = [];

const state = {
    phase: 'menu',
    mode: 'endless', // 'endless', 'chase', 'duel'
    score: 0, coins: 0, speed: 0, lane: 1, targetLane: 1, laneSmooth: 1, dist: 0,
    obstacles: [], coinObjs: [], envObjs: [], boosts: [],
    oTimer: 0, cTimer: 0, eTimer: 0, bTimer: 0,
    biomeIdx: 0, biomeProg: 0, combo: 0, comboTimer: 0, nearMissTimer: 0,
    shakeAmount: 0, boosted: false, boostTimer: 0, dodged: 0,
    braking: false,
    // Mission tracking
    nosUseCount: 0, brakeDodges: 0, duelWon: false,
    // Second life
    usedSecondLife: false,
    // Weather
    weather: 'clear',
    // Crash animation
    crashing: false, crashTimer: 0, crashTitle: '',
    crashCarY: 0, crashCarRotX: 0, crashShards: [], crashSmokes: [],
    // Invincibility after second life
    invincible: false, invincibleTimer: 0,
    // Brake dodge tracking
    wasBraking: false,
    // Chase mode
    policeZ: 0, policeActive: false, policeLane: 1, policeLaneSmooth: 1,
    policeTimer: 0, policeSpeed: 0,
    policeRespawnDist: 0, policeRespawnPending: false,
    policeChaseStartDist: 0,
    spikeStrips: [], spikeTimer: 0, tireDamaged: false, tireDamageTimer: 0,
    // Duel mode
    rivalZ: 0, rivalLane: 1, rivalLaneSmooth: 1, rivalSpeed: 0,
    rivalNos: false, rivalNosTimer: 0, rivalNosCD: 0,
    duelFinish: 2000,
    // Fuel mode
    fuel: 100, fuelCanisters: [], fuelTimer: 0,
};

// ======================== RENDERER & SCENE ========================
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference:'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 300);

const ambLight = new THREE.AmbientLight(0x99aacc, 0.5);
scene.add(ambLight);
const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.3);
dirLight.position.set(8,20,15);
dirLight.castShadow = !isMobile;
dirLight.shadow.mapSize.set(isMobile ? 512 : 2048, isMobile ? 512 : 2048);
dirLight.shadow.camera.left=-25; dirLight.shadow.camera.right=25;
dirLight.shadow.camera.top=30; dirLight.shadow.camera.bottom=-15;
dirLight.shadow.camera.near=1; dirLight.shadow.camera.far=60;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);
scene.add(dirLight.target);

const hemiLight = new THREE.HemisphereLight(0x88aacc, 0x444422, 0.4);
scene.add(hemiLight);

scene.fog = null; // туман отключён

// Road
const roadGeo = new THREE.PlaneGeometry(ROAD_W, 1200);
roadGeo.rotateX(-Math.PI/2);
const roadMat = new THREE.MeshStandardMaterial({color:0x3a3a3a, roughness:0.85});
const road = new THREE.Mesh(roadGeo, roadMat);
road.receiveShadow = true;
scene.add(road);

// Road lines
const lineMat = new THREE.MeshBasicMaterial({color:0xffffff});
const roadLines = [];
for (let li=0; li<2; li++) {
    const lx = li===0 ? LANE_X[0]+(LANE_X[1]-LANE_X[0])/2 : LANE_X[1]+(LANE_X[2]-LANE_X[1])/2;
    for (let z=-15; z<580; z+=5) {
        const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.15,2.2), lineMat);
        lm.rotation.x=-Math.PI/2; lm.position.set(lx,0.015,z);
        lm.userData.baseZ = z;
        scene.add(lm); roadLines.push(lm);
    }
}

// Edge lines
const edgeMat = new THREE.MeshStandardMaterial({color:0xeeeeee});
const edgeObjects = [];
[-ROAD_W/2, ROAD_W/2].forEach(x => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.08,1200), edgeMat);
    e.position.set(x,0.04,130); e.receiveShadow=true; scene.add(e); edgeObjects.push(e);
    const yellowMat = new THREE.MeshStandardMaterial({color:0xFFB300});
    const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,1200), yellowMat);
    e2.position.set(x+(x>0?0.2:-0.2),0.04,130); scene.add(e2); edgeObjects.push(e2);
});

// Ground
const groundMat = new THREE.MeshStandardMaterial({color:0x4CAF50, roughness:1.0});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600,1400), groundMat);
ground.rotation.x=-Math.PI/2; ground.position.y=-0.02; ground.receiveShadow=true;
scene.add(ground);

// Player
let playerCar = buildPlayerCar();
scene.add(playerCar);

// Headlights
const headL = new THREE.SpotLight(0xffffee, 0, 30, 0.4, 0.5, 1);
headL.position.set(-0.6,0.7,2.3);
headL.target.position.set(-0.6,0,15);
playerCar.add(headL); playerCar.add(headL.target);
const headR = new THREE.SpotLight(0xffffee, 0, 30, 0.4, 0.5, 1);
headR.position.set(0.6,0.7,2.3);
headR.target.position.set(0.6,0,15);
playerCar.add(headR); playerCar.add(headR.target);

// Police car (created once, added/removed from scene as needed)
let policeCar = null;
let rivalCar = null;

function rebuildPlayerCar() {
    const pos = playerCar.position.clone();
    const rot = playerCar.rotation.clone();
    // Remove headlights from old car
    playerCar.remove(headL); playerCar.remove(headL.target);
    playerCar.remove(headR); playerCar.remove(headR.target);
    scene.remove(playerCar);
    playerCar = buildPlayerCar();
    playerCar.position.copy(pos);
    playerCar.rotation.copy(rot);
    // Re-attach headlights
    playerCar.add(headL); playerCar.add(headL.target);
    playerCar.add(headR); playerCar.add(headR.target);
    scene.add(playerCar);
}

const particles = new Particles(scene);
const weatherParticles = new WeatherParticles(scene);

// ======================== UI ========================
const ui = {
    score: document.getElementById('score-val'),
    speed: document.getElementById('speed-val'),
    coins: document.getElementById('coins-val'),
    combo: document.getElementById('combo-display'),
    nearMiss: document.getElementById('near-miss'),
    biome: document.getElementById('biome-label'),
    menu: document.getElementById('menu'),
    gameover: document.getElementById('gameover'),
    goTitle: document.getElementById('go-title'),
    goScore: document.getElementById('go-score'),
    goStats: document.getElementById('go-stats'),
    goRecord: document.getElementById('go-record-label'),
    menuRecord: document.getElementById('menu-record'),
    speedOverlay: document.getElementById('speed-overlay'),
    chaseUI: document.getElementById('chase-ui'),
    chaseDist: document.getElementById('chase-dist'),
    duelUI: document.getElementById('duel-ui'),
    duelPlayerMarker: document.getElementById('duel-player-marker'),
    duelRivalMarker: document.getElementById('duel-rival-marker'),
    duelDistLabel: document.getElementById('duel-distance-label'),
    fuelUI: document.getElementById('fuel-ui'),
    fuelBar: document.getElementById('fuel-bar-fill'),
    fuelWarning: document.getElementById('fuel-warning'),
    pause: document.getElementById('pause'),
    hud: document.getElementById('hud'),
    hudPauseBtn: document.getElementById('hud-pause-btn'),
    hudMuteBtn: document.getElementById('hud-mute-btn'),
    secondLife: document.getElementById('second-life'),
    weatherIcon: document.getElementById('weather-icon'),
};

function showBiome(n) { ui.biome.textContent = n; ui.biome.classList.add('show'); setTimeout(()=>ui.biome.classList.remove('show'),3000); }
function showCombo(n) { ui.combo.textContent=`x${n} COMBO!`; ui.combo.style.opacity='1'; ui.combo.style.fontSize=`${30+n*3}px`; setTimeout(()=>ui.combo.style.opacity='0',800); }
function showNearMiss() { ui.nearMiss.textContent='+50 NEAR MISS!'; ui.nearMiss.style.opacity='1'; setTimeout(()=>ui.nearMiss.style.opacity='0',600); }
function updateMenuRecord() { const b=localStorage.getItem('rr3d_best')||0; ui.menuRecord.textContent=b>0?`Рекорд: ${b}`:''; }

// ======================== PAUSE ========================
function pauseGame() {
    if (state.phase !== 'playing' || state.crashing) return;
    state.phase = 'paused';
    sfx.stopMusic();
    sfx.stopEngine();
    sfx.stopSiren();
    ui.pause.style.display = 'flex';
    showHUD(false);
}
function resumeGame() {
    if (state.phase !== 'paused') return;
    state.phase = 'playing';
    clock.getDelta();
    sfx.startMusic();
    sfx.startEngine();
    if (state.mode === 'chase' && state.policeActive) sfx.startSiren();
    ui.pause.style.display = 'none';
    showHUD(true);
}

// ======================== CONTROLS ========================
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code]=true;
    if (e.code === 'Escape' || e.code === 'KeyP') {
        if (state.phase === 'playing') pauseGame();
        else if (state.phase === 'paused') resumeGame();
    }
    if (e.code === 'KeyM') {
        const muted = sfx.toggleMute();
        document.getElementById('mute-icon-on').style.display = muted ? 'none' : 'block';
        document.getElementById('mute-icon-off').style.display = muted ? 'block' : 'none';
    }
});
window.addEventListener('keyup', e => { keys[e.code]=false; });

let swX = 0, swY = 0, swT = 0;
const onDown = (x, y) => { swX=x; swY=y; swT=Date.now(); };
const onUp = (x, y) => {
    if(state.phase!=='playing') return;
    const dx = x - swX;
    const dy = y - swY;
    const dt = Date.now() - swT;
    // Swipe down = brake handled in onMove, but tap/swipe detection:
    if (Math.abs(dy) > 40 && dy > 0 && dt < 400 && Math.abs(dy) > Math.abs(dx)) {
        // swipe down - brake is handled via state.braking in touch move
        return;
    }
    if(Math.abs(dx)>25 && dt<350) {
        // Swipe: inverted to match user expectation
        moveLane(dx < 0 ? 1 : -1);
    } else if(dt<200) {
        // Tap: inverted to match user expectation
        moveLane(x < window.innerWidth/2 ? 1 : -1);
    }
};
renderer.domElement.addEventListener('touchstart',e=>{e.preventDefault();onDown(e.touches[0].clientX, e.touches[0].clientY);},{passive:false});
renderer.domElement.addEventListener('touchmove',e=>{
    // Detect swipe down for braking during touch
    const dy = e.touches[0].clientY - swY;
    if (dy > 40) state.braking = true;
    else state.braking = false;
},{passive:true});
renderer.domElement.addEventListener('touchend',e=>{
    state.braking = false;
    onUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});
renderer.domElement.addEventListener('mousedown',e=>onDown(e.clientX, e.clientY));
renderer.domElement.addEventListener('mouseup',e=>onUp(e.clientX, e.clientY));

let laneCD = 0;
function moveLane(dir) {
    if (state.phase!=='playing'||laneCD>0) return;
    const nl = Math.max(0, Math.min(2, state.targetLane + dir));
    if (nl !== state.targetLane) { state.targetLane = nl; sfx.lane(); laneCD = 120; }
}

// ======================== LAMP HELPERS ========================
function isNightBiome() {
    const b = BIOMES[state.biomeIdx];
    return b.dirI < 0.6;
}

function spawnLampsAhead() {
    const lookAhead = state.dist + 200;
    while (nextLampZ < lookAhead) {
        const on = isNightBiome();
        const lamp = makeLamp(on);
        const side = lampSideLeft ? -1 : 1;
        lamp.position.set(side * LAMP_OFFSET_X, 0, nextLampZ);
        if (side > 0) lamp.rotation.y = Math.PI;
        scene.add(lamp);
        lampObjects.push({ mesh: lamp, z: nextLampZ, on: on });
        lampSideLeft = !lampSideLeft;
        nextLampZ += LAMP_SPACING;
    }
}

function cleanupLamps() {
    for (let i = lampObjects.length - 1; i >= 0; i--) {
        if (lampObjects[i].z < state.dist - 30) {
            scene.remove(lampObjects[i].mesh);
            lampObjects.splice(i, 1);
        }
    }
}

// ======================== TRAFFIC LIGHT HELPERS ========================
function spawnTrafficLightsAhead() {
    const lookAhead = state.dist + 200;
    while (nextTrafficLightZ < lookAhead) {
        const tl = makeTrafficLight();
        // Right side of road, arm extends left over road
        tl.position.set(ROAD_W/2 + 0.5, 0, nextTrafficLightZ);
        scene.add(tl);
        trafficLightObjects.push({ mesh: tl, z: nextTrafficLightZ });
        nextTrafficLightZ += TRAFFIC_LIGHT_SPACING;
    }
}

function cleanupTrafficLights() {
    for (let i = trafficLightObjects.length - 1; i >= 0; i--) {
        if (trafficLightObjects[i].z < state.dist - 30) {
            scene.remove(trafficLightObjects[i].mesh);
            trafficLightObjects.splice(i, 1);
        }
    }
}

// ======================== ROAD SIGN HELPERS ========================
function spawnRoadSignsAhead() {
    const lookAhead = state.dist + 200;
    while (nextRoadSignZ < lookAhead) {
        const limits = [60, 90, 120];
        const limit = limits[Math.floor(Math.random()*limits.length)];
        const signFns = {60: makeRoadSign60, 90: makeRoadSign90, 120: makeRoadSign120};
        const sign = signFns[limit]();
        const side = roadSignSideLeft ? -1 : 1;
        sign.position.set(side * (ROAD_W/2 + 1.0), 0, nextRoadSignZ);
        if (side > 0) sign.rotation.y = Math.PI;
        scene.add(sign);
        roadSignObjects.push({ mesh: sign, z: nextRoadSignZ, limit: limit, checked: false });
        roadSignSideLeft = !roadSignSideLeft;
        nextRoadSignZ += ROAD_SIGN_SPACING;
    }
}

// Проверка превышения скорости у знаков (только в режиме Погоня)
function checkSpeedSignViolation() {
    if (state.mode !== 'chase') return;
    if (state.policeActive || state.policeRespawnPending) return; // полиция уже гонится
    for (let i = 0; i < roadSignObjects.length; i++) {
        const s = roadSignObjects[i];
        if (s.checked) continue;
        // Игрок проехал знак
        if (state.dist > s.z + 5) {
            s.checked = true;
            // Превышение скорости?
            if (state.speed > s.limit * 1.2) { // 20% превышения = полиция
                // Спавним полицию!
                state.policeActive = true;
                policeCar = buildPoliceCar();
                state.policeZ = state.dist - 50;
                state.policeLane = 1;
                state.policeLaneSmooth = 1;
                state.policeSpeed = state.speed * 0.8;
                policeCar.position.set(LANE_X[1], 0, state.policeZ);
                scene.add(policeCar);
                sfx.startSiren();
                state.policeChaseStartDist = state.dist;
                showBiome('🚨 ПРЕВЫШЕНИЕ СКОРОСТИ!');
                return;
            }
        }
    }
}

function cleanupRoadSigns() {
    for (let i = roadSignObjects.length - 1; i >= 0; i--) {
        if (roadSignObjects[i].z < state.dist - 30) {
            scene.remove(roadSignObjects[i].mesh);
            roadSignObjects.splice(i, 1);
        }
    }
}

// ======================== NOS FLAME ========================
function spawnNosFlame(carPos) {
    if (isMobile) return;
    for (let i = 0; i < 2; i++) {
        const size = 0.04 + Math.random() * 0.06;
        const geo = new THREE.SphereGeometry(size, 3, 2);
        const colors = [0x00B0FF, 0x40C4FF, 0x0091EA, 0x00E5FF, 0x2962FF];
        const mat = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random()*colors.length)],
            transparent: true, opacity: 0.8, depthWrite: false
        });
        const m = new THREE.Mesh(geo, mat);
        const pipe = Math.random() < 0.5 ? -0.35 : 0.35;
        m.position.set(
            carPos.x + pipe + (Math.random()-0.5)*0.1,
            carPos.y + 0.3 + Math.random()*0.15,
            carPos.z - 2.5 - Math.random()*0.3
        );
        const vel = new THREE.Vector3(
            (Math.random()-0.5)*2,
            Math.random()*3,
            -8 - Math.random()*12
        );
        nosParticles.push({ mesh:m, vel:vel, life:0.3+Math.random()*0.3 });
        scene.add(m);
    }
}

function updateNosParticles(dt) {
    for (let i = nosParticles.length - 1; i >= 0; i--) {
        const p = nosParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
            nosParticles.splice(i, 1); continue;
        }
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.material.opacity = p.life * 2;
        p.mesh.scale.multiplyScalar(1 + dt * 3);
        p.vel.y += dt * 2;
    }
}


// ======================== TRAIN SYSTEM ========================
let trainActive = false;
let trainZ = 0;
let trainSpeed = 0;
let trainGroup = null;
let trainDesertStart = 0;
let trainSpawned = false;
const TRAIN_X = ROAD_W / 2 + 18;
const trainSmokes = [];

// Railroad tie pool
const railTies = [];
const RAIL_TIE_COUNT = 80;
const RAIL_TIE_SPACING = 1.5;
const railTieMat = M(0x3E2723);
const railMat = M(0x888888);
let railLeftMesh = null;
let railRightMesh = null;

function initRailTies() {
    const tieGeo = new THREE.BoxGeometry(3.0, 0.1, 0.2);
    for (let i = 0; i < RAIL_TIE_COUNT; i++) {
        const tie = new THREE.Mesh(tieGeo, railTieMat);
        tie.position.set(TRAIN_X, 0.02, 0);
        tie.visible = false;
        tie.receiveShadow = true;
        scene.add(tie);
        railTies.push(tie);
    }
    // Two long rail meshes
    const railGeo = new THREE.BoxGeometry(0.1, 0.12, 1200);
    railLeftMesh = new THREE.Mesh(railGeo, railMat);
    railLeftMesh.position.set(TRAIN_X - 0.9, 0.08, 0);
    railLeftMesh.visible = false;
    railLeftMesh.receiveShadow = true;
    scene.add(railLeftMesh);
    railRightMesh = new THREE.Mesh(railGeo, railMat);
    railRightMesh.position.set(TRAIN_X + 0.9, 0.08, 0);
    railRightMesh.visible = false;
    railRightMesh.receiveShadow = true;
    scene.add(railRightMesh);
}
initRailTies();

function makeTrainLocomotive() {
    const g = new THREE.Group();
    // Body
    const bodyMat = M(0x1a1a2e);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 8), bodyMat).translateY(2.0));
    // Cabin on top-rear
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.4, 2.5), M(0x222244)).translateY(4.0).translateZ(-2.0));
    // Cabin windows
    const glassMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.6, 0.08), glassMat).translateY(4.2).translateZ(-0.74));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 2.3), glassMat).translateX(1.16).translateY(4.2).translateZ(-2.0));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 2.3), glassMat).translateX(-1.16).translateY(4.2).translateZ(-2.0));
    // Smokestack on top-front
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8), M(0x333333)).translateY(4.1).translateZ(2.5));
    // Smokestack cap
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.25, 0.3, 8), M(0x444444)).translateY(4.85).translateZ(2.5));
    // Wheels - 6 along the bottom
    const wheelMat = M(0x222222);
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
    [-2.5, 0, 2.5].forEach(z => {
        [-1.35, 1.35].forEach(x => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.z = Math.PI / 2;
            w.position.set(x, 0.5, z);
            g.add(w);
        });
    });
    // Cow catcher (front wedge)
    const cowGeo = new THREE.BufferGeometry();
    const cv = new Float32Array([
        -1.25, 0.3, 4.0,  1.25, 0.3, 4.0,  1.25, 1.0, 4.0,  -1.25, 1.0, 4.0,
        -0.6, 0.1, 5.5,   0.6, 0.1, 5.5,    0.6, 0.5, 5.5,   -0.6, 0.5, 5.5,
    ]);
    const ci = [0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7, 4,5,6,4,6,7, 0,2,1,0,3,2];
    cowGeo.setAttribute('position', new THREE.BufferAttribute(cv, 3));
    cowGeo.setIndex(ci);
    cowGeo.computeVertexNormals();
    g.add(new THREE.Mesh(cowGeo, M(0x444444)));
    // Headlight on front
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), ME(0xffffaa, 0.8)).translateY(2.5).translateZ(4.05));
    // Red stripe
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.15, 8.02), M(0x8B0000)).translateY(1.2));
    return g;
}

function makeTrainCar() {
    const g = new THREE.Group();
    const carColors = [0x5D4037, 0xB71C1C, 0x1B5E20, 0x1565C0, 0x424242];
    const carColor = carColors[Math.floor(Math.random() * carColors.length)];
    // Body
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 7), M(carColor)).translateY(1.8));
    // Frame underneath
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 7.2), M(0x333333)).translateY(0.4));
    // Wheels - 4
    const wheelMat = M(0x222222);
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
    [-2.2, 2.2].forEach(z => {
        [-1.35, 1.35].forEach(x => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.z = Math.PI / 2;
            w.position.set(x, 0.4, z);
            g.add(w);
        });
    });
    // Edge trim
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.08, 7.02), M(0x222222)).translateY(3.05));
    return g;
}

function spawnTrain() {
    if (trainGroup) {
        scene.remove(trainGroup);
    }
    trainGroup = new THREE.Group();
    // Locomotive
    const loco = makeTrainLocomotive();
    loco.position.z = 0;
    trainGroup.add(loco);
    // 4-6 freight cars behind
    const carCount = 4 + Math.floor(Math.random() * 3);
    let carZ = -9;
    for (let i = 0; i < carCount; i++) {
        const car = makeTrainCar();
        car.position.z = carZ;
        trainGroup.add(car);
        carZ -= 8;
    }
    trainGroup.position.set(TRAIN_X, 0, state.dist - 20);
    trainZ = state.dist - 20;
    trainSpeed = state.speed * 0.95;
    scene.add(trainGroup);
    trainGroup.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
}

function removeTrain() {
    if (trainGroup) {
        scene.remove(trainGroup);
        trainGroup = null;
    }
    trainActive = false;
    trainSpawned = false;
    trainSmokes.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); });
    trainSmokes.length = 0;
    railTies.forEach(t => { t.visible = false; });
    if (railLeftMesh) railLeftMesh.visible = false;
    if (railRightMesh) railRightMesh.visible = false;
}

function updateTrain(dt) {
    if (isMobile) return;
    const currentBiome = BIOMES[state.biomeIdx];
    const isDesert = currentBiome.env === 'canyon';

    if (isDesert && !trainActive) {
        if (!trainSpawned) {
            trainDesertStart = state.dist;
            trainSpawned = true;
        }
        if (state.dist - trainDesertStart > 100 && !trainActive) {
            trainActive = true;
            spawnTrain();
        }
    }

    if (!isDesert && trainActive) {
        removeTrain();
        return;
    }
    if (!isDesert && trainSpawned && !trainActive) {
        trainSpawned = false;
    }

    if (!trainActive || !trainGroup) return;

    // Update train speed to roughly match player
    trainSpeed += (state.speed * 0.95 - trainSpeed) * dt * 2;
    const trainMove = trainSpeed * dt * 0.5;
    trainZ += trainMove;
    trainGroup.position.z = trainZ;
    trainGroup.position.x = TRAIN_X;

    // Railroad ties - recycle like road lines
    railTies.forEach((tie, i) => {
        tie.visible = true;
        const baseZ = i * RAIL_TIE_SPACING;
        const rel = ((state.dist - baseZ) % (RAIL_TIE_COUNT * RAIL_TIE_SPACING) + (RAIL_TIE_COUNT * RAIL_TIE_SPACING)) % (RAIL_TIE_COUNT * RAIL_TIE_SPACING);
        tie.position.z = state.dist - rel + (RAIL_TIE_COUNT * RAIL_TIE_SPACING) * 0.7;
        tie.position.x = TRAIN_X;
        tie.position.y = 0.02;
    });

    // Rail meshes follow player
    if (railLeftMesh) {
        railLeftMesh.visible = true;
        railLeftMesh.position.z = state.dist + 180;
        railLeftMesh.position.x = TRAIN_X - 0.9;
    }
    if (railRightMesh) {
        railRightMesh.visible = true;
        railRightMesh.position.z = state.dist + 180;
        railRightMesh.position.x = TRAIN_X + 0.9;
    }

    // Smoke particles from smokestack
    if (Math.random() < dt * 3) {
        const smokeGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 4, 3);
        const smokeMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
        const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
        smokeMesh.position.set(TRAIN_X + (Math.random() - 0.5) * 0.3, 5.0, trainZ + 2.5 + (Math.random() - 0.5) * 0.3);
        scene.add(smokeMesh);
        trainSmokes.push({
            mesh: smokeMesh,
            vel: new THREE.Vector3((Math.random() - 0.5) * 1, 2 + Math.random() * 2, (Math.random() - 0.5) * 1),
            life: 1.5 + Math.random() * 1.0
        });
    }

    // Update smoke particles
    for (let i = trainSmokes.length - 1; i >= 0; i--) {
        const s = trainSmokes[i];
        s.life -= dt;
        if (s.life <= 0) {
            scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose();
            trainSmokes.splice(i, 1); continue;
        }
        s.mesh.position.addScaledVector(s.vel, dt);
        const expand = 1 + (2.5 - s.life) * 2;
        s.mesh.scale.set(expand, expand, expand);
        s.mesh.material.opacity = Math.max(0, s.life * 0.3);
    }
}


// ======================== GAME LOGIC ========================
function resetGame() {
    Object.assign(state, {
        score:0, coins:0, speed:0, lane:1, targetLane:1, laneSmooth:1, dist:0,
        oTimer:0, cTimer:0, eTimer:0, bTimer:0, biomeIdx:0, biomeProg:0,
        combo:0, comboTimer:0, nearMissTimer:0, shakeAmount:0,
        boosted:false, boostTimer:0, dodged:0, braking:false,
        nosUseCount:0, brakeDodges:0, duelWon:false,
        usedSecondLife:false,
        weather:'clear',
        crashing:false, crashTimer:0, crashTitle:'',
        crashCarY:0, crashCarRotX:0,
        invincible:false, invincibleTimer:0,
        wasBraking:false,
        policeZ:0, policeActive:false, policeLane:1, policeLaneSmooth:1,
        policeTimer:0, policeSpeed:0,
        policeRespawnDist:0, policeRespawnPending:false,
        policeChaseStartDist:0,
        spikeStrips:[], spikeTimer:0, tireDamaged:false, tireDamageTimer:0,
        rivalZ:0, rivalLane:1, rivalLaneSmooth:1, rivalSpeed:0,
        rivalNos:false, rivalNosTimer:0, rivalNosCD:0,
        duelFinish:2000,
    });
    // Clean crash particles
    if (state.crashShards) { state.crashShards.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); }); }
    if (state.crashSmokes) { state.crashSmokes.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); }); }
    state.crashShards = []; state.crashSmokes = [];
    // Reset weather
    weatherParticles.setWeather('clear');
    if (ui.weatherIcon) ui.weatherIcon.textContent = '';
    state.obstacles.forEach(o=>scene.remove(o.mesh));
    state.coinObjs.forEach(o=>scene.remove(o.mesh));
    state.envObjs.forEach(o=>scene.remove(o.mesh));
    state.boosts.forEach(o=>scene.remove(o.mesh));
    lampObjects.forEach(o=>scene.remove(o.mesh));
    trafficLightObjects.forEach(o=>scene.remove(o.mesh));
    roadSignObjects.forEach(o=>scene.remove(o.mesh));
    state.obstacles=[]; state.coinObjs=[]; state.envObjs=[]; state.boosts=[];
    lampObjects.length=0; nextLampZ=0; lampSideLeft=true;
    trafficLightObjects.length=0; nextTrafficLightZ=0;
    roadSignObjects.length=0; nextRoadSignZ=0; roadSignSideLeft=true;
    particles.sparks.forEach(s=>{scene.remove(s.m);s.m.geometry.dispose();s.m.material.dispose();});
    particles.sparks=[];
    nosParticles.forEach(p=>{scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();});
    nosParticles.length=0;

    // Remove police and rival if present
    if (policeCar) { scene.remove(policeCar); policeCar = null; }
    if (rivalCar) { scene.remove(rivalCar); rivalCar = null; }

    // Remove spike strips
    if (state.spikeStrips) {
        state.spikeStrips.forEach(s => scene.remove(s.mesh));
    }
    state.spikeStrips = [];

    // Remove train
    removeTrain();

    // Rebuild player car with garage selection
    rebuildPlayerCar();
    playerCar.position.set(LANE_X[1],0,0); playerCar.rotation.set(0,0,0);
    biomeTo = BIOMES[0]; biomeFrom = BIOMES[0]; biomeTransition = 0;
    applyBiomeInstant(BIOMES[0]); showBiome(BIOMES[0].name);
    headL.intensity=0; headR.intensity=0;

    // Cleanup fuel canisters
    state.fuelCanisters.forEach(o=>scene.remove(o.mesh));
    state.fuelCanisters = [];
    state.fuel = 100;
    state.fuelTimer = 0;

    // Hide mode-specific UI
    ui.chaseUI.style.display = 'none';
    ui.duelUI.style.display = 'none';
    ui.fuelUI.style.display = 'none';
    ui.fuelWarning.style.opacity = '0';
    if (ui.secondLife) ui.secondLife.style.display = 'none';

    // Setup mode-specific things
    if (state.mode === 'chase') {
        ui.chaseUI.style.display = 'block';
    } else if (state.mode === 'duel') {
        ui.duelUI.style.display = 'block';
        rivalCar = buildRivalCar();
        rivalCar.position.set(LANE_X[2], 0, 0);
        scene.add(rivalCar);
        state.rivalZ = 0;
        state.rivalLane = 2;
        state.rivalLaneSmooth = 2;
        state.rivalSpeed = 0;
        state.rivalNosCD = 5;
    } else if (state.mode === 'fuel') {
        ui.fuelUI.style.display = 'block';
        state.fuel = 100;
    }
}

let baseFogNear = 60, baseFogFar = 200;
let baseGroundColor = 0x4CAF50;
let baseRoadMetalness = 0.0;

// Плавный переход между биомами
let biomeTransition = 0; // 0 = переход завершён, >0 = идёт переход
let biomeTransDuration = 4.0; // секунды на переход
let biomeFrom = null; // предыдущий биом
let biomeTo = null; // целевой биом
const _colA = new THREE.Color();
const _colB = new THREE.Color();
const _colMix = new THREE.Color();

function lerpColors(a, b, t) {
    _colA.set(a); _colB.set(b); _colMix.copy(_colA).lerp(_colB, t);
    return _colMix;
}

function applyBiome(b) {
    // Запускаем плавный переход
    biomeFrom = biomeTo || b;
    biomeTo = b;
    biomeTransition = biomeTransDuration;
    baseFogNear = b.fogN;
    baseFogFar = b.fogF;
    baseGroundColor = b.ground;
    roadMat.metalness = baseRoadMetalness;
}

function applyBiomeInstant(b) {
    scene.fog = null;
    scene.background = new THREE.Color(b.sky);
    ambLight.color.set(b.ambient);
    dirLight.color.set(b.dir); dirLight.intensity = b.dirI;
    groundMat.color.set(b.ground);
    hemiLight.color.set(b.sky); hemiLight.groundColor.set(b.ground);
    renderer.toneMappingExposure = b.dirI > 0.5 ? 1.1 : 0.7;
    const isNight = b.dirI < 0.6;
    headL.intensity = isNight ? 8 : 0;
    headR.intensity = isNight ? 8 : 0;
    headL.distance = isNight ? 50 : 30;
    headR.distance = isNight ? 50 : 30;
}

function updateBiomeTransition(dt) {
    if (biomeTransition <= 0 || !biomeFrom || !biomeTo) return;
    biomeTransition -= dt;
    const t = Math.max(0, 1 - biomeTransition / biomeTransDuration); // 0→1

    // Плавно интерполируем все цвета
    scene.background = lerpColors(biomeFrom.sky, biomeTo.sky, t).clone();
    ambLight.color.copy(lerpColors(biomeFrom.ambient, biomeTo.ambient, t));
    dirLight.color.copy(lerpColors(biomeFrom.dir, biomeTo.dir, t));
    dirLight.intensity = biomeFrom.dirI + (biomeTo.dirI - biomeFrom.dirI) * t;
    groundMat.color.copy(lerpColors(biomeFrom.ground, biomeTo.ground, t));
    hemiLight.color.copy(lerpColors(biomeFrom.sky, biomeTo.sky, t));
    hemiLight.groundColor.copy(lerpColors(biomeFrom.ground, biomeTo.ground, t));
    renderer.toneMappingExposure = (biomeFrom.dirI > 0.5 ? 1.1 : 0.7) + ((biomeTo.dirI > 0.5 ? 1.1 : 0.7) - (biomeFrom.dirI > 0.5 ? 1.1 : 0.7)) * t;

    // Фары плавно
    const nightFrom = biomeFrom.dirI < 0.6 ? 1 : 0;
    const nightTo = biomeTo.dirI < 0.6 ? 1 : 0;
    const nightT = nightFrom + (nightTo - nightFrom) * t;
    headL.intensity = nightT * 8;
    headR.intensity = nightT * 8;
    headL.distance = 30 + nightT * 20;
    headR.distance = 30 + nightT * 20;

    if (biomeTransition <= 0) {
        biomeTransition = 0;
        applyBiomeInstant(biomeTo);
    }
}

function applyWeather(type) {
    state.weather = type;
    weatherParticles.setWeather(type);
    if (ui.weatherIcon) ui.weatherIcon.textContent = WEATHER_ICONS[type] || '';

    // Reset road/ground to biome defaults first
    roadMat.metalness = 0;
    groundMat.color.set(baseGroundColor);

    if (type === 'rain') {
        roadMat.metalness = 0.95;
    } else if (type === 'snow') {
        const gc = new THREE.Color(baseGroundColor);
        gc.lerp(new THREE.Color(0xeeeeff), 0.5);
        groundMat.color.copy(gc);
    }
}

function spawnObs() {
    const colors = [0xD32F2F,0xE65100,0x1565C0,0xCFD8DC,0x7B1FA2,0x00838F,0xF9A825,0x2E7D32];
    const z = state.dist+140+Math.random()*40;

    // Проверяем какие полосы уже заняты на этой дистанции (±15м)
    const occupiedLanes = new Set();
    for (let i = 0; i < state.obstacles.length; i++) {
        const o = state.obstacles[i];
        if (Math.abs(o.mesh.position.z - z) < 15) {
            occupiedLanes.add(o.lane);
        }
    }

    // Находим свободные полосы
    const freeLanes = [0,1,2].filter(l => !occupiedLanes.has(l));
    if (freeLanes.length <= 1) return; // ВСЕГДА оставляем минимум 1 свободную полосу

    // Выбираем полосу из свободных
    const lane = freeLanes[Math.floor(Math.random()*freeLanes.length)];
    const isTruck = Math.random()<0.15;
    const mesh = isTruck ? buildTruck() : buildCar(colors[Math.floor(Math.random()*colors.length)]);
    mesh.position.set(LANE_X[lane],0,z);
    mesh.rotation.y = 0;
    const ownSpeed = 40 + Math.random() * 40;
    scene.add(mesh);
    state.obstacles.push({mesh:mesh, lane:lane, z:z, passed:false, speedFactor:ownSpeed});

    // Иногда вторая машина — но ТОЛЬКО если останется хотя бы 1 свободная полоса
    const remainingFree = freeLanes.filter(l => l !== lane);
    if (state.speed>70 && Math.random()<0.25 && remainingFree.length >= 2) {
        // Берём одну из оставшихся, но оставляем 1 свободную
        const lane2 = remainingFree[Math.floor(Math.random()*remainingFree.length)];
        const mesh2 = buildCar(colors[Math.floor(Math.random()*colors.length)]);
        const z2 = z+4+Math.random()*6;
        mesh2.position.set(LANE_X[lane2],0,z2);
        mesh2.rotation.y = 0;
        const ownSpeed2 = 40 + Math.random() * 40;
        scene.add(mesh2);
        state.obstacles.push({mesh:mesh2, lane:lane2, z:z2, passed:false, speedFactor:ownSpeed2});
    }
}

function spawnCoin() {
    const lane=Math.floor(Math.random()*3);
    const mesh=makeCoin3D();
    mesh.position.set(LANE_X[lane],1.2,state.dist+90+Math.random()*40);
    scene.add(mesh); state.coinObjs.push({mesh:mesh,lane:lane,z:mesh.position.z});
}

function spawnBoost() {
    const lane=Math.floor(Math.random()*3);
    const mesh=makeSpeedBoost();
    mesh.position.set(LANE_X[lane],0.8,state.dist+95+Math.random()*30);
    scene.add(mesh); state.boosts.push({mesh:mesh,lane:lane,z:mesh.position.z});
}

function spawnFuelCanister() {
    // Канистра спавнится в "неудобной" полосе — чаще НЕ в текущей полосе игрока
    let lane;
    if (Math.random() < 0.7) {
        // 70% — в другой полосе (нужно рисковать)
        const options = [0,1,2].filter(l => l !== state.targetLane);
        lane = options[Math.floor(Math.random()*options.length)];
    } else {
        lane = Math.floor(Math.random()*3);
    }
    const mesh = makeFuelCanister();
    const z = state.dist + 100 + Math.random()*40;
    mesh.position.set(LANE_X[lane], 0.6, z);
    scene.add(mesh);
    state.fuelCanisters.push({mesh, lane, z});
}

function updateFuelMode(dt, playerX) {
    // Расход бензина пропорционален скорости
    const fMult = 1 - 0.1 * (garage.upgrades.tank - 1);
    const consumption = (state.speed / 130) * 8 * dt * fMult;
    state.fuel = Math.max(0, state.fuel - consumption);

    // NOS жрёт больше бензина
    if (state.boosted) state.fuel = Math.max(0, state.fuel - dt * 5);

    // Спавн канистр — чем меньше топлива, тем реже (на грани!)
    state.fuelTimer += dt * 1000;
    const fuelSpawnInterval = state.fuel < 30 ? 4000 : state.fuel < 50 ? 3000 : 5000;
    if (state.fuelTimer > fuelSpawnInterval) {
        spawnFuelCanister();
        state.fuelTimer = 0;
    }

    // Обновление канистр
    const t = Date.now() * 0.001;
    for (let i = state.fuelCanisters.length - 1; i >= 0; i--) {
        const c = state.fuelCanisters[i];
        c.mesh.rotation.y += dt * 3;
        c.mesh.position.y = 0.6 + Math.sin(t * 3 + c.z * 0.1) * 0.15;
        const ring = c.mesh.getObjectByName('fuelRing');
        if (ring) { ring.rotation.x = t * 2; ring.rotation.z = t; }

        if (c.mesh.position.z < state.dist - 15) {
            scene.remove(c.mesh); state.fuelCanisters.splice(i, 1); continue;
        }
        // Подбор
        if (Math.abs(playerX - c.mesh.position.x) < 2.2 && Math.abs(state.dist - c.mesh.position.z) < 2.5) {
            state.fuel = Math.min(100, state.fuel + 25); // +25% бензина
            sfx.coin(); // звук подбора
            particles.burst(c.mesh.position.clone(), 8, 0x4CAF50);
            scene.remove(c.mesh); state.fuelCanisters.splice(i, 1);
        }
    }

    // UI
    ui.fuelBar.style.width = state.fuel + '%';
    // Цвет шкалы
    if (state.fuel < 20) {
        ui.fuelBar.style.background = '#FF1744';
        ui.fuelWarning.style.opacity = '1';
    } else if (state.fuel < 40) {
        ui.fuelBar.style.background = 'linear-gradient(90deg, #FF1744, #FF9100)';
        ui.fuelWarning.style.opacity = '0';
    } else {
        ui.fuelBar.style.background = 'linear-gradient(90deg, #FF9100, #4CAF50)';
        ui.fuelWarning.style.opacity = '0';
    }

    // Game over — бензин кончился
    if (state.fuel <= 0) {
        gameOver('БЕНЗИН КОНЧИЛСЯ!');
    }
}

function spawnE() {
    const b=BIOMES[state.biomeIdx];
    const side=Math.random()<0.5?-1:1;
    const result=spawnEnvObject(b.env);
    const mesh=result.mesh;
    const cat=result.cat;
    const z=state.dist+70+Math.random()*60;

    // City biome: buildings very close to road, always both sides
    if (b.env === 'city' && cat === 'building') {
        const xOff = ROAD_W/2 + 3 + Math.random()*2;
        mesh.position.set(-xOff, 0, z);
        scene.add(mesh); state.envObjs.push({mesh:mesh, z:z});
        // Second building on opposite side
        const result2 = spawnEnvObject('city');
        if (result2.cat === 'building') {
            const mesh2 = result2.mesh;
            const z2 = z + (Math.random()-0.5)*5;
            mesh2.position.set(xOff, 0, z2);
            scene.add(mesh2); state.envObjs.push({mesh:mesh2, z:z2});
        }
        return;
    }

    let xOff;
    switch(cat) {
        case 'tree': xOff=ROAD_W/2+8+Math.random()*15; break;
        case 'bush': xOff=ROAD_W/2+8+Math.random()*15; break;
        case 'building': xOff=ROAD_W/2+10+Math.random()*8; break;
        case 'fence': xOff=ROAD_W/2+5+Math.random()*3; break;
        case 'barrier': xOff=ROAD_W/2+1+Math.random()*1; break;
        case 'rock': xOff=ROAD_W/2+7+Math.random()*15; break;
        case 'billboard': xOff=ROAD_W/2+12+Math.random()*5; break;
        case 'sign': xOff=ROAD_W/2+5+Math.random()*3; break;
        default: xOff=ROAD_W/2+8+Math.random()*15; break;
    }
    mesh.position.set(side*xOff,0,z);
    scene.add(mesh); state.envObjs.push({mesh:mesh,z:z});
}

function addCoinsToWallet(coins) {
    garage.wallet += coins;
    saveGarage();
}

function startCrashAnimation(title) {
    state.crashing = true;
    state.crashTimer = 0;
    state.crashTitle = title || 'АВАРИЯ';
    state.crashCarY = 0;
    state.crashCarRotX = 0;
    sfx.crash();

    // Spawn glass shards (15 small transparent blue planes) — у машины, разлетаются вверх/стороны
    state.crashShards = [];
    for (let i = 0; i < 15; i++) {
        const geo = new THREE.PlaneGeometry(0.08 + Math.random()*0.08, 0.06 + Math.random()*0.06);
        const mat = new THREE.MeshBasicMaterial({color:0x88ccff, transparent:true, opacity:0.5, side:THREE.DoubleSide, depthWrite:false});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(playerCar.position).add(new THREE.Vector3(
            (Math.random()-0.5)*2, 1.0 + Math.random()*1.0, (Math.random()-0.5)*2
        ));
        const vel = new THREE.Vector3(
            (Math.random()-0.5)*8, 4 + Math.random()*5, (Math.random()-0.5)*4
        );
        scene.add(mesh);
        state.crashShards.push({mesh, vel, life:1.2});
    }
    // Spawn smoke (5 gray spheres) — маленькие, от машины вверх
    state.crashSmokes = [];
    for (let i = 0; i < 5; i++) {
        const geo = new THREE.SphereGeometry(0.15, 4, 3);
        const mat = new THREE.MeshBasicMaterial({color:0x666666, transparent:true, opacity:0.4, depthWrite:false});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(playerCar.position).add(new THREE.Vector3(
            (Math.random()-0.5)*1.0, 0.8, (Math.random()-0.5)*1.0
        ));
        const vel = new THREE.Vector3(
            (Math.random()-0.5)*1, 2 + Math.random()*2, (Math.random()-0.5)*1
        );
        scene.add(mesh);
        state.crashSmokes.push({mesh, vel, life:1.5, startScale:1});
    }
}

function finishCrashAndShowResult() {
    const title = state.crashTitle;
    const isCrash = (title === 'АВАРИЯ');

    // Check second life for crash only (not police/fuel/duel)
    if (isCrash && !state.usedSecondLife) {
        state.phase = 'secondlife';
        if (ui.secondLife) ui.secondLife.style.display = 'flex';
        return;
    }

    showGameOverScreen(title);
}

function showGameOverScreen(title) {
    state.phase='gameover';
    state.crashing = false;
    ui.hudPauseBtn.style.display='none'; ui.hudMuteBtn.style.display='none';
    sfx.stopEngine(); sfx.stopSiren();
    checkMissions(state);
    const best=parseInt(localStorage.getItem('rr3d_best')||'0');
    const isRec=state.score>best;
    if(isRec) localStorage.setItem('rr3d_best',state.score);
    addCoinsToWallet(state.coins);
    ui.goTitle.textContent = title || 'АВАРИЯ';
    ui.goTitle.style.color = '#FF5252';
    ui.goScore.textContent=state.score;
    ui.goStats.textContent=`Монеты: ${state.coins}  |  Обгоны: ${state.dodged}  |  Локации: ${Math.min(state.biomeIdx+1,BIOMES.length)}`;
    ui.goRecord.innerHTML=isRec?'<div class="new-record">НОВЫЙ РЕКОРД!</div>':`<div class="record">Рекорд: ${best}</div>`;
    ui.gameover.style.display='flex';
}

function gameOver(title) {
    // For crash: start crash animation; for non-crash deaths: also start animation but shorter
    const isCrash = (title === 'АВАРИЯ');
    if (isCrash) {
        startCrashAnimation(title);
    } else {
        // Non-crash gameOver (fuel, police, etc.) — no crash anim, go straight to result
        state.phase='gameover';
        ui.hudPauseBtn.style.display='none'; ui.hudMuteBtn.style.display='none';
        sfx.stopEngine(); sfx.stopSiren(); sfx.crash();
        particles.burst(playerCar.position.clone().add(new THREE.Vector3(0,1,2)), 25);
        checkMissions(state);
        const best=parseInt(localStorage.getItem('rr3d_best')||'0');
        const isRec=state.score>best;
        if(isRec) localStorage.setItem('rr3d_best',state.score);
        addCoinsToWallet(state.coins);
        ui.goTitle.textContent = title || 'АВАРИЯ';
        ui.goTitle.style.color = '#FF5252';
        ui.goScore.textContent=state.score;
        ui.goStats.textContent=`Монеты: ${state.coins}  |  Обгоны: ${state.dodged}  |  Локации: ${Math.min(state.biomeIdx+1,BIOMES.length)}`;
        ui.goRecord.innerHTML=isRec?'<div class="new-record">НОВЫЙ РЕКОРД!</div>':`<div class="record">Рекорд: ${best}</div>`;
        ui.gameover.style.display='flex';
    }
}

function gameWin(title) {
    state.phase='gameover';
    ui.hudPauseBtn.style.display='none'; ui.hudMuteBtn.style.display='none';
    sfx.stopEngine(); sfx.stopSiren(); sfx.victory();
    // Duel win streak
    if (state.mode === 'duel') {
        state.duelWon = true;
        let streak = loadDuelStreak();
        streak++;
        saveDuelStreak(streak);
        const streakMult = Math.min(3, 1 + streak * 0.2);
        const bonusCoins = Math.floor(state.coins * (streakMult - 1));
        state.coins += bonusCoins;
        title = title + ` \uD83D\uDD25 Серия: ${streak} побед! Монеты x${streakMult.toFixed(1)}`;
    }
    checkMissions(state);
    addCoinsToWallet(state.coins);
    ui.goTitle.textContent = title;
    ui.goTitle.style.color = '#76FF03';
    ui.goScore.textContent = state.score;
    ui.goStats.textContent=`Монеты: ${state.coins}  |  Обгоны: ${state.dodged}`;
    const best=parseInt(localStorage.getItem('rr3d_best')||'0');
    const isRec=state.score>best;
    if(isRec) localStorage.setItem('rr3d_best',state.score);
    ui.goRecord.innerHTML=isRec?'<div class="new-record">НОВЫЙ РЕКОРД!</div>':`<div class="record">Рекорд: ${best}</div>`;
    ui.gameover.style.display='flex';
}

function gameLose(title) {
    state.phase='gameover';
    ui.hudPauseBtn.style.display='none'; ui.hudMuteBtn.style.display='none';
    sfx.stopEngine(); sfx.stopSiren(); sfx.defeat();
    // Duel loss — reset streak
    if (state.mode === 'duel') {
        saveDuelStreak(0);
    }
    checkMissions(state);
    addCoinsToWallet(state.coins);
    ui.goTitle.textContent = title;
    ui.goTitle.style.color = '#FF5252';
    ui.goScore.textContent = state.score;
    ui.goStats.textContent=`Монеты: ${state.coins}  |  Обгоны: ${state.dodged}`;
    ui.goRecord.innerHTML = '';
    ui.gameover.style.display='flex';
}

// ======================== SPIKE STRIP MODEL ========================
function makeSpikeStrip() {
    const g = new THREE.Group();
    // Base: flat dark strip across lane
    const baseMat = new THREE.MeshStandardMaterial({color: 0x333333, flatShading: true});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.8), baseMat));
    // Spikes: small triangular cones on top, yellow tips
    const spikeMat = new THREE.MeshStandardMaterial({color: 0xFFD600, flatShading: true});
    for (let x = -1.0; x <= 1.0; x += 0.25) {
        for (let z = -0.25; z <= 0.25; z += 0.25) {
            const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, 0.15, 4),
                spikeMat
            );
            spike.position.set(x, 0.1, z);
            g.add(spike);
        }
    }
    // Warning stripes on base (red)
    const warnMat = new THREE.MeshStandardMaterial({color: 0xFF0000, flatShading: true, emissive: 0xFF0000, emissiveIntensity: 0.3});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.1), warnMat).translateY(0.03).translateZ(0.35));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.1), warnMat).translateY(0.03).translateZ(-0.35));
    return g;
}

function spawnSpikeStrip() {
    // Place on 1-2 random lanes, always leave 1 free
    const lanes = [0,1,2];
    const numStrips = Math.random() < 0.4 ? 2 : 1;
    const chosen = [];
    for (let i = 0; i < numStrips; i++) {
        const idx = Math.floor(Math.random() * lanes.length);
        chosen.push(lanes.splice(idx, 1)[0]);
    }
    const z = state.dist + 120 + Math.random() * 30;
    chosen.forEach(lane => {
        const mesh = makeSpikeStrip();
        mesh.position.set(LANE_X[lane], 0.02, z);
        scene.add(mesh);
        state.spikeStrips.push({mesh, lane, z});
    });
}

// ======================== POLICE CHASE LOGIC ========================
function updatePoliceChase(dt, moveZ, playerX) {
    state.policeTimer += dt;

    // Check if police needs to respawn after crashing
    if (state.policeRespawnPending && state.dist >= state.policeRespawnDist) {
        state.policeRespawnPending = false;
        state.policeActive = true;
        policeCar = buildPoliceCar();
        state.policeZ = state.dist - 30;
        state.policeLane = 1;
        state.policeLaneSmooth = 1;
        state.policeSpeed = state.speed * 0.9;
        policeCar.position.set(LANE_X[1], 0, state.policeZ);
        scene.add(policeCar);
        sfx.startSiren();
    }

    // Полиция появляется при превышении скорости у знака (checkSpeedSignViolation)
    // Или автоматически через 15 сек если игрок ещё не нарушил (чтобы не было скучно)
    if (!state.policeActive && !state.policeRespawnPending && state.policeTimer > 15) {
        state.policeActive = true;
        policeCar = buildPoliceCar();
        state.policeZ = state.dist - 50;
        state.policeLane = 1;
        state.policeLaneSmooth = 1;
        state.policeSpeed = state.speed * 0.8;
        policeCar.position.set(LANE_X[1], 0, state.policeZ);
        scene.add(policeCar);
        sfx.startSiren();
        state.policeChaseStartDist = state.dist;
    }

    // Update spike strips (even when police is not active)
    for (let i = state.spikeStrips.length - 1; i >= 0; i--) {
        const s = state.spikeStrips[i];
        if (s.mesh.position.z < state.dist - 20) {
            scene.remove(s.mesh);
            state.spikeStrips.splice(i, 1);
            continue;
        }
        // Player collision
        const playerXSmooth = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.laneSmooth/2);
        if (!state.tireDamaged && Math.abs(playerXSmooth - s.mesh.position.x) < 2.0 && Math.abs(state.dist - s.mesh.position.z) < 1.5) {
            state.tireDamaged = true;
            state.tireDamageTimer = 10; // 10 seconds of slow driving
            sfx.crash(); // tire pop sound
            state.shakeAmount = 0.3;
            // Remove the strip
            scene.remove(s.mesh);
            state.spikeStrips.splice(i, 1);
        }
    }

    // Tire damage effect
    if (state.tireDamaged) {
        state.tireDamageTimer -= dt;
        state.speed = Math.min(state.speed, 30); // can't go faster than 30
        // Car wobbles
        playerCar.rotation.z += Math.sin(Date.now() * 0.01) * 0.005;
        if (state.tireDamageTimer <= 0) {
            state.tireDamaged = false;
        }
    }

    if (!state.policeActive || !policeCar) return;

    // Police speed rebalance
    const policeTime = state.policeTimer - 5;
    const timePressure = Math.min(policeTime / 90, 1);
    const policeMinSpeed = 90 + timePressure * 20; // 90 -> 110 km/h over time

    // Key mechanic: police is FASTER when player is slow, SLOWER when player is fast
    let targetPoliceSpeed;
    if (state.speed < 60) {
        // Player braking/slow: police rushes to catch up
        targetPoliceSpeed = Math.max(policeMinSpeed, 80);
    } else if (state.speed > 100) {
        // Player going fast: police struggles to keep up but tries
        targetPoliceSpeed = state.speed * (0.96 + timePressure * 0.06); // 96% -> 102%
    } else {
        // Normal speed: police matches closely
        targetPoliceSpeed = state.speed * (0.98 + timePressure * 0.04);
    }

    // If police is far behind (>40m), boost to catch up
    const gap = state.dist - state.policeZ;
    if (gap > 40) targetPoliceSpeed += (gap - 40) * 0.5;
    // If very close (<8m), slight slowdown for drama
    if (gap < 8 && gap > 3) targetPoliceSpeed *= 0.95;

    targetPoliceSpeed = Math.max(40, Math.min(targetPoliceSpeed, 160));
    state.policeSpeed += (targetPoliceSpeed - state.policeSpeed) * dt * 2;

    // Dynamic siren volume based on distance
    const sirenVol = Math.max(0.01, 0.15 - gap * 0.002); // loud when close, quiet when far
    sfx.setSirenVolume(sirenVol);

    // Police follows player lane with delay
    if (state.policeLane !== state.targetLane) {
        if (Math.random() < dt * 1.5) {
            state.policeLane = state.targetLane;
        }
    }
    state.policeLaneSmooth += (state.policeLane - state.policeLaneSmooth) * Math.min(1, dt * 5);

    // Police avoids traffic
    let policeBlocked = false;
    const policeX = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.policeLaneSmooth/2);
    for (let i = 0; i < state.obstacles.length; i++) {
        const o = state.obstacles[i];
        const odx = Math.abs(policeX - o.mesh.position.x);
        const odz = o.mesh.position.z - state.policeZ;
        if (odx < 2.0 && odz > 0 && odz < 12) {
            policeBlocked = true;
            // Police tries to change lane to avoid traffic
            for (let tryL = 0; tryL < 3; tryL++) {
                if (tryL === state.policeLane) continue;
                const tryX = LANE_X[tryL];
                let clear = true;
                for (let j = 0; j < state.obstacles.length; j++) {
                    const o2 = state.obstacles[j];
                    const dz2 = o2.mesh.position.z - state.policeZ;
                    if (Math.abs(tryX - o2.mesh.position.x) < 2.0 && dz2 > 0 && dz2 < 12) { clear = false; break; }
                }
                if (clear) { state.policeLane = tryL; policeBlocked = false; break; }
            }
            break;
        }
    }

    // Small chance police crashes into traffic car
    if (policeBlocked && state.policeSpeed > 70 && Math.random() < dt * 0.15) {
        // Police crashed! Remove this police car
        scene.remove(policeCar);
        policeCar = null;
        state.policeActive = false;
        sfx.stopSiren();
        sfx.crash(); // crash sound

        // Schedule new police car after 100m
        state.policeRespawnDist = state.dist + 100;
        state.policeRespawnPending = true;
        return; // exit updatePoliceChase
    }

    // Move police
    let policeMove;
    if (policeBlocked) {
        policeMove = state.policeSpeed * dt * 0.25;
    } else {
        policeMove = state.policeSpeed * dt * 0.5;
    }
    state.policeZ += policeMove;

    policeCar.position.set(policeX, 0, state.policeZ);
    policeCar.rotation.y = 0;

    // Flash police lights
    const flashPhase = Math.floor(Date.now() / 200) % 2;
    const redMesh = policeCar.getObjectByName('policeRed');
    const blueMesh = policeCar.getObjectByName('policeBlue');
    const redPL = policeCar.getObjectByName('policeRedPL');
    const bluePL = policeCar.getObjectByName('policeBluePL');
    if (redMesh && blueMesh) {
        redMesh.material.emissiveIntensity = flashPhase === 0 ? 2.0 : 0.2;
        blueMesh.material.emissiveIntensity = flashPhase === 1 ? 2.0 : 0.2;
    }
    if (redPL && bluePL) {
        redPL.intensity = flashPhase === 0 ? 4 : 0.3;
        bluePL.intensity = flashPhase === 1 ? 4 : 0.3;
    }

    // UI - distance
    const policeDist = Math.max(0, Math.floor(state.dist - state.policeZ));
    ui.chaseDist.textContent = policeDist;

    // Полиция не может обогнать игрока
    if (state.policeZ > state.dist) {
        state.policeZ = state.dist;
    }

    // Spike strips after 500m of chase
    const chaseDist = state.dist - state.policeChaseStartDist;
    if (chaseDist > 500) {
        state.spikeTimer += dt * 1000;
        const spikeInterval = Math.max(3000, 8000 - chaseDist * 2);
        if (state.spikeTimer > spikeInterval) {
            spawnSpikeStrip();
            state.spikeTimer = 0;
        }
    }

    // Арест — полиция в пределах 4м и рядом по X
    const policeGap = state.dist - state.policeZ;
    if (policeGap <= 4 && state.policeActive && policeCar) {
        const policeXNow = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.policeLaneSmooth/2);
        const catchDx = Math.abs(playerX - policeXNow);
        if (catchDx < 3.5) {
            gameOver('ЗАДЕРЖАН!');
        }
    }
}

// ======================== DUEL RACE LOGIC ========================
function updateDuelRace(dt, moveZ) {
    // Соперник имеет СОБСТВЕННУЮ скорость, не привязанную к игроку
    // Базовая скорость соперника растёт со временем (как и у игрока)
    const raceTime = state.dist / Math.max(state.speed, 1); // примерное время гонки
    // Соперник разгоняется вместе с игроком — привязан к скорости игрока, но с вариацией
    // Win streak makes rival faster
    const duelStreak = loadDuelStreak();
    const rivalStreakMult = 1 + duelStreak * 0.03;
    const rivalBaseSpeed = state.speed * 0.97 * rivalStreakMult; // чуть медленнее базово, but faster with streak
    let targetRivalSpeed = rivalBaseSpeed;

    // NOS — соперник использует чаще и мощнее
    state.rivalNosCD -= dt;
    if (!state.rivalNos && state.rivalNosCD <= 0 && Math.random() < dt * 0.5) {
        state.rivalNos = true;
        state.rivalNosTimer = 3.0;
        state.rivalNosCD = 6 + Math.random() * 4; // чаще NOS
    }
    if (state.rivalNos) {
        state.rivalNosTimer -= dt;
        targetRivalSpeed = rivalBaseSpeed * 1.4; // +40% при NOS
        if (state.rivalNosTimer <= 0) state.rivalNos = false;
    }

    // Если соперник отстаёт — ускоряется (rubber banding, но мягкий)
    const rivalGap = state.dist - state.rivalZ;
    if (rivalGap > 15) targetRivalSpeed += (rivalGap - 15) * 0.3;
    // Если впереди — слегка замедляется чтобы было интересно
    if (rivalGap < -10) targetRivalSpeed *= 0.95;

    state.rivalSpeed += (targetRivalSpeed - state.rivalSpeed) * dt * 2;
    const rivalMove = state.rivalSpeed * dt * 0.5;
    state.rivalZ += rivalMove;

    // Rival AI: dodge traffic
    const rivalX = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.rivalLaneSmooth/2);
    let needDodge = false;
    let dodgeLane = state.rivalLane;
    for (let i = 0; i < state.obstacles.length; i++) {
        const o = state.obstacles[i];
        const odx = Math.abs(rivalX - o.mesh.position.x);
        const odz = o.mesh.position.z - state.rivalZ;
        if (odx < 2.0 && odz > 0 && odz < 20) {
            needDodge = true;
            // Find a clear lane
            for (let tryLane = 0; tryLane < 3; tryLane++) {
                if (tryLane === state.rivalLane) continue;
                let clear = true;
                const tryX = LANE_X[tryLane];
                for (let j = 0; j < state.obstacles.length; j++) {
                    const o2 = state.obstacles[j];
                    const dx2 = Math.abs(tryX - o2.mesh.position.x);
                    const dz2 = o2.mesh.position.z - state.rivalZ;
                    if (dx2 < 2.0 && dz2 > 0 && dz2 < 20) { clear = false; break; }
                }
                if (clear) { dodgeLane = tryLane; break; }
            }
            break;
        }
    }
    if (needDodge && dodgeLane !== state.rivalLane) {
        state.rivalLane = dodgeLane;
    }

    state.rivalLaneSmooth += (state.rivalLane - state.rivalLaneSmooth) * Math.min(1, dt * 8);
    const finalRivalX = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.rivalLaneSmooth/2);

    if (rivalCar) {
        rivalCar.position.set(finalRivalX, 0, state.rivalZ);
        rivalCar.rotation.y = 0;
        rivalCar.rotation.z = -(state.rivalLane - state.rivalLaneSmooth) * 0.15;
    }

    // Коллизия игрока с соперником — полная физика (бок + перед/зад)
    const playerX = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.laneSmooth/2);
    const dxRivalSigned = playerX - finalRivalX; // + = игрок правее
    const adxRival = Math.abs(dxRivalSigned);
    const dzRival = state.dist - state.rivalZ;
    const adzRival = Math.abs(dzRival);

    if (adxRival < 2.5 && adzRival < 4.5) {
        // Боковая коллизия — отталкиваем машины друг от друга
        if (adxRival < 2.5 && adzRival < 4.0) {
            const pushDir = dxRivalSigned > 0 ? 1 : -1;
            const pushForce = (2.5 - adxRival) * 0.15;
            state.laneSmooth = Math.max(0, Math.min(2, state.laneSmooth + pushDir * pushForce));
            // Соперника тоже отталкиваем
            state.rivalLaneSmooth = Math.max(0, Math.min(2, state.rivalLaneSmooth - pushDir * pushForce * 0.5));
            state.shakeAmount = 0.12;
        }

        // Продольная коллизия
        if (adxRival < 2.0) {
            if (dzRival > 0) {
                state.speed = Math.min(state.speed, state.rivalSpeed * 0.95);
                state.dist = Math.min(state.dist, state.rivalZ + 4.5);
            } else {
                state.rivalSpeed = Math.min(state.rivalSpeed, state.speed * 0.95);
                state.rivalZ = Math.min(state.rivalZ, state.dist + 4.5);
            }
        }
    }

    // Update duel UI
    const barWidth = ui.duelUI.offsetWidth - 30;
    const playerPct = Math.min(1, state.dist / state.duelFinish);
    const rivalPct = Math.min(1, state.rivalZ / state.duelFinish);
    ui.duelPlayerMarker.style.left = (playerPct * barWidth) + 'px';
    ui.duelRivalMarker.style.left = (rivalPct * barWidth) + 'px';
    ui.duelDistLabel.textContent = `Ты: ${Math.floor(state.dist)}м  |  Соперник: ${Math.floor(state.rivalZ)}м  /  ${state.duelFinish}м`;

    // Check finish
    if (state.dist >= state.duelFinish) {
        gameWin('ПОБЕДА!');
        return;
    }
    if (state.rivalZ >= state.duelFinish) {
        gameLose('ПРОИГРЫШ!');
        return;
    }
}

// ======================== BRAKE LIGHTS ========================
function updateBrakeLights(isBraking) {
    const bl0 = playerCar.getObjectByName('brakeLight0');
    const bl1 = playerCar.getObjectByName('brakeLight1');
    if (bl0) bl0.material.emissiveIntensity = isBraking ? 2.5 : 0.8;
    if (bl1) bl1.material.emissiveIntensity = isBraking ? 2.5 : 0.8;
}

// ======================== MAIN LOOP ========================
const clock = new THREE.Clock();
let camShakeOff = new THREE.Vector3();

function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);

    // Crash animation phase - still render but skip game logic
    if (state.crashing) {
        state.crashTimer += dt;

        // Animate player car tumble
        const ct = state.crashTimer;
        // Forward flip
        playerCar.rotation.x = ct * Math.PI * 1.5;
        // Fly up then fall
        if (ct < 0.5) {
            state.crashCarY = ct * 6; // up
        } else {
            state.crashCarY = 3 - (ct - 0.5) * 6; // fall
        }
        playerCar.position.y = Math.max(0, state.crashCarY);

        // Camera dramatic zoom and shake
        const shk = Math.max(0, 0.5 - ct * 0.3);
        camera.position.x += (Math.random()-0.5) * shk;
        camera.position.y += (Math.random()-0.5) * shk * 0.5;

        // Update crash shards
        for (let i = state.crashShards.length - 1; i >= 0; i--) {
            const s = state.crashShards[i];
            s.life -= dt;
            if (s.life <= 0) {
                scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose();
                state.crashShards.splice(i, 1); continue;
            }
            s.vel.y -= 15 * dt;
            s.mesh.position.addScaledVector(s.vel, dt);
            s.mesh.rotation.x += dt * 8;
            s.mesh.rotation.z += dt * 6;
            s.mesh.material.opacity = Math.min(0.6, s.life * 0.5);
        }
        // Update crash smokes
        for (let i = state.crashSmokes.length - 1; i >= 0; i--) {
            const s = state.crashSmokes[i];
            s.life -= dt;
            if (s.life <= 0) {
                scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose();
                state.crashSmokes.splice(i, 1); continue;
            }
            s.mesh.position.addScaledVector(s.vel, dt);
            const expand = 1 + (1.5 - s.life) * 3;
            s.mesh.scale.set(expand, expand, expand);
            s.mesh.material.opacity = s.life * 0.35;
        }

        // After 1.5s, show result
        if (state.crashTimer >= 1.5) {
            state.crashing = false;
            playerCar.rotation.x = 0;
            playerCar.position.y = 0;
            finishCrashAndShowResult();
        }

        renderer.render(scene, camera);
        return;
    }

    if (state.phase==='playing') {
        // Controls - lane changes: LEFT arrow = go LEFT on screen (lane index -1), RIGHT arrow = go RIGHT
        if(keys['ArrowLeft']||keys['KeyA']){moveLane(1);keys['ArrowLeft']=false;keys['KeyA']=false;}
        if(keys['ArrowRight']||keys['KeyD']){moveLane(-1);keys['ArrowRight']=false;keys['KeyD']=false;}
        if(laneCD>0) laneCD-=dt*1000;

        // Braking
        const isBraking = keys['ArrowDown'] || keys['KeyS'] || state.braking;
        updateBrakeLights(isBraking);

        // Upgrade-based values
        const upg = garage.upgrades;
        const maxSpeedBase = 130 * (1 + 0.15 * (upg.engine - 1));
        const brakeDecel = 40 * (1 + 0.25 * (upg.brakes - 1));
        const nosDuration = 3 + (upg.nos - 1);
        const nosSpeedMult = 1.3 + 0.05 * (upg.nos - 1);
        const laneSpeed = 10 * (1 + 0.2 * (upg.handling - 1));
        const fuelMult = 1 - 0.1 * (upg.tank - 1);
        const maxSpeedBoosted = maxSpeedBase * nosSpeedMult;

        // Weather speed/brake modifiers
        let weatherBrakeMult = 1.0;
        let weatherSpeedMult = 1.0;
        if (state.weather === 'rain') { weatherBrakeMult = 0.7; }
        else if (state.weather === 'snow') { weatherBrakeMult = 0.6; weatherSpeedMult = 0.9; }

        // Speed
        if (isBraking) {
            state.speed = Math.max(20, state.speed - dt * brakeDecel * weatherBrakeMult);
        } else {
            const accel = state.boosted ? 25 : 5;
            const effectiveMax = (state.boosted ? maxSpeedBoosted : maxSpeedBase) * weatherSpeedMult;
            state.speed = Math.min(state.speed + dt*accel, effectiveMax);
        }
        const moveZ = state.speed*dt*0.5;
        state.dist += moveZ;

        // Boost timer
        if (state.boosted) {
            state.boostTimer -= dt;
            if (state.boostTimer<=0) { state.boosted=false; }
        }

        // Score
        state.score = Math.floor(state.dist*0.4);

        // Engine sound
        sfx.setEngine(state.speed);

        // Lane movement
        state.laneSmooth += (state.targetLane - state.laneSmooth) * Math.min(1, dt*laneSpeed);
        const playerX = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.laneSmooth/2);
        playerCar.position.x = playerX;
        playerCar.position.z = state.dist;
        playerCar.rotation.z = -(state.targetLane-state.laneSmooth)*0.2;
        playerCar.rotation.y = (state.targetLane-state.laneSmooth)*0.06;
        // Slight forward pitch when braking
        playerCar.rotation.x = isBraking ? -0.04 : 0;

        // Camera
        const camTargetX = playerX * 0.3;
        const camTargetY = 2.2 + state.speed*0.008;
        const camTargetZ = state.dist - 5.5 - state.speed*0.015;
        camera.position.x += (camTargetX-camera.position.x)*dt*5;
        camera.position.y += (camTargetY-camera.position.y)*dt*3;
        camera.position.z += (camTargetZ-camera.position.z)*dt*5;
        camera.fov = 55 + state.speed*0.08;
        // Slight camera tilt when braking
        const brakePitch = isBraking ? 0.02 : 0;
        camera.updateProjectionMatrix();

        // Shake
        if (state.shakeAmount>0) {
            camShakeOff.set((Math.random()-0.5)*state.shakeAmount, (Math.random()-0.5)*state.shakeAmount*0.5, 0);
            camera.position.add(camShakeOff);
            state.shakeAmount *= 0.9;
            if (state.shakeAmount<0.01) state.shakeAmount=0;
        }

        camera.lookAt(playerX*0.2, 0.5 - brakePitch*5, state.dist+12+state.speed*0.05);

        // Lights follow
        dirLight.position.set(playerX+8,20,state.dist+15);
        dirLight.target.position.set(playerX,0,state.dist+5);

        // Road & ground follow
        road.position.z=state.dist+500;
        ground.position.z=state.dist+500;

        // Road lines animation
        roadLines.forEach(l => {
            const rel = ((state.dist - l.userData.baseZ) % 100 + 100) % 100;
            l.position.z = state.dist - rel + 70;
        });

        // Edge lines follow
        edgeObjects.forEach(e => { e.position.z = state.dist + 500; });

        // Spawning
        state.oTimer+=dt*1000;
        const spawnI = Math.max(800, 2000-state.score*0.5);
        if(state.oTimer>spawnI){spawnObs();state.oTimer=0;}
        state.cTimer+=dt*1000;
        if(state.cTimer>1500){spawnCoin();state.cTimer=0;}
        state.eTimer+=dt*1000;
        if(state.eTimer>(isMobile?400:180)){spawnE();state.eTimer=0;}
        state.bTimer+=dt*1000;
        if(state.bTimer>8000){spawnBoost();state.bTimer=0;}

        // Biomes (все режимы)
        if (true) {
            state.biomeProg+=dt*state.speed*0.004;
            if(state.biomeProg>10) {
                state.biomeProg=0;
                state.biomeIdx=(state.biomeIdx+1)%BIOMES.length;
                applyBiome(BIOMES[state.biomeIdx]); showBiome(BIOMES[state.biomeIdx].name);
                sfx.biome();
                // Weather change on biome change (30% non-clear)
                if (Math.random() < 0.3) {
                    const nonClear = ['rain','snow','fog'];
                    applyWeather(nonClear[Math.floor(Math.random()*nonClear.length)]);
                } else {
                    applyWeather('clear');
                }
            }
        }

        // Плавный переход биомов
        updateBiomeTransition(dt);

        // Combo decay
        state.comboTimer-=dt;
        if(state.comboTimer<=0 && state.combo>0) { state.combo=0; }

        // Speed particles
        if(state.speed>70 && Math.random()<state.speed*0.003) {
            particles.speedParticle(playerCar.position);
        }

        // NOS flame
        if (state.boosted) {
            spawnNosFlame(playerCar.position);
        }
        updateNosParticles(dt);

        // Flash player car sirens (ambulance, police2)
        if (garage.selectedBody === 'ambulance' || garage.selectedBody === 'police2') {
            const flashP = Math.floor(Date.now() / 200) % 2;
            if (garage.selectedBody === 'ambulance') {
                const sr = playerCar.getObjectByName('sirenRed');
                const sw = playerCar.getObjectByName('sirenWhite');
                if (sr) sr.material.emissiveIntensity = flashP === 0 ? 2.0 : 0.3;
                if (sw) sw.material.emissiveIntensity = flashP === 1 ? 2.0 : 0.3;
            } else {
                const pr = playerCar.getObjectByName('playerPoliceRed');
                const pb = playerCar.getObjectByName('playerPoliceBlue');
                if (pr) pr.material.emissiveIntensity = flashP === 0 ? 2.0 : 0.3;
                if (pb) pb.material.emissiveIntensity = flashP === 1 ? 2.0 : 0.3;
            }
        }

        // Lamps
        spawnLampsAhead();
        cleanupLamps();

        // Traffic lights
        spawnTrafficLightsAhead();
        cleanupTrafficLights();

        // Road signs
        spawnRoadSignsAhead();
        cleanupRoadSigns();

        // Obstacles - move in traffic (slower than player)
        const playerLane = Math.round(state.laneSmooth);
        for (let i=0; i<state.obstacles.length; i++) {
            const o=state.obstacles[i];
            const obsMove = (o.speedFactor || 60) * dt * 0.5;
            o.mesh.position.z += obsMove;
            o.z += obsMove;
        }
        // Traffic collision - rear car can't pass through front car in same lane
        for (let i=0; i<state.obstacles.length; i++) {
            for (let j=i+1; j<state.obstacles.length; j++) {
                const a=state.obstacles[i], b=state.obstacles[j];
                if (a.lane===b.lane) {
                    const dz = Math.abs(a.mesh.position.z - b.mesh.position.z);
                    if (dz < 6) {
                        if (a.mesh.position.z < b.mesh.position.z) {
                            a.speedFactor = Math.min(a.speedFactor, b.speedFactor);
                            a.mesh.position.z = b.mesh.position.z - 6;
                        } else {
                            b.speedFactor = Math.min(b.speedFactor, a.speedFactor);
                            b.mesh.position.z = a.mesh.position.z - 6;
                        }
                    }
                }
            }
        }
        // Remove passed obstacles & collision with player
        for (let i=state.obstacles.length-1; i>=0; i--) {
            const o=state.obstacles[i];
            if(o.mesh.position.z<state.dist-25){scene.remove(o.mesh);state.obstacles.splice(i,1);continue;}
            const dx=Math.abs(playerX-o.mesh.position.x);
            const dz=Math.abs(state.dist-o.mesh.position.z);
            if(dx<2.0 && dz<3.0 && !state.invincible){gameOver('АВАРИЯ');return;}
            // Near miss
            if(!o.passed && o.mesh.position.z<state.dist-3.5) {
                o.passed=true;
                const nearDx = Math.abs(playerX-o.mesh.position.x);
                if(nearDx<3.8) {
                    state.dodged++;
                    state.score+=50;
                    state.combo++;
                    state.comboTimer=3;
                    sfx.nearMiss();
                    showNearMiss();
                    state.shakeAmount=0.06;
                    if(state.combo>1) showCombo(state.combo);
                    // Track brake dodges for mission
                    if (isBraking) state.brakeDodges++;
                }
            }
        }

        // Coins
        const t = Date.now() * 0.001;
        for (let i=state.coinObjs.length-1; i>=0; i--) {
            const c=state.coinObjs[i];
            c.mesh.rotation.y+=dt*5;
            c.mesh.position.y=1.3+Math.sin(t*3+c.z*0.1)*0.3;
            const ring = c.mesh.getObjectByName('coinRing');
            if (ring) {
                ring.rotation.x = t*2;
                ring.rotation.z = t*1.5;
                const pulse = 0.9 + Math.sin(t*6)*0.3;
                ring.scale.set(pulse,pulse,pulse);
            }
            if(c.mesh.position.z<state.dist-10){scene.remove(c.mesh);state.coinObjs.splice(i,1);continue;}
            if(Math.abs(playerX-c.mesh.position.x)<1.8 && Math.abs(state.dist-c.mesh.position.z)<2.5) {
                state.coins++; sfx.coin(); state.score+=25;
                particles.burst(c.mesh.position.clone(), 8, 0xFFD740);
                scene.remove(c.mesh); state.coinObjs.splice(i,1);
            }
        }

        // Boosts
        for (let i=state.boosts.length-1; i>=0; i--) {
            const b=state.boosts[i];
            b.mesh.rotation.y+=dt*6;
            b.mesh.position.y = 0.8 + Math.sin(t*4 + b.z*0.05) * 0.2;
            const r1 = b.mesh.getObjectByName('boostRing1');
            const r2 = b.mesh.getObjectByName('boostRing2');
            if (r1) { r1.rotation.x = t*3; r1.rotation.z = t*2; const s=0.8+Math.sin(t*5)*0.4; r1.scale.set(s,s,s); }
            if (r2) { r2.rotation.x = t*2.5+1; r2.rotation.y = t*3; const s=0.7+Math.sin(t*7)*0.3; r2.scale.set(s,s,s); }
            if(b.mesh.position.z<state.dist-10){scene.remove(b.mesh);state.boosts.splice(i,1);continue;}
            if(Math.abs(playerX-b.mesh.position.x)<1.8 && Math.abs(state.dist-b.mesh.position.z)<2.5) {
                state.boosted=true; state.boostTimer=nosDuration;
                state.nosUseCount++;
                sfx.speedUp(); state.shakeAmount=0.2;
                particles.burst(b.mesh.position.clone(), 12, 0x00E5FF);
                scene.remove(b.mesh); state.boosts.splice(i,1);
            }
        }

        // Env cleanup
        for (let i=state.envObjs.length-1; i>=0; i--) {
            if(state.envObjs[i].mesh.position.z<state.dist-25){scene.remove(state.envObjs[i].mesh);state.envObjs.splice(i,1);}
        }

        // Particles
        particles.update(dt);

        // Train system update
        updateTrain(dt);

        // Mode-specific updates
        if (state.mode === 'chase') {
            checkSpeedSignViolation();
            updatePoliceChase(dt, moveZ, playerX);
        } else if (state.mode === 'duel') {
            updateDuelRace(dt, moveZ);
        } else if (state.mode === 'fuel') {
            updateFuelMode(dt, playerX);
        }

        // Invincibility timer (after second life)
        if (state.invincible) {
            state.invincibleTimer -= dt;
            // Blink player car
            playerCar.visible = Math.floor(state.invincibleTimer * 10) % 2 === 0;
            if (state.invincibleTimer <= 0) {
                state.invincible = false;
                playerCar.visible = true;
            }
        }

        // Brake dodge tracking: if braking and just dodged (near miss)
        if (isBraking && !state.wasBraking) {
            state.wasBraking = true;
        }
        if (!isBraking && state.wasBraking) {
            state.wasBraking = false;
        }

        // Weather update
        weatherParticles.update(dt, playerCar.position);

        // Coin magnet
        const magnetLevel = garage.upgrades.magnet || 1;
        if (magnetLevel > 1) {
            const magnetRange = [0, 0, 3, 5, 8, 12][magnetLevel] || 0;
            for (let i = 0; i < state.coinObjs.length; i++) {
                const c = state.coinObjs[i];
                const cdx = playerX - c.mesh.position.x;
                const cdz = state.dist - c.mesh.position.z;
                const coinDist = Math.sqrt(cdx*cdx + cdz*cdz);
                if (coinDist < magnetRange && coinDist > 0.5) {
                    // Move coin toward player
                    const speed = 10 * dt;
                    c.mesh.position.x += (cdx / coinDist) * speed;
                    c.mesh.position.z += (cdz / coinDist) * speed;
                }
            }
        }

        // UI
        ui.score.textContent=state.score;
        ui.speed.textContent=Math.floor(state.speed);
        ui.coins.textContent=state.coins;
        ui.speedOverlay.style.opacity=Math.max(0,(state.speed-60)/120);
        // Спидометр — стрелка
        updateSpeedometer(state.speed);
    }

    renderer.render(scene,camera);
}

// ======================== GARAGE UI ========================
function updateWalletDisplays() {
    const walletEl = document.getElementById('menu-wallet');
    const garageWalletEl = document.getElementById('garage-wallet');
    if (walletEl) walletEl.textContent = garage.wallet > 0 ? '\uD83E\uDE99 ' + garage.wallet : '';
    if (garageWalletEl) garageWalletEl.textContent = '\uD83E\uDE99 ' + garage.wallet;
}

function renderGarage() {
    updateWalletDisplays();
    // Bodies
    const bodiesEl = document.getElementById('garage-bodies');
    bodiesEl.innerHTML = '';
    BODY_DEFS.forEach(bd => {
        const owned = garage.ownedBodies.includes(bd.id);
        const selected = garage.selectedBody === bd.id;
        const card = document.createElement('div');
        card.className = 'body-card' + (selected ? ' selected' : owned ? ' owned' : '');
        const previewColor = BODY_PREVIEW_COLORS[bd.id] || '#888';
        card.innerHTML = '<div class="car-preview" style="background:' + previewColor + '"></div>' +
            '<div class="car-name">' + bd.name + '</div>' +
            '<div class="car-price">' + (owned ? '\u2713' : '\uD83E\uDE99 ' + bd.price) + '</div>' +
            (owned && !selected ? '<div class="car-action">ВЫБРАТЬ</div>' : '') +
            (!owned ? '<div class="car-action" style="color:#FFD740">КУПИТЬ</div>' : '');
        card.onclick = () => {
            if (selected) return;
            if (owned) {
                garage.selectedBody = bd.id;
                saveGarage();
                renderGarage();
            } else if (garage.wallet >= bd.price) {
                garage.wallet -= bd.price;
                garage.ownedBodies.push(bd.id);
                garage.selectedBody = bd.id;
                saveGarage();
                renderGarage();
            }
        };
        bodiesEl.appendChild(card);
    });

    // Colors
    const colorsEl = document.getElementById('garage-colors');
    colorsEl.innerHTML = '';
    COLOR_DEFS.forEach((cd, i) => {
        const owned = garage.ownedColors.includes(i);
        const selected = garage.selectedColor === i;
        const wrap = document.createElement('div');
        wrap.style.textAlign = 'center';
        const circle = document.createElement('div');
        circle.className = 'color-circle' + (selected ? ' selected' : '') + (!owned ? ' locked' : '');
        circle.style.background = '#' + cd.hex.toString(16).padStart(6, '0');
        circle.onclick = () => {
            if (selected) return;
            if (owned) {
                garage.selectedColor = i;
                saveGarage();
                renderGarage();
            } else if (garage.wallet >= cd.price) {
                garage.wallet -= cd.price;
                garage.ownedColors.push(i);
                garage.selectedColor = i;
                saveGarage();
                renderGarage();
            }
        };
        wrap.appendChild(circle);
        const price = document.createElement('div');
        price.className = 'color-price';
        price.textContent = owned ? (selected ? '\u2713' : cd.name) : '\uD83E\uDE99 ' + cd.price;
        wrap.appendChild(price);
        colorsEl.appendChild(wrap);
    });

    // Upgrades
    const upgEl = document.getElementById('garage-upgrades');
    upgEl.innerHTML = '';
    UPGRADE_DEFS.forEach(ud => {
        const level = garage.upgrades[ud.id];
        const maxLevel = 5;
        const isMax = level >= maxLevel;
        const cost = isMax ? 0 : ud.costs[level - 1];
        const row = document.createElement('div');
        row.className = 'upgrade-row';
        let barsHtml = '';
        for (let i = 1; i <= maxLevel; i++) {
            barsHtml += '<div class="upgrade-bar-seg' + (i <= level ? ' filled' : '') + '"></div>';
        }
        row.innerHTML = '<div class="upgrade-icon">' + ud.icon + '</div>' +
            '<div class="upgrade-info"><div class="upgrade-name">' + ud.name + ' (' + level + '/' + maxLevel + ')</div>' +
            '<div class="upgrade-bars">' + barsHtml + '</div></div>' +
            '<div class="upgrade-cost">' + (isMax ? '' : '\uD83E\uDE99 ' + cost) + '</div>' +
            '<button class="upgrade-btn' + (isMax ? ' maxed' : '') + '">' + (isMax ? 'МАКС' : 'КУПИТЬ') + '</button>';
        const btn = row.querySelector('.upgrade-btn');
        if (!isMax) {
            btn.onclick = () => {
                if (garage.wallet >= cost) {
                    garage.wallet -= cost;
                    garage.upgrades[ud.id] = level + 1;
                    saveGarage();
                    renderGarage();
                }
            };
        }
        upgEl.appendChild(row);
    });
}

function showGarage() {
    renderGarage();
    document.getElementById('garage').style.display = 'flex';
    ui.menu.style.display = 'none';
    showHUD(false);
}

function hideGarage() {
    document.getElementById('garage').style.display = 'none';
    ui.menu.style.display = 'flex';
    updateWalletDisplays();
    updateMenuRecord();
    renderMissions();
}

// ======================== EVENTS ========================
const speedNeedle = document.getElementById('speed-needle');
const speedNumber = document.getElementById('speed-number');
const speedometerEl = document.getElementById('speedometer');

function updateSpeedometer(speed) {
    const maxSpeed = 200;
    const pct = Math.min(speed / maxSpeed, 1);
    // Угол: 0 км/ч = 180° (левая сторона), 200 км/ч = 0° (правая сторона)
    const angle = Math.PI * (1 - pct); // от PI до 0
    const cx = 70, cy = 75, len = 50;
    const nx = cx + Math.cos(angle) * len;
    const ny = cy - Math.sin(angle) * len;
    speedNeedle.setAttribute('x2', nx.toFixed(1));
    speedNeedle.setAttribute('y2', ny.toFixed(1));
    speedNumber.textContent = Math.floor(speed);
    // Цвет стрелки: зелёный → жёлтый → красный
    if (speed > 140) speedNeedle.setAttribute('stroke', '#FF1744');
    else if (speed > 80) speedNeedle.setAttribute('stroke', '#FFEB3B');
    else speedNeedle.setAttribute('stroke', '#4CAF50');
}

const hudControls = document.getElementById('hud-controls');

function showHUD(show) {
    ui.hud.style.display = show ? 'flex' : 'none';
    hudControls.style.display = show ? 'flex' : 'none';
    speedometerEl.style.display = show ? 'block' : 'none';
}

function startGame(mode) {
    sfx.init();
    state.mode = mode;
    resetGame();
    state.phase = 'playing';
    ui.menu.style.display = 'none';
    ui.gameover.style.display = 'none';
    ui.pause.style.display = 'none';
    if (ui.secondLife) ui.secondLife.style.display = 'none';
    document.getElementById('garage').style.display = 'none';
    showHUD(true);
    ui.goTitle.style.color = '#FF5252';
    sfx.startMusic();
}

document.getElementById('btn-endless').onclick = () => startGame('endless');
document.getElementById('btn-chase').onclick = () => startGame('chase');
document.getElementById('btn-duel').onclick = () => startGame('duel');
document.getElementById('btn-fuel').onclick = () => startGame('fuel');
document.getElementById('btn-restart').onclick = () => {
    startGame(state.mode);
};
document.getElementById('btn-back-menu').onclick = () => {
    sfx.stopMusic(); sfx.stopEngine();
    ui.gameover.style.display='none';
    ui.menu.style.display='flex';
    ui.goTitle.style.color = '#FF5252';
    updateMenuRecord();
    updateWalletDisplays();
    renderMissions();
};
document.getElementById('btn-garage').onclick = () => showGarage();
document.getElementById('btn-garage-back').onclick = () => hideGarage();

// Second life buttons
document.getElementById('btn-continue').onclick = () => {
    if (state.phase !== 'secondlife') return;
    state.usedSecondLife = true;
    state.phase = 'playing';
    state.invincible = true;
    state.invincibleTimer = 2;
    state.speed = 50;
    state.crashing = false;
    playerCar.rotation.x = 0;
    playerCar.position.y = 0;
    playerCar.visible = true;
    // Clean remaining crash particles
    state.crashShards.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); });
    state.crashSmokes.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); });
    state.crashShards = [];
    state.crashSmokes = [];
    if (ui.secondLife) ui.secondLife.style.display = 'none';
    sfx.startEngine();
};
document.getElementById('btn-no-continue').onclick = () => {
    if (state.phase !== 'secondlife') return;
    if (ui.secondLife) ui.secondLife.style.display = 'none';
    showGameOverScreen(state.crashTitle);
};
document.getElementById('btn-resume').onclick = () => resumeGame();
document.getElementById('btn-pause-menu').onclick = () => {
    state.phase = 'menu';
    sfx.stopMusic();
    ui.pause.style.display = 'none';
    showHUD(false);
    sfx.stopEngine();
    ui.menu.style.display = 'flex';
    ui.goTitle.style.color = '#FF5252';
    updateMenuRecord();
    updateWalletDisplays();
    renderMissions();
};
ui.hudPauseBtn.onclick = () => pauseGame();
ui.hudMuteBtn.onclick = () => {
    const muted = sfx.toggleMute();
    document.getElementById('mute-icon-on').style.display = muted ? 'none' : 'block';
    document.getElementById('mute-icon-off').style.display = muted ? 'block' : 'none';
};
window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});

// ======================== INIT ========================
updateMenuRecord();
updateWalletDisplays();
renderMissions();
showHUD(false); // скрыть HUD на старте (показано меню)
scene.background=new THREE.Color(BIOMES[0].sky);
biomeTo = BIOMES[0]; biomeFrom = BIOMES[0]; biomeTransition = 0;
applyBiomeInstant(BIOMES[0]);
playerCar.position.set(0,0,0);
camera.position.set(0,4,-8);
camera.lookAt(0,1,10);
loop();
