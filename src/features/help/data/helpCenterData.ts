import type { HelpCategory, HelpArticle, HelpResourceLink } from "../../../types/help";

export const POPULAR_SEARCH_TAGS: string[] = [
  "Video playback",
  "Payment issue",
  "Device limit",
  "Certificates",
  "Assignments",
];

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "account-login",
    title: "Account & Login",
    description: "Manage account activation, email verification, and access issues.",
    iconName: "User",
  },
  {
    id: "courses-learning",
    title: "Courses & Learning",
    description: "Access courses, track progress, lessons, and learning tools.",
    iconName: "BookOpen",
  },
  {
    id: "payments-subscriptions",
    title: "Payments & Subscriptions",
    description: "Manual payment review, offerings, and subscription access.",
    iconName: "CreditCard",
  },
  {
    id: "technical-issues",
    title: "Technical Issues",
    description: "Video playback, browser issues, errors, and performance.",
    iconName: "Settings2",
  },
  {
    id: "assignments-exams",
    title: "Assignments & Exams",
    description: "Submitting work, grades, quiz issues, and deadlines.",
    iconName: "FileText",
  },
  {
    id: "certificates",
    title: "Certificates",
    description: "How to earn, download, and verify your certificates.",
    iconName: "Award",
  },
  {
    id: "community-messages",
    title: "Community & Messages",
    description: "Discussions, messaging, study groups, and reporting.",
    iconName: "Users",
  },
  {
    id: "other",
    title: "Other",
    description: "Anything else you need help with.",
    iconName: "MoreHorizontal",
  },
];

