import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mountScene, addStudioLights, reducedMotion } from '../lib/three-stage';

/**
 * Landing-page centrepiece.
 *
 * A glossy white torus knot (the "model") sits inside a slow ring of orbiting
 * data points, wrapped by two tilted halo rings and a drifting particle field.
 * Everything is white/cream with a single coral accent so it reads as one
 * object rather than a pile of shapes.
 */
export default function HeroScene() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const calm = reducedMotion();

    return mountScene(
      host,
      ({ scene, camera, envMap }) => {
        addStudioLights(scene);

        const world = new THREE.Group();
        scene.add(world);

        /* ---- Core: the glossy knot ---- */
        const coreMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.14,
          metalness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          envMap,
          envMapIntensity: 1.35,
        });
        const core = new THREE.Mesh(
          new THREE.TorusKnotGeometry(1.15, 0.36, 260, 40, 2, 3),
          coreMat
        );
        world.add(core);

        /* ---- Halo rings ---- */
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xd97757,
          roughness: 0.25,
          metalness: 0.35,
          envMap,
          envMapIntensity: 1.1,
        });
        const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.022, 16, 200), ringMat);
        ringA.rotation.set(Math.PI / 2.1, 0.25, 0);
        world.add(ringA);

        const ringB = new THREE.Mesh(
          new THREE.TorusGeometry(2.9, 0.014, 16, 220),
          new THREE.MeshStandardMaterial({
            color: 0xb8892b,
            roughness: 0.3,
            metalness: 0.4,
            transparent: true,
            opacity: 0.75,
            envMap,
          })
        );
        ringB.rotation.set(Math.PI / 2.6, -0.5, 0.4);
        world.add(ringB);

        /* ---- Orbiting "applicants" ---- */
        const orbiters = [];
        const shapes = [
          new THREE.IcosahedronGeometry(0.2, 0),
          new THREE.OctahedronGeometry(0.19, 0),
          new THREE.BoxGeometry(0.26, 0.26, 0.26),
          new THREE.SphereGeometry(0.17, 24, 24),
          new THREE.TetrahedronGeometry(0.23, 0),
          new THREE.DodecahedronGeometry(0.18, 0),
        ];
        const palette = [0xffffff, 0xd97757, 0xffffff, 0xb8892b, 0xffffff, 0xd97757];

        for (let i = 0; i < 6; i += 1) {
          const mesh = new THREE.Mesh(
            shapes[i],
            new THREE.MeshPhysicalMaterial({
              color: palette[i],
              roughness: 0.2,
              metalness: 0.15,
              clearcoat: 0.8,
              envMap,
              envMapIntensity: 1.2,
            })
          );
          const orbit = {
            mesh,
            radius: 2.1 + (i % 3) * 0.42,
            speed: 0.26 + i * 0.045,
            phase: (i / 6) * Math.PI * 2,
            tilt: -0.5 + i * 0.2,
            bob: 0.22 + (i % 2) * 0.16,
          };
          orbiters.push(orbit);
          world.add(mesh);
        }

        /* ---- Particle dust ---- */
        const COUNT = 320;
        const positions = new Float32Array(COUNT * 3);
        for (let i = 0; i < COUNT; i += 1) {
          const r = 3.2 + Math.random() * 3.4;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.cos(phi) * 0.55;
          positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        const dustGeo = new THREE.BufferGeometry();
        dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const dust = new THREE.Points(
          dustGeo,
          new THREE.PointsMaterial({
            color: 0xb8a48f,
            size: 0.036,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
          })
        );
        scene.add(dust);

        /* ---- Mouse parallax ---- */
        const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        const onPointerMove = (e) => {
          const rect = host.getBoundingClientRect();
          pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        window.addEventListener('pointermove', onPointerMove);

        return {
          update(t, dt) {
            const speed = calm ? 0.25 : 1;

            core.rotation.y += dt * 0.28 * speed;
            core.rotation.x += dt * 0.11 * speed;
            core.position.y = Math.sin(t * 0.55) * 0.09;

            ringA.rotation.z += dt * 0.16 * speed;
            ringB.rotation.z -= dt * 0.1 * speed;

            orbiters.forEach((o) => {
              const a = t * o.speed * speed + o.phase;
              o.mesh.position.set(
                Math.cos(a) * o.radius,
                Math.sin(a * 1.4) * o.bob + Math.sin(a) * o.tilt * 0.4,
                Math.sin(a) * o.radius
              );
              o.mesh.rotation.x += dt * 0.7 * speed;
              o.mesh.rotation.y += dt * 0.5 * speed;
            });

            dust.rotation.y += dt * 0.022 * speed;

            pointer.x += (pointer.tx - pointer.x) * 0.045;
            pointer.y += (pointer.ty - pointer.y) * 0.045;
            camera.position.x = pointer.x * 0.85;
            camera.position.y = 0.3 - pointer.y * 0.55;
            camera.lookAt(0, 0, 0);
          },
          dispose() {
            window.removeEventListener('pointermove', onPointerMove);
          },
        };
      },
      { position: [0, 0.3, 7.4], fov: 42 }
    );
  }, []);

  return (
    <div className="scene" ref={hostRef} aria-hidden="true">
      <span className="scene-note">Live WebGL · Three.js</span>
    </div>
  );
}
