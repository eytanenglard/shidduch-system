import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import Link from 'next/link'; // 1. הוספת ייבוא Link

// Enhanced MatchmakerCard component with animations
interface MatchmakerCardProps {
  name: string;
  role: string;
  description: string;
  tags: string[];
  color: string;
  imageSrc?: string;
  delay?: number;
}

const MatchmakerCard: React.FC<MatchmakerCardProps> = ({
  name,
  role,
  description,
  tags,
  color,
  imageSrc,
  delay = 0,
}) => {
  const getGradientByColor = () => {
    switch (color) {
      case 'cyan':
        return 'from-cyan-500 to-cyan-700';
      case 'green':
        return 'from-teal-500 to-teal-700';
      default:
        return 'from-cyan-500 to-cyan-700';
    }
  };

  const getButtonColorByColor = () => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-600 hover:bg-cyan-700';
      case 'green':
        return 'bg-teal-600 hover:bg-teal-700';
      default:
        return 'bg-cyan-600 hover:bg-cyan-700';
    }
  };

  const getTagColorByColor = () => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-100 text-cyan-800';
      case 'green':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-cyan-100 text-cyan-800';
    }
  };

  return (
    <div className="rounded-xl shadow-lg overflow-hidden bg-white border border-gray-100 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
      <div className="p-8 flex flex-col items-center">
        {/* Animated image container */}
        <motion.div
          className="w-48 h-48 mb-6 overflow-hidden rounded-full border-4 border-white shadow-md relative"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          {imageSrc ? (
            <Image
              src={getRelativeCloudinaryPath(imageSrc)}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              className="object-cover object-center"
              priority
            />
          ) : (
            <div
              className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${getGradientByColor()}`}
            >
              <span className="text-white text-6xl font-bold opacity-30">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Name and role */}
        <h3 className="text-2xl font-bold text-gray-800 mb-1 text-center">
          {name}
        </h3>
        <p
          className={`text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r ${getGradientByColor()} text-center`}
        >
          {role}
        </p>

        {/* Tags with staggered animation */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center mb-5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: delay + 0.3,
              },
            },
          }}
        >
          {tags.map((tag, index) => (
            <motion.span
              key={index}
              className={`text-sm px-3 py-1 rounded-full ${getTagColorByColor()}`}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.3 },
                },
              }}
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        {/* Description */}
        <p className="text-gray-600 mb-6 text-center leading-relaxed">
          {description}
        </p>

        {/* --- START: Button with hover animation (MODIFIED) --- */}
        <Link href={`/contact?matchmaker=${encodeURIComponent(name)}`} passHref>
          <motion.a
            className={`inline-block text-center px-8 py-3 rounded-lg text-white ${getButtonColorByColor()} transition-colors duration-300 font-medium`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {`צרו קשר עם ${name.split(' ')[0]}`}
          </motion.a>
        </Link>
        {/* --- END: Button with hover animation (MODIFIED) --- */}
      </div>
    </div>
  );
};

const MatchmakerTeamSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: 'easeOut',
        scale: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        },
      },
    },
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  return (
    <motion.section
      ref={ref}
      id="our-team"
      className="py-16 md:py-24 px-4 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* רקע דקורטיבי */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative">
        {/* כותרת מרכזית */}
        <motion.div className="text-center mb-16" variants={headerVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            הכירו את
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
              {' '}
              המייסדים{' '}
            </span>
            שלנו
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            המייסדים שלנו מביאים ניסיון עשיר וגישה ייחודית לעולם השידוכים,
            בשילוב טכנולוגיה מתקדמת וראייה אישית
          </p>
        </motion.div>

        {/* כרטיסי השדכנים */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 max-w-5xl mx-auto">
          <motion.div variants={fadeInLeft}>
            <MatchmakerCard
              name="דינה אנגלרד"
              role="שדכנית ראשית"
              description="עם ניסיון של 8 שנים בתחום השידוכים, דינה מביאה כישורים בינאישיים יוצאי דופן והבנה עמוקה של צרכי המועמדים. הגישה האישית והאמפתית שלה יצרה עשרות זוגות מאושרים והיא מלווה כל מועמד בדרך מותאמת אישית."
              color="cyan"
              tags={['מומחית התאמה', 'ליווי אישי', '2+ שנות ניסיון']}
              imageSrc="https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg"
              delay={0.2}
            />
          </motion.div>

          <motion.div variants={fadeInRight}>
            <MatchmakerCard
              name="איתן אנגלרד"
              role="מייסד ומנכ״ל"
              description="יזם טכנולוגי עם התמחות בשידוכים. איתן פיתח את פלטפורמת התוכנה הייחודית שלנו ומשלב ידע טכנולוגי עם הבנה עמוקה של פסיכולוגיה חברתית. הגישה החדשנית שלו יצרה את השיטה הייחודית שמאפיינת את המשרד שלנו."
              color="green"
              tags={['חדשנות טכנולוגית', 'אלגוריתם התאמה', 'יזמות']}
              imageSrc="https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg"
              delay={0.4}
            />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default MatchmakerTeamSection;
