import { useEffect, useRef, type ReactNode } from 'react';

/** Fades content up as it enters the viewport. Content already on screen, or without JavaScript, stays visible. */
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add('reveal');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.classList.add('in');
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`flex flex-col ${className}`}>{children}</div>;
}