export const POPULAR_ARTICLES: HelpArticle[] = [
  {
    id: "art-1",
    categoryId: "technical-issues",
    title: "Why can't I play the video?",
    description: "Troubleshooting video playback issues.",
    iconName: "PlayCircle",
    readTime: "3 min read",
    isPopular: true,
    content: {
      overview:
        "Video playback issues can usually be resolved by checking your browser hardware acceleration, clearing your cache, or switching stream resolution.",
      steps: [
        {
          stepNumber: 1,
          title: "Check your Internet connection",
          description: "Check that your connection is stable, then try the protected player again."
        },
        {
          stepNumber: 2,
          title: "Clear browser cache and cookies",
          description: "Cached media elements might prevent new video chunks from streaming correctly."
        },
        {
          stepNumber: 3,
          title: "Disable conflicting browser extensions",
          description: "Privacy or script-blocking extensions may interfere with protected media playback."
        },
        {
          stepNumber: 4,
          title: "Lower video resolution",
          description: "Switch from Auto or 1080p to 720p or 480p using the video player settings gear icon."
        }
      ],
      callout: {
        type: "tip",
        text: "Keep your browser updated. Protected media availability is controlled by the backend."
      },
      relatedArticleIds: ["art-3", "art-8"]
    }
  },
  {
    id: "art-2",
    categoryId: "account-login",
    title: "How do I activate or sign in to my account?",
    description: "Use the sign-in method that matches your account status.",
    iconName: "KeyRound",
    readTime: "2 min read",
    isPopular: true,
    content: {
      overview:
        "The platform does not use password sign-in. First-time Students claim their provisioned account with an Account Identifier and Setup Code. Returning Students and Admins use email verification codes.",
      steps: [
        {
          stepNumber: 1,
          title: "Open Sign In",
          description: "Choose account activation if you are a Student signing in for the first time."
        },
        {
          stepNumber: 2,
          title: "Activate a provisioned Student account",
          description: "Enter the Account Identifier and one-time Setup Code provided by the Admin. No email or phone is required for the first claim."
        },
        {
          stepNumber: 3,
          title: "Sign in after activation",
          description: "After a Student links and verifies a real email in Settings, future sign-in uses an email verification code. Admin sign-in also uses email verification."
        },
        {
          stepNumber: 4,
          title: "Keep the Setup Code private",
          description: "The one-time Setup Code is only for first-time activation. Contact an Admin if the code expires or was already used."
        }
      ],
      callout: {
        type: "note",
        text: "An Account Identifier is not a mailbox and must never be used as an OTP destination."
      },
      relatedArticleIds: ["art-5", "art-6"]
    }
  },
  {
    id: "art-3",
    categoryId: "technical-issues",
    title: "What devices are supported?",
    description: "Supported browsers and device requirements.",
    iconName: "Laptop",
    readTime: "4 min read",
    isPopular: true,
    content: {
      overview:
        "GreenLearn works across modern desktop browsers, tablets, and mobile devices without requiring extra plugins.",
      steps: [
        {
          stepNumber: 1,
          title: "Supported Desktop Browsers",
          description: "Chrome (v100+), Safari (v15+), Edge (v100+), and Firefox (v100+)."
        },
        {
          stepNumber: 2,
          title: "Tablet & iPad Support",
          description: "iPadOS 15+ (Safari & Chrome), Android Tablets running Android 10+."
        },
        {
          stepNumber: 3,
          title: "Concurrent Device Policy",
          description: "Student device slots follow the account policy. A full slot requires the authorized device replacement flow; it does not allow unlimited devices."
        }
      ],
      callout: {
        type: "note",
        text: "Internet Explorer is no longer supported. Please upgrade to Microsoft Edge or Chrome."
      },
      relatedArticleIds: ["art-1", "art-7"]
    }
  },
  {
    id: "art-4",
    categoryId: "assignments-exams",
    title: "How to submit an assignment?",
    description: "Step-by-step guide with screenshots.",
    iconName: "FileCheck",
    readTime: "3 min read",
    isPopular: true,
    content: {
      overview:
        "Assignments can be submitted directly through the lesson workspace or via the dedicated Assignments tab in the sidebar.",
      steps: [
        {
          stepNumber: 1,
          title: "Navigate to your assignment",
          description: "Click on 'Assignments' in the navigation bar to see pending tasks and deadlines."
        },
        {
          stepNumber: 2,
          title: "Review submission requirements",
          description: "Check the accepted file types and size shown on the assignment form. Text submissions are also available when enabled for the assignment."
        },
        {
          stepNumber: 3,
          title: "Upload your submission file",
          description: "Drag and drop your file into the submission dropzone, or write your answer directly in the rich text box."
        },
        {
          stepNumber: 4,
          title: "Click 'Submit for Review'",
          description: "Confirm your submission. It is then available for authorized Admin review."
        }
      ],
      callout: {
        type: "tip",
        text: "The assignment’s saved availability and submission rules determine whether another submission is allowed."
      },
      relatedArticleIds: ["art-1", "art-6"]
    }
  },
  {
    id: "art-5",
    categoryId: "payments-subscriptions",
    title: "How are manual payments reviewed?",
    description: "Understand what happens after an order is submitted.",
    iconName: "HelpCircle",
    readTime: "2 min read",
    isPopular: true,
    content: {
      overview:
        "Payments are reviewed manually by an authorized Admin. Submitting an order does not activate a Subscription or grant course access.",
      steps: [
        {
          stepNumber: 1,
          title: "Order status",
          description: "A newly submitted manual payment order is Pending Review until an authorized Admin reviews it."
        },
        {
          stepNumber: 2,
          title: "Payment evidence",
          description: "Use only the payment details and evidence requested by the order form. Do not submit sensitive account credentials."
        },
        {
          stepNumber: 3,
          title: "Access after review",
          description: "Only successful manual approval can activate the associated Subscription and access."
        }
      ],
      callout: {
        type: "note",
        text: "There is no payment gateway, webhook, or automatic payment confirmation in this flow."
      },
      relatedArticleIds: ["art-7"]
    }
  },
  {
    id: "art-6",
    categoryId: "account-login",
    title: "How do I link or change my email?",
    description: "Update your contact information safely.",
    iconName: "MessageCircle",
    readTime: "3 min read",
    isPopular: true,
    content: {
      overview:
        "A Student can link a real email after activating the provisioned account. Phone is optional contact information and is not used for sign-in or OTP.",
      steps: [
        {
          stepNumber: 1,
          title: "Open Profile Settings",
          description: "Go to your student profile by clicking your avatar at the top right, then select 'Settings'."
        },
        {
          stepNumber: 2,
          title: "Verify email ownership",
          description: "Follow the email verification flow. The email becomes the login email only after successful verification."
        },
        {
          stepNumber: 3,
          title: "Keep phone optional",
          description: "Phone can be stored as contact data when supplied, but is never an authentication identity or OTP channel."
        }
      ],
      callout: {
        type: "note",
        text: "Generated platform identifiers are not mailboxes and must never receive verification codes."
      },
      relatedArticleIds: ["art-2"]
    }
  },
  {
    id: "art-7",
    categoryId: "payments-subscriptions",
    title: "How do multi-seat purchases work?",
    description: "Understand capacity and pricing eligibility.",
    iconName: "Users",
    readTime: "3 min read",
    isPopular: true,
    content: {
      overview:
        "A purchase uses a Semester Offering and a supported capacity. Capacity alone does not qualify a purchase for friend pricing; any qualifying group discount must be confirmed for the actual purchasers.",
      steps: [
        {
          stepNumber: 1,
          title: "Choose a supported capacity",
          description: "Current capacities are 1, 3, or 5 seats. The selected Offering defines which included courses are covered."
        },
        {
          stepNumber: 2,
          title: "Assign eligible Students",
          description: "Each Student must match the Offering's Brand, Institution, academic year, and semester."
        },
        {
          stepNumber: 3,
          title: "Confirm any group pricing",
          description: "Friend pricing is not automatic; the Admin must confirm the purchase qualifies. Independent purchases use individual pricing."
        }
      ],
      callout: {
        type: "note",
        text: "Do not combine independent purchases or apply a group discount based only on the number of Students."
      },
      relatedArticleIds: ["art-5"]
    }
  },
  {
    id: "art-8",
    categoryId: "certificates",
    title: "Where can I find my certificate?",
    description: "Download and verify your certificates.",
    iconName: "Award",
    readTime: "2 min read",
    isPopular: true,
    content: {
      overview:
        "Certificates are issued by an authorized Admin. Course progress or assessment completion does not automatically create a certificate.",
      steps: [
        {
          stepNumber: 1,
          title: "Check course completion",
          description: "Check your Profile for certificates that have actually been issued to your account."
        },
        {
          stepNumber: 2,
          title: "Visit Profile > Achievements",
          description: "Open the issued certificate from your Profile. Access is checked by the backend and the document is not a public URL."
        },
        {
          stepNumber: 3,
          title: "Open or download securely",
          description: "The document is delivered through the authorized protected access flow."
        }
      ],
      callout: {
        type: "tip",
        text: "If no certificate is listed, none has been issued to the account."
      },
      relatedArticleIds: ["art-4"]
    }
  },
  {
    id: "art-9",
    categoryId: "other",
    title: "I still need help",
    description: "Contact our support team.",
    iconName: "LifeBuoy",
    readTime: "1 min read",
    isPopular: true,
    content: {
      overview:
        "Can't find what you're looking for? Start a support conversation and continue it in Messages.",
      steps: [
        {
          stepNumber: 1,
          title: "Start a support conversation",
          description: "Use the support action to create a persisted conversation with the Admin support team."
        },
        {
          stepNumber: 2,
          title: "Submit a Ticket",
          description: "Describe the issue in the support conversation. Use only supported secure attachment flows."
        },
        {
          stepNumber: 3,
          title: "Student Community",
          description: "Use the Brand- and Institution-scoped Community for Student discussions."
        }
      ],
      callout: {
        type: "note",
        text: "The platform does not promise a response time or priority service level."
      },
      relatedArticleIds: ["art-1", "art-5"]
    }
  }
];

