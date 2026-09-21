import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mountScene, addStudioLights, reducedMotion } from '../lib/three-stage';

const SAFE = new THREE.Color('#1f8a5b');
const RISK = new THREE.Color('#c8462f');

/**
 * 3D read-out of a single prediction.
 *
 * `probability` (0..1) drives three things at once so the result is readable at
 * a glance: the orb's colour (green -> red), how hard it pulses, and how much of
 * the surrounding gauge arc is lit.
 */
export default function RiskOrb({ probability = 0, idle = false }) {
  const hostRef = useRef(null);
  const probRef = useRef(probability);
  probRef.current = probability;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const calm = reducedMotion();

    return mountScene(
      host,
      ({ scene, envMap }) => {
        addStudioLights(scene, { intensity: 0.95 });

        const world = new THREE.Group();
        scene.add(world);

        /* ---- Inner orb: colour carries the verdict ---- */
        const coreMat = new THREE.MeshPhysicalMaterial({
          color: 0xcfcfcf,
          roughness: 0.2,
          metalness: 0.1,
          clearcoat: 1,
          clearcoatRoughness: 0.15,
          envMap,
          envMapIntensity: 1.2,
        });
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 4), coreMat);
        world.add(core);

        /* ---- Outer wireframe shell ---- */
        const shellMat = new THREE.MeshBasicMaterial({
          color: 0x16150f,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
        });
        const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.42, 1), shellMat);
        world.add(shell);

        /* ---- Gauge arc: 40 ticks, lit in proportion to probability ---- */
        const TICKS = 40;
        const ticks = [];
        const tickGeo = new THREE.BoxGeometry(0.045, 0.18, 0.045);
        for (let i = 0; i < TICKS; i += 1) {
          const mat = new THREE.MeshStandardMaterial({
            color: 0xd6d2c2,
            roughness: 0.4,
            metalness: 0.1,
            envMap,
          });
          const tick = new THREE.Mesh(tickGeo, mat);
          // Leave a gap at the bottom so it reads as a gauge, not a full ring.
          const spread = Math.PI * 1.6;
          const angle = -Math.PI / 2 - spread / 2 + (i / (TICKS - 1)) * spread;
          const r = 1.78;
          tick.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
          tick.rotation.z = angle - Math.PI / 2;
          ticks.push({ mesh: tick, mat, at: i / (TICKS - 1) });
          world.add(tick);
        }

        /* ---- Base ring ---- */
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.62, 0.012, 12, 140),
          new THREE.MeshStandardMaterial({ color: 0xd8d4c4, roughness: 0.4, envMap })
        );
        world.add(ring);

        const litColor = new THREE.Color();
        let shown = 0; // eased probability so changes animate instead of snapping

        return {
          update(t, dt) {
            const target = idle ? 0.5 + Math.sin(t * 0.4) * 0.34 : probRef.current;
            shown += (target - shown) * Math.min(dt * 3.2, 1);

            litColor.copy(SAFE).lerp(RISK, shown);

            // Idle preview stays neutral stone; a real result takes the verdict colour.
            if (idle) {
              coreMat.color.setHex(0xc4bfae);
              coreMat.emissive.setHex(0x000000);
            } else {
              coreMat.color.copy(litColor);
              coreMat.emissive.copy(litColor).multiplyScalar(0.12);
            }

            ticks.forEach((tk) => {
              const on = tk.at <= shown;
              tk.mat.color.copy(on ? litColor : new THREE.Color(0xd6d2c2));
              tk.mat.emissive.copy(on ? litColor : new THREE.Color(0x000000)).multiplyScalar(on ? 0.35 : 0);
              const scale = on ? 1.5 : 1;
              tk.mesh.scale.y += (scale - tk.mesh.scale.y) * Math.min(dt * 6, 1);
            });

            const speed = calm ? 0.2 : 1;
            // Higher risk => faster, harder breathing.
            const pulse = 1 + Math.sin(t * (1.6 + shown * 3.4)) * (0.02 + shown * 0.05);
            core.scale.setScalar(pulse);
            core.rotation.y += dt * 0.22 * speed;

            shell.rotation.y -= dt * 0.3 * speed;
            shell.rotation.x += dt * 0.12 * speed;
            shellMat.opacity = 0.13 + shown * 0.1;

            world.rotation.y = Math.sin(t * 0.25) * 0.12;
          },
        };
      },
      { position: [0, 0, 5.05], fov: 45 }
    );
  }, [idle]);

  return <div className="scene" ref={hostRef} aria-hidden="true" />;
}
