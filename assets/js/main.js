import * as THREE from 'three';

import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import { agents } from './agents.js';

import {
  scene,
  buildOffice
} from './office3d.js';

import {
  createAgentCharacter,
  updateCharacter,
  goTo,
  setMeeting,
  drawLabel
} from './animations.js';

let selectedAgent = null;
let meetingActive = false;

const characters = [];

// Kamera
const camera = new THREE.PerspectiveCamera(
  38,
  innerWidth/innerHeight,
  .1,
  100
);

camera.position.set(15,17,20);

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias:true
});

renderer.setPixelRatio(
  Math.min(devicePixelRatio,2)
);

renderer.setSize(innerWidth,innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

document
  .getElementById('scene')
  .appendChild(renderer.domElement);

// Kontrol kamera
const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.target.set(0,0,0);
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.maxPolarAngle = Math.PI/2.05;
controls.minDistance = 9;
controls.maxDistance = 34;

// Pencahayaan
scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0xc5d0db,
    2.1
  )
);

const sun = new THREE.DirectionalLight(
  0xffffff,
  2.4
);

sun.position.set(-8,16,10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;

scene.add(sun);

const warm = new THREE.PointLight(
  0xffe2b4,
  45,
  22
);

warm.position.set(0,7,0);
scene.add(warm);

// Bangun kantor
buildOffice(agents);

// Buat karakter
agents.forEach(agent=>{
  characters.push(
    createAgentCharacter(agent,scene)
  );
});

// Raycaster untuk memilih karakter
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let downX = 0;
let downY = 0;

renderer.domElement.addEventListener(
  'pointerdown',
  e=>{
    downX = e.clientX;
    downY = e.clientY;
  }
);

renderer.domElement.addEventListener(
  'pointerup',
  e=>{
    if(
      Math.abs(e.clientX-downX)>5 ||
      Math.abs(e.clientY-downY)>5
    ) return;

    pointer.x = e.clientX/innerWidth*2-1;
    pointer.y = -(e.clientY/innerHeight)*2+1;

    raycaster.setFromCamera(pointer,camera);

    const hits = raycaster.intersectObjects(
      characters,
      true
    );

    if(!hits.length) return;

    let object = hits[0].object;

    while(object && !object.userData.agent) {
      object = object.parent;
    }

    if(object) {
      selectAgent(object.userData.agent);
    }
  }
);

// Warna status
function statusColor(status) {
  return status==='Working'
    ? '#20a66a'
    : status==='Monitoring'
      ? '#3978e8'
      : '#c2c9d1';
}

// Daftar agent
function renderList() {
  const list = document.getElementById('agentList');

  list.innerHTML = '';

  agents.forEach(agent=>{
    const row = document.createElement('div');
    row.className = 'agent-row';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = agent.icon;

    const info = document.createElement('div');

    const name = document.createElement('strong');
    name.textContent = agent.name;

    const status = document.createElement('small');
    status.textContent = agent.status;

    info.append(name,status);

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = statusColor(agent.status);

    row.append(avatar,info,dot);

    row.addEventListener('click',()=>{
      selectAgent(agent);
    });

    list.appendChild(row);
  });

  document.getElementById('totalAgents').textContent =
    agents.length;

  document.getElementById('workingAgents').textContent =
    agents.filter(a=>a.status==='Working').length;
}

// Update profil agent
function updateProfile(agent) {
  document.getElementById('profileIcon').textContent =
    agent.icon;

  document.getElementById('profileName').textContent =
    agent.name;

  document.getElementById('profileRole').textContent =
    agent.role+' · '+agent.room;

  document.getElementById('profileDesc').textContent =
    agent.desc;

  document.getElementById('currentTask').textContent =
    agent.task;

  const pill = document.getElementById('profileStatus');

  pill.textContent = agent.status.toUpperCase();

  pill.style.background =
    agent.status==='Working'
      ? '#e8f7ef'
      : agent.status==='Monitoring'
        ? '#eaf1ff'
        : '#eef0f2';

  pill.style.color =
    agent.status==='Working'
      ? '#168454'
      : agent.status==='Monitoring'
        ? '#2865c7'
        : '#667085';
}

// Pilih agent
function selectAgent(agent) {
  selectedAgent = agent;

  document.getElementById('profilePanel').style.display =
    'block';

  updateProfile(agent);

  document.getElementById('taskInput').value = '';

  characters.forEach(character=>{
    character.userData.ring.visible =
      character.userData.agent.id===agent.id;
  });
}

// Tutup panel
function closePanel() {
  document.getElementById('profilePanel').style.display =
    'none';

  selectedAgent = null;

  characters.forEach(character=>{
    character.userData.ring.visible = false;
  });
}

// Notifikasi
function toast(message) {
  const el = document.getElementById('toast');

  el.textContent = message;
  el.style.display = 'block';

  clearTimeout(toast.timer);

  toast.timer = setTimeout(()=>{
    el.style.display = 'none';
  },2500);
}

// Refresh data agent
function refreshAgent(agent) {
  const character = characters.find(
    c=>c.userData.agent.id===agent.id
  );

  if(character) {
    drawLabel(agent,character.userData.label);
  }

  renderList();

  if(selectedAgent?.id===agent.id) {
    updateProfile(agent);
  }
}

// Assign task
document
  .getElementById('assignBtn')
  .addEventListener('click',()=>{
    if(!selectedAgent) return;

    const task = document
      .getElementById('taskInput')
      .value
      .trim();

    if(!task) {
      toast('Tulis tugas terlebih dahulu.');
      return;
    }

    selectedAgent.task = task;
    selectedAgent.status = 'Working';

    const character = characters.find(
      c=>c.userData.agent.id===selectedAgent.id
    );

    // Agent berjalan menuju meja kerja
    if(character) {
      goTo(
        character,
        selectedAgent.desk[0],
        selectedAgent.desk[2]
      );
    }

    refreshAgent(selectedAgent);

    document.getElementById('taskInput').value = '';

    toast(
      'Tugas simulasi diberikan kepada '+
      selectedAgent.name
    );
  });

// Tombol tutup panel
document
  .getElementById('closeBtn')
  .addEventListener('click',closePanel);

// Tombol home view
document
  .getElementById('homeBtn')
  .addEventListener('click',()=>{
    camera.position.set(15,17,20);

    controls.target.set(0,0,0);
    controls.update();
  });

// Tombol meeting
document
  .getElementById('meetingBtn')
  .addEventListener('click',()=>{
    meetingActive = !meetingActive;

    characters.forEach((character,index)=>{
      setMeeting(
        character,
        meetingActive,
        index
      );
    });

    document.getElementById('meetingBtn').textContent =
      meetingActive
        ? '■ Akhiri Meeting'
        : '▶ Mulai Meeting';

    toast(
      meetingActive
        ? 'Semua agent menuju ruang meeting.'
        : 'Meeting selesai, agent kembali ke posisi awal.'
    );
  });

// Inisialisasi
renderList();

// Animasi utama
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(),.05);
  const time = clock.elapsedTime;

  characters.forEach(character=>{
    updateCharacter(character,time,dt);
  });

  controls.update();

  renderer.render(scene,camera);
}

animate();

// Responsive
window.addEventListener('resize',()=>{
  camera.aspect = innerWidth/innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth,
    innerHeight
  );
});

// Sembunyikan loading
document.getElementById('loading').style.display =
  'none';
