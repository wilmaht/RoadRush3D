// Persistent player progression — гараж, кошелёк, апгрейды

export const garage = {
    wallet:        parseInt(localStorage.getItem('rr3d_wallet') || '0'),
    ownedBodies:   JSON.parse(localStorage.getItem('rr3d_owned_bodies')  || '["sedan"]'),
    selectedBody:  localStorage.getItem('rr3d_selected_body') || 'sedan',
    ownedColors:   JSON.parse(localStorage.getItem('rr3d_owned_colors')  || '[0]'),
    selectedColor: parseInt(localStorage.getItem('rr3d_selected_color')  || '0'),
    upgrades:      JSON.parse(localStorage.getItem('rr3d_upgrades') || '{"engine":1,"brakes":1,"nos":1,"handling":1,"tank":1,"magnet":1}'),
};

export function saveGarage() {
    localStorage.setItem('rr3d_wallet',       garage.wallet);
    localStorage.setItem('rr3d_owned_bodies', JSON.stringify(garage.ownedBodies));
    localStorage.setItem('rr3d_selected_body',garage.selectedBody);
    localStorage.setItem('rr3d_owned_colors', JSON.stringify(garage.ownedColors));
    localStorage.setItem('rr3d_selected_color',garage.selectedColor);
    localStorage.setItem('rr3d_upgrades',     JSON.stringify(garage.upgrades));
}

// Ensure defaults are always owned
if (!garage.ownedBodies.includes('sedan'))  garage.ownedBodies.push('sedan');
if (!garage.ownedColors.includes(0))        garage.ownedColors.push(0);
if (!garage.upgrades.magnet)                garage.upgrades.magnet = 1;
saveGarage();

export function loadDuelStreak() {
    return parseInt(localStorage.getItem('rr3d_duel_streak') || '0');
}
export function saveDuelStreak(val) {
    localStorage.setItem('rr3d_duel_streak', String(val));
}
