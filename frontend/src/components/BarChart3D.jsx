import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mountScene, addStudioLights, makeOrbiter, reducedMotion } from '../lib/three-stage';

const LOW = new THREE.Color('#e9c9b6');
const HIGH = new THREE.Color('#b8542f');

/**
 * Draggable 3D histogram.
 *
 * Each bin from the backend becomes an extruded bar on a soft grid plinth; bar
 * colour and height both encode the count, and the whole rig auto-spins until
 * the user grabs it.
 */
export default function BarChart3D({ values = [], height = 320 }) {
  const hostRef = useRef(null);
  const key = values.join(',');

  useEffect(() => {
    const host = hostRef.current;
    if (!host || values.length === 0) return undefined;

    const calm = reducedMotion();
    const max = Math.max(...values, 1);

    return mountScene(
      host,
      ({ scene, renderer, envMap }) => {
        addStudioLights(scene, { intensity: 0.9 });

        const rig = new THREE.Group();
        rig.scale.setScalar(1.28);
        scene.add(rig);

        const n = values.length;
        const gap = 0.14;
        const barW = 0.52;
        const span = n * (barW + gap) - gap;

        /* ---- Plinth ---- */
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(span + 0.9, 0.09, 1.7),
          new THREE.MeshStandardMaterial({
            color: 0xf2efe6,
            roughness: 0.75,
            metalness: 0.02,
            envMap,
          })
        );
        plinth.position.y = -0.05;
        rig.add(plinth);

        const grid = new THREE.GridHelper(span + 0.9, n, 0xd8d4c4, 0xe7e4d8);
        grid.position.y = 0.002;
        grid.material.transparent = true;
        grid.material.opacity = 0.5;
        rig.add(grid);

        /* ---- Bars ---- */
        const bars = [];
        const geo = new THREE.BoxGeometry(barW, 1, barW);
        // Move the origin to the bottom face so scaling grows the bar upward.
        geo.translate(0, 0.5, 0);

        values.forEach((v, i) => {
          const ratio = v / max;
          const color = LOW.clone().lerp(HIGH, ratio);
          const mat = new THREE.MeshPhysicalMaterial({
            color,
            roughness: 0.22,
            metalness: 0.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.2,
            envMap,
            envMapIntensity: 1.15,
          });
          const bar = new THREE.Mesh(geo, mat);
          bar.position.x = -span / 2 + barW / 2 + i * (barW + gap);
          bar.scale.y = 0.001;
          rig.add(bar);
          bars.push({ mesh: bar, target: 0.25 + ratio * 2.5, delay: i * 0.08 });
        });

        const orbiter = makeOrbiter(rig, renderer.domElement, {
          autoSpin: calm ? 0 : 0.14,
          maxPitch: 0.7,
        });

        return {
          update(t, dt) {
            bars.forEach((b) => {
              const active = t > b.delay;
              const goal = active ? b.target : 0.001;
              b.mesh.scale.y += (goal - b.mesh.scale.y) * Math.min(dt * 4.5, 1);
            });
            orbiter.update(dt);
            rig.position.y = -1.15 + Math.sin(t * 0.5) * 0.03;
          },
          dispose() {
            orbiter.dispose();
          },
        };
      },
      { position: [0, 2.0, 5.5], fov: 40 }
    );
    // `key` captures the data; values is stable for a given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className="scene" style={{ height }} ref={hostRef}>
      <span className="scene-note">Drag to rotate</span>
    </div>
  );
}