export const ALL_CATEGORY_ARTICLES: Record<string, HelpArticle[]> = {
    "account-login": [
    POPULAR_ARTICLES[1], // Account activation and sign-in
    POPULAR_ARTICLES[5], // Verified email linking
    {
      id: "art-al-3",
      categoryId: "account-login",
      title: "Link a real email in Student Settings",
      description: "Verify email ownership before using an email for returning Student sign-in.",
      iconName: "KeyRound",
      readTime: "3 min read",
      content: {
        overview: "First-time activation does not require an email. After entering the Student area, link an email address that can receive verification codes.",
        steps: [
          { stepNumber: 1, title: "Open Settings", description: "Enter Settings after your first account activation." },
          { stepNumber: 2, title: "Enter your real email", description: "Use an address you control; a generated Account Identifier is not a mailbox." },
          { stepNumber: 3, title: "Complete verification", description: "Follow the code verification flow. Only after verification is the email linked for future sign-in." }
        ]
      }
    },
    {
      id: "art-al-4",
      categoryId: "account-login",
      title: "Trouble receiving an email verification code",
      description: "Check the address and mailbox used for email verification.",
      iconName: "User",
      readTime: "2 min read",
      content: {
        overview: "Email codes are sent only to a real email address entered in the relevant verification flow. Internal platform identifiers are not mailboxes.",
        steps: [
          { stepNumber: 1, title: "Confirm the address", description: "Check that the email address was entered correctly and that you can access its inbox." },
          { stepNumber: 2, title: "Check filtered mail", description: "Look in Spam or other filtered folders for the verification message." },
          { stepNumber: 3, title: "Ask for help", description: "If the code still does not arrive, start a support conversation from Help." }
        ]
      }
    }
  ],
  "courses-learning": [
    {
      id: "art-cl-1",
      categoryId: "courses-learning",
      title: "How to access lesson resources",
      description: "Open resources attached to an available lesson.",
      iconName: "BookOpen",
      readTime: "2 min read",
      content: {
        overview: "Resources appear only when they have been attached to a lesson and released. Access is checked by the backend; offline availability is not guaranteed.",
        steps: [
          { stepNumber: 1, title: "Open an available lesson", description: "Use My Courses to open a course and lesson you are allowed to access." },
          { stepNumber: 2, title: "Open its resources", description: "Choose a listed resource and use the protected delivery action shown in the player." }
        ]
      }
    },
    {
      id: "art-cl-2",
      categoryId: "courses-learning",
      title: "How is course progress recorded?",
      description: "Understand server-recorded lesson progress and weekly goals.",
      iconName: "BookOpen",
      readTime: "3 min read",
      content: {
        overview: "Course progress is derived from persisted lesson completion. The weekly lesson goal is a preference and does not guarantee XP or streak rewards.",
        steps: [
          { stepNumber: 1, title: "Complete a lesson", description: "Use the lesson player’s completion action; the backend records progress and updates course totals." }
        ]
      }
    }
  ],
  "payments-subscriptions": [
    POPULAR_ARTICLES[4], // Manual payment review
    POPULAR_ARTICLES[6], // Multi-seat purchase rules
    {
      id: "art-ps-3",
      categoryId: "payments-subscriptions",
      title: "Manual payment methods",
      description: "Learn how to submit a payment for Admin review.",
      iconName: "CreditCard",
      readTime: "2 min read",
      content: {
        overview: "The current payment flow is manual Admin review. Available methods are InstaPay, Wallet, Bank Transfer, Cash, and Other, according to the order form.",
        steps: [
          { stepNumber: 1, title: "Follow the order form", description: "Enter only the payment details requested by the manual order form. A submitted order remains Pending Review until an Admin approves or rejects it." }
        ]
      }
    }
  ],
  "technical-issues": [
    POPULAR_ARTICLES[0], // Why can't I play the video?
    POPULAR_ARTICLES[2], // Supported devices
    {
      id: "art-ti-3",
      categoryId: "technical-issues",
      title: "Audio out of sync or missing in lessons",
      description: "How to fix audio playback lag in browsers.",
      iconName: "Settings2",
      readTime: "2 min read",
      content: {
        overview: "Desynchronized audio is often caused by Bluetooth latency or browser tab suspension.",
        steps: [
          { stepNumber: 1, title: "Refresh the player tab", description: "Reload with Ctrl+F5 or Cmd+Shift+R." }
        ]
      }
    }
  ],
  "assignments-exams": [
    POPULAR_ARTICLES[3], // How to submit an assignment?
    {
      id: "art-ae-2",
      categoryId: "assignments-exams",
      title: "What if I miss an assignment deadline?",
      description: "Check the assignment’s saved availability and submission status.",
      iconName: "FileText",
      readTime: "3 min read",
      content: {
        overview: "Submission availability and late rules are controlled by the assignment. The platform does not promise an extension or partial credit.",
        steps: [
          { stepNumber: 1, title: "Check the assignment details", description: "Review the deadline and the current submission state shown in Assignments." },
          { stepNumber: 2, title: "Contact support if needed", description: "Use the support conversation for questions about the saved assignment rules." }
        ]
      }
    }
  ],
  "certificates": [
    POPULAR_ARTICLES[7], // Where can I find my certificate?
    {
      id: "art-cert-2",
      categoryId: "certificates",
      title: "Fixing a name on an issued certificate",
      description: "Contact support about a certificate that has already been issued.",
      iconName: "Award",
      readTime: "2 min read",
      content: {
        overview: "Certificates are issued by an Admin. Updating profile data does not automatically regenerate or replace an issued certificate.",
        steps: [
          { stepNumber: 1, title: "Open a support conversation", description: "Include the certificate title and explain the correction needed." },
          { stepNumber: 2, title: "Wait for Admin review", description: "Only an authorized Admin can issue a corrected certificate." }
        ]
      }
    }
  ],
  "community-messages": [
    {
      id: "art-cm-1",
      categoryId: "community-messages",
      title: "GreenLearn Community Guidelines & Code of Conduct",
      description: "Our standards for respectful learning discussions.",
      iconName: "Users",
      readTime: "4 min read",
      content: {
        overview: "Help us keep GreenLearn an encouraging, inclusive space for every student.",
        steps: [
          { stepNumber: 1, title: "Be respectful and constructful", description: "Offer supportive critiques and feedback." }
        ]
      }
    }
  ],
  "other": [
    POPULAR_ARTICLES[8], // I still need help
    {
      id: "art-oth-1",
      categoryId: "other",
      title: "Submitting feature requests & platform feedback",
      description: "Share your ideas to improve the student experience.",
      iconName: "MoreHorizontal",
      readTime: "2 min read",
      content: {
      overview: "For product questions or feedback, use the persisted support conversation in Help or Messages.",
        steps: [
          { stepNumber: 1, title: "Start a support conversation", description: "Choose the support action and describe the request clearly." }
        ]
      }
    }
  ]
};

export function getHelpCategoryArticleCount(categoryId: string): number {
  return ALL_CATEGORY_ARTICLES[categoryId]?.length ?? 0;
}

export const HELP_RESOURCES: HelpResourceLink[] = [
  {
    id: "res-guides",
    title: "My Courses",
    subtitle: "Open your enrolled courses and lessons.",
    iconName: "FileText",
    url: "/my-courses"
  },
  {
    id: "res-videos",
    title: "Assignments",
    subtitle: "Review and submit assigned work.",
    iconName: "PlayCircle",
    url: "/assignments"
  },
  {
    id: "res-announcements",
    title: "Messages",
    subtitle: "Continue a support conversation.",
    iconName: "Megaphone",
    url: "/messages"
  }
];
