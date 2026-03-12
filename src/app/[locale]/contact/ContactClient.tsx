// src/app/[locale]/contact/ContactClient.tsx
'use client';
import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Send,
  CheckCircle,
  AlertTriangle,
  HeartHandshake,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Shield,
  Users,
  UserPlus,
  HelpCircle,
  Lightbulb,
  Target,
  Sparkles,
} from 'lucide-react';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import type { ContactPageDict } from '@/types/dictionary';

const iconsMap: { [key: string]: React.ElementType } = {
  process: HelpCircle,
  consultation: HeartHandshake,
  general: MessageCircle,
  technical: Users,
};

interface ContactClientProps {
  dict: ContactPageDict;
}

export default function ContactClient({ dict }: ContactClientProps) {
  const teamMembers = [
    {
      name: dict.sidebar.team.members[0].name,
      image:
        'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg',
    },
    {
      name: dict.sidebar.team.members[1].name,
      image:
        'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1764678709/6a978d37-584c-4c70-8dac-36682d3149ff_olupeg.jpg',
    },
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<
    string,
    string[] | undefined
  > | null>(null);

  const heroRef = useRef(null);
  const formRef = useRef(null);
  const sidebarRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFormInView = useInView(formRef, { once: true });
  const isSidebarInView = useInView(sidebarRef, { once: true });

  const contactSchema = z.object({
    name: z.string().min(2, { message: dict.form.errors.nameMin }),
    email: z.string().email({ message: dict.form.errors.emailInvalid }),
    category: z.string().min(1, { message: dict.form.errors.categoryRequired }),
    message: z.string().min(10, { message: dict.form.errors.messageMin }),
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      setValidationErrors(null);

      const validationResult = contactSchema.safeParse({
        name,
        email,
        category,
        message,
      });

      if (!validationResult.success) {
        setValidationErrors(validationResult.error.flatten().fieldErrors);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validationResult.data),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || dict.form.errors.sendError);
        setSuccess(true);
        setName('');
        setEmail('');
        setCategory('');
        setMessage('');
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : dict.form.errors.unexpectedError
        );
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, category, message, contactSchema, dict.form.errors]
  );

  // Calculate form completion percentage
  const completionPercentage =
    [name, email, category, message].filter(Boolean).length * 25;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20 relative overflow-hidden">
      {/* Decorative background elements matching Hero */}
      <div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-teal-300/20 blur-3xl animate-float-slow pointer-events-none hidden md:block will-change-transform"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[15%] right-[5%] w-64 h-64 rounded-full bg-orange-300/20 blur-3xl animate-float-slow pointer-events-none hidden md:block will-change-transform"
        style={{ animationDelay: '2s' }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[50%] right-[15%] w-48 h-48 rounded-full bg-amber-300/15 blur-3xl animate-float-slow pointer-events-none hidden md:block will-change-transform"
        style={{ animationDelay: '4s' }}
        aria-hidden="true"
      />

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative pt-24 pb-16 px-4 text-center"
        initial={{ opacity: 0 }}
        animate={isHeroInView ? { opacity: 1 } : {}}
      >
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-8 px-6 py-3 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-lg"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-white" />
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600 font-bold text-sm tracking-wide">
              {dict.hero.header}
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-800 my-6 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {dict.hero.title}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient">
              {dict.hero.highlightedTitle}
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-teal-50/40 to-orange-50/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl group-hover:shadow-teal-200/30 transition-all duration-500 pointer-events-none" />
              <div className="relative p-6">
                <p className="text-lg text-gray-600 mb-2">
                  {dict.hero.subtitle}
                </p>
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                  {dict.hero.guarantee}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-24 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card */}
          <motion.div
            ref={formRef}
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={isFormInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="relative group">
              {/* Gradient border effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-br from-teal-400 via-orange-400 to-amber-400 rounded-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 blur-sm" />

              <Card className="relative shadow-2xl rounded-3xl border-0 bg-white/80 backdrop-blur-md overflow-hidden">
                {/* Progress bar */}
                {!success && (
                  <div className="h-1 bg-gray-100">
                    <motion.div
                      className="h-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-extrabold text-gray-800">
                    {dict.form.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500 mt-2">
                    {dict.form.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 md:p-8">
                  {success ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-white to-orange-50 p-8 border border-teal-200/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CheckCircle className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                            {dict.successMessage.title}
                          </h3>
                          <p className="text-gray-600 text-center mb-6">
                            {dict.successMessage.description}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/auth/register">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white rounded-xl shadow-md"
                              >
                                <UserPlus className="w-4 h-4 ml-2" />
                                {dict.successMessage.signUpButton}
                              </Button>
                            </Link>
                            <Link href="/questionnaire">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-teal-200 text-teal-700 hover:bg-teal-50 rounded-xl"
                              >
                                {dict.successMessage.questionnaireButton}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label
                            htmlFor="name"
                            className="text-sm font-semibold text-gray-700 flex items-center gap-1"
                          >
                            {dict.form.nameLabel}
                          </label>
                          <div className="relative group/input">
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={dict.form.namePlaceholder}
                              className="rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                              aria-describedby={
                                validationErrors?.name
                                  ? 'name-error'
                                  : undefined
                              }
                            />
                          </div>
                          {validationErrors?.name && (
                            <p
                              id="name-error"
                              className="text-xs text-red-500 mt-1 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {validationErrors.name[0]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="email"
                            className="text-sm font-semibold text-gray-700"
                          >
                            {dict.form.emailLabel}
                          </label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={dict.form.emailPlaceholder}
                            className="rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                            aria-describedby={
                              validationErrors?.email
                                ? 'email-error'
                                : undefined
                            }
                          />
                          {validationErrors?.email && (
                            <p
                              id="email-error"
                              className="text-xs text-red-500 mt-1 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {validationErrors.email[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">
                          {dict.form.categoryLabel}
                        </label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {dict.form.categories.map((cat) => {
                            const IconComponent =
                              iconsMap[cat.value] || HelpCircle;
                            const isSelected = category === cat.value;
                            return (
                              <motion.label
                                key={cat.value}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                  isSelected
                                    ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-orange-50/50 shadow-lg shadow-teal-500/10'
                                    : 'border-gray-100 bg-white/50 hover:border-teal-200 hover:bg-teal-50/30 hover:shadow-md'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="category"
                                  value={cat.value}
                                  checked={isSelected}
                                  onChange={(e) =>
                                    setCategory(e.target.value)
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-teal-500 to-orange-500 shadow-md'
                                      : 'bg-gray-100'
                                  }`}
                                >
                                  <IconComponent
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                      isSelected
                                        ? 'text-white'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                </div>
                                <span
                                  className={`text-sm font-medium transition-colors duration-300 ${
                                    isSelected
                                      ? 'text-teal-700'
                                      : 'text-gray-600'
                                  }`}
                                >
                                  {cat.label}
                                </span>
                                {isSelected && (
                                  <motion.div
                                    layoutId="category-check"
                                    className="absolute top-2 left-2 w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 300,
                                    }}
                                  >
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  </motion.div>
                                )}
                              </motion.label>
                            );
                          })}
                        </div>
                        {validationErrors?.category && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {validationErrors.category[0]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="message"
                          className="text-sm font-semibold text-gray-700"
                        >
                          {dict.form.messageLabel}
                        </label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={dict.form.messagePlaceholder}
                          rows={6}
                          className="rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 transition-all duration-300 bg-white/70 backdrop-blur-sm resize-none"
                          aria-describedby={
                            validationErrors?.message
                              ? 'message-error'
                              : undefined
                          }
                        />
                        {validationErrors?.message && (
                          <p
                            id="message-error"
                            className="text-xs text-red-500 mt-1 flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {validationErrors.message[0]}
                          </p>
                        )}
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Alert
                            variant="destructive"
                            className="rounded-xl"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button
                          type="submit"
                          className="w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300 relative overflow-hidden group"
                          disabled={isLoading}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          {isLoading ? (
                            <>
                              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                              {dict.form.submitButtonLoading}
                            </>
                          ) : (
                            <>
                              <Send className="ml-2 h-5 w-5" />
                              {dict.form.submitButton}
                            </>
                          )}
                        </Button>
                      </motion.div>

                      <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4 text-teal-400" />
                        {dict.form.privacyCommitment}
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={isSidebarInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Team Card */}
            <Card className="rounded-3xl border-0 shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  {dict.sidebar.team.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                {dict.sidebar.team.members.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isSidebarInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + index * 0.15 }}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gradient-to-br hover:from-teal-50/50 hover:to-orange-50/50 transition-all duration-300 group"
                  >
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-br from-teal-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-sm" />
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                        <Image
                          src={getRelativeCloudinaryPath(
                            teamMembers[index].image
                          )}
                          alt={member.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {member.name}
                      </h4>
                      <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                        {member.role}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {member.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* FAQ Card */}
            <Card className="rounded-3xl border-0 shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  {dict.sidebar.faq.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-6">
                {dict.sidebar.faq.items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isSidebarInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-4 bg-gradient-to-br from-teal-50/50 via-white to-orange-50/50 rounded-2xl border border-gray-100/50 hover:shadow-md transition-all duration-300"
                  >
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">
                      {item.question}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Methods Card */}
            <Card className="rounded-3xl border-0 shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-orange-500" />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]" />
              <CardContent className="relative p-6 text-white">
                <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  {dict.sidebar.otherWays.title}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors duration-300">
                    <Phone className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {dict.sidebar.otherWays.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors duration-300">
                    <Mail className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {dict.sidebar.otherWays.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors duration-300">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {dict.sidebar.otherWays.hours}
                    </span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                  <p className="text-sm leading-relaxed">
                    <Sparkles className="w-4 h-4 inline ml-1" />
                    <strong>
                      {dict.sidebar.otherWays.commitment.title}
                    </strong>{' '}
                    {dict.sidebar.otherWays.commitment.body}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA Card */}
            <Card className="rounded-3xl border-0 shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 via-rose-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  {dict.sidebar.cta.title}
                </h3>
                <p className="text-gray-500 mb-6 mt-2 text-sm">
                  {dict.sidebar.cta.description}
                </p>
                <div className="space-y-3">
                  <Link href="/auth/register">
                    <Button className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white shadow-md py-5">
                      <UserPlus className="w-4 h-4 ml-2" />
                      {dict.sidebar.cta.signUpButton}
                    </Button>
                  </Link>
                  <Link href="/questionnaire">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50 py-5 mt-2"
                    >
                      {dict.sidebar.cta.questionnaireButton}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-10 px-4">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-gray-400 mb-4">{dict.footer.tagline}</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            {dict.footer.copyright.replace(
              '{year}',
              new Date().getFullYear().toString()
            )}
          </p>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(2deg); }
          66% { transform: translateY(10px) rotate(-1deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
}