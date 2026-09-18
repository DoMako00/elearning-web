import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScreenStack } from "./ScreenStackContext";

export const ScreenStackContainer: React.FC = () => {
  const { currentScreen } = useScreenStack();

  return (
    <div className="relative w-full h-full min-h-0 flex-1 overflow-x-hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentScreen.id}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          className="w-full h-full flex flex-col"
        >
          {currentScreen.component}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
