import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar"><a class="brand" href="#"><span class="brand-mark">S</span> start.ng <i>/</i> arcade</a><div class="user" id="user"><span class="avatar">?</span><span><b>Checking session</b><small>Start.ng account</small></span></div></header>
    <section class="layout">
      <aside class="intro"><p class="eyebrow"><span></span> ARCADE ORIGINAL · 01</p><h1>Neon<br><em>Drift</em></h1><p class="lede">A little focus. A lot of velocity.<br>How long can you stay in the flow?</p><div class="rule"></div><p class="micro-label">YOUR PILOT</p><div class="pilot"><span class="pilot-icon">✦</span><span><b id="pilotName">Awaiting Start.ng login</b><small>Central style sync</small></span><span class="sync-dot"></span></div><div class="controls"><div><kbd>←</kbd><kbd>→</kbd><span>Steer</span></div><div><kbd>A</kbd><kbd>D</kbd><span>Move</span></div><div><kbd>SPACE</kbd><span>Boost</span></div></div><p class="hint">Collect energy shards. Dodge the barriers.<br>Keep the streak alive.</p><div class="footer-note">MADE FOR THE START.NG COMMUNITY <span>✳</span></div></aside>
      <section class="game-card"><div class="game-head"><div><span class="live-dot"></span><span id="status">READY WHEN YOU ARE</span></div><button class="level board-toggle" id="boardToggle">LEADERBOARD <b>↗</b></button></div><div class="viewport" id="viewport"><div class="hud"><div><small>SCORE</small><strong id="score">00000</strong></div><div class="hud-best"><small>BEST</small><strong id="best">00000</strong></div></div><canvas id="game"></canvas><div class="overlay" id="overlay"><div class="orbit"><span>✦</span></div><p class="overlay-kicker">THE CITY IS YOURS</p><h2>Find your<br>frequency.</h2><p>Swipe or use arrow keys to steer.<br>Collect shards. Avoid the walls.</p><button id="play"><span>▶</span> START DRIFT <b>↗</b></button><a class="login-note" id="loginNote" hidden>Sign in with Start.ng</a></div><div class="leaderboard-panel" id="leaderboardPanel" hidden><button class="board-close" id="boardClose">×</button><small>START.NG ARCADE</small><h3>Top pilots</h3><ol id="boardList"><li>Loading scores…</li></ol></div><div class="toast" id="toast"></div><div class="mobile-controls"><button data-dir="left">‹</button><button data-dir="right">›</button><button data-dir="boost">BOOST</button></div></div><div class="game-foot"><div><span class="keydot"></span> <b>SHARDS</b> add to score</div><div><span class="keydot pink"></span> <b>GATES</b> end your run</div><div class="sound" id="boardStatus">START.NG ARCADE <span>✳</span></div></div></section>
    </section>
  </main>`;

const state = { player: null, guest: null, running: false, score: 0, shards: 0, best: Number(localStorage.getItem('neon-drift-best') || 0), lane: 0, boost: false };
const userEl = document.querySelector('#user');
document.querySelector('#best').textContent = String(state.best).padStart(5, '0');
const START_NG = 'https://start.ng';
let connectFramePromise;
function connectFrame() {
  connectFramePromise ??= new Promise((resolve, reject) => {
    const frame = document.createElement('iframe'); frame.src = `${START_NG}/connect`; frame.hidden = true;
    frame.onload = () => resolve(frame); frame.onerror = reject; document.body.append(frame);
  });
  return connectFramePromise;
}
async function askStartNg(message, replyType, timeoutMs = 5000) {
  const frame = await connectFrame();
  return new Promise(resolve => {
    const requestId = Math.random().toString(36).slice(2);
    const done = reply => { clearTimeout(timer); removeEventListener('message', onMessage); resolve(reply); };
    const timer = setTimeout(() => done(null), timeoutMs);
    function onMessage(e) {
      if (e.origin !== START_NG || e.source !== frame.contentWindow) return;
      if (e.data?.type === replyType && e.data.requestId === requestId) done(e.data);
    }
    addEventListener('message', onMessage);
    frame.contentWindow.postMessage({ ...message, requestId }, START_NG);
  });
}
function setPlayer(reply) {
  state.player = reply?.user || null;
  state.guest = reply?.guest || { name: 'Guest', style: {} };
  const player = state.player || state.guest;
  const name = player.name || (state.player ? 'Player' : 'Guest');
  userEl.innerHTML = `<span class="avatar">${escapeHtml(name[0].toUpperCase())}</span><span><b>${escapeHtml(name)}</b><small>${state.player ? `@${escapeHtml(state.player.account || 'player')}` : 'Start.ng guest'}</small></span>${state.player ? '<span class="verified">✓</span>' : ''}`;
  document.querySelector('#pilotName').textContent = name;
  const login = document.querySelector('#loginNote'); login.hidden = !!state.player;
  login.href = `${START_NG}/?return_to=${encodeURIComponent(location.origin + location.pathname)}`;
  applyCharacterStyle(player.style || {});
}
function applyCharacterStyle(style = {}) {
  characterMaterial.color.set(style.primaryColor || '#8b5cf6');
  secondaryMaterial.color.set(style.secondaryColor || '#332a4b');
  skinMaterial.color.set(style.skinColor || '#b97958');
  hairMaterial.color.set(style.hairColor || '#241a27');
  torso.scale.x = style.body === 'female' ? .86 : 1;
  applyHair(style.hair); applyHat(style.hat); applyAccessory(style.accessory);
}
function replaceStylePart(root, build) { root.clear(); if (build) root.add(build); }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
document.querySelector('#boardToggle').addEventListener('click', showLeaderboard);
async function identifyPlayer() {
  const reply = await askStartNg({ type: 'startng:whoami' }, 'startng:user').catch(() => null);
  if (reply) setPlayer(reply);
  else setPlayer({ guest: { name: 'Guest', style: {} } });
}
identifyPlayer();
document.addEventListener('visibilitychange', () => { if (!document.hidden) identifyPlayer(); });
window.addEventListener('focus', identifyPlayer);

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x090b12);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x090b12, 18, 85);
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 140); camera.position.set(0, 7.2, 12.5); camera.lookAt(0, 0, -9);
scene.add(new THREE.HemisphereLight(0x9bcaff, 0x17101f, 1.45));
const key = new THREE.DirectionalLight(0xffd4a1, 2.2); key.position.set(-6, 12, 4); key.castShadow = true; scene.add(key);
const glow = new THREE.PointLight(0xa855f7, 32, 22); glow.position.set(0, 2, -10); scene.add(glow);
const world = new THREE.Group(); scene.add(world);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x111521, roughness: .75, metalness: .2 });
const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 120), roadMat); road.rotation.x = -Math.PI/2; road.position.set(0, -.18, -44); road.receiveShadow = true; world.add(road);
const grid = new THREE.GridHelper(12, 24, 0x54237d, 0x202638); grid.position.set(0, -.16, -40); grid.scale.z = 5; world.add(grid);
const railMat = new THREE.MeshStandardMaterial({ color: 0x3d2461, emissive: 0xa855f7, emissiveIntensity: 1.4, metalness: .6 });
for (const x of [-6.05, 6.05]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(.1,.16,120), railMat); rail.position.set(x,-.05,-44); world.add(rail); }
const character = new THREE.Group(); scene.add(character);
const characterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: .28, metalness: .38, emissive: 0x2b0c54, emissiveIntensity: .6 });
const characterAccent = new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x16b8ca, emissiveIntensity: 1.2, roughness: .2, metalness: .45 });
const secondaryMaterial = new THREE.MeshStandardMaterial({ color: 0x332a4b, roughness: .5, metalness: .18 });
const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xb97958, roughness: .72 });
const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x241a27, roughness: .8 });
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.45,.62,6,12), characterMaterial); torso.position.y=.78; torso.castShadow=true; character.add(torso);
for(const x of [-.17,.17]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.35,4,8),secondaryMaterial);leg.position.set(x,.37,0);leg.castShadow=true;character.add(leg);}
const head = new THREE.Mesh(new THREE.SphereGeometry(.29,20,16), skinMaterial); head.position.y=1.62; head.castShadow=true; character.add(head);
const hairRoot = new THREE.Group(); hairRoot.position.set(0,1.62,0); character.add(hairRoot);
const hatRoot = new THREE.Group(); hatRoot.position.set(0,1.9,0); character.add(hatRoot);
const accessoryRoot = new THREE.Group(); accessoryRoot.position.set(0,1.62,.28); character.add(accessoryRoot);
const backpackRoot = new THREE.Group(); character.add(backpackRoot);
function applyHair(kind) {
  const ball = () => new THREE.Mesh(new THREE.SphereGeometry(.3,16,12), hairMaterial);
  if (kind === 'bald') { replaceStylePart(hairRoot); return; }
  const cap = ball(); cap.scale.set(1,.56,1); cap.position.y=.12;
  const bits = [cap];
  if (kind === 'afro') { const afro = new THREE.Mesh(new THREE.SphereGeometry(.39,16,12),hairMaterial); afro.position.y=.15; bits.push(afro); }
  if (kind === 'braids' || kind === 'dreads') for (const x of [-.2,-.1,0,.1,.2]) { const braid = new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.58,7),hairMaterial); braid.position.set(x,-.22,-.06); bits.push(braid); }
  if (kind === 'ponytail') { const pony = new THREE.Mesh(new THREE.CylinderGeometry(.07,.035,.56,8),hairMaterial); pony.position.set(0,-.25,-.29); pony.rotation.x=-.35; bits.push(pony); }
  if (kind === 'bun') { const bun = new THREE.Mesh(new THREE.SphereGeometry(.14,12,10),hairMaterial); bun.position.set(0,.24,-.19); bits.push(bun); }
  if (kind === 'short') { const fringe = new THREE.Mesh(new THREE.BoxGeometry(.34,.11,.13),hairMaterial); fringe.position.set(0,.08,.24); bits.push(fringe); }
  const group = new THREE.Group(); bits.forEach(bit=>group.add(bit)); replaceStylePart(hairRoot,group);
}
function applyHat(kind) {
  const group = new THREE.Group(); let mesh;
  if (kind === 'cap') { mesh=new THREE.Mesh(new THREE.CylinderGeometry(.28,.29,.15,16),characterAccent); const brim=new THREE.Mesh(new THREE.BoxGeometry(.4,.035,.2),characterAccent); brim.position.z=.25; group.add(brim); }
  else if (kind === 'beanie') mesh=new THREE.Mesh(new THREE.SphereGeometry(.31,16,12,0,Math.PI*2,0,Math.PI/2),characterAccent);
  else if (kind === 'tophat') { mesh=new THREE.Mesh(new THREE.CylinderGeometry(.15,.16,.38,16),characterAccent); const brim=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.06,16),characterAccent); brim.position.y=-.17; group.add(brim); }
  else if (kind === 'crown') { mesh=new THREE.Mesh(new THREE.ConeGeometry(.3,.33,5),new THREE.MeshStandardMaterial({color:0xffd36e,metalness:.8,roughness:.2,emissive:0x8c5c16,emissiveIntensity:.5})); }
  if (mesh) { mesh.position.y=.1; group.add(mesh); }
  replaceStylePart(hatRoot,group.children.length?group:null);
}
function applyAccessory(kind) {
  const group=new THREE.Group();
  backpackRoot.clear();
  if(kind==='glasses'){for(const x of [-.12,.12]){const lens=new THREE.Mesh(new THREE.TorusGeometry(.095,.018,6,14),characterAccent);lens.position.x=x;group.add(lens);}const bridge=new THREE.Mesh(new THREE.BoxGeometry(.08,.025,.025),characterAccent);group.add(bridge);}
  if(kind==='earrings')for(const x of [-.28,.28]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,6,12),characterAccent);ring.position.set(x,-.12,0);group.add(ring);}
  if(kind==='beard'){const beard=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10,0,Math.PI*2,0,Math.PI*.55),hairMaterial);beard.position.set(0,-.18,0);group.add(beard);}
  if(kind==='scarf'){const scarf=new THREE.Mesh(new THREE.TorusGeometry(.3,.08,8,18),characterAccent);scarf.rotation.x=Math.PI/2;scarf.position.y=-.32;group.add(scarf);}
  if(kind==='backpack'){const bag=new THREE.Mesh(new THREE.BoxGeometry(.4,.48,.2),characterAccent);bag.position.set(0,.78,-.38);bag.castShadow=true;backpackRoot.add(bag);}
  replaceStylePart(accessoryRoot,group.children.length?group:null);
}
const visor = new THREE.Mesh(new THREE.BoxGeometry(.43,.12,.22), characterAccent); visor.position.set(0,1.65,.24); character.add(visor);
const wingGeo = new THREE.BoxGeometry(.12,.52,.32);
for (const x of [-.53,.53]) { const limb = new THREE.Mesh(wingGeo, characterAccent); limb.position.set(x,.78,0); limb.rotation.z=x>0?-.25:.25; character.add(limb); }
const board = new THREE.Mesh(new THREE.BoxGeometry(1.05,.12,1.42), new THREE.MeshStandardMaterial({ color:0x191b2d, metalness:.85, roughness:.18, emissive:0x1a0d2f, emissiveIntensity:.7 })); board.position.y=.15; board.castShadow=true; character.add(board);
const trail = new THREE.Mesh(new THREE.ConeGeometry(.24,1.1,12), new THREE.MeshBasicMaterial({ color:0x9c6bff, transparent:true, opacity:.55 })); trail.rotation.x=Math.PI; trail.position.set(0,.17,-.93); character.add(trail);
const objects = [], shards = [], buildings = [];
const shardGeo = new THREE.OctahedronGeometry(.43,0);
function spawnShard(z) { const mesh = new THREE.Mesh(shardGeo, new THREE.MeshStandardMaterial({color:0xffd36e, emissive:0xffa927, emissiveIntensity:2.4, metalness:.25, roughness:.22})); mesh.position.set((Math.floor(Math.random()*3)-1)*3,.8,z); mesh.castShadow=true; world.add(mesh); shards.push(mesh); }
const gateMat = new THREE.MeshStandardMaterial({color:0xe25eab, emissive:0x8b174d, emissiveIntensity:1.1, roughness:.4});
function spawnGate(z) { const gate = new THREE.Group(); const lane = Math.floor(Math.random()*3)-1; gate.position.set(lane*3,0,z); for (const x of [-1.12,1.12]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.32,1.35,.52),gateMat); p.position.set(x,.68,0); p.castShadow=true; gate.add(p); } const bar = new THREE.Mesh(new THREE.BoxGeometry(2.55,.24,.55),gateMat); bar.position.y=1.34; gate.add(bar); gate.userData.lane=lane; world.add(gate); objects.push(gate); }
const buildingMat = new THREE.MeshStandardMaterial({color:0x171a29, emissive:0x160d29, emissiveIntensity:.4, roughness:.9});
for(let side of [-1,1]) for(let i=0;i<22;i++){const h=2+Math.random()*7, b=new THREE.Mesh(new THREE.BoxGeometry(2,h,2+Math.random()*3),buildingMat.clone());b.position.set(side*(8+Math.random()*8),h/2,-i*5-4);b.material.emissive.setHSL(.72+Math.random()*.1,.45,.07);world.add(b);buildings.push(b);}
let avatarTexture = null;
function setAvatarTexture(url) { new THREE.TextureLoader().load(url, t => { avatarTexture=t; characterMaterial.map=t; characterMaterial.color.set(0xffffff); characterMaterial.needsUpdate=true; }); }

let last = performance.now(), spawnTimer = 0, shardTimer = 0, elapsed=0;
function resize() { const rect=canvas.getBoundingClientRect(); renderer.setSize(rect.width,rect.height,false); camera.aspect=rect.width/rect.height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(document.querySelector('#viewport')); resize();
function tick(now) { requestAnimationFrame(tick); const dt=Math.min((now-last)/1000,.04); last=now; elapsed+=dt;
  for(const s of shards){s.rotation.y+=dt*1.8;s.rotation.x+=dt*.6;s.position.y=.8+Math.sin(elapsed*3+s.position.z)*.12;}
  if(state.running){ const speed=14+(state.boost?9:0)+Math.min(state.score/250,10); grid.position.z=(grid.position.z+speed*dt)%2; for(const o of [...objects,...shards]){o.position.z+=speed*dt;if(o.position.z>8){world.remove(o);const a=objects.indexOf(o);if(a>=0)objects.splice(a,1);const b=shards.indexOf(o);if(b>=0)shards.splice(b,1);}}
    spawnTimer+=dt;shardTimer+=dt;if(spawnTimer>1.25){spawnGate(-74);spawnTimer=0;}if(shardTimer>.88){spawnShard(-72);shardTimer=0;}
    const x=state.lane*3;character.position.x+=(x-character.position.x)*Math.min(1,dt*10);character.position.y=.06+Math.abs(Math.sin(elapsed*8))*.07;character.rotation.z+=(state.lane*.09-character.rotation.z)*Math.min(1,dt*6);trail.scale.y=state.boost?1.8:1;trail.material.opacity=state.boost?.85:.45;
    state.score+=dt*(state.boost?13:8);updateScore();
    for(const o of objects){if(Math.abs(o.position.z-1)<1.05&&Math.abs(o.position.x-character.position.x)<1.05){endGame();break;}}
    for(let i=shards.length-1;i>=0;i--){const s=shards[i];if(Math.abs(s.position.z-1)<1.15&&Math.abs(s.position.x-character.position.x)<1.2){world.remove(s);shards.splice(i,1);state.score+=30;state.shards++;toast('+30 SHARD');updateScore();}}
  } else {character.position.y=.06+Math.sin(elapsed*2)*.045;character.rotation.y=Math.sin(elapsed*.6)*.14;}
  renderer.render(scene,camera);
}
function updateScore(){document.querySelector('#score').textContent=String(Math.floor(state.score)).padStart(5,'0');}
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),650);}
function start(){
  state.running=true;state.score=0;state.shards=0;state.lane=0;spawnTimer=0;shardTimer=0;
  for(const o of [...objects,...shards])world.remove(o);objects.length=0;shards.length=0;
  document.querySelector('#overlay').classList.add('hidden');document.querySelector('#status').textContent='DRIFT IN PROGRESS';
}
async function endGame(){
  state.running=false;state.best=Math.max(state.best,Math.floor(state.score));localStorage.setItem('neon-drift-best',state.best);document.querySelector('#best').textContent=String(state.best).padStart(5,'0');document.querySelector('#status').textContent='RUN COMPLETE';
  document.querySelector('#overlay').classList.remove('hidden');document.querySelector('.overlay-kicker').textContent='RUN COMPLETE';document.querySelector('.overlay h2').innerHTML=`${String(Math.floor(state.score)).padStart(5,'0')}<br><em>points.</em>`;document.querySelector('.overlay>p:not(.overlay-kicker)').innerHTML='The city is still calling.<br>Can you beat your best?';document.querySelector('#play').innerHTML='<span>↻</span> RUN IT BACK <b>↗</b>';
  if(state.player){
    document.querySelector('#boardStatus').innerHTML='SAVING SCORE <span>…</span>';
    const saved=await askStartNg({type:'startng:score',stats:{distance:Math.min(1_000_000_000,Math.floor(state.score)),shards:Math.min(1_000_000_000,state.shards)}},'startng:scoreSaved').catch(() => null);
    document.querySelector('#boardStatus').innerHTML=saved?.ok?`RANK #${saved.result?.rank||'—'} <span>✓</span>`:'SCORE NOT SAVED';
  } else document.querySelector('#boardStatus').innerHTML='GUEST RUN <span>✳</span>';
}
async function showLeaderboard(){
  const panel=document.querySelector('#leaderboardPanel');panel.hidden=false;
  const list=document.querySelector('#boardList');const loading=document.createElement('li');loading.textContent='Loading scores…';list.replaceChildren(loading);
  const reply=await askStartNg({type:'startng:leaderboard',limit:10},'startng:leaderboardData').catch(() => null);list.replaceChildren();
  const entries=reply?.entries||[];
  if(!entries.length){const empty=document.createElement('li');empty.textContent='No scores yet — set the first record!';list.append(empty);return;}
  for(const entry of entries){const li=document.createElement('li');const name=document.createElement('span');name.textContent=`#${entry.rank}  ${entry.name}`;const score=document.createElement('b');score.textContent=String(entry.stats?.distance??entry.score??0).padStart(5,'0');li.append(name,score);list.append(li);}
}
document.querySelector('#boardClose').addEventListener('click',()=>{document.querySelector('#leaderboardPanel').hidden=true;});
document.querySelector('#play').addEventListener('click',start);
function steer(d){if(!state.running)return;state.lane=Math.max(-1,Math.min(1,state.lane+d));}
window.addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key)){e.preventDefault();steer(-1);}if(['ArrowRight','d','D'].includes(e.key)){e.preventDefault();steer(1);}if(e.code==='Space'){e.preventDefault();state.boost=true;}});
window.addEventListener('keyup',e=>{if(e.code==='Space')state.boost=false;});
document.querySelectorAll('[data-dir]').forEach(btn=>{btn.addEventListener('pointerdown',()=>{if(btn.dataset.dir==='left')steer(-1);if(btn.dataset.dir==='right')steer(1);if(btn.dataset.dir==='boost')state.boost=true;});btn.addEventListener('pointerup',()=>state.boost=false);btn.addEventListener('pointerleave',()=>state.boost=false);});
let touchX=null;canvas.addEventListener('touchstart',e=>touchX=e.touches[0].clientX,{passive:true});canvas.addEventListener('touchend',e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>24)steer(dx<0?-1:1);touchX=null;},{passive:true});
requestAnimationFrame(tick);
