
import * as THREE from 'three';

const app = document.querySelector('#app');
const messageEl = document.querySelector('#message');
const countEl = document.querySelector('#count');
const speedEl = document.querySelector('#speed');
const swingBtn = document.querySelector('#swing');
const pitchBtn = document.querySelector('#pitch');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86b8df);
scene.fog = new THREE.Fog(0x86b8df, 45, 150);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0.6, 2.25, 5.8);
camera.lookAt(0, 1.45, -5);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe9f4ff, 0x3a4a2e, 2.3));
const sun = new THREE.DirectionalLight(0xffffff, 3.2);
sun.position.set(-12, 24, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
scene.add(sun);

// Field
const grass = new THREE.Mesh(
  new THREE.CircleGeometry(72, 96),
  new THREE.MeshStandardMaterial({ color:0x2f7f43, roughness:0.95 })
);
grass.rotation.x = -Math.PI/2; grass.receiveShadow = true; scene.add(grass);

const dirtMat = new THREE.MeshStandardMaterial({ color:0xa86f42, roughness:1 });
const infield = new THREE.Mesh(new THREE.CircleGeometry(17, 64), dirtMat);
infield.rotation.x = -Math.PI/2; infield.position.y = 0.012; scene.add(infield);

const innerGrass = new THREE.Mesh(
  new THREE.CircleGeometry(10.2, 64),
  new THREE.MeshStandardMaterial({ color:0x33884a, roughness:1 })
);
innerGrass.rotation.x=-Math.PI/2; innerGrass.position.y=.025; scene.add(innerGrass);

// Foul lines
function line(a,b){
  const pts=[new THREE.Vector3(...a), new THREE.Vector3(...b)];
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xffffff}));
  l.position.y=.05; scene.add(l);
}
line([0,0,0],[-52,0,-52]); line([0,0,0],[52,0,-52]);

// Bases
function base(x,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(.75,.08,.75),new THREE.MeshStandardMaterial({color:0xffffff}));
  m.position.set(x,.09,z); m.rotation.y=Math.PI/4; m.castShadow=true; scene.add(m);
}
base(-9.3,-9.3); base(0,-18.6); base(9.3,-9.3);

// Home plate
const plate=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.06,5),new THREE.MeshStandardMaterial({color:0xffffff}));
plate.position.set(0,.08,0); plate.rotation.y=Math.PI/5; scene.add(plate);

// mound
const mound=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.5,.22,48),dirtMat);
mound.position.set(0,.11,-18.44); mound.receiveShadow=true; scene.add(mound);

// Simple pitcher
const pitcher = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({color:0xe8ecef});
const darkMat = new THREE.MeshStandardMaterial({color:0x17223a});
const skinMat = new THREE.MeshStandardMaterial({color:0xc98c63});

const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.38,.72,6,12),bodyMat);
torso.position.y=1.35; pitcher.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(.27,20,16),skinMat); head.position.y=2.15; pitcher.add(head);
for (const x of [-.2,.2]) {
  const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.75,4,8),darkMat); leg.position.set(x,.55,0); pitcher.add(leg);
}
pitcher.position.set(0,.22,-18.44); scene.add(pitcher);

// Batter group
const batter = new THREE.Group(); scene.add(batter); batter.position.set(-1.15,0,0.55);
const bTorso = torso.clone(); bTorso.material=new THREE.MeshStandardMaterial({color:0x1f5f9f}); bTorso.position.y=1.35; batter.add(bTorso);
const bHead=head.clone(); bHead.position.y=2.15; batter.add(bHead);
for (const x of [-.2,.2]) { const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.75,4,8),darkMat); leg.position.set(x,.55,0); batter.add(leg); }

// Bat pivot
const batPivot = new THREE.Group(); batPivot.position.set(.15,1.55,0); batter.add(batPivot);
const bat = new THREE.Mesh(
  new THREE.CylinderGeometry(.055,.095,1.25,12),
  new THREE.MeshStandardMaterial({color:0xc49a62,roughness:.65})
);
bat.rotation.z = Math.PI/2;
bat.position.x=.55;
bat.castShadow=true;
batPivot.add(bat);
batPivot.rotation.set(-.15,.2,-.7);

// Ball
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(.115,20,16),
  new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55})
);
ball.castShadow=true; scene.add(ball);
ball.visible=false;

const ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.16,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.25}));
ballShadow.rotation.x=-Math.PI/2; ballShadow.visible=false; scene.add(ballShadow);

let state='idle';
let ballVel=new THREE.Vector3();
let pitchCount=0, hits=0;
let swingT=0, swingActive=false, contactMade=false;
let hitCamT=0;
let pitchSpeedMph=92;

function resetCamera(){
  camera.position.lerp(new THREE.Vector3(.6,2.25,5.8), .16);
  camera.lookAt(0,1.45,-5);
}

