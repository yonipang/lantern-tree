// ================= v59: smelting and cooking take time — put the materials in, come back for the result =================
// one recipe per furnace / pot at a time (up to 30). It runs on real time, so it keeps going while a panel is open and while the game is closed.
const JOB_MAX = 30, TIMED = { furnace: 1, pot: 1 };
const SMELT_T = { copperBar: 5, ironBar: 10, quartzR: 20, goldBar: 20 }; // anything else smelted later (frost …) takes 30 s
const COOK_T = [6, 10, 30, 50]; // by dish tier: recovery dishes · basic · special · legendary (plain foods 6 s)
function jobTime(r) { if (r.at === 'furnace') return SMELT_T[r.out] || 30; const d = DISH[r.dish || r.out]; return d ? COOK_T[d.tier] || 10 : COOK_T[0]; }
const nowS = () => Date.now() / 1000;
const jobDone = j => j ? clamp(Math.floor((nowS() - j.t0) / j.per), 0, j.q) : 0;
const jobLeft = j => j ? Math.max(0, j.t0 + j.q * j.per - nowS()) : 0;
const fmtT = sec => { sec = Math.ceil(sec); return sec >= 60 ? `${Math.floor(sec / 60)}분${sec % 60 ? ` ${sec % 60}초` : ''}` : `${sec}초`; };
function stockMap() { const m = {}, add = s => { if (s && s.id) m[s.id] = (m[s.id] || 0) + s.c; }; G.inv.forEach(add); for (const o of linkedChests()) (o.items || []).forEach(add); return m; }
function takeJob(o, x, y, quiet) { const j = o && o.job; if (!j) return 0; const d = jobDone(j); if (!d) return 0; const total = d * j.n;
  const left = addItem(j.out, total); if (left) spawnDrop(j.out, left, x, y);
  G.stats.made = G.stats.made || {}; G.stats.made[j.out] = (G.stats.made[j.out] || 0) + d; gainXp(Math.min(8, d));
  if (d >= j.q) delete o.job; else { j.used = j.used.map(([id, c]) => [id, c - Math.floor(c * d / j.q)]); j.q -= d; j.t0 += d * j.per; }
  if (!quiet) { SFX.craft(); craftNote(j.out, total); } invDirty = true; checkGuide(); return total; }
// cancelling hands back what is finished and the materials of everything not started yet
function cancelJob(o, x, y) { if (!o || !o.job) return; takeJob(o, x, y, true); const j = o.job; if (!j) return; const rest = j.q - jobDone(j);
  for (const [id, c] of j.used) { const back = Math.floor(c * rest / j.q); if (back > 0 && ITEMS[id]) { const l = addItem(id, back, false); if (l) spawnDrop(id, l, x, y); } }
  delete o.job; invDirty = true; }
function jobHTML(o) { const j = o.job; if (!j) return ''; const d = jobDone(j), it = ITEMS[j.out], prog = clamp((nowS() - j.t0) / (j.q * j.per), 0, 1);
  return `<div class="rc ok jobcard" data-done="${d}"><div class="ri"><img class="px" src="${iconURL(j.out)}" alt=""></div><div class="rn">${it.n} ${j.q * j.n}개 ${d >= j.q ? '· 다 됐어요!' : TIMED && o.t === 'furnace' ? '녹이는 중' : '만드는 중'}<div class="fixbar" style="max-width:none"><i id="jobBar" style="width:${Math.round(prog * 100)}%"></i></div><div class="ings"><span class="ing" id="jobTxt">${d}/${j.q} 완료${d < j.q ? ` · 남은 시간 ${fmtT(jobLeft(j))}` : ''}</span></div></div>
    <div class="btns" style="grid-column:auto;flex-direction:column"><button type="button" class="btn mk" data-a="jobTake" ${d ? '' : 'disabled'}>꺼내기${d ? ` ${d * j.n}` : ''}</button><button type="button" class="btn ghost mk ${UIS.jobAsk ? 'warn' : ''}" data-a="jobCancel">${UIS.jobAsk ? '정말?' : '취소'}</button></div></div>`; }
// the job card updates itself while the panel is open
let jobUiT = 0;
function jobPanelTick(dt) { if (!panel || panel.kind !== 'craft' || !TIMED[panel.st]) return; jobUiT -= dt; if (jobUiT > 0) return; jobUiT = .25;
  const o = panel.i != null && G.objs.get(panel.i), j = o && o.job, card = document.querySelector('#sheet .jobcard');
  if (!j) { if (card) renderPanel(); return; } if (!card || +card.dataset.done !== jobDone(j)) { renderPanel(); return; }
  const bar = document.getElementById('jobBar'), tx = document.getElementById('jobTxt'), d = jobDone(j);
  if (bar) bar.style.width = Math.round(clamp((nowS() - j.t0) / (j.q * j.per), 0, 1) * 100) + '%'; if (tx) tx.textContent = `${d}/${j.q} 완료${d < j.q ? ` · 남은 시간 ${fmtT(jobLeft(j))}` : ''}`; }
// v59: the world (crops, trees, animals, pits …) keeps growing while the game is closed or the tab is in the background
const OFF_MAX = 30 * 86400;
function advanceOffline(sec) { if (!G || !(sec > 1)) return 0; sec = Math.min(sec, OFF_MAX); G.time += sec; for (const b of G.buffs || []) b.end += sec; return sec; } // food buffs wait for you
