// src/app/[locale]/contact/ContactClient.tsx
'use client';
import React, { useState, useRef } from 'react';
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
  Home,
  UserPlus,
  HelpCircle,
  Lightbulb,
  Target,
} from 'lucide-react';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { getRelativeCloudinaryPath } from '@/lib/utils';
// --- START: FIX 2 ---
// Import the type from the main dictionary file
import type { ContactPageDict } from '@/types/dictionary';
// --- END: FIX 2 ---

// Map string keys from the dictionary to actual Icon components
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
  // --- START: FIX 1 ---
  // Define the teamMembers constant inside the component that uses it
  const teamMembers = [
    {
      name: dict.sidebar.team.members[0].name,
      image:
        'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg',
    },
    {
      name: dict.sidebar.team.members[1].name,
      image:
        'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg',
    },
  ];
  // --- END: FIX 1 ---

  const router = useRouter();
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
  const isHeroInView = useInView(heroRef, { once: true });
  const isFormInView = useInView(formRef, { once: true });

  const contactSchema = z.object({
    name: z.string().min(2, { message: dict.form.errors.nameMin }),
    email: z.string().email({ message: dict.form.errors.emailInvalid }),
    category: z.string().min(1, { message: dict.form.errors.categoryRequired }),
    message: z.string().min(10, { message: dict.form.errors.messageMin }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : dict.form.errors.unexpectedError
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      <div className="fixed top-4 left-4 rtl:right-4 rtl:left-auto z-50">
        <Button onClick={() => router.push('/')} variant="outline" size="sm">
          <Home className="h-4 w-4 ml-2" />
          {dict.backToHome}
        </Button>
      </div>

      <motion.section
        ref={heroRef}
        className="relative pt-20 pb-12 px-4 text-center"
        initial={{ opacity: 0 }}
        animate={isHeroInView ? { opacity: 1 } : {}}
      >
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <HeartHandshake className="w-6 h-6 text-cyan-500" />
            <span className="text-cyan-700 font-semibold">
              {dict.hero.header}
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-6xl font-bold text-gray-800 my-6"
            initial={{ opacity: 0, y: 50 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {dict.hero.title}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              {dict.hero.highlightedTitle}
            </span>
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {dict.hero.subtitle}
            <br />
            <span className="font-semibold text-cyan-700">
              {dict.hero.guarantee}
            </span>
          </motion.p>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto px-4 pb-20 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            ref={formRef}
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={isFormInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <Card className="shadow-2xl">
              <CardHeader className="text-center">
                <Mail className="w-8 h-8 mx-auto mb-4 text-cyan-600" />
                <CardTitle>{dict.form.title}</CardTitle>
                <CardDescription>{dict.form.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Alert className="bg-green-50">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle>{dict.successMessage.title}</AlertTitle>
                      <AlertDescription>
                        {dict.successMessage.description}
                        <div className="mt-4 flex gap-3">
                          <Link href="/auth/register">
                            <Button size="sm">
                              <UserPlus className="w-4 h-4 ml-2" />
                              {dict.successMessage.signUpButton}
                            </Button>
                          </Link>
                          <Link href="/questionnaire">
                            <Button variant="outline" size="sm">
                              {dict.successMessage.questionnaireButton}
                            </Button>
                          </Link>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name">{dict.form.nameLabel}</label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={dict.form.namePlaceholder}
                        />
                        {validationErrors?.name && (
                          <p className="text-xs text-red-600 mt-1">
                            {validationErrors.name[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email">{dict.form.emailLabel}</label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={dict.form.emailPlaceholder}
                        />
                        {validationErrors?.email && (
                          <p className="text-xs text-red-600 mt-1">
                            {validationErrors.email[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label>{dict.form.categoryLabel}</label>
                      <div className="grid md:grid-cols-2 gap-3 mt-2">
                        {dict.form.categories.map((cat) => {
                          const IconComponent =
                            iconsMap[cat.value] || HelpCircle;
                          return (
                            <label
                              key={cat.value}
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${category === cat.value ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'}`}
                            >
                              <input
                                type="radio"
                                name="category"
                                value={cat.value}
                                checked={category === cat.value}
                                onChange={(e) => setCategory(e.target.value)}
                                className="sr-only"
                              />
                              <IconComponent
                                className={`w-5 h-5 ${category === cat.value ? 'text-cyan-600' : 'text-gray-400'}`}
                              />
                              <span>{cat.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      {validationErrors?.category && (
                        <p className="text-xs text-red-600 mt-1">
                          {validationErrors.category[0]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="message">{dict.form.messageLabel}</label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={dict.form.messagePlaceholder}
                        rows={6}
                      />
                      {validationErrors?.message && (
                        <p className="text-xs text-red-600 mt-1">
                          {validationErrors.message[0]}
                        </p>
                      )}
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
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
                    <div className="text-center text-sm text-gray-500">
                      <Shield className="w-4 h-4 inline ml-2" />
                      {dict.form.privacyCommitment}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={isFormInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-cyan-500" />
                  {dict.sidebar.team.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dict.sidebar.team.members.map((member, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Image
                      src={getRelativeCloudinaryPath(teamMembers[index].image)}
                      alt={member.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold">{member.name}</h4>
                      <p className="text-sm text-cyan-600">{member.role}</p>
                      <p className="text-xs text-gray-500">
                        {member.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-orange-500" />
                  {dict.sidebar.faq.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dict.sidebar.faq.items.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold">{item.question}</h4>
                    <p className="text-sm">{item.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-600 to-pink-600 text-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Phone className="w-6 h-6" />
                  {dict.sidebar.otherWays.title}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span>{dict.sidebar.otherWays.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" />
                    <span>{dict.sidebar.otherWays.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span>{dict.sidebar.otherWays.hours}</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/20 rounded-xl">
                  <p className="text-sm">
                    <strong>{dict.sidebar.otherWays.commitment.title}</strong>{' '}
                    {dict.sidebar.otherWays.commitment.body}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                <h3 className="text-xl font-bold">{dict.sidebar.cta.title}</h3>
                <p className="text-gray-600 mb-6">
                  {dict.sidebar.cta.description}
                </p>
                <div className="space-y-3">
                  <Link href="/auth/register">
                    <Button className="w-full">
                      <UserPlus className="w-4 h-4 ml-2" />
                      {dict.sidebar.cta.signUpButton}
                    </Button>
                  </Link>
                  <Link href="/questionnaire">
                    <Button variant="outline" className="w-full">
                      {dict.sidebar.cta.questionnaireButton}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo is hardcoded, can be moved to a shared component if needed */}
          <p className="text-gray-400 mb-4">{dict.footer.tagline}</p>
          <p className="text-sm text-gray-500">
            {dict.footer.copyright.replace(
              '{year}',
              new Date().getFullYear().toString()
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
