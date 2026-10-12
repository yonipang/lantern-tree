#!/bin/bash
# 전체 회귀 테스트: 한 번에 하나씩 순서대로 실행해요 (같은 테스트 페이지를 쓰기 때문에 동시에 돌리면 안 돼요).
# 사용법: bash dev/qa/run_all.sh        → 모두 실행 (맨 먼저 비교 테스트 snapshot.py, 약 20초)
#         bash dev/qa/run_all.sh 23 24  → 일부만 실행
cd "$(dirname "$0")"
python3 ../build.py || exit 1
node syn.js ../index.html || exit 1
mkdir -p out
list=${@:-$(seq 2 59)}
fail=0
if [ -z "$1" ]; then
  timeout 600 python3 snapshot.py > out/log_snapshot.txt 2>&1
  echo "snapshot $(grep -E '^TOTAL' out/log_snapshot.txt | tail -1 || echo 오류)"
  grep -E '^FAIL|^  ' out/log_snapshot.txt | head -12
  grep -q '^TOTAL 2 / 2' out/log_snapshot.txt || fail=1
fi
for n in $list; do
  out=out/log_qa$n.txt; mkdir -p out
  timeout 900 python3 qa$n.py > $out 2>&1
  tot=$(grep -E '^TOTAL' $out | tail -1)
  echo "qa$n ${tot:-오류(로그 확인: dev/qa/$out)}"
  grep -E '^FAIL' $out | head -5
  if [ -z "$tot" ] || grep -q '^FAIL' $out; then fail=1; fi
done
exit $fail
