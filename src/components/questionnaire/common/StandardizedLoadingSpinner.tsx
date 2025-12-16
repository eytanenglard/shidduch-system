'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// ==================== INTERFACES ====================

interface StandardizedLoadingSpinnerProps {
  text?: string;
  subtext?: string;
  className?: string;
}

// ==================== CINEMATIC TIMING ====================
const TIMING = {
  drawDuration: 0.1,
  fillDelay: 0.1,
  stagger: 0.05,
  assemblyStart: 0.4,
  particleDuration: 1.2,
  convergenceStart: 0.6,
  convergenceDuration: 1.8,
  liquidFillStart: 0.8,
  liquidFillDuration: 2.5,
};

// Custom easing curves
const EASING = {
  dramatic: [0.175, 0.885, 0.32, 1.275],
  settle: [0.23, 1, 0.32, 1],
  elastic: [0.68, -0.55, 0.265, 1.55],
  breath: [0.4, 0, 0.6, 1],
  liquid: [0.45, 0, 0.55, 1],
};

// ==================== HELPER COMPONENTS ====================

function FloatingParticles({ count = 20 }) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 3 + 4,
        delay: Math.random() * 2,
        color:
          Math.random() > 0.5
            ? 'rgba(227, 138, 41, 0.4)'
            : 'rgba(54, 131, 104, 0.4)',
      }))
    );
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            filter: 'blur(1px)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(p.id) * 15, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function ParticleTrail({
  startX,
  startY,
  endX,
  endY,
  color,
  delay,
  count = 8,
}: any) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        offsetX: (Math.random() - 0.5) * 40,
        offsetY: (Math.random() - 0.5) * 40,
        size: Math.random() * 6 + 3,
        delay: delay + i * 0.05,
      }))
    );
  }, [count, delay]);

  if (particles.length === 0) return null;

  return (
    <>
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={startX}
          cy={startY}
          r={p.size}
          fill={color}
          initial={{ opacity: 0, cx: startX, cy: startY }}
          animate={{
            cx: [startX, endX + p.offsetX, endX + p.offsetX * 2],
            cy: [startY, endY + p.offsetY, endY + p.offsetY * 2],
            opacity: [0, 0.8, 0],
            r: [p.size, p.size * 0.5, 0],
          }}
          transition={{
            duration: TIMING.particleDuration,
            delay: p.delay,
            ease: EASING.settle,
          }}
        />
      ))}
    </>
  );
}

function ConvergingParticles({ phase }: { phase: string }) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 60 }, (_, i) => {
        const angle = (i / 60) * Math.PI * 2;
        const distance = 300 + Math.random() * 200;
        const centerX = 512;
        const centerY = 900;

        const isBottomArea = i > 30;
        const endX = centerX + (Math.random() - 0.5) * 180;
        const endY = isBottomArea
          ? 950 + Math.random() * 200
          : 750 + Math.random() * 200;

        return {
          id: i,
          startX: centerX + Math.cos(angle) * distance,
          startY: centerY + Math.sin(angle) * distance,
          endX: endX,
          endY: endY,
          size: Math.random() * 9 + 4,
          delay: Math.random() * 0.6,
          color:
            i % 3 === 0
              ? 'rgba(227, 138, 41, 0.85)'
              : i % 3 === 1
                ? 'rgba(54, 131, 104, 0.85)'
                : 'rgba(109, 186, 140, 0.85)',
        };
      })
    );
  }, []);

  if (phase !== 'assembled' || particles.length === 0) return null;

  return (
    <>
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          r={p.size}
          fill={p.color}
          initial={{
            cx: p.startX,
            cy: p.startY,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            cx: [p.startX, p.endX, p.endX],
            cy: [p.startY, p.endY, p.endY],
            opacity: [0, 0.85, 0.65],
            scale: [0, 1.3, 1],
          }}
          transition={{
            duration: TIMING.convergenceDuration,
            delay: TIMING.convergenceStart + p.delay,
            ease: EASING.dramatic,
            repeat: Infinity,
            repeatDelay: 0.3,
          }}
          filter="url(#particleGlow)"
        />
      ))}
    </>
  );
}

