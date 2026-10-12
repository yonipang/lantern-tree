// ================= 요리: 배운 요리·레시피 쪽지, 음식 버프·행운 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
const pct = v => Math.round(v * 100) + '%';
function noteHint(d) { const s = d.src; if (s === 'mon') return '이끼 동굴·버섯숲 몬스터가 가끔 떨어뜨려요'; if (s === 'gather') return '풀·작물·빛버섯을 거둘 때 가끔 나와요'; if (s === 'fish') return '낚시하다 보면 가끔 걸려요'; if (s === 'bottle') return '낚시하다 병 속 쪽지로 걸려요'; if (s === 'ending') return '다섯 등불을 모두 밝히면';
  if (s.startsWith('room:')) return `${REGION_N[+s[6]]} 숨은 방 어딘가`; if (s.startsWith('boss:')) return `${BOSSES[s.slice(5)].n}을(를) 물리치면`; if (s.startsWith('guide:')) { const q = GUIDE.find(x => x.id === s.slice(6)); return q ? `이야기 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '이야기 퀘스트 보상'; } if (s.startsWith('quest:')) { const q = QSIDE.find(x => x.id === s.slice(6)); return q ? `도전 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '도전 퀘스트 보상'; } return ''; }
const knows = id => !DISH[id] || !!(G && G.recipes && G.recipes[id]);
const buffText = it => { if (!it.buff) return ''; const [ef, tier] = it.buff, E = EFF[ef], m = BUFF_DUR[tier - 1] * (it.star ? 1.5 : 1) / 60; return `${E.n} ${E.t(E.v[tier - 1])} · ${Number.isInteger(m) ? m : m.toFixed(1)}분`; };
function learnRecipe(id, quiet) { if (!DISH[id] || !G) return false; G.recipes = G.recipes || {}; if (G.recipes[id]) return false; G.recipes[id] = 1; UIS.craftOrder = null;
  if (!quiet) { emit('toast', `새 레시피를 알게 됐어요: ${DISH[id].n}! (요리솥)`, 'good'); emit('sfx', 'seed'); } return true; }
function maybeNote(src, x, y) { if (!G || !G.recipes || rand() >= (NOTE_CH[src] || 0)) return; const pool = DISHES.filter(d => d[7] === src && !knows(d[0]) && !G.drops.some(q => q.id === 'rn_' + d[0])); if (!pool.length) return; spawnDrop('rn_' + pool[(rand() * pool.length) | 0][0], 1, x, y); }
function roomNotes(r) { const list = ROOM_NOTES[r.b] || [], n = (G.rooms || []).filter(q => q.b === r.b).length; return n >= list.length ? [list[r.k]].filter(Boolean) : r.k === 0 ? list.slice() : []; }
function bossNoteIds(k) { const list = (BOSS_NOTES[k] || []).slice(), rg = BOSS_REGION[k]; if (rg != null && !(G.rooms || []).some(q => q.b === rg)) list.push(...ROOM_NOTES[rg]); return list; }
// ---- buffs ----
const activeBuffs = () => (G && G.buffs ? G.buffs.filter(b => b.end > G.time) : []);
function bval(ef) { if (!G || !G.buffs) return 0; let best = null; for (const b of G.buffs) if (b.ef === ef && b.end > G.time && (!best || b.tier > best.tier)) best = b; return best ? EFF[ef].v[best.tier - 1] : 0; }
const luckTier = () => Math.max(bval('luck'), (G.luck || 0) > G.time ? 2 : 0, petIs('cat') ? 1 : 0); // the fountain wish counts as a tier-2 luck effect
let buffAsk = null;
function buffCheck(it, id) { const [ef, tier] = it.buff, act = activeBuffs(), same = act.find(b => b.ef === ef);
  if (same) { if (same.tier > tier) { emit('toast', '더 좋은 효과가 이미 있어요 · 배만 불러요', null, 'buffLow'); return 'lower'; } return 'ok'; }
  if (act.length < BUFF_MAX) return 'ok';
  if (buffAsk && buffAsk.id === id && performance.now() < buffAsk.until) { buffAsk = null; return 'ok'; }
  const sh = act.reduce((a, b) => b.end < a.end ? b : a); buffAsk = { id, until: performance.now() + 5000 };
  emit('toast', `효과 칸이 가득 찼어요. 한 번 더 먹으면 남은 시간이 가장 짧은 「${EFF[sh.ef].n}」 효과와 바꿔요`, 'warn', 'buffFull'); return 'ask'; }
function applyBuff(it, id) { const [ef, tier] = it.buff, dur = BUFF_DUR[tier - 1] * (it.star ? 1.5 : 1); G.buffs = activeBuffs();
  const same = G.buffs.find(b => b.ef === ef); if (same) Object.assign(same, { tier, end: G.time + dur, max: dur, id });
  else { if (G.buffs.length >= BUFF_MAX) { const sh = G.buffs.reduce((a, b) => b.end < a.end ? b : a); G.buffs.splice(G.buffs.indexOf(sh), 1); } G.buffs.push({ ef, tier, end: G.time + dur, max: dur, id }); }
  if (ef === 'maxhp') G.p.hp = Math.min(maxHp(), G.p.hp); emit('toast', `${EFF[ef].n} ${EFF[ef].t(EFF[ef].v[tier - 1])} · ${Math.round(dur / 6) / 10}분`, 'good', 'buff'); buffDirty = true; }
let buffDirty = true, lastBuffKey = '', buffRegenT = 0;
onFrame('buff', dt => buffTick(dt));
function buffTick(dt) {
  if (!G.buffs) G.buffs = []; if (G.buffs.some(b => b.end <= G.time)) { const gone = G.buffs.filter(b => b.end <= G.time); G.buffs = G.buffs.filter(b => b.end > G.time); for (const b of gone) emit('toast', `${EFF[b.ef].n} 효과가 끝났어요`, null, 'buffEnd'); if (G.p.hp > maxHp()) G.p.hp = maxHp(); buffDirty = true; }
  const rg = bval('regen'); if (rg && G.p.dead <= 0) { buffRegenT += dt; if (buffRegenT >= rg) { buffRegenT = 0; if (G.p.hp < maxHp()) G.p.hp = Math.min(maxHp(), G.p.hp + 1); } } else buffRegenT = 0;
}
