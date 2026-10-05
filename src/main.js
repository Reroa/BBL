import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// ======================================================
// DOM
// ======================================================

const app = document.querySelector('#app');
const messageEl = document.querySelector('#message');
const countEl = document.querySelector('#count');
const speedEl = document.querySelector('#speed');
const swingBtn = document.querySelector('#swing');
const pitchBtn = document.querySelector('#pitch');

// ======================================================
// SCENE
// ======================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x86b8df);
scene.fog = new THREE.Fog(
  0x86b8df,
  45,
  150
);

// ======================================================
// CAMERA
// ======================================================

const camera = new THREE.PerspectiveCamera(
  52,
  innerWidth / innerHeight,
  0.1,
  300
);

camera.position.set(
  0.6,
  2.25,
  5.8
);

camera.lookAt(
  0,
  1.45,
  -5
);

// ======================================================
// RENDERER
// ======================================================

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(
  Math.min(
    devicePixelRatio,
    1.8
  )
);

renderer.setSize(
  innerWidth,
  innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

app.appendChild(
  renderer.domElement
);

// ======================================================
// LIGHT
// ======================================================

scene.add(
  new THREE.HemisphereLight(
    0xe9f4ff,
    0x3a4a2e,
    2.3
  )
);

const sun =
  new THREE.DirectionalLight(
    0xffffff,
    3.2
  );

sun.position.set(
  -12,
  24,
  8
);

sun.castShadow = true;

sun.shadow.mapSize.set(
  2048,
  2048
);

sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;

scene.add(sun);

// ======================================================
// FIELD
// ======================================================

const grass =
  new THREE.Mesh(
    new THREE.CircleGeometry(
      72,
      96
    ),
    new THREE.MeshStandardMaterial({
      color: 0x2f7f43,
      roughness: 0.95
    })
  );

grass.rotation.x =
  -Math.PI / 2;

grass.receiveShadow = true;

scene.add(grass);

// ------------------------------------------------------

const dirtMat =
  new THREE.MeshStandardMaterial({
    color: 0xa86f42,
    roughness: 1
  });

const infield =
  new THREE.Mesh(
    new THREE.CircleGeometry(
      17,
      64
    ),
    dirtMat
  );

infield.rotation.x =
  -Math.PI / 2;

infield.position.y =
  0.012;

scene.add(infield);

// ------------------------------------------------------

const innerGrass =
  new THREE.Mesh(
    new THREE.CircleGeometry(
      10.2,
      64
    ),
    new THREE.MeshStandardMaterial({
      color: 0x33884a,
      roughness: 1
    })
  );

innerGrass.rotation.x =
  -Math.PI / 2;

innerGrass.position.y =
  0.025;

scene.add(innerGrass);

// ======================================================
// FOUL LINES
// ======================================================

function makeLine(a, b) {

  const points = [
    new THREE.Vector3(...a),
    new THREE.Vector3(...b)
  ];

  const geo =
    new THREE.BufferGeometry()
      .setFromPoints(points);

  const line =
    new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color: 0xffffff
      })
    );

  line.position.y =
    0.05;

  scene.add(line);
}

makeLine(
  [0, 0, 0],
  [-52, 0, -52]
);

makeLine(
  [0, 0, 0],
  [52, 0, -52]
);

// ======================================================
// BASES
// ======================================================

function createBase(x, z) {

  const mesh =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.75,
        0.08,
        0.75
      ),
      new THREE.MeshStandardMaterial({
        color: 0xffffff
      })
    );

  mesh.position.set(
    x,
    0.09,
    z
  );

  mesh.rotation.y =
    Math.PI / 4;

  mesh.castShadow = true;

  scene.add(mesh);
}

createBase(
  -9.3,
  -9.3
);

createBase(
  0,
  -18.6
);

createBase(
  9.3,
  -9.3
);

// ======================================================
// HOME PLATE
// ======================================================

const plate =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.55,
      0.55,
      0.06,
      5
    ),
    new THREE.MeshStandardMaterial({
      color: 0xffffff
    })
  );

