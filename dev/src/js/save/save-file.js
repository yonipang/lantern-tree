// ---- save files: export / import ----
let DL = null; try { if (window.claude?.use) window.claude.use('downloads').then(d => { DL = d; }).catch(() => { }); } catch (e) { }
const pad2 = n => String(n).padStart(2, '0');
function saveFileName() { const d = new Date(); return `등불나무_세이브_${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}.json`; }
function exportSave() {
  if (!G) return; saveLocal(true);
  const txt = JSON.stringify({ app: 'lantern-tree', kind: 'save', ver: 1, at: new Date().toISOString(), save: serialize() }), name = saveFileName();
  if (DL) { DL.save({ filename: name, data: txt }).then(() => toast('세이브 파일을 저장했어요', 'good')).catch(e => { if (!e || e.code !== 'declined') toast('여기서는 파일을 저장할 수 없어요'); }); return; }
  let file = null; try { file = new File([txt], name, { type: 'application/json' }); } catch (e) { }
  if (file && document.body.classList.contains('touch') && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: '등불나무 세이브' }).then(() => toast('세이브 파일을 보냈어요', 'good')).catch(e => { if (e && e.name !== 'AbortError') plainDownload(txt, name); }); return; }
  plainDownload(txt, name);
}
function plainDownload(txt, name) {
  try { const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('세이브 파일을 내려받았어요', 'good'); }
  catch (e) { toast('여기서는 파일을 저장할 수 없어요'); }
}
let importFrom = 'menu', pendingImp = null;
function pickSaveFile(from) { importFrom = from; const f = $('#fileIn'); f.value = ''; f.click(); }
function readSaveFile(file) {
  if (!file) return;
  file.text().then(t => { let o; try { o = JSON.parse(t); } catch (e) { o = null; }
    const sv = o && o.app === 'lantern-tree' ? o.save : o;
    if (!sv || !Array.isArray(sv.wall) || !Array.isArray(sv.floor) || !sv.p || !Array.isArray(sv.inv)) { toast('등불나무 세이브 파일이 아니에요'); return; }
    pendingImp = { save: sv, name: file.name };
    if (importFrom === 'title') { if (!loadLocal() && !started) { applyImport(); return; } showTitleAsk(); }
    else if (panel && panel.kind === 'menu') renderPanel();
  }).catch(() => toast('파일을 읽지 못했어요'));
}
function showTitleAsk() { const el = $('#impAsk'); el.hidden = !pendingImp; if (!pendingImp) return;
  el.innerHTML = `<p>「${escHTML(pendingImp.name)}」 파일을 불러올까요?<br><span style="color:var(--muted);font-size:14px">지금 세이브는 이 파일로 바뀌어요.</span></p><div class="menu-two"><button class="btn" type="button" data-imp="yes">불러오기</button><button class="btn ghost" type="button" data-imp="no">취소</button></div>`; }
function escHTML(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function applyImport() {
  if (!pendingImp) return; const sv = pendingImp.save; pendingImp = null; $('#impAsk').hidden = true;
  const prev = G ? serialize() : null;
  if (prev) pushBackup('세이브 파일 불러오기 전', JSON.stringify(prev));
  try { deserialize(sv); } catch (e) { if (prev) deserialize(prev); toast('파일을 불러오지 못했어요'); if (panel) renderPanel(); return; }
  if (panel) closePanel(); beginPlay(); toast('세이브를 불러왔어요', 'good');
}
// ---- developer tools (village marks). Later, with multiplayer, canDev() should ask the server for a developer role. ----
let DEV = false; try { if (/[?&]dev(=1)?(&|$)/.test(location.search)) localStorage.setItem('lantern-tree-dev', '1'); DEV = localStorage.getItem('lantern-tree-dev') === '1'; } catch (e) { }
function canDev() { return DEV; }
let devTaps = 0, devTapT = 0;
function loadLocal() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

