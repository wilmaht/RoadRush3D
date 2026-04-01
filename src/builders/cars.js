import * as THREE from 'three';
import { isMobile } from '../core/platform.js';
import { M, ME } from '../graphics/materials.js';
import { COLOR_DEFS } from '../config/definitions.js';
import { garage } from '../progression/garage.js';

// ======================== TRAFFIC / AI CARS ========================

export function buildCar(color, isPlayer=false) {
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
        [[-0.65,0.6,-2.28],[0.65,0.6,-2.28]].forEach((p,i) => {
            const brakeLight = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.06), ME(0xff0000,0.8));
            brakeLight.position.set(p[0],p[1],p[2]);
            brakeLight.name = 'brakeLight' + i;
            g.add(brakeLight);
        });
        [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.5));
            hl.position.set(p[0],p[1],p[2]); g.add(hl);
        });
    } else {
        [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,1.2));
            hl.position.set(p[0],p[1],p[2]); g.add(hl);
        });
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

export function buildTruck() {
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
    [[-0.8,0.8,-3.05],[0.8,0.8,-3.05]].forEach(p => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.15,0.06),ME(0xff2200,0.5));
        tl.position.set(p[0],p[1],p[2]); g.add(tl);
    });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.8,6.0), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

export function buildPoliceCar() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.5), M(0xEEEEEE));
    body.position.y = 0.5; g.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 4.5), M(0x1565C0));
    stripe.position.y = 0.55; g.add(stripe);
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
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5), gMat).translateY(1.05).translateZ(0.9));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.45), gMat).translateY(1.0).translateZ(-1.0));
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), M(0x222222));
    barBase.position.set(0, 1.35, 0); g.add(barBase);
    const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0xff0000, 1.5));
    redLight.position.set(-0.35, 1.45, 0); redLight.name = 'policeRed'; g.add(redLight);
    const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0x0044ff, 1.5));
    blueLight.position.set(0.35, 1.45, 0); blueLight.name = 'policeBlue'; g.add(blueLight);
    if (!isMobile) {
        const redPL = new THREE.PointLight(0xff0000, 2, 15);
        redPL.position.set(-0.35, 1.5, 0); redPL.name = 'policeRedPL'; g.add(redPL);
        const bluePL = new THREE.PointLight(0x0044ff, 2, 15);
        bluePL.position.set(0.35, 1.5, 0); bluePL.name = 'policeBluePL'; g.add(bluePL);
    }
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.3,0.12,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.15,8), M(0xcccccc)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.3, z); return wg;
    };
    g.add(wheelShape(-1.0, 1.3)); g.add(wheelShape(1.0, 1.3));
    g.add(wheelShape(-1.0, -1.3)); g.add(wheelShape(1.0, -1.3));
    [[-0.7,0.6,2.28],[0.7,0.6,2.28]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28,0.18,0.06), ME(0xffffaa,0.9)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
    });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.8), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

export function buildRivalCar() {
    const g = new THREE.Group();
    const bodyColor = 0xFF5722;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 4.8), M(bodyColor));
    body.position.y = 0.45; g.add(body);
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
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.4), gMat).translateY(0.95).translateZ(0.8));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.35), gMat).translateY(0.9).translateZ(-0.9));
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.3,0.12,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.15,8), M(0xFFD700)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.3, z); return wg;
    };
    g.add(wheelShape(-1.1, 1.4)); g.add(wheelShape(1.1, 1.4));
    g.add(wheelShape(-1.1, -1.4)); g.add(wheelShape(1.1, -1.4));
    [[-0.8,0.5,2.42],[0.8,0.5,2.42]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.32,0.14,0.06), ME(0xffffaa,0.9)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
    });
    [[-0.8,0.5,-2.42],[0.8,0.5,-2.42]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.12,0.06), ME(0xff2200,0.6)).translateX(p[0]).translateY(p[1]).translateZ(p[2]));
    });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.4,5.0), new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.3}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
    g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
    return g;
}

// ======================== PLAYER CAR BUILDERS ========================

export function buildSedan(color, isPlayer=false) {
    return buildCar(color, isPlayer);
}

export function buildPickup(color, isPlayer=false) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 5.0), M(color));
    body.position.y = 0.55; g.add(body);
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
    const bedSide = M(new THREE.Color(color).multiplyScalar(0.85));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 0.08).translate(0,0.55,-2.0), bedSide));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 2.2).translate(-1.0,0.55,-0.9), bedSide));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 2.2).translate(1.0,0.55,-0.9), bedSide));
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5), gMat).translateY(1.1).translateZ(1.5));
    const wheelShape = (x,z) => {
        const wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.35,0.14,8,12), M(0x1a1a1a)).rotateY(Math.PI/2));
        wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.17,8), M(0xcccccc)).rotateZ(Math.PI/2));
        wg.position.set(x, 0.35, z); return wg;
    };
    g.add(wheelShape(-1.05, 1.5)); g.add(wheelShape(1.05, 1.5));
    g.add(wheelShape(-1.05, -1.5)); g.add(wheelShape(1.05, -1.5));
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

export function buildSportsCar(color, isPlayer=false) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 4.8), M(color));
    body.position.y = 0.4; g.add(body);
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
    const spoilerColor = new THREE.Color(color).multiplyScalar(0.7);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.3).translate(0,1.0,-2.0), M(spoilerColor)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.15).translate(-0.8,0.85,-2.0), M(spoilerColor)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.15).translate(0.8,0.85,-2.0), M(spoilerColor)));
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.4), gMat).translateY(0.85).translateZ(0.7));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.35), gMat).translateY(0.8).translateZ(-0.9));
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

export function buildSUV(color, isPlayer=false) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4.8), M(color));
    body.position.y = 0.7; g.add(body);
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
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 2.4).translate(0,1.78,0), M(0x444444)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.4).translate(-0.75,1.82,0), M(0x444444)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.4).translate(0.75,1.82,0), M(0x444444)));
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.6), gMat).translateY(1.4).translateZ(1.3));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.55), gMat).translateY(1.35).translateZ(-1.2));
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

export function buildAmbulance(color, isPlayer=false) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.4, 5.0), M(color));
    body.position.y = 1.0; g.add(body);
    const cabMat = M(new THREE.Color(color).multiplyScalar(0.95));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 1.2).translate(0,0.75,2.5), cabMat));
    const crossMat = ME(0xff0000, 0.6);
    [1.06, -1.06].forEach(x => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.15).translate(x,1.2,0), crossMat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.6).translate(x,1.2,0), crossMat));
    });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.4).translate(0,1.74,0.5), M(0x333333)));
    const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.25), ME(0xff0000, 1.2));
    sirenRed.position.set(-0.3, 1.82, 0.5); sirenRed.name = 'sirenRed'; g.add(sirenRed);
    const sirenWhite = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.25), ME(0xffffff, 1.2));
    sirenWhite.position.set(0.3, 1.82, 0.5); sirenWhite.name = 'sirenWhite'; g.add(sirenWhite);
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.7), gMat).translateY(1.15).translateZ(3.12));
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

export function buildFireTruck(color, isPlayer=false) {
    const g = new THREE.Group();
    const bodyColor = 0xCC0000;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 5.5), M(bodyColor));
    body.position.y = 0.9; g.add(body);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.5).translate(0,0.95,2.5), M(0xBB0000)));
    const stripeMat = M(0xFFD600);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.08, 5.5).translate(0,0.55,0), stripeMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.08, 5.5).translate(0,1.25,0), stripeMat));
    const ladderMat = M(0xBBBBBB);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 4.0).translate(-0.4,1.48,-0.3), ladderMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 4.0).translate(0.4,1.48,-0.3), ladderMat));
    for (let z = -2.0; z < 2.0; z += 0.5) {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 0.04).translate(0,1.5,z), ladderMat));
    }
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.8), gMat).translateY(1.2).translateZ(3.27));
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

export function buildPoliceCar2(color, isPlayer=false) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.5), M(0xEEEEEE));
    body.position.y = 0.5; g.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 4.5), M(0x1565C0));
    stripe.position.y = 0.55; g.add(stripe);
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
    const gMat = new THREE.MeshStandardMaterial({color:0x88ccff,flatShading:true,transparent:true,opacity:0.5,metalness:0.5});
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5), gMat).translateY(1.05).translateZ(0.9));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.45), gMat).translateY(1.0).translateZ(-1.0));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), M(0x222222)).translateY(1.35));
    const redL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0xff0000, 1.5));
    redL.position.set(-0.35, 1.45, 0); redL.name = 'playerPoliceRed'; g.add(redL);
    const blueL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), ME(0x0044ff, 1.5));
    blueL.position.set(0.35, 1.45, 0); blueL.name = 'playerPoliceBlue'; g.add(blueL);
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

export const BODY_BUILDERS = {
    sedan: buildSedan,
    pickup: buildPickup,
    sports: buildSportsCar,
    suv: buildSUV,
    ambulance: buildAmbulance,
    firetruck: buildFireTruck,
    police2: buildPoliceCar2,
};

export const BODY_ICONS = {
    sedan: '<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M16,6L19,10H21C22.11,10 23,10.89 23,12V15H21A3,3 0 0,1 18,18A3,3 0 0,1 15,15H9A3,3 0 0,1 6,18A3,3 0 0,1 3,15H1V12C1,10.89 1.89,10 3,10L6,6H16M10.5,7.5H6.75L4.86,10H10.5V7.5M12,7.5V10H17.14L15.25,7.5H12M6,13.5A1.5,1.5 0 0,0 4.5,15A1.5,1.5 0 0,0 6,16.5A1.5,1.5 0 0,0 7.5,15A1.5,1.5 0 0,0 6,13.5M18,13.5A1.5,1.5 0 0,0 16.5,15A1.5,1.5 0 0,0 18,16.5A1.5,1.5 0 0,0 19.5,15A1.5,1.5 0 0,0 18,13.5Z" /></svg>',
    pickup: '<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M16,6H10.5V10H1V15H3A3,3 0 0,0 6,18A3,3 0 0,0 9,15H15A3,3 0 0,0 18,18A3,3 0 0,0 21,15H23V12C23,10.89 22.11,10 21,10H19L16,6M12,7.5H15.5L17.46,10H12V7.5M6,13.5A1.5,1.5 0 0,1 7.5,15A1.5,1.5 0 0,1 6,16.5A1.5,1.5 0 0,1 4.5,15A1.5,1.5 0 0,1 6,13.5M18,13.5A1.5,1.5 0 0,1 19.5,15A1.5,1.5 0 0,1 18,16.5A1.5,1.5 0 0,1 16.5,15A1.5,1.5 0 0,1 18,13.5Z" /></svg>',
    sports: '<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M12,8.5H7L4,11H3C1.89,11 1,11.89 1,13V16H3.17C3.6,17.2 4.73,18 6,18C7.27,18 8.4,17.2 8.82,16H15.17C15.6,17.2 16.73,18 18,18C19.27,18 20.4,17.2 20.82,16H23V15C23,13.89 21.97,13.53 21,13L12,8.5M5.25,12L7.5,10H11.5L15.5,12H5.25M6,13.5A1.5,1.5 0 0,1 7.5,15A1.5,1.5 0 0,1 6,16.5A1.5,1.5 0 0,1 4.5,15A1.5,1.5 0 0,1 6,13.5M18,13.5A1.5,1.5 0 0,1 19.5,15A1.5,1.5 0 0,1 18,16.5A1.5,1.5 0 0,1 16.5,15A1.5,1.5 0 0,1 18,13.5Z" /></svg>',
    suv: '<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M3,6H16L19,10H21C22.11,10 23,10.89 23,12V15H21A3,3 0 0,1 18,18A3,3 0 0,1 15,15H9A3,3 0 0,1 6,18A3,3 0 0,1 3,15H1V8C1,6.89 1.89,6 3,6M2.5,7.5V10H10.5V7.5H2.5M12,7.5V10H17.14L15.25,7.5H12M6,13.5A1.5,1.5 0 0,0 4.5,15A1.5,1.5 0 0,0 6,16.5A1.5,1.5 0 0,0 7.5,15A1.5,1.5 0 0,0 6,13.5M18,13.5A1.5,1.5 0 0,0 16.5,15A1.5,1.5 0 0,0 18,16.5A1.5,1.5 0 0,0 19.5,15A1.5,1.5 0 0,0 18,13.5Z" /></svg>',
    ambulance: '<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M18,18.5A1.5,1.5 0 0,0 19.5,17A1.5,1.5 0 0,0 18,15.5A1.5,1.5 0 0,0 16.5,17A1.5,1.5 0 0,0 18,18.5M19.5,9.5H17V12H21.46L19.5,9.5M6,18.5A1.5,1.5 0 0,0 7.5,17A1.5,1.5 0 0,0 6,15.5A1.5,1.5 0 0,0 4.5,17A1.5,1.5 0 0,0 6,18.5M20,8L23,12V17H21A3,3 0 0,1 18,20A3,3 0 0,1 15,17H9A3,3 0 0,1 6,20A3,3 0 0,1 3,17H1V6C1,4.89 1.89,4 3,4H17V8H20M8,6V9H5V11H8V14H10V11H13V9H10V6H8Z" /></svg>',
    firetruck: '<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M17.04,2C16.85,2 16.66,2.04 16.5,2.14L5.59,8.5H9.55L17.5,3.86C18,3.58 18.13,2.97 17.85,2.5C17.68,2.2 17.38,2 17.04,2M16,8V10H3A2,2 0 0,0 1,12H2V15H1V19H3A3,3 0 0,0 6,22A3,3 0 0,0 9,19H15A3,3 0 0,0 18,22A3,3 0 0,0 21,19H23V12.5L19.5,8H16M18,9.5H19L21.5,12.5V13.5H18V9.5M4,12H7V15H4V12M9,12H12V15H9V12M14,12H16V15H14V12M6,17.5A1.5,1.5 0 0,1 7.5,19A1.5,1.5 0 0,1 6,20.5A1.5,1.5 0 0,1 4.5,19A1.5,1.5 0 0,1 6,17.5M18,17.5A1.5,1.5 0 0,1 19.5,19A1.5,1.5 0 0,1 18,20.5A1.5,1.5 0 0,1 16.5,19A1.5,1.5 0 0,1 18,17.5Z" /></svg>',
    police2: '<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M11,4H13V6.5H11Z M14,4H16V6.5H14Z" /><path d="M16,6L19,10H21C22.11,10 23,10.89 23,12V15H21A3,3 0 0,1 18,18A3,3 0 0,1 15,15H9A3,3 0 0,1 6,18A3,3 0 0,1 3,15H1V12C1,10.89 1.89,10 3,10L6,6H16M10.5,7.5H6.75L4.86,10H10.5V7.5M12,7.5V10H17.14L15.25,7.5H12M6,13.5A1.5,1.5 0 0,0 4.5,15A1.5,1.5 0 0,0 6,16.5A1.5,1.5 0 0,0 7.5,15A1.5,1.5 0 0,0 6,13.5M18,13.5A1.5,1.5 0 0,0 16.5,15A1.5,1.5 0 0,0 18,16.5A1.5,1.5 0 0,0 19.5,15A1.5,1.5 0 0,0 18,13.5Z" /></svg>',
};

export function buildPlayerCar() {
    const bodyId = garage.selectedBody;
    const colorIdx = garage.selectedColor;
    const colorHex = COLOR_DEFS[colorIdx].hex;
    const builder = BODY_BUILDERS[bodyId] || buildSedan;
    return builder(colorHex, true);
}
