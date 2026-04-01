// modes.js — Game mode logic extracted from game.js
import * as THREE from 'three';
import { isMobile } from '../core/platform.js';
import { makeFuelCanister } from '../builders/pickups.js';

// Mutable car references shared with game.js
export const modeCars = { criminalCar: null, policeCar: null, rivalCar: null };

// ======================== COP MODE ========================

export function updateCopMode(dt, moveZ, playerX, ctx) {
    const { state, ui, LANE_X, gameWin, gameLose, t } = ctx;
    if (!modeCars.criminalCar || state.phase !== 'playing') return;

    state.copTimer += dt;

    // Criminal speed: slightly slower than player
    const baseSpeed = state.speed * 0.92;
    state.criminalSpeed = Math.max(baseSpeed, 40);

    // Criminal AI: only change lane to dodge obstacles ahead
    const crimWorldZ = state.dist + state.criminalZ;
    const crimX = LANE_X[state.criminalLane];
    let needDodge = false;
    let dodgeLane = state.criminalLane;

    for (let i = 0; i < state.obstacles.length; i++) {
        const obs = state.obstacles[i];
        const odz = obs.mesh.position.z - crimWorldZ;
        const odx = Math.abs(obs.mesh.position.x - crimX);
        if (odz > 3 && odz < 25 && odx < 2.5) {
            needDodge = true;
            // Pick the safest lane (check both neighbors)
            const options = [0, 1, 2].filter(l => l !== state.criminalLane);
            // Prefer the lane with no obstacles
            let best = options[0];
            let bestClear = 0;
            for (const opt of options) {
                const optX = LANE_X[opt];
                let clear = 100;
                for (let j = 0; j < state.obstacles.length; j++) {
                    const o2 = state.obstacles[j];
                    const dz2 = o2.mesh.position.z - crimWorldZ;
                    const dx2 = Math.abs(o2.mesh.position.x - optX);
                    if (dz2 > 0 && dz2 < 25 && dx2 < 2.5) {
                        clear = Math.min(clear, dz2);
                    }
                }
                if (clear > bestClear) { bestClear = clear; best = opt; }
            }
            dodgeLane = best;
            break;
        }
    }

    if (needDodge) state.criminalLane = dodgeLane;

    // Smooth lane movement (slower = more natural)
    const prevSmooth = state.criminalLaneSmooth;
    state.criminalLaneSmooth += (state.criminalLane - state.criminalLaneSmooth) * 3 * dt;
    const crimXSmooth = LANE_X[0] + state.criminalLaneSmooth * (LANE_X[2] - LANE_X[0]) / 2;

    // Gentle lean when turning — target based on lane difference, smoothly interpolated
    const targetLean = -(state.criminalLane - state.criminalLaneSmooth) * 0.15;
    modeCars.criminalCar.rotation.z += (targetLean - modeCars.criminalCar.rotation.z) * 3 * dt;

    // Criminal moves relative to player
    state.criminalZ += (state.criminalSpeed - state.speed) * 0.4 * dt;
    if (state.criminalZ < 5) state.criminalZ += 2 * dt;
    const crimWorldZFinal = state.dist + state.criminalZ;

    modeCars.criminalCar.position.set(crimXSmooth, 0, crimWorldZFinal);
    modeCars.criminalCar.visible = true;

    // UI: distance to criminal
    const gap = Math.abs(state.criminalZ);
    if (ui.copDist) ui.copDist.textContent = Math.floor(gap);

    if (ui.copUI) {
        if (gap < 10) ui.copUI.style.borderColor = '#76FF03';
        else if (gap < 30) ui.copUI.style.borderColor = '#FFD740';
        else ui.copUI.style.borderColor = '#FF1744';
    }

    // Catch: player is close enough to criminal
    if (state.criminalZ >= -1 && state.criminalZ <= 6) {
        const cdx = Math.abs(playerX - crimXSmooth);
        if (cdx < 2.5) {
            gameWin(t('caught'));
            return;
        }
    }

    // Criminal escapes if too far ahead (100m)
    if (state.criminalZ > 100) {
        gameLose(t('escaped'));
    }
}

// ======================== AMBULANCE / TAXI MODE ========================

export function updateTimerMode(dt, ctx) {
    const { state, ui, gameWin, gameLose, t } = ctx;
    if (state.phase !== 'playing') return;
    state.missionTimer -= dt;
    state.missionDist += state.speed * 0.4 * dt;

    // UI
    if (ui.timerValue) {
        const secs = Math.max(0, Math.ceil(state.missionTimer));
        ui.timerValue.textContent = secs;
        // Flash red when low
        if (secs <= 10) {
            ui.timerUI.style.borderColor = '#FF1744';
            ui.timerUI.style.color = '#FF5252';
        } else {
            ui.timerUI.style.borderColor = 'rgba(255,255,255,0.2)';
            ui.timerUI.style.color = '#fff';
        }
    }

    // Target distance: 3000m for ambulance, 2500m for taxi
    const targetDist = state.mode === 'ambulance' ? 2000 : 1500;

    // Win: reached destination
    if (state.missionDist >= targetDist) {
        const bonus = Math.floor(state.missionTimer * 10); // time bonus
        state.coins += bonus;
        gameWin(t('delivered'));
        return;
    }

    // Lose: time ran out
    if (state.missionTimer <= 0) {
        gameLose(t('timeUp'));
    }
}

