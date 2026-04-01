// ======================== LANE & ROAD ========================
export const LANE_X    = [-3.5, 0, 3.5];
export const ROAD_W    = 12;
export const LANE_CHANGE_COOLDOWN = 100; // ms

// ======================== COLLISION ========================
export const COLLISION_W     = 2.0;  // half-width for obstacle collision
export const COLLISION_D     = 3.0;  // half-depth for obstacle collision
export const NEAR_MISS_W     = 3.8;  // width within which near-miss triggers
export const COIN_COLLECT_W  = 1.8;
export const COIN_COLLECT_D  = 2.5;
export const BOOST_COLLECT_W = 1.8;
export const BOOST_COLLECT_D = 2.5;

// ======================== SPEED ========================
export const BASE_MAX_SPEED      = 130;   // km/h
export const ENGINE_BONUS_PER_LV = 0.15;  // +15% per engine upgrade level
export const BRAKE_DECEL_BASE    = 40;
export const BRAKE_BONUS_PER_LV  = 0.25;  // +25% per brakes upgrade level
export const ACCEL_NORMAL        = 5;
export const ACCEL_BOOST         = 25;
export const MIN_SPEED           = 20;

// NOS
export const NOS_DURATION_BASE   = 3;     // seconds at level 1
export const NOS_DURATION_BONUS  = 1;     // +1s per level
export const NOS_SPEED_MULT_BASE = 1.5;
export const NOS_SPEED_BONUS     = 0.05;  // +5% per level

// Handling
export const LANE_SPEED_BASE     = 10;
export const HANDLING_BONUS      = 0.2;   // +20% per level

// Fuel
export const FUEL_DRAIN_BASE     = 0.08;  // per second at 130 km/h
export const TANK_BONUS_PER_LV   = 0.1;   // -10% per level

// Weather
export const WEATHER_RAIN_BRAKE  = 0.7;
export const WEATHER_SNOW_BRAKE  = 0.6;
export const WEATHER_SNOW_SPEED  = 0.9;

// ======================== SCORING ========================
export const SCORE_DIST_MULT  = 0.4;
export const SCORE_COIN       = 25;
export const SCORE_NEAR_MISS  = 50;

// ======================== SPAWN INTERVALS (ms) ========================
export const COIN_SPAWN_INTERVAL  = 1500;
export const BOOST_SPAWN_INTERVAL = 8000;
export const ENV_SPAWN_MOBILE     = 250;
export const ENV_SPAWN_DESKTOP    = 180;

// ======================== GAME MODES ========================
export const CHASE_POLICE_START_DIST = 400;
export const CHASE_WIN_DIST          = 3000;
export const DUEL_FINISH_DIST        = 2000;
export const COP_CRIMINAL_START_DIST = 500;
export const TIMER_MODE_DURATION     = 60;   // seconds
export const POLICE_RESPAWN_DELAY    = 15;   // seconds before police respawns

// ======================== ENVIRONMENT ========================
export const LAMP_SPACING        = 50;
export const LAMP_OFFSET_X       = ROAD_W / 2 + 1.5;
export const TRAFFIC_LIGHT_SPACING = 300;
export const ROAD_SIGN_SPACING   = 150;
export const ENV_GRID_STEP       = 30;   // metres between env spawn rows
export const ENV_LOOKAHEAD       = 200;  // metres ahead to pre-spawn
export const ENV_CLEANUP_BEHIND  = 25;   // metres behind to despawn

// ======================== AD ========================
export const AD_COOLDOWN = 60000; // ms
