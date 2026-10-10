import { useEffect, useRef } from 'react';
import type { FlowArtProps } from './flow-art.types';

interface Particle { x: number; y: number; age: number; life: number }

// Decorative 2D canvas, isolated from shared screens and from every Android bundle.
// It sleeps offscreen and in hidden tabs, and draws one still frame under reduced motion.
export function FlowArt({ paused }: FlowArtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef(1);
  useEffect(() => { target.current = paused ? 0.08 : 1; }, [paused]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, visible = true, speed = 1, time = 0;
    let particles: Particle[] = [];
    let pointer: { x: number; y: number } | null = null;
    const angle = (x: number, y: number) => Math.sin(x * 0.0026 + time * 0.21) * 1.05 + Math.cos(y * 0.0052 - time * 0.16) * 1.1 + Math.sin((x - y) * 0.0017 + time * 0.1) * 0.55;
    const spawn = (particle: Particle, anywhere: boolean) => {
      particle.x = anywhere ? Math.random() * width : -10;
      particle.y = Math.random() * height;
      particle.life = 160 + Math.random() * 320;
      particle.age = 0;
      return particle;
    };
    const step = (still: boolean) => {
      if (!still) {
        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = 'rgba(0,0,0,.028)';
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = 'source-over';
      }
      context.lineWidth = 1.1;
      context.lineCap = 'round';
      for (const particle of particles) {
        const direction = angle(particle.x, particle.y);
        let vx = (0.85 + Math.cos(direction) * 0.75) * speed;
        let vy = Math.sin(direction) * 1.25 * speed;
        if (pointer) {
          const dx = particle.x - pointer.x, dy = particle.y - pointer.y, distance = dx * dx + dy * dy;
          if (distance < 22000) {
            const push = (1 - distance / 22000) * 1.6, length = Math.sqrt(distance + 1);
            vx += (dx / length) * push;
            vy += (dy / length) * push;
          }
        }
        const x = particle.x + vx * 1.25, y = particle.y + vy * 1.25;
        const fade = Math.min(1, particle.age / 30, (particle.life - particle.age) / 30);
        context.strokeStyle = `rgba(200,16,46,${(still ? 0.05 : 0.2) * fade})`;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(x, y);
        context.stroke();
        particle.x = x;
        particle.y = y;
        particle.age += 1;
        if (particle.age > particle.life || x > width + 10 || y < -10 || y > height + 10) spawn(particle, still || Math.random() < 0.3);
      }
    };
    const tick = () => {
      if (!visible || document.hidden || reduce.matches) { frame = 0; return; }
      speed += (target.current - speed) * 0.04;
      time += 0.016 * speed;
      step(false);
      frame = requestAnimationFrame(tick);
    };
    const resume = () => { if (!frame && visible && !document.hidden && !reduce.matches) frame = requestAnimationFrame(tick); };
    const size = () => {
      const ratio = Math.min(window.devicePixelRatio, 1.5), box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.round(Math.min(760, (width * height) / 2000)) }, () => spawn({ x: 0, y: 0, age: 0, life: 0 }, true));
      if (reduce.matches) { for (let index = 0; index < 90; index++) step(true); } else resume();
    };
    const move = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      pointer = inside ? { x: event.clientX - box.left, y: event.clientY - box.top } : null;
    };
    const resize = new ResizeObserver(size);
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', resume);
    reduce.addEventListener('change', size);
    window.addEventListener('pointermove', move);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', resume);
      reduce.removeEventListener('change', size);
      window.removeEventListener('pointermove', move);
    };
  }, []);
  return <div aria-hidden="true" className="flow-art"><canvas ref={canvasRef} /></div>;
}
