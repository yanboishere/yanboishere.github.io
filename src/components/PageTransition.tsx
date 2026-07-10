import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.8,
};

let isFirstPageLoad = true;

export default function PageTransition({ children }: PageTransitionProps) {
  const skipInitial = useRef(isFirstPageLoad);

  if (isFirstPageLoad) {
    isFirstPageLoad = false;
  }

  return (
    <motion.div
      initial={skipInitial.current ? { opacity: 1, y: 0 } : { opacity: 0.001, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0.001, y: -40 }}
      transition={springTransition}
    >
      {children}
    </motion.div>
  );
}