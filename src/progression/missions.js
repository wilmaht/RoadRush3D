import { MISSIONS_POOL } from '../config/definitions.js';

function getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

export function loadDailyMissions() {
    const stored = localStorage.getItem('rr3d_missions');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.date === getTodayStr() && Array.isArray(data.missions) && data.missions.length === 3) {
                return data;
            }
        } catch(e) {}
    }
    // Generate new missions for today
    const shuffled = MISSIONS_POOL.slice().sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3).map(m => ({ id: m.id, completed: false, claimed: false }));
    const data = { date: getTodayStr(), missions: picked };
    localStorage.setItem('rr3d_missions', JSON.stringify(data));
    return data;
}

export function saveMissions(data) {
    localStorage.setItem('rr3d_missions', JSON.stringify(data));
}

export function checkMissions(gameState) {
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
