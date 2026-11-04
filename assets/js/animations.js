import * as THREE from 'three';

export function createAgentCharacter(agent,scene) {
  const g = new THREE.Group();

  g.position.set(...agent.position);
  scene.add(g);

  const shirt = new THREE.MeshStandardMaterial({
    color:agent.color,
    roughness:.8
  });

  const skin = new THREE.MeshStandardMaterial({
    color:0xe5b995,
    roughness:.9
  });

  const pants = new THREE.MeshStandardMaterial({
    color:0x34445b,
    roughness:.9
  });

  const hair = new THREE.MeshStandardMaterial({
    color:0x332c2a,
    roughness:1
  });

  // Badan
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(.34,.58,4,8),
    shirt
  );

  torso.position.y = 1.18;
  torso.castShadow = true;
  g.add(torso);

  // Kepala
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(.27,16,16),
    skin
  );

  head.position.y = 1.88;
  head.castShadow = true;
  g.add(head);

  // Rambut
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(
      .275,16,12,0,Math.PI*2,0,Math.PI*.55
    ),
    hair
  );

  cap.position.y = 2;
  g.add(cap);

  // Tangan kiri
  const leftArm = new THREE.Group();
  leftArm.position.set(-.36,1.42,0);
  g.add(leftArm);

  const arm1 = new THREE.Mesh(
    new THREE.CapsuleGeometry(.095,.42,3,7),
    skin
  );

  arm1.position.y = -.27;
  arm1.rotation.z = -.2;
  leftArm.add(arm1);

  // Tangan kanan
  const rightArm = new THREE.Group();
  rightArm.position.set(.36,1.42,0);
  g.add(rightArm);

  const arm2 = new THREE.Mesh(
    new THREE.CapsuleGeometry(.095,.42,3,7),
    skin
  );

  arm2.position.y = -.27;
  arm2.rotation.z = .2;
  rightArm.add(arm2);

  // Kaki
  const legs = [];

  for(const s of [-1,1]) {
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(.12,.48,3,7),
      pants
    );

    leg.position.set(s*.17,.47,0);
    leg.castShadow = true;

    g.add(leg);
    legs.push(leg);
  }

  // Bayangan
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.55,24),
    new THREE.MeshBasicMaterial({
      color:0x778899,
      transparent:true,
      opacity:.16
    })
  );

  shadow.rotation.x = -Math.PI/2;
  shadow.position.y = .015;
  g.add(shadow);

  // Lingkaran seleksi
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.58,.035,8,36),
    new THREE.MeshBasicMaterial({
      color:0x4386ed
    })
  );

  ring.rotation.x = Math.PI/2;
  ring.position.y = .05;
  ring.visible = false;
  g.add(ring);

  // Label informasi
  const label = createLabel(agent);

  label.position.set(0,2.85,0);
  g.add(label);

  g.userData = {
    agent,
    ring,
    leftArm,
    rightArm,
    legs,
    label,
    mode:'idle',
    target:null,
    home:new THREE.Vector3(...agent.position),
    meeting:false,
    phase:Math.random()*6
  };

  return g;
}

function createLabel(agent) {
  const canvas = document.createElement('canvas');

  canvas.width = 640;
  canvas.height = 190;

  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map:texture,
      transparent:true,
      depthTest:false,
      depthWrite:false
    })
  );

  sprite.scale.set(2.65,.79,1);

  sprite.userData.ctx = ctx;
  sprite.userData.texture = texture;

  drawLabel(agent,sprite);

  return sprite;
}

