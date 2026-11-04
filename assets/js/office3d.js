import * as THREE from 'three';

export const scene = new THREE.Scene();

scene.background = new THREE.Color(0xe9eef3);
scene.fog = new THREE.Fog(0xe9eef3,24,48);

export const mats = {
  floor:new THREE.MeshStandardMaterial({
    color:0xf7f8fa,
    roughness:.85
  }),
  wall:new THREE.MeshStandardMaterial({
    color:0xffffff,
    roughness:.9
  }),
  wood:new THREE.MeshStandardMaterial({
    color:0xb88b62,
    roughness:.7
  }),
  dark:new THREE.MeshStandardMaterial({
    color:0x344252,
    roughness:.65
  }),
  glass:new THREE.MeshStandardMaterial({
    color:0xb8d7e8,
    transparent:true,
    opacity:.22,
    roughness:.2
  }),
  metal:new THREE.MeshStandardMaterial({
    color:0x9ba8b5,
    metalness:.65,
    roughness:.35
  }),
  green:new THREE.MeshStandardMaterial({
    color:0x5a9b72,
    roughness:.8
  }),
  screen:new THREE.MeshStandardMaterial({
    color:0x1d2c3d,
    emissive:0x24466b,
    emissiveIntensity:.5
  })
};

function box(w,h,d,mat,x,y,z,shadow=true) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    mat
  );

  m.position.set(x,y,z);
  m.castShadow = shadow;
  m.receiveShadow = true;

  scene.add(m);
  return m;
}

function cyl(rt,rb,h,mat,x,y,z) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rt,rb,h,16),
    mat
  );

  m.position.set(x,y,z);
  m.castShadow = true;

  scene.add(m);
}

function label(text,x,z) {
  const c = document.createElement('canvas');

  c.width = 512;
  c.height = 128;

  const ctx = c.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,512,128);

  ctx.fillStyle = '#263747';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text,256,80);

  const tex = new THREE.CanvasTexture(c);

  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1,.78),
    new THREE.MeshBasicMaterial({
      map:tex,
      transparent:true,
      side:THREE.DoubleSide
    })
  );

  m.rotation.x = -Math.PI/2;
  m.position.set(x,.035,z);

  scene.add(m);
}

function plant(x,z) {
  cyl(.34,.42,.55,mats.wood,x,.3,z);
  cyl(.06,.06,.8,mats.wood,x,.92,z);

  for(let i=0;i<5;i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(.28,12,10),
      mats.green
    );

    leaf.scale.set(.7,1.5,.7);

    leaf.position.set(
      x + Math.sin(i*1.25)*.27,
      1.25 + Math.cos(i)*.12,
      z + Math.cos(i*1.25)*.22
    );

    leaf.castShadow = true;
    scene.add(leaf);
  }
}

function desk(x,z) {
  box(2,.14,1,mats.wood,x,.95,z);

  for(const dx of [-.8,.8]) {
    for(const dz of [-.35,.35]) {
      box(.12,.9,.12,mats.metal,x+dx,.48,z+dz);
    }
  }

  box(.85,.55,.07,mats.dark,x,.34,z+.9);
  box(.75,.46,.05,mats.screen,x,1.35,z-.22);
  box(.12,.2,.12,mats.metal,x,1.02,z-.22);
  box(.45,.04,.3,mats.dark,x,1.08,z-.22);
  box(.42,.06,.3,mats.dark,x,1.04,z+.25);
}

export function buildOffice(agents) {

  // Lantai dan dinding
  box(20,.25,16,mats.floor,0,-.16,0);

  const grid = new THREE.GridHelper(
    20,20,0xdce2e8,0xe9edf1
  );

  grid.position.y = -.025;
  scene.add(grid);

  box(20,3.4,.22,mats.wall,0,1.55,-8);
  box(.22,3.4,16,mats.wall,-10,1.55,0);

  // Jendela
  for(let i=0;i<4;i++) {
    box(
      3.6,2.1,.07,mats.glass,
      -6+i*4,1.8,-7.86,false
    );

    box(
      .07,2.2,.08,mats.metal,
      -6+i*4,1.8,-7.8,false
    );
  }

  box(16,.08,.12,mats.metal,0,.75,-7.78,false);

  // Partisi kaca
  for(const x of [-5.8,-1.9,2,5.9]) {
    box(.07,2.25,4.7,mats.glass,x,1.05,-3.1,false);
    box(.09,.08,4.7,mats.metal,x,2.18,-3.1,false);
  }

  box(8,.08,.07,mats.metal,-3.8,.12,-5.5,false);
  box(8,.08,.07,mats.metal,3.9,.12,-5.5,false);

  // Meeting room
  box(4.8,.12,2.3,mats.wood,0,.15,6.1);

  for(let i=0;i<6;i++) {
    const x = -1.65+(i%3)*1.65;
    const z = 5.1+Math.floor(i/3)*2;

    cyl(.24,.24,.45,mats.dark,x,.42,z);
    box(.45,.8,.12,mats.dark,x,.82,z+.28);
  }

  label('MEETING ROOM',0,7.35);

  // Pantry
  box(3,.85,.65,mats.wood,7.7,.42,5.9);
  box(3,.08,.65,mats.metal,7.7,.88,5.9);
  box(.9,1.5,.75,mats.wall,8.6,.9,4.8);
  box(.7,.08,.7,mats.dark,8.6,1.68,4.8);

  cyl(.18,.18,.12,mats.dark,7.1,1,5.9);

  label('PANTRY',7.7,7.2);

  // Tanaman
  plant(-9,-6.5);
  plant(9,-6.5);
  plant(-9,6.7);
  plant(9,2.5);

  // Lampu plafon
  for(let x=-7.5;x<=7.5;x+=5) {
    for(let z=-5;z<=5;z+=5) {
      box(1.6,.07,.35,mats.wall,x,3,z,false);

      const light = new THREE.PointLight(
        0xfff1d8,10,7
      );

      light.position.set(x,2.8,z);
      scene.add(light);
    }
  }

  // Meja karyawan
  agents.forEach(a=>{
    if(a.id!=='ceo') {
      desk(a.position[0],a.position[2]+.75);
    }
  });

  // Meja CEO
  box(2.6,.16,1.3,mats.wood,-7.1,1,-5.5);
  box(1.1,.7,.06,mats.screen,-7.1,1.65,-5.85);
  box(.15,.95,.15,mats.metal,-8.1,.5,-5.5);
  box(.15,.95,.15,mats.metal,-6.1,.5,-5.5);

  // Nama ruangan
  label('CEO OFFICE',-7.1,-6.9);
  label('RESEARCH',-3.9,-6.1);
  label('PRODUCT STUDIO',0,-6.1);
  label('QA LAB',4,-6.1);
  label('CONTENT STUDIO',-4,5);
  label('OPERATIONS',2,5);
}
