import { useEffect, useRef } from 'react';
import { designs, type Design } from '@/constants/designs';

// WebGL is isolated from shared screens and all Android bundles.
export function HeroArt({ design }: { design: Design }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    let disposed = false;
    let cleanup = () => {};
    import('three').then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
      catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      root.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 8;
      const group = new THREE.Group();
      scene.add(group);
      const geometry = new THREE.TorusKnotGeometry(1.25, design === 'ledger' ? 0.045 : 0.16, 180, 10, 2, 3);
      const material = new THREE.MeshStandardMaterial({ color: designs[design].accent, roughness: 0.25, metalness: 0.25, wireframe: design === 'grid' });
      group.add(new THREE.Mesh(geometry, material));
      const positions = new Float32Array(360 * 3);
      for (let i = 0; i < 360; i++) {
        const angle = i * 2.39996;
        const radius = 2 + (i % 30) / 18;
        positions.set([Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(i * 0.4) * 0.65], i * 3);
      }
      const pointsGeometry = new THREE.BufferGeometry();
      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pointsMaterial = new THREE.PointsMaterial({ color: designs[design].accent, size: 0.018, transparent: true, opacity: 0.5 });
      group.add(new THREE.Points(pointsGeometry, pointsMaterial));
      scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const light = new THREE.DirectionalLight(0xffffff, 4);
      light.position.set(2, 3, 5);
      scene.add(light);
      let frame = 0;
      let visible = true;
      let last = 0;
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const draw = () => renderer.render(scene, camera);
      const resize = new ResizeObserver(() => {
        const { width, height } = root.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        draw();
      });
      resize.observe(root);
      const tick = (time: number) => {
        if (!visible || document.hidden || media.matches || disposed) { frame = 0; return; }
        if (time - last > 50) { group.rotation.y += 0.003; group.rotation.z = Math.sin(time / 5000) * 0.08; draw(); last = time; }
        frame = requestAnimationFrame(tick);
      };
      const resume = () => { draw(); if (!frame && visible && !document.hidden && !media.matches) frame = requestAnimationFrame(tick); };
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
      observer.observe(root);
      document.addEventListener('visibilitychange', resume);
      media.addEventListener('change', resume);
      resume();
      cleanup = () => {
        cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
        document.removeEventListener('visibilitychange', resume); media.removeEventListener('change', resume);
        geometry.dispose(); material.dispose(); pointsGeometry.dispose(); pointsMaterial.dispose();
        renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => {});
    return () => { disposed = true; cleanup(); };
  }, [design]);
  return <div ref={container} aria-hidden="true" className={`hero-art hero-art-${design}`} />;
}
