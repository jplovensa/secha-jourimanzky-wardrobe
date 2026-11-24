// All model dimensions are metres. PDF set-out x maps to X, y maps to Z.
export const ROOM = Object.freeze({ width: 2.022, depth: 2.157, height: 2.610 });
export const QUESTS = ['Find your entrance bearings', 'Inspect the L hanging', 'Open a drawer', 'Inspect the left mirror', 'Style the shoe rack'];
export function clampAsset(x, z) { return { x: Math.max(.15, Math.min(1.85, x)), z: Math.max(.15, Math.min(1.95, z)) }; }

// D: SD-01 open rack, left of entrance, measured floorplan coordinates (metres).
export const SHOE_RACK = Object.freeze({ x: 0, z: 1.807, width: 1.216, depth: .350, height: 2.610, levels: 9 });
