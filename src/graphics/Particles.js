import * as THREE from 'three';
import { isMobile } from '../core/platform.js';

export class Particles {
    constructor(sc) { this.scene = sc; this.sparks = []; }
    burst(pos, count=15, color=0xFF6D00) {
        if (isMobile) count = Math.min(count, 10);
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