function newPitch(){
  if(state==='pitch' || state==='hit') return;
  state='pitch'; contactMade=false; swingActive=false; swingT=0; hitCamT=0;
  pitchCount++;
  pitchSpeedMph = Math.round(88 + Math.random()*10);
  speedEl.textContent=`${pitchSpeedMph} mph`;
  countEl.textContent=`PITCH ${pitchCount} · HIT ${hits}`;
  messageEl.textContent='투구!';
  ball.visible=true; ballShadow.visible=true;
  ball.position.set((Math.random()-.5)*.45, 1.55 + (Math.random()-.5)*.35, -17.8);
  const secs = THREE.MathUtils.lerp(.48,.39,(pitchSpeedMph-88)/10);
  const target = new THREE.Vector3((Math.random()-.5)*.5, 1.3+(Math.random()-.5)*.45, .15);
  ballVel.copy(target).sub(ball.position).divideScalar(secs);
}

function swing(){
  if(swingActive || state==='hit') return;
  swingActive=true; swingT=0;
  if(state==='idle') messageEl.textContent='공이 없습니다';
}

function launchBall(){
  contactMade=true; state='hit'; hits++;
  countEl.textContent=`PITCH ${pitchCount} · HIT ${hits}`;
  const timing = Math.abs(ball.position.z - .55);
  const quality = THREE.MathUtils.clamp(1 - timing/1.1, .25, 1);
  const side = THREE.MathUtils.clamp(ball.position.x*4 + (Math.random()-.5)*.55, -1.4, 1.4);
  ballVel.set(side*7.5, 8.8 + quality*8.2, -22 - quality*18);
  messageEl.textContent = quality>.82 ? 'PERFECT!' : quality>.55 ? 'GOOD!' : 'CONTACT';
}

function updateBall(dt){
  if(!ball.visible) return;
  if(state==='pitch'){
    ball.position.addScaledVector(ballVel,dt);
    if(swingActive && !contactMade && ball.position.z > -0.35 && ball.position.z < 1.25){
      const batReach = 1.05;
      const dx=Math.abs(ball.position.x - (-.15));
      const dy=Math.abs(ball.position.y - 1.38);
      if(dx < batReach && dy < .75 && swingT>.12 && swingT<.42) launchBall();
    }
    if(ball.position.z > 2.2){
      state='dead'; messageEl.textContent=contactMade?'':'STRIKE';
      setTimeout(()=>{ if(state==='dead'){ state='idle'; ball.visible=false; ballShadow.visible=false; messageEl.textContent='PITCH 버튼'; }},700);
    }
  } else if(state==='hit'){
    ballVel.y -= 9.81*dt;
    ball.position.addScaledVector(ballVel,dt);
    if(ball.position.y <= .12){
      ball.position.y=.12;
      if(Math.abs(ballVel.y)>2.1){ ballVel.y*=-.34; ballVel.x*=.78; ballVel.z*=.78; }
      else { ballVel.y=0; ballVel.multiplyScalar(Math.pow(.25,dt)); }
    }
    if(ball.position.length()>110 || (ballVel.length()<.7 && ball.position.y<=.13)){
      state='dead';
      setTimeout(()=>{ state='idle'; ball.visible=false; ballShadow.visible=false; messageEl.textContent='PITCH 버튼'; },900);
    }
  }
  ballShadow.position.set(ball.position.x,.035,ball.position.z);
  const h=Math.max(.1,ball.position.y);
  ballShadow.scale.setScalar(THREE.MathUtils.clamp(1.3-h*.08,.5,1.3));
  ballShadow.material.opacity=THREE.MathUtils.clamp(.32-h*.018,.08,.3);
}

function updateSwing(dt){
  if(!swingActive){
    batPivot.rotation.z = THREE.MathUtils.lerp(batPivot.rotation.z,-.7,.16);
    batPivot.rotation.y = THREE.MathUtils.lerp(batPivot.rotation.y,.2,.16);
    return;
  }
  swingT += dt;
  const t = Math.min(swingT/.48,1);
  const e = 1-Math.pow(1-t,3);
  batPivot.rotation.z = THREE.MathUtils.lerp(-.7,2.35,e);
  batPivot.rotation.y = THREE.MathUtils.lerp(.2,-.55,e);
  if(t>=1){
    swingActive=false;
    setTimeout(()=>{ if(!swingActive) swingT=0; },80);
  }
}

function updateCamera(dt){
  if(state==='hit' && ball.visible){
    hitCamT += dt;
    const behind = ballVel.clone().normalize().multiplyScalar(-6.5);
    const targetPos = ball.position.clone().add(behind).add(new THREE.Vector3(0,3.2,0));
    camera.position.lerp(targetPos, 1-Math.pow(.002,dt));
    camera.lookAt(ball.position.x, Math.max(ball.position.y,.8), ball.position.z);
  } else resetCamera();
}

pitchBtn.addEventListener('click',newPitch);
swingBtn.addEventListener('pointerdown',swing);
window.addEventListener('keydown',(e)=>{
  if(e.code==='Space'){ e.preventDefault(); swing(); }
  if(e.key.toLowerCase()==='r') newPitch();
});

window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.033);
  updateSwing(dt); updateBall(dt); updateCamera(dt);
  renderer.render(scene,camera);
}
animate();
