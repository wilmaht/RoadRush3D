import * as THREE from 'three';

// Фабрики материалов
export const M  = c        => new THREE.MeshStandardMaterial({ color: c, flatShading: true });
export const ME = (c, e=0.5) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, emissive: c, emissiveIntensity: e });

// ======================== ENVIRONMENT MATERIALS ========================
// Reusable materials (created once for performance)
export const matTrunk        = M(0x795548);
export const matTrunkDark    = M(0x5D4037);
export const matBirchTrunk   = M(0xEEEEDD);
export const matBirchMark    = M(0x444444);
export const matGreen1       = M(0x2E7D32);
export const matGreen2       = M(0x4CAF50);
export const matGreen3       = M(0x388E3C);
export const matGreenDark    = M(0x1B5E20);
export const matGreenPine    = M(0x2E7D32);
export const matGreenLight   = M(0x7CB342);
export const matGreenYellow  = M(0x9CCC65);
export const matRock         = M(0x8D8D8D);
export const matRockDark     = M(0x6D6D6D);
export const matCactus       = M(0x388E3C);
export const matCactusDark   = M(0x2E7D32);
export const matPole         = M(0x888888);
export const matMetal        = M(0xAAAAAA);
export const matWhite        = M(0xEEEEEE);
export const matWood         = M(0x8D6E63);
export const matWoodDark     = M(0x5D4037);
export const matRoof         = M(0x8D4E2A);
export const matWindow       = M(0x88BBEE);
export const matSnow         = M(0xEEEEFF);
export const matYellow       = M(0xFFB300);
export const matRed          = M(0xCC0000);
export const matGolden       = M(0xD4A843);
export const matDoor         = M(0x5D4037);
export const matReedTop      = M(0x8D6E63);
export const matReedStem     = M(0x558B2F);
export const matFence        = M(0xA1887F);
export const matFencePost    = M(0x795548);
export const matCanopy       = M(0x546E7A);
export const matPumpBody     = M(0xCFD8DC);
export const matBillboardFrame = M(0x666666);

// City block shared materials (Synthwave / Vector Art)
export const CITY_WALL_COLORS = [0x9C27B0, 0x673AB7, 0x3F51B5, 0x03A9F4, 0x00BCD4, 0x009688, 0xFF9800, 0xFF5722, 0xE91E63, 0xF50057, 0xFFEB3B, 0x7B1FA2];
export const cityWallMats     = CITY_WALL_COLORS.map(c => M(c));
export const cityWallDarkMats = CITY_WALL_COLORS.map(c => M(new THREE.Color(c).multiplyScalar(0.7)));

export const AWNING_COLORS  = [0xE21A4B, 0xFF4081, 0x00E5FF, 0xFFD740, 0x7E57C2];
export const cityAwningMats = AWNING_COLORS.map(c => M(c));

export const matCityLedge = M(0x283593);
export const matCityRoof  = M(0x1A237E);
export const matGlass     = M(0x1A237E); // Сплошное тёмное окно
export const nightWinMats = [ME(0x00E5FF, 1.2), ME(0xFF4081, 1.2), ME(0xFFEA00, 1.2), ME(0x00E676, 1.2)];
