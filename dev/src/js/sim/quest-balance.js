// ================= v125 퀘스트 보상 다시 맞추기 (dev/design/퀘스트설계.md 3-7) =================
// 모든 이야기·곁가지 퀘스트가 생긴 뒤(sim/archive.js·deep.js·naru.js 다음) 새 물건 보상(data/quests.js Q_RW)을 끼워요.
// 레시피 쪽지(rn_…)와 귀환석은 퀘스트에 붙은 그대로 남겨요. 장마다 도전이 열리는 규칙은 sim/quests.js sideOpen.
import { GUIDE, QSIDE, Q_RW } from '../data/quests.js';
for (const q of [...GUIDE, ...QSIDE]) { const rw = Q_RW[q.id]; if (!rw) continue;
  q.rw = rw.map(r => r.slice()).concat((q.rw || []).filter(([id]) => id.startsWith('rn_') || id === 'homeStone')); }