plate.position.set(
  0,
  0.08,
  0
);

plate.rotation.y =
  Math.PI / 5;

scene.add(plate);

// ======================================================
// PITCHER MOUND
// ======================================================

const mound =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      2.2,
      2.5,
      0.22,
      48
    ),
    dirtMat
  );

mound.position.set(
  0,
  0.11,
  -18.44
);

mound.receiveShadow = true;

scene.add(mound);

// ======================================================
// PLAYER ROOTS
// ======================================================

const batterRoot =
  new THREE.Group();

const pitcherRoot =
  new THREE.Group();

scene.add(
  batterRoot,
  pitcherRoot
);

batterRoot.position.set(
  -1.15,
  0,
  0.55
);

pitcherRoot.position.set(
  0,
  0.22,
  -18.44
);

// ======================================================
// PLAYER MODEL
// ======================================================

const loader =
  new GLTFLoader();

let batterModel = null;
let pitcherModel = null;

let batterMixer = null;
let pitcherMixer = null;

let playerLoaded = false;

// ======================================================
// AUTO SCALE MODEL
// ======================================================

function normalizePlayer(model) {

  const box =
    new THREE.Box3()
      .setFromObject(model);

  const size =
    new THREE.Vector3();

  box.getSize(size);

  if (size.y <= 0) return;

  // 목표 키 약 1.85m
  const scale =
    1.85 / size.y;

  model.scale.setScalar(scale);

  const newBox =
    new THREE.Box3()
      .setFromObject(model);

  const center =
    new THREE.Vector3();

  newBox.getCenter(center);

  // 발을 지면에 맞춤
  model.position.y -=
    newBox.min.y;

  model.position.x -=
    center.x;

  model.position.z -=
    center.z;
}

// ======================================================
// MODEL SHADOW
// ======================================================

function preparePlayer(model) {

  model.traverse((obj) => {

    if (
      obj.isMesh ||
      obj.isSkinnedMesh
    ) {

      obj.castShadow = true;
      obj.receiveShadow = true;

      if (obj.material) {

        obj.material.side =
          THREE.FrontSide;

      }
    }
  });
}

// ======================================================
// PLACEHOLDER
// ======================================================

function createPlaceholder(color) {

  const group =
    new THREE.Group();

  const bodyMat =
    new THREE.MeshStandardMaterial({
      color
    });

  const pantsMat =
    new THREE.MeshStandardMaterial({
      color: 0x17223a
    });

  const skinMat =
    new THREE.MeshStandardMaterial({
      color: 0xc98c63
    });

  const torso =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.38,
        0.72,
        6,
        12
      ),
      bodyMat
    );

  torso.position.y =
    1.35;

  group.add(torso);

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.27,
        20,
        16
      ),
      skinMat
    );

  head.position.y =
    2.15;

  group.add(head);

  for (
    const x of [-0.2, 0.2]
  ) {

    const leg =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.12,
          0.75,
          4,
          8
        ),
        pantsMat
      );

    leg.position.set(
      x,
      0.55,
      0
    );

    group.add(leg);
  }

  return group;
}

// ======================================================
// FALLBACK PLAYER
// ======================================================

function loadPlaceholderPlayers() {

  batterModel =
    createPlaceholder(
      0x1f5f9f
    );

  pitcherModel =
    createPlaceholder(
      0xe8ecef
    );

  batterRoot.add(
    batterModel
  );

  pitcherRoot.add(
    pitcherModel
  );

  pitcherModel.rotation.y =
    Math.PI;

  playerLoaded = false;
}

// ======================================================
// LOAD GLB
// ======================================================

