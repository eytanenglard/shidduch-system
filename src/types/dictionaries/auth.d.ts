// src/types/dictionaries/auth.d.ts

export type SignInDict = {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPasswordLink: string;
  submitButton: string;
  submitButtonLoading: string;
  orDivider: string;
  googleButton: string;
  googleButtonLoading: string;
  noAccountPrompt: string;
  signUpLink: string;
  loader: {
    authenticated: string;
    success: string;
    loading: string;
    redirecting: string;
    checking: string;
  };
  errors: {
    credentialsSignin: string;
    oauthAccountNotLinked: string;
    default: string;
    missingFields: string;
  };
};

export type ForgotPasswordDict = {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitButton: string;
  submitButtonLoading: string;
  backToSignInLink: string;
  errors: {
    title: string;
    missingEmail: string;
    default: string;
  };
};

export type ResetPasswordDict = {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  otpLabel: string;
  otpPlaceholder: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  showPasswordAria: string;
  hidePasswordAria: string;
  passwordHint: string;
  submitButton: string;
  submitButtonLoading: string;
  backToSignInLink: string;
  successMessage: string;
  successRedirect: string;
  errors: {
    missingEmail: string;
    invalidOtp: string;
    passwordsMismatch: string;
    default: string;
  };
  passwordValidation: {
    length: string;
  };
};

export type VerifyEmailDict = {
  title: string;
  pendingMessage: string;
  verifyingMessage: string;
  successMessage: string;
  successRedirect: string;
  errorMessage: string;
  resendButton: string;
  resendButtonLoading: string;
  backToSignInButton: string;
  emailSentTo: string;
  emailAddressNotSpecified: string;
  checkYourInbox: string;
  errors: {
    title: string;
    noEmail: string;
    linkInvalid: string;
    sessionMismatch: string;
    tokenUsed: string;
    tokenExpired: string;
    default: string;
    resendFailed: string;
  };
  alerts: {
    resendSuccess: string;
  };
};

export type SetupAccountDict = {
  title: string;
  description: string;
  newPasswordLabel: string;
  passwordHint: string;
  confirmPasswordLabel: string;
  submitButton: string;
  submitButtonLoading: string;
  success: {
    title: string;
    description: string;
    redirecting: string;
  };
  errors: {
    linkInvalid: string;
    passwordLength: string;
    passwordsMismatch: string;
    default: string;
    unexpected: string;
  };
};

export type UpdatePhoneDict = {
  title: string;
  description: string;
  newPhoneLabel: string;
  newPhonePlaceholder: string;
  submitButton: string;
  submitButtonLoading: string;
  backToVerificationLink: string;
  loaderText: string;
  errors: {
    title: string;
    invalidFormat: string;
    updateFailed: string;
    unexpected: string;
  };
};

export type VerifyPhoneDict = {
  title: string;
  description: string;
  yourPhoneNumber: string;
  codeSentTo: string;
  enterCodePrompt: string;
  digitAriaLabel: string;
  verifyButton: string;
  verifyingButton: string;
  resend: {
    prompt: string;
    button: string;
    buttonLoading: string;
    timer: string;
  };
  wrongNumberLink: string;
  backToSignInLink: string;
  errors: {
    title: string;
    incompleteCode: string;
    default: string;
    unexpected: string;
  };
  success: {
    title: string;
    verifying: string;
    updatingProfile: string;
  };
  info: {
    title: string;
    resent: string;
  };
};

export type AuthErrorDict = {
  title: string;
  backButton: string;
  errors: {
    CredentialsSignin: string;
    OAuthAccountNotLinked: string;
    Default: string;
  };
};

// טיפוס להצעת Google
export type GoogleSuggestionDict = {
  title: string;
  description: string;
  buttonText: string;
  buttonLoading: string;
};

// טיפוס לתמונות - מעודכן עם fieldName ו-required
export type PhotosDict = {
  title: string;
  subtitle: string;
  addPhoto: string;
  mainPhoto: string;
  setAsMain: string;
  remove: string;
  maxPhotosError: string;
  invalidTypeError: string;
  fileTooLargeError: string;
  uploadSuccess: string;
  uploadingPhotos: string;
  tip: string;
  tipText: string;
  fieldName: string; // שם השדה לוולידציה
  required: string; // הודעת שגיאה כשחסר
};

// טיפוס לסיפור שלי - מעודכן עם fieldName ו-required
export type AboutMeDict = {
  title: string;
  subtitle: string;
  label: string;
  placeholder: string;
  tooltip: string;
  minChars: string;
  promptsTitle: string;
  prompt1: string;
  prompt2: string;
  prompt3: string;
  prompt4: string;
  fieldName: string; // שם השדה לוולידציה
  required: string; // הודעת שגיאה כשחסר
};