function ShimmerOverlay({ phase }: { phase: string }) {
  return (
    <motion.rect
      x="0"
      y="0"
      width="1024"
      height="1536"
      fill="url(#shimmerGradient)"
      initial={{ opacity: 0, x: -1024 }}
      animate={
        phase === 'assembled'
          ? {
              opacity: [0, 0.6, 0],
              x: [-1024, 1024, 1024],
            }
          : { opacity: 0 }
      }
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 3,
        ease: 'easeInOut',
      }}
    />
  );
}

// ==================== NEW: DUAL LIQUID FILL COMPONENT ====================

function DualLiquidFillEffect({ phase }: { phase: string }) {
  // Animation phase: 0 = bottom filling, 1 = top filling, 2 = top emptying, 3 = bottom emptying
  const [animPhase, setAnimPhase] = useState(0);
  const [bottomFill, setBottomFill] = useState(0);
  const [topFill, setTopFill] = useState(0);

  useEffect(() => {
    const phaseDuration = 2500; // Duration for each phase in ms

    let animationFrame: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / phaseDuration, 1);
      // Smooth easing
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      switch (animPhase) {
        case 0: // Bottom filling
          setBottomFill(eased * 100);
          setTopFill(0);
          break;
        case 1: // Top filling
          setBottomFill(100);
          setTopFill(eased * 100);
          break;
        case 2: // Top emptying
          setBottomFill(100);
          setTopFill(100 - eased * 100);
          break;
        case 3: // Bottom emptying
          setBottomFill(100 - eased * 100);
          setTopFill(0);
          break;
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Move to next phase
        startTime = Date.now();
        setAnimPhase((prev) => (prev + 1) % 4);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animPhase]);

  // The white space paths
  const topInnerPath =
    'M529.065 626.084C577.139 619.835 552.774 567.948 540.471 541.073C538.219 536.154 527.51 501.438 526.785 500.754C514.707 528.562 464.621 626.326 529.065 626.084Z';

  // Bottom area path (the green leaf inner area)
  const bottomInnerPath =
    'M330.116 738.601C330.7 742.335 330.652 745.025 333.854 747.337C338.899 750.978 351.661 749.998 357.829 749.459C362.928 749.328 370.963 748.92 371.669 742.671C372.55 734.885 374.633 713.696 369.718 707.774C361.787 704.909 340.95 705.77 331.367 705.795C329.048 715.971 330.863 728.827 330.116 738.601Z';

  // Bounding boxes (approximate)
  // Bottom: roughly x: 329-372, y: 705-750 (height ~45)
  // Top: roughly x: 465-577, y: 500-626 (height ~126)

  const bottomBounds = { x: 325, y: 702, width: 55, height: 52 };
  const topBounds = { x: 462, y: 498, width: 120, height: 132 };

  return (
    <g>
      <defs>
        {/* Clip paths */}
        <clipPath id="topFlameClip">
          <path d={topInnerPath} />
        </clipPath>
        <clipPath id="bottomLeafClip">
          <path d={bottomInnerPath} />
        </clipPath>

        {/* Orange gradient for bottom */}
        <linearGradient
          id="orangeLiquidGradient"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#F4A940" />
          <stop offset="50%" stopColor="#E38A29" />
          <stop offset="100%" stopColor="#D4782A" />
        </linearGradient>

        {/* Teal/Green gradient for top */}
        <linearGradient
          id="tealLiquidGradient"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="50%" stopColor="#4AA174" />
          <stop offset="100%" stopColor="#368368" />
        </linearGradient>
      </defs>

      {/* ===== BOTTOM AREA (Orange) - Inside the green leaf ===== */}
      <g clipPath="url(#bottomLeafClip)">
        {/* Main liquid - grows from bottom */}
        <rect
          x={bottomBounds.x}
          y={
            bottomBounds.y +
            bottomBounds.height -
            (bottomFill / 100) * bottomBounds.height
          }
          width={bottomBounds.width}
          height={(bottomFill / 100) * bottomBounds.height}
          fill="url(#orangeLiquidGradient)"
        />

        {/* Wave on top */}
        {bottomFill > 5 && (
          <motion.ellipse
            cx={bottomBounds.x + bottomBounds.width / 2}
            cy={
              bottomBounds.y +
              bottomBounds.height -
              (bottomFill / 100) * bottomBounds.height
            }
            rx={bottomBounds.width / 2 + 5}
            ry={3}
            fill="#F4A940"
            animate={{
              ry: [2, 4, 2],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </g>

      {/* Glow around bottom filled area */}
      {bottomFill > 30 && (
        <motion.path
          d={bottomInnerPath}
          fill="none"
          stroke="#E38A29"
          strokeWidth="4"
          style={{ filter: 'blur(6px)' }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}

      {/* ===== TOP AREA (Teal/Green) - Inside the flame ===== */}
      <g clipPath="url(#topFlameClip)">
        {/* Main liquid - grows from bottom */}
        <rect
          x={topBounds.x}
          y={
            topBounds.y + topBounds.height - (topFill / 100) * topBounds.height
          }
          width={topBounds.width}
          height={(topFill / 100) * topBounds.height}
          fill="url(#tealLiquidGradient)"
        />

        {/* Wave on top */}
        {topFill > 5 && (
          <motion.ellipse
            cx={topBounds.x + topBounds.width / 2}
            cy={
              topBounds.y +
              topBounds.height -
              (topFill / 100) * topBounds.height
            }
            rx={topBounds.width / 2 + 10}
            ry={4}
            fill="#2DD4BF"
            animate={{
              ry: [3, 6, 3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </g>

      {/* Glow around top filled area */}
      {topFill > 30 && (
        <motion.path
          d={topInnerPath}
          fill="none"
          stroke="#4AA174"
          strokeWidth="5"
          style={{ filter: 'blur(8px)' }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </g>
  );
}

// ==================== ANIMATED LOGO COMPONENT ====================

function AnimatedNeshamaLogo({ size = 140 }) {
  const [phase, setPhase] = useState('hidden');
  const height = size * 1.5;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('drawing'), 50),
      setTimeout(() => setPhase('filling'), TIMING.drawDuration * 1000 + 100),
      setTimeout(
        () => setPhase('entering'),
        (TIMING.drawDuration + TIMING.fillDelay) * 1000
      ),
      setTimeout(
        () => setPhase('assembled'),
        TIMING.assemblyStart * 1000 + 800
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const drawVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    drawing: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: TIMING.drawDuration, ease: EASING.settle },
    },
  };

  const mainFlameVariants = {
    hidden: { x: 120, y: -150, rotate: 35, scale: 0.3, opacity: 0 },
    entering: {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: { duration: 1, ease: EASING.elastic },
    },
    assembled: {
      x: 0,
      y: [0, -4, 0],
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: { y: { duration: 3, repeat: Infinity, ease: EASING.breath } },
    },
  };

  const greenLeafVariants = {
    hidden: { x: -100, y: 120, rotate: -30, scale: 0.3, opacity: 0 },
    entering: {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: { duration: 1, ease: EASING.elastic, delay: TIMING.stagger },
    },
    assembled: {
      x: 0,
      y: [0, -3, 0],
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: {
        y: { duration: 3, repeat: Infinity, ease: EASING.breath, delay: 0.2 },
      },
    },
  };

  const innerVariants = {
    hidden: { scale: 0, opacity: 0 },
    entering: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: EASING.dramatic,
        delay: TIMING.stagger * 2,
      },
    },
    assembled: {
      scale: 1,
      opacity: 1,
      transition: { duration: 2, repeat: Infinity, ease: EASING.breath },
    },
  };

  const glowVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    entering: {
      opacity: [0, 0.8, 0.5],
      scale: [0.5, 1.2, 1],
      transition: {
        duration: 1.2,
        delay: TIMING.assemblyStart - 0.3,
        ease: EASING.dramatic,
      },
    },
    assembled: {
      opacity: [0.4, 0.7, 0.4],
      scale: [1, 1.08, 1],
      transition: { duration: 3, repeat: Infinity, ease: EASING.breath },
    },
  };

  const flashVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    entering: {
      opacity: [0, 1, 0],
      scale: [0.8, 1.5, 2],
      transition: {
        duration: 0.6,
        delay: TIMING.assemblyStart - 0.1,
        ease: EASING.settle,
      },
    },
    assembled: { opacity: 0 },
  };

  const currentPhase = ['drawing', 'filling'].includes(phase)
    ? 'hidden'
    : phase;

  return (
    <div className="relative" style={{ width: size, height }}>
      <FloatingParticles count={15} />

      <motion.div
        className="absolute blur-3xl"
        style={{
          width: size * 1.6,
          height: height * 1.3,
          left: -size * 0.3,
          top: -height * 0.15,
          background: `
            radial-gradient(ellipse at 60% 30%, rgba(227, 138, 41, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 70%, rgba(54, 131, 104, 0.5) 0%, transparent 50%)
          `,
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
        }}
        variants={glowVariants}
        initial="hidden"
        animate={currentPhase}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.2,
          height: height * 0.8,
          left: -size * 0.1,
          top: height * 0.1,
          background:
            'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,200,150,0.5) 30%, transparent 60%)',
        }}
        variants={flashVariants}
        initial="hidden"
        animate={currentPhase}
      />

      <motion.svg
        width={size}
        height={height}
        viewBox="0 0 1024 1536"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <defs>
          <linearGradient
            id="animatedOrange"
            gradientUnits="userSpaceOnUse"
            x1="400"
            y1="1200"
            x2="800"
            y2="300"
          >
            <motion.stop
              offset="0%"
              animate={{ stopColor: ['#E38A29', '#D4782A', '#E38A29'] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.stop
              offset="50%"
              animate={{ stopColor: ['#E9A54A', '#E38A29', '#E9A54A'] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: ['#F4C67A', '#E9A54A', '#F4C67A'] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </linearGradient>

          <linearGradient
            id="shimmerGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient
            id="gradient_2"
            gradientUnits="userSpaceOnUse"
            x1="327"
            y1="1095"
            x2="485"
            y2="821"
          >
            <motion.stop
              offset="0%"
              animate={{ stopColor: ['#00686D', '#005558', '#00686D'] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: ['#4AA174', '#3D8B63', '#4AA174'] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </linearGradient>

          <linearGradient
            id="gradient_0"
            gradientUnits="userSpaceOnUse"
            x1="672"
            y1="810"
            x2="669"
            y2="885"
          >
            <stop offset="0" stopColor="#998842" />
            <stop offset="1" stopColor="#5F8958" />
          </linearGradient>
          <linearGradient
            id="gradient_1"
            gradientUnits="userSpaceOnUse"
            x1="801"
            y1="861"
            x2="781"
            y2="962"
          >
            <stop offset="0" stopColor="#B29649" />
            <stop offset="1" stopColor="#658F64" />
          </linearGradient>
          <linearGradient
            id="gradient_3"
            gradientUnits="userSpaceOnUse"
            x1="432"
            y1="756"
            x2="402"
            y2="812"
          >
            <stop offset="0" stopColor="#9D954F" />
            <stop offset="1" stopColor="#619967" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id="particleGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ParticleTrail
          startX={900}
          startY={100}
          endX={550}
          endY={600}
          color="rgba(227, 138, 41, 0.6)"
          delay={0}
        />
        <ParticleTrail
          startX={100}
          startY={1200}
          endX={400}
          endY={900}
          color="rgba(54, 131, 104, 0.6)"
          delay={TIMING.stagger}
        />

        <ConvergingParticles phase={phase} />

        {/* ===== DUAL LIQUID FILL EFFECT - Starts immediately ===== */}
        <DualLiquidFillEffect phase={phase} />

        <ShimmerOverlay phase={phase} />

        <motion.g
          variants={mainFlameVariants}
          initial="hidden"
          animate={currentPhase}
          style={{ originX: '550px', originY: '600px' }}
          filter={phase === 'assembled' ? 'url(#glow)' : undefined}
        >
          <motion.path
            d="M388.097 645.658C387.73 625.574 391.003 595.44 394.381 575.789C409.99 485.202 452.727 401.482 516.943 335.695C535.058 316.882 564.247 289.248 586.876 277.419C568.183 324.177 575.675 381.958 595.248 427.155C610.055 461.345 633.073 496.358 656.77 525.013C714.256 594.526 787.214 652.624 822.313 738.278C827.582 751.135 833.238 767.642 835.446 781.4C848.678 855.058 833.292 940.859 790.794 1003.05C790.136 1003.99 789.447 1004.92 788.728 1005.82C787.072 1010.12 773.865 1026.29 770.222 1030.77C727.741 1082.99 660.517 1133.39 599.827 1162.21C621.826 1139.05 644.429 1105.36 655.583 1075.42C671.044 1034.39 672.515 989.405 659.767 947.456C656.152 935.954 651.23 925.418 646.224 914.501C645.505 913.571 639.852 903.332 639.013 901.867C633.506 892.254 627.995 883.463 621.665 874.6C599.814 844.007 531.059 769.109 523.933 734.308C518.076 720.977 518.352 703.54 519.204 689.438C507.891 697.442 500.647 705.259 493.752 717.33C492.067 720.281 488.397 727.189 486.465 729.531C480.193 734.728 471.119 769.809 470.217 778.053C468.854 773.032 460.718 773.645 455.504 772.678C443.718 770.592 425.755 765.976 416.519 757.849C404.379 747.166 388.247 745.822 376.756 738.33L374.559 739.034C371.638 735.589 376.301 712.232 372.505 708.13C367.103 702.291 341.354 704.835 332.748 703.701C331.577 703.394 332.354 699.286 332.36 698.362C332.411 690.087 339.342 651.849 337.157 647.223L336.725 646.696C321.277 647.349 305.48 646.532 289.652 647.211L289.473 612.931C317.112 605.012 339.229 573.32 359.07 554.177C346.535 583.074 344.734 616.821 337.856 645.732C354.603 645.847 371.35 645.823 388.097 645.658ZM529.065 626.084C577.139 619.835 552.774 567.948 540.471 541.073C538.219 536.154 527.51 501.438 526.785 500.754C514.707 528.562 464.621 626.326 529.065 626.084Z"
            stroke="#E38A29"
            strokeWidth="3"
            fill="none"
            variants={drawVariants}
            initial="hidden"
            animate={phase === 'drawing' ? 'drawing' : 'drawing'}
          />
          <motion.path
            d="M388.097 645.658C387.73 625.574 391.003 595.44 394.381 575.789C409.99 485.202 452.727 401.482 516.943 335.695C535.058 316.882 564.247 289.248 586.876 277.419C568.183 324.177 575.675 381.958 595.248 427.155C610.055 461.345 633.073 496.358 656.77 525.013C714.256 594.526 787.214 652.624 822.313 738.278C827.582 751.135 833.238 767.642 835.446 781.4C848.678 855.058 833.292 940.859 790.794 1003.05C790.136 1003.99 789.447 1004.92 788.728 1005.82C787.072 1010.12 773.865 1026.29 770.222 1030.77C727.741 1082.99 660.517 1133.39 599.827 1162.21C621.826 1139.05 644.429 1105.36 655.583 1075.42C671.044 1034.39 672.515 989.405 659.767 947.456C656.152 935.954 651.23 925.418 646.224 914.501C645.505 913.571 639.852 903.332 639.013 901.867C633.506 892.254 627.995 883.463 621.665 874.6C599.814 844.007 531.059 769.109 523.933 734.308C518.076 720.977 518.352 703.54 519.204 689.438C507.891 697.442 500.647 705.259 493.752 717.33C492.067 720.281 488.397 727.189 486.465 729.531C480.193 734.728 471.119 769.809 470.217 778.053C468.854 773.032 460.718 773.645 455.504 772.678C443.718 770.592 425.755 765.976 416.519 757.849C404.379 747.166 388.247 745.822 376.756 738.33L374.559 739.034C371.638 735.589 376.301 712.232 372.505 708.13C367.103 702.291 341.354 704.835 332.748 703.701C331.577 703.394 332.354 699.286 332.36 698.362C332.411 690.087 339.342 651.849 337.157 647.223L336.725 646.696C321.277 647.349 305.48 646.532 289.652 647.211L289.473 612.931C317.112 605.012 339.229 573.32 359.07 554.177C346.535 583.074 344.734 616.821 337.856 645.732C354.603 645.847 371.35 645.823 388.097 645.658ZM529.065 626.084C577.139 619.835 552.774 567.948 540.471 541.073C538.219 536.154 527.51 501.438 526.785 500.754C514.707 528.562 464.621 626.326 529.065 626.084Z"
            fill="url(#animatedOrange)"
            initial={{ fillOpacity: 0 }}
            animate={{ fillOpacity: phase !== 'drawing' ? 1 : 0 }}
            transition={{ duration: 0.6, ease: EASING.breath }}
          />
        </motion.g>

        {/* ===== MAIN GREEN LEAF ===== */}
        <motion.g
          variants={greenLeafVariants}
          initial="hidden"
          animate={currentPhase}
          style={{ originX: '380px', originY: '950px' }}
          filter={phase === 'assembled' ? 'url(#glow)' : undefined}
        >
          <motion.path
            d="M337.157 647.223C339.342 651.849 332.411 690.087 332.36 698.362C332.354 699.286 331.577 703.394 332.748 703.701C341.354 704.835 367.103 702.291 372.505 708.13C376.301 712.232 371.638 735.589 374.559 739.034L376.756 738.33C388.247 745.822 404.379 747.166 416.519 757.849C425.755 765.976 443.718 770.592 455.504 772.678C460.718 773.645 468.854 773.032 470.217 778.053C471.119 769.809 480.193 734.728 486.465 729.531C485.386 732.345 484.346 735.205 483.231 738C466.823 779.155 462.739 824.408 475.911 867.141C477.16 869.353 480.167 876.839 481.705 879.899C486.897 890.23 492.422 900.979 499.22 910.373C540.122 966.887 588.038 1006.46 587.596 1082.75C587.318 1130.7 565.46 1180.72 531.452 1214.61C525.717 1211.46 516.25 1204.76 510.627 1201L472.853 1175.58C402.125 1127.9 327.517 1078.59 282.906 1003.64C245.647 941.037 228.653 848.045 247.089 776.958C257.292 795.59 272.506 810.201 286.562 825.663C282.009 803.119 277.555 780.191 274.959 757.343C273.069 740.704 272.454 723.79 271.575 707.068C278.443 706.347 283.952 706.228 290.87 706.107C299.576 706.145 323.755 706.691 330.935 705.489C330.187 697.59 335.738 656.518 337.157 647.223ZM330.116 738.601C330.7 742.335 330.652 745.025 333.854 747.337C338.899 750.978 351.661 749.998 357.829 749.459C362.928 749.328 370.963 748.92 371.669 742.671C372.55 734.885 374.633 713.696 369.718 707.774C361.787 704.909 340.95 705.77 331.367 705.795C329.048 715.971 330.863 728.827 330.116 738.601Z"
            stroke="#368368"
            strokeWidth="3"
            fill="none"
            variants={drawVariants}
            initial="hidden"
            animate={phase === 'drawing' ? 'drawing' : 'drawing'}
            transition={{ delay: 0.1 }}
          />
          <motion.path
            d="M337.157 647.223C339.342 651.849 332.411 690.087 332.36 698.362C332.354 699.286 331.577 703.394 332.748 703.701C341.354 704.835 367.103 702.291 372.505 708.13C376.301 712.232 371.638 735.589 374.559 739.034L376.756 738.33C388.247 745.822 404.379 747.166 416.519 757.849C425.755 765.976 443.718 770.592 455.504 772.678C460.718 773.645 468.854 773.032 470.217 778.053C471.119 769.809 480.193 734.728 486.465 729.531C485.386 732.345 484.346 735.205 483.231 738C466.823 779.155 462.739 824.408 475.911 867.141C477.16 869.353 480.167 876.839 481.705 879.899C486.897 890.23 492.422 900.979 499.22 910.373C540.122 966.887 588.038 1006.46 587.596 1082.75C587.318 1130.7 565.46 1180.72 531.452 1214.61C525.717 1211.46 516.25 1204.76 510.627 1201L472.853 1175.58C402.125 1127.9 327.517 1078.59 282.906 1003.64C245.647 941.037 228.653 848.045 247.089 776.958C257.292 795.59 272.506 810.201 286.562 825.663C282.009 803.119 277.555 780.191 274.959 757.343C273.069 740.704 272.454 723.79 271.575 707.068C278.443 706.347 283.952 706.228 290.87 706.107C299.576 706.145 323.755 706.691 330.935 705.489C330.187 697.59 335.738 656.518 337.157 647.223ZM330.116 738.601C330.7 742.335 330.652 745.025 333.854 747.337C338.899 750.978 351.661 749.998 357.829 749.459C362.928 749.328 370.963 748.92 371.669 742.671C372.55 734.885 374.633 713.696 369.718 707.774C361.787 704.909 340.95 705.77 331.367 705.795C329.048 715.971 330.863 728.827 330.116 738.601Z"
            fill="url(#gradient_2)"
            initial={{ fillOpacity: 0 }}
            animate={{ fillOpacity: phase !== 'drawing' ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASING.breath }}
          />
        </motion.g>

        {/* ===== SECONDARY ELEMENTS & PIXELS ===== */}
        <motion.path
          fill="#368368"
          d="M709.758 887.961C729.763 881.953 745.855 886.921 762.727 872.739L764.936 933.742L766.088 935.01C765.803 948.068 763.455 958.509 760.471 971.218C759.958 973.404 757.623 980.812 758.065 981.949C760.382 976.633 764.275 960.642 764.91 954.685C773.124 956.272 779.615 959.413 787.45 961.859C794.418 964.035 800.856 965.456 807.82 967.924C808.721 974.158 788.623 1000.63 788.728 1005.82C787.072 1010.12 773.865 1026.29 770.222 1030.77C727.741 1082.99 660.517 1133.39 599.827 1162.21C621.826 1139.05 644.429 1105.36 655.583 1075.42C671.044 1034.39 672.515 989.405 659.767 947.456C656.152 935.954 651.23 925.418 646.224 914.501L646.758 913.351C642.961 904.363 628.177 883.15 627.961 878.418L628.76 877.338C635.54 876.642 656.133 880.561 663.909 880.966C674.283 881.506 681.455 880.459 691.753 878.718C695.294 878.12 700.659 877.9 702.781 875.751C708.315 885.454 721.483 933.241 723.635 935.534L724.066 934.724L723.787 934.054C721.591 928.643 721.323 923.541 719.6 918.575C715.957 908.075 712.712 898.721 709.758 887.961Z"
          variants={innerVariants}
          initial="hidden"
          animate={currentPhase}
        />
        <motion.path
          fill="url(#gradient_0)"
          d="M523.933 734.308C525.907 735.103 526.071 736.436 527.076 739.029C535.443 760.632 562.736 800.882 579.286 818.163C577.59 817.737 607.027 818.042 604.656 818.504C617.5 816.002 659.327 820.35 668.689 814.509C667.052 810.166 662.521 805.717 661.767 802.327L662.323 801.831C666.225 805.554 674.681 823.401 679.021 823.388C681.704 823.381 684.351 822.03 687.19 821.983C702.015 821.736 735.219 825.4 745.542 813.781C745.753 813.544 745.945 813.292 746.147 813.047C745.333 809.06 742.134 804.771 740.583 800.844C733.605 783.184 723.208 766.896 712.626 751.211C707.382 743.44 699.981 734.485 695.426 726.539C708.605 741.729 719.948 759.609 730.142 776.963C731.458 779.202 736.419 789.18 737.703 790.484C742.074 800.861 747.059 811.196 750.998 821.699C761.473 850.29 766.975 880.463 767.266 910.911C767.316 914.829 767.386 932.07 766.088 935.01L764.936 933.742C767.39 919.085 764.816 887.207 762.727 872.739C745.855 886.921 729.763 881.953 709.758 887.961C712.712 898.721 715.957 908.075 719.6 918.575C721.323 923.541 721.591 928.643 723.787 934.054L724.066 934.724L723.635 935.534C721.483 933.241 708.315 885.454 702.781 875.751C700.659 877.9 695.294 878.12 691.753 878.718C681.455 880.459 674.283 881.506 663.909 880.966C656.133 880.561 635.54 876.642 628.76 877.338L627.961 878.418C628.177 883.15 642.961 904.363 646.758 913.351L646.224 914.501C645.505 913.571 639.852 903.332 639.013 901.867C633.506 892.254 627.995 883.463 621.665 874.6C599.814 844.007 531.059 769.109 523.933 734.308Z"
          variants={innerVariants}
          initial="hidden"
          animate={currentPhase}
        />
        <motion.path
          fill="url(#gradient_1)"
          d="M835.446 781.4C848.678 855.058 833.292 940.859 790.794 1003.05C790.136 1003.99 789.447 1004.92 788.728 1005.82C788.623 1000.63 808.721 974.158 807.82 967.924C800.856 965.456 794.418 964.035 787.45 961.859C779.615 959.413 773.124 956.272 764.91 954.685C764.275 960.642 760.382 976.633 758.065 981.949C757.623 980.812 759.958 973.404 760.471 971.218C763.455 958.509 765.803 948.068 766.088 935.01C767.386 932.07 767.316 914.829 767.266 910.911C766.975 880.463 761.473 850.29 750.998 821.699C747.059 811.196 742.074 800.861 737.703 790.484C744.786 795.618 758.629 839.067 761.048 849.918C761.882 853.66 762.923 858.606 764.21 862.267C765.239 861.47 769.903 858.764 771.19 859.197C779.598 862.025 831.21 870.864 836.621 867.181C841.075 856.65 837.774 818.153 837.603 805.05C837.516 798.434 833.905 787.799 835.446 781.4Z"
          variants={innerVariants}
          initial="hidden"
          animate={currentPhase}
        />
        <motion.path
          fill="url(#gradient_3)"
          d="M337.157 647.223C339.342 651.849 332.411 690.087 332.36 698.362C332.354 699.286 331.577 703.394 332.748 703.701C341.354 704.835 367.103 702.291 372.505 708.13C376.301 712.232 371.638 735.589 374.559 739.034L376.756 738.33C388.247 745.822 404.379 747.166 416.519 757.849C425.755 765.976 443.718 770.592 455.504 772.678C460.718 773.645 468.854 773.032 470.217 778.053C471.119 769.809 480.193 734.728 486.465 729.531C485.386 732.345 484.346 735.205 483.231 738C466.823 779.155 462.739 824.408 475.911 867.141C470.037 862.121 470.194 843.968 467.634 836.298C464.609 834.736 463.358 837.42 460.278 836.853C451.413 835.221 442.768 833.57 434.565 829.874C420.947 823.596 407.855 816.236 395.415 807.863C387.585 802.63 379.649 796.19 371.301 792.088C373.618 800.593 395.254 847.69 395.046 849.025C392.668 845.946 390.515 839.685 388.616 835.954C380.465 819.937 374.159 804.501 367.654 787.786C368.985 779.944 360.325 758.37 357.829 749.459C362.928 749.328 370.963 748.92 371.669 742.671C372.55 734.885 374.633 713.696 369.718 707.774C361.787 704.909 340.95 705.77 331.367 705.795L330.935 705.489C330.187 697.59 335.738 656.518 337.157 647.223Z"
          variants={innerVariants}
          initial="hidden"
          animate={currentPhase}
        />
        <motion.path
          fill="#6B9964"
          d="M330.935 705.489L331.367 705.795C329.048 715.971 330.863 728.827 330.116 738.601C330.7 742.335 330.652 745.025 333.854 747.337C338.899 750.978 351.661 749.998 357.829 749.459C360.325 758.37 368.985 779.944 367.654 787.786C364.016 778.825 363.504 764.032 357.916 758.428C354.565 756.891 353.915 756.419 350.302 757.308C343.558 752.195 337.405 753.633 331.676 749.525C325.419 745.052 321.223 742.141 315.483 736.879C311.269 733.015 295.086 712.717 291.896 712.467C290.25 714.937 291.663 717.936 290.844 722.043C290.051 718.869 289.637 709.077 290.87 706.107C299.576 706.145 323.755 706.691 330.935 705.489Z"
          variants={innerVariants}
          initial="hidden"
          animate={currentPhase}
        />
      </motion.svg>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function StandardizedLoadingSpinner({
  text = 'טוען...',
  subtext,
  className,
}: StandardizedLoadingSpinnerProps) {
  const [key] = useState(0);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden ${className || ''}`}
    >
      <div className="relative z-10">
        <AnimatedNeshamaLogo size={160} key={key} />
      </div>

      {text && (
        <motion.p
          key={`text-${key}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: TIMING.assemblyStart + 0.3,
            duration: 0.6,
            ease: EASING.settle,
          }}
          className="mt-6 text-xl font-semibold text-gray-700 text-center"
        >
          {text}
        </motion.p>
      )}

      {subtext && (
        <motion.div
          key={`sub-${key}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: TIMING.assemblyStart + 0.6 }}
          className="mt-4 flex items-center gap-2 text-sm text-gray-500"
        >
          <Sparkles className="w-4 h-4" />
          <span>{subtext}</span>
        </motion.div>
      )}
    </div>
  );
}
