import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  Users,
  Search,
  ArrowRight,
  Star,
  Shield,
  Clock,
  AlertTriangle
} from "lucide-react";

interface WelcomeProps {
  onStart: () => void;
  onLearnMore: () => void;
  isLoggedIn?: boolean;
}

export default function Welcome({ onStart, onLearnMore, isLoggedIn }: WelcomeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const features = [
    {
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: "תהליך מותאם אישית",
      description: "השאלון מתאים את עצמו לקצב ולהעדפות שלך",
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      title: "פרטיות מלאה",
      description: "המידע שלך מאובטח ונשמר בצורה מוגנת",
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      title: "התאמה מדויקת",
      description: "אלגוריתם חכם שמבין את הצרכים שלך",
    },
  ];

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="max-w-4xl w-full">
        <CardHeader className="text-center pb-2">
          <motion.div
            className="flex justify-center mb-6"
            variants={itemVariants}
          >
            <div className="relative">
              <Heart className="w-16 h-16 text-pink-500" />
              <Users className="w-10 h-10 text-blue-500 absolute -bottom-2 -right-2" />
              <Search className="w-8 h-8 text-purple-500 absolute -top-1 -right-3" />
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CardTitle className="text-3xl mb-2">
              ברוכים הבאים לשאלון ההיכרות
            </CardTitle>
            <CardDescription className="text-lg">
              הצעד הראשון במסע למציאת הזיווג המתאים עבורך
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-8">
          {!isLoggedIn && (
            <motion.div variants={itemVariants}>
             <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800 font-medium">שים/י לב!</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  <p className="mb-2">את/ה כרגע לא מחובר/ת למערכת.</p>
                  <p className="mb-2">ניתן למלא את השאלון גם ללא חשבון, אבל:</p>
                  <ul className="list-disc mr-6 space-y-1 mb-2">
                    <li>התשובות לא יישמרו במערכת</li>
                    <li>לא תוכל/י לחזור לשאלון בפעם אחרת</li>
                    <li>בסיום השאלון תוכל/י להוריד את הסיכום כקובץ PDF</li>
                  </ul>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-600 hover:text-blue-800" 
                    onClick={() => window.location.href = '/login'}
                  >
                    להתחברות למערכת לחץ/י כאן
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            className="text-center text-gray-600 max-w-2xl mx-auto"
          >
            <p>
              השאלון שלנו מסייע לנו להכיר אותך טוב יותר ולהבין את הערכים,
              השאיפות והצרכים שלך. כך נוכל למצוא עבורך את ההתאמה הטובה ביותר.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-gray-50 rounded-full">
                      {feature.icon}
                    </div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-sm text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-blue-50 p-6 rounded-lg"
          >
            <h3 className="font-medium mb-2">מה מחכה לך?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <ArrowRight className="w-4 h-4 ml-2 text-blue-500" />
                כ-30 דקות של שאלון מעמיק ומחכים
              </li>
              <li className="flex items-center">
                <ArrowRight className="w-4 h-4 ml-2 text-blue-500" />
                אפשרות לעצור ולהמשיך בכל שלב
              </li>
              <li className="flex items-center">
                <ArrowRight className="w-4 h-4 ml-2 text-blue-500" />
                תובנות משמעותיות על עצמך
              </li>
            </ul>
          </motion.div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button
            variant="outline"
            onClick={onLearnMore}
            className="w-full sm:w-auto"
          >
            למידע נוסף
          </Button>
          <Button
            onClick={onStart}
            className="w-full sm:w-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div
              className="flex items-center"
              animate={{ x: isHovered ? 5 : 0 }}
              transition={{ duration: 0.2 }}
            >
              בוא/י נתחיל
              <ArrowRight className="w-5 h-5 mr-2" />
            </motion.div>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}