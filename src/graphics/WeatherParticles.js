import * as THREE from 'three';
import { isMobile } from '../core/platform.js';

export class WeatherParticles {
    constructor(sc) {
        this.scene = sc;
        this.type = 'clear';
        this.rainPool = [];
        this.snowPool = [];
        // Create rain pool (thin fast streaks)
        const rainMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.35});
        for (let i = 0; i < (isMobile ? 50 : 100); i++) {
            const geo = new THREE.CylinderGeometry(0.005, 0.005, 1.5, 3);
            const mesh = new THREE.Mesh(geo, rainMat);
            mesh.rotation.x = 0.05; // Вперед легкий наклон
            mesh.visible = false;
            this.rainPool.push({ mesh, vy: -30 - Math.random()*15, active: false });
            sc.add(mesh);
        }
        // Create snow pool (small spheres)
        const snowMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.7});
        for (let i = 0; i < (isMobile ? 30 : 60); i++) {
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
