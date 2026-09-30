'use client';

// Independent implementation inspired by ibelick's In View on 21st.dev.
// https://21st.dev/@ibelick/components/in-view
import { motion, useReducedMotion } from 'motion/react';

export function InView({ children, className, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
