// All model dimensions are metres. PDF set-out x maps to X, y maps to Z.
export const ROOM = Object.freeze({ width: 2.022, depth: 2.157, height: 2.610 });
export const QUESTS = ['Try a material finish', 'Open a drawer', 'Move an accessory', 'Step inside the space'];
export function clampAsset(x, z) { return { x: Math.max(.15, Math.min(1.85, x)), z: Math.max(.15, Math.min(1.95, z)) }; }
