import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { notifyCartChange } from '../layouts/UserLayout';

interface FlyParticle {
  id: number;
  x: number;
  y: number;
}

let pid = 0;

export function useCartFly() {
  const [particles, setParticles] = useState<FlyParticle[]>([]);

  const triggerFly = useCallback((x: number, y: number) => {
    const id = ++pid;
    setParticles(prev => [...prev, { id, x, y }]);
    notifyCartChange();
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 600);
  }, []);

  const CartParticles = () => (
    <AnimatePresence>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 1, x: p.x - 12, y: p.y - 12 }}
          animate={{ opacity: 0, scale: 0.4, x: window.innerWidth / 2 - 12, y: window.innerHeight - 80 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeIn' }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          <div className="w-6 h-6 bg-[#ffc200] rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
            +1
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );

  return { triggerFly, CartParticles };
}
