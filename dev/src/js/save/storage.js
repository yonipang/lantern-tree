import { $ } from '../engine/util.js';
import { G, SAVE_KEY, deserialize, fmtPlay, serialize, started } from './state.js';
import { GUIDE } from '../data/quests.js';
import { toast } from '../engine/effects.js';
export let saveFailWarned = false;
export function saveLocal(silent) {
  try { const txt = JSON.stringify(serialize()); localStorage.setItem(SAVE_KEY, txt); if (localStorage.getItem(SAVE_KEY) !== txt) throw new Error('verify'); if (!silent) toast('저장했어요', 'good'); return true; }
  catch (e) { if (!silent || !saveFailWarned) { saveFailWarned = true; toast('이 화면에서는 저장이 되지 않아요! 메뉴 → 세이브 파일로 내보내기로 꼭 백업해 주세요', 'warn', 'savefail'); } return false; }
}
// keeps the last 3 saves that were about to be replaced (new game, import, and a snapshot every 20 minutes of play)
export const BACKUP_KEY = 'lantern-tree-backups';
export function loadBackups() { try { const b = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]'); return Array.isArray(b) ? b.filter(x => x && x.data) : []; } catch (e) { return []; } }
export function pushBackup(reason, dataStr) {
  try { const data = dataStr || localStorage.getItem(SAVE_KEY); if (!data) return; const b = loadBackups(); if (b.length && b[0].data === data) return;
    b.unshift({ at: Date.now(), reason, data }); while (b.length > 3) b.pop(); localStorage.setItem(BACKUP_KEY, JSON.stringify(b)); } catch (e) { }
}
export function storageWorks() { try { localStorage.setItem('lantern-tree-probe', '1'); const ok = localStorage.getItem('lantern-tree-probe') === '1'; localStorage.removeItem('lantern-tree-probe'); return ok; } catch (e) { return false; } }

// ---- cloud save (Firebase). Works on the website / home-screen app; the Claude preview cannot reach outside servers ----
export const FB_CONFIG = { apiKey: 'AIzaSyCsGbKTF6oQiS9_Ow_sAZJBH2XfDfjABYw', authDomain: 'lamp-tree.firebaseapp.com', projectId: 'lamp-tree', storageBucket: 'lamp-tree.firebasestorage.app', messagingSenderId: '614596289531', appId: '1:614596289531:web:161d6a23c5eeb9da3ce15e' };
export const CLOUD = { st: 'off', user: null, api: null, lastUp: 0, busy: false, err: '', pending: null };
export const FB_ERR = { 'auth/popup-closed-by-user': '로그인 창이 닫혔어요', 'auth/cancelled-popup-request': '로그인 창이 닫혔어요', 'auth/popup-blocked': '로그인 창이 막혔어요. 이메일 로그인을 써 보세요',
  'auth/invalid-credential': '이메일이나 비밀번호가 맞지 않아요', 'auth/wrong-password': '비밀번호가 맞지 않아요', 'auth/user-not-found': '가입된 이메일이 아니에요. 새로 가입을 눌러 주세요', 'auth/invalid-email': '이메일 주소를 다시 확인해 주세요',
  'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인을 눌러 주세요', 'auth/weak-password': '비밀번호는 6자 이상이어야 해요', 'auth/unauthorized-domain': '이 주소는 아직 로그인이 허용되지 않았어요 (Firebase 승인된 도메인 확인)',
  'auth/network-request-failed': '인터넷 연결을 확인해 주세요', 'permission-denied': '클라우드 저장 권한이 없어요 (Firestore 규칙 확인)', 'unavailable': '클라우드에 연결할 수 없어요. 잠시 뒤 다시 해 주세요' };
export const fbErr = e => FB_ERR[e && e.code] || '클라우드 작업에 실패했어요' + (e && e.code ? ` (${e.code})` : '');
export const fmtTime = t => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
export async function cloudInit() {
  if (window.__cloudMock) CLOUD.api = window.__cloudMock;
  else {
    if (window.claude?.use || location.protocol !== 'https:') { CLOUD.st = 'na'; return; }
    CLOUD.st = 'loading';
    try { const B = 'https://www.gstatic.com/firebasejs/10.12.2/'; const [a, au, fs] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')]);
      const app = a.initializeApp(FB_CONFIG), auth = au.getAuth(app), db = fs.getFirestore(app);
      CLOUD.api = { onAuth: cb => au.onAuthStateChanged(auth, cb), google: () => au.signInWithPopup(auth, new au.GoogleAuthProvider()), emailIn: (e, pw) => au.signInWithEmailAndPassword(auth, e, pw), emailUp: (e, pw) => au.createUserWithEmailAndPassword(auth, e, pw),
        out: () => au.signOut(auth), get: async uid => { const d = await fs.getDoc(fs.doc(db, 'saves', uid)); return d.exists() ? d.data() : null; }, put: (uid, d) => fs.setDoc(fs.doc(db, 'saves', uid), d) };
    } catch (e) { CLOUD.st = 'na'; CLOUD.err = 'load'; cloudRefresh(); return; }
  }
  CLOUD.api.onAuth(u => { CLOUD.user = u ? { uid: u.uid, name: u.displayName || u.email || '로그인됨' } : null; CLOUD.st = u ? 'in' : 'out'; if (u) cloudCheck(); else { CLOUD.pending = null; CLOUD.doc = null; CLOUD.docRun = null; CLOUD.prev = null; CLOUD.diffRun = false; CLOUD.wantTake = false; showCloudAsk(); } cloudRefresh(); });
}
export function cloudRefresh() { if (panel && panel.kind === 'menu') renderPanel(); cloudTitleRefresh(); }
// what a save looks like at a glance, for choosing between two of them
export function saveInfo(sv, at) { if (!sv) return null; return { run: sv.run || '', at: at || sv.at || 0, playT: Number.isFinite(sv.playT) ? sv.playT : (+sv.time || 0), est: !Number.isFinite(sv.playT) || !!sv.playTEst, seeds: sv.treeSeeds || 0, lv: (sv.rpg && sv.rpg.lv) || 1 }; }
export function parseSave(txt) { try { return JSON.parse(txt); } catch (e) { return null; } }
export function docInfo(doc) { if (!doc || !doc.data) return null; if (!doc.__info) doc.__info = saveInfo(parseSave(doc.data), doc.at); return doc.__info; }
export function localInfo() { if (started && G) return saveInfo(serialize()); return saveInfo(loadLocal()); }
export function infoLine(i) { return i ? `플레이 ${fmtPlay(i.playT, i.est)} · 빛씨앗 ${i.seeds}개 · Lv ${i.lv}<br>${fmtTime(i.at)} 저장` : '세이브 없음'; }
export function cloudCompareHTML(doc) { return `<div class="cmp"><div><b>☁ 클라우드</b><span>${infoLine(docInfo(doc))}</span></div><div><b>📱 이 기기</b><span>${infoLine(localInfo())}</span></div></div>`; }
export async function cloudCheck() {
  if (!CLOUD.user) return; let doc;
  try { doc = await CLOUD.api.get(CLOUD.user.uid); } catch (e) { toast(fbErr(e), 'warn', 'cloudget'); return; }
  doc = doc && doc.data ? doc : null; CLOUD.doc = doc; CLOUD.docRun = doc ? (doc.run || (docInfo(doc) || {}).run || '') : null; CLOUD.prev = doc && doc.prev && doc.prev.data ? doc.prev : null;
  // the player pressed "continue from cloud" on the title screen: just load it
  if (CLOUD.wantTake) { CLOUD.wantTake = false; if (doc) { CLOUD.pending = doc; cloudTakePending(); return; } toast('이 계정에는 아직 클라우드 세이브가 없어요', 'warn', 'cloudnone'); }
  const local = loadLocal(), localAt = (local && local.at) || 0;
  if (!doc) { CLOUD.lastUp = 0; CLOUD.diffRun = false; if (local) cloudUpload(true); cloudRefresh(); return; }
  const localRun = (local && local.run) || (started && G && G.run) || '';
  // a different adventure (or one saved before adventures had ids): never overwrite either side without asking
  if (!local || !localRun || !CLOUD.docRun || localRun !== CLOUD.docRun) {
    if (local && local.run && CLOUD.docRun === local.run) { /* same */ } else {
      CLOUD.pending = doc; CLOUD.diffRun = !!local; showCloudAsk();
      if (started) toast(local ? '클라우드에 다른 모험이 있어요. 메뉴에서 어느 쪽을 쓸지 골라 주세요' : '클라우드에 세이브가 있어요. 메뉴에서 확인해 주세요', 'good', 'cloudnew');
      cloudRefresh(); return;
    }
  }
  CLOUD.diffRun = false;
  if ((doc.at || 0) > localAt + 3000) { CLOUD.pending = doc; showCloudAsk(); if (started) toast('클라우드에 더 최근 세이브가 있어요. 메뉴에서 확인해 주세요', 'good', 'cloudnew'); cloudRefresh(); return; }
  CLOUD.lastUp = doc.at || 0; cloudUpload(true);
}
export async function cloudUpload(force, quiet = true) {
  if (!CLOUD.user || CLOUD.busy || CLOUD.pending) return false; if (!force && !started) return false;
  if (started) saveLocal(true); let data = null; try { data = localStorage.getItem(SAVE_KEY); } catch (e) { } if (!data && G) data = JSON.stringify(serialize()); if (!data) return false;
  const sv = parseSave(data); if (!sv) return false;
  if (!sv.run && G && G.run) { sv.run = G.run; data = JSON.stringify(sv); }
  const at = sv.at || Date.now(); if (!force && at <= CLOUD.lastUp) return true;
  // replacing a different adventure in the cloud: keep that one as the cloud backup
  let prev = CLOUD.prev;
  if (CLOUD.doc && CLOUD.doc.data && CLOUD.docRun !== sv.run && CLOUD.doc.data !== data) { const i = docInfo(CLOUD.doc) || {}; prev = { data: CLOUD.doc.data, at: CLOUD.doc.at || 0, run: CLOUD.docRun || '', playT: i.playT || 0, seeds: i.seeds || 0 }; }
  if (prev && prev.data.length + data.length > 900000) prev = null;
  const info = saveInfo(sv, at), doc = { data, at, char: (G && G.char) || 'sprout', v: 2, run: sv.run, playT: Math.round(info.playT), seeds: info.seeds };
  if (prev) doc.prev = prev;
  CLOUD.busy = true;
  try { await CLOUD.api.put(CLOUD.user.uid, doc); CLOUD.lastUp = at; CLOUD.doc = { data, at, run: sv.run }; CLOUD.docRun = sv.run; CLOUD.prev = prev || null; if (!quiet) toast('클라우드에 올렸어요', 'good'); return true; }
  catch (e) { toast(fbErr(e), 'warn', 'cloudput'); return false; }
  finally { CLOUD.busy = false; cloudRefresh(); }
}
export function cloudTakePending(fromPrev) {
  const doc = fromPrev ? CLOUD.prev : CLOUD.pending; if (!doc) return; const sv = parseSave(doc.data); if (!sv) { toast('클라우드 세이브를 읽지 못했어요'); return; }
  if (started) saveLocal(true); pushBackup(fromPrev ? '클라우드 백업 되돌리기 전' : '클라우드 세이브 불러오기 전');
  try { deserialize(sv); } catch (e) { toast('클라우드 세이브를 불러오지 못했어요'); return; }
  CLOUD.pending = null; CLOUD.diffRun = false; UIS.prevAsk = false;
  // taking the cloud's own save: it is now the same adventure (an old save just got its id). Taking the backup: the current cloud save becomes the backup
  if (!fromPrev) { CLOUD.docRun = G.run; CLOUD.lastUp = doc.at || 0; }
  showCloudAsk(); if (panel) closePanel(); beginPlay(); toast(fromPrev ? '클라우드 백업으로 되돌렸어요' : '클라우드 세이브를 불러왔어요', 'good');
  cloudUpload(true);
}
export function cloudKeepLocal() { CLOUD.pending = null; CLOUD.diffRun = false; showCloudAsk(); cloudUpload(true, false); cloudRefresh(); }
export function showCloudAsk() { const el = $('#cloudAsk'); if (!el) return; const d = CLOUD.pending; el.hidden = !d || started; if (!d) return;
  const hasLocal = started || !!loadLocal(), t = CLOUD.diffRun ? '☁ 클라우드에 다른 모험이 있어요' : hasLocal ? '☁ 클라우드에 더 최근 세이브가 있어요' : '☁ 클라우드에 저장된 모험이 있어요';
  const sub = CLOUD.diffRun ? '어느 쪽으로 할까요? 고르지 않은 쪽은 백업해 둬요.' : hasLocal ? '불러오면 이 기기 세이브는 백업해 둬요.' : '불러와서 이어서 할 수 있어요.';
  el.innerHTML = `<p>${t}<br><span style="color:var(--muted);font-size:14px">${sub}</span></p>${cloudCompareHTML(d)}<div class="menu-two"><button class="btn" type="button" data-cl="take">클라우드 것 불러오기</button><button class="btn ghost" type="button" data-cl="keep">이 기기 것 쓰기</button></div>`; }
// title screen: log in and continue from the cloud without starting a new game first
export function cloudTitleRefresh() {
  const bt = $('#btnCloud'), box = $('#cloudTitle'); if (!bt || !box) return;
  const ok = !started && (CLOUD.st === 'in' || CLOUD.st === 'out') && !CLOUD.pending; bt.hidden = !ok; if (!ok) { box.hidden = true; return; }
  bt.textContent = CLOUD.st === 'in' ? `☁ 클라우드에서 이어하기` : '☁ 클라우드에서 이어하기 (로그인)';
  if (CLOUD.st !== 'out' || !UIS.clTitle) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<p class="hint" style="margin:0 0 10px">로그인하면 클라우드에 저장된 모험을 바로 불러와요.</p><div class="menu-two"><button class="btn ghost" data-ct="google" type="button">구글로 로그인</button><button class="btn ghost" data-ct="emailT" type="button">이메일로 로그인</button></div>` +
    (UIS.clTitleEmail ? `<div class="cl-form"><input id="ctEm" type="email" placeholder="이메일" autocomplete="email"><input id="ctPw" type="password" placeholder="비밀번호 (6자 이상)" autocomplete="current-password"><div class="menu-two"><button class="btn" data-ct="in" type="button">로그인</button><button class="btn ghost" data-ct="up" type="button">새로 가입</button></div></div>` : '');
}
export function cloudTitleClick() {
  if (CLOUD.st === 'in') { if (CLOUD.doc) { CLOUD.pending = CLOUD.doc; cloudTakePending(); } else toast('이 계정에는 아직 클라우드 세이브가 없어요', 'warn', 'cloudnone'); return; }
  UIS.clTitle = !UIS.clTitle; cloudTitleRefresh();
}
// play time and when each main quest was cleared (testers send this to measure pacing)
export function playRecordHTML() {
  const rows = GUIDE.filter(g => G.qt && G.qt[g.id]).map(g => `<div class="qtrow"><span>${escHTML(String(g.t()).replace(/\s*\([^)]*\)\s*$/, ''))}</span><b>${fmtPlay(G.qt[g.id])}</b></div>`);
  let h = `<div class="lbl" style="margin-top:16px">플레이 기록</div><p class="hint" id="playTime">플레이 시간 <b style="color:var(--text)">${fmtPlay(G.playT, G.playTEst)}</b>${G.playTEst ? ' (기록을 시작하기 전 시간은 어림값이에요)' : ''}</p>`;
  h += `<div class="menu-list"><button class="btn ghost" data-a="qtShow" type="button">${UIS.qtShow ? '구간 기록 접기' : '구간 기록 보기'}</button></div>`;
  if (UIS.qtShow) h += `<div class="qtlist">${rows.length ? rows.join('') : '<p class="hint">아직 기록된 목표가 없어요. 이제부터 목표를 이룰 때마다 그때의 플레이 시간이 남아요.</p>'}</div>`;
  return h;
}
export function cloudMenuHTML() {
  let h = `<div class="lbl" style="margin-top:16px">클라우드 저장</div>`;
  if (CLOUD.st === 'na') return h + `<p class="hint">${CLOUD.err === 'load' ? '클라우드에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.' : '사이트 주소(홈 화면 앱)로 연 게임에서 쓸 수 있어요.'}</p>`;
  if (CLOUD.st !== 'in' && CLOUD.st !== 'out') return h + `<p class="hint">연결하는 중…</p>`;
  if (CLOUD.st === 'out') {
    h += `<p class="hint">로그인하면 세이브가 자동으로 클라우드에 올라가고, 다른 기기에서도 이어서 할 수 있어요.</p><div class="menu-two"><button class="btn ghost" data-a="clGoogle" type="button">구글로 로그인</button><button class="btn ghost" data-a="clEmailT" type="button">이메일로 로그인</button></div>`;
    if (UIS.clEmail) h += `<div class="cl-form"><input id="clEm" type="email" placeholder="이메일" autocomplete="email"><input id="clPw" type="password" placeholder="비밀번호 (6자 이상)" autocomplete="current-password"><div class="menu-two"><button class="btn" data-a="clIn" type="button">로그인</button><button class="btn ghost" data-a="clUp" type="button">새로 가입</button></div></div>`;
    return h;
  }
  if (CLOUD.pending) h += `<div class="impbox"><p>${CLOUD.diffRun ? '클라우드에 다른 모험이 있어요' : `클라우드에 더 최근 세이브가 있어요`}<br><span style="color:var(--muted);font-size:14px">${CLOUD.diffRun ? '어느 쪽으로 할까요? 고르기 전까지는 클라우드에 올리지 않아요. 고르지 않은 쪽은 백업해 둬요.' : '불러오면 지금 세이브는 백업해 둬요.'}</span></p>${cloudCompareHTML(CLOUD.pending)}<div class="menu-two"><button class="btn" data-a="clTake" type="button">클라우드 것 불러오기</button><button class="btn ghost" data-a="clKeep" type="button">이 기기 것 쓰기</button></div></div>`;
  h += `<p class="hint">${escHTML(CLOUD.user.name)} · ${CLOUD.lastUp ? '마지막 업로드 ' + fmtTime(CLOUD.lastUp) : '아직 올리지 않았어요'} · 2분마다 자동으로 올려요</p><div class="menu-two"><button class="btn ghost" data-a="clUpNow" type="button" ${CLOUD.busy ? 'disabled' : ''}>지금 올리기</button><button class="btn ghost" data-a="clOut" type="button">로그아웃</button></div>`;
  if (CLOUD.prev && !CLOUD.pending) { const i = saveInfo(parseSave(CLOUD.prev.data), CLOUD.prev.at);
    h += `<p class="hint" style="margin-top:10px">클라우드 백업 · 덮어쓰기 전 세이브<br>${infoLine(i)}</p><div class="menu-list"><button class="btn ${UIS.prevAsk ? 'warn' : 'ghost'}" data-a="clPrev" type="button">${UIS.prevAsk ? '정말 되돌릴까요? (지금 세이브는 백업돼요)' : '클라우드 백업으로 되돌리기'}</button></div>`; }
  return h;
}
export async function cloudAuth(kind, pre = 'cl') {
  try { if (kind === 'google') await CLOUD.api.google(); else { const em = ($('#' + pre + 'Em') || {}).value || '', pw = ($('#' + pre + 'Pw') || {}).value || ''; if (!em || !pw) { toast('이메일과 비밀번호를 넣어 주세요'); return; } await (kind === 'up' ? CLOUD.api.emailUp(em.trim(), pw) : CLOUD.api.emailIn(em.trim(), pw)); }
    UIS.clEmail = false; UIS.clTitleEmail = false; toast('로그인했어요', 'good'); }
  catch (e) { if (pre === 'ct') CLOUD.wantTake = false; toast(fbErr(e), 'warn', 'cloudauth'); }
}
// ---- save files: export / import ----
export let DL = null; try { if (window.claude?.use) window.claude.use('downloads').then(d => { DL = d; }).catch(() => { }); } catch (e) { }
export const pad2 = n => String(n).padStart(2, '0');
export function saveFileName() { const d = new Date(); return `등불나무_세이브_${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}.json`; }
export function exportSave() {
  if (!G) return; saveLocal(true);
  const txt = JSON.stringify({ app: 'lantern-tree', kind: 'save', ver: 1, at: new Date().toISOString(), save: serialize() }), name = saveFileName();
  if (DL) { DL.save({ filename: name, data: txt }).then(() => toast('세이브 파일을 저장했어요', 'good')).catch(e => { if (!e || e.code !== 'declined') toast('여기서는 파일을 저장할 수 없어요'); }); return; }
  let file = null; try { file = new File([txt], name, { type: 'application/json' }); } catch (e) { }
  if (file && document.body.classList.contains('touch') && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: '등불나무 세이브' }).then(() => toast('세이브 파일을 보냈어요', 'good')).catch(e => { if (e && e.name !== 'AbortError') plainDownload(txt, name); }); return; }
  plainDownload(txt, name);
}
export function plainDownload(txt, name) {
  try { const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('세이브 파일을 내려받았어요', 'good'); }
  catch (e) { toast('여기서는 파일을 저장할 수 없어요'); }
}
export let importFrom = 'menu', pendingImp = null;
export function pickSaveFile(from) { importFrom = from; const f = $('#fileIn'); f.value = ''; f.click(); }
export function readSaveFile(file) {
  if (!file) return;
  file.text().then(t => { let o; try { o = JSON.parse(t); } catch (e) { o = null; }
    const sv = o && o.app === 'lantern-tree' ? o.save : o;
    if (!sv || !Array.isArray(sv.wall) || !Array.isArray(sv.floor) || !sv.p || !Array.isArray(sv.inv)) { toast('등불나무 세이브 파일이 아니에요'); return; }
    pendingImp = { save: sv, name: file.name };
    if (importFrom === 'title') { if (!loadLocal() && !started) { applyImport(); return; } showTitleAsk(); }
    else if (panel && panel.kind === 'menu') renderPanel();
  }).catch(() => toast('파일을 읽지 못했어요'));
}
export function showTitleAsk() { const el = $('#impAsk'); el.hidden = !pendingImp; if (!pendingImp) return;
  el.innerHTML = `<p>「${escHTML(pendingImp.name)}」 파일을 불러올까요?<br><span style="color:var(--muted);font-size:14px">지금 세이브는 이 파일로 바뀌어요.</span></p><div class="menu-two"><button class="btn" type="button" data-imp="yes">불러오기</button><button class="btn ghost" type="button" data-imp="no">취소</button></div>`; }
export function escHTML(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
export function applyImport() {
  if (!pendingImp) return; const sv = pendingImp.save; pendingImp = null; $('#impAsk').hidden = true;
  const prev = G ? serialize() : null;
  if (prev) pushBackup('세이브 파일 불러오기 전', JSON.stringify(prev));
  try { deserialize(sv); } catch (e) { if (prev) deserialize(prev); toast('파일을 불러오지 못했어요'); if (panel) renderPanel(); return; }
  if (panel) closePanel(); beginPlay(); toast('세이브를 불러왔어요', 'good');
}
// ---- developer tools (village marks). Later, with multiplayer, canDev() should ask the server for a developer role. ----
export let DEV = false; try { if (/[?&]dev(=1)?(&|$)/.test(location.search)) localStorage.setItem('lantern-tree-dev', '1'); DEV = localStorage.getItem('lantern-tree-dev') === '1'; } catch (e) { }
export function canDev() { return DEV; }
export let devTaps = 0, devTapT = 0;
export function loadLocal() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