loader.load(

  '/assets/models/player.glb',

  (gltf) => {

    console.log(
      'player.glb loaded'
    );

    const original =
      gltf.scene;

    preparePlayer(
      original
    );

    normalizePlayer(
      original
    );

    batterModel =
      original;

    pitcherModel =
      clone(original);

    batterRoot.add(
      batterModel
    );

    pitcherRoot.add(
      pitcherModel
    );

    /*
      모델 방향은 에셋마다 다름.
      여기 값만 조정하면 됨.
    */

    batterModel.rotation.y =
      Math.PI / 2;

    pitcherModel.rotation.y =
      Math.PI;

    // 모델 안에 애니메이션이 있을 경우
    if (
      gltf.animations &&
      gltf.animations.length > 0
    ) {

      batterMixer =
        new THREE.AnimationMixer(
          batterModel
        );

      pitcherMixer =
        new THREE.AnimationMixer(
          pitcherModel
        );

      const firstClip =
        gltf.animations[0];

      batterMixer
        .clipAction(firstClip)
        .play();

      pitcherMixer
        .clipAction(firstClip)
        .play();
    }

    playerLoaded = true;

    console.log(
      '실제 선수 모델 적용 완료'
    );

  },

  (xhr) => {

    if (
      xhr.total > 0
    ) {

      console.log(
        'Player',
        Math.round(
          xhr.loaded /
          xhr.total *
          100
        ) + '%'
      );
    }

  },

  (error) => {

    console.error(
      'player.glb 로딩 실패',
      error
    );

    console.warn(
      '임시 캐릭터 사용'
    );

    loadPlaceholderPlayers();
  }
);

// ======================================================
// BAT
// ======================================================

const batPivot =
  new THREE.Group();

batterRoot.add(
  batPivot
);

batPivot.position.set(
  0.3,
  1.45,
  0.15
);

const bat =
  new THREE.Mesh(

    new THREE.CylinderGeometry(
      0.045,
      0.085,
      1.15,
      12
    ),

    new THREE.MeshStandardMaterial({
      color: 0xc49a62,
      roughness: 0.65
    })

  );

bat.rotation.z =
  Math.PI / 2;

bat.position.x =
  0.55;

bat.castShadow =
  true;

batPivot.add(bat);

batPivot.rotation.set(
  -0.15,
  0.2,
  -0.7
);

// ======================================================
// BASEBALL
// ======================================================

const ball =
  new THREE.Mesh(

    new THREE.SphereGeometry(
      0.115,
      24,
      18
    ),

    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55
    })

  );

ball.castShadow =
  true;

ball.visible =
  false;

scene.add(ball);

// ======================================================
// BALL SHADOW
// ======================================================

const ballShadow =
  new THREE.Mesh(

    new THREE.CircleGeometry(
      0.16,
      20
    ),

    new THREE.MeshBasicMaterial({

      color: 0x000000,

      transparent: true,

      opacity: 0.25
    })

  );

ballShadow.rotation.x =
  -Math.PI / 2;

ballShadow.visible =
  false;

scene.add(
  ballShadow
);

// ======================================================
// GAME STATE
// ======================================================

let state =
  'idle';

let ballVel =
  new THREE.Vector3();

let pitchCount =
  0;

let hits =
  0;

let swingT =
  0;

let swingActive =
  false;

let contactMade =
  false;

let hitCamT =
  0;

let pitchSpeedMph =
  92;

// ======================================================
// CAMERA RESET
// ======================================================

function resetCamera() {

  camera.position.lerp(

    new THREE.Vector3(
      0.6,
      2.25,
      5.8
    ),

    0.16
  );

  camera.lookAt(
    0,
    1.45,
    -5
  );
}

// ======================================================
// NEW PITCH
// ======================================================

function newPitch() {

  if (
    state === 'pitch' ||
    state === 'hit'
  ) {

    return;
  }

  state =
    'pitch';

  contactMade =
    false;

  swingActive =
    false;

  swingT =
    0;

  hitCamT =
    0;

  pitchCount++;

  pitchSpeedMph =
    Math.round(
      88 +
      Math.random() *
      10
    );

  speedEl.textContent =
    `${pitchSpeedMph} mph`;

  countEl.textContent =
    `PITCH ${pitchCount} · HIT ${hits}`;

  messageEl.textContent =
    '투구!';

  ball.visible =
    true;

  ballShadow.visible =
    true;

  ball.position.set(

    (
      Math.random() -
      0.5
    ) * 0.45,

    1.55 +
    (
      Math.random() -
      0.5
    ) * 0.35,

    -17.8
  );

  const secs =
    THREE.MathUtils.lerp(

      0.48,
      0.39,

      (
        pitchSpeedMph -
        88
      ) / 10

    );

  const target =
    new THREE.Vector3(

      (
        Math.random() -
        0.5
      ) * 0.5,

      1.3 +
      (
        Math.random() -
        0.5
      ) * 0.45,

      0.15
    );

  ballVel
    .copy(target)
    .sub(ball.position)
    .divideScalar(secs);
}

