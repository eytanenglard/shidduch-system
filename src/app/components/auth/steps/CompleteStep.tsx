"use client";

import { useRouter } from 'next/navigation';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CompleteStep: React.FC = () => {
  const { data } = useRegistration();
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const circleVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };


  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToQuestionnaire = () => {
    router.push('/questionnaire');
  };

  return (
    <motion.div 
      className="space-y-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success animation */}
      <motion.div
        className="flex justify-center mb-6"
        variants={circleVariants}
      >
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 flex items-center justify-center">
          <motion.div 
            className="absolute inset-1 bg-white rounded-full flex items-center justify-center"
            animate={{ scale: [0.6, 1] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <CheckCircle className="h-14 w-14 text-green-500" />
          </motion.div>
        </div>
      </motion.div>
      
      <motion.h2 
        className="text-2xl font-bold text-gray-800"
        variants={itemVariants}
      >
        הרשמה הושלמה בהצלחה!
      </motion.h2>
      
      <motion.div variants={itemVariants}>
        {!data.isGoogleSignup && (
          <div className="p-4 bg-cyan-50 rounded-lg mb-5">
            <div className="flex items-center gap-2 text-cyan-700 mb-2">
              <Mail className="h-5 w-5" />
              <h3 className="font-medium">לא לשכוח לאמת את האימייל</h3>
            </div>
            <p className="text-sm text-cyan-600">
              שלחנו לך מייל לכתובת <span className="font-bold">{data.email}</span>.
              <br />
              אנא לחץ על הקישור במייל כדי להשלים את תהליך האימות.
            </p>
          </div>
        )}
        
        <p className="text-gray-600 mb-6">
          {data.isGoogleSignup 
            ? 'הפרופיל שלך הושלם בהצלחה!' 
            : 'ברכות על ההרשמה! המשיכו בתהליך כדי למצוא את השידוך המושלם עבורך.'}
        </p>
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4"
      >
        <Button
          onClick={navigateToProfile}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-lg shadow-lg flex items-center justify-center gap-2 group relative overflow-hidden"
        >
          {/* Button shimmer effect */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
          
          <User className="h-5 w-5 text-white" />
          <span className="text-white">לפרופיל שלי</span>
          <ArrowLeft className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
        </Button>
        
        <Button
          onClick={navigateToQuestionnaire}
          variant="outline"
          className="w-full py-3 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 flex items-center justify-center gap-2"
        >
          <span>למילוי שאלון התאמה</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2">
          חזרה לדף הבית
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default CompleteStep;