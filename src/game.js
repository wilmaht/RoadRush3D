import * as THREE from 'three';
import { isMobile } from './core/platform.js';
import { t } from './i18n/index.js';
import { sfx } from './audio/GameAudio.js';
import { WeatherParticles } from './graphics/WeatherParticles.js';
import { Particles } from './graphics/Particles.js';
import { BIOMES, MISSIONS_POOL, WEATHERS, WEATHER_ICONS } from './config/definitions.js';
import { LANE_X, ROAD_W, LAMP_SPACING, LAMP_OFFSET_X, TRAFFIC_LIGHT_SPACING, ROAD_SIGN_SPACING } from './config/constants.js';
import { garage, saveGarage, loadDuelStreak, saveDuelStreak } from './progression/garage.js';
import { loadDailyMissions, saveMissions, checkMissions } from './progression/missions.js';
import { buildCar, buildTruck, buildPoliceCar, buildRivalCar, buildPlayerCar, buildSedan, buildSportsCar, buildAmbulance, buildPoliceCar2 } from './builders/cars.js';
import { makeCoin3D, makeSpeedBoost } from './builders/pickups.js';
import { makeLamp, makeTrafficLight, makeRoadSign60, makeRoadSign90, makeRoadSign120, spawnEnvObject } from './builders/environment.js';
import { initRailTies, removeTrain, updateTrain } from './builders/train.js';
import { initYandexSDK, showRewardedAd, onGameEnd, hasYSDK, notifyReady } from './core/yandex.js';
import { updateWalletDisplays, renderGarage } from './ui/garage.js';
import { modeCars, updateCopMode, updateTimerMode, updateFuelMode, makeSpikeStrip, spawnSpikeStrip, updatePoliceChase, updateDuelRace } from './systems/modes.js';

// Yandex SDK moved to src/core/yandex.js




// renderMissions использует DOM и garage напрямую — остаётся здесь
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
        if (m.claimed) { statusText = '\u2713 ' + t('claimed'); statusCls += 'claimed-text'; }
        else if (m.completed) { statusText = '\u2191 ' + t('claim'); statusCls += 'completed'; }
        else { statusText = t('inProgress'); statusCls += 'pending'; }

        card.innerHTML = '<div class="mission-desc">' + (def.i18n ? t(def.i18n) : def.desc) + '</div>' +
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


// ======================== GAME STATE ========================
const nosParticles = [];
const lampObjects = [];
let nextLampZ = 0;
let lampSideLeft = true;

let nextTrafficLightZ = 0;
const trafficLightObjects = [];

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
    // Cop mode
    criminalZ: 0, criminalLane: 1, criminalLaneSmooth: 1, criminalSpeed: 0, copTimer: 0,
    // Ambulance/Taxi mode
    missionTimer: 0, missionDist: 0,
};

// ======================== RENDERER & SCENE ========================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference:'high-performance', preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

// Police/rival/criminal cars managed by modeCars in systems/modes.js

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
    doubleCoinsBtn: document.getElementById('btn-double-coins'),
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
    copUI: document.getElementById('cop-ui'),
    copDist: document.getElementById('cop-dist'),
    timerUI: document.getElementById('timer-ui'),
    timerIcon: document.getElementById('timer-icon'),
    timerValue: document.getElementById('timer-value'),
    pause: document.getElementById('pause'),
    hud: document.getElementById('hud'),
    hudPauseBtn: document.getElementById('hud-pause-btn'),
    hudMuteBtn: document.getElementById('hud-mute-btn'),
    secondLife: document.getElementById('second-life'),
};

function showBiome(n) { ui.biome.textContent = n; ui.biome.classList.add('show'); setTimeout(()=>ui.biome.classList.remove('show'),3000); }
function showCombo(n) {
    ui.combo.textContent = `x${n} COMBO!`;
    ui.combo.classList.remove('combo-anim');
    void ui.combo.offsetWidth; // trigger reflow
    ui.combo.classList.add('combo-anim');
}
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
                modeCars.policeCar = buildPoliceCar();
                state.policeZ = state.dist - 50;
                state.policeLane = 1;
                state.policeLaneSmooth = 1;
                state.policeSpeed = state.speed * 0.8;
                modeCars.policeCar.position.set(LANE_X[1], 0, state.policeZ);
                scene.add(modeCars.policeCar);
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