export type RegisterStepsDict = {
  progressBar: {
    stepLabel: string;
  };
  headers: {
    registerTitle: string;
    verifyEmailTitle: string;
    completeProfileTitle: string;
    welcomeDescription: string;
    accountCreationDescription: string;
    verifyEmailDescription: string;
    personalDetailsDescription: string;
    personalDetailsConsentedDescription: string;
    optionalInfoDescription: string;
    completionPhoneVerificationDescription: string;
    completionReadyDescription: string;
    loadingProfileDescription: string;
  };

  incompleteProfileAlert: {
    title: string;
    description: string;
    verifyPhoneDescription: string;
  };
  contactSupport: string;
  contactSupportLink: string;

  steps: {
    welcome: {
      title: string;
      subtitle: string;
      googleButton: string;
      emailButton: string;
      signInPrompt: string;
      signInLink: string;
    };
    basicInfo: {
      title: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      passwordHint: string;
      firstNameLabel: string;
      firstNamePlaceholder: string;
      lastNameLabel: string;
      lastNamePlaceholder: string;
      languageLabel: string;
      backButton: string;
      nextButton: string;
      nextButtonLoading: string;
      termsDisclaimer: string;
      googleSuggestion?: GoogleSuggestionDict;
      errors: {
        title: string;
        invalidEmail: string;
        invalidPassword: string;
        requiredEmail: string;
        requiredPassword: string;
        fillFields: string;
        fixErrors: string;
        default: string;
      };
      status: {
        creatingAccount: string;
        sendingCode: string;
      };
    };

    emailVerification: {
      title: string;
      subtitle: string;
      yourEmail: string;
      submitButton: string;
      submitButtonLoading: string;
      resendPrompt: string;
      resendButton: string;
      resendButtonLoading: string;
      backButton: string;
      errors: {
        title: string;
        incompleteCode: string;
        default: string;
        autoSignInFailed: string;
      };
      alerts: {
        title: string;
        resent: string;
      };
    };

    personalDetails: {
      title: string;
      subtitle: string;
      firstNameLabel: string;
      firstNamePlaceholder: string;
      lastNameLabel: string;
      lastNamePlaceholder: string;
      languageLabel: string;
      languagePlaceholder: string;

      phoneLabel: string;
      phonePlaceholder: string;
      genderLabel: string;
      male: string;
      female: string;
      birthDateLabel: string;
      maritalStatusLabel: string;
      maritalStatusPlaceholder: string;
      maritalStatuses: {
        single: string;
        divorced: string;
        widowed: string;
      };
      religiousLevelLabel: string;
      religiousLevelPlaceholder: string;
      religiousLevels: { [key: string]: string };

      engagementConsentLabel: string;
      promotionalConsentLabel: string;
      backButton: string;
      nextButton: string;
      nextButtonLoading: string;

      // תמונות וסיפור - שדות חדשים
      photos?: PhotosDict;
      aboutMe?: AboutMeDict;

      errors: {
        firstNameRequired: string;
        lastNameRequired: string;
        phoneRequired: string;
        phoneInvalid: string;
        birthDateRequired: string;
        ageTooLow: string;
        ageTooHigh: string;
        genderRequired: string;
        maritalStatusRequired: string;
        consentRequired: string;
        engagementConsentRequired: string;
        religiousLevelRequired: string;
        consentApiError: string;
      };
    };

    optionalInfo: {
      title: string;
      subtitle: string;
      heightLabel: string;
      heightPlaceholder: string;
      occupationLabel: string;
      occupationPlaceholder: string;
      educationLabel: string;
      educationPlaceholder: string;
      backButton: string;
      nextButton: string;
      status: {
        saving: string;
        updating: string;
        sendingCode: string;
      };
      loadingOverlay?: LoadingOverlayDict;
      errors: {
        title: string;
        missingData: string;
        default: string;
      };
    };

    complete: {
      loading: string;
      verifyEmailTitle: string;
      verifyEmailSubtitle: string;
      verifyEmailPrompt: string;
      completeProfileTitle: string;
      completeProfileSubtitle: string;
      completeProfileButton: string;
      verifyPhoneTitle: string;
      verifyPhoneSubtitle: string;
      verifyPhoneButton: string;
      allDoneTitle: string;
      allDoneSubtitle: string;
      myProfileButton: string;
      questionnaireButton: string;
      backToHomeLink: string;
    };
  };

  consentCheckbox: {
    text: string;
    termsLink: string;
    privacyLink: string;
  };

  validationErrors: {
    title: string;
    pleaseFill: string;
    fields: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      gender: string;
      birthDate: string;
      maritalStatus: string;
      religiousLevel: string;
      terms: string;
      engagement: string;
       photos: string;
      aboutMe: string;
    };
  };
};

// Main Auth Dictionary Type
export type AuthDictionary = {
  signIn: SignInDict;
  forgotPassword: ForgotPasswordDict;
  resetPassword: ResetPasswordDict;
  verifyEmail: VerifyEmailDict;
  setupAccount: SetupAccountDict;
  updatePhone: UpdatePhoneDict;
  verifyPhone: VerifyPhoneDict;
  errorPage: AuthErrorDict;
  register: RegisterStepsDict;
  unsubscribePage: UnsubscribePageDict;
  legal: LegalDictionary;
};

