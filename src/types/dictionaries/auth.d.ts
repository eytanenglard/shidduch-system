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
    noEmail: string;
    linkInvalid: string;
    sessionMismatch: string;
    tokenUsed: string;
    tokenExpired: string;
    default: string;
    resendFailed: string;
  },
  alerts: {
    resendSuccess: string;
  }
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
        title: string,
        resent: string
    }
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

export type RegisterStepsDict = {
  progressBar: {
    stepLabel: string; // "שלב {{step}}"
  };
  headers: {
    // Titles
    registerTitle: string;
    verifyEmailTitle: string;
    completeProfileTitle: string;
    // Descriptions
    welcomeDescription: string;
    accountCreationDescription: string;
    verifyEmailDescription: string; // "הזן את הקוד שנשלח ל: {{email}}"
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
      backButton: string;
      nextButton: string;
      nextButtonLoading: string;
      errors: {
        title: string;
        invalidEmail: string;
        invalidPassword: string;
        requiredEmail: string;
        requiredPassword: string;
        fillFields: string;
        fixErrors: string;
        consentRequired: string;
        default: string;
      };
      marketingConsent: string;
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
      backButton: string;
      nextButton: string;
      nextButtonLoading: string;
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
      errors: {
        title: string;
        missingData: string;
        default: string;
      };
    };
    complete: {
      loading: string;
      // Email verification required
      verifyEmailTitle: string;
      verifyEmailSubtitle: string;
      verifyEmailPrompt: string;
      // Profile completion required
      completeProfileTitle: string;
      completeProfileSubtitle: string;
      completeProfileButton: string;
      // Phone verification required
      verifyPhoneTitle: string;
      verifyPhoneSubtitle: string;
      verifyPhoneButton: string;
      // All done
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
};