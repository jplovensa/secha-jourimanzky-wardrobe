import { ROOM, SHOE_RACK } from './model.js';

export const CHEST = { x: 1.55, width: .9, depth: .4, height: .9 };
export const RAIL_HEIGHTS = [1.05, 2];
export const ENTRANCE = { width: ROOM.width - SHOE_RACK.width, x: (ROOM.width + SHOE_RACK.width) / 2 };
export function buildShoeRack(box, material) {
  const { width, depth, height } = SHOE_RACK;
  const panel = .018;
  const z = SHOE_RACK.z + depth / 2;
  for (const x of [panel / 2, width / 2, width - panel / 2]) {
    box(panel, height - .1, depth - .009, x, (height + .06) / 2, z, material);
  }
  box(width, height - .1, .009, width / 2, (height + .06) / 2, ROOM.depth - .0045, material);
  box(width, .08, depth, width / 2, .04, z, material);
  box(width, .02, .018, width / 2, height - .01, SHOE_RACK.z + .009, material);
  const shelfTops = [];
  for (const [bottom, moduleHeight, rows] of [[.08,1.4,5],[1.48,1.11,4]]) {
    for (let i = 0; i <= rows; i++) {
      const y = bottom + panel / 2 + i * (moduleHeight - panel) / rows;
      box(width - 2 * panel, panel, depth - .009, width / 2, y, z, material);
      if (i < rows) shelfTops.push(y + panel / 2);
    }
  }
  return shelfTops;
}
