// src/app/[locale]/legal/accessibility-statement/AccessibilityStatementClient.tsx
'use client';

import React from 'react';
import Head from 'next/head';
import {
  Accessibility,
  CheckCircle,
  Type,
  Contrast,
  Eye,
  Hand,
  Speech,
  MousePointer,
  Sparkles,
} from 'lucide-react';
import { AccessibilityStatementDict } from '@/types/dictionaries/auth';

// Helper component for creating feature list items
const FeatureItem: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <li className="flex items-start gap-4">
    <div className="flex-shrink-0 mt-1 p-2 bg-cyan-100 rounded-full">
      <Icon className="w-5 h-5 text-cyan-700" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </li>
);

interface AccessibilityStatementClientProps {
  dict: AccessibilityStatementDict;
  locale: string;
}

const AccessibilityStatementClient: React.FC<AccessibilityStatementClientProps> = ({ dict, locale }) => {
  const brandName = 'NeshamaTech';
  const companyNameLegal = `ג'ואיש מאצ'פוינט בע"מ`; // This can also be moved to dict if needed
  const lastUpdatedDate = '28 באוגוסט 2025';
  const accessibilityCoordinatorName = 'איתן אנגלרד';
  const accessibilityCoordinatorEmail = 'eytanenglard@gmail.com';

  const pageTitle = dict.pageTitle.replace('{brandName}', brandName);
  const pageDescription = dict.pageDescription.replace('{brandName}', brandName);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
      </Head>
      <div className="bg-gradient-to-br from-cyan-50 via-white to-pink-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl bg-white shadow-xl rounded-2xl p-8 sm:p-12 border border-gray-200/50">
          <header className="mb-10 text-center border-b pb-6 border-gray-200">
            <div className="inline-block p-4 bg-gradient-to-r from-cyan-100 to-pink-100 rounded-2xl mb-4">
              <Accessibility className="w-10 h-10 text-cyan-700" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              {dict.mainTitle}
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              {dict.siteName.replace('{brandName}', brandName)}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {dict.lastUpdated.replace('{lastUpdatedDate}', lastUpdatedDate)}
            </p>
          </header>

          <article
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
          >
            <h2 id="commitment">{dict.commitment.title}</h2>
            <p dangerouslySetInnerHTML={{ __html: dict.commitment.p1.replace('{companyNameLegal}', companyNameLegal).replace('{brandName}', brandName) }} />
            <p>{dict.commitment.p2}</p>
            
            <h2 id="level">{dict.level.title}</h2>
            <ul>
                <li dangerouslySetInnerHTML={{ __html: dict.level.item1 }} />
                <li dangerouslySetInnerHTML={{ __html: dict.level.item2 }} />
            </ul>

            <h2 id="features">{dict.features.title}</h2>
            <p>{dict.features.p1}</p>

            <h3 className="flex items-center gap-3">
              <Sparkles className="text-blue-600" />
              {dict.features.dedicatedToolbarTitle}
            </h3>
            <p>{dict.features.p2}</p>
            <ul className="space-y-4 not-prose list-none p-0">
                <FeatureItem icon={Type} title={dict.features.fontAdjustment.title} description={dict.features.fontAdjustment.description} />
                <FeatureItem icon={Contrast} title={dict.features.contrastModes.title} description={dict.features.contrastModes.description} />
                <FeatureItem icon={Eye} title={dict.features.readableFont.title} description={dict.features.readableFont.description} />
                <FeatureItem icon={MousePointer} title={dict.features.largeCursor.title} description={dict.features.largeCursor.description} />
                <FeatureItem icon={Speech} title={dict.features.textToSpeech.title} description={dict.features.textToSpeech.description} />
                <FeatureItem icon={Hand} title={dict.features.reduceMotion.title} description={dict.features.reduceMotion.description} />
            </ul>
            
            <h3 className="flex items-center gap-3 mt-8">
              <CheckCircle className="text-emerald-600" />
              {dict.features.additionalAdjustmentsTitle}
            </h3>
            <ul>
              <li dangerouslySetInnerHTML={{ __html: dict.features.keyboardNav }} />
              <li dangerouslySetInnerHTML={{ __html: dict.features.screenReader }} />
              <li dangerouslySetInnerHTML={{ __html: dict.features.altText }} />
              <li dangerouslySetInnerHTML={{ __html: dict.features.accessibleForms }} />
              <li dangerouslySetInnerHTML={{ __html: dict.features.noFlashing }} />
            </ul>

            <h2 id="limitations">{dict.limitations.title}</h2>
            <p>{dict.limitations.p1}</p>
            <p>{dict.limitations.p2}</p>

            <h2 id="contact">{dict.contact.title}</h2>
            <p>{dict.contact.p1}</p>
            <ul>
                <li dangerouslySetInnerHTML={{ __html: dict.contact.name.replace('{accessibilityCoordinatorName}', accessibilityCoordinatorName) }} />
                <li>{dict.contact.email} <a href={`mailto:${accessibilityCoordinatorEmail}`} className="text-cyan-600 hover:text-cyan-700">{accessibilityCoordinatorEmail}</a></li>
            </ul>
            <p>{dict.contact.p2}</p>
            <p dangerouslySetInnerHTML={{ __html: dict.contact.p3.replace('{lastUpdatedDate}', lastUpdatedDate) }} />
          </article>
        </div>
      </div>
    </>
  );
};

export default AccessibilityStatementClient;
