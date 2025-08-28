// src/app/[locale]/legal/terms-of-service/TermsOfServiceClient.tsx
'use client';

import React from 'react';
import Head from 'next/head';
import { TermsOfServiceDict } from '@/types/dictionaries/auth';

interface TermsOfServiceClientProps {
  dict: TermsOfServiceDict;
  locale: string;
}

const TermsOfServiceClient: React.FC<TermsOfServiceClientProps> = ({ dict, locale }) => {
    const brandName = 'NeshamaTech';
    const companyNameLegal = `ג'ואיש מאצ'פוינט בע"מ`;
    const companyNumber = '517172631';
    const lastUpdatedDate = '11 באוגוסט 2025';
    const supportEmail = 'jewish.matchpoint@gmail.com';
    const siteUrl = 'https://www.jewishmatchpoint.com';
    const privacyPolicyUrl = '/legal/privacy-policy';
    const jurisdictionDistrict = 'תל-אביב-יפו';
    
    const pageTitle = dict.pageTitle.replace('{brandName}', brandName);
    const pageDescription = dict.pageDescription.replace('{brandName}', brandName);

    return (
        <>
        <Head>
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:url" content={`${siteUrl}/legal/terms-of-service`} />
            <meta name="twitter:card" content="summary_large_image" />
        </Head>
        <div className="bg-gradient-to-br from-cyan-50 via-white to-pink-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-4xl bg-white shadow-xl rounded-lg p-8 sm:p-12">
            <header className="mb-10 text-center border-b pb-6 border-gray-200">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
                {dict.mainTitle}
                </h1>
                <p className="mt-3 text-lg text-gray-600">
                {dict.subTitle.replace('{brandName}', brandName).replace('{companyNameLegal}', companyNameLegal)}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                {dict.lastUpdated.replace('{lastUpdatedDate}', lastUpdatedDate)}
                </p>
            </header>

            <article
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                dir={locale === 'he' ? 'rtl' : 'ltr'}
            >
                <h2 id="intro">{dict.introduction.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: dict.introduction.p1_1.replace('{companyNameLegal}', companyNameLegal).replace('{companyNumber}', companyNumber) }} />
                <p dangerouslySetInnerHTML={{ __html: dict.introduction.p1_2.replace('{privacyPolicyUrl}', privacyPolicyUrl) }} />
                <p dangerouslySetInnerHTML={{ __html: dict.introduction.p1_3 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.introduction.p1_4 }} />
                <ul>
                    <li dangerouslySetInnerHTML={{ __html: dict.introduction.list.itemA }} />
                    <li dangerouslySetInnerHTML={{ __html: dict.introduction.list.itemB }} />
                    <li dangerouslySetInnerHTML={{ __html: dict.introduction.list.itemC }} />
                </ul>
                <p dangerouslySetInnerHTML={{ __html: dict.introduction.p1_5 }} />
                
                <h2 id="user-account">{dict.userAccount.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: dict.userAccount.p2_1 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.userAccount.p2_2 }} />
                <ul>
                    {Object.values(dict.userAccount.list).map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                </ul>
                <p dangerouslySetInnerHTML={{ __html: dict.userAccount.p2_3 }} />

                <h2 id="service-fees">{dict.serviceFees.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: dict.serviceFees.p3_1 }} />
                <ul>
                    <li dangerouslySetInnerHTML={{ __html: dict.serviceFees.list.itemA }} />
                    <li dangerouslySetInnerHTML={{ __html: dict.serviceFees.list.itemB }} />
                    <li dangerouslySetInnerHTML={{ __html: dict.serviceFees.list.itemC }} />
                </ul>
                <p dangerouslySetInnerHTML={{ __html: dict.serviceFees.p3_2 }} />
                <p>{dict.serviceFees.p3_3}</p>
                <p dangerouslySetInnerHTML={{ __html: dict.serviceFees.p3_4 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.serviceFees.p3_5 }} />

                <h2 id="intellectual-property">{dict.intellectualProperty.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: dict.intellectualProperty.p4_1 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.intellectualProperty.p4_2 }} />
                
                <h2 id="third-party-links">{dict.thirdPartyLinks.title}</h2>
                <p>{dict.thirdPartyLinks.p1}</p>
                
                <h2 id="limitation-of-liability">{dict.limitationOfLiability.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: dict.limitationOfLiability.p6_1 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.limitationOfLiability.p6_2 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.limitationOfLiability.p6_3 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.limitationOfLiability.p6_4 }} />
                
                <h2 id="indemnification">{dict.indemnification.title}</h2>
                <p>{dict.indemnification.p1}</p>

                <h2 id="termination-law">{dict.terminationLaw.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: dict.terminationLaw.p8_1 }} />
                <p dangerouslySetInnerHTML={{ __html: dict.terminationLaw.p8_2.replace('{jurisdictionDistrict}', jurisdictionDistrict) }} />
                <p dangerouslySetInnerHTML={{ __html: dict.terminationLaw.p8_3 }} />

                <h2 id="contact">{dict.contact.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: dict.contact.p9_1 }} />
                <p>
                    <a href={`mailto:${supportEmail}`} className="text-cyan-600 hover:text-cyan-700">{supportEmail}</a>
                </p>
                <p dangerouslySetInnerHTML={{ __html: dict.contact.p9_2 }} />
            </article>
            </div>
        </div>
        </>
    );
};

export default TermsOfServiceClient;