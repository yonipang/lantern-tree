// ================= v127 연출 장면(레터박스) 진행 — 규칙 쪽 (dev/design/연출장면.md, 2026-10-21 사용자 확정) =================
// 대본(data/cutscene.js CINE_SCRIPTS)을 한 칸씩 돌려요. 보는 사람(가까이 있는 사람, 혼자면 나)은 장면 동안:
//   맞지 않고(sim/player.js hurtPlayer) · 배고픔·더위추위 피해가 없고 · 몬스터가 쫓지 않고(sim/enemies.js) · 움직이거나 공격하지 못해요(sim/commands.js ctlOf) — 표시 = pl.p.cine
// 세계는 그대로 계속 진행돼요(멀티에서 다른 사람까지 멈추지 않게). 띠·HUD 숨김·자막·카메라는 화면 쪽(ui/cutscene.js·render/view.js)이 이 상태를 읽어 보여 줘요.
// 장면 진행은 저장하지 않아요 — 중간에 끄면 다음에 장면 끝 상태(나루는 목적지, 보스는 잠든 채 다시 깨어남)로 이어져요.
// 장면이 이미 돌고 있으면 다음 장면은 기다렸다가 이어서 해요.
import { CINE_GEST_T, CINE_LEAD_LINE, CINE_NEAR, CINE_SCRIPTS, CINE_SEED_LINE, cineSayT } from '../data/cutscene.js';
import { BOSSES } from '../data/rpg-nature.js';
import { alivePlayers, curPl, G, myPlayer, withPlayer } from '../save/state.js';
import { defineCmd } from './commands.js';
import { emit } from './events.js';
import { onFrame } from './systems.js';
import { leadPlace, leadWalkStart, leadWalking, naruPos } from './naru.js';
import { treeGrowFx } from './tree.js';
import { CX, CY } from '../world/map.js';

const CINE_TREE = { x: CX + .5, y: CY - 1.2 };
const CSN = { g: null, cur: null, q: [] };
const cineEase = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
// 보는 사람 = 그 자리에서 CINE_NEAR칸 안의 살아 있는 사람 (멀리 있는 사람에게 묻는 띠는 멀티플레이 단계에서)
export const cineViewers = (x, y) => alivePlayers().filter(pl => !pl.p.sleep && Math.hypot(pl.p.x - x, pl.p.y - y) < CINE_NEAR);
export const cineBusy = () => !!(G && CSN.g === G && CSN.cur);
// 그 사람이 지금 보는 장면 (화면 쪽·테스트용)
export const cineOf = pl => pl && pl.p && pl.p.cine && CSN.g === G && CSN.cur && pl.p.cine === CSN.cur ? CSN.cur : null;
export const cineMine = () => cineOf(myPlayer());
// 장면 시작 (보는 사람이 없으면 false — 부른 곳이 예전처럼 바로 해요)
// arg: { line 대사, band 이름 띠, boss 보스, walk/walking 걷기, fx 효과, near 조건, end 끝나면(건너뛰어도), skip 건너뛸 때 먼저 }
export function startCine(id, view, arg = {}) { if (CSN.g !== G) Object.assign(CSN, { g: G, cur: null, q: [] }); view = (view || []).filter(Boolean); if (!view.length || !CINE_SCRIPTS[id]) return false;
  const S = { id, steps: CINE_SCRIPTS[id], i: -1, t: 0, dur: 0, arg, view, by: curPl || myPlayer(), cam: null, cam0: null, camT: 'me', gest: {}, line: null, band: null, said: false, t0: G.time };
  if (CSN.cur) { CSN.q.push(S); return true; } cineBegin(S); return true; }
function cineBegin(S) { CSN.cur = S; const me = S.view[0].p; S.cam = { x: me.x, y: me.y - .3 };
  for (const pl of S.view) { const p = pl.p; p.cine = S; p.dash = null; p.kx = p.ky = 0; p.moving = false; if (p.sit) { p.x = p.sit.px; p.y = p.sit.py; p.sit = null; } withPlayer(pl, () => { G.fish = null; emit('cine', 1, S.id); }); }
  cineStep(S); }
// 곳 → 카메라 자리
function cineCamAt(S, k) { if (k === 'tree') return CINE_TREE; if (k === 'boss' && S.arg.boss) return { x: S.arg.boss.x, y: S.arg.boss.y - .8 };
  if (k === 'naru') { const n = naruPos(); if (n) return { x: n.x, y: n.y - .3 }; } if (k === 'hold') return null;
  const p = (S.view[0] || {}).p; return p ? { x: p.x, y: p.y - .3 } : null; }
// 다음 칸으로: 기다리지 않는 칸은 바로바로, 기다리는 칸에서 멈춰요
function cineStep(S) { for (;;) { S.i++; S.t = 0; S.dur = 0; const st = S.steps[S.i]; if (!st) { cineFinish(S, false); return; }
  if (st.if && !(S.arg[st.if] && S.arg[st.if]())) continue;
  if (st.cam) { S.cam0 = { x: S.cam.x, y: S.cam.y }; S.camT = st.cam; S.dur = st.t || .6; return; }
  if (st.gest) { S.gest[st.who || 'naru'] = { g: st.gest, t0: G.time }; continue; }
  if (st.say) { const s = S.arg.line || ''; if (!s) continue; S.line = { who: st.who || 'naru', s, t0: G.time }; S.said = true; S.dur = cineSayT(s); emit('sfx', 'blip'); return; }
  if (st.walk) { if (S.arg.walk) S.arg.walk(); S.camT = 'naru'; S.dur = -1; return; }
  if (st.fx) { if (S.arg.fx) S.arg.fx(st.fx); continue; }
  if (st.band) { if (S.arg.band) S.band = { s: S.arg.band, t0: G.time }; continue; }
  if (st.wait) { S.dur = st.wait; return; } } }
// 장면 끝 (건너뛰면 skip = true)
function cineFinish(S, skip) { if (CSN.cur !== S) return; CSN.cur = null;
  for (const pl of S.view) if (pl.p.cine === S) { pl.p.cine = null; withPlayer(pl, () => emit('cine', 0, S.id)); }
  if (skip && S.arg.skip) S.arg.skip();
  withPlayer(S.by || myPlayer(), () => { if (skip && !S.said && S.arg.line && S.arg.near !== false && (!S.arg.naruNear || S.arg.naruNear())) emit('bell', [S.arg.line]); if (S.arg.end) S.arg.end(skip); });
  const nx = CSN.q.shift(); if (!nx) return; nx.view = nx.view.filter(pl => pl.p.dead <= 0); if (nx.view.length) { cineBegin(nx); return; } // 기다리던 장면: 보는 사람이 없어졌으면 끝 상태로
  if (nx.arg.skip) nx.arg.skip(); if (nx.arg.end) withPlayer(nx.by || myPlayer(), () => nx.arg.end(true)); }
onFrame('cine', dt => { if (CSN.g !== G) { Object.assign(CSN, { g: G, cur: null, q: [] }); return; } const S = CSN.cur; if (!S) return;
  S.view = S.view.filter(pl => { if (pl.p.cine === S && pl.p.dead <= 0) return true; if (pl.p.cine === S) { pl.p.cine = null; withPlayer(pl, () => emit('cine', 0, S.id)); } return false; });
  if (!S.view.length) { cineFinish(S, true); return; }
  S.t += dt; const st = S.steps[S.i] || {};
  if (st.walk) { if (!S.arg.walking || !S.arg.walking()) { S.camT = 'hold'; cineStep(S); } }
  else if (S.dur >= 0 && S.t >= S.dur) { if (st.say) S.line = null; cineStep(S); }
  if (CSN.cur !== S) return;
  // 카메라: 옮기는 동안은 부드럽게(ease), 다 옮긴 뒤에는 그곳을 따라가요
  const cur = S.steps[S.i] || {}, to = cineCamAt(S, S.camT);
  if (to) { if (cur.cam && S.cam0) { const u = cineEase(Math.min(1, S.t / Math.max(.01, S.dur))); S.cam = { x: S.cam0.x + (to.x - S.cam0.x) * u, y: S.cam0.y + (to.y - S.cam0.y) * u }; } else S.cam = { x: to.x, y: to.y }; }
  for (const k in S.gest) if (G.time - S.gest[k].t0 > CINE_GEST_T) delete S.gest[k]; });
// 누르기: 대사를 다 읽었으면 다음 칸 (타이핑 중 첫 누르기 = 글 다 보이기는 화면 쪽) · 건너뛰기
defineCmd('cineNext', () => { const S = CSN.cur, me = G.p; if (!S || me.cine !== S) return false; const st = S.steps[S.i] || {}; if (!st.say) return false; S.line = null; cineStep(S); return true; });
defineCmd('cineSkip', () => { const S = CSN.cur, me = G.p; if (!S || me.cine !== S) return false;
  if (S.view.length > 1) { me.cine = null; S.view = S.view.filter(pl => pl.p !== me); emit('cine', 0, S.id); if (S.arg.line && !S.said) emit('bell', [S.arg.line]); return true; } // 여럿이 보면 나만 빠져요
  cineFinish(S, true); return true; });
// 그림용: 장면 속 몸짓 (render/world.js) — who: 'naru' | 플레이어
export function cineGest(who) { const S = cineBusy() ? CSN.cur : null; if (!S) return null; const k = who === 'naru' ? 'naru' : who && who.p && S.view.some(pl => pl.p === who.p) ? 'me' : null; const g = k && S.gest[k]; return g ? { g: g.g, u: (G.time - g.t0) / CINE_GEST_T } : null; }

// ---- 시험 장면 3개 (확정 대본 「시험 장면 대본」) ----
// ① 나루 먼저 걷기 (sim/naru.js leadGo): 보는 사람이 있으면 장면, 걷기는 대사 뒤에
export function leadScene(q, view) { return startCine('lead', view, { line: CINE_LEAD_LINE[q] || CINE_LEAD_LINE.ore, walk: () => leadWalkStart(), walking: () => leadWalking(),
  skip: () => { if (leadWalking()) leadPlace(true); } }); }
// ② 빛씨앗 심기 (sim/tree.js insertSeeds): 카메라가 나무로 → 빛 퍼짐 → 나루가 곁이면 한마디 → 돌아와서 기억 장면 창
export function seedScene(from, to, end) { const near = () => { const n = naruPos(); return !!n && Math.hypot(n.x - CINE_TREE.x, n.y - CY) < CINE_NEAR; };
  let grew = false; const grow = () => { if (!grew) { grew = true; treeGrowFx(from, to); } };
  return startCine('seed', cineViewers(CX + .5, CY + 1), { line: CINE_SEED_LINE, naruNear: near, fx: grow, skip: grow, end }); }
// ③ 보스 등장 (sim/bosses.js bossCommon): 보스마다 처음 한 번만 — 본 것은 세계 세이브 G.stats.bIntro (옛 세이브에서 이미 물리친 보스는 본 것으로)
export const bossIntroSeen = k => !!((G.stats.bIntro || {})[k] || (G.stats.beaten || {})[k]);
export function bossScene(b, wake) { const k = b.k; if (bossIntroSeen(k) || b.intro) return false; const view = cineViewers(b.x, b.y); if (!view.length) return false;
  (G.stats.bIntro = G.stats.bIntro || {})[k] = 1; b.intro = 1;
  return startCine('boss', view, { boss: b, band: BOSSES[k].n, fx: () => { b.hurt = .3; emit('shake', .45, true); emit('sfx', 'boss'); emit('puff', b.x, b.y - .5, BOSSES[k].col, 30, 4.5, .8); emit('puff', b.x, b.y - .5, '#ffe9a8', 12, 3, .6); },
    end: () => { b.intro = 0; if (b.st === 'sleep' && !G.bossDead[k]) wake(b, true); } }); }
export const cineState = () => ({ cur: CSN.cur && CSN.g === G ? CSN.cur.id : null, at: CSN.cur ? CSN.cur.i : -1, q: CSN.g === G ? CSN.q.map(S => S.id) : [], view: CSN.cur ? CSN.cur.view.length : 0 }); // 테스트용
