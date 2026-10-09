import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const navItems = [['home','Home'],['about','About'],['expertise','Skills'],['education','Education'],['certifications','Certifications'],['training','Training'],['projects','Projects'],['contact','Contact']];
const desktopNav = document.querySelector('.desktop-nav');
const mobileNav = document.querySelector('#mobileNav');
navItems.forEach(([id,label], i) => {
  const a = document.createElement('a'); a.href = `#${id}`; a.textContent = label; desktopNav.appendChild(a);
  const m = document.createElement('a'); m.href = `#${id}`; m.innerHTML = `<small>${String(i+1).padStart(2,'0')}</small><span>${label}</span>`; mobileNav.appendChild(m);
});

const mobileMenu = document.querySelector('#mobileMenu');
const menuBtn = document.querySelector('#menuBtn');
const closeMenu = document.querySelector('#closeMenu');
menuBtn.onclick = () => { mobileMenu.hidden = false; menuBtn.setAttribute('aria-expanded','true'); };
closeMenu.onclick = () => { mobileMenu.hidden = true; menuBtn.setAttribute('aria-expanded','false'); };
mobileNav.querySelectorAll('a').forEach(a => a.onclick = () => { mobileMenu.hidden = true; menuBtn.setAttribute('aria-expanded','false'); });

const sections = [...document.querySelectorAll('[data-section]')];
const links = [...desktopNav.querySelectorAll('a')];
const io = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
}), { rootMargin:'-35% 0px -55% 0px' });
sections.forEach(s => io.observe(s));

const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const mount = document.querySelector('#canvasMount');
const progress = document.querySelector('#progressBar');
const progressText = document.querySelector('#progressText');
const loading = document.querySelector('#modelLoading');
const fallback = document.querySelector('#modelFallback');
const ui = document.querySelector('#rotationUI');
const angleText = document.querySelector('#angleText');
const arc = document.querySelector('#rotationArc');
const autoBtn = document.querySelector('#autoBtn');

let renderer, scene, camera, root, raf;
let angle = 0, target = 0, velocity = 0;
let dragging = false, lastX = 0, lastTime = 0, lastInteraction = performance.now();
let auto = !reduced;

function showAngle() {
  const deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
  angleText.textContent = `${Math.round(deg)}°`;
  arc.style.transform = `rotate(${deg}deg)`;
}
function scheduleAuto() {
  if (reduced) return;
  window.setTimeout(() => { if (!dragging) auto = true; }, 3500);
}
function rotateBy(delta) {
  target += delta; velocity = delta * 0.02; auto = false; lastInteraction = performance.now(); scheduleAuto();
}

document.querySelector('#leftBtn').onclick = () => rotateBy(-Math.PI / 5);
document.querySelector('#rightBtn').onclick = () => rotateBy(Math.PI / 5);
autoBtn.onclick = () => { auto = !auto; autoBtn.textContent = auto ? 'Ⅱ' : '▶'; autoBtn.setAttribute('aria-label', auto ? 'Pause auto rotation' : 'Start auto rotation'); };

function makeScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  camera.position.set(0, 0.18, 3.05);
  camera.lookAt(0, 0.08, 0);

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd7ffe7, 0x090d0a, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(1.7, 2.2, 2.8); key.castShadow = true; scene.add(key);
  const fill = new THREE.DirectionalLight(0x9dffc4, 1.5); fill.position.set(-2.2, 0.7, 1.8); scene.add(fill);
  const rim = new THREE.DirectionalLight(0x48ff93, 2.3); rim.position.set(2.2, 1.4, -2.5); scene.add(rim);
  const soft = new THREE.PointLight(0x7dffad, 1.25, 5); soft.position.set(-1.2, 0.5, 1.4); scene.add(soft);
}

try {
  makeScene();
  const loader = new GLTFLoader();
  loader.load('./assets/chetan-kumar.glb', gltf => {
    root = new THREE.Group();
    const model = gltf.scene;
    root.add(model);
    scene.add(root);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const targetHeight = 1.82;
    const scale = targetHeight / Math.max(size.y, 0.001);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    root.position.y = -0.03;

    model.traverse(obj => {
      if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
    });

    progress.style.width = '100%'; progressText.textContent = '100%';
    window.setTimeout(() => { loading.classList.add('is-hidden'); ui.hidden = false; }, 250);
    resize();
  }, xhr => {
    if (xhr.total) { const p = Math.min(100, Math.round(xhr.loaded / xhr.total * 100)); progress.style.width = `${p}%`; progressText.textContent = `${p}%`; }
  }, err => {
    console.error('GLB loading failed:', err);
    loading.classList.add('is-hidden'); fallback.hidden = false;
  });

  function resize() {
    const w = mount.clientWidth || 600, h = mount.clientHeight || 700;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(mount);
  resize();

  const tick = () => {
    const now = performance.now();
    if (!dragging && auto && !reduced && now - lastInteraction > 3500) target += 0.00165;
    angle += (target - angle) * 0.13;
    velocity *= 0.94;
    if (!dragging && Math.abs(velocity) > 0.00002) target += velocity;
    if (root) root.rotation.y = angle;
    showAngle();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const down = e => {
    dragging = true; auto = false; lastX = e.clientX; lastTime = performance.now(); velocity = 0;
    mount.classList.add('is-dragging'); mount.setPointerCapture?.(e.pointerId);
  };
  const move = e => {
    if (!dragging) return;
    const now = performance.now(); const dx = e.clientX - lastX; const dt = Math.max(8, now - lastTime); const d = dx * 0.009;
    target += d; velocity = d / dt * 16; lastX = e.clientX; lastTime = now; lastInteraction = now;
  };
  const up = e => { dragging = false; mount.classList.remove('is-dragging'); lastInteraction = performance.now(); mount.releasePointerCapture?.(e.pointerId); scheduleAuto(); };
  mount.addEventListener('pointerdown', down);
  mount.addEventListener('pointermove', move);
  mount.addEventListener('pointerup', up);
  mount.addEventListener('pointercancel', up);
  mount.addEventListener('wheel', e => { e.preventDefault(); rotateBy(e.deltaY * 0.0014); }, { passive:false });
  window.addEventListener('beforeunload', () => { cancelAnimationFrame(raf); renderer.dispose(); });
} catch (err) {
  console.error(err); loading.classList.add('is-hidden'); fallback.hidden = false;
}

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('in-view');
}), { threshold:0.12 });
document.querySelectorAll('.section, .glass-panel, .photo-card, .training-grid article').forEach(el => revealObserver.observe(el));
