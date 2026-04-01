import { BODY_DEFS, COLOR_DEFS, UPGRADE_DEFS } from '../config/definitions.js';
import { garage, saveGarage } from '../progression/garage.js';
import { BODY_ICONS } from '../builders/cars.js';

export function updateWalletDisplays() {
    const walletEl = document.getElementById('menu-wallet');
    const garageWalletEl = document.getElementById('garage-wallet');
    if (walletEl) walletEl.textContent = garage.wallet > 0 ? '\u{1FA99} ' + garage.wallet : '';
    if (garageWalletEl) garageWalletEl.textContent = '\u{1FA99} ' + garage.wallet;
}

// NOTE: innerHTML usage below is safe — all values come from hardcoded game definitions (BODY_DEFS, COLOR_DEFS, UPGRADE_DEFS),
// not from user input or external sources. No XSS risk.

export function renderGarage() {
    updateWalletDisplays();
    // Bodies
    const bodiesEl = document.getElementById('garage-bodies');
    bodiesEl.innerHTML = '';
    BODY_DEFS.forEach(bd => {
        const owned = garage.ownedBodies.includes(bd.id);
        const selected = garage.selectedBody === bd.id;
        const card = document.createElement('div');
        card.className = 'body-card' + (selected ? ' selected' : owned ? ' owned' : '');
        const iconSvg = BODY_ICONS[bd.id] || '';
        const bodyColor = '#' + (bd.color || 0x1565C0).toString(16).padStart(6, '0');

        card.innerHTML = '<div class="car-preview-svg" style="color: ' + bodyColor + '; width: 100%; height: 50px; margin: 4px auto; display:flex; justify-content:center; align-items:center;">' + iconSvg + '</div>' +
            '<div class="car-name">' + bd.name + '</div>' +
            '<div class="car-price">' + (owned ? '\u2713' : '\u{1FA99} ' + bd.price) + '</div>' +
            (owned && !selected ? '<div class="car-action">\u0412\u042B\u0411\u0420\u0410\u0422\u042C</div>' : '') +
            (!owned ? '<div class="car-action" style="color:#FFD740">\u041A\u0423\u041F\u0418\u0422\u042C</div>' : '');
        card.onclick = () => {
            if (selected) return;
            if (owned) {
                garage.selectedBody = bd.id;
                saveGarage();
                renderGarage();
            } else if (garage.wallet >= bd.price) {
                garage.wallet -= bd.price;
                garage.ownedBodies.push(bd.id);
                garage.selectedBody = bd.id;
                saveGarage();
                renderGarage();
            }
        };
        bodiesEl.appendChild(card);
    });

    // Colors
    const colorsEl = document.getElementById('garage-colors');
    colorsEl.innerHTML = '';
    COLOR_DEFS.forEach((cd, i) => {
        const owned = garage.ownedColors.includes(i);
        const selected = garage.selectedColor === i;
        const wrap = document.createElement('div');
        wrap.style.textAlign = 'center';
        const circle = document.createElement('div');
        circle.className = 'color-circle' + (selected ? ' selected' : '') + (!owned ? ' locked' : '');
        circle.style.background = '#' + cd.hex.toString(16).padStart(6, '0');
        circle.onclick = () => {
            if (selected) return;
            if (owned) {
                garage.selectedColor = i;
                saveGarage();
                renderGarage();
            } else if (garage.wallet >= cd.price) {
                garage.wallet -= cd.price;
                garage.ownedColors.push(i);
                garage.selectedColor = i;
                saveGarage();
                renderGarage();
            }
        };
        wrap.appendChild(circle);
        const price = document.createElement('div');
        price.className = 'color-price';
        price.textContent = owned ? (selected ? '\u2713' : cd.name) : '\u{1FA99} ' + cd.price;
        wrap.appendChild(price);
        colorsEl.appendChild(wrap);
    });

    // Upgrades
    const upgEl = document.getElementById('garage-upgrades');
    upgEl.innerHTML = '';
    UPGRADE_DEFS.forEach(ud => {
        const level = garage.upgrades[ud.id];
        const maxLevel = 5;
        const isMax = level >= maxLevel;
        const cost = isMax ? 0 : ud.costs[level - 1];
        const row = document.createElement('div');
        row.className = 'upgrade-row';
        let barsHtml = '';
        for (let i = 1; i <= maxLevel; i++) {
            barsHtml += '<div class="upgrade-bar-seg' + (i <= level ? ' filled' : '') + '"></div>';
        }
        row.innerHTML = '<div class="upgrade-icon">' + ud.icon + '</div>' +
            '<div class="upgrade-info"><div class="upgrade-name">' + ud.name + ' (' + level + '/' + maxLevel + ')</div>' +
            '<div class="upgrade-bars">' + barsHtml + '</div></div>' +
            '<div class="upgrade-cost">' + (isMax ? '' : '\u{1FA99} ' + cost) + '</div>' +
            '<button class="upgrade-btn' + (isMax ? ' maxed' : '') + '">' + (isMax ? '\u041C\u0410\u041A\u0421' : '\u041A\u0423\u041F\u0418\u0422\u042C') + '</button>';
        const btn = row.querySelector('.upgrade-btn');
        if (!isMax) {
            btn.onclick = () => {
                if (garage.wallet >= cost) {
                    garage.wallet -= cost;
                    garage.upgrades[ud.id] = level + 1;
                    saveGarage();
                    renderGarage();
                }
            };
        }
        upgEl.appendChild(row);
    });
}
