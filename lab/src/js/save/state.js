// ================= 실험판 상태 (G) — 본 게임 save/state.js 자리에 들어가요 =================
// 본 게임 공용 파일(그리기·그림·사건·명령)이 가져가는 이름만 같은 이름으로 갖춰요: G·cam·curPl·ME·withPlayer·playerList …
// 실험판 세계는 본 게임 세이브와 따로예요 (아직 저장하지 않아요 — L1).
// 멀티플레이를 다시 붙일 수 있게 본 게임 규칙을 따라요: 플레이어는 G.players 안에, G.p는 「지금 플레이어」를 가리켜요.
export let G = null;
export const cam = { x: 0, y: 0 };
export let paused = true, started = false, soundOn = true;
export const setPaused = v => { paused = v; }, setStarted = v => { started = v; }, setSound = v => { soundOn = v; };
export const ME = 'me';
export let curPl = null;
export function withPlayer(pl, fn) { const old = curPl; curPl = pl; try { return fn(); } finally { curPl = old; } }
export const playerList = () => (G && G.players ? Object.values(G.players) : []);
export const myPlayer = () => G && G.players && G.players[ME];
export function nearestPlayer(x, y) { let best = null, bd = 1e9; for (const pl of playerList()) { const d = Math.hypot(pl.p.x - x, pl.p.y - y); if (d < bd) { bd = d; best = pl; } } return best; }
// 플레이어마다 따로인 칸: G.p·G.inv …는 지금 플레이어(curPl) 것을 가리켜요
export const PER_PLAYER = ['p', 'inv', 'char', 'look', 'equip', 'act', 'swing', 'digCd', 'explored'];
export function setWorld(g, pl) {
  G = g; g.players = { [pl.id]: pl };
  for (const k of PER_PLAYER) Object.defineProperty(g, k, { get: () => curPl[k], set: v => { curPl[k] = v; }, enumerable: false, configurable: true });
  curPl = pl; return g;
}
// 본 게임 그림 파일(art/characters.js)이 보는 장비 칸 (실험판은 아직 장비가 없어요)
export const freshEquip = () => ({ head: null, neck: null, ring: null, ring2: null, bag: null, buff: null, lamp: null, legs: null, body: null });
// 본 게임 데이터 파일이 가져가는 이름 (실험판엔 보스가 없어요)
export const beat = () => false;
export const guardOf = () => null;
