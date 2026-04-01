import * as THREE from 'three';
import { isMobile } from '../core/platform.js';
import { M, ME } from '../graphics/materials.js';
import { ROAD_W } from '../config/constants.js';
import { BIOMES } from '../config/definitions.js';

const TRAIN_X = ROAD_W / 2 + 18;

let trainActive = false;
let trainZ = 0;
let trainSpeed = 0;
let trainGroup = null;
let trainDesertStart = 0;
let trainSpawned = false;
const trainSmokes = [];

const railTies = [];
const RAIL_TIE_COUNT = 80;
const RAIL_TIE_SPACING = 1.5;
const railTieMat = M(0x3E2723);
const railMat = M(0x888888);
let railLeftMesh = null;
let railRightMesh = null;

function makeTrainLocomotive() {
    const g = new THREE.Group();
    const bodyMat = M(0x1a1a2e);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 8), bodyMat).translateY(2.0));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.4, 2.5), M(0x222244)).translateY(4.0).translateZ(-2.0));
    const glassMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.6, 0.08), glassMat).translateY(4.2).translateZ(-0.74));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 2.3), glassMat).translateX(1.16).translateY(4.2).translateZ(-2.0));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 2.3), glassMat).translateX(-1.16).translateY(4.2).translateZ(-2.0));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8), M(0x333333)).translateY(4.1).translateZ(2.5));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.25, 0.3, 8), M(0x444444)).translateY(4.85).translateZ(2.5));
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
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), ME(0xffffaa, 0.8)).translateY(2.5).translateZ(4.05));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.15, 8.02), M(0x8B0000)).translateY(1.2));
    return g;
}

function makeTrainCar() {
    const g = new THREE.Group();
    const carColors = [0x5D4037, 0xB71C1C, 0x1B5E20, 0x1565C0, 0x424242];
    const carColor = carColors[Math.floor(Math.random() * carColors.length)];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 7), M(carColor)).translateY(1.8));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 7.2), M(0x333333)).translateY(0.4));
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
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.08, 7.02), M(0x222222)).translateY(3.05));
    return g;
}

function spawnTrain(scene, dist, speed) {
    if (trainGroup) {
        scene.remove(trainGroup);
    }
    trainGroup = new THREE.Group();
    const loco = makeTrainLocomotive();
    loco.position.z = 0;
    trainGroup.add(loco);
    const carCount = 4 + Math.floor(Math.random() * 3);
    let carZ = -9;
    for (let i = 0; i < carCount; i++) {
        const car = makeTrainCar();
        car.position.z = carZ;
        trainGroup.add(car);
        carZ -= 8;
    }
    trainGroup.position.set(TRAIN_X, 0, dist - 20);
    trainZ = dist - 20;
    trainSpeed = speed * 0.95;
    scene.add(trainGroup);
    trainGroup.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
}

export function initRailTies(scene) {
    const tieGeo = new THREE.BoxGeometry(3.0, 0.1, 0.2);
    for (let i = 0; i < RAIL_TIE_COUNT; i++) {
        const tie = new THREE.Mesh(tieGeo, railTieMat);
        tie.position.set(TRAIN_X, 0.02, 0);
        tie.visible = false;
        tie.receiveShadow = true;
        scene.add(tie);
        railTies.push(tie);
    }
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

export function removeTrain(scene) {
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

export function updateTrain(dt, scene, state) {
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
            spawnTrain(scene, state.dist, state.speed);
        }
    }

    if (!isDesert && trainActive) {
        removeTrain(scene);
        return;
    }
    if (!isDesert && trainSpawned && !trainActive) {
        trainSpawned = false;
    }

    if (!trainActive || !trainGroup) return;

    trainSpeed += (state.speed * 0.95 - trainSpeed) * dt * 2;
    const trainMove = trainSpeed * dt * 0.5;
    trainZ += trainMove;
    trainGroup.position.z = trainZ;
    trainGroup.position.x = TRAIN_X;

    railTies.forEach((tie, i) => {
        tie.visible = true;
        const baseZ = i * RAIL_TIE_SPACING;
        const rel = ((state.dist - baseZ) % (RAIL_TIE_COUNT * RAIL_TIE_SPACING) + (RAIL_TIE_COUNT * RAIL_TIE_SPACING)) % (RAIL_TIE_COUNT * RAIL_TIE_SPACING);
        tie.position.z = state.dist - rel + (RAIL_TIE_COUNT * RAIL_TIE_SPACING) * 0.7;
        tie.position.x = TRAIN_X;
        tie.position.y = 0.02;
    });

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