// ======================================================
// SWING
// ======================================================

function swing() {

  if (
    swingActive ||
    state === 'hit'
  ) {

    return;
  }

  swingActive =
    true;

  swingT =
    0;

  if (
    state === 'idle'
  ) {

    messageEl.textContent =
      '공이 없습니다';
  }
}

// ======================================================
// CONTACT
// ======================================================

function launchBall() {

  contactMade =
    true;

  state =
    'hit';

  hits++;

  countEl.textContent =
    `PITCH ${pitchCount} · HIT ${hits}`;

  const timing =
    Math.abs(
      ball.position.z -
      0.55
    );

  const quality =
    THREE.MathUtils.clamp(

      1 -
      timing /
      1.1,

      0.25,
      1
    );

  const side =
    THREE.MathUtils.clamp(

      ball.position.x *
      4 +

      (
        Math.random() -
        0.5
      ) * 0.55,

      -1.4,
      1.4
    );

  ballVel.set(

    side * 7.5,

    8.8 +
    quality * 8.2,

    -22 -
    quality * 18

  );

  if (
    quality > 0.82
  ) {

    messageEl.textContent =
      'PERFECT!';

  } else if (
    quality > 0.55
  ) {

    messageEl.textContent =
      'GOOD!';

  } else {

    messageEl.textContent =
      'CONTACT';

  }
}

// ======================================================
// BALL UPDATE
// ======================================================

function updateBall(dt) {

  if (
    !ball.visible
  ) {

    return;
  }

  // --------------------------------------------------
  // PITCH
  // --------------------------------------------------

  if (
    state === 'pitch'
  ) {

    ball.position.addScaledVector(
      ballVel,
      dt
    );

    if (
      swingActive &&
      !contactMade &&
      ball.position.z > -0.35 &&
      ball.position.z < 1.25
    ) {

      const batReach =
        1.05;

      const dx =
        Math.abs(
          ball.position.x +
          0.15
        );

      const dy =
        Math.abs(
          ball.position.y -
          1.38
        );

      if (
        dx < batReach &&
        dy < 0.75 &&
        swingT > 0.12 &&
        swingT < 0.42
      ) {

        launchBall();
      }
    }

    if (
      ball.position.z >
      2.2
    ) {

      state =
        'dead';

      if (
        !contactMade
      ) {

        messageEl.textContent =
          'STRIKE';
      }

      setTimeout(() => {

        if (
          state === 'dead'
        ) {

          state =
            'idle';

          ball.visible =
            false;

          ballShadow.visible =
            false;

          messageEl.textContent =
            'PITCH 버튼';
        }

      }, 700);
    }

  }

  // --------------------------------------------------
  // HIT
  // --------------------------------------------------

  else if (
    state === 'hit'
  ) {

    ballVel.y -=
      9.81 * dt;

    ball.position.addScaledVector(
      ballVel,
      dt
    );

    // 지면 충돌
    if (
      ball.position.y <=
      0.12
    ) {

      ball.position.y =
        0.12;

      if (
        Math.abs(
          ballVel.y
        ) > 2.1
      ) {

        ballVel.y *=
          -0.34;

        ballVel.x *=
          0.78;

        ballVel.z *=
          0.78;

      } else {

        ballVel.y =
          0;

        ballVel.multiplyScalar(
          Math.pow(
            0.25,
            dt
          )
        );
      }
    }

    if (
      ball.position.length() >
      110 ||

      (
        ballVel.length() <
        0.7 &&

        ball.position.y <=
        0.13
      )
    ) {

      state =
        'dead';

      setTimeout(() => {

        state =
          'idle';

        ball.visible =
          false;

        ballShadow.visible =
          false;

        messageEl.textContent =
          'PITCH 버튼';

      }, 900);
    }
  }

  // --------------------------------------------------
  // SHADOW
  // --------------------------------------------------

  ballShadow.position.set(

    ball.position.x,

    0.035,

    ball.position.z

  );

  const h =
    Math.max(
      0.1,
      ball.position.y
    );

  ballShadow.scale.setScalar(

    THREE.MathUtils.clamp(

      1.3 -
      h * 0.08,

      0.5,
      1.3

    )
  );

  ballShadow.material.opacity =
    THREE.MathUtils.clamp(

      0.32 -
      h * 0.018,

      0.08,
      0.3

    );
}

