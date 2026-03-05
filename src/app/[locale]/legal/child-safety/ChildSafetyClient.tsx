// src/app/[locale]/legal/child-safety/ChildSafetyClient.tsx
'use client';

import React from 'react';
import Head from 'next/head';
import {
  Shield,
  AlertTriangle,
  Users,
  Lock,
  Eye,
  MessageSquareWarning,
  Scale,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ChildSafetyDict } from '@/types/dictionaries/auth';

interface ChildSafetyClientProps {
  dict: ChildSafetyDict;
  locale: string;
}

const ChildSafetyClient: React.FC<ChildSafetyClientProps> = ({
  dict,
  locale,
}) => {
  const brandName = 'NeshamaTech';
  const companyNameLegal = `ג'ואיש מאצ'פוינט בע"מ`;
  const companyNumber = '517172631';
  const lastUpdatedDate = '25 בפברואר 2026';
  const safetyEmail = 'safety@neshamatech.com';
  const supportEmail = 'neshamatech.jsmatch@gmail.com';
  const siteUrl = 'https://www.jewishmatchpoint.com';

  const pageTitle = dict.pageTitle.replace('{brandName}', brandName);
  const pageDescription = dict.pageDescription.replace('{brandName}', brandName);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/legal/child-safety`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="bg-gradient-to-br from-cyan-50 via-white to-pink-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl bg-white shadow-xl rounded-2xl p-8 sm:p-12 border border-gray-200/50">
          <header className="mb-10 text-center border-b pb-6 border-gray-200">
            <div className="inline-block p-4 bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl mb-4">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              {dict.mainTitle}
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              {dict.siteName.replace('{brandName}', brandName)}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {dict.lastUpdated.replace('{lastUpdatedDate}', lastUpdatedDate)}
            </p>
          </header>

          {/* Emergency Banner */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700 font-semibold">
                {dict.emergencyBanner}
              </p>
            </div>
          </div>

          <article
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
          >
            {/* Section 1: Our Commitment */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <Shield className="w-6 h-6 text-red-600" />
                {dict.commitment.title}
              </h2>
              <p
                dangerouslySetInnerHTML={{
                  __html: dict.commitment.p1
                    .replace('{companyNameLegal}', companyNameLegal)
                    .replace('{brandName}', brandName),
                }}
              />
              <p>{dict.commitment.p2}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="font-semibold text-gray-800 mb-2">{dict.commitment.definitionsTitle}</p>
                <ul className="space-y-2">
                  <li><strong>CSAE</strong> - {dict.commitment.csaeDefinition}</li>
                  <li><strong>CSAM</strong> - {dict.commitment.csamDefinition}</li>
                </ul>
              </div>
            </section>

            {/* Section 2: Zero Tolerance Policy */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <XCircle className="w-6 h-6 text-red-600" />
                {dict.zeroTolerance.title}
              </h2>
              <p>{dict.zeroTolerance.p1}</p>
              <ul className="space-y-2">
                {Object.values(dict.zeroTolerance.prohibitedList).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold text-red-700 mt-4">{dict.zeroTolerance.consequence}</p>
            </section>

            {/* Section 3: Age Restrictions */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <Users className="w-6 h-6 text-blue-600" />
                {dict.ageRestrictions.title}
              </h2>
              <p>{dict.ageRestrictions.p1}</p>
              <ul>
                {Object.values(dict.ageRestrictions.measures).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>{dict.ageRestrictions.p2}</p>
            </section>

            {/* Section 4: Detection & Prevention */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <Eye className="w-6 h-6 text-purple-600" />
                {dict.detection.title}
              </h2>
              <p>{dict.detection.p1}</p>
              <ul>
                {Object.values(dict.detection.methods).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Section 5: Reporting Mechanisms */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <MessageSquareWarning className="w-6 h-6 text-orange-600" />
                {dict.reporting.title}
              </h2>
              <p>{dict.reporting.p1}</p>
              
              <div className="bg-orange-50 p-4 rounded-lg mt-4">
                <p className="font-semibold mb-2">{dict.reporting.howToReportTitle}</p>
                <ul>
                  {Object.values(dict.reporting.methods).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <p className="mt-4">{dict.reporting.anonymity}</p>
              <p>{dict.reporting.noRetaliation}</p>
            </section>

            {/* Section 6: Response Procedures */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <CheckCircle className="w-6 h-6 text-green-600" />
                {dict.response.title}
              </h2>
              <p>{dict.response.p1}</p>
              <ol className="list-decimal list-inside space-y-2">
                {Object.values(dict.response.steps).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </section>

            {/* Section 7: Cooperation with Authorities */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <Scale className="w-6 h-6 text-indigo-600" />
                {dict.authorities.title}
              </h2>
              <p>{dict.authorities.p1}</p>
              <ul>
                {Object.values(dict.authorities.organizations).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>{dict.authorities.p2}</p>
            </section>

            {/* Section 8: Data Protection */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <Lock className="w-6 h-6 text-cyan-600" />
                {dict.dataProtection.title}
              </h2>
              <p>{dict.dataProtection.p1}</p>
              <ul>
                {Object.values(dict.dataProtection.measures).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Section 9: Training & Education */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                {dict.training.title}
              </h2>
              <p>{dict.training.p1}</p>
              <ul>
                {Object.values(dict.training.topics).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Section 10: Contact Information */}
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                <Phone className="w-6 h-6 text-green-600" />
                {dict.contact.title}
              </h2>
              <p>{dict.contact.p1}</p>
              
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <p className="mb-2">
                  <strong>{dict.contact.safetyTeamLabel}</strong>
                </p>
                <p>
                  {dict.contact.emailLabel}{' '}
                  <a
                    href={`mailto:${safetyEmail}`}
                    className="text-cyan-600 hover:text-cyan-700 font-semibold"
                  >
                    {safetyEmail}
                  </a>
                </p>
                <p className="mt-4">
                  <strong>{dict.contact.generalSupportLabel}</strong>
                </p>
                <p>
                  {dict.contact.emailLabel}{' '}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-cyan-600 hover:text-cyan-700"
                  >
                    {supportEmail}
                  </a>
                </p>
              </div>
              
              <p className="mt-4 text-sm text-gray-500">
                {dict.contact.responseTime}
              </p>
            </section>

            {/* Section 11: Policy Updates */}
            <section className="mb-6">
              <h2>{dict.updates.title}</h2>
              <p>{dict.updates.p1}</p>
              <p
                dangerouslySetInnerHTML={{
                  __html: dict.updates.p2.replace('{lastUpdatedDate}', lastUpdatedDate),
                }}
              />
            </section>
          </article>

          {/* Footer Commitment */}
          <footer className="mt-10 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 font-medium">
              {dict.footerCommitment.replace('{brandName}', brandName)}
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ChildSafetyClient;