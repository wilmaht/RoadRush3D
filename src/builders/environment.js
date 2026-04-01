import * as THREE from 'three';
import { isMobile } from '../core/platform.js';
import { M, ME,
    matTrunk, matTrunkDark, matBirchTrunk, matBirchMark,
    matGreen1, matGreen2, matGreen3, matGreenDark, matGreenPine, matGreenLight, matGreenYellow,
    matSnow, matRock, matRockDark, matCactus, matCactusDark,
    matPole, matMetal, matWhite, matWood, matWindow, matDoor,
    matYellow, matRed, matGolden, matReedTop, matReedStem,
    matFence, matFencePost, matCanopy, matPumpBody, matBillboardFrame,
    CITY_WALL_COLORS, AWNING_COLORS, cityWallMats, cityWallDarkMats, cityAwningMats,
    matCityLedge, matCityRoof, matGlass, nightWinMats,
} from '../graphics/materials.js';

export function makeCityBlock(isNight = false) {
    const group = new THREE.Group();
    const buildingCount = isMobile ? (4 + Math.floor(Math.random() * 3)) : (10 + Math.floor(Math.random() * 4));
    let zCursor = 0;

    for (let b = 0; b < buildingCount; b++) {
        const bw = 5 + Math.random() * 4;
        const bhBase = 7 + Math.random() * 8;
        const bd = 5 + Math.random() * 3;
        const colorIdx = Math.floor(Math.random() * CITY_WALL_COLORS.length);
        const wallMat = cityWallMats[colorIdx];
        const darkMat = cityWallDarkMats[colorIdx];
        const bg = new THREE.Group();

        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw, bhBase, bd).translate(0, bhBase / 2, 0), wallMat));
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.4, 0.4, bd + 0.4).translate(0, bhBase + 0.2, 0), matCityLedge));

        if (Math.random() < 0.7) {
            const bw2 = bw * (0.6 + Math.random() * 0.3);
            const bh2 = 4 + Math.random() * 6;
            const bd2 = bd * (0.6 + Math.random() * 0.3);
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw2, bh2, bd2).translate(0, bhBase + bh2/2, 0), darkMat));
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw2 + 0.3, 0.3, bd2 + 0.3).translate(0, bhBase + bh2 + 0.15, 0), matCityLedge));

            if (Math.random() < 0.4) {
                const bw3 = bw2 * 0.6;
                const bh3 = 2 + Math.random() * 4;
                const bd3 = bd2 * 0.6;
                bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw3, bh3, bd3).translate(0, bhBase + bh2 + bh3/2, 0), wallMat));
            }
        }

        const baseH = 3.0;
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.1, baseH, bd + 0.1).translate(0, baseH / 2, 0), matCityRoof));

        const winCount = Math.max(2, Math.floor(bw / 1.8));
        const winW = (bw * 0.8) / winCount - 0.2;
        const startX = -(winCount - 1) * (winW + 0.2) / 2;
        const activeWinMat = nightWinMats[Math.floor(Math.random() * nightWinMats.length)];

        for (let w = 0; w < winCount; w++) {
            const wx = startX + w * (winW + 0.2);
            const isLit = isNight && Math.random() < 0.5;
            const wMat = isLit ? activeWinMat : matGlass;
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(winW, 1.8, 0.08).translate(wx, 1.4, bd / 2 + 0.06), wMat));
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(winW + 0.1, 1.9, 0.05).translate(wx, 1.4, bd / 2 + 0.05), matCityLedge));
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(winW, 1.8, 0.08).translate(wx, 1.4, -bd / 2 - 0.06), wMat));
        }

        const awnMat = cityAwningMats[Math.floor(Math.random() * AWNING_COLORS.length)];
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.15, 1.0).translate(0, baseH + 0.1, bd / 2 + 0.5), awnMat));
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.4, 0.08).translate(0, baseH - 0.1, bd / 2 + 0.95), awnMat));
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.15, 1.0).translate(0, baseH + 0.1, -bd / 2 - 0.5), awnMat));
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.95, 0.4, 0.08).translate(0, baseH - 0.1, -bd / 2 - 0.95), awnMat));
        bg.add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.2, 0.2, bd + 0.2).translate(0, baseH + 0.3, 0), awnMat));

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
                if (isLit) {
                    bg.add(new THREE.Mesh(new THREE.BoxGeometry(fww, 0.05, 0.15).translate(fx, y - 0.2, bd / 2 + 0.08), activeWinMat));
                }
            }
        }

        if (Math.random() < 0.6) {
            const sw = bd * 0.5;
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, bhBase * 0.6, sw).translate(bw / 2 + 0.05, bhBase * 0.5, 0), matGlass));
            bg.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, bhBase * 0.6, sw).translate(-bw / 2 - 0.05, bhBase * 0.5, 0), matGlass));
        }

        bg.position.z = zCursor + bd / 2;
        group.add(bg);
        zCursor += bd;
    }

    const totalZ = zCursor;
    group.children.forEach(ch => { ch.position.z -= totalZ / 2; });
    return group;
}

export function makeTree(c1=0x2E7D32, c2=0x4CAF50, trunk=0x795548) {
    const g = new THREE.Group();
    const sc = 0.85 + Math.random()*0.3;
    const h = (1.8 + Math.random()*1.2) * sc;
    const trunkMat = trunk===0x795548 ? matTrunk : M(trunk);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1*sc,0.2*sc,h,6).translate(0,h/2,0), trunkMat));
    const foliageMat1 = c1===0x2E7D32 ? matGreen1 : M(c1);
    const foliageMat2 = c2===0x4CAF50 ? matGreen2 : M(c2);
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.2*sc,1).translate(0,h+0.8*sc,0), foliageMat1));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.8*sc,1).translate(0.5*sc,h+0.5*sc,0.4*sc), foliageMat2));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.7*sc,1).translate(-0.4*sc,h+0.6*sc,-0.3*sc), foliageMat1));
    return g;
}

export function makeBirch() {
    const g = new THREE.Group();
    const h = 3.0 + Math.random()*2.0;
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.1,h,6).translate(0,h/2,0), matBirchTrunk));
    for(let y=0.4;y<h-0.3;y+=0.5+Math.random()*0.3) {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.04,0.12).translate((Math.random()-0.5)*0.04,y,0), matBirchMark));
    }
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.8,0).translate(0,h+0.4,0), matGreenLight));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55,0).translate(0.25,h+0.9,0.15), matGreenYellow));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45,5,4).translate(-0.2,h+1.1,-0.1), matGreenLight));
    return g;
}

export function makeBush(c=0x388E3C) {
    const g = new THREE.Group();
    const bushMat = c===0x388E3C ? matGreen3 : M(c);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45+Math.random()*0.2,5,4).translate(0,0.35,0), bushMat));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3+Math.random()*0.15,5,3).translate(0.3,0.3,0.15), matGreen2));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.25+Math.random()*0.1,4,3).translate(-0.25,0.28,-0.1), bushMat));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.2,4,3).translate(0.05,0.55,0.08), matGreen2));
    return g;
}

export function makePine(c=0x1B5E20) {
    const g = new THREE.Group();
    const h = 1.4+Math.random()*0.8;
    const piMat = c===0x1B5E20 ? matGreenDark : M(c);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.14,h,6).translate(0,h/2,0), matTrunkDark));
    const r1 = 0.9+Math.random()*0.3, h1 = 1.4+Math.random()*0.4;
    const r2 = 0.7+Math.random()*0.2, h2 = 1.2+Math.random()*0.3;
    const r3 = 0.45+Math.random()*0.15, h3 = 0.9+Math.random()*0.2;
    g.add(new THREE.Mesh(new THREE.ConeGeometry(r1,h1,6).translate(0,h+h1*0.4,0), piMat));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(r2,h2,6).translate(0,h+h1*0.5+h2*0.35,0), matGreenPine));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(r3,h3,6).translate(0,h+h1*0.5+h2*0.5+h3*0.3,0), piMat));
    if (Math.random() < 0.35) {
        g.add(new THREE.Mesh(new THREE.ConeGeometry(0.15,0.25,5).translate(0,h+h1*0.5+h2*0.5+h3*0.7,0), matSnow));
    }
    return g;
}

export function makeTreeCluster(type='mixed') {
    const g = new THREE.Group();
    const count = 3 + Math.floor(Math.random()*2);
    for (let i=0;i<count;i++) {
        let tree;
        if (type==='pine') tree = makePine();
        else if (type==='birch') tree = makeBirch();
        else tree = Math.random()<0.4 ? makeTree() : (Math.random()<0.5 ? makeBirch() : makePine());
        tree.position.set((Math.random()-0.5)*6, 0, (Math.random()-0.5)*6);
        tree.scale.setScalar(0.6 + Math.random()*0.5);
        g.add(tree);
    }
    const bushCount = 1 + Math.floor(Math.random()*2);
    for (let i=0;i<bushCount;i++) {
        const bush = makeBush();
        bush.position.set((Math.random()-0.5)*4, 0, (Math.random()-0.5)*4);
        bush.scale.setScalar(0.7+Math.random()*0.5);
        g.add(bush);
    }
    return g;
}

export function makeBuilding(w,h,d,color,night=false) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d).translate(0,h/2,0), M(color)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w+0.3,0.25,d+0.3).translate(0,h+0.12,0), M(0x555555)));
    const wc = night?0xFFEB3B:0x88BBEE;
    const wm = night?ME(wc,0.9):matWindow;
    const awningMat = M(0x78909C);
    let meshCount = 0;
    for(let y=2;y<h-1 && meshCount<6;y+=2.5) {
        for(let x=-w/2+1;x<w/2 && meshCount<6;x+=1.8) {
            if(night && Math.random()>0.5) continue;
            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7,0.9,0.1),wm).translateX(x).translateY(y).translateZ(d/2+0.05));
            meshCount++;
            if (y < 3.5 && Math.random()<0.4) {
                g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9,0.05,0.4).translate(x,y+0.6,d/2+0.25), awningMat));
            }
            if (y > 4 && Math.random()<0.3) {
                g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4,0.3,0.3).translate(x,y-0.7,d/2+0.2), matMetal));
            }
        }
    }
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9,1.6,0.1).translate(0,0.8,d/2+0.05), matDoor));
    return g;
}

export function makeHouse() {
    const g = new THREE.Group();
    const wallMat = M(0xFFFFFA);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.5,2.5,3.5).translate(0,1.25,0), wallMat));
    const roofGeo = new THREE.BufferGeometry();
    const rw=2.2, rh=1.8, rl=2.2;
    const rv = new Float32Array([
        -rw,0,-rl, rw,0,-rl, rw,0,rl, -rw,0,rl,
        0,rh,-rl, 0,rh,rl
    ]);
    const ri = [0,1,4, 1,2,5, 1,5,4, 2,3,5, 3,0,4, 3,4,5, 0,2,1, 0,3,2];
    roofGeo.setAttribute('position', new THREE.BufferAttribute(rv,3));
    roofGeo.setIndex(ri);
    roofGeo.computeVertexNormals();
    const roof = new THREE.Mesh(roofGeo, M(0xFF5722));
    roof.position.y = 2.5;
    g.add(roof);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4,1.4,0.4).translate(1.0,3.2,0), M(0xD84315)));
    const winMat = M(0x81D4FA);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.1,12).rotateX(Math.PI/2).translate(-0.8,1.5,1.76), winMat));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.1,12).rotateX(Math.PI/2).translate(0.8,1.5,1.76), winMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7,1.3,0.1).translate(0,0.65,1.76), M(0x795548)));
    const fp = M(0xFFFFFF);
    [-2.2,2.2].forEach(x => {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.8,6).translate(x,0.4,2.5), fp));
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.8,6).translate(x,0.4,-2.5), fp));
    });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.4,0.1,0.06).translate(0,0.65,2.5), fp));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.4,0.1,0.06).translate(0,0.35,2.5), fp));
    return g;
}

export function makeWater() {
    const g = new THREE.Group();
    const w = 8+Math.random()*8, d = 4+Math.random()*5;
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
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w+1,0.2,0.6).translate(0,0.05,d/2+0.3), matWood));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w+1,0.2,0.6).translate(0,0.05,-d/2-0.3), matWood));
    for (let i=0;i<3;i++) {
        const rx = (Math.random()-0.5)*w*0.6;
        const rz = (Math.random()<0.5?1:-1)*(d/2+0.1);
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.2,4).translate(rx,0.6,rz), matReedStem));
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,4,3).translate(rx,1.2,rz), matReedTop));
    }
    return g;
}

export function makeBridge() {
    const g = new THREE.Group();
    const bridgeMat = M(0x9E9E9E);
    const archMat = M(0x757575);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(12,0.35,5).translate(0,1.2,0), bridgeMat));
    for (let z=-1.5;z<=1.5;z+=3) {
        const archGeo = new THREE.TorusGeometry(0.8, 0.15, 6, 8, Math.PI);
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.rotation.y = Math.PI/2;
        arch.position.set(0, 0.4, z);
        g.add(arch);
    }
    [[-5,0],[-5,3],[5,0],[5,3],[-5,-3],[5,-3]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,1.2,0.3).translate(p[0],0.6,p[1]-1.5), archMat));
    });
    const railMat = M(0x616161);
    [-5.8,5.8].forEach(x => {
        for(let z=-2;z<=2;z+=1) g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.0,5).translate(x,1.7,z), railMat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,5).translate(x,2.2,0), railMat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,5).translate(x,1.6,0), railMat));
    });
    return g;
}

