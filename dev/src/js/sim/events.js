// ================= 사건 (구조 변경 6단계): 규칙 → 화면·소리 =================
// 규칙 코드(sim·world·game·features·content …)는 소리·알림·반짝임·창을 바로 부르지 않고 「사건」만 남겨요:
//   emit('sfx', 'hit')   emit('toast', '레벨 업!', 'good')   emit('puff', x, y, '#fff', 8)   emit('shake', .3)
// 받는 쪽은 ui/feedback.js (onEvent로 등록). 지금은 남기는 순간 바로 전해져서 예전과 똑같이 동작해요.
// 멀티플레이(12단계~)에서는 방장이 같은 사건을 친구에게도 보내요 — 그래서 사건에는 숫자·글자 같은 단순한 값을 담아요.
// 새 사건 이름을 쓰면 ui/feedback.js에 받는 곳도 만들어요 (build.py가 빠진 것을 알려 줘요).
const handlers = new Map();
export function onEvent(type, fn) { if (!handlers.has(type)) handlers.set(type, []); handlers.get(type).push(fn); }
export function emit(type, ...args) {
  const hs = handlers.get(type);
  if (!hs) { console.error('사건을 받는 곳이 없어요: ' + type); return; }
  for (const h of hs) h(...args);
}
