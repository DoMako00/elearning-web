import type { HelpCategory, HelpArticle, SupportTicket, HelpResourceLink } from "../../../types/help";

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
    description: "Manage your account, password, verification, and access issues.",
    articleCount: 12,
    iconName: "User",
  },
  {
    id: "courses-learning",
    title: "Courses & Learning",
    description: "Access courses, track progress, lessons, and learning tools.",
    articleCount: 18,
    iconName: "BookOpen",
  },
  {
    id: "payments-subscriptions",
    title: "Payments & Subscriptions",
    description: "Billing, refunds, plans, discounts, and subscription management.",
    articleCount: 10,
    iconName: "CreditCard",
  },
  {
    id: "technical-issues",
    title: "Technical Issues",
    description: "Video playback, browser issues, errors, and performance.",
    articleCount: 16,
    iconName: "Settings2",
  },
  {
    id: "assignments-exams",
    title: "Assignments & Exams",
    description: "Submitting work, grades, quiz issues, and deadlines.",
    articleCount: 9,
    iconName: "FileText",
  },
  {
    id: "certificates",
    title: "Certificates",
    description: "How to earn, download, and verify your certificates.",
    articleCount: 6,
    iconName: "Award",
  },
  {
    id: "community-messages",
    title: "Community & Messages",
    description: "Discussions, messaging, study groups, and reporting.",
    articleCount: 7,
    iconName: "Users",
  },
  {
    id: "other",
    title: "Other",
    description: "Anything else you need help with.",
    articleCount: 5,
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
    lastUpdated: "2 days ago",
    views: "14.2k",
    isPopular: true,
    content: {
      overview:
        "Video playback issues can usually be resolved by checking your browser hardware acceleration, clearing your cache, or switching stream resolution.",
      steps: [
        {
          stepNumber: 1,
          title: "Check your Internet connection",
          description: "Ensure you have a continuous download speed of at least 5 Mbps for HD video playback."
        },
        {
          stepNumber: 2,
          title: "Clear browser cache and cookies",
          description: "Cached media elements might prevent new video chunks from streaming correctly."
        },
        {
          stepNumber: 3,
          title: "Disable conflicting browser extensions",
          description: "Ad blockers or script blockers may intercept secure DRM video streaming endpoints."
        },
        {
          stepNumber: 4,
          title: "Lower video resolution",
          description: "Switch from Auto or 1080p to 720p or 480p using the video player settings gear icon."
        }
      ],
      callout: {
        type: "tip",
        text: "Using Google Chrome or Firefox provides the smoothest DRM video playback experience on desktop."
      },
      relatedArticleIds: ["art-3", "art-8"]
    }
  },
  {
    id: "art-2",
    categoryId: "account-login",
    title: "How to reset your password?",
    description: "Recover access to your account.",
    iconName: "KeyRound",
    readTime: "2 min read",
    lastUpdated: "1 week ago",
    views: "9.8k",
    isPopular: true,
    content: {
      overview:
        "If you forgot your password or are locked out, you can request a secure password reset link to your registered email address.",
      steps: [
        {
          stepNumber: 1,
          title: "Go to the Sign In screen",
          description: "Click on 'Sign In' at the top right and select 'Forgot Password?' below the input fields."
        },
        {
          stepNumber: 2,
          title: "Enter your registered email address",
          description: "Type in the email address connected with your GreenLearn student account and submit."
        },
        {
          stepNumber: 3,
          title: "Check your inbox",
          description: "Open the recovery email and click 'Reset My Password'. Links expire after 30 minutes for security."
        },
        {
          stepNumber: 4,
          title: "Create a new strong password",
          description: "Choose a password that is at least 8 characters long, containing a mix of letters, numbers, and symbols."
        }
      ],
      callout: {
        type: "warning",
        text: "Make sure to check your Spam or Promotions folder if you don't receive the reset email within 2 minutes."
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
    lastUpdated: "3 weeks ago",
    views: "18.5k",
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
          description: "You can be signed in on up to 2 devices simultaneously on standard student plans."
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
    lastUpdated: "4 days ago",
    views: "11.1k",
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
          description: "Check accepted formats (PDF, DOCX, ZIP) and maximum allowed file size (50MB)."
        },
        {
          stepNumber: 3,
          title: "Upload your submission file",
          description: "Drag and drop your file into the submission dropzone, or write your answer directly in the rich text box."
        },
        {
          stepNumber: 4,
          title: "Click 'Submit for Review'",
          description: "Confirm your submission. Once submitted, your instructor will receive an alert."
        }
      ],
      callout: {
        type: "tip",
        text: "You can re-upload revisions before the final deadline passes unless locked by your instructor."
      },
      relatedArticleIds: ["art-1", "art-6"]
    }
  },
  {
    id: "art-5",
    categoryId: "payments-subscriptions",
    title: "Can I get a refund?",
    description: "Learn about our refund policy.",
    iconName: "HelpCircle",
    readTime: "2 min read",
    lastUpdated: "5 days ago",
    views: "8.3k",
    isPopular: true,
    content: {
      overview:
        "We offer a 14-day 100% money-back guarantee for all single course purchases and new annual subscriptions.",
      steps: [
        {
          stepNumber: 1,
          title: "Eligibility window",
          description: "Refund requests must be submitted within 14 calendar days of payment."
        },
        {
          stepNumber: 2,
          title: "Course completion limit",
          description: "Course progress must be below 25% to qualify for an automatic refund."
        },
        {
          stepNumber: 3,
          title: "Requesting refund",
          description: "Click 'Submit a support ticket' in the sidebar with category 'Payments & Subscriptions'."
        }
      ],
      callout: {
        type: "warning",
        text: "Refunds typically process back to your original payment method in 3-5 business days."
      },
      relatedArticleIds: ["art-7"]
    }
  },
  {
    id: "art-6",
    categoryId: "account-login",
    title: "How to change my email or phone?",
    description: "Update your contact information safely.",
    iconName: "MessageCircle",
    readTime: "3 min read",
    lastUpdated: "2 weeks ago",
    views: "6.9k",
    isPopular: true,
    content: {
      overview:
        "Keep your account safe by ensuring your contact information is up to date.",
      steps: [
        {
          stepNumber: 1,
          title: "Open Profile Settings",
          description: "Go to your student profile by clicking your avatar at the top right, then select 'Settings'."
        },
        {
          stepNumber: 2,
          title: "Update Email or Phone",
          description: "Enter your new email address or phone number and click 'Save Changes'."
        },
        {
          stepNumber: 3,
          title: "Verify the change",
          description: "A 6-digit confirmation code will be sent to your new email or phone number to confirm."
        }
      ],
      callout: {
        type: "tip",
        text: "If you lost access to your primary email, contact support via live chat for identity verification."
      },
      relatedArticleIds: ["art-2"]
    }
  },
  {
    id: "art-7",
    categoryId: "payments-subscriptions",
    title: "How does the Friends Plan work?",
    description: "Add more seats and devices to your account.",
    iconName: "Users",
    readTime: "3 min read",
    lastUpdated: "1 month ago",
    views: "5.4k",
    isPopular: true,
    content: {
      overview:
        "The Friends & Family bundle allows up to 4 learners to share a discounted subscription while keeping individual course progress separate.",
      steps: [
        {
          stepNumber: 1,
          title: "Upgrade your tier",
          description: "Choose 'Friends Plan' in the Billing section."
        },
        {
          stepNumber: 2,
          title: "Invite your members",
          description: "Send invitation links to up to 3 email addresses."
        },
        {
          stepNumber: 3,
          title: "Separate profiles & XP",
          description: "Each member gets their own private XP, streak, certificates, and course progress."
        }
      ],
      callout: {
        type: "note",
        text: "The primary account owner manages billing and member seats."
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
    lastUpdated: "3 days ago",
    views: "13.6k",
    isPopular: true,
    content: {
      overview:
        "Earn verifiable digital certificates upon achieving a 100% completion rate and passing all module quizzes.",
      steps: [
        {
          stepNumber: 1,
          title: "Check course completion",
          description: "Ensure all video lessons, readings, and quizzes have green checkmarks."
        },
        {
          stepNumber: 2,
          title: "Visit Profile > Achievements",
          description: "Your digital certificates are stored in your profile under the Achievements tab."
        },
        {
          stepNumber: 3,
          title: "Download PDF or copy verification link",
          description: "Each certificate includes a unique verification hash and QR code shareable on LinkedIn."
        }
      ],
      callout: {
        type: "tip",
        text: "Certificates are issued in high-res vector PDF format ready for printing."
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
    lastUpdated: "Just now",
    views: "22.1k",
    isPopular: true,
    content: {
      overview:
        "Can't find what you're looking for? Our dedicated GreenLearn support specialists are standing by.",
      steps: [
        {
          stepNumber: 1,
          title: "Start a Live Chat",
          description: "Get real-time answers within 3 minutes during active support hours (9:00 AM – 9:00 PM GMT+3)."
        },
        {
          stepNumber: 2,
          title: "Submit a Ticket",
          description: "Open an asynchronous support ticket with screenshots and diagnostic logs."
        },
        {
          stepNumber: 3,
          title: "Community Forum",
          description: "Ask mentors, instructors, and fellow students in the GreenLearn Community Hub."
        }
      ],
      callout: {
        type: "note",
        text: "Priority response is granted to urgent exam and payment questions."
      },
      relatedArticleIds: ["art-1", "art-5"]
    }
  }
];

export const ALL_CATEGORY_ARTICLES: Record<string, HelpArticle[]> = {
  "account-login": [
    POPULAR_ARTICLES[1], // How to reset your password?
    POPULAR_ARTICLES[5], // How to change my email or phone?
    {
      id: "art-al-3",
      categoryId: "account-login",
      title: "Setting up Two-Factor Authentication (2FA)",
      description: "Protect your account with Google Authenticator or SMS codes.",
      iconName: "KeyRound",
      readTime: "3 min read",
      lastUpdated: "1 week ago",
      content: {
        overview: "Two-factor authentication adds an extra layer of security to your student profile.",
        steps: [
          { stepNumber: 1, title: "Go to Security Settings", description: "Navigate to Profile > Settings > Security." },
          { stepNumber: 2, title: "Scan the QR code", description: "Open Google Authenticator or Authy to scan the secret key." },
          { stepNumber: 3, title: "Verify code", description: "Enter the generated 6-digit code to complete setup." }
        ]
      }
    },
    {
      id: "art-al-4",
      categoryId: "account-login",
      title: "Trouble receiving verification emails",
      description: "Steps if your activation or reset email hasn't arrived.",
      iconName: "User",
      readTime: "2 min read",
      lastUpdated: "2 weeks ago",
      content: {
        overview: "Ensure your email provider is not blocking automated notifications from GreenLearn.",
        steps: [
          { stepNumber: 1, title: "Check Spam folder", description: "Inspect spam and bulk filters." },
          { stepNumber: 2, title: "Whitelist no-reply@greenlearn.org", description: "Add our address to your trusted contacts." }
        ]
      }
    }
  ],
  "courses-learning": [
    {
      id: "art-cl-1",
      categoryId: "courses-learning",
      title: "How to download lecture slides and course notes",
      description: "Access course materials offline on your device.",
      iconName: "BookOpen",
      readTime: "2 min read",
      lastUpdated: "4 days ago",
      content: {
        overview: "Instructors frequently provide supplementary lecture slides, PDF summaries, and datasets.",
        steps: [
          { stepNumber: 1, title: "Open the Lesson Player", description: "Go to the relevant lecture in your course." },
          { stepNumber: 2, title: "Click 'Resources' tab", description: "Locate the file list below or next to the video." }
        ]
      }
    },
    {
      id: "art-cl-2",
      categoryId: "courses-learning",
      title: "Tracking your course completion and XP rewards",
      description: "Understand how XP points and lesson checkpoints work.",
      iconName: "BookOpen",
      readTime: "3 min read",
      lastUpdated: "6 days ago",
      content: {
        overview: "Every lesson finished gives 50 XP, and weekly goals boost your streak multiplier.",
        steps: [
          { stepNumber: 1, title: "Finish video lessons completely", description: "Ensure the progress bar reaches 100%." }
        ]
      }
    }
  ],
  "payments-subscriptions": [
    POPULAR_ARTICLES[4], // Can I get a refund?
    POPULAR_ARTICLES[6], // Friends Plan
    {
      id: "art-ps-3",
      categoryId: "payments-subscriptions",
      title: "Accepted payment methods and currencies",
      description: "Visa, Mastercard, PayPal, and regional payment providers.",
      iconName: "CreditCard",
      readTime: "2 min read",
      lastUpdated: "2 weeks ago",
      content: {
        overview: "GreenLearn supports international credit cards, debit cards, and secure wallet transfers.",
        steps: [
          { stepNumber: 1, title: "Select your currency", description: "Pricing auto-adjusts based on your billing region." }
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
      lastUpdated: "5 days ago",
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
      title: "What happens if I miss an assignment deadline?",
      description: "Late submission policies and requesting extensions.",
      iconName: "FileText",
      readTime: "3 min read",
      lastUpdated: "1 week ago",
      content: {
        overview: "Instructors may allow grace periods or partial credit depending on course rules.",
        steps: [
          { stepNumber: 1, title: "Contact your course instructor", description: "Send a direct message via the Course discussion board." }
        ]
      }
    }
  ],
  "certificates": [
    POPULAR_ARTICLES[7], // Where can I find my certificate?
    {
      id: "art-cert-2",
      categoryId: "certificates",
      title: "Fixing a misspelled name on your certificate",
      description: "Update your legal name displayed on completed certificates.",
      iconName: "Award",
      readTime: "2 min read",
      lastUpdated: "1 month ago",
      content: {
        overview: "Certificates reflect the legal name registered in your profile account settings.",
        steps: [
          { stepNumber: 1, title: "Update profile name", description: "Save the corrected legal name in Profile Settings." },
          { stepNumber: 2, title: "Regenerate certificate", description: "Click 'Refresh Certificate' on your achievements card." }
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
      lastUpdated: "2 weeks ago",
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
      lastUpdated: "3 weeks ago",
      content: {
        overview: "We actively review community requests every month to build new features.",
        steps: [
          { stepNumber: 1, title: "Submit a feedback ticket", description: "Choose category 'Other' in the support form." }
        ]
      }
    }
  ]
};

export const RECENT_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "tick-1",
    ticketNumber: "#GL-4821",
    title: "Video not playing on Module 2",
    status: "Open",
    createdAt: "2 hours ago",
    category: "Technical Issues",
    description: "The video buffer pauses at 04:12 with an HTTP 403 error on Chrome macOS.",
    iconType: "video"
  },
  {
    id: "tick-2",
    ticketNumber: "#GL-4790",
    title: "Refund request",
    status: "In review",
    createdAt: "1 day ago",
    category: "Payments & Subscriptions",
    description: "Accidentally bought duplicate course seat. Requesting refund for order #ORD-9821.",
    iconType: "credit-card"
  },
  {
    id: "tick-3",
    ticketNumber: "#GL-4712",
    title: "Device change request",
    status: "Resolved",
    createdAt: "3 days ago",
    category: "Account & Login",
    description: "Reached maximum allowed devices on account after buying new laptop.",
    iconType: "smartphone"
  }
];

export const HELP_RESOURCES: HelpResourceLink[] = [
  {
    id: "res-guides",
    title: "User guides",
    subtitle: "Step-by-step tutorials.",
    iconName: "FileText",
    url: "#"
  },
  {
    id: "res-videos",
    title: "Video tutorials",
    subtitle: "Watch and learn.",
    iconName: "PlayCircle",
    url: "#"
  },
  {
    id: "res-announcements",
    title: "Announcements",
    subtitle: "Platform updates and new features.",
    iconName: "Megaphone",
    url: "#"
  }
];
