# 원본(dev/index.html)을 홈 화면 앱용으로 바꿔서 저장소 맨 위(index.html, sw.js, manifest.webmanifest)에 써요.
# 사용법: python3 dev/build_web.py
import json, hashlib
import os
L=os.path.dirname(os.path.abspath(__file__))+'/'; W=os.path.abspath(L+'..')+'/'
s=open(L+'index.html').read()
i=s.index('<div id="game">')
ver=hashlib.md5(s.encode()).hexdigest()[:8]
head=('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">'
 '<meta name="theme-color" content="#120f1c"><meta name="description" content="등불나무 아래 — 아기자기한 픽셀 생존·건축·농사 게임">'
 '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
 '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="등불나무">'
 '<link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" type="image/png" href="icon-192.png"><link rel="manifest" href="manifest.webmanifest">'
 '<title>등불나무 아래</title>')
s2=s[:i].replace('<title>등불나무 아래</title>','',1)
reg=("<script>if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>")
open(W+'index.html','w').write(head+s2+reg+'</head><body>'+s[i:]+'</body></html>')
json.dump({"name":"등불나무 아래","short_name":"등불나무","start_url":"./","scope":"./","display":"fullscreen","orientation":"any",
 "background_color":"#120f1c","theme_color":"#120f1c","lang":"ko",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},
 open(W+'manifest.webmanifest','w'),ensure_ascii=False,indent=1)
open(W+'sw.js','w').write(f"""// 오프라인 실행용: 첫 접속 때 게임 파일을 저장해 두고, 인터넷 없이도 열려요.
const CACHE='lantern-{ver}';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))}});
self.addEventListener('fetch',e=>{{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url);
  // 글꼴은 한 번 받으면 저장해서 오프라인에서도 써요
  if(u.host.includes('fonts.g')){{e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{{c.put(r,res.clone());return res}}))));return}}
  if(u.origin!==location.origin)return;
  // 게임 파일: 인터넷이 되면 새 버전, 안 되면 저장본
  e.respondWith(fetch(r).then(res=>{{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
}});
""")
print('ok',ver)