export function makeBarrier() {
    const g = new THREE.Group();
    const postCount = 4;
    for (let i=0;i<postCount;i++) {
        const pz = i*1.0 - (postCount-1)*0.5;
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08,0.7,0.08).translate(0,0.35,pz), matPole));
    }
    const railW = (postCount-1)*1.0 + 0.3;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.12,railW).translate(0,0.55,0), matMetal));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.12,railW).translate(0,0.3,0), matMetal));
    for (let i=0;i<postCount-1;i++) {
        const sz = i*1.0 - (postCount-2)*0.5;
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.06).translate(0.04,0.55,sz), matYellow));
    }
    return g;
}

export function makeRock(s=1) {
    const g = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(0.7*s, 1);
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

export function makeCactus() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,3.0,6).translate(0,1.5,0), matCactus));
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

export function makeSign(type) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,3.0,6).translate(0,1.5,0), matPole));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4,0.05,0.4).translate(0,0.02,0), matPole));
    if (type==='speed') {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.06,12).translate(0,3.0,0), matWhite));
        g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,3.0,0.03), matRed));
    } else if (type==='warning') {
        g.add(new THREE.Mesh(new THREE.ConeGeometry(0.5,0.55,3).rotateZ(Math.PI).translate(0,3.1,0), M(0xFFEB3B)));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.06).translate(0,3.0,0.03), matRed));
    } else {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9,0.6,0.06).translate(0,3.0,0), M(0x1976D2)));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5,0.2,0.07).translate(0,3.0,0.01), matWhite));
    }
    return g;
}

export function makeGasStation() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5,2.0,2.0).translate(0,1.0,-1.5), M(0xCFD8DC)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.7,0.15,2.2).translate(0,2.05,-1.5), matRockDark));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6,1.2,0.1).translate(0,0.6,-0.49), matDoor));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.1).translate(0.8,1.3,-0.49), matWindow));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.0,0.12,3.5).translate(0,3.0,1.0), matCanopy));
    [[-1.6,1.8],[1.6,1.8],[-1.6,2.8],[1.6,2.8]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,3.0,6).translate(p[0],1.5,p[1]), matMetal));
    });
    [-0.6,0.6].forEach(x => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,1.2,0.3).translate(x,0.6,1.5), matPumpBody));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.35,0.1,0.35).translate(x,1.25,1.5), matRockDark));
    });
    return g;
}

export function makeBillboard() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.12,6.0,6).translate(-1.5,3.0,0), matBillboardFrame));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.12,6.0,6).translate(1.5,3.0,0), matBillboardFrame));
    const adColors = [0x1976D2,0xD32F2F,0x388E3C,0xFF8F00,0x7B1FA2];
    const adColor = adColors[Math.floor(Math.random()*adColors.length)];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.0,2.0,0.15).translate(0,5.5,0), M(adColor)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.2,0.1,0.2).translate(0,6.55,0), matBillboardFrame));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.2,0.1,0.2).translate(0,4.45,0), matBillboardFrame));
    return g;
}

export function makeFenceRow() {
    const g = new THREE.Group();
    const length = 6 + Math.floor(Math.random()*4);
    for (let i=0; i<length; i++) {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.0,5).translate(0,0.5,i*1.2-(length-1)*0.6), matFencePost));
    }
    const barW = (length-1)*1.2 + 0.2;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,barW).translate(0,0.75,0), matFence));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,barW).translate(0,0.4,0), matFence));
    return g;
}

export function makeHayBale() {
    const g = new THREE.Group();
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.9,8), matGolden);
    bale.rotation.z = Math.PI/2;
    bale.position.y = 0.6;
    g.add(bale);
    const capMat = M(0xBB9030);
    const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.58,0.58,0.03,8), capMat);
    cap1.rotation.z = Math.PI/2;
    cap1.position.set(-0.46,0.6,0);
    g.add(cap1);
    return g;
}