export function drawLabel(agent,sprite) {
  const ctx = sprite.userData.ctx;
  const texture = sprite.userData.texture;

  if(!ctx) return;

  ctx.clearRect(0,0,640,190);

  // Background
  ctx.fillStyle = 'rgba(255,255,255,.97)';
  ctx.strokeStyle = 'rgba(62,82,105,.25)';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(10,10,620,170,25);
  ctx.fill();
  ctx.stroke();

  // Status indicator
  ctx.fillStyle =
    agent.status==='Working' ? '#20a66a' :
    agent.status==='Monitoring' ? '#3978e8' :
    '#a0aab5';

  ctx.beginPath();
  ctx.arc(45,55,12,0,Math.PI*2);
  ctx.fill();

  // Jabatan
  ctx.textAlign = 'left';
  ctx.fillStyle = '#17212b';
  ctx.font = 'bold 34px Arial';
  ctx.fillText(agent.role,72,67,530);

  // Aktivitas
  let activity =
    agent.status==='Idle'
      ? 'Menunggu tugas'
      : agent.status==='Monitoring'
        ? 'Memantau aktivitas perusahaan'
        : 'Sedang: '+agent.task;

  if(activity.length>48) {
    activity = activity.slice(0,45)+'...';
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '26px Arial';
  ctx.fillText(activity,30,135,570);

  texture.needsUpdate = true;
}

// Memindahkan agent ke koordinat tertentu
export function goTo(agentCharacter,x,z) {
  agentCharacter.userData.target =
    new THREE.Vector3(x,0,z);

  agentCharacter.userData.meeting = false;
}

// Mengatur pergerakan meeting
export function setMeeting(agentCharacter,on,index=0) {
  const data = agentCharacter.userData;

  data.meeting = on;

  if(on) {
    data.target = new THREE.Vector3(
      Math.cos(index/6*Math.PI*2)*1.65,
      0,
      6.1+Math.sin(index/6*Math.PI*2)*.85
    );
  } else {
    data.target = data.home.clone();
  }
}

// Animasi karakter
export function updateCharacter(agentCharacter,time,dt) {
  const data = agentCharacter.userData;
  const agent = data.agent;

  // Pergerakan menuju tujuan
  if(data.target) {
    const dx = data.target.x-agentCharacter.position.x;
    const dz = data.target.z-agentCharacter.position.z;

    const distance = Math.hypot(dx,dz);

    if(distance>.08) {
      const step = Math.min(distance,dt*1.8);

      agentCharacter.position.x += dx/distance*step;
      agentCharacter.position.z += dz/distance*step;

      agentCharacter.rotation.y = Math.atan2(dx,dz);
      data.mode = 'walk';

    } else {
      agentCharacter.position.x = data.target.x;
      agentCharacter.position.z = data.target.z;

      data.target = null;

      data.mode = data.meeting
        ? 'meeting'
        : agent.status==='Working'
          ? 'work'
          : 'idle';
    }

  } else {
    data.mode = data.meeting
      ? 'meeting'
      : agent.status==='Working'
        ? 'work'
        : 'idle';
  }

  const walking = data.mode==='walk';
  const working = data.mode==='work';

  // Tangan
  data.leftArm.rotation.x = walking
    ? Math.sin(time*8+data.phase)*.75
    : working
      ? Math.sin(time*7+data.phase)*.22-.25
      : Math.sin(time*1.5+data.phase)*.08;

  data.rightArm.rotation.x = walking
    ? Math.cos(time*8+data.phase)*.75
    : working
      ? Math.cos(time*7+data.phase)*.22-.25
      : Math.cos(time*1.5+data.phase)*.08;

  // Kaki bergerak saat berjalan
  data.legs[0].rotation.x = walking
    ? Math.sin(time*8+data.phase)*.65
    : 0;

  data.legs[1].rotation.x = walking
    ? Math.sin(time*8+data.phase+Math.PI)*.65
    : 0;

  // Animasi lingkaran seleksi
  data.ring.rotation.z = time*.35;

  // Gerakan tubuh
  agentCharacter.position.y = walking
    ? Math.abs(Math.sin(time*8+data.phase))*.045
    : Math.sin(time*1.7+data.phase)*.018;

  // Gerakan kecil saat meeting
  if(data.mode==='meeting') {
    data.leftArm.rotation.x =
      Math.sin(time*2+data.phase)*.25-.3;

    data.rightArm.rotation.x =
      Math.cos(time*2+data.phase)*.25-.3;
  }
}