export type AccessibilityStatementDict = {
  pageTitle: string;
  pageDescription: string;
  mainTitle: string;
  siteName: string;
  lastUpdated: string;
  commitment: {
    title: string;
    p1: string;
    p2: string;
  };
  level: {
    title: string;
    item1: string;
    item2: string;
  };
  features: {
    title: string;
    p1: string;
    dedicatedToolbarTitle: string;
    p2: string;
    fontAdjustment: {
      title: string;
      description: string;
    };
    contrastModes: {
      title: string;
      description: string;
    };
    readableFont: {
      title: string;
      description: string;
    };
    largeCursor: {
      title: string;
      description: string;
    };
    textToSpeech: {
      title: string;
      description: string;
    };
    reduceMotion: {
      title: string;
      description: string;
    };
    additionalAdjustmentsTitle: string;
    keyboardNav: string;
    screenReader: string;
    altText: string;
    accessibleForms: string;
    noFlashing: string;
  };
  limitations: {
    title: string;
    p1: string;
    p2: string;
  };
  contact: {
    title: string;
    p1: string;
    name: string;
    email: string;
    p2: string;
    p3: string;
  };
};

export type PrivacyPolicyDict = {
  pageTitle: string;
  pageDescription: string;
  mainTitle: string;
  lastUpdated: string;
  introduction: {
    title: string;
    p1: string;
    p2: string;
    p3: string;
  };
  consent: {
    title: string;
    p1: string;
    p2: string;
    p3: string;
    p4: string;
  };
  collectedInfo: {
    title: string;
    p1: string;
    subTitle1: string;
    list1: {
      item1: string;
      item2: {
        title: string;
        subItem1: string;
        subItem2: string;
        subItem3: string;
      };
      item3: string;
      item4: string;
      item5: string;
      item6: string;
    };
    subTitle2: string;
    p2: string;
    subTitle3: string;
    p3_1: string;
    p3_2: string;
    p3_3: string;
    p3_4: string;
    p3_5: string;
    p3_6: string;
    p3_7: string;
    subTitle4: string;
    list2: {
      item1: string;
      item2: string;
    };
  };
  howWeUse: {
    title: string;
    p1: string;
    list: {
      item1: string;
      item2: string;
      item3: string;
      item4: string;
      item5: string;
      item6: string;
      item7: string;
    };
  };
  sharingInfo: {
    title: string;
    p1: string;
    list: {
      item1: string;
      item2: string;
      item3: string;
      item4: string;
      item5: string;
    };
  };
  security: {
    title: string;
    p1: string;
  };
  retention: {
    title: string;
    p1: string;
  };
  yourRights: {
    title: string;
    p1: string;
  };
  crossBorder: {
    title: string;
    p1: string;
  };
  minors: {
    title: string;
    p1: string;
  };
  changes: {
    title: string;
    p1: string;
  };
  contact: {
    title: string;
    p1: string;
    companyName: string;
    email: string;
    address: string;
  };
};

export type TermsOfServiceDict = {
  pageTitle: string;
  pageDescription: string;
  mainTitle: string;
  subTitle: string;
  lastUpdated: string;
  introduction: {
    title: string;
    p1_1: string;
    p1_2: string;
    p1_3: string;
    p1_4: string;
    list: {
      itemA: string;
      itemB: string;
      itemC: string;
    };
    p1_5: string;
  };
  userAccount: {
    title: string;
    p2_1: string;
    p2_2: string;
    list: {
      itemA: string;
      itemB: string;
      itemC: string;
      itemD: string;
      itemE: string;
      itemF: string;
      itemG: string;
      itemH: string;
      itemI: string;
    };
    p2_3: string;
  };
  serviceFees: {
    title: string;
    p3_1: string;
    list: {
      itemA: string;
      itemB: string;
      itemC: string;
    };
    p3_2: string;
    p3_3: string;
    p3_4: string;
    p3_5: string;
  };
  intellectualProperty: {
    title: string;
    p4_1: string;
    p4_2: string;
  };
  thirdPartyLinks: {
    title: string;
    p1: string;
  };
  limitationOfLiability: {
    title: string;
    p6_1: string;
    p6_2: string;
    p6_3: string;
    p6_4: string;
  };
  indemnification: {
    title: string;
    p1: string;
  };
  terminationLaw: {
    title: string;
    p8_1: string;
    p8_2: string;
    p8_3: string;
  };
  contact: {
    title: string;
    p9_1: string;
    p9_2: string;
  };
};

export type LegalDictionary = {
  accessibilityStatement: AccessibilityStatementDict;
  privacyPolicy: PrivacyPolicyDict;
  termsOfService: TermsOfServiceDict;
};

export type UnsubscribePageDict = {
  verifying: string;
  successTitle: string;
  successMessage: string;
  errorTitle: string;
  errorMessageDefault: string;
  errorInvalidLink: string;
  backToHomeButton: string;
};

export type LoadingOverlayDict = {
  title: string;
  subtitle: string;
  acceptingTerms: string;
  savingProfile: string;
  savingProfileSubtext?: string;
  sendingCode: string;
  sendingCodeSubtext?: string;
  redirecting: string;
};