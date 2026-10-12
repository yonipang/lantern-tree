// ---- chests touching a crafting station lend their items (a chain of touching chests counts as one big store) ----
let POOL = null;
function linkedChests() {
  if (POOL) return POOL;
  const p = G.p, seen = new Set(), out = [], q = [];
  for (let y = Math.floor(p.y) - 4; y <= p.y + 4; y++) for (let x = Math.floor(p.x) - 4; x <= p.x + 4; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t].station) for (const j of fpTiles(idx(x, y), o)) q.push([j % W, (j / W) | 0]); }
  while (q.length && out.length < 80) { const [x, y] = q.shift();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j)) continue; const o = G.objs.get(j); if (o && o.t === 'chest' && o.items) { seen.add(j); out.push(o); q.push([nx, ny]); } } }
  return out;
}
const slotIs = (s, id) => !!s && idIs(s.id, id);
function availCount0(id) { let n = countItem(id); for (const o of linkedChests()) for (const s of o.items) if (slotIs(s, id)) n += s.c; return n; }
const availCount = id => availCount0(id) + (STAR_OF[id] ? availCount0(STAR_OF[id]) : 0); // star crops stand in for the plain ones
function takeAvail0(id, c) { // bag first, then the linked chests; returns what is still missing
  const fromBag = Math.min(c, countItem(id)); if (fromBag) removeItem(id, fromBag); c -= fromBag;
  for (const o of linkedChests()) for (let k = 0; k < o.items.length && c > 0; k++) { const s = o.items[k]; if (!slotIs(s, id)) continue; const t = Math.min(s.c, c); s.c -= t; c -= t; if (!s.c) o.items[k] = null; }
  return c;
}
function takeAvail(id, c) { c = takeAvail0(id, c); if (c > 0 && STAR_OF[id]) takeAvail0(STAR_OF[id], c); invDirty = true; } // plain ones go first, star ones are kept for last
function refillHot(slot, id) {
  if (slot == null || slot >= HOT || G.inv[slot] || !id) return;
  for (let j = HOT; j < G.inv.length; j++) { const t = G.inv[j]; if (t && t.id === id) { G.inv[slot] = t; G.inv[j] = null; invDirty = true; ftext(G.p.x, G.p.y - 1.5, `${ITEMS[id].n} 보충`, '#bfe6ff'); return; } }
}
// bag (not the hotbar) → chest; 'same' only moves kinds the chest already holds
function stashBag(o, same) { let n = 0, left = 0; for (let i = HOT; i < G.inv.length; i++) { const s = G.inv[i]; if (!s) continue; if (same && !o.items.some(x => x && x.id === s.id)) continue; const l = moveInto(o.items, s); n += s.c - l; if (l) { s.c = l; left++; } else G.inv[i] = null; } return { n, left }; }
function moveInto(arr, s) { const mx = stackMax(s.id); let left = s.c; for (let i = 0; i < arr.length && left; i++) { const t = arr[i]; if (t && t.id === s.id && t.c < mx) { const k = Math.min(mx - t.c, left); t.c += k; left -= k; } } const ord = arr === G.inv ? [...Array(arr.length - HOT).keys()].map(k => k + HOT).concat([...Array(HOT).keys()]) : [...arr.keys()]; for (const i of ord) if (left && !arr[i]) { arr[i] = { id: s.id, c: Math.min(mx, left) }; if (s.dur != null) arr[i].dur = s.dur; if (s.w != null) arr[i].w = s.w; if (s.lv) arr[i].lv = s.lv; left -= arr[i].c; } return left; }
