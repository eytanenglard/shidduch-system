// src/app/[locale]/legal/privacy-policy/PrivacyPolicyClient.tsx
'use client';

import React from 'react';
import Head from 'next/head';
import { PrivacyPolicyDict } from '@/types/dictionaries/auth';

interface PrivacyPolicyClientProps {
  dict: PrivacyPolicyDict;
  locale: string;
}

const PrivacyPolicyClient: React.FC<PrivacyPolicyClientProps> = ({
  dict,
  locale,
}) => {
  const brandName = `נשמה טק (NeshamaTech)`;
  const companyNameLegal = `ג'ואיש מאצ'פוינט בע"מ`;
  const companyNumber = '517172631';
  const lastUpdatedDate = '11 באוגוסט 2025';
  const companyEmail = 'neshamatech.jsmatch@gmail.com';
  const siteUrl = 'https://www.jewishmatchpoint.com';
  const companyRegisteredAddress = 'גולומב 7, רעננה, ישראל';

  const pageTitle = dict.pageTitle.replace('{brandName}', brandName);
  const pageDescription = dict.pageDescription.replace(
    '{brandName}',
    brandName
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/legal/privacy-policy`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="bg-gradient-to-br from-cyan-50 via-white to-pink-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl bg-white shadow-xl rounded-lg p-8 sm:p-12">
          <header className="mb-10 text-center border-b pb-6 border-gray-200">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
              {dict.mainTitle}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {dict.lastUpdated.replace('{lastUpdatedDate}', lastUpdatedDate)}
            </p>
          </header>

          <article
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
          >
            <p>
              <strong>{dict.introduction.title}</strong>
            </p>
            <p>
              {dict.introduction.p1
                .replace('{companyNameLegal}', companyNameLegal)
                .replace('{companyNumber}', companyNumber)}
            </p>
            <p>{dict.introduction.p2}</p>
            <p>{dict.introduction.p3}</p>

            <h2 id="consent">{dict.consent.title}</h2>
            <p>{dict.consent.p1}</p>
            <p>{dict.consent.p2}</p>
            <p>
              {dict.consent.p3
                .replace('{companyNameLegal}', companyNameLegal)
                .replace('{companyNumber}', companyNumber)
                .replace(
                  '{companyRegisteredAddress}',
                  companyRegisteredAddress
                )}
            </p>
            <p dangerouslySetInnerHTML={{ __html: dict.consent.p4 }} />

            <h2 id="collected-info">{dict.collectedInfo.title}</h2>
            <p>{dict.collectedInfo.p1}</p>
            <p>
              <strong>{dict.collectedInfo.subTitle1}</strong>
            </p>
            <ul>
              <li>{dict.collectedInfo.list1.item1}</li>
              <li>
                {dict.collectedInfo.list1.item2.title}
                <ul>
                  <li>{dict.collectedInfo.list1.item2.subItem1}</li>
                  <li>{dict.collectedInfo.list1.item2.subItem2}</li>
                  <li>{dict.collectedInfo.list1.item2.subItem3}</li>
                </ul>
              </li>
              <li>{dict.collectedInfo.list1.item3}</li>
              <li>{dict.collectedInfo.list1.item4}</li>
              <li>{dict.collectedInfo.list1.item5}</li>
              <li>{dict.collectedInfo.list1.item6}</li>
            </ul>

            <p>
              <strong>{dict.collectedInfo.subTitle2}</strong>
            </p>
            <p>{dict.collectedInfo.p2}</p>

            <p>
              <strong>{dict.collectedInfo.subTitle3}</strong>
            </p>
            <p>
              <strong>{dict.collectedInfo.p3_1}</strong>
            </p>
            <p>{dict.collectedInfo.p3_2}</p>
            <p>{dict.collectedInfo.p3_3}</p>
            <p>{dict.collectedInfo.p3_4}</p>
            <p dangerouslySetInnerHTML={{ __html: dict.collectedInfo.p3_5 }} />
            <p dangerouslySetInnerHTML={{ __html: dict.collectedInfo.p3_6 }} />
            <p>{dict.collectedInfo.p3_7}</p>

            <p>
              <strong>{dict.collectedInfo.subTitle4}</strong>
            </p>
            <ul>
              <li>{dict.collectedInfo.list2.item1}</li>
              <li>{dict.collectedInfo.list2.item2}</li>
            </ul>

            <h2 id="how-we-use">{dict.howWeUse.title}</h2>
            <p>{dict.howWeUse.p1}</p>
            <ul>
              {Object.values(dict.howWeUse.list).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2 id="sharing-info">{dict.sharingInfo.title}</h2>
            <p>{dict.sharingInfo.p1}</p>
            <ul>
              {Object.values(dict.sharingInfo.list).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2 id="security">{dict.security.title}</h2>
            <p>{dict.security.p1}</p>

            <h2 id="retention">{dict.retention.title}</h2>
            <p>{dict.retention.p1}</p>

            <h2 id="your-rights">{dict.yourRights.title}</h2>
            <p>{dict.yourRights.p1}</p>

            <h2 id="cross-border">{dict.crossBorder.title}</h2>
            <p>{dict.crossBorder.p1}</p>

            <h2 id="minors">{dict.minors.title}</h2>
            <p>{dict.minors.p1}</p>

            <h2 id="changes">{dict.changes.title}</h2>
            <p>{dict.changes.p1}</p>

            <h2 id="contact">{dict.contact.title}</h2>
            <p>{dict.contact.p1}</p>
            <p
              dangerouslySetInnerHTML={{
                __html: dict.contact.companyName
                  .replace('{companyNameLegal}', companyNameLegal)
                  .replace('{companyNumber}', companyNumber),
              }}
            />
            <p>
              {dict.contact.email}{' '}
              <a
                href={`mailto:${companyEmail}`}
                className="text-cyan-600 hover:text-cyan-700"
              >
                {companyEmail}
              </a>
            </p>
            <p
              dangerouslySetInnerHTML={{
                __html: dict.contact.address.replace(
                  '{companyRegisteredAddress}',
                  companyRegisteredAddress
                ),
              }}
            />
          </article>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyClient;
