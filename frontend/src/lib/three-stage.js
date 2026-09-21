import * as THREE from 'three';

/**
 * Shared Three.js plumbing used by every 3D scene in the app.
 *
 * `mountScene` owns the boring-but-essential lifecycle work — renderer creation,
 * resize handling, the animation loop, pausing when scrolled out of view, and a
 * full dispose on unmount — so each scene file only has to describe its content.
 */

export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Builds a soft studio environment map from a canvas gradient.
 * Gives white/glossy materials something bright to reflect without shipping an
 * HDRI file, which keeps the whole scene dependency-free.
 */
export function makeStudioEnvironment(renderer) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Bright sky -> warm cream floor.
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, '#f7f5ee');
  grad.addColorStop(0.72, '#e6e2d4');
  grad.addColorStop(1, '#cfcabb');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // A couple of soft light blobs so reflections have shape and a coral kiss.
  const blob = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  blob(size * 0.26, size * 0.2, size * 0.3, 'rgba(255,255,255,0.95)');
  blob(size * 0.78, size * 0.3, size * 0.26, 'rgba(255, 221, 205, 0.85)');
  blob(size * 0.5, size * 0.82, size * 0.34, 'rgba(255,255,255,0.55)');

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(texture).texture;
  pmrem.dispose();
  texture.dispose();
  return envMap;
}

/** Standard three-point-ish lighting tuned for the cream/white palette. */
export function addStudioLights(scene, { intensity = 1 } = {}) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xe3dfd0, 1.15 * intensity);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.0 * intensity);
  key.position.set(5, 7, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xfff2ea, 0.75 * intensity);
  fill.position.set(-6, 2, 4);
  scene.add(fill);

  // Coral rim light — the single warm accent that ties 3D to the brand color.
  const rim = new THREE.PointLight(0xd97757, 18 * intensity, 26, 2);
  rim.position.set(-3.5, -1.5, -4);
  scene.add(rim);

  return { hemi, key, fill, rim };
}

/**
 * Mounts a scene into `container`.
 *
 * @param {HTMLElement} container host element (must have a measurable size)
 * @param {(ctx) => ({update?, resize?, dispose?})} build describes the scene
 * @param {object} options camera + renderer setup
 * @returns {() => void} teardown function — call it from useEffect cleanup
 */
export function mountScene(container, build, options = {}) {
  const {
    fov = 45,
    near = 0.1,
    far = 120,
    position = [0, 0, 8],
    alpha = true,
    environment = true,
    // Orthographic mode: no perspective stretch at the edges of a very wide
    // canvas, which matters for schematic diagrams. `orthoHeight` is the world
    // height the viewport covers.
    ortho = false,
    orthoHeight = 6,
  } = options;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = ortho
    ? new THREE.OrthographicCamera(-1, 1, 1, -1, near, far)
    : new THREE.PerspectiveCamera(fov, 1, near, far);
  camera.position.set(position[0], position[1], position[2]);
  camera.lookAt(0, 0, 0);

  let envMap = null;
  if (environment) {
    envMap = makeStudioEnvironment(renderer);
    scene.environment = envMap;
  }

  const api = build({ scene, camera, renderer, container, envMap }) || {};

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    if (ortho) {
      const halfH = orthoHeight / 2;
      const halfW = halfH * (w / h);
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
    } else {
      camera.aspect = w / h;
    }
    camera.updateProjectionMatrix();
    api.resize?.(w, h);
  };
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // Don't burn GPU on scenes the user has scrolled past.
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0 }
  );
  io.observe(container);

  // Hand-rolled clock: THREE.Clock is deprecated and THREE.Timer isn't in core.
  let last = performance.now();
  let elapsed = 0;
  let frame = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    if (!visible) return;
    api.update?.(elapsed, dt);
    renderer.render(scene, camera);
  };
  loop();

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    io.disconnect();
    api.dispose?.();
    scene.traverse((obj) => {
      obj.geometry?.dispose?.();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m?.dispose?.());
    });
    envMap?.dispose?.();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

/**
 * Adds pointer-drag orbiting plus gentle auto-spin to a group.
 * Returns an `update` you call from the scene's own update loop.
 */
export function makeOrbiter(group, domElement, { autoSpin = 0.12, maxPitch = 0.6 } = {}) {
  const state = { yaw: 0, pitch: 0.18, targetYaw: 0, targetPitch: 0.18, dragging: false, lastX: 0, lastY: 0 };

  const onDown = (e) => {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    domElement.setPointerCapture?.(e.pointerId);
    domElement.style.cursor = 'grabbing';
  };
  const onMove = (e) => {
    if (!state.dragging) return;
    state.targetYaw += (e.clientX - state.lastX) * 0.006;
    state.targetPitch = THREE.MathUtils.clamp(
      state.targetPitch + (e.clientY - state.lastY) * 0.004,
      -maxPitch,
      maxPitch
    );
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  };
  const onUp = (e) => {
    state.dragging = false;
    domElement.releasePointerCapture?.(e.pointerId);
    domElement.style.cursor = 'grab';
  };

  domElement.style.cursor = 'grab';
  domElement.style.touchAction = 'pan-y';
  domElement.addEventListener('pointerdown', onDown);
  domElement.addEventListener('pointermove', onMove);
  domElement.addEventListener('pointerup', onUp);
  domElement.addEventListener('pointercancel', onUp);

  return {
    update(dt) {
      if (!state.dragging) state.targetYaw += autoSpin * dt;
      state.yaw += (state.targetYaw - state.yaw) * 0.08;
      state.pitch += (state.targetPitch - state.pitch) * 0.08;
      group.rotation.y = state.yaw;
      group.rotation.x = state.pitch;
    },
    dispose() {
      domElement.removeEventListener('pointerdown', onDown);
      domElement.removeEventListener('pointermove', onMove);
      domElement.removeEventListener('pointerup', onUp);
      domElement.removeEventListener('pointercancel', onUp);
    },
  };
}