// ======================================================
// SWING UPDATE
// ======================================================

function updateSwing(dt) {

  if (
    !swingActive
  ) {

    batPivot.rotation.z =
      THREE.MathUtils.lerp(

        batPivot.rotation.z,

        -0.7,

        0.16
      );

    batPivot.rotation.y =
      THREE.MathUtils.lerp(

        batPivot.rotation.y,

        0.2,

        0.16
      );

    return;
  }

  swingT +=
    dt;

  const t =
    Math.min(
      swingT /
      0.48,
      1
    );

  const e =
    1 -
    Math.pow(
      1 - t,
      3
    );

  batPivot.rotation.z =
    THREE.MathUtils.lerp(

      -0.7,
      2.35,
      e

    );

  batPivot.rotation.y =
    THREE.MathUtils.lerp(

      0.2,
      -0.55,
      e

    );

  if (
    t >= 1
  ) {

    swingActive =
      false;

    setTimeout(() => {

      if (
        !swingActive
      ) {

        swingT =
          0;
      }

    }, 80);
  }
}

// ======================================================
// CAMERA UPDATE
// ======================================================

function updateCamera(dt) {

  if (
    state === 'hit' &&
    ball.visible
  ) {

    hitCamT +=
      dt;

    const behind =
      ballVel
        .clone()
        .normalize()
        .multiplyScalar(
          -6.5
        );

    const targetPos =
      ball.position
        .clone()
        .add(behind)
        .add(
          new THREE.Vector3(
            0,
            3.2,
            0
          )
        );

    camera.position.lerp(

      targetPos,

      1 -
      Math.pow(
        0.002,
        dt
      )

    );

    camera.lookAt(

      ball.position.x,

      Math.max(
        ball.position.y,
        0.8
      ),

      ball.position.z

    );

  } else {

    resetCamera();
  }
}

// ======================================================
// CONTROLS
// ======================================================

pitchBtn.addEventListener(
  'click',
  newPitch
);

swingBtn.addEventListener(
  'pointerdown',
  swing
);

window.addEventListener(
  'keydown',
  (e) => {

    if (
      e.code === 'Space'
    ) {

      e.preventDefault();

      swing();
    }

    if (
      e.key.toLowerCase() ===
      'r'
    ) {

      newPitch();
    }
  }
);

// ======================================================
// RESIZE
// ======================================================

window.addEventListener(
  'resize',
  () => {

    camera.aspect =
      innerWidth /
      innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      innerWidth,
      innerHeight
    );
  }
);

// ======================================================
// LOOP
// ======================================================

const clock =
  new THREE.Clock();

function animate() {

  requestAnimationFrame(
    animate
  );

  const dt =
    Math.min(
      clock.getDelta(),
      0.033
    );

  // GLB 자체 애니메이션
  if (
    batterMixer
  ) {

    batterMixer.update(dt);
  }

  if (
    pitcherMixer
  ) {

    pitcherMixer.update(dt);
  }

  updateSwing(dt);

  updateBall(dt);

  updateCamera(dt);

  renderer.render(
    scene,
    camera
  );
}

animate();