export function makeShop() {
    const g = new THREE.Group();
    const shopColors = [0x9C27B0,0x03A9F4,0xE91E63,0xFF9800];
    const wallColor = shopColors[Math.floor(Math.random()*shopColors.length)];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4,3,3).translate(0,1.5,0), M(wallColor)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.4,0.2,3.4).translate(0,3.1,0), M(0x666666)));
    const vitrinaMat = new THREE.MeshStandardMaterial({color:0xBBDDFF,flatShading:true,transparent:true,opacity:0.4,metalness:0.3});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5,1.8,0.08).translate(0,1.4,1.52), vitrinaMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.8,2.0,0.08).translate(-1.5,1.0,1.52), M(0x5D4037)));
    const signColors = [0xFF1744,0x2979FF,0x00E676,0xFFD600,0xFF6D00];
    const signColor = signColors[Math.floor(Math.random()*signColors.length)];
    const signMat = ME(signColor, 1.2);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.0,0.6,0.12).translate(0,2.9,1.55), signMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.2,0.08,1.0).translate(0,2.5,2.0), M(0x555555)));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.1,4,3).translate(1.2,2.4,1.6), ME(0xFFDD88,0.8)));
    return g;
}

export function makeGasStationLit() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3,2.5,2.5).translate(0,1.25,-2), M(0x03A9F4)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.2,0.15,2.7).translate(0,2.55,-2), M(0xE91E63)));
    const glassMat = new THREE.MeshStandardMaterial({color:0xBBDDFF,flatShading:true,transparent:true,opacity:0.4});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8,1.2,0.08).translate(0,1.2,-0.74), glassMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7,1.5,0.08).translate(-0.9,0.75,-0.74), M(0x5D4037)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(5,0.15,4).translate(0,3.5,1), M(0x3F51B5)));
    [[-2,1.5],[2,1.5],[-2,3],[2,3]].forEach(p => {
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,3.5,6).translate(p[0],1.75,p[1]), M(0xFFEB3B)));
    });
    [-0.8,0.8].forEach(x => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4,1.4,0.4).translate(x,0.7,1.5), M(0xE53935)));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.45,0.1,0.45).translate(x,1.45,1.5), M(0x424242)));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25,0.2,0.05).translate(x,1.1,1.72), ME(0x4CAF50,0.6)));
    });
    const logoColors = [0xFF0000,0x2196F3,0x4CAF50,0xFFC107];
    const logoColor = logoColors[Math.floor(Math.random()*logoColors.length)];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.5,0.8,0.12).translate(0,2.4,-0.74), ME(logoColor,1.0)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.5,0.05,1.5).translate(0,3.42,1.5), ME(logoColor,0.5)));
    return g;
}

export function makeLamp(on=false) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,5.0,6).translate(0,2.5,0),M(0x666666)));
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

export function makeTrafficLight() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,5.5,6).translate(0,2.75,0),M(0x222222)));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3.0,0.08,0.08).translate(-1.5,5.5,0),M(0x222222)));
    const boxX = -3.0;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.8,0.3).translate(boxX,5.1,0),M(0x1a1a1a)));
    const activeLight = Math.floor(Math.random()*3);
    const darkMat = M(0x444444);
    const redMat = activeLight===0 ? ME(0xff0000,1.5) : darkMat;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4).translate(boxX,5.35,0.16),redMat));
    const yellowMat = activeLight===1 ? ME(0xffcc00,1.5) : darkMat;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4).translate(boxX,5.1,0.16),yellowMat));
    const greenMat = activeLight===2 ? ME(0x00cc44,1.5) : darkMat;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4).translate(boxX,4.85,0.16),greenMat));
    return g;
}

export function makeRoadSign60() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.5,6).translate(0,1.25,0),matPole));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.05,12).translate(0,2.7,0),matWhite));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,2.7,0.03),matRed));
    const matBlack = M(0x111111);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(-0.18,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(-0.06,2.625,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.06,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.18,2.7,0.04),matBlack));
    return g;
}

export function makeRoadSign90() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.5,6).translate(0,1.25,0),matPole));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.05,12).translate(0,2.7,0),matWhite));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,2.7,0.03),matRed));
    const matBlack = M(0x111111);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(-0.18,2.775,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(-0.06,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(-0.12,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.12,0.03,0.06).translate(0.12,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.06,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.18,2.7,0.04),matBlack));
    return g;
}

export function makeRoadSign120() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.5,6).translate(0,1.25,0),matPole));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.05,12).translate(0,2.7,0),matWhite));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.47,0.07,6,12).translate(0,2.7,0.03),matRed));
    const matBlack = M(0x111111);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(-0.2,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(-0.04,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(0.01,2.775,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(-0.04,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.06).translate(-0.09,2.625,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(-0.04,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(0.16,2.85,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.03,0.06).translate(0.16,2.55,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.11,2.7,0.04),matBlack));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.3,0.06).translate(0.21,2.7,0.04),matBlack));
    return g;
}

export function spawnEnvObject(type, isNight=false) {
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
            if(r<0.60){ mesh=makeCityBlock(isNight); cat='building'; }
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
