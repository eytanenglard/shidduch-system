// src/components/questionnaire/onboarding/Welcome.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShieldCheck, Sparkles, LogIn, Edit } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { WelcomeDict } from '@/types/dictionary'; // Import dictionary type

// --- Props Interface ---
interface WelcomeProps {
  onStart: () => void;
  onLearnMore: () => void;
  isLoggedIn: boolean;
  hasSavedProgress: boolean;
  dict: WelcomeDict; // <-- Add dict prop
}

const FeatureHighlight: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}> = ({ icon, title, description, color }) => (
  // This component now receives its text as props
  <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-slate-100">
    <div
      className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full mb-4 ${color}`}
    >
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const TestimonialCard: React.FC<{ quote: string; author: string }> = ({
  quote,
  author,
}) => (
  <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm">
    <CardContent className="pt-6">
      <p className="text-slate-700 italic">“{quote}”</p>
      <p className="text-right font-semibold text-slate-500 mt-3">- {author}</p>
    </CardContent>
  </Card>
);

export default function Welcome({
  onStart,
  isLoggedIn,
  hasSavedProgress,
  dict, // <-- Destructure dict
}: WelcomeProps) {
  const { data: session } = useSession();
  const userName = session?.user?.firstName;

  // Animation variants remain the same
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  const featureIcons = [
    {
      icon: <Sparkles className="h-7 w-7 text-purple-500" />,
      color: 'bg-purple-50',
    },
    {
      icon: <ShieldCheck className="h-7 w-7 text-green-500" />,
      color: 'bg-green-50',
    },
    { icon: <Heart className="h-7 w-7 text-rose-500" />, color: 'bg-rose-50' },
  ];

  const renderCTAButton = () => {
    let text = dict.loggedInCTA;
    let Icon = Heart;

    if (!isLoggedIn) {
      text = dict.guestCTA;
    } else if (hasSavedProgress) {
      text = dict.resumeCTA;
      Icon = Edit;
    }

    return (
      <Button
        onClick={onStart}
        size="lg"
        className="w-full sm:w-auto text-lg font-semibold px-8 py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1"
      >
        <div className="flex items-center justify-center">
          <Icon className="w-6 h-6 ms-3 fill-white" />
          <span>{userName && isLoggedIn ? `${text}, ${userName}` : text}</span>
        </div>
      </Button>
    );
  };

  return (
    <motion.div
      className="min-h-screen w-full bg-slate-50 p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto space-y-16 py-12">
        <motion.section variants={itemVariants} className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {dict.mainTitle}
          </h1>
          <p className="max-w-3xl mx-auto mt-4 text-lg text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
          <div className="mt-10">{renderCTAButton()}</div>
        </motion.section>

        {!isLoggedIn && (
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
            <Card className="bg-sky-50 border-sky-200 shadow-md">
              <CardContent className="pt-6 text-center space-y-3">
                <h3 className="font-semibold text-sky-800">
                  {dict.loginPrompt.title}
                </h3>
                <p className="text-sky-700 text-sm">{dict.loginPrompt.text}</p>
                <Button
                  variant="outline"
                  className="bg-white border-sky-300 text-sky-700 hover:bg-white/80"
                  onClick={() => (window.location.href = '/auth/signin')}
                >
                  <LogIn className="w-4 h-4 ms-2" />
                  {dict.loginPrompt.loginButtonText}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dict.features.map((feature, index) => (
              <FeatureHighlight
                key={index}
                title={feature.title}
                description={feature.description}
                icon={featureIcons[index].icon}
                color={featureIcons[index].color}
              />
            ))}
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">
              {dict.testimonials.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {dict.testimonials.quotes.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </motion.section>

        <motion.div
          variants={itemVariants}
          className="text-center pt-8 border-t border-slate-200"
        >
          <p className="text-slate-600 mb-6">{dict.finalCta.title}</p>
          {renderCTAButton()}
        </motion.div>
      </div>
    </motion.div>
  );
}
