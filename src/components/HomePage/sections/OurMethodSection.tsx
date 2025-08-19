// src/components/HomePage/sections/OurMethodSection.tsx
'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { motion, useInView, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Heart,
  User,
  Users,
  Scroll,
  UserCheck,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Pause,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import { usePathname } from 'next/navigation';

// --- START: Type Definitions ---
interface WorldDict {
  title: string;
  shortDesc: string;
  fullDescription: string;
  personalExample: string;
  insight: string;
}

interface OurMethodDict {
  constellation: {
    header: string;
    title_part1: string;
    title_part2: string;
    subtitle: string;
    cta_header: string;
    cta_title_part1: string;
    cta_title_part2: string;
    cta_subtitle: string;
    cta_button: string;
    cta_features: string;
    worlds: WorldDict[];
  };
}

interface OurMethodProps {
  dict: OurMethodDict;
}

interface WorldData extends WorldDict {
  id: number;
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  angle: number;
}
// --- END: Type Definitions ---

const MatchingConstellation: React.FC<{ dict: OurMethodDict['constellation'], locale: string }> = ({ dict, locale }) => {
  const [hoveredWorld, setHoveredWorld] = useState<number | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [rotationOffset, setRotationOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const panStartRotation = useRef(0);
  const sectionRef = useRef(null);
  const constellationRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.02 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const worlds: WorldData[] = useMemo(
    () => [
      {
        id: 1, icon: <User className="w-6 h-6 md:w-8 md:h-8" />, ...dict.worlds[0],
        color: 'from-sky-400 to-blue-500', gradientFrom: '#38bdf8', gradientTo: '#3b82f6', angle: -72,
      },
      {
        id: 2, icon: <Heart className="w-6 h-6 md:w-8 md:h-8" />, ...dict.worlds[1],
        color: 'from-rose-400 to-pink-500', gradientFrom: '#fb7185', gradientTo: '#ec4899', angle: -144,
      },
      {
        id: 3, icon: <Users className="w-6 h-6 md:w-8 md:h-8" />, ...dict.worlds[2],
        color: 'from-emerald-400 to-teal-500', gradientFrom: '#34d399', gradientTo: '#14b8a6', angle: 144,
      },
      {
        id: 4, icon: <UserCheck className="w-6 h-6 md:w-8 md:h-8" />, ...dict.worlds[3],
        color: 'from-violet-400 to-purple-500', gradientFrom: '#a78bfa', gradientTo: '#8b5cf6', angle: 72,
      },
      {
        id: 5, icon: <Scroll className="w-6 h-6 md:w-8 md:h-8" />, ...dict.worlds[4],
        color: 'from-amber-400 to-orange-500', gradientFrom: '#fbbf24', gradientTo: '#f97316', angle: 0,
      },
    ],
    [dict.worlds]
  );

  useEffect(() => {
    if (!isAutoPlaying || isDragging) return;
    const interval = setInterval(() => {
      setSelectedWorld((prev) => (prev ? (prev % worlds.length) + 1 : 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isDragging, worlds.length]);

  useEffect(() => {
    const targetWorld = worlds.find((w) => w.id === selectedWorld);
    if (targetWorld) {
      setRotationOffset(-targetWorld.angle);
    }
  }, [selectedWorld, worlds]);

  const getDimensions = () => {
    if (isMobile) {
      return {
        size: 350,
        center: 175,
        radius: 120,
        iconSize: 50,
        coreRadius: 20,
      };
    }
    return {
      size: 500,
      center: 250,
      radius: 170,
      iconSize: 70,
      coreRadius: 28,
    };
  };

  const dimensions = getDimensions();

  interface ConstellationLine {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    opacity: number;
  }
  
  const generateConstellationLines = (): ConstellationLine[] => {
    const lines: ConstellationLine[] = [];
    const { center, radius } = dimensions;

    worlds.forEach((world, index) => {
      const nextIndex = (index + 1) % worlds.length;
      const nextWorld = worlds[nextIndex];
      const currentAngle = world.angle + rotationOffset;
      const nextAngle = nextWorld.angle + rotationOffset;

      const x1 = center + Math.cos((currentAngle * Math.PI) / 180) * radius;
      const y1 = center + Math.sin((currentAngle * Math.PI) / 180) * radius;
      const x2 = center + Math.cos((nextAngle * Math.PI) / 180) * radius;
      const y2 = center + Math.sin((nextAngle * Math.PI) / 180) * radius;

      lines.push({ id: `line-${index}`, x1, y1, x2, y2, opacity: 0.4 });
    });
    return lines;
  };

  const handleWorldInteraction = (worldId: number) => {
    setIsAutoPlaying(false);
    setSelectedWorld(worldId);
    setHoveredWorld(null);

    setTimeout(() => {
      const infoPanel = document.querySelector('[data-world-info-panel]');
      if (infoPanel) {
        infoPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handlePanStart = useCallback(() => {
    setIsAutoPlaying(false);
    setIsDragging(true);
    panStartRotation.current = rotationOffset;
  }, [rotationOffset]);

  const handlePan = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const sensitivity = 0.5;
      setRotationOffset(panStartRotation.current + info.offset.x * sensitivity);
    },
    []
  );

  const handlePanEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const swipePower = Math.abs(info.velocity.x);
      const swipeDistance = Math.abs(info.offset.x);
      const flickThreshold = 200;

      const currentWorldIndex =
        worlds.findIndex((w) => w.id === selectedWorld) ?? 0;
      let nextWorldIndex = currentWorldIndex;

      if (swipePower > flickThreshold || swipeDistance > dimensions.size / 4) {
        if (info.offset.x < 0) {
          nextWorldIndex = (currentWorldIndex + 1) % worlds.length;
        } else {
          nextWorldIndex =
            (currentWorldIndex - 1 + worlds.length) % worlds.length;
        }
      }
      setSelectedWorld(worlds[nextWorldIndex].id);
    },
    [selectedWorld, worlds, dimensions.size]
  );

  const activeWorld = hoveredWorld || selectedWorld;
  const displayedWorld = worlds.find((w) => w.id === activeWorld) || worlds[0];

  return (
    <div
      ref={sectionRef}
      className="relative w-full max-w-7xl mx-auto py-8 md:py-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="text-center mb-8 md:mb-16 px-4"
      >
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 md:px-8 py-3 md:py-4 shadow-md border border-gray-200 mb-6 md:mb-8">
          <Heart className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
          <span className="text-gray-700 font-medium text-base md:text-lg">
            {dict.header}
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 leading-tight px-4">
          {dict.title_part1}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-600">
            {' '}{dict.title_part2}{' '}
          </span>
        </h3>
        <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
          {dict.subtitle}
        </p>
      </motion.div>

      <div className="flex flex-col xl:flex-row items-center gap-8 md:gap-16">
        <motion.div
          ref={constellationRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative flex-1 min-w-0 w-full touch-none cursor-grab active:cursor-grabbing"
          style={{
            width: dimensions.size,
            height: dimensions.size,
            maxWidth: '100vw',
            margin: '0 auto',
          }}
          drag={isMobile ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
        >
          <div
            className="relative mx-auto flex items-center justify-center"
            style={{
              width: dimensions.size,
              height: dimensions.size,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-sky-50/80 rounded-full blur-3xl" />

            <svg
              viewBox={`0 0 ${dimensions.size} ${dimensions.size}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {generateConstellationLines().map((line) => (
                <motion.line
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="url(#lineGradient)"
                  strokeWidth={isMobile ? '1.5' : '2'}
                  opacity={isDragging ? 0.6 : line.opacity}
                  className="transition-opacity duration-300"
                  animate={{
                    x1: line.x1,
                    y1: line.y1,
                    x2: line.x2,
                    y2: line.y2,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                  }}
                />
              ))}

              <defs>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
                </linearGradient>
                <radialGradient id="coreGradient">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="50%" stopColor="#f8fafc" stopOpacity="0.98" />
                  <stop offset="80%" stopColor="#f1f5f9" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.9" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {worlds.map((world) => (
                  <radialGradient
                    key={`gradient-${world.id}`}
                    id={`worldGradient-${world.id}`}
                  >
                    <stop
                      offset="0%"
                      stopColor={world.gradientFrom}
                      stopOpacity="0.95"
                    />
                    <stop
                      offset="100%"
                      stopColor={world.gradientTo}
                      stopOpacity="0.85"
                    />
                  </radialGradient>
                ))}
              </defs>

              <motion.circle
                cx={dimensions.center}
                cy={dimensions.center}
                r={dimensions.coreRadius}
                fill="url(#coreGradient)"
                filter="url(#glow)"
                className="drop-shadow-xl"
                animate={{
                  scale: activeWorld ? 1.15 : isDragging ? 1.05 : 1,
                  filter: isDragging
                    ? 'url(#glow) brightness(1.1)'
                    : 'url(#glow)',
                }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
              />
              <foreignObject
                x={dimensions.center - (isMobile ? 18 : 24)}
                y={dimensions.center - (isMobile ? 18 : 24)}
                width={isMobile ? 36 : 48}
                height={isMobile ? 36 : 48}
              >
                <div className="flex items-center justify-center w-full h-full">
                  <motion.div
                    className="relative w-full h-full flex items-center justify-center"
                    animate={{
                      rotate: isDragging ? 360 : 0,
                      scale: isDragging ? 1.1 : activeWorld ? 1.05 : 1,
                    }}
                    transition={{
                      rotate: {
                        duration: isDragging ? 3 : 0,
                        repeat: isDragging ? Infinity : 0,
                        ease: 'linear',
                      },
                      scale: { duration: 0.3, type: 'spring', stiffness: 300 },
                    }}
                  >
                    <div
                      className={`relative ${isMobile ? 'w-7 h-7' : 'w-9 h-9'}`}
                    >
                      <Image
                        src={getRelativeCloudinaryPath(
                          'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png'
                        )}
                        alt="NeshamaTech"
                        fill
                        className="object-contain transition-all duration-300"
                        sizes={isMobile ? '28px' : '36px'}
                      />
                    </div>
                    {(activeWorld || isDragging) && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            '0 0 0 0 rgba(139, 92, 246, 0)',
                            '0 0 0 4px rgba(139, 92, 246, 0.1)',
                            '0 0 0 0 rgba(139, 92, 246, 0)',
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </motion.div>
                </div>
              </foreignObject>
            </svg>

            {worlds.map((world, index) => {
              const currentAngle = world.angle + rotationOffset;
              const x =
                dimensions.center +
                Math.cos((currentAngle * Math.PI) / 180) * dimensions.radius;
              const y =
                dimensions.center +
                Math.sin((currentAngle * Math.PI) / 180) * dimensions.radius;
              const isActive = activeWorld === world.id;
              const halfIcon = dimensions.iconSize / 2;

              return (
                <motion.div
                  key={world.id}
                  className="absolute cursor-pointer group select-none"
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                    pointerEvents: isDragging ? 'none' : 'auto',
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: isInView ? 1 : 0,
                    scale: isInView ? 1 : 0,
                    left: x - halfIcon,
                    top: y - halfIcon,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    delay: 0.7 + index * 0.1,
                  }}
                  onMouseEnter={() => !isMobile && setHoveredWorld(world.id)}
                  onMouseLeave={() => !isMobile && setHoveredWorld(null)}
                  onClick={() =>
                    !isDragging && handleWorldInteraction(world.id)
                  }
                  whileHover={!isMobile ? { scale: 1.15 } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className={`rounded-full bg-gradient-to-br ${world.color} flex items-center justify-center text-white shadow-xl relative overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 md:ring-4 ring-white/60' : ''} ${isDragging ? 'shadow-2xl' : ''}`}
                    style={{
                      width: dimensions.iconSize,
                      height: dimensions.iconSize,
                    }}
                    animate={{
                      scale: isDragging ? 1.05 : 1,
                      boxShadow: isDragging
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.3)'
                        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${world.color} rounded-full blur-md`}
                      animate={{
                        scale: isActive ? 1.8 : isDragging ? 1.3 : 1,
                        opacity: isActive ? 0.5 : isDragging ? 0.3 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="relative z-10 transform transition-transform duration-300 group-hover:scale-110"
                      animate={{ rotate: isDragging ? [0, 5, -5, 0] : 0 }}
                      transition={{
                        rotate: {
                          duration: 0.6,
                          repeat: isDragging ? Infinity : 0,
                        },
                      }}
                    >
                      {world.icon}
                    </motion.div>
                    {isActive && (
                      <>
                        <motion.div
                          className="absolute inset-0 border-2 border-white/70 rounded-full"
                          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 border-2 border-white/50 rounded-full"
                          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: 1,
                          }}
                        />
                      </>
                    )}
                  </motion.div>

                  <motion.div
                    className={`absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap ${isMobile ? '-bottom-8 text-xs' : '-bottom-12 text-sm'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, scale: isActive ? 1.05 : 1 }}
                    transition={{
                      delay: 1 + index * 0.1,
                      scale: { duration: 0.2 },
                    }}
                  >
                    <motion.span
                      className={`font-medium px-2 md:px-3 py-1 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-gray-800 shadow-lg border border-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
                      animate={{
                        backgroundColor: isActive ? '#ffffff' : 'transparent',
                        boxShadow: isActive
                          ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                          : '0 0 0 0 transparent',
                      }}
                    >
                      {world.title}
                    </motion.span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex-1 max-w-2xl w-full px-4"
          data-world-info-panel
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={displayedWorld.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-2xl border border-white/60 relative overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${displayedWorld.color} opacity-5 rounded-3xl`}
              />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
              <div className="relative z-10">
                <div className="flex items-start gap-4 md:gap-6 mb-6 md:mb-8">
                  <div
                    className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br ${displayedWorld.color} text-white shadow-lg flex-shrink-0`}
                  >
                    {displayedWorld.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        {displayedWorld.title}
                      </h4>
                      <Button
                        onClick={() => setIsAutoPlaying((prev) => !prev)}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full w-10 h-10 -mr-2 -mt-1 flex-shrink-0"
                        aria-label={
                          isAutoPlaying ? 'Pause animation' : 'Play animation'
                        }
                      >
                        <AnimatePresence mode="wait">
                          {isAutoPlaying ? (
                            <motion.div
                              key="pause"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <Pause className="w-5 h-5" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="play"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <Play className="w-5 h-5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </div>
                    <p className="text-base md:text-lg text-gray-600 font-medium">
                      {displayedWorld.shortDesc}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed text-base md:text-lg mb-6 md:mb-8">
                  {displayedWorld.fullDescription}
                </p>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 md:p-6 mb-4 md:mb-6 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 mt-3 flex-shrink-0"></div>
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">
                        למשל, אנו שואלים:
                      </h5>
                      <p className="text-gray-600 italic text-sm md:text-base">
                        &quot;{displayedWorld.personalExample}&quot;
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-violet-50 to-rose-50 rounded-2xl p-4 md:p-6 border border-violet-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-600 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-violet-800 mb-2">
                        התובנה שלנו:
                      </h5>
                      <p className="text-violet-700 text-sm md:text-base">
                        {displayedWorld.insight}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 md:mt-8 flex items-center gap-2">
                  <span className="text-sm text-gray-500 ml-3">
                    מימד {displayedWorld.id} מתוך {worlds.length}
                  </span>
                  {worlds.map((world) => (
                    <button
                      key={world.id}
                      onClick={() => handleWorldInteraction(world.id)}
                      className={`h-2 rounded-full transition-all duration-300 ${world.id === displayedWorld.id ? `bg-gradient-to-r ${displayedWorld.color} flex-1 min-w-[40px] md:min-w-[60px]` : 'bg-gray-200 w-4 md:w-6 hover:bg-gray-300'}`}
                      aria-label={`Select ${world.title}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
       
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1 }}
        className="text-center mt-12 md:mt-20 px-4 relative"
      >
        <div className="absolute inset-0 -mx-4 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-20 h-20 bg-gradient-to-br from-rose-300/20 to-pink-400/15 rounded-full blur-xl animate-soft-float" />
          <div
            className="absolute top-16 right-1/3 w-16 h-16 bg-gradient-to-br from-violet-300/25 to-purple-400/20 rounded-full blur-lg animate-soft-float"
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className="absolute bottom-10 left-1/3 w-24 h-24 bg-gradient-to-br from-sky-300/20 to-cyan-400/15 rounded-full blur-xl animate-soft-float"
            style={{ animationDelay: '3s' }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-white/90 via-rose-50/80 to-white/90 backdrop-blur-sm rounded-full px-6 md:px-8 py-3 md:py-4 shadow-lg border border-white/60 mb-6 md:mb-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400/10 via-violet-400/10 to-sky-400/10 rounded-full animate-pulse" />

            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-500 relative z-10" />
            </motion.div>
            <span className="text-gray-700 font-medium text-base md:text-lg relative z-10">
              {dict.cta_header}
            </span>
          </motion.div>

          <motion.h4
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 md:mb-6 relative"
          >
            {dict.cta_title_part1}{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-violet-600 to-sky-500">
                {dict.cta_title_part2}
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-violet-500 to-sky-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1, delay: 2 }}
                style={{ transformOrigin: 'left' }}
              />
            </span>
            ?
          </motion.h4>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-rose-50/40 to-violet-50/30 backdrop-blur-sm rounded-3xl border border-white/50 shadow-lg -m-4" />
            <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-10 leading-relaxed relative z-10 px-4">
              {dict.cta_subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center"
          >
            <Link href={`/${locale}/questionnaire`}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-violet-600 to-sky-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                <Button
                  size="lg"
                  className="relative group bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold w-full sm:w-auto border-0"
                >
                  <span className="flex items-center gap-3 justify-center relative z-10">
                    <motion.span className="whitespace-nowrap">
                      {dict.cta_button}
                    </motion.span>
                    <motion.div
                      className="flex-shrink-0"
                      animate={{ x: [0, 3, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </motion.div>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
                    animate={{
                      x: ['-100%', '100%'],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 2,
                    }}
                  />
                </Button>
              </motion.div>
            </Link>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 2 }}
              className="flex items-center gap-3 text-gray-600 text-sm md:text-base bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/60 shadow-md"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
              </motion.div>
              <span className="font-medium text-center sm:text-right">
                {dict.cta_features}
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 2.5 }}
            className="mt-8 flex justify-center gap-4"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-violet-500"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const OurMethodSection: React.FC<OurMethodProps> = ({ dict }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.02 });
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'he';

  return (
    <motion.section
      ref={sectionRef}
      id="our-method"
      className="relative pt-0 pb-12 md:pb-20 lg:pb-28 px-4 bg-gradient-to-b from-white via-rose-50/30 to-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 md:w-40 h-32 md:h-40 bg-gradient-to-br from-rose-200/30 to-pink-300/20 rounded-full blur-3xl animate-soft-float" />
        <div
          className="absolute top-60 right-20 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-violet-200/30 to-purple-300/20 rounded-full blur-2xl animate-soft-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-40 left-1/3 w-36 md:w-48 h-36 md:h-48 bg-gradient-to-br from-sky-200/20 to-cyan-300/15 rounded-full blur-3xl animate-soft-float"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute bottom-20 right-10 w-28 md:w-36 h-28 md:h-36 bg-gradient-to-br from-emerald-200/25 to-teal-300/20 rounded-full blur-2xl animate-soft-float"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:30px_30px]"></div>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="decorativeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            d="M0,100 C300,50 600,150 1200,100 L1200,0 L0,0 Z"
            fill="url(#decorativeGradient)"
            className="animate-gentle-pulse"
          />
          <path
            d="M0,700 C400,650 800,750 1200,700 L1200,800 L0,800 Z"
            fill="url(#decorativeGradient)"
            className="animate-gentle-pulse"
            style={{ animationDelay: '2s' }}
          />
        </svg>
      </div>

      <div className="relative max-w-8xl mx-auto">
        <MatchingConstellation dict={dict.constellation} locale={locale} />
      </div>

      <style jsx>{`
        @keyframes gentle-pulse {
          0%,
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
        @keyframes soft-float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-3px) rotate(0.5deg);
          }
          75% {
            transform: translateY(3px) rotate(-0.5deg);
          }
        }
        .animate-gentle-pulse {
          animation: gentle-pulse 4s ease-in-out infinite;
        }
        .animate-soft-float {
          animation: soft-float 6s ease-in-out infinite;
        }
      `}</style>
    </motion.section>
  );
};

export default OurMethodSection;