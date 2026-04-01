import * as THREE from 'three';
import { isMobile } from '../core/platform.js';
import { M, ME } from '../graphics/materials.js';

export function makeCoin3D() {
    const g = new THREE.Group();
    const rimMat = ME(0xFFD740, 0.4);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 4, 8), rimMat);
    g.add(rim);
    const outerBorder = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.02, 3, 8), M(0xFFFFFF));
    g.add(outerBorder);
    const coreMat = ME(0xFFE57F, 1.2);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), coreMat);
    g.add(core);
    const ringMat = new THREE.MeshBasicMaterial({color:0xFFE57F,transparent:true,opacity:0.3,side:THREE.DoubleSide});
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.8, 8), ringMat);
    ring.name = 'coinRing'; g.add(ring);
    if (!isMobile) { const pl = new THREE.PointLight(0xFFD740, 1.5, 8); pl.position.y = 0.2; g.add(pl); }
    return g;
}

export function makeFuelCanister() {
    const g = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.7, 4);
    bodyGeo.rotateY(Math.PI/4);
    const bodyMat = M(0x2E3B32);
    g.add(new THREE.Mesh(bodyGeo, bodyMat));
    const coreGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 4);
    coreGeo.rotateY(Math.PI/4);
    g.add(new THREE.Mesh(coreGeo, ME(0x00E676, 1.5)));
    const capMat = M(0x1B2620);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.1, 4).rotateY(Math.PI/4).translate(0,0.3,0), capMat));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.1, 4).rotateY(Math.PI/4).translate(0,-0.3,0), capMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.4).translate(0, 0.45, 0), capMat));
    const ringMat = new THREE.MeshBasicMaterial({color:0x00E676,transparent:true,opacity:0.2,side:THREE.DoubleSide});
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 4).rotateZ(Math.PI/4), ringMat);
    ring.name = 'fuelRing'; g.add(ring);
    if (!isMobile) g.add(new THREE.PointLight(0x00E676, 2, 10));
    return g;
}

export function makeSpeedBoost() {
    const g = new THREE.Group();
    const baseMat = M(0x151A24);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8), baseMat));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8).translate(0, 0.4, 0), baseMat));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8).translate(0, -0.4, 0), baseMat));
    const valveMat = M(0xB0BEC5);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 6).translate(0, 0.7, 0), valveMat));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 4, 8).translate(0, 0.78, 0).rotateX(Math.PI/2), valveMat));
    const neonMat = ME(0x00E5FF, 2.0);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.04, 4, 8).translate(0, 0.1, 0), neonMat));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.04, 4, 8).translate(0, -0.1, 0), neonMat));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6).rotateX(Math.PI).translate(0, -0.8, 0), new THREE.MeshBasicMaterial({color:0x40C4FF,transparent:true,opacity:0.8})));
    const glowMat = new THREE.MeshBasicMaterial({color:0x00E5FF,transparent:true,opacity:0.2,side:THREE.DoubleSide});
    const glow1 = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 8), glowMat);
    glow1.name = 'boostRing1'; g.add(glow1);
    const glow2 = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 8), glowMat);
    glow2.name = 'boostRing2'; glow2.position.y=0.2; g.add(glow2);
    if (!isMobile) g.add(new THREE.PointLight(0x00E5FF, 2, 12));
    g.rotation.x = Math.PI / 6;
    return g;
}
