import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mountScene, addStudioLights, reducedMotion } from '../lib/three-stage';

const IDLE = new THREE.Color('#ffffff');
const ACTIVE = new THREE.Color('#d97757');

/**
 * Interactive 3D diagram of the backend request pipeline.
 *
 * One node per processing stage, wired together by a spline; a glowing packet
 * travels the spline continuously to show data flowing from raw form input to a
 * probability. Nodes are clickable and stay in sync with the step list beside
 * the canvas — useful when walking someone through what the server actually does.
 */
export default function PipelineScene({ count = 6, active = 0, onSelect, height = 300 }) {
  const hostRef = useRef(null);
  const activeRef = useRef(active);
  const selectRef = useRef(onSelect);
  activeRef.current = active;
  selectRef.current = onSelect;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const calm = reducedMotion();

    return mountScene(
      host,
      ({ scene, renderer, camera, envMap }) => {
        addStudioLights(scene, { intensity: 0.9 });

        const rig = new THREE.Group();
        rig.rotation.x = 0.17;
        scene.add(rig);

        /* ---- Node positions: a gentle zig-zag so depth is visible ---- */
        const span = 9.2;
        const points = [];
        for (let i = 0; i < count; i += 1) {
          const u = count === 1 ? 0.5 : i / (count - 1);
          points.push(
            new THREE.Vector3(
              -span / 2 + u * span,
              Math.sin(u * Math.PI * 2) * 0.42,
              Math.cos(u * Math.PI * 1.6) * 0.5
            )
          );
        }
        const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);

        /* ---- Wire ---- */
        const wire = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 160, 0.03, 10, false),
          new THREE.MeshStandardMaterial({
            color: 0xc2bdaa,
            roughness: 0.5,
            metalness: 0.1,
            envMap,
          })
        );
        rig.add(wire);

        /* ---- Nodes ---- */
        const nodeGeo = new THREE.IcosahedronGeometry(0.52, 1);
        const haloGeo = new THREE.TorusGeometry(0.78, 0.018, 10, 60);
        const nodes = points.map((p, i) => {
          const mat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.16,
            metalness: 0.08,
            clearcoat: 1,
            clearcoatRoughness: 0.12,
            envMap,
            envMapIntensity: 1.3,
          });
          const mesh = new THREE.Mesh(nodeGeo, mat);
          mesh.position.copy(p);
          mesh.userData.index = i;
          rig.add(mesh);

          const halo = new THREE.Mesh(
            haloGeo,
            new THREE.MeshBasicMaterial({ color: 0xd97757, transparent: true, opacity: 0 })
          );
          halo.position.copy(p);
          rig.add(halo);

          return { mesh, mat, halo, base: p.clone(), phase: i * 0.7 };
        });

        /* ---- Travelling packet + short trail ---- */
        const packetMat = new THREE.MeshBasicMaterial({ color: 0xd97757 });
        const packet = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), packetMat);
        rig.add(packet);

        const trail = [0.08, 0.06, 0.045].map((r) => {
          const m = new THREE.Mesh(
            new THREE.SphereGeometry(r, 14, 14),
            new THREE.MeshBasicMaterial({ color: 0xe5a37c, transparent: true, opacity: 0.5 })
          );
          rig.add(m);
          return m;
        });

        /* ---- Click / hover selection ---- */
        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const meshes = nodes.map((n) => n.mesh);

        const pick = (event) => {
          const rect = renderer.domElement.getBoundingClientRect();
          ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(ndc, camera);
          return raycaster.intersectObjects(meshes, false)[0]?.object ?? null;
        };

        const onClick = (e) => {
          const hit = pick(e);
          if (hit) selectRef.current?.(hit.userData.index);
        };
        const onMove = (e) => {
          renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'default';
        };

        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.addEventListener('pointermove', onMove);

        let u = 0;

        return {
          update(t, dt) {
            const speed = calm ? 0.2 : 1;

            // Packet loops the whole pipeline every ~5s.
            u = (u + dt * 0.2 * speed) % 1;
            packet.position.copy(curve.getPointAt(u));
            trail.forEach((m, i) => {
              const tu = (u - (i + 1) * 0.018 + 1) % 1;
              m.position.copy(curve.getPointAt(tu));
            });

            nodes.forEach((n, i) => {
              const isActive = i === activeRef.current;
              // Light a node up as the packet passes through it, too.
              const passing = Math.abs(u - (count === 1 ? 0.5 : i / (count - 1))) < 0.05;

              n.mat.color.lerp(isActive ? ACTIVE : IDLE, Math.min(dt * 5, 1));
              n.mat.emissive.lerp(
                isActive || passing ? ACTIVE : new THREE.Color(0x000000),
                Math.min(dt * 5, 1)
              );
              n.mat.emissiveIntensity = isActive ? 0.45 : 0.25;

              const goal = isActive ? 1.35 : passing ? 1.15 : 1;
              n.mesh.scale.lerp(new THREE.Vector3(goal, goal, goal), Math.min(dt * 6, 1));
              n.mesh.rotation.y += dt * (isActive ? 0.9 : 0.25) * speed;
              n.mesh.position.y = n.base.y + Math.sin(t * 0.8 + n.phase) * 0.06;
              n.halo.position.y = n.mesh.position.y;
              n.halo.rotation.z += dt * 0.6 * speed;

              const haloGoal = isActive ? 0.85 : 0;
              n.halo.material.opacity += (haloGoal - n.halo.material.opacity) * Math.min(dt * 5, 1);
              const hs = isActive ? 1 : 0.8;
              n.halo.scale.lerp(new THREE.Vector3(hs, hs, hs), Math.min(dt * 5, 1));
            });

            rig.rotation.y = Math.sin(t * 0.18) * 0.09;
          },
          dispose() {
            renderer.domElement.removeEventListener('click', onClick);
            renderer.domElement.removeEventListener('pointermove', onMove);
          },
        };
      },
      { position: [0, 1.6, 7], ortho: true, orthoHeight: 3.4 }
    );
  }, [count]);

  return (
    <div className="scene" style={{ height }} ref={hostRef}>
      <span className="scene-note">Click a node to jump to that stage</span>
    </div>
  );
}