// Train system moved to src/builders/train.js
// ======================== GAME LOGIC ========================
function resetGame() {
    Object.assign(state, {
        score:0, coins:0, speed:0, lane:1, targetLane:1, laneSmooth:1, dist:0,
        oTimer:0, cTimer:0, eTimer:0, bTimer:0, biomeIdx:0, biomeProg:0, lastGridZ:undefined,
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
    if (modeCars.policeCar) { scene.remove(modeCars.policeCar); modeCars.policeCar = null; }
    if (modeCars.rivalCar) { scene.remove(modeCars.rivalCar); modeCars.rivalCar = null; }

    // Remove spike strips
    if (state.spikeStrips) {
        state.spikeStrips.forEach(s => scene.remove(s.mesh));
    }
    state.spikeStrips = [];

    // Remove train
    removeTrain(scene);

    // Rebuild player car — special car for some modes
    if (state.mode === 'cop') {
        scene.remove(playerCar);
        playerCar = buildPoliceCar2(0xEEEEEE, true);
        scene.add(playerCar);
    } else if (state.mode === 'ambulance') {
        scene.remove(playerCar);
        playerCar = buildAmbulance(0xEEEEEE, true);
        scene.add(playerCar);
    } else if (state.mode === 'taxi') {
        scene.remove(playerCar);
        playerCar = buildSedan(0xFFD740, true);
        scene.add(playerCar);
    } else {
        rebuildPlayerCar();
    }
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
    ui.copUI.style.display = 'none';
    ui.timerUI.style.display = 'none';
    if (modeCars.criminalCar) { scene.remove(modeCars.criminalCar); modeCars.criminalCar = null; }
    ui.fuelWarning.style.opacity = '0';
    if (ui.secondLife) ui.secondLife.style.display = 'none';

    // Setup mode-specific things
    if (state.mode === 'chase') {
        ui.chaseUI.style.display = 'block';
    } else if (state.mode === 'duel') {
        ui.duelUI.style.display = 'block';
        modeCars.rivalCar = buildRivalCar();
        modeCars.rivalCar.position.set(LANE_X[2], 0, 0);
        scene.add(modeCars.rivalCar);
        state.rivalZ = 0;
        state.rivalLane = 2;
        state.rivalLaneSmooth = 2;
        state.rivalSpeed = 0;
        state.rivalNosCD = 5;
    } else if (state.mode === 'fuel') {
        ui.fuelUI.style.display = 'block';
        state.fuel = 100;
    } else if (state.mode === 'cop') {
        ui.copUI.style.display = 'block';
        sfx.startSiren('police');
        // Spawn criminal car ahead
        if (modeCars.criminalCar) scene.remove(modeCars.criminalCar);
        modeCars.criminalCar = buildSportsCar ? buildSportsCar(0x111111) : buildSedan(0x111111);
        modeCars.criminalCar.position.set(LANE_X[1], 0, 30);
        scene.add(modeCars.criminalCar);
        state.criminalZ = 30;
        state.criminalLane = 1;
        state.criminalLaneSmooth = 1;
        state.criminalSpeed = 0;
        state.copTimer = 0;
    } else if (state.mode === 'ambulance' || state.mode === 'taxi') {
        ui.timerUI.style.display = 'block';
        ui.timerIcon.textContent = state.mode === 'ambulance' ? '🚑' : '🚕';
        if (state.mode === 'ambulance') sfx.startSiren('ambulance');
        state.missionTimer = state.mode === 'ambulance' ? 75 : 60;
        state.missionDist = 0;
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
    const getRM = (env) => env==='city'?0x2D1B42:env==='canyon'?0x070014:env==='highway'?0x78909C:0x3a3a3a;
    roadMat.color.setHex(getRM(b.env));
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
    
    const getRM = (env) => env==='city'?0x2D1B42:env==='canyon'?0x070014:env==='highway'?0x78909C:0x3a3a3a;
    const roadColorFrom = getRM(biomeFrom.env);
    const roadColorTo = getRM(biomeTo.env);
    roadMat.color.copy(lerpColors(roadColorFrom, roadColorTo, t));

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

// spawnFuelCanister + updateFuelMode moved to src/systems/modes.js


// Modes (cop/chase/duel/ambulance/fuel) moved to src/systems/modes.js

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
        const elapsedTime = Date.now() * 0.001;

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
        if(state.eTimer>(isMobile?250:180)){spawnE();state.eTimer=0;}
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
            if(dx<2.0 && dz<3.0 && !state.invincible){gameOver(t('crash'));return;}
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
        const nowSec = Date.now() * 0.001;
        for (let i=state.coinObjs.length-1; i>=0; i--) {
            const c=state.coinObjs[i];
            c.mesh.rotation.y+=dt*5;
            c.mesh.position.y=1.3+Math.sin(nowSec*3+c.z*0.1)*0.3;
            const ring = c.mesh.getObjectByName('coinRing');
            if (ring) {
                ring.rotation.x = elapsedTime*2;
                ring.rotation.z = elapsedTime*1.5;
                const pulse = 0.9 + Math.sin(elapsedTime*6)*0.3;
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
            b.mesh.position.y = 0.8 + Math.sin(elapsedTime*4 + b.z*0.05) * 0.2;
            const r1 = b.mesh.getObjectByName('boostRing1');
            const r2 = b.mesh.getObjectByName('boostRing2');
            if (r1) { r1.rotation.x = elapsedTime*3; r1.rotation.z = elapsedTime*2; const s=0.8+Math.sin(elapsedTime*5)*0.4; r1.scale.set(s,s,s); }
            if (r2) { r2.rotation.x = elapsedTime*2.5+1; r2.rotation.y = elapsedTime*3; const s=0.7+Math.sin(elapsedTime*7)*0.3; r2.scale.set(s,s,s); }
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
        updateTrain(dt, scene, state);

        // Mode-specific updates
        const modeCtx = { state, scene, ui, playerCar, sfx, particles, LANE_X, ROAD_W, buildPoliceCar, buildSportsCar, buildSedan, loadDuelStreak, saveDuelStreak, gameOver, gameWin, gameLose, showBiome, t, garage };
        if (state.mode === 'chase') {
            checkSpeedSignViolation();
            updatePoliceChase(dt, moveZ, playerX, modeCtx);
        } else if (state.mode === 'duel') {
            updateDuelRace(dt, moveZ, modeCtx);
        } else if (state.mode === 'fuel') {
            updateFuelMode(dt, playerX, modeCtx);
        } else if (state.mode === 'cop') {
            updateCopMode(dt, moveZ, playerX, modeCtx);
        } else if (state.mode === 'ambulance' || state.mode === 'taxi') {
            updateTimerMode(dt, modeCtx);
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
        if (ui.speed) ui.speed.textContent=Math.floor(state.speed); // Safeguard
        ui.coins.textContent=state.coins;
        if (ui.speedOverlay) ui.speedOverlay.style.opacity=Math.max(0,(state.speed-60)/120);
        // Спидометр — стрелка
        updateSpeedometer(state.speed);

        // Проблесковые маячки на машине игрока (коп/скорая)
        if (state.mode === 'cop' || state.mode === 'ambulance') {
            const flash = Math.floor(Date.now() / 200) % 2;
            if (state.mode === 'cop') {
                const r = playerCar.getObjectByName('policeRed');
                const b = playerCar.getObjectByName('policeBlue');
                if (r) r.material.emissiveIntensity = flash === 0 ? 2.5 : 0.2;
                if (b) b.material.emissiveIntensity = flash === 1 ? 2.5 : 0.2;
            } else {
                const r = playerCar.getObjectByName('sirenRed');
                const w = playerCar.getObjectByName('sirenWhite');
                if (r) r.material.emissiveIntensity = flash === 0 ? 3.0 : 0.2;
                if (w) w.material.emissiveIntensity = flash === 1 ? 2.5 : 0.2;
            }
        }
    }

    renderer.render(scene,camera);
}

// Garage UI moved to src/ui/garage.js

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
    const speedNumber = document.getElementById('speed-number');
    const arc = document.getElementById('speed-arc');
    if (speedNumber) speedNumber.textContent = Math.floor(speed);
    if (arc) {
        const maxSpeed = 220;
        const pct = Math.max(0, Math.min(speed / maxSpeed, 1));
        const offset = Math.max(0, 424 - (424 * pct));
        arc.setAttribute('stroke-dashoffset', offset);
    }
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
document.getElementById('btn-cop').onclick = () => startGame('cop');
document.getElementById('btn-ambulance').onclick = () => startGame('ambulance');
document.getElementById('btn-taxi').onclick = () => startGame('taxi');
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
function grantSecondLife() {
    state.usedSecondLife = true;
    state.phase = 'playing';
    state.invincible = true;
    state.invincibleTimer = 2;
    state.speed = 50;
    state.crashing = false;
    playerCar.rotation.x = 0;
    playerCar.position.y = 0;
    playerCar.visible = true;
    state.crashShards.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); });
    state.crashSmokes.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); });
    state.crashShards = [];
    state.crashSmokes = [];
    if (ui.secondLife) ui.secondLife.style.display = 'none';
    sfx.startEngine();
}
document.getElementById('btn-continue').onclick = () => {
    if (state.phase !== 'secondlife') return;
    showRewardedAd(() => grantSecondLife());
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
// Double coins button
document.getElementById('btn-double-coins').onclick = () => {
    showRewardedAd(() => {
        const bonus = state.coins;
        garage.wallet += bonus;
        saveGarage();
        updateWalletDisplays();
        ui.goStats.textContent += ` (+${bonus} x2!)`;
        if (ui.doubleCoinsBtn) ui.doubleCoinsBtn.style.display = 'none';
    });
};

// ======================== HI-RES SCREENSHOT (F9) ========================
function takeScreenshot() {
    // Hide UI temporarily
    const uiEl = document.getElementById('ui');
    uiEl.style.display = 'none';

    // Render at 3x resolution for crisp screenshot
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = 3;
    renderer.setSize(w * scale, h * scale);
    renderer.setPixelRatio(1);
    renderer.render(scene, camera);

    // Export canvas as PNG
    const link = document.createElement('a');
    link.download = 'RoadRush3D_' + Date.now() + '.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();

    // Restore
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    uiEl.style.display = '';
}
document.addEventListener('keydown', e => { if (e.key === 'F9') { e.preventDefault(); takeScreenshot(); } });

window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});

// ======================== VISIBILITY CHANGE (Yandex requirement) ========================
let wasMutedBeforeHide = false;
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        wasMutedBeforeHide = sfx.muted;
        if (state.phase === 'playing') pauseGame();
        sfx.mute();
    } else {
        if (!wasMutedBeforeHide) sfx.unmute();
    }
});

// ======================== INIT ========================
initRailTies(scene);
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

function applyTranslations() {
    // HUD
    const scoreLabel = document.querySelector('.hud-score .label');
    const coinsLabel = document.querySelector('.hud-coins .label');
    if (scoreLabel) scoreLabel.textContent = t('score');
    if (coinsLabel) coinsLabel.textContent = t('coins');
    // Menu mode buttons
    const modeMap = {endless:'endless',chase:'chase',duel:'duel',fuel:'fuel',cop:'cop',ambulance:'ambulanceMode',taxi:'taxi'};
    const descMap = {endless:'endlessDesc',chase:'chaseDesc',duel:'duelDesc',fuel:'fuelDesc',cop:'copDesc',ambulance:'ambulanceDesc',taxi:'taxiDesc'};
    for (const [id, key] of Object.entries(modeMap)) {
        const btn = document.getElementById('btn-'+id);
        if (btn) {
            const title = btn.querySelector('.mode-title');
            const desc = btn.querySelector('.mode-desc');
            if (title) title.textContent = t(key);
            if (desc) desc.textContent = t(descMap[id]);
        }
    }
    // Buttons
    const garageBtn = document.getElementById('btn-garage');
    if (garageBtn) garageBtn.innerHTML = '&#128295; ' + t('garage');
    const missTitle = document.querySelector('.missions-title');
    if (missTitle) missTitle.innerHTML = '&#128203; ' + t('dailyMissions');
    const ctrlHint = document.querySelector('.controls-hint');
    if (ctrlHint) ctrlHint.textContent = t('controlsHint');
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) restartBtn.textContent = t('restart');
    const backMenuBtn = document.getElementById('btn-back-menu');
    if (backMenuBtn) backMenuBtn.textContent = t('menu');
    const resumeBtn = document.getElementById('btn-resume');
    if (resumeBtn) resumeBtn.textContent = '▶ ' + t('resume');
    const pauseMenuBtn = document.getElementById('btn-pause-menu');
    if (pauseMenuBtn) pauseMenuBtn.textContent = t('menu');
    const dblCoins = document.getElementById('btn-double-coins');
    if (dblCoins) dblCoins.textContent = t('doubleCoins');
    // Second life
    const slTitle = document.querySelector('#second-life .go-title');
    if (slTitle) slTitle.textContent = t('secondLifeTitle');
    const slAsk = document.querySelector('#second-life .sl-question');
    if (slAsk) slAsk.textContent = t('secondLifeAsk');
    const contBtn = document.getElementById('btn-continue');
    if (contBtn) contBtn.textContent = '▶ ' + t('secondLifeYes');
    const noContBtn = document.getElementById('btn-no-continue');
    if (noContBtn) noContBtn.textContent = t('secondLifeNo');
    // Garage
    const garageTitle = document.querySelector('.garage-title');
    if (garageTitle) garageTitle.textContent = t('garageTitle');
    const garageBack = document.getElementById('btn-garage-back');
    if (garageBack) garageBack.textContent = t('back');
    // Fuel
    const fuelLabel = document.getElementById('fuel-label');
    if (fuelLabel) fuelLabel.textContent = t('fuelLabel');
    const fuelWarn = document.getElementById('fuel-warning');
    if (fuelWarn) fuelWarn.textContent = t('fuelLow');
    // Pause title
    const pauseTitle = document.querySelector('#pause .go-title');
    if (pauseTitle) pauseTitle.textContent = '⏸ ' + t('pause');

    renderMissions();
}

initYandexSDK().then(() => {
    notifyReady();
    applyTranslations();
    loop();
}).catch(() => { applyTranslations(); loop(); });
