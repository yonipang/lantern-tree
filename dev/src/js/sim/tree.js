// ================= 등불나무: 자라는 단계, 빛씨앗 넣기 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
const treeStage = () => G ? clamp(G.treeSeeds | 0, 0, 5) : 0;
// moss and little flowers on bare ground (dirt or moss with nothing on it) near the roots; decided per tile, never stored
function spreadKind(x, y, R) {
  if (!R || !inB(x, y)) return null; const i = idx(x, y); if (G.wall[i] || (G.floor[i] !== 1 && G.floor[i] !== 2) || G.objs.get(i) || G.wire.has(i)) return null;
  const e = Math.hypot(x - CX, y - CY) / R; if (e >= 1 || hash2(x, y, 71) > .6 * (1 - e * e * e)) return null;
  const k = hash2(x, y, 72); return k < .55 ? 'm' + (((k * 6) | 0) % 3) : ['R', 'B', 'Y', 'W'][Math.min(3, ((k - .55) / .45 * 4) | 0)];
}
function insertSeeds() {
  const n = Math.min(countItem('lightSeed'), 5 - G.treeSeeds); if (n <= 0) return; const from = treeStage(); removeItem('lightSeed', n); G.treeSeeds += n; lightDirty = true;
  TREEFX.grow = { t: 0, from, to: treeStage() }; emit('shake', .15);
  emit('sfx', 'seed'); emit('puff', CX + .5, CY - 1, '#ffd25c', 30, 4, 2); G.p.hp = maxHp(); gainXp(50 * n);
  if (G.treeSeeds >= 5 && !G.won2) { G.won = true; G.won2 = true; learnRecipe('festCake', true); emit('win', 'win2'); }
  else if (G.treeSeeds >= 3 && !G.won) { G.won = true; emit('win', 'win'); }
  else emit('toast', `등불나무가 조금 더 밝아졌어요 (${G.treeSeeds}/${G.treeSeeds < 3 ? 3 : 5})`, 'good');
}