// ======================== FUEL MODE ========================

function spawnFuelCanister(ctx) {
    const { state, scene, LANE_X } = ctx;
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

export function updateFuelMode(dt, playerX, ctx) {
    const { state, scene, ui, sfx, particles, LANE_X, gameOver, t } = ctx;
    // Расход бензина пропорционален скорости
    const fMult = 1 - 0.1 * (ctx.garage ? ctx.garage.upgrades.tank - 1 : 0);
    const consumption = (state.speed / 130) * 8 * dt * fMult;
    state.fuel = Math.max(0, state.fuel - consumption);

    // NOS жрёт больше бензина
    if (state.boosted) state.fuel = Math.max(0, state.fuel - dt * 5);

    // Спавн канистр — чем меньше топлива, тем реже (на грани!)
    state.fuelTimer += dt * 1000;
    const fuelSpawnInterval = state.fuel < 30 ? 4000 : state.fuel < 50 ? 3000 : 5000;
    if (state.fuelTimer > fuelSpawnInterval) {
        spawnFuelCanister(ctx);
        state.fuelTimer = 0;
    }

    // Обновление канистр
    const nowSec = Date.now() * 0.001;
    for (let i = state.fuelCanisters.length - 1; i >= 0; i--) {
        const c = state.fuelCanisters[i];
        c.mesh.rotation.y += dt * 3;
        c.mesh.position.y = 0.6 + Math.sin(nowSec * 3 + c.z * 0.1) * 0.15;
        const ring = c.mesh.getObjectByName('fuelRing');
        if (ring) { ring.rotation.x = nowSec * 2; ring.rotation.z = nowSec; }

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
        gameOver(t('fuelEmpty'));
    }
}

// ======================== SPIKE STRIP MODEL ========================

export function makeSpikeStrip() {
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

export function spawnSpikeStrip(ctx) {
    const { state, scene, LANE_X } = ctx;
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

export function updatePoliceChase(dt, moveZ, playerX, ctx) {
    const { state, scene, ui, sfx, playerCar, LANE_X, buildPoliceCar, gameOver, t } = ctx;
    state.policeTimer += dt;

    // Check if police needs to respawn after crashing
    if (state.policeRespawnPending && state.dist >= state.policeRespawnDist) {
        state.policeRespawnPending = false;
        state.policeActive = true;
        modeCars.policeCar = buildPoliceCar();
        state.policeZ = state.dist - 30;
        state.policeLane = 1;
        state.policeLaneSmooth = 1;
        state.policeSpeed = state.speed * 0.9;
        modeCars.policeCar.position.set(LANE_X[1], 0, state.policeZ);
        scene.add(modeCars.policeCar);
        sfx.startSiren();
    }

    // Полиция появляется при превышении скорости у знака (checkSpeedSignViolation)
    // Или автоматически через 15 сек если игрок ещё не нарушил (чтобы не было скучно)
    if (!state.policeActive && !state.policeRespawnPending && state.policeTimer > 15) {
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

    if (!state.policeActive || !modeCars.policeCar) return;

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
        scene.remove(modeCars.policeCar);
        modeCars.policeCar = null;
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

    modeCars.policeCar.position.set(policeX, 0, state.policeZ);
    modeCars.policeCar.rotation.y = 0;

    // Flash police lights
    const flashPhase = Math.floor(Date.now() / 200) % 2;
    const redMesh = modeCars.policeCar.getObjectByName('policeRed');
    const blueMesh = modeCars.policeCar.getObjectByName('policeBlue');
    const redPL = modeCars.policeCar.getObjectByName('policeRedPL');
    const bluePL = modeCars.policeCar.getObjectByName('policeBluePL');
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
            spawnSpikeStrip(ctx);
            state.spikeTimer = 0;
        }
    }

    // Арест — полиция в пределах 4м и рядом по X
    const policeGap = state.dist - state.policeZ;
    if (policeGap <= 4 && state.policeActive && modeCars.policeCar) {
        const policeXNow = LANE_X[0]+(LANE_X[2]-LANE_X[0])*(state.policeLaneSmooth/2);
        const catchDx = Math.abs(playerX - policeXNow);
        if (catchDx < 3.5) {
            gameOver(t('arrested'));
        }
    }
}

// ======================== DUEL RACE LOGIC ========================

export function updateDuelRace(dt, moveZ, ctx) {
    const { state, ui, LANE_X, loadDuelStreak, saveDuelStreak, gameWin, gameLose } = ctx;
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

    if (modeCars.rivalCar) {
        modeCars.rivalCar.position.set(finalRivalX, 0, state.rivalZ);
        modeCars.rivalCar.rotation.y = 0;
        modeCars.rivalCar.rotation.z = -(state.rivalLane - state.rivalLaneSmooth) * 0.15;
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
