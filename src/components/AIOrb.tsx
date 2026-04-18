import { motion } from "motion/react";

export function AIOrb() {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Outer Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-full h-full rounded-full bg-[#00ffa3]/20 blur-3xl"
      />
      
      {/* Middle Layer */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          borderWidth: ["1px", "2px", "1px"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-40 h-40 rounded-full border border-[#00ffa3]/30 flex items-center justify-center"
      >
        <div className="w-32 h-32 rounded-full border border-white/5" />
      </motion.div>

      {/* Inner Core */}
      <motion.div
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#00ffa3] to-emerald-600 shadow-[0_0_50px_rgba(0,255,163,0.5)] overflow-hidden"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Swirling highlights */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)] opacity-50" />
        <motion.div 
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-white/10 blur-xl" 
        />
      </motion.div>
    </div>
  );
}
