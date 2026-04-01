import { TEXTS, setLang } from '../i18n/index.js';
import { sfx } from '../audio/GameAudio.js';
import { garage, saveGarage } from '../progression/garage.js';
import { AD_COOLDOWN } from '../config/constants.js';

let ysdk = null;
let yPlayer = null;
let gameOverCount = 0;
let lastAdTime = 0;
let adThreshold = 3;

export async function initYandexSDK() {
    try {
        ysdk = await Promise.race([
            YaGames.init(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SDK timeout')), 3000))
        ]);
        try {
            const lang = ysdk.environment.i18n.lang;
            setLang(TEXTS[lang] ? lang : 'en');
        } catch(e) {}
        try { yPlayer = await ysdk.getPlayer({ scopes: false }); } catch(e) {}
        await loadCloudSaves();
    } catch(e) {
        console.warn('Yandex SDK not available');
        const bl = (navigator.language || '').slice(0,2);
        setLang(TEXTS[bl] ? bl : 'en');
    }
}

export async function showInterstitialAd() {
    if (!ysdk || Date.now() - lastAdTime < AD_COOLDOWN) return;
    sfx.mute();
    try {
        await ysdk.adv.showFullscreenAdv({
            callbacks: {
                onClose() { sfx.unmute(); lastAdTime = Date.now(); },
                onError() { sfx.unmute(); }
            }
        });
    } catch(e) { sfx.unmute(); }
}

export function showRewardedAd(onRewarded) {
    if (!ysdk) { onRewarded(); return; }
    sfx.mute();
    ysdk.adv.showRewardedVideo({
        callbacks: {
            onRewarded() { sfx.unmute(); onRewarded(); },
            onClose() { sfx.unmute(); },
            onError() { sfx.unmute(); }
        }
    });
}

export async function saveToCloud() {
    if (!yPlayer) return;
    try {
        await yPlayer.setData({
            wallet: garage.wallet,
            ownedBodies: garage.ownedBodies,
            selectedBody: garage.selectedBody,
            ownedColors: garage.ownedColors,
            selectedColor: garage.selectedColor,
            upgrades: garage.upgrades,
            best: parseInt(localStorage.getItem('rr3d_best') || '0'),
            duelStreak: parseInt(localStorage.getItem('rr3d_duel_streak') || '0'),
        }, true);
    } catch(e) {}
}

async function loadCloudSaves() {
    if (!yPlayer) return;
    try {
        const d = await yPlayer.getData();
        if (!d || Object.keys(d).length === 0) return;
        if (d.wallet !== undefined && d.wallet > garage.wallet) garage.wallet = d.wallet;
        if (d.ownedBodies) d.ownedBodies.forEach(b => { if (!garage.ownedBodies.includes(b)) garage.ownedBodies.push(b); });
        if (d.selectedBody) garage.selectedBody = d.selectedBody;
        if (d.ownedColors) d.ownedColors.forEach(c => { if (!garage.ownedColors.includes(c)) garage.ownedColors.push(c); });
        if (d.selectedColor !== undefined) garage.selectedColor = d.selectedColor;
        if (d.upgrades) { for (const k in d.upgrades) { if (!garage.upgrades[k] || d.upgrades[k] > garage.upgrades[k]) garage.upgrades[k] = d.upgrades[k]; } }
        if (d.best) { const lb = parseInt(localStorage.getItem('rr3d_best')||'0'); if (d.best > lb) localStorage.setItem('rr3d_best', d.best); }
        if (d.duelStreak !== undefined) { const ls = parseInt(localStorage.getItem('rr3d_duel_streak')||'0'); if (d.duelStreak > ls) localStorage.setItem('rr3d_duel_streak', d.duelStreak); }
        saveGarage();
    } catch(e) {}
}

export function onGameEnd() {
    gameOverCount++;
    if (gameOverCount >= adThreshold) {
        showInterstitialAd();
        gameOverCount = 0;
        adThreshold = adThreshold === 3 ? 4 : 3;
    }
    saveToCloud();
}

export function hasYSDK() { return !!ysdk; }
export function notifyReady() { if (ysdk) try { ysdk.features.LoadingAPI.ready(); } catch(e) {} }
