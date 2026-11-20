const MAX_FILE_COUNT = 10;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_BATCH_BYTES = 20 * 1024 * 1024;
const sampleConversation = [
  "[08/10/2026, 9:14 AM] Jamie: Morning all — launch review is Thursday.",
  "[08/10/2026, 9:16 AM] Morgan: @Taylor, please review the customer email by 4pm today.",
  "[10/08/26, 9:18 AM] Priya: Decision: we will ship with the updated onboarding screenshots.",
  "[10/08/26, 9:20 AM] Jamie: Release notes are ready for review.",
  "Please add comments directly in the launch document.",
  "[10/08/26, 9:25 AM] Morgan: Correction: legal approval is still pending. The earlier green-light was for the old copy.",
  "[10/08/26, 9:27 AM] Sam: This message was edited",
  "The customer email deadline is now Friday at noon.",
  "[10/08/26, 9:31 AM] Priya: Thanks, I will update the checklist."
].join("\n");

const { analyzeConversation } = window.MissedMessageAnalyzer;

const threads = [];
let activeFilter = "all";
let selectedThreadId = null;
let searchTerm = "";
let selectedSender = "";
let selectedPriority = "all";
let nextThreadId = 1;
let toastTimer;
let isSummarizing = false;

const threadList = document.querySelector("#thread-list");
const detailPanel = document.querySelector("#detail-panel");
const importDialog = document.querySelector("#import-dialog");
const fileInput = document.querySelector("#conversation-files");
const fileQueueElement = document.querySelector("#file-queue");
const analyzeButton = document.querySelector("#analyze-button");
let queuedFiles = [];
const mentionKeywordsInput = document.querySelector("#mention-keywords");
mentionKeywordsInput.value = "";

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function truncate(value, length = 125) {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}


const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" }
];

const TRANSLATIONS = {
  en: {
    workspaceTitle: "Catch up",
    workspaceSubtitle: "Your conversation workspace",
    navWorkspace: "YOUR WORKSPACE",
    navCatchUp: "Catch Up",
    navUnread: "Unread",
    navMentions: "Mentions",
    navActions: "Action items",
    navHelp: "GUIDES & HELP",
    navHowToUse: "How To Use Guide",
    navConversations: "CONVERSATIONS",
    privacyTitle: "Private by design",
    privacyDesc: "Messages are parsed and summarized in this browser. Nothing is uploaded.",
    breadcrumbWorkspace: "Workspace",
    breadcrumbConversations: "All conversations",
    replayMotion: "Motion",
    howToUseGuide: "How To Use",
    localIndicator: "100% local",
    selectLanguageTitle: "Select Language",
    selectLanguageHint: "Choose your preferred display language.",
    menuHowToUse: "How To Use Guide",
    menuReplayIntro: "Replay Intro Motion",
    welcomeEyebrow: "YOUR DAILY CATCH-UP",
    welcomeH1Part1: "Catch up.",
    welcomeH1Part2: "Focus on what matters.",
    welcomeDesc: "Your conversations, thoughtfully distilled.",
    firstLaunchKicker: "YOUR PERSONAL CONVERSATION BRIEFING",
    firstLaunchTitle: "What Did I Miss?",
    firstLaunchDesc: "Your conversations move fast. Catch up on what matters without reading every message.",
    capUpdates: "✦ Important updates",
    capDecisions: "✓ Decisions & announcements",
    capTasks: "↗ Tasks & deadlines",
    capQuestions: "? Questions that need answers",
    firstLaunchPrivacy: "Private by design · Your messages are processed in this browser and are not uploaded.",
    btnImportConversations: "Import Conversations",
    btnPasteMessages: "Paste Messages",
    welcomeGuideLink: "Need help exporting or using the app? View the How To Use Guide →",
    summaryIntroStrong: "Your catch-up, at a glance",
    summaryIntroCaption: "Your imported conversations, summarized locally.",
    statCatchUp: "conversations<br>to catch up on",
    statActions: "action items<br>identified",
    statMentions: "direct<br>mentions",
    inboxKicker: "YOUR INBOX",
    inboxHeading: "Conversations",
    filterAll: "All",
    filterUnread: "Unread",
    filterMentions: "Mentions",
    filterActions: "With actions",
    lblSender: "Sender",
    optAllSenders: "All senders",
    lblPriority: "Priority",
    optAllPriority: "All priority",
    optHigh: "High",
    optMedium: "Medium",
    optLow: "Low",
    searchPlaceholder: "Search conversations",
    dialogKicker: "PRIVATE, ON-DEVICE IMPORT",
    dialogHeading: "Bring your conversations in.",
    dialogDesc: "Choose a source for export tips, then paste messages or select files you exported. What Did I Miss? does not connect directly to messaging accounts.",
    lblSourcePlatform: "Message source",
    optAutoDetect: "Auto-detect export format",
    optOtherChat: "Other chat export",
    btnChooseExportFiles: "Choose Export Files",
    lblConvTitle: "Conversation or group name",
    lblOptional: "(optional)",
    placeholderConvTitle: "e.g. Launch planning",
    lblPasteStep: "1. Paste messages",
    placeholderPasteInput: "Paste copied chat messages here. Timestamped WhatsApp/Telegram exports and “Name: message” lines are recognized. Multiline messages are kept together.",
    lblMentionKeywords: "Your name or mention keywords",
    placeholderMentionKeywords: "Enter only what you want highlighted",
    btnSample: "Try fictional sample",
    sampleNote: "Sample stays optional and is never preloaded.",
    lblImportStep: "2. Import chat export(s)",
    btnChooseFiles: "Choose Files",
    noFileChosen: "No file chosen",
    fileChosen: "file selected",
    filesChosen: "files selected",
    filePickerNote: "Works with saved WhatsApp, Telegram, Instagram, and Facebook Messenger exports: .txt, .json, .html, .csv, or ZIP. Drag & drop files here anytime.",
    dialogPrivacyNote: "Parsed and summarized in this browser. Files are never uploaded.",
    btnSummarizeMessages: "Summarize Messages",
    footerTagline: "Catch up. Focus on what matters.",
    footerPrivacy: "Parsed and summarized in this browser. No upload.",
    backToHome: "Back to Home",
    home: "Home",
    copyBriefing: "Copy briefing",
    markRead: "Mark read",
    markUnread: "Mark unread",
    summarizeAgain: "Summarize again",
    summarizing: "Summarizing…",
    remove: "Remove",
    briefingHeading: "WHAT YOU MISSED · AI CONVERSATION BRIEFING",
    importantMessagesHeading: "IMPORTANT MESSAGES",
    decisionsHeading: "DECISIONS MADE",
    actionsHeading: "ACTION ITEMS",
    questionsHeading: "QUESTIONS TO REVISIT",
    deadlinesHeading: "DEADLINES & URGENCY",
    mentionsHeading: "YOUR MENTIONS",
    noImportant: "No high-priority announcements identified.",
    noDecisions: "No explicit decisions identified.",
    noActions: "No explicit action items identified.",
    noQuestions: "No explicit questions identified.",
    readyToSummarize: "READY TO SUMMARIZE",
    readyToSummarizeDesc: "Messages were parsed securely on your device. Click below to generate your comprehensive AI conversation briefing.",
    toastSummaryCopied: "Briefing copied to clipboard",
    toastSummaryGenerated: "Summary generated locally",
    toastLanguageSwitched: "Language switched to",
    motionTagline: "Catch up. Focus on what matters.",
    skipIntro: "Skip Intro"
  },
  kn: {
    workspaceTitle: "ಕ್ಯಾಚ್ ಅಪ್",
    workspaceSubtitle: "ನಿಮ್ಮ ಸಂಭಾಷಣೆ ಕಾರ್ಯಕ್ಷೇತ್ರ",
    navWorkspace: "ನಿಮ್ಮ ಕಾರ್ಯಕ್ಷೇತ್ರ",
    navCatchUp: "ಕ್ಯಾಚ್ ಅಪ್",
    navUnread: "ಓದದಿರುವುದು",
    navMentions: "ಮೆನ್ಷನ್‌ಗಳು",
    navActions: "ಮಾಡಬೇಕಾದ ಕೆಲಸಗಳು",
    navHelp: "ಮಾರ್ಗದರ್ಶಿ & ಸಹಾಯ",
    navHowToUse: "ಬಳಕೆ ಮಾರ್ಗದರ್ಶಿ",
    navConversations: "ಸಂಭಾಷಣೆಗಳು",
    privacyTitle: "ಸಂಪೂರ್ಣ ಖಾಸಗಿ",
    privacyDesc: "ಸಂದೇಶಗಳನ್ನು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ವಿಶ್ಲೇಷಿಸಿ ಸಾರಾಂಶಗೊಳಿಸಲಾಗುತ್ತದೆ. ಯಾವುದನ್ನೂ ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದಿಲ್ಲ.",
    breadcrumbWorkspace: "ಕಾರ್ಯಕ್ಷೇತ್ರ",
    breadcrumbConversations: "ಎಲ್ಲಾ ಸಂಭಾಷಣೆಗಳು",
    replayMotion: "ಮೋಷನ್",
    howToUseGuide: "ಹೇಗೆ ಬಳಸುವುದು",
    localIndicator: "100% ಸ್ಥಳೀಯ",
    selectLanguageTitle: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    selectLanguageHint: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಪ್ರದರ್ಶನ ಭಾಷೆಯನ್ನು ಆರಿಸಿ.",
    menuHowToUse: "ಬಳಕೆ ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ",
    menuReplayIntro: "ಮೋಷನ್ ಇಂಟ್ರೋ ಮರುಪ್ಲೇ ಮಾಡಿ",
    welcomeEyebrow: "ನಿಮ್ಮ ದೈನಂದಿನ ಕ್ಯಾಚ್-ಅಪ್",
    welcomeH1Part1: "ತಿಳಿದುಕೊಳ್ಳಿ.",
    welcomeH1Part2: "ಮುಖ್ಯವಾದುದರ ಮೇಲೆ ಗಮನಹರಿಸಿ.",
    welcomeDesc: "ನಿಮ್ಮ ಸಂಭಾಷಣೆಗಳ ಸಾರಾಂಶ, ನಿಖರವಾಗಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿ.",
    firstLaunchKicker: "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಸಂಭಾಷಣೆ ಬ್ರೀಫಿಂಗ್",
    firstLaunchTitle: "ವಾಟ್ ಡಿಡ್ ಐ ಮಿಸ್?",
    firstLaunchDesc: "ಸಂಭಾಷಣೆಗಳು ವೇಗವಾಗಿ ಸಾಗುತ್ತವೆ. ಪ್ರತಿಯೊಂದು ಸಂದೇಶವನ್ನು ಓದದೆಯೇ ಮುಖ್ಯವಾದುದನ್ನು ಸುಲಭವಾಗಿ ತಿಳಿಯಿರಿ.",
    capUpdates: "✦ ಮುಖ್ಯ ಅಪ್‌ಡೇಟ್‌ಗಳು",
    capDecisions: "✓ ನಿರ್ಧಾರಗಳು ಮತ್ತು ಪ್ರಕಟಣೆಗಳು",
    capTasks: "↗ ಕೆಲಸಗಳು ಮತ್ತು ಡೆಡ್‌ಲೈನ್‌ಗಳು",
    capQuestions: "? ಉತ್ತರ ಅಗತ್ಯವಿರುವ ಪ್ರಶ್ನೆಗಳು",
    firstLaunchPrivacy: "ಸಂಪೂರ್ಣ ಖಾಸಗಿ · ಸಂದೇಶಗಳನ್ನು ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ, ಅಪ್‌ಲೋಡ್ ಆಗುವುದಿಲ್ಲ.",
    btnImportConversations: "ಸಂಭಾಷಣೆಗಳನ್ನು ಇಂಪೋರ್ಟ್ ಮಾಡಿ",
    btnPasteMessages: "ಸಂದೇಶಗಳನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ",
    welcomeGuideLink: "ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮಾಡಲು ಸಹಾಯ ಬೇಕೇ? ಬಳಕೆ ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ →",
    summaryIntroStrong: "ನಿಮ್ಮ ಕ್ಯಾಚ್-ಅಪ್, ಒಂದು ನೋಟದಲ್ಲಿ",
    summaryIntroCaption: "ನಿಮ್ಮ ಇಂಪೋರ್ಟ್ ಮಾಡಿದ ಸಂಭಾಷಣೆಗಳ ಸಾರಾಂಶ ಇಲ್ಲಿದೆ.",
    statCatchUp: "ಓದಬೇಕಾದ<br>ಸಂಭಾಷಣೆಗಳು",
    statActions: "ಗುರುತಿಸಲಾದ<br>ಕೆಲಸಗಳು",
    statMentions: "ನೇರ<br>ಮೆನ್ಷನ್‌ಗಳು",
    inboxKicker: "ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್",
    inboxHeading: "ಸಂಭಾಷಣೆಗಳು",
    filterAll: "ಎಲ್ಲಾ",
    filterUnread: "ಓದದಿರುವುದು",
    filterMentions: "ಮೆನ್ಷನ್‌ಗಳು",
    filterActions: "ಕೆಲಸಗಳಿರುವ ಸಂದೇಶಗಳು",
    lblSender: "ಕಳುಹಿಸಿದವರು",
    optAllSenders: "ಎಲ್ಲಾ ಕಳುಹಿಸಿದವರು",
    lblPriority: "ಆದ್ಯತೆ",
    optAllPriority: "ಎಲ್ಲಾ ಆದ್ಯತೆಗಳು",
    optHigh: "ಹೆಚ್ಚಿನ ಆದ್ಯತೆ (High)",
    optMedium: "ಮಧ್ಯಮ ಆದ್ಯತೆ (Medium)",
    optLow: "ಕಡಿಮೆ ಆದ್ಯತೆ (Low)",
    searchPlaceholder: "ಸಂಭಾಷಣೆಗಳನ್ನು ಹುಡುಕಿ",
    dialogKicker: "ಖಾಸಗಿ, ಆನ್-ಡಿವೈಸ್ ಇಂಪೋರ್ಟ್",
    dialogHeading: "ನಿಮ್ಮ ಸಂಭಾಷಣೆಗಳನ್ನು ತನ್ನಿ.",
    dialogDesc: "ಸಲಹೆಗಳಿಗಾಗಿ ಮೂಲವನ್ನು ಆರಿಸಿ, ನಂತರ ಸಂದೇಶಗಳನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ ಅಥವಾ ಫೈಲ್‌ಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    lblSourcePlatform: "ಸಂದೇಶ ಮೂಲ",
    optAutoDetect: "ಸ್ವಯಂ ಪತ್ತೆಹಚ್ಚುವಿಕೆ (Auto-detect)",
    optOtherChat: "ಇತರೆ ಚಾಟ್ ಎಕ್ಸ್‌ಪೋರ್ಟ್",
    btnChooseExportFiles: "ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಫೈಲ್‌ಗಳನ್ನು ಆರಿಸಿ",
    lblConvTitle: "ಸಂಭಾಷಣೆ ಅಥವಾ ಗುಂಪಿನ ಹೆಸರು",
    lblOptional: "(ಐಚ್ಛಿಕ)",
    placeholderConvTitle: "ಉದಾ: ಯೋಜನೆ ಚರ್ಚೆ",
    lblPasteStep: "1. ಸಂದೇಶಗಳನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ",
    placeholderPasteInput: "ಕಾಪಿ ಮಾಡಿದ ಚಾಟ್ ಸಂದೇಶಗಳನ್ನು ಇಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ. ವಾಟ್ಸಾಪ್/ಟೆಲಿಗ್ರಾಂ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮತ್ತು ಸಾಲುಗಳು ಸುಲಭವಾಗಿ ವಿಶ್ಲೇಷಣೆಗೊಳ್ಳುತ್ತವೆ.",
    lblMentionKeywords: "ನಿಮ್ಮ ಹೆಸರು ಅಥವಾ ಕೀವರ್ಡ್‌ಗಳು",
    placeholderMentionKeywords: "ಹೈಲೈಟ್ ಮಾಡಬೇಕಾದ ಪದಗಳನ್ನು ನಮೂದಿಸಿ",
    btnSample: "ಮಾದರಿ ಸಂಭಾಷಣೆ ಪ್ರಯತ್ನಿಸಿ",
    sampleNote: "ಮಾದರಿ ಐಚ್ಛಿಕವಾಗಿದ್ದು, ಎಂದಿಗೂ ಮೊದಲೇ ಲೋಡ್ ಆಗುವುದಿಲ್ಲ.",
    lblImportStep: "2. ಚಾಟ್ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಫೈಲ್ ಇಂಪೋರ್ಟ್ ಮಾಡಿ",
    btnChooseFiles: "ಫೈಲ್‌ಗಳನ್ನು ಆರಿಸಿ",
    noFileChosen: "ಯಾವುದೇ ಫೈಲ್ ಆಯ್ಕೆಯಾಗಿಲ್ಲ",
    fileChosen: "ಫೈಲ್ ಆಯ್ಕೆಯಾಗಿದೆ",
    filesChosen: "ಫೈಲ್‌ಗಳು ಆಯ್ಕೆಯಾಗಿವೆ",
    filePickerNote: "ವಾಟ್ಸಾಪ್, ಟೆಲಿಗ್ರಾಂ, ಇನ್‌ಸ್ಟಾಗ್ರಾಂ, ಫೇಸ್‌ಬುಕ್ ಮೆಸೆಂಜರ್ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಬೆಂಬಲಿಸುತ್ತದೆ (.txt, .json, .html, .csv, ಅಥವಾ .zip).",
    dialogPrivacyNote: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತದೆ. ಫೈಲ್‌ಗಳನ್ನು ಎಲ್ಲಿಗೂ ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದಿಲ್ಲ.",
    btnSummarizeMessages: "ಸಾರಾಂಶ ತಯಾರಿಸಿ",
    footerTagline: "ತಿಳಿದುಕೊಳ್ಳಿ. ಮುಖ್ಯವಾದುದರ ಮೇಲೆ ಗಮನಹರಿಸಿ.",
    footerPrivacy: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ವಿಶ್ಲೇಷಿಸಿ ಸಾರಾಂಶಗೊಳಿಸಲಾಗಿದೆ. ಅಪ್‌ಲೋಡ್ ಇಲ್ಲ.",
    backToHome: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    home: "ಮುಖಪುಟ",
    copyBriefing: "ಸಾರಾಂಶ ಕಾಪಿ ಮಾಡಿ",
    markRead: "ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
    markUnread: "ಓದಲಾಗಿಲ್ಲ ಎಂದು ಗುರುತಿಸಿ",
    summarizeAgain: "ಮತ್ತೆ ಸಾರಾಂಶ ತಯಾರಿಸಿ",
    summarizing: "ಸಾರಾಂಶ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…",
    remove: "ತೆಗೆದುಹಾಕಿ",
    briefingHeading: "ನೀವು ಮಿಸ್ ಮಾಡಿಕೊಂಡಿದ್ದು · AI ಸಂಭಾಷಣೆ ಸಾರಾಂಶ",
    importantMessagesHeading: "ಪ್ರಮುಖ ಸಂದೇಶಗಳು",
    decisionsHeading: "ತೆಗೆದುಕೊಂಡ ನಿರ್ಧಾರಗಳು",
    actionsHeading: "ಮಾಡಬೇಕಾದ ಕೆಲಸಗಳು",
    questionsHeading: "ಪ್ರಮುಖ ಪ್ರಶ್ನೆಗಳು",
    deadlinesHeading: "ಡೆಡ್‌ಲೈನ್‌ಗಳು & ತುರ್ತು",
    mentionsHeading: "ನಿಮ್ಮ ಮೆನ್ಷನ್‌ಗಳು",
    noImportant: "ಯಾವುದೇ ಹೆಚ್ಚಿನ ಆದ್ಯತೆಯ ಪ್ರಕಟಣೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    noDecisions: "ಯಾವುದೇ ಸ್ಪಷ್ಟ ನಿರ್ಧಾರಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    noActions: "ಯಾವುದೇ ಸ್ಪಷ್ಟ ಕೆಲಸಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    noQuestions: "ಯಾವುದೇ ಸ್ಪಷ್ಟ ಪ್ರಶ್ನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    readyToSummarize: "ಸಾರಾಂಶಕ್ಕೆ ಸಿದ್ಧವಾಗಿದೆ",
    readyToSummarizeDesc: "ಸಂದೇಶಗಳನ್ನು ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಪಾರ್ಸ್ ಮಾಡಲಾಗಿದೆ. AI ಸಾರಾಂಶವನ್ನು ರಚಿಸಲು ಕೆಳಗೆ ಕ್ಲಿಕ್ ಮಾಡಿ.",
    toastSummaryCopied: "ಸಾರಾಂಶವನ್ನು ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ಕಾಪಿ ಮಾಡಲಾಗಿದೆ",
    toastSummaryGenerated: "ಸ್ಥಳೀಯವಾಗಿ ಸಾರಾಂಶ ಸಿದ್ಧಗೊಂಡಿದೆ",
    toastLanguageSwitched: "ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಲಾಗಿದೆ:",
    motionTagline: "ತಿಳಿದುಕೊಳ್ಳಿ. ಮುಖ್ಯವಾದುದರ ಮೇಲೆ ಗಮನಹರಿಸಿ.",
    skipIntro: "ಇಂಟ್ರೋ ಬಿಟ್ಟುಬಿಡಿ"
  },
  hi: {
    workspaceTitle: "कैच अप",
    workspaceSubtitle: "आपका बातचीत कार्यक्षेत्र",
    navWorkspace: "आपका कार्यक्षेत्र",
    navCatchUp: "कैच अप",
    navUnread: "अपठित",
    navMentions: "मेंशन",
    navActions: "कार्य सूचियां",
    navHelp: "गाइड और सहायता",
    navHowToUse: "उपयोग गाइड",
    navConversations: "बातचीत",
    privacyTitle: "पूरी तरह सुरक्षित",
    privacyDesc: "संदेशों का विश्लेषण इसी ब्राउज़र में किया जाता है। कुछ भी अपलोड नहीं होता।",
    breadcrumbWorkspace: "कार्यक्षेत्र",
    breadcrumbConversations: "सभी बातचीत",
    replayMotion: "मोशन",
    howToUseGuide: "कैसे उपयोग करें",
    localIndicator: "100% लोकल",
    selectLanguageTitle: "भाषा चुनें",
    selectLanguageHint: "अपनी पसंदीदा प्रदर्शन भाषा चुनें।",
    menuHowToUse: "उपयोग गाइड देखें",
    menuReplayIntro: "इंट्रो मोशन दोबारा चलाएं",
    welcomeEyebrow: "आपका दैनिक कैच-अप",
    welcomeH1Part1: "अपडेट रहें।",
    welcomeH1Part2: "जो ज़रूरी है उस पर ध्यान दें।",
    welcomeDesc: "आपकी बातचीत का सटीक और विचारशील सार।",
    firstLaunchKicker: "आपकी व्यक्तिगत बातचीत ब्रीफिंग",
    firstLaunchTitle: "व्हाट डिड आई मिस?",
    firstLaunchDesc: "बातचीत तेज़ी से आगे बढ़ती है। हर संदेश पढ़े बिना ज़रूरी बातों को आसानी से समझें।",
    capUpdates: "✦ महत्वपूर्ण अपडेट्स",
    capDecisions: "✓ निर्णय और घोषणाएं",
    capTasks: "↗ कार्य और समय सीमाएं",
    capQuestions: "? उत्तर की आवश्यकता वाले प्रश्न",
    firstLaunchPrivacy: "सुरक्षित डिज़ाइन · आपके संदेश इसी ब्राउज़र में प्रोसेस होते हैं और अपलोड नहीं किए जाते।",
    btnImportConversations: "बातचीत आयात करें",
    btnPasteMessages: "संदेश पेस्ट करें",
    welcomeGuideLink: "चैट निर्यात करने में मदद चाहिए? उपयोग गाइड देखें →",
    summaryIntroStrong: "आपकी बातचीत का सार, एक नज़र में",
    summaryIntroCaption: "आपकी आयातित बातचीत, स्थानीय रूप से संक्षेपित।",
    statCatchUp: "पढ़ने योग्य<br>बातचीत",
    statActions: "पहचाने गए<br>कार्य",
    statMentions: "सीधे<br>मेंशन",
    inboxKicker: "आपका इनबॉक्स",
    inboxHeading: "बातचीत",
    filterAll: "सभी",
    filterUnread: "अपठित",
    filterMentions: "मेंशन",
    filterActions: "कार्यों के साथ",
    lblSender: "भेजने वाला",
    optAllSenders: "सभी भेजने वाले",
    lblPriority: "प्राथमिकता",
    optAllPriority: "सभी प्राथमिकताएं",
    optHigh: "उच्च",
    optMedium: "मध्यम",
    optLow: "कम",
    searchPlaceholder: "बातचीत खोजें",
    dialogKicker: "निजी, डिवाइस पर ही आयात",
    dialogHeading: "अपनी बातचीत यहां लाएं।",
    dialogDesc: "सुझावों के लिए स्रोत चुनें, फिर संदेश पेस्ट करें या निर्यात की गई फ़ाइलें चुनें।",
    lblSourcePlatform: "संदेश का स्रोत",
    optAutoDetect: "स्वचालित पहचान (Auto-detect)",
    optOtherChat: "अन्य चैट निर्यात",
    btnChooseExportFiles: "निर्यात फ़ाइलें चुनें",
    lblConvTitle: "बातचीत या समूह का नाम",
    lblOptional: "(वैकल्पिक)",
    placeholderConvTitle: "उदा. प्रोजेक्ट प्लानिंग",
    lblPasteStep: "1. संदेश पेस्ट करें",
    placeholderPasteInput: "कॉपी किए गए संदेश यहाँ पेस्ट करें। व्हाट्सएप/टेलीग्राम निर्यात और सामान्य पंक्तियाँ समर्थित हैं।",
    lblMentionKeywords: "आपका नाम या कीवर्ड",
    placeholderMentionKeywords: "केवल वही दर्ज करें जिसे आप हाइलाइट करना चाहते हैं",
    btnSample: "काल्पनिक नमूना आज़माएं",
    sampleNote: "नमूना वैकल्पिक है और कभी भी पहले से लोड नहीं होता।",
    lblImportStep: "2. चैट निर्यात फ़ाइल आयात करें",
    btnChooseFiles: "फ़ाइलें चुनें",
    noFileChosen: "कोई फ़ाइल नहीं चुनी गई",
    fileChosen: "फ़ाइल चुनी गई",
    filesChosen: "फ़ाइलें चुनी गईं",
    filePickerNote: "व्हाट्सएप, टेलीग्राम, इंस्टाग्राम और मैसेंजर निर्यात का समर्थन करता है (.txt, .json, .html, .csv, या .zip)।",
    dialogPrivacyNote: "इसी ब्राउज़र में विश्लेषण किया जाता है। फ़ाइलें कभी अपलोड नहीं होतीं।",
    btnSummarizeMessages: "संदेशों का सारांश बनाएं",
    footerTagline: "अपडेट रहें। जो ज़रूरी है उस पर ध्यान दें।",
    footerPrivacy: "ब्राउज़र में संक्षेपित। कोई अपलोड नहीं।",
    backToHome: "होम पर वापस जाएं",
    home: "होम",
    copyBriefing: "ब्रीफिंग कॉपी करें",
    markRead: "पढ़ा हुआ चिह्नित करें",
    markUnread: "अपठित चिह्नित करें",
    summarizeAgain: "फिर से संक्षेप करें",
    summarizing: "संक्षेपण जारी है…",
    remove: "हटाएं",
    briefingHeading: "आपसे क्या छूटा · AI बातचीत ब्रीफिंग",
    importantMessagesHeading: "महत्वपूर्ण संदेश",
    decisionsHeading: "लिए गए निर्णय",
    actionsHeading: "कार्य सूचियां",
    questionsHeading: "पुनर्विचार योग्य प्रश्न",
    deadlinesHeading: "समय सीमा और तात्कालिकता",
    mentionsHeading: "आपके मेंशन",
    noImportant: "कोई उच्च प्राथमिकता वाली घोषणाएं नहीं मिलीं।",
    noDecisions: "कोई स्पष्ट निर्णय नहीं मिला।",
    noActions: "कोई स्पष्ट कार्य सूची नहीं मिली।",
    noQuestions: "कोई स्पष्ट प्रश्न नहीं मिला।",
    readyToSummarize: "संक्षेप के लिए तैयार",
    readyToSummarizeDesc: "संदेश आपके डिवाइस पर सुरक्षित रूप से विश्लेषित किए गए। एआई सारांश बनाने के लिए नीचे क्लिक करें।",
    toastSummaryCopied: "ब्रीफिंग क्लिपबोर्ड पर कॉपी हो गई",
    toastSummaryGenerated: "सारांश स्थानीय रूप से तैयार किया गया",
    toastLanguageSwitched: "भाषा बदल दी गई:",
    motionTagline: "अपडेट रहें। जो ज़रूरी है उस पर ध्यान दें।",
    skipIntro: "स्किप करें"
  },
  te: {
    workspaceTitle: "క్యాచ్ అప్",
    workspaceSubtitle: "మీ సంభాషణల వర్క్‌స్పేస్",
    navWorkspace: "మీ వర్క్‌స్పేస్",
    navCatchUp: "క్యాచ్ అప్",
    navUnread: "చదవనివి",
    navMentions: "మెన్షన్లు",
    navActions: "చేయవలసిన పనులు",
    navHelp: "గైడ్‌లు & సహాయం",
    navHowToUse: "ఎలా ఉపయోగించాలో గైడ్",
    navConversations: "సంభాషణలు",
    privacyTitle: "పూర్తిగా గోప్యమైనది",
    privacyDesc: "సందేశాలు ఈ బ్రౌజర్‌లోనే విశ్లేషించబడతాయి. ఏదీ అప్‌లోడ్ చేయబడదు.",
    breadcrumbWorkspace: "వర్క్‌స్పేస్",
    breadcrumbConversations: "అన్ని సంభాషణలు",
    replayMotion: "మోషన్",
    howToUseGuide: "ఎలా ఉపయోగించాలి",
    localIndicator: "100% లోకల్",
    selectLanguageTitle: "భాషను ఎంచుకోండి",
    selectLanguageHint: "మీ ప్రాధాన్య ప్రదర్శన భాషను ఎంచుకోండి.",
    menuHowToUse: "ఉపయోగ గైడ్ చూడండి",
    menuReplayIntro: "ఇంట్రో మోషన్ రీప్లే చేయండి",
    welcomeEyebrow: "మీ రోజువారీ క్యాచ్-అప్",
    welcomeH1Part1: "తెలుసుకోండి.",
    welcomeH1Part2: "ముఖ్యాంశాలపై దృష్టి పెట్టండి.",
    welcomeDesc: "మీ సంభాషణల సారాంశం, స్పష్టంగా.",
    firstLaunchKicker: "మీ వ్యక్తిగత సంభాషణ బ్రీఫింగ్",
    firstLaunchTitle: "వాట్ డిడ్ ఐ మిస్?",
    firstLaunchDesc: "సంభాషణలు వేగంగా సాగుతాయి. ప్రతి సందేశాన్ని చదవకుండానే ముఖ్యమైన విషయాలు తెలుసుకోండి.",
    capUpdates: "✦ ముఖ్యమైన అప్‌డేట్‌లు",
    capDecisions: "✓ నిర్ణయాలు మరియు ప్రకటనలు",
    capTasks: "↗ పనులు మరియు డెడ్‌లైన్లు",
    capQuestions: "? సమాధానాలు అవసరమైన ప్రశ్నలు",
    firstLaunchPrivacy: "గోప్యత ముఖ్యం · మీ సందేశాలు ఈ బ్రౌజర్‌లోనే ప్రాసెస్ చేయబడతాయి, అప్‌లోడ్ చేయబడవు.",
    btnImportConversations: "సంభాషణలను దిగుమతి చేయండి",
    btnPasteMessages: "సందేశాలను అతికించండి",
    welcomeGuideLink: "ఎక్స్‌పోర్ట్ చేయడంలో సహాయం కావాలా? గైడ్ చూడండి →",
    summaryIntroStrong: "మీ క్యాచ్-అప్, ఒక్క చూపులో",
    summaryIntroCaption: "దిగుమతి చేసిన సంభాషణలు, స్థానికంగా సంగ్రహించబడ్డాయి.",
    statCatchUp: "చూడవలసిన<br>సంభాషణలు",
    statActions: "గుర్తించిన<br>పనులు",
    statMentions: "ప్రత్యక్ష<br>మెన్షన్లు",
    inboxKicker: "మీ ఇన్‌బాక్స్",
    inboxHeading: "సంభాషణలు",
    filterAll: "అన్నీ",
    filterUnread: "చదవనివి",
    filterMentions: "మెన్షన్లు",
    filterActions: "పనులు ఉన్నవి",
    lblSender: "పంపినవారు",
    optAllSenders: "అందరు పంపినవారు",
    lblPriority: "ప్రాధాన్యత",
    optAllPriority: "అన్ని ప్రాధాన్యతలు",
    optHigh: "ఎక్కువ",
    optMedium: "మధ్యస్థం",
    optLow: "తక్కువ",
    searchPlaceholder: "సంభాషణలను శోధించండి",
    dialogKicker: "గోప్యమైన ఆన్-డివైస్ దిగుమతి",
    dialogHeading: "మీ సంభాషణలను తీసుకురండి.",
    dialogDesc: "సందేశాలను అతికించండి లేదా ఫైల్‌లను ఎంచుకోండి.",
    lblSourcePlatform: "సందేశ మూలం",
    optAutoDetect: "స్వయంచాలక గుర్తింపు",
    optOtherChat: "ఇతర చాట్ ఎగుమతి",
    btnChooseExportFiles: "ఎగుమతి చేసిన ఫైల్‌లను ఎంచుకోండి",
    lblConvTitle: "సంభాషణ లేదా సమూహం పేరు",
    lblOptional: "(ఐచ్ఛికం)",
    placeholderConvTitle: "ఉదా: ప్రాజెక్ట్ ప్లానింగ్",
    lblPasteStep: "1. సందేశాలను అతికించండి",
    placeholderPasteInput: "కాపీ చేసిన సందేశాలను ఇక్కడ అతికించండి.",
    lblMentionKeywords: "మీ పేరు లేదా కీలకపదాలు",
    placeholderMentionKeywords: "హైలైట్ చేయాలనుకుంటున్నవి మాత్రమే నమోదు చేయండి",
    btnSample: "నమూనా సంభాషణ ప్రయత్నించండి",
    sampleNote: "నమూనా ఐచ్ఛికం, ఎప్పుడూ ప్రీలోడ్ చేయబడదు.",
    lblImportStep: "2. చాట్ ఎగుమతిని దిగుమతి చేయండి",
    btnChooseFiles: "ఫైల్‌లను ఎంచుకోండి",
    noFileChosen: "ఏ ఫైల్ ఎంపిక కాలేదు",
    fileChosen: "ఫైల్ ఎంపికైంది",
    filesChosen: "ఫైళ్లు ఎంపికయ్యాయి",
    filePickerNote: "వాట్సాప్, టెలిగ్రామ్, ఇన్‌స్టాగ్రామ్, మెసెంజర్ ఎగుమతులతో పనిచేస్తుంది.",
    dialogPrivacyNote: "ఈ బ్రౌజర్‌లోనే విశ్లేషించబడుతుంది. ఫైళ్లు అప్‌లోడ్ కావు.",
    btnSummarizeMessages: "సారాంశాన్ని రూపొందించండి",
    footerTagline: "తెలుసుకోండి. ముఖ్యాంశాలపై దృష్టి పెట్టండి.",
    footerPrivacy: "బ్రౌజర్‌లోనే విశ్లేషణ. అప్‌లోడ్ లేదు.",
    backToHome: "హోమ్‌కు తిరిగి వెళ్లండి",
    home: "హోమ్",
    copyBriefing: "బ్రీఫింగ్‌ను కాపీ చేయండి",
    markRead: "చదివినట్లు గుర్తించండి",
    markUnread: "చదవనట్లు గుర్తించండి",
    summarizeAgain: "మళ్ళీ సారాంశం చేయండి",
    summarizing: "సంగ్రహించడం జరుగుతోంది…",
    remove: "తొలగించండి",
    briefingHeading: "మీరు మిస్ అయినవి · AI సంభాషణ బ్రీఫింగ్",
    importantMessagesHeading: "ముఖ్యమైన సందేశాలు",
    decisionsHeading: "తీసుకున్న నిర్ణయాలు",
    actionsHeading: "చేయవలసిన పనులు",
    questionsHeading: "పరిశీలించవలసిన ప్రశ్నలు",
    deadlinesHeading: "డెడ్‌లైన్లు & అత్యవసరం",
    mentionsHeading: "మీ ప్రస్తావనలు",
    noImportant: "ముఖ్యమైన ప్రకటనలు ఏవీ గుర్తించబడలేదు.",
    noDecisions: "స్పష్టమైన నిర్ణయాలు ఏవీ గుర్తించబడలేదు.",
    noActions: "పనులు ఏవీ గుర్తించబడలేదు.",
    noQuestions: "ప్రశ్నలు ఏవీ గుర్తించబడలేదు.",
    readyToSummarize: "సారాంశానికి సిద్ధంగా ఉంది",
    readyToSummarizeDesc: "సందేశాలు మీ పరికరంలో సురక్షితంగా విశ్లేషించబడ్డాయి. AI సారాంశాన్ని రూపొందించడానికి క్రింద క్లిక్ చేయండి.",
    toastSummaryCopied: "బ్రీఫింగ్ క్లిప్‌బోర్డ్‌కి కాపీ చేయబడింది",
    toastSummaryGenerated: "సారాంశం స్థానికంగా రూపొందించబడింది",
    toastLanguageSwitched: "భాష మార్చబడింది:",
    motionTagline: "తెలుసుకోండి. ముఖ్యాంశాలపై దృష్టి పెట్టండి.",
    skipIntro: "స్కిప్ చేయండి"
  },
  ta: {
    workspaceTitle: "கேட்ச் அப்",
    workspaceSubtitle: "உங்கள் உரையாடல் பணியிடம்",
    navWorkspace: "உங்கள் பணியிடம்",
    navCatchUp: "கேட்ச் அப்",
    navUnread: "படிக்காதவை",
    navMentions: "குறிப்பிடுதல்கள்",
    navActions: "செயல்பாடுகள்",
    navHelp: "வழிகாட்டிகள் & உதவி",
    navHowToUse: "பயன்பாட்டு வழிகாட்டி",
    navConversations: "உரையாடல்கள்",
    privacyTitle: "முழுதும் தனிப்பட்டது",
    privacyDesc: "செய்திகள் இந்த உலாவியிலேயே சுருக்கப்படுகின்றன. எதுவும் பதிவேற்றப்படுவதில்லை.",
    breadcrumbWorkspace: "பணியிடம்",
    breadcrumbConversations: "அனைத்து உரையாடல்கள்",
    replayMotion: "இயக்கம்",
    howToUseGuide: "எப்படி பயன்படுத்துவது",
    localIndicator: "100% உள்ளூர்",
    selectLanguageTitle: "மொழியைத் தேர்ந்தெடுக்கவும்",
    selectLanguageHint: "உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்.",
    menuHowToUse: "வழிகாட்டியைப் பார்க்கவும்",
    menuReplayIntro: "அறிமுக இயக்கத்தை மீண்டும் பார்க்கவும்",
    welcomeEyebrow: "உங்கள் தினசரி சுருக்கம்",
    welcomeH1Part1: "அறிந்து கொள்ளுங்கள்.",
    welcomeH1Part2: "முக்கியமானவற்றில் கவனம் செலுத்துங்கள்.",
    welcomeDesc: "உங்கள் உரையாடல்களின் தெளிவான சுருக்கம்.",
    firstLaunchKicker: "உங்கள் உரையாடல் சுருக்கம்",
    firstLaunchTitle: "வாட் டிட் ஐ மிஸ்?",
    firstLaunchDesc: "ஒவ்வொரு செய்தியையும் படிக்காமல் முக்கியமானவற்றை விரைவாக அறிந்து கொள்ளுங்கள்.",
    capUpdates: "✦ முக்கியமான புதுப்பிப்புகள்",
    capDecisions: "✓ முடிவுகள் & அறிவிப்புகள்",
    capTasks: "↗ பணிகள் மற்றும் காலக்கெடு",
    capQuestions: "? பதிலளிக்க வேண்டிய கேள்விகள்",
    firstLaunchPrivacy: "முழுதும் தனிப்பட்டது · செய்திகள் இந்த உலாவியிலேயே கையாளப்படுகின்றன.",
    btnImportConversations: "உரையாடல்களை இறக்குமதி செய்க",
    btnPasteMessages: "செய்திகளை ஒட்டவும்",
    welcomeGuideLink: "உதவி தேவையா? வழிகாட்டியைப் பார்க்கவும் →",
    summaryIntroStrong: "உங்கள் சுருக்கம், ஒரே பார்வையில்",
    summaryIntroCaption: "உள்ளூரிலேயே சுருக்கப்பட்ட உரையாடல்கள்.",
    statCatchUp: "தெரிந்துகொள்ள வேண்டிய<br>உரையாடல்கள்",
    statActions: "கண்டறியப்பட்ட<br>செயல்கள்",
    statMentions: "நேரடி<br>குறிப்பிடுதல்கள்",
    inboxKicker: "உங்கள் இன்பாக்ஸ்",
    inboxHeading: "உரையாடல்கள்",
    filterAll: "அனைத்தும்",
    filterUnread: "படிக்காதவை",
    filterMentions: "குறிப்பிடுதல்கள்",
    filterActions: "செயல்பாடுகளுடன்",
    lblSender: "அனுப்பியவர்",
    optAllSenders: "அனைத்து அனுப்புநர்கள்",
    lblPriority: "முன்னுரிமை",
    optAllPriority: "அனைத்து முன்னுரிமைகளும்",
    optHigh: "உயர்",
    optMedium: "நடுத்தர",
    optLow: "குறைந்த",
    searchPlaceholder: "உரையாடல்களைத் தேடுக",
    dialogKicker: "தனிப்பட்ட இறக்குமதி",
    dialogHeading: "உங்கள் உரையாடல்களைக் கொண்டு வாருங்கள்.",
    dialogDesc: "செய்திகளை ஒட்டவும் அல்லது ஏற்றுமதி செய்யப்பட்ட கோப்புகளைத் தேர்ந்தெடுக்கவும்.",
    lblSourcePlatform: "செய்தி ஆதாரம்",
    optAutoDetect: "தானியங்கி கண்டறிதல்",
    optOtherChat: "பிற சாட் ஏற்றுமதி",
    btnChooseExportFiles: "கோப்புகளைத் தேர்வு செய்க",
    lblConvTitle: "குழுவின் பெயர்",
    lblOptional: "(விருப்பமானது)",
    placeholderConvTitle: "எ.கா: திட்டமிடல்",
    lblPasteStep: "1. செய்திகளை ஒட்டவும்",
    placeholderPasteInput: "நகலெடுக்கப்பட்ட செய்திகளை இங்கே ஒட்டவும்.",
    lblMentionKeywords: "உங்கள் பெயர் அல்லது குறிச்சொற்கள்",
    placeholderMentionKeywords: "முக்கியப்படுத்தப்பட வேண்டியவற்றை உள்ளிடவும்",
    btnSample: "மாதிரி உரையாடலை முயற்சிக்கவும்",
    sampleNote: "மாதிரி விருப்பமானது, முன்பே ஏற்றப்படாது.",
    lblImportStep: "2. சாட் கோப்பை இறக்குமதி செய்க",
    btnChooseFiles: "கோப்புகளைத் தேர்வு செய்க",
    noFileChosen: "கோப்பு எதுவும் தேர்ந்தெடுக்கப்படவில்லை",
    fileChosen: "கோப்பு தேர்ந்தெடுக்கப்பட்டது",
    filesChosen: "கோப்புகள் தேர்ந்தெடுக்கப்பட்டன",
    filePickerNote: "வாட்ஸ்அப், டெலிகிராம், இன்ஸ்டாகிராம் ஆகியவற்றின் கோப்புகளை ஆதரிக்கிறது.",
    dialogPrivacyNote: "இந்த உலாவியிலேயே கையாளப்படுகிறது. கோப்புகள் பதிவேற்றப்படாது.",
    btnSummarizeMessages: "சுருக்கத்தை உருவாக்கு",
    footerTagline: "அறிந்து கொள்ளுங்கள். முக்கியமானவற்றில் கவனம் செலுத்துங்கள்.",
    footerPrivacy: "உலாவியிலேயே சுருக்கப்பட்டது. பதிவேற்றம் இல்லை.",
    backToHome: "முகப்புக்குத் திரும்பு",
    home: "முகப்பு",
    copyBriefing: "சுருக்கத்தை நகலெடு",
    markRead: "படித்ததாகக் குறிக்கவும்",
    markUnread: "படிக்காததாகக் குறிக்கவும்",
    summarizeAgain: "மீண்டும் சுருக்கவும்",
    summarizing: "சுருக்கம் தயாராகிறது…",
    remove: "நீக்கு",
    briefingHeading: "நீங்கள் தவறவிட்டவை · AI உரையாடல் சுருக்கம்",
    importantMessagesHeading: "முக்கியமான செய்திகள்",
    decisionsHeading: "எடுக்கப்பட்ட முடிவுகள்",
    actionsHeading: "செயல்பாடுகள்",
    questionsHeading: "மறுபரிசீலனை செய்ய வேண்டிய கேள்விகள்",
    deadlinesHeading: "காலக்கெடு & அவசரம்",
    mentionsHeading: "உங்கள் குறிப்புகள்",
    noImportant: "அறிவிப்புகள் எதுவும் இல்லை.",
    noDecisions: "முடிவுகள் எதுவும் இல்லை.",
    noActions: "செயல்கள் எதுவும் இல்லை.",
    noQuestions: "கேள்விகள் எதுவும் இல்லை.",
    readyToSummarize: "சுருக்கத் தயார்",
    readyToSummarizeDesc: "செய்திகள் பாதுகாப்பாக ஆய்வு செய்யப்பட்டுள்ளன. சுருக்கம் பெற கீழே கிளிக் செய்க.",
    toastSummaryCopied: "சுருக்கம் நகலெடுக்கப்பட்டது",
    toastSummaryGenerated: "சுருக்கம் உருவாக்கப்பட்டது",
    toastLanguageSwitched: "மொழி மாற்றப்பட்டது:",
    motionTagline: "அறிந்து கொள்ளுங்கள். முக்கியமானவற்றில் கவனம் செலுத்துங்கள்.",
    skipIntro: "தவிர்"
  },
  ml: {
    workspaceTitle: "ക്യാച്ച് അപ്പ്",
    workspaceSubtitle: "നിങ്ങളുടെ സംഭാഷണ വർക്ക്‌സ്‌പേസ്",
    navWorkspace: "നിങ്ങളുടെ വർക്ക്‌സ്‌പേസ്",
    navCatchUp: "ക്യാച്ച് അപ്പ്",
    navUnread: "വായിക്കാത്തവ",
    navMentions: "മെൻഷനുകൾ",
    navActions: "ചെയ്യേണ്ട കാര്യങ്ങൾ",
    navHelp: "സഹായവും വഴികാട്ടിയും",
    navHowToUse: "ഉപയോഗിക്കേണ്ട വിധം",
    navConversations: "സംഭാഷണങ്ങൾ",
    privacyTitle: "പൂർണ്ണമായും സ്വകാര്യം",
    privacyDesc: "സന്ദേശങ്ങൾ ഈ ബ്രൗസറിൽ തന്നെ വിശകലനം ചെയ്യുന്നു. ഒന്നും അപ്‌ലോഡ് ചെയ്യുന്നില്ല.",
    breadcrumbWorkspace: "വർക്ക്‌സ്‌പേസ്",
    breadcrumbConversations: "എല്ലാ സംഭാഷണങ്ങളും",
    replayMotion: "മോഷൻ",
    howToUseGuide: "എങ്ങനെ ഉപയോഗിക്കാം",
    localIndicator: "100% ലോക്കൽ",
    selectLanguageTitle: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    selectLanguageHint: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക.",
    menuHowToUse: "വഴികാട്ടി കാണുക",
    menuReplayIntro: "ഇൻട്രോ മോഷൻ വീണ്ടും കാണുക",
    welcomeEyebrow: "നിങ്ങളുടെ ദൈനംദിന ക്യാച്ച്-അപ്പ്",
    welcomeH1Part1: "മനസ്സിലാക്കുക.",
    welcomeH1Part2: "പ്രധാനപ്പെട്ടവയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.",
    welcomeDesc: "നിങ്ങളുടെ സംഭാഷണങ്ങളുടെ ചുരുക്കം.",
    firstLaunchKicker: "നിങ്ങളുടെ സ്വകാര്യ സംഭാഷണ ബ്രീഫിംഗ്",
    firstLaunchTitle: "വാട്ട് ഡിഡ് ഐ മിസ്സ്?",
    firstLaunchDesc: "എല്ലാ സന്ദേശങ്ങളും വായിക്കാതെ തന്നെ പ്രധാനപ്പെട്ട കാര്യങ്ങൾ വേഗത്തിൽ അറിയുക.",
    capUpdates: "✦ പ്രധാന അപ്‌ഡേറ്റുകൾ",
    capDecisions: "✓ തീരുമാനങ്ങളും അറിയിപ്പുകളും",
    capTasks: "↗ ജോലികളും സമയപരിധികളും",
    capQuestions: "? ഉത്തരങ്ങൾ ആവശ്യമുള്ള ചോദ്യങ്ങൾ",
    firstLaunchPrivacy: "സ്വകാര്യ സംരക്ഷണം · നിങ്ങളുടെ സന്ദേശങ്ങൾ ഈ ബ്രൗസറിൽ തന്നെ പ്രോസസ്സ് ചെയ്യുന്നു.",
    btnImportConversations: "സംഭാഷണങ്ങൾ ഇറക്കുമതി ചെയ്യുക",
    btnPasteMessages: "സന്ദേശങ്ങൾ പേസ്റ്റ് ചെയ്യുക",
    welcomeGuideLink: "സഹായം വേണമോ? ഉപയോഗ ഗൈഡ് കാണുക →",
    summaryIntroStrong: "ഒറ്റനോട്ടത്തിൽ നിങ്ങളുടെ കാര്യങ്ങൾ",
    summaryIntroCaption: "ലോക്കലായി തയ്യാറാക്കിയ സംഭാഷണ ചുരുക്കം.",
    statCatchUp: "അറിയേണ്ട<br>സംഭാഷണങ്ങൾ",
    statActions: "കണ്ടെത്തിയ<br>ചുമതലകൾ",
    statMentions: "നേരിട്ടുള്ള<br>മെൻഷനുകൾ",
    inboxKicker: "ഇൻബോക്സ്",
    inboxHeading: "സംഭാഷണങ്ങൾ",
    filterAll: "എല്ലാം",
    filterUnread: "വായിക്കാത്തവ",
    filterMentions: "മെൻഷനുകൾ",
    filterActions: "ചുമതലകളോടെ",
    lblSender: "അയച്ചയാൾ",
    optAllSenders: "എല്ലാ അയച്ചവരും",
    lblPriority: "മുൻഗണന",
    optAllPriority: "എല്ലാ മുൻഗണനകളും",
    optHigh: "ഉയർന്നത്",
    optMedium: "ഇടത്തരം",
    optLow: "കുറഞ്ഞത്",
    searchPlaceholder: "സംഭാഷണങ്ങൾ തിരയുക",
    dialogKicker: "സ്വകാര്യ ഇമ്പോർട്ട്",
    dialogHeading: "സംഭാഷണങ്ങൾ ചേർക്കുക.",
    dialogDesc: "സന്ദേശങ്ങൾ പേസ്റ്റ് ചെയ്യുക അല്ലെങ്കിൽ എക്സ്പോർട്ട് ചെയ്ത ഫയലുകൾ തിരഞ്ഞെടുക്കുക.",
    lblSourcePlatform: "സന്ദേശ സ്രോതസ്സ്",
    optAutoDetect: "സ്വയമേവ തിരിച്ചറിയുക",
    optOtherChat: "മറ്റ് ചാറ്റ് എക്സ്പോർട്ട്",
    btnChooseExportFiles: "ഫയലുകൾ തിരഞ്ഞെടുക്കുക",
    lblConvTitle: "സംഭാഷണത്തിന്റെ പേര്",
    lblOptional: "(ഐച്ഛികം)",
    placeholderConvTitle: "ഉദാ: പ്രോജക്ട് പ്ലാനിംഗ്",
    lblPasteStep: "1. സന്ദേശങ്ങൾ പേസ്റ്റ് ചെയ്യുക",
    placeholderPasteInput: "പകർത്തിയ സന്ദേശങ്ങൾ ഇവിടെ പേസ്റ്റ് ചെയ്യുക.",
    lblMentionKeywords: "നിങ്ങളുടെ പേര് അല്ലെങ്കിൽ വാക്കുകൾ",
    placeholderMentionKeywords: "ഹൈലൈറ്റ് ചെയ്യേണ്ടത് നൽകുക",
    btnSample: "സാമ്പിൾ പരീക്ഷിക്കുക",
    sampleNote: "സാമ്പിൾ ഐച്ഛികമാണ്.",
    lblImportStep: "2. ചാറ്റ് എക്സ്പോർട്ട് ഇറക്കുമതി ചെയ്യുക",
    btnChooseFiles: "ഫയലുകൾ തിരഞ്ഞെടുക്കുക",
    noFileChosen: "ഫയലുകളൊന്നും തിരഞ്ഞെടുത്തിട്ടില്ല",
    fileChosen: "ഫയൽ തിരഞ്ഞെടുത്തു",
    filesChosen: "ഫയലുകൾ തിരഞ്ഞെടുത്തു",
    filePickerNote: "വാട്സാപ്പ്, ടെലിഗ്രാം എക്സ്പോർട്ടുകൾ പിന്തുണയ്ക്കുന്നു.",
    dialogPrivacyNote: "ഈ ബ്രൗസറിൽ വിശകലനം ചെയ്യുന്നു. ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യുന്നില്ല.",
    btnSummarizeMessages: "ചുരുക്കം ഉണ്ടാക്കുക",
    footerTagline: "പ്രധാനപ്പെട്ടവയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.",
    footerPrivacy: "ലോക്കലായി തയ്യാറാക്കിയത്. അപ്‌ലോഡ് ഇല്ല.",
    backToHome: "ഹോമിലേക്ക് മടങ്ങുക",
    home: "ഹോം",
    copyBriefing: "പകർത്തുക",
    markRead: "വായിച്ചതായി അടയാളപ്പെടുത്തുക",
    markUnread: "വായിക്കാത്തതായി അടയാളപ്പെടുത്തുക",
    summarizeAgain: "വീണ്ടും സംഗ്രഹിക്കുക",
    summarizing: "സംഗ്രഹിക്കുന്നു…",
    remove: "നീക്കം ചെയ്യുക",
    briefingHeading: "നിങ്ങൾ നഷ്ടപ്പെടുത്തിയത് · AI സംഭാഷണ ചുരുക്കം",
    importantMessagesHeading: "പ്രധാന സന്ദേശങ്ങൾ",
    decisionsHeading: "എടുത്ത തീരുമാനങ്ങൾ",
    actionsHeading: "ചെയ്യേണ്ട കാര്യങ്ങൾ",
    questionsHeading: "ശ്രദ്ധിക്കേണ്ട ചോദ്യങ്ങൾ",
    deadlinesHeading: "സമയപരിധിയും അടിയന്തിരതയും",
    mentionsHeading: "നിങ്ങളുടെ മെൻഷനുകൾ",
    noImportant: "പ്രധാന അറിയിപ്പുകൾ ഒന്നും കണ്ടെത്തിയില്ല.",
    noDecisions: "തീരുമാനങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.",
    noActions: "ചുമതലകൾ ഒന്നും കണ്ടെത്തിയില്ല.",
    noQuestions: "ചോദ്യങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.",
    readyToSummarize: "തയ്യാറാണ്",
    readyToSummarizeDesc: "സന്ദേശങ്ങൾ സുരക്ഷിതമായി വിശകലനം ചെയ്തു. എഐ ചുരുക്കം സൃഷ്ടിക്കാൻ താഴെ ക്ലിക്ക് ചെയ്യുക.",
    toastSummaryCopied: "പകർത്തി",
    toastSummaryGenerated: "ചുരുക്കം സൃഷ്ടിച്ചു",
    toastLanguageSwitched: "ഭാഷ മാറ്റി:",
    motionTagline: "പ്രധാനപ്പെട്ടവയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.",
    skipIntro: "ഒഴിവാക്കുക"
  },
  es: {
    workspaceTitle: "Ponerse al día",
    workspaceSubtitle: "Tu espacio de conversaciones",
    navWorkspace: "TU ESPACIO",
    navCatchUp: "Ponerse al día",
    navUnread: "No leídos",
    navMentions: "Menciones",
    navActions: "Elementos de acción",
    navHelp: "GUÍAS Y AYUDA",
    navHowToUse: "Guía de cómo usar",
    navConversations: "CONVERSACIONES",
    privacyTitle: "Privado por diseño",
    privacyDesc: "Los mensajes se analizan y resumen en este navegador. No se sube nada.",
    breadcrumbWorkspace: "Espacio",
    breadcrumbConversations: "Todas las conversaciones",
    replayMotion: "Animación",
    howToUseGuide: "Cómo usar",
    localIndicator: "100% local",
    selectLanguageTitle: "Seleccionar idioma",
    selectLanguageHint: "Elige tu idioma preferido.",
    menuHowToUse: "Ver guía de uso",
    menuReplayIntro: "Repetir animación inicial",
    welcomeEyebrow: "TU PONERTE AL DÍA DIARIO",
    welcomeH1Part1: "Ponte al día.",
    welcomeH1Part2: "Concéntrate en lo importante.",
    welcomeDesc: "Tus conversaciones, cuidadosamente resumidas.",
    firstLaunchKicker: "TU INFORME PERSONAL DE CONVERSACIONES",
    firstLaunchTitle: "¿Qué me perdí?",
    firstLaunchDesc: "Tus conversaciones avanzan rápido. Ponte al día sin leer cada mensaje.",
    capUpdates: "✦ Actualizaciones importantes",
    capDecisions: "✓ Decisiones y anuncios",
    capTasks: "↗ Tareas y plazos",
    capQuestions: "? Preguntas que requieren respuesta",
    firstLaunchPrivacy: "Privado por diseño · Tus mensajes se procesan en este navegador y no se suben.",
    btnImportConversations: "Importar conversaciones",
    btnPasteMessages: "Pegar mensajes",
    welcomeGuideLink: "¿Necesitas ayuda para exportar? Ver la guía de uso →",
    summaryIntroStrong: "Tu resumen, de un vistazo",
    summaryIntroCaption: "Tus conversaciones importadas, resumidas localmente.",
    statCatchUp: "conversaciones<br>por revisar",
    statActions: "elementos de acción<br>identificados",
    statMentions: "menciones<br>directas",
    inboxKicker: "TU BANDEJA",
    inboxHeading: "Conversaciones",
    filterAll: "Todos",
    filterUnread: "No leídos",
    filterMentions: "Menciones",
    filterActions: "Con acciones",
    lblSender: "Remitente",
    optAllSenders: "Todos los remitentes",
    lblPriority: "Prioridad",
    optAllPriority: "Todas las prioridades",
    optHigh: "Alta",
    optMedium: "Media",
    optLow: "Baja",
    searchPlaceholder: "Buscar conversaciones",
    dialogKicker: "IMPORTACIÓN PRIVADA EN EL DISPOSITIVO",
    dialogHeading: "Trae tus conversaciones.",
    dialogDesc: "Elige un origen, luego pega mensajes o selecciona archivos exportados.",
    lblSourcePlatform: "Origen del mensaje",
    optAutoDetect: "Detectar formato automáticamente",
    optOtherChat: "Otra exportación de chat",
    btnChooseExportFiles: "Elegir archivos exportados",
    lblConvTitle: "Nombre de conversación o grupo",
    lblOptional: "(opcional)",
    placeholderConvTitle: "p. ej. Planificación de lanzamiento",
    lblPasteStep: "1. Pegar mensajes",
    placeholderPasteInput: "Pega mensajes aquí. Se reconocen marcas de tiempo y formatos habituales.",
    lblMentionKeywords: "Tu nombre o palabras clave",
    placeholderMentionKeywords: "Ingresa solo lo que deseas resaltar",
    btnSample: "Probar muestra ficticia",
    sampleNote: "La muestra es opcional y nunca se precarga.",
    lblImportStep: "2. Importar exportación(es) de chat",
    btnChooseFiles: "Elegir archivos",
    noFileChosen: "Ningún archivo seleccionado",
    fileChosen: "archivo seleccionado",
    filesChosen: "archivos seleccionados",
    filePickerNote: "Funciona con exportaciones de WhatsApp, Telegram, Instagram y Messenger: .txt, .json, .html, .csv o ZIP.",
    dialogPrivacyNote: "Analizado y resumido en este navegador. Los archivos nunca se suben.",
    btnSummarizeMessages: "Resumir mensajes",
    footerTagline: "Ponte al día. Concéntrate en lo importante.",
    footerPrivacy: "Analizado y resumido en este navegador. Sin subidas.",
    backToHome: "Volver al inicio",
    home: "Inicio",
    copyBriefing: "Copiar informe",
    markRead: "Marcar como leído",
    markUnread: "Marcar como no leído",
    summarizeAgain: "Resumir de nuevo",
    summarizing: "Resumiendo…",
    remove: "Eliminar",
    briefingHeading: "LO QUE TE PERDISTE · INFORME IA DE CONVERSACIÓN",
    importantMessagesHeading: "MENSAJES IMPORTANTES",
    decisionsHeading: "DECISIONES TOMADAS",
    actionsHeading: "ELEMENTOS DE ACCIÓN",
    questionsHeading: "PREGUNTAS PARA REVISAR",
    deadlinesHeading: "PLAZOS Y URGENCIA",
    mentionsHeading: "TUS MENCIONES",
    noImportant: "No se identificaron anuncios de alta prioridad.",
    noDecisions: "No se identificaron decisiones explícitas.",
    noActions: "No se identificaron tareas explícitas.",
    noQuestions: "No se identificaron preguntas explícitas.",
    readyToSummarize: "LISTO PARA RESUMIR",
    readyToSummarizeDesc: "Los mensajes se analizaron de forma segura en tu dispositivo. Haz clic abajo para generar el resumen.",
    toastSummaryCopied: "Informe copiado al portapapeles",
    toastSummaryGenerated: "Resumen generado localmente",
    toastLanguageSwitched: "Idioma cambiado a",
    motionTagline: "Ponte al día. Concéntrate en lo importante.",
    skipIntro: "Saltar intro"
  },
  fr: {
    workspaceTitle: "Rattraper",
    workspaceSubtitle: "Votre espace de discussion",
    navWorkspace: "VOTRE ESPACE",
    navCatchUp: "Rattraper",
    navUnread: "Non lus",
    navMentions: "Mentions",
    navActions: "Tâches à faire",
    navHelp: "GUIDES ET AIDE",
    navHowToUse: "Guide d'utilisation",
    navConversations: "CONVERSATIONS",
    privacyTitle: "Privé par conception",
    privacyDesc: "Les messages sont analysés et résumés dans ce navigateur. Rien n'est téléversé.",
    breadcrumbWorkspace: "Espace",
    breadcrumbConversations: "Toutes les conversations",
    replayMotion: "Animation",
    howToUseGuide: "Comment utiliser",
    localIndicator: "100% local",
    selectLanguageTitle: "Choisir la langue",
    selectLanguageHint: "Choisissez votre langue préférée.",
    menuHowToUse: "Voir le guide d'utilisation",
    menuReplayIntro: "Rejouer l'animation d'intro",
    welcomeEyebrow: "VOTRE RÉSUMÉ QUOTIDIEN",
    welcomeH1Part1: "Rattrapez.",
    welcomeH1Part2: "Concentrez-vous sur l'essentiel.",
    welcomeDesc: "Vos conversations, soigneusement distillées.",
    firstLaunchKicker: "VOTRE BRIEFING PERSONNEL DE CONVERSATION",
    firstLaunchTitle: "Qu'ai-je manqué ?",
    firstLaunchDesc: "Vos conversations vont vite. Rattrapez sans devoir tout lire.",
    capUpdates: "✦ Mises à jour importantes",
    capDecisions: "✓ Décisions et annonces",
    capTasks: "↗ Tâches et échéances",
    capQuestions: "? Questions nécessitant des réponses",
    firstLaunchPrivacy: "Privé par conception · Vos messages sont traités dans ce navigateur et ne sont pas téléversés.",
    btnImportConversations: "Importer les conversations",
    btnPasteMessages: "Coller des messages",
    welcomeGuideLink: "Besoin d'aide pour exporter ? Voir le guide d'utilisation →",
    summaryIntroStrong: "Votre résumé, en un coup d'œil",
    summaryIntroCaption: "Vos conversations importées, résumées localement.",
    statCatchUp: "conversations<br>à rattraper",
    statActions: "actions à faire<br>identifiées",
    statMentions: "mentions<br>directes",
    inboxKicker: "VOTRE BOÎTE",
    inboxHeading: "Conversations",
    filterAll: "Tous",
    filterUnread: "Non lus",
    filterMentions: "Mentions",
    filterActions: "Avec actions",
    lblSender: "Expéditeur",
    optAllSenders: "Tous les expéditeurs",
    lblPriority: "Priorité",
    optAllPriority: "Toutes les priorités",
    optHigh: "Haute",
    optMedium: "Moyenne",
    optLow: "Basse",
    searchPlaceholder: "Rechercher des conversations",
    dialogKicker: "IMPORTATION PRIVÉE SUR L'APPAREIL",
    dialogHeading: "Importez vos conversations.",
    dialogDesc: "Choisissez une source, puis collez les messages ou sélectionnez les fichiers exportés.",
    lblSourcePlatform: "Source du message",
    optAutoDetect: "Détecter automatiquement le format",
    optOtherChat: "Autre export de discussion",
    btnChooseExportFiles: "Choisir les fichiers exportés",
    lblConvTitle: "Nom de la conversation ou du groupe",
    lblOptional: "(optionnel)",
    placeholderConvTitle: "ex. Planification du lancement",
    lblPasteStep: "1. Coller les messages",
    placeholderPasteInput: "Collez vos messages ici. Les horodatages et formats habituels sont reconnus.",
    lblMentionKeywords: "Votre nom ou mots-clés",
    placeholderMentionKeywords: "Entrez uniquement ce que vous souhaitez mettre en évidence",
    btnSample: "Essayer un échantillon fictif",
    sampleNote: "L'échantillon reste optionnel et n'est jamais préchargé.",
    lblImportStep: "2. Importer l'export de discussion",
    btnChooseFiles: "Choisir des fichiers",
    noFileChosen: "Aucun fichier choisi",
    fileChosen: "fichier sélectionné",
    filesChosen: "fichiers sélectionnés",
    filePickerNote: "Fonctionne avec les exports WhatsApp, Telegram, Instagram et Messenger : .txt, .json, .html, .csv ou ZIP.",
    dialogPrivacyNote: "Analysé et résumé dans ce navigateur. Les fichiers ne sont jamais téléversés.",
    btnSummarizeMessages: "Résumer les messages",
    footerTagline: "Rattrapez. Concentrez-vous sur l'essentiel.",
    footerPrivacy: "Analysé et résumé dans ce navigateur. Aucun téléversement.",
    backToHome: "Retour à l'accueil",
    home: "Accueil",
    copyBriefing: "Copier le briefing",
    markRead: "Marquer comme lu",
    markUnread: "Marquer comme non lu",
    summarizeAgain: "Résumer à nouveau",
    summarizing: "Résumé en cours…",
    remove: "Supprimer",
    briefingHeading: "CE QUE VOUS AVEZ MANQUÉ · BRIEFING IA DE CONVERSATION",
    importantMessagesHeading: "MESSAGES IMPORTANTS",
    decisionsHeading: "DÉCISIONS PRISES",
    actionsHeading: "ACTIONS À MENER",
    questionsHeading: "QUESTIONS À REVOIR",
    deadlinesHeading: "ÉCHÉANCES ET URGENCE",
    mentionsHeading: "VOS MENTIONS",
    noImportant: "Aucune annonce hautement prioritaire identifiée.",
    noDecisions: "Aucune décision explicite identifiée.",
    noActions: "Aucune action explicite identifiée.",
    noQuestions: "Aucune question explicite identifiée.",
    readyToSummarize: "PRÊT À RÉSUMER",
    readyToSummarizeDesc: "Les messages ont été analysés en toute sécurité sur votre appareil. Cliquez ci-dessous pour générer le briefing.",
    toastSummaryCopied: "Briefing copié dans le presse-papier",
    toastSummaryGenerated: "Résumé généré localmente",
    toastLanguageSwitched: "Langue changée en",
    motionTagline: "Rattrapez. Concentrez-vous sur l'essentiel.",
    skipIntro: "Passer l'intro"
  },
  de: {
    workspaceTitle: "Aufholen",
    workspaceSubtitle: "Ihr Konversationsbereich",
    navWorkspace: "IHR ARBEITSBEREICH",
    navCatchUp: "Aufholen",
    navUnread: "Ungelesen",
    navMentions: "Erwähnungen",
    navActions: "Aktionselemente",
    navHelp: "LEITFÄDEN & HILFE",
    navHowToUse: "Benutzerhandbuch",
    navConversations: "KONVERSATIONEN",
    privacyTitle: "Privat nach Design",
    privacyDesc: "Nachrichten werden in diesem Browser analysiert und zusammengefasst. Nichts wird hochgeladen.",
    breadcrumbWorkspace: "Bereich",
    breadcrumbConversations: "Alle Konversationen",
    replayMotion: "Animation",
    howToUseGuide: "Verwendung",
    localIndicator: "100% lokal",
    selectLanguageTitle: "Sprache auswählen",
    selectLanguageHint: "Wählen Sie Ihre bevorzugte Sprache.",
    menuHowToUse: "Benutzerhandbuch anzeigen",
    menuReplayIntro: "Intro-Animation wiederholen",
    welcomeEyebrow: "IHR TÄGLICHES AUFHOLEN",
    welcomeH1Part1: "Holen Sie auf.",
    welcomeH1Part2: "Fokussieren Sie sich auf das Wesentliche.",
    welcomeDesc: "Ihre Gespräche, sorgfältig zusammengefasst.",
    firstLaunchKicker: "IHRE PERSÖNLICHE GESPRÄCHSZUSAMMENFASSUNG",
    firstLaunchTitle: "Was habe ich verpasst?",
    firstLaunchDesc: "Ihre Gespräche gehen schnell. Verpassen Sie nichts, ohne jede Nachricht zu lesen.",
    capUpdates: "✦ Wichtige Aktualisierungen",
    capDecisions: "✓ Entscheidungen & Ankündigungen",
    capTasks: "↗ Aufgaben & Fristen",
    capQuestions: "? Fragen, die Antworten brauchen",
    firstLaunchPrivacy: "Privat nach Design · Ihre Nachrichten werden lokal im Browser verarbeitet und nicht hochgeladen.",
    btnImportConversations: "Konversationen importieren",
    btnPasteMessages: "Nachrichten einfügen",
    welcomeGuideLink: "Hilfe beim Exportieren nötig? Benutzerhandbuch anzeigen →",
    summaryIntroStrong: "Ihr Überblick auf einen Blick",
    summaryIntroCaption: "Ihre importierten Gespräche, lokal zusammengefasst.",
    statCatchUp: "Gespräche<br>aufzuholen",
    statActions: "identifizierte<br>Aktionen",
    statMentions: "direkte<br>Erwähnungen",
    inboxKicker: "IHR POSTFACH",
    inboxHeading: "Gespräche",
    filterAll: "Alle",
    filterUnread: "Ungelesen",
    filterMentions: "Erwähnungen",
    filterActions: "Mit Aktionen",
    lblSender: "Absender",
    optAllSenders: "Alle Absender",
    lblPriority: "Priorität",
    optAllPriority: "Alle Prioritäten",
    optHigh: "Hoch",
    optMedium: "Mittel",
    optLow: "Niedrig",
    searchPlaceholder: "Konversationen durchsuchen",
    dialogKicker: "PRIVATER GERÄTE-IMPORT",
    dialogHeading: "Bringen Sie Ihre Gespräche ein.",
    dialogDesc: "Wählen Sie eine Quelle, fügen Sie Nachrichten ein oder wählen Sie exportierte Dateien aus.",
    lblSourcePlatform: "Nachrichtenquelle",
    optAutoDetect: "Format automatisch erkennen",
    optOtherChat: "Anderer Chat-Export",
    btnChooseExportFiles: "Exportdateien auswählen",
    lblConvTitle: "Name der Konversation oder Gruppe",
    lblOptional: "(optional)",
    placeholderConvTitle: "z.B. Startplanung",
    lblPasteStep: "1. Nachrichten einfügen",
    placeholderPasteInput: "Fügen Sie kopierte Chat-Nachrichten hier ein.",
    lblMentionKeywords: "Ihr Name oder Schlüsselwörter",
    placeholderMentionKeywords: "Geben Sie nur ein, was hervorgehoben werden soll",
    btnSample: "Fiktives Beispiel ausprobieren",
    sampleNote: "Das Beispiel bleibt optional und wird nie vorab geladen.",
    lblImportStep: "2. Chat-Export(e) importieren",
    btnChooseFiles: "Dateien auswählen",
    noFileChosen: "Keine Datei ausgewählt",
    fileChosen: "Datei ausgewählt",
    filesChosen: "Dateien ausgewählt",
    filePickerNote: "Funktioniert mit WhatsApp-, Telegram-, Instagram- und Messenger-Exporten: .txt, .json, .html, .csv oder ZIP.",
    dialogPrivacyNote: "In diesem Browser analysiert und zusammengefasst. Dateien werden nie hochgeladen.",
    btnSummarizeMessages: "Nachrichten zusammenfassen",
    footerTagline: "Aufholen. Auf das Wesentliche konzentrieren.",
    footerPrivacy: "Im Browser analysiert und zusammengefasst. Kein Upload.",
    backToHome: "Zurück zur Startseite",
    home: "Startseite",
    copyBriefing: "Bericht kopieren",
    markRead: "Als gelesen markieren",
    markUnread: "Als ungelesen markieren",
    summarizeAgain: "Erneut zusammenfassen",
    summarizing: "Zusammenfassung läuft…",
    remove: "Entfernen",
    briefingHeading: "WAS SIE VERPASST HABEN · KI-GESPRÄCHSBERICHT",
    importantMessagesHeading: "WICHTIGE NACHRICHTEN",
    decisionsHeading: "GETROFFENE ENTSCHEIDUNGEN",
    actionsHeading: "AKTIONSELEMENTE",
    questionsHeading: "FRAGEN ZUR ÜBERPRÜFUNG",
    deadlinesHeading: "FRISTEN & DRINGLICHKEIT",
    mentionsHeading: "IHRE ERWÄHNUNGEN",
    noImportant: "Keine Ankündigungen mit hoher Priorität identifiziert.",
    noDecisions: "Keine expliziten Entscheidungen identifiziert.",
    noActions: "Keine expliziten Aktionen identifiziert.",
    noQuestions: "Keine expliziten Fragen identifiziert.",
    readyToSummarize: "BEREIT ZUR ZUSAMMENFASSUNG",
    readyToSummarizeDesc: "Nachrichten wurden sicher auf Ihrem Gerät analysiert. Klicken Sie unten, um Ihren Bericht zu erstellen.",
    toastSummaryCopied: "Bericht in die Zwischenablage kopiert",
    toastSummaryGenerated: "Zusammenfassung lokal erstellt",
    toastLanguageSwitched: "Sprache geändert zu",
    motionTagline: "Aufholen. Auf das Wesentliche konzentrieren.",
    skipIntro: "Intro überspringen"
  }
};

let currentLanguage = "en";
try {
  const saved = localStorage.getItem("whatdidimiss_lang");
  if (saved && SUPPORTED_LANGUAGES.some((item) => item.code === saved)) {
    currentLanguage = saved;
  }
} catch {}

function t(key, lang = currentLanguage) {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? "";
}

function applyLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.some((item) => item.code === lang)) lang = "en";
  currentLanguage = lang;
  try {
    localStorage.setItem("whatdidimiss_lang", lang);
  } catch {}
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = t(key, lang);
    if (val) el.innerHTML = val;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const val = t(key, lang);
    if (val) el.placeholder = val;
  });

  document.querySelectorAll(".lang-option-btn").forEach((btn) => {
    const btnCode = btn.dataset.langCode;
    const isActive = btnCode === lang;
    btn.classList.toggle("active", isActive);
    const existingCheck = btn.querySelector(".lang-check-icon");
    if (isActive && !existingCheck) {
      const span = document.createElement("span");
      span.className = "lang-check-icon";
      span.textContent = "✓";
      btn.appendChild(span);
    } else if (!isActive && existingCheck) {
      existingCheck.remove();
    }
  });

  render();
}

function initLanguageMenu() {
  const grid = document.querySelector("#lang-options-grid");
  const menuBtn = document.querySelector("#topbar-menu-btn");
  const menuPanel = document.querySelector("#topbar-menu-panel");

  if (grid) {
    grid.innerHTML = SUPPORTED_LANGUAGES.map((lang) => {
      const isActive = lang.code === currentLanguage;
      return `
        <button class="lang-option-btn ${isActive ? "active" : ""}" type="button" data-lang-code="${escapeHtml(lang.code)}" role="radio" aria-checked="${isActive}">
          <span class="lang-btn-info">
            <span class="lang-native-name">${escapeHtml(lang.nativeName)}</span>
            <span class="lang-eng-name">${escapeHtml(lang.name)}</span>
          </span>
          ${isActive ? '<span class="lang-check-icon">✓</span>' : ""}
        </button>
      `;
    }).join("");

    grid.querySelectorAll(".lang-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const langCode = btn.dataset.langCode;
        applyLanguage(langCode);
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
        showToast(`${t("toastLanguageSwitched")} ${langObj?.nativeName ?? langCode}`);
        if (menuPanel) {
          menuPanel.setAttribute("hidden", "");
          menuBtn?.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = menuPanel.hasAttribute("hidden");
      if (isHidden) {
        menuPanel.removeAttribute("hidden");
        menuBtn.setAttribute("aria-expanded", "true");
      } else {
        menuPanel.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", (e) => {
      if (!menuPanel.hasAttribute("hidden") && !menuPanel.contains(e.target) && !menuBtn.contains(e.target)) {
        menuPanel.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menuPanel.hasAttribute("hidden")) {
        menuPanel.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.focus();
      }
    });
  }

  applyLanguage(currentLanguage);
}


function getFilteredThreads() {
  return threads.filter((thread) => {
    const matchesFilter = activeFilter === "all"
      || (activeFilter === "unread" && thread.unread)
      || (activeFilter === "mentions" && Boolean(thread.analysis?.mentions.length))
      || (activeFilter === "actions" && Boolean(thread.analysis?.actions.length));
    const haystack = `${thread.title} ${thread.channel} ${thread.transcript}`.toLowerCase();
    const matchesSender = !selectedSender || thread.parsed.messages.some((message) => message.sender === selectedSender);
    const score = thread.analysis?.maxScore ?? 0;
    const matchesPriority = selectedPriority === "all"
      || (selectedPriority === "high" && score >= 8)
      || (selectedPriority === "medium" && score >= 4 && score < 8)
      || (selectedPriority === "low" && score < 4);
    return matchesFilter && matchesSender && matchesPriority && haystack.includes(searchTerm);
  }).sort((a, b) => {
    return (b.analysis?.maxScore ?? 0) - (a.analysis?.maxScore ?? 0);
  });
}

function renderTags(thread) {
  const { analysis } = thread;
  if (!analysis) return `<span class="tag">${thread.parsed.messages.length} messages</span>`;
  const tags = [];
  const deadlineCount = analysis.messages.filter((message) => message.deadline).length;
  if (analysis.mentions.length) tags.push(`<span class="tag mention">${analysis.mentions.length} mention${analysis.mentions.length > 1 ? "s" : ""}</span>`);
  if (deadlineCount) tags.push(`<span class="tag deadline">${deadlineCount} deadline${deadlineCount > 1 ? "s" : ""}</span>`);
  if (analysis.actions.length) tags.push(`<span class="tag">${analysis.actions.length} action${analysis.actions.length > 1 ? "s" : ""}</span>`);
  if (analysis.priorityLabel === "Needs your attention") tags.push(`<span class="tag urgent">Priority</span>`);
  return tags.slice(0, 3).join("");
}

function renderThreadList() {
  const filtered = getFilteredThreads();
  if (!filtered.length) {
    threadList.innerHTML = `<div class="empty-state"><strong>No conversations match</strong><span>Try another filter or search term.</span></div>`;
    return;
  }
  threadList.innerHTML = filtered.map((thread) => `
    <button class="thread-card ${thread.id === selectedThreadId ? "selected" : ""}" data-thread-id="${escapeHtml(thread.id)}" aria-pressed="${thread.id === selectedThreadId}">
      <span class="thread-topline"><span class="thread-space"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.channel)}</span><span class="thread-age">${escapeHtml(thread.age)}</span></span>
      <span class="thread-title-row"><span class="thread-title">${escapeHtml(thread.title)}</span>${thread.unread ? `<i class="unread-dot" aria-label="Unread"></i>` : ""}</span>
      <span class="thread-preview">${escapeHtml(truncate(thread.analysis?.summary ?? `${thread.parsed.messages.length} messages imported. Select Summarize to create a local briefing.`, 105))}</span>
      <span class="thread-tags">${renderTags(thread)}</span>
    </button>`).join("");
  threadList.querySelectorAll(".thread-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedThreadId = card.dataset.threadId;
      render();
    });
  });
}

function renderInsightList(items, kind, emptyText, thread) {
  const visibleItems = items.filter((item) => !(thread.dismissedFindings ?? []).includes(`${kind}:${item.order}`));
  if (!visibleItems.length) return `<ul class="insight-list ${kind}"><li>${escapeHtml(emptyText)}</li></ul>`;
  return `<ul class="insight-list ${kind}">${visibleItems.map((item) => {
    const key = `${kind}:${item.order}`;
    const corrected = thread.corrections?.[key] ?? item.text;
    const safeText = escapeHtml(truncate(corrected, 116));
    const text = item.mention ? safeText.replace(/(@[\p{L}\p{N}_][\p{L}\p{N}._~-]*)/u, '<span class="mention-text">$1</span>') : safeText;
    const checkbox = kind === "actions"
      ? `<input class="task-checkbox" type="checkbox" data-complete-order="${item.order}" aria-label="Mark task complete"${thread.completedActions?.includes(item.order) ? " checked" : ""}>`
      : "";
    return `<li class="${thread.completedActions?.includes(item.order) && kind === "actions" ? "completed" : ""}">${checkbox}<button class="finding-link" type="button" data-source-order="${item.order}">${text}<span>↗</span></button><span class="finding-controls"><button type="button" data-correct="${escapeHtml(kind)}:${item.order}" aria-label="Correct finding">Edit</button><button type="button" data-dismiss="${escapeHtml(kind)}:${item.order}" aria-label="Dismiss finding">×</button></span></li>`;
  }).join("")}</ul>`;
}

function renderDetail() {
  const thread = threads.find((item) => item.id === selectedThreadId);
  if (!thread) {
    detailPanel.innerHTML = `<div class="empty-state"><strong>${escapeHtml(t("workspaceTitle"))}</strong><span>${escapeHtml(t("workspaceSubtitle"))}</span></div>`;
    return;
  }
  if (!thread.analysis) {
    thread.dismissedFindings ??= [];
    thread.corrections ??= {};
    thread.completedActions ??= [];
    detailPanel.innerHTML = `
      <div class="detail-top-nav">
        <button class="back-home-button" type="button" data-action="back-home" title="${escapeHtml(t("backToHome"))}">
          <span class="back-home-icon" aria-hidden="true">←</span>
          <span>${escapeHtml(t("backToHome"))}</span>
        </button>
        <div class="detail-top-crumbs" aria-label="Breadcrumb">
          <span class="crumb-link" data-action="back-home">${escapeHtml(t("home"))}</span>
          <span class="crumb-sep" aria-hidden="true">/</span>
          <span class="crumb-active">${escapeHtml(truncate(thread.title, 28))}</span>
        </div>
      </div>
      <div class="detail-head">
        <div><div class="detail-channel"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.sourcePlatform)} · ${escapeHtml(thread.sourceName)}</div><h3 class="detail-title">${escapeHtml(thread.title)}</h3><div class="detail-meta">${thread.parsed.messages.length} messages parsed · ${escapeHtml(thread.parsed.format)} format · ${escapeHtml(thread.age)}</div></div>
        <div class="detail-actions">
          <button class="detail-action" data-action="back-home">← ${escapeHtml(t("home"))}</button>
          <button class="detail-action" data-action="remove">${escapeHtml(t("remove"))}</button>
        </div>
      </div>
      <section class="detail-summary">
        <div class="detail-summary-label">
          <span class="sparkle-icon">✦</span>
          <span>${escapeHtml(t("readyToSummarize"))}</span>
          <span class="local-privacy-pill">🔒 100% On-Device</span>
        </div>
        <p>${escapeHtml(t("readyToSummarizeDesc"))}</p>
      </section>
      ${thread.analysisError ? `<p class="form-error" role="alert">${escapeHtml(thread.analysisError)}</p>` : ""}
      <div class="summary-controls"><button class="primary-button summarize-thread" type="button" ${isSummarizing ? "disabled" : ""}>${isSummarizing ? '<span class="spinner"></span> ' + escapeHtml(t("summarizing")) : escapeHtml(t("btnSummarizeMessages")) + ' <span>→</span>'}</button></div>
      <details class="parsed-messages">
        <summary>View parsed messages <span>${thread.parsed.messages.length}</span></summary>
        <div class="parsed-message-list">${thread.parsed.messages.slice(0, 200).map((message) => renderParsedMessage(message, thread)).join("")}</div>
      </details>`;
    bindDetailActions(thread);
    return;
  }
  const { analysis } = thread;
  thread.dismissedFindings ??= [];
  thread.corrections ??= {};
  thread.completedActions ??= [];
  const visibleCount = (items, kind) => items.filter((item) => !thread.dismissedFindings.includes(`${kind}:${item.order}`)).length;
  const parsedMessages = thread.parsed.messages;
  const topMessage = analysis.messages.reduce((highest, message) => message.score > (highest?.score ?? 0) ? message : highest, null);
  const priorityMessage = topMessage?.score
    ? `<div class="attention-banner"><span>◉</span><span><strong>${escapeHtml(analysis.priorityLabel)}:</strong> ${escapeHtml(truncate(topMessage.text, 105))}</span></div>`
    : "";
  detailPanel.innerHTML = `
    <div class="detail-top-nav">
      <button class="back-home-button" type="button" data-action="back-home" title="${escapeHtml(t("backToHome"))}">
        <span class="back-home-icon" aria-hidden="true">←</span>
        <span>${escapeHtml(t("backToHome"))}</span>
      </button>
      <div class="detail-top-crumbs" aria-label="Breadcrumb">
        <span class="crumb-link" data-action="back-home">${escapeHtml(t("home"))}</span>
        <span class="crumb-sep" aria-hidden="true">/</span>
        <span class="crumb-active">${escapeHtml(truncate(thread.title, 28))}</span>
      </div>
    </div>
    <div class="detail-head">
      <div><div class="detail-channel"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.channel)}</div><h3 class="detail-title">${escapeHtml(thread.title)}</h3><div class="detail-meta">${analysis.messages.length} parsed messages · ${escapeHtml(thread.parsed.format)} format · ${escapeHtml(thread.age)}</div></div>
      <div class="detail-actions">
        <button class="detail-action" data-action="back-home">← ${escapeHtml(t("home"))}</button>
        <button class="detail-action" data-action="copy">${escapeHtml(t("copyBriefing"))}</button>
        <button class="detail-action" data-action="read">${thread.unread ? escapeHtml(t("markRead")) : escapeHtml(t("markUnread"))}</button>
        <button class="detail-action" data-action="resummarize" ${isSummarizing ? "disabled" : ""}>${isSummarizing ? escapeHtml(t("summarizing")) : escapeHtml(t("summarizeAgain"))}</button>
        <button class="detail-action" data-action="remove">${escapeHtml(t("remove"))}</button>
      </div>
    </div>
    ${isSummarizing ? `<p class="analysis-running"><span class="spinner"></span> Re-analyzing this conversation locally…</p>` : ""}
    ${thread.analysisError ? `<p class="form-error" role="alert">${escapeHtml(thread.analysisError)}</p>` : ""}
    <section class="detail-summary">
      <div class="detail-summary-label">
        <span class="sparkle-icon">✦</span>
        <span>${escapeHtml(t("briefingHeading"))}</span>
        <span class="local-privacy-pill">🔒 100% On-Device</span>
      </div>
      <p class="summary-body">${escapeHtml(truncate(analysis.summary, 450))}</p>
      <div class="summary-key-metrics">
        <span class="metric-pill"><strong class="metric-num">${visibleCount(analysis.actions, "actions")}</strong> ${escapeHtml(t("actionsHeading"))}</span>
        <span class="metric-pill"><strong class="metric-num">${visibleCount(analysis.decisions, "decisions")}</strong> ${escapeHtml(t("decisionsHeading"))}</span>
        <span class="metric-pill"><strong class="metric-num">${visibleCount(analysis.deadlines, "deadlines")}</strong> ${escapeHtml(t("deadlinesHeading"))}</span>
        <span class="metric-pill"><strong class="metric-num">${visibleCount(analysis.questions, "questions")}</strong> ${escapeHtml(t("questionsHeading"))}</span>
      </div>
    </section>
    <div class="detail-grid">
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.important, "important")}</span> ${escapeHtml(t("importantMessagesHeading"))}</h4>${renderInsightList(analysis.important, "important", t("noImportant"), thread)}</section>
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.decisions, "decisions")}</span> ${escapeHtml(t("decisionsHeading"))}</h4>${renderInsightList(analysis.decisions, "decisions", t("noDecisions"), thread)}</section>
    </div>
    <div class="detail-grid">
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.actions, "actions")}</span> ${escapeHtml(t("actionsHeading"))}</h4>${renderInsightList(analysis.actions, "actions", t("noActions"), thread)}</section>
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.questions, "questions")}</span> ${escapeHtml(t("questionsHeading"))}</h4>${renderInsightList(analysis.questions, "questions", t("noQuestions"), thread)}</section>
    </div>
    ${analysis.deadlines.length ? `<section style="margin-top:16px"><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.deadlines, "deadlines")}</span> ${escapeHtml(t("deadlinesHeading"))}</h4>${renderInsightList(analysis.deadlines, "deadlines", "", thread)}</section>` : ""}
    ${analysis.mentions.length ? `<section style="margin-top:16px"><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.mentions, "mentions")}</span> ${escapeHtml(t("mentionsHeading"))}</h4>${renderInsightList(analysis.mentions, "mentions", "", thread)}</section>` : ""}
    ${priorityMessage}
    <details class="parsed-messages">
      <summary>View parsed messages <span>${parsedMessages.length}</span></summary>
      <div class="parsed-message-list">${parsedMessages.slice(0, 200).map((message) => renderParsedMessage(message, thread)).join("")}
      ${parsedMessages.length > 200 ? `<p class="parse-note">Showing the first 200 of ${parsedMessages.length} parsed messages.</p>` : ""}</div>
    </details>
    <p class="summary-disclosure">Private AI briefing synthesized locally in your browser. Findings link to their source messages.</p>
    ${thread.parsed.warnings.length ? `<p class="parse-note">${thread.parsed.warnings.map(escapeHtml).join(" ")}</p>` : ""}`;
  bindDetailActions(thread);
}

function renderParsedMessage(message, thread) {
  const id = `source-${thread.id}-${message.order}`;
  const finding = thread.analysis?.messages.find((item) => item.order === message.order);
  const highlighted = finding && thread.analysis.important.some((item) => item.order === message.order);
  const badges = highlighted
    ? `<span class="source-finding-badges">${finding.reasons.map((reason) => `<span class="source-finding-badge">${escapeHtml(reason)}</span>`).join("")}</span>`
    : "";
  return `<div class="parsed-message${highlighted ? " important-source" : ""}" id="${escapeHtml(id)}">
    <div class="parsed-message-meta"><span>#${message.order}${message.sender ? ` · ${escapeHtml(message.sender)}` : " · Sender not identified"}</span><time>${escapeHtml(message.rawTimestamp ?? "No timestamp in source")}</time></div>
    ${badges}
    <p>${escapeHtml(message.text)}</p>
    <span class="parsed-message-source">${escapeHtml(message.sourceName)}${message.edited ? " · Edited marker" : ""}${message.deleted ? " · Deleted marker" : ""}${message.originalReference ? ` · Ref ${escapeHtml(String(message.originalReference))}` : ""}</span>
  </div>`;
}

function bindDetailActions(thread) {
  detailPanel.querySelectorAll('[data-action="back-home"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedThreadId = null;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  detailPanel.querySelector('[data-action="copy"]')?.addEventListener("click", () => copySummary(thread));
  detailPanel.querySelector('[data-action="remove"]')?.addEventListener("click", () => removeThread(thread.id));
  detailPanel.querySelector('[data-action="resummarize"]')?.addEventListener("click", () => summarizeThread(thread));
  detailPanel.querySelector(".summarize-thread")?.addEventListener("click", () => summarizeThread(thread));
  detailPanel.querySelector('[data-action="read"]')?.addEventListener("click", () => {
    thread.unread = !thread.unread;
    render();
  });
  detailPanel.querySelectorAll(".finding-link").forEach((button) => {
    button.addEventListener("click", () => {
      const messages = detailPanel.querySelector(".parsed-messages");
      messages.open = true;
      detailPanel.querySelector(`#source-${CSS.escape(thread.id)}-${button.dataset.sourceOrder}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
  detailPanel.querySelectorAll("[data-dismiss]").forEach((button) => {
    button.addEventListener("click", () => {
      thread.dismissedFindings.push(button.dataset.dismiss);
      renderDetail();
    });
  });
  detailPanel.querySelectorAll("[data-correct]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest("li")?.querySelector(".finding-link");
      const corrected = window.prompt("Correct this finding. Leave blank to keep the current text.", item?.textContent.replace("↗", "").trim() ?? "");
      if (corrected?.trim()) {
        thread.corrections[button.dataset.correct] = corrected.trim();
        renderDetail();
      }
    });
  });
  detailPanel.querySelectorAll("[data-complete-order]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const order = Number(checkbox.dataset.completeOrder);
      thread.completedActions = checkbox.checked
        ? [...new Set([...thread.completedActions, order])]
        : thread.completedActions.filter((item) => item !== order);
      renderDetail();
    });
  });
}

async function summarizeThread(thread) {
  if (isSummarizing) return;
  isSummarizing = true;
  thread.analysisError = "";
  renderDetail();
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 30));
    const keywords = mentionKeywordsInput.value.split(",").map((keyword) => keyword.trim()).filter(Boolean);
    thread.analysis = analyzeConversation(thread.parsed.messages, keywords);
    thread.analysisError = "";
  } catch (error) {
    try {
      thread.analysis = analyzeConversation(thread.parsed.messages, []);
      thread.analysisError = "";
    } catch {
      thread.analysisError = "";
    }
  } finally {
    isSummarizing = false;
    render();
  }
  showToast(t("toastSummaryGenerated"));
}

function removeThread(id) {
  const index = threads.findIndex((thread) => thread.id === id);
  if (index < 0) return;
  threads.splice(index, 1);
  if (selectedThreadId === id) selectedThreadId = threads[0]?.id ?? null;
  if (!threads.length) activeFilter = "all";
  render();
  showToast("Conversation removed from this session");
}

function renderCounts() {
  const unread = threads.filter((thread) => thread.unread).length;
  const mentions = threads.reduce((count, thread) => count + (thread.analysis?.mentions.length ?? 0), 0);
  const actions = threads.reduce((count, thread) => count + (thread.analysis?.actions.length ?? 0), 0);
  document.querySelector("#all-count").textContent = String(threads.length);
  document.querySelector("#unread-count").textContent = String(unread);
  document.querySelector("#overview-unread").textContent = String(unread);
  document.querySelector("#overview-actions").textContent = String(actions);
  document.querySelector("#overview-mentions").textContent = String(mentions);
  document.querySelector("#tab-all-count").textContent = String(threads.length);
  document.querySelector("#thread-count").textContent = String(String(getFilteredThreads().length).padStart(2, "0"));
  document.querySelector("#first-launch").hidden = threads.length > 0;
  document.querySelector("#summary-strip").hidden = threads.length === 0;
  document.querySelector("#inbox-section").hidden = threads.length === 0;
  document.querySelector(".welcome-section").hidden = threads.length === 0;
  document.querySelector(".inbox-toolbar").hidden = threads.length === 0;
  document.querySelectorAll(".nav-item[data-filter]").forEach((button) => {
    button.hidden = threads.length === 0 && button.dataset.filter !== "all";
  });
  document.querySelector("#add-action-button").hidden = false;
  document.querySelector("#clear-data-button").hidden = threads.length === 0;
  const senderFilter = document.querySelector("#sender-filter");
  const currentSender = senderFilter.value;
  const senders = [...new Set(threads.flatMap((thread) => thread.parsed.messages.map((message) => message.sender).filter(Boolean)))].sort((a, b) => a.localeCompare(b));
  senderFilter.replaceChildren(new Option("All senders", ""));
  senders.forEach((sender) => senderFilter.add(new Option(sender, sender)));
  senderFilter.value = senders.includes(currentSender) ? currentSender : "";
  selectedSender = senderFilter.value;
}

function render() {
  renderCounts();
  renderThreadList();
  renderDetail();
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === activeFilter);
    if (button.classList.contains("nav-item")) button.setAttribute("aria-current", button.dataset.filter === activeFilter ? "page" : "false");
  });
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

async function copySummary(thread) {
  const text = `${thread.title}\n\n${thread.analysis.summary}\n\nNext steps:\n${thread.analysis.actions.map((item) => `• ${item.text}`).join("\n") || "No action items found."}`;
  const copyBtn = detailPanel.querySelector('[data-action="copy"]');
  try {
    await navigator.clipboard.writeText(text);
    if (copyBtn) {
      const orig = copyBtn.textContent;
      copyBtn.innerHTML = "✓ Copied!";
      copyBtn.style.color = "#059669";
      setTimeout(() => {
        copyBtn.textContent = orig;
        copyBtn.style.color = "";
      }, 2000);
    }
    showToast("Summary copied to clipboard");
  } catch (error) {
    showToast("Clipboard access is unavailable in this browser");
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let lastSelectedFiles = [];

function updateFileStatusIndicator(files, state, extraCount = 0) {
  const statusEl = document.querySelector("#file-chosen-status");
  if (!statusEl) return;

  if (state === "empty" || !files || !files.length) {
    statusEl.innerHTML = '<span class="file-status-pill empty"><span class="status-dot"></span>No file chosen</span>';
    return;
  }

  if (state === "imported") {
    const name = files.length === 1 ? files[0].name : `${files.length} files`;
    const countText = extraCount > 0 ? ` (${extraCount} msgs)` : "";
    statusEl.innerHTML = `
      <div class="file-status-pill imported" title="${escapeHtml(name)}">
        <span class="status-icon-check">✓</span>
        <div class="file-info-group">
          <strong class="file-name-text">${escapeHtml(truncate(name, 35))}</strong>
          <span class="file-meta-sub"><span class="status-tag success">Imported successfully</span>${countText}</span>
        </div>
      </div>`;
    return;
  }

  // Chosen / Ready state
  if (files.length === 1) {
    const f = files[0];
    statusEl.innerHTML = `
      <div class="file-status-pill chosen" title="${escapeHtml(f.name)}">
        <span class="status-icon-check">✓</span>
        <div class="file-info-group">
          <strong class="file-name-text">${escapeHtml(truncate(f.name, 35))}</strong>
          <span class="file-meta-sub"><span class="file-size-tag">${formatFileSize(f.size)}</span> · <span class="status-tag ready">Ready to summarize</span></span>
        </div>
        <button type="button" class="file-clear-chip" title="Clear chosen file" aria-label="Clear chosen file">✕</button>
      </div>`;
  } else {
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    statusEl.innerHTML = `
      <div class="file-status-pill chosen" title="${files.length} files selected">
        <span class="status-icon-check">✓</span>
        <div class="file-info-group">
          <strong class="file-name-text">${files.length} files chosen</strong>
          <span class="file-meta-sub"><span class="file-size-tag">${formatFileSize(totalBytes)} total</span> · <span class="status-tag ready">Ready to summarize</span></span>
        </div>
        <button type="button" class="file-clear-chip" title="Clear all chosen files" aria-label="Clear all chosen files">✕</button>
      </div>`;
  }

  statusEl.querySelector(".file-clear-chip")?.addEventListener("click", () => {
    queuedFiles = [];
    lastSelectedFiles = [];
    renderFileQueue();
    updateFileError();
    updateFileStatusIndicator(null, "empty");
  });
}

function renderFileQueue() {
  fileQueueElement.replaceChildren();
  queuedFiles.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = `file-queue-item${entry.error || entry.result?.errors.length ? " invalid" : ""}`;
    const description = document.createElement("span");
    const parsedCount = entry.result?.conversations.reduce((count, conversation) => count + conversation.parsed.messages.length, 0) ?? 0;
    const status = entry.error || entry.result?.errors.join(" ")
      || (entry.loading ? "Reading locally…" : entry.result ? `${parsedCount} message${parsedCount === 1 ? "" : "s"} parsed` : "Ready");
    description.textContent = `${entry.file.name} · ${formatFileSize(entry.file.size)} — ${status}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "file-remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${entry.file.name}`);
    remove.addEventListener("click", () => {
      queuedFiles.splice(index, 1);
      renderFileQueue();
      updateFileError();
      if (!queuedFiles.length) {
        lastSelectedFiles = [];
        updateFileStatusIndicator(null, "empty");
      } else {
        lastSelectedFiles = queuedFiles.map((e) => e.file);
        updateFileStatusIndicator(lastSelectedFiles, "chosen");
      }
    });
    remove.disabled = entry.loading;
    row.append(description, remove);
    fileQueueElement.append(row);
  });
}

function getFileValidationError(file, batchBytes) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (!["txt", "json", "html", "htm", "csv", "zip"].includes(extension)) return "Supported formats are .txt, .json, .html, .csv, and supported .zip archives.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_BYTES) return "File exceeds the 20 MB per-file limit.";
  if (batchBytes > MAX_BATCH_BYTES) return "Selected files exceed the 20 MB total limit.";
  return "";
}

function updateFileError() {
  const errors = queuedFiles.filter((entry) => entry.error).map((entry) => `${entry.file.name}: ${entry.error}`);
  document.querySelector("#form-error").textContent = errors.join(" ");
}

async function handleFileSelection(source) {
  let files = [];
  if (source && (Array.isArray(source) || source instanceof FileList)) {
    files = Array.from(source);
  } else if (source && source.target && source.target.files && source.target.files.length) {
    files = Array.from(source.target.files);
  } else if (fileInput && fileInput.files && fileInput.files.length) {
    files = Array.from(fileInput.files);
  }

  if (fileInput) fileInput.value = "";

  if (!files.length) {
    if (!queuedFiles.length) {
      updateFileStatusIndicator(null, "empty");
    }
    return;
  }

  lastSelectedFiles = files;
  updateFileStatusIndicator(files, "chosen");

  let batchBytes = 0;
  queuedFiles = files.map((file, index) => {
    batchBytes += file.size;
    const error = index >= MAX_FILE_COUNT
      ? `Only the first ${MAX_FILE_COUNT} selected files can be imported.`
      : getFileValidationError(file, batchBytes);
    return { file, error, loading: !error, result: null };
  });
  await parseQueuedFiles();
}

async function parseQueuedFiles() {
  renderFileQueue();
  updateFileError();
  analyzeButton.disabled = true;
  try {
    for (const entry of queuedFiles) {
      if (entry.error) continue;
      entry.loading = true;
      entry.result = null;
      renderFileQueue();
      entry.result = await MissedUniversalImporter.parseFile(entry.file, document.querySelector("#source-platform").value);
      entry.loading = false;
      if (!entry.result.conversations.length && !entry.result.errors.length) {
        entry.error = "No messages were found in this file.";
      }
      renderFileQueue();
    }
  } finally {
    analyzeButton.disabled = false;
    updateFileError();
    if (queuedFiles.length) {
      updateFileStatusIndicator(queuedFiles.map((e) => e.file), "chosen");
    }
  }
}

function handleFileSelectionForExistingFiles() {
  queuedFiles.forEach((entry) => {
    entry.error = getFileValidationError(entry.file, queuedFiles.reduce((total, current) => total + current.file.size, 0));
  });
  parseQueuedFiles();
}

function createImportedThread(conversation) {
  const parsed = conversation.parsed;
  const channel = conversation.channel || conversation.title || "Imported conversation";
  return {
    id: `imported-${nextThreadId++}`,
    title: truncate(conversation.title || "Imported conversation", 62),
    channel,
    sourceName: conversation.sourceName,
    sourcePlatform: conversation.sourcePlatform || "other",
    dot: "dot-blue",
    age: "just now",
    unread: true,
    transcript: parsed.messages.map((message) => message.rawMessage || message.text).join("\n"),
    parsed,
    analysis: null
  };
}

function updatePlatformInstructions() {
  const platform = document.querySelector("#source-platform").value;
  const instructions = {
    auto: "Auto-detect reads common WhatsApp, Telegram, Instagram, and Facebook Messenger export formats. On mobile, export the chat and save it to Files/Downloads before choosing it here.",
    whatsapp: "WhatsApp: open the chat/group → menu → More → Export chat, then save the .txt file (with or without media). Choose the text export; media is not analyzed.",
    telegram: "Telegram: in Telegram Desktop, open the chat menu → Export chat history. Select the export ZIP, JSON, HTML, or plain text file. On mobile, save a text export to Files/Downloads first.",
    instagram: "Instagram: Accounts Center → Your information and permissions → Download your information → Messages. Choose JSON, then select the downloaded ZIP or message JSON files from Files/Downloads.",
    facebook: "Facebook Messenger: Accounts Center → Your information and permissions → Download your information → Messages. Choose JSON, then select the downloaded ZIP or message JSON files from Files/Downloads.",
    discord: "Discord: use an authorized data package or chat export in JSON/CSV/text format. What Did I Miss? does not access Discord accounts or tokens.",
    other: "Choose a plain-text chat export, JSON/CSV with message text, or an HTML export in Telegram's export structure. On mobile, save the export locally to Files/Downloads first."
  };
  document.querySelector("#platform-instructions").textContent = instructions[platform];
}

async function importConversations() {
  const transcriptInput = document.querySelector("#conversation-input");
  const titleInput = document.querySelector("#conversation-title");
  const error = document.querySelector("#form-error");
  const pastedText = transcriptInput.value;
  const customTitle = titleInput.value.trim();
  const imported = [];
  const errors = [];
  const warnings = [];
  const originalButtonText = analyzeButton.innerHTML;
  analyzeButton.disabled = true;
  analyzeButton.innerHTML = '<span class="spinner"></span> Parsing messages…';

  try {
    if (pastedText.trim()) {
      const result = MissedUniversalImporter.parseDocument(pastedText, {
        sourceName: "Pasted messages.txt",
        platform: document.querySelector("#source-platform").value === "auto" ? "other" : document.querySelector("#source-platform").value,
        title: customTitle || null
      });
      if (result.errors.length) errors.push(...result.errors);
      imported.push(...result.conversations.map((conversation) => {
        if (!customTitle) {
          conversation.title = "Pasted Conversation";
          conversation.channel = "Pasted Conversation";
          conversation.parsed.groupName = null;
        }
        return createImportedThread(conversation);
      }));
      warnings.push(...result.warnings);
    }

    for (const entry of queuedFiles) {
      if (entry.error) {
        errors.push(`${entry.file.name}: ${entry.error}`);
        continue;
      }
      if (entry.loading || !entry.result) {
        errors.push(`${entry.file.name}: Still reading this file. Wait for parsing to finish and retry.`);
        continue;
      }
      errors.push(...entry.result.errors);
      warnings.push(...entry.result.warnings);
      imported.push(...entry.result.conversations.map(createImportedThread));
    }

    if (!imported.length) {
      error.textContent = errors.join(" ") || "Add pasted messages or choose one or more supported chat-export files.";
      return;
    }

    threads.unshift(...imported);
    selectedThreadId = imported[0].id;
    activeFilter = "all";
    searchTerm = "";
    selectedSender = "";
    selectedPriority = "all";
    document.querySelector("#search-input").value = "";
    document.querySelector("#sender-filter").value = "";
    document.querySelector("#priority-filter").value = "all";
    transcriptInput.value = "";
    titleInput.value = "";
    queuedFiles = queuedFiles.filter((entry) => entry.error || !entry.result?.conversations.length);
    renderFileQueue();
    const totalMsgCount = imported.reduce((count, thread) => count + thread.parsed.messages.length, 0);
    if (lastSelectedFiles.length) {
      updateFileStatusIndicator(lastSelectedFiles, "imported", totalMsgCount);
    }
    error.textContent = "";
    importDialog.close();

    isSummarizing = true;
    render();
    await new Promise((resolve) => window.setTimeout(resolve, 35));
    const keywords = mentionKeywordsInput.value.split(",").map((keyword) => keyword.trim()).filter(Boolean);
    imported.forEach((thread) => { thread.analysis = analyzeConversation(thread.parsed.messages, keywords); });
    render();
    if (errors.length) {
      showToast(`${imported.length} conversation${imported.length === 1 ? "" : "s"} summarized; some files were skipped`);
      error.textContent = errors.join(" ");
    } else {
      showToast(`${imported.reduce((count, thread) => count + thread.parsed.messages.length, 0)} messages summarized locally`);
    }
    if (warnings.length) showToast(warnings.join(" "));
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unexpected import or summarization error.";
    error.textContent = `Could not summarize these messages. ${message} You can retry with another export.`;
    imported.forEach((thread) => { thread.analysisError = message; });
    showToast("Import or summary failed; your original files were not changed");
  } finally {
    isSummarizing = false;
    analyzeButton.disabled = false;
    analyzeButton.innerHTML = originalButtonText;
    if (importDialog.open && imported.length) importDialog.close();
    render();
  }
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    const selected = threads.find((thread) => thread.id === selectedThreadId);
    if (!selected || !getFilteredThreads().some((thread) => thread.id === selected.id)) {
      selectedThreadId = getFilteredThreads()[0]?.id ?? null;
    }
    render();
  });
});
document.querySelector("#search-input").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  const selected = threads.find((thread) => thread.id === selectedThreadId);
  if (!selected || !getFilteredThreads().some((thread) => thread.id === selected.id)) {
    selectedThreadId = getFilteredThreads()[0]?.id ?? null;
  }
  render();
});
document.querySelector("#sender-filter").addEventListener("change", (event) => {
  selectedSender = event.target.value;
  if (!getFilteredThreads().some((thread) => thread.id === selectedThreadId)) selectedThreadId = getFilteredThreads()[0]?.id ?? null;
  render();
});
document.querySelector("#priority-filter").addEventListener("change", (event) => {
  selectedPriority = event.target.value;
  if (!getFilteredThreads().some((thread) => thread.id === selectedThreadId)) selectedThreadId = getFilteredThreads()[0]?.id ?? null;
  render();
});
function openImportDialog(mode = "import") {
  document.querySelector("#form-error").textContent = "";
  importDialog.showModal();
  if (mode === "paste") {
    document.querySelector("#conversation-input").focus();
  }
}

document.querySelector("#import-button").addEventListener("click", () => openImportDialog("import"));
document.querySelector("#add-action-button").addEventListener("click", () => openImportDialog("menu"));
document.querySelector("#welcome-import-button").addEventListener("click", () => openImportDialog("import"));
document.querySelector("#welcome-paste-button").addEventListener("click", () => openImportDialog("paste"));
document.querySelector("#choose-files-button").addEventListener("click", () => fileInput.click());
document.querySelector("#paste-messages-button").addEventListener("click", () => document.querySelector("#conversation-input").focus());
document.querySelector("#analyze-button").addEventListener("click", importConversations);
fileInput.addEventListener("change", handleFileSelection);
document.querySelector("#source-platform").addEventListener("change", () => {
  updatePlatformInstructions();
  if (queuedFiles.length) handleFileSelectionForExistingFiles();
});
document.querySelector("#sample-button").addEventListener("click", () => {
  document.querySelector("#conversation-title").value = "Sample launch conversation";
  document.querySelector("#conversation-input").value = sampleConversation;
  document.querySelector("#form-error").textContent = "";
  document.querySelector("#conversation-input").focus();
});
const helpButton = document.querySelector("#help-button");
if (helpButton && helpButton.tagName !== "A") {
  helpButton.addEventListener("click", () => showToast("Files and messages are analyzed in this browser. They are not uploaded."));
}
mentionKeywordsInput.addEventListener("change", () => {
  const selected = threads.find((thread) => thread.id === selectedThreadId);
  if (selected?.analysis) summarizeThread(selected);
});
document.querySelector("#clear-data-button").addEventListener("click", () => {
  if (!threads.length) {
    openImportDialog("menu");
    return;
  }
  if (!window.confirm("Remove all imported conversations from this session? This cannot be undone.")) return;
  threads.splice(0, threads.length);
  selectedThreadId = null;
  activeFilter = "all";
  searchTerm = "";
  selectedSender = "";
  selectedPriority = "all";
  document.querySelector("#search-input").value = "";
  document.querySelector("#sender-filter").value = "";
  document.querySelector("#priority-filter").value = "all";
  render();
  showToast("All imported conversations removed");
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    if (!threads.length) return;
    event.preventDefault();
    document.querySelector("#search-input").focus();
  }
});

updatePlatformInstructions();
initLanguageMenu();
render();
initHeroMotion();
initFileDropzone();

function initFileDropzone() {
  const dropzone = document.querySelector("#file-dropzone");
  if (dropzone) {
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("drag-active");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("drag-active");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length) {
        handleFileSelection(dt.files);
      }
    });
  }

  document.querySelector("#choose-files-button")?.addEventListener("click", () => {
    fileInput.click();
  });
}

function initHeroMotion() {
  const heroPage = document.querySelector("#motion-hero-page");
  if (!heroPage) return;

  const DURATION_MS = 3600; // 3.6 seconds (in the 3-4s range)
  let timerId = null;

  function dismissHero() {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    heroPage.classList.add("fade-out");
    setTimeout(() => {
      heroPage.style.display = "none";
    }, 650);
  }

  // Auto-dismiss after 3.6 seconds
  timerId = setTimeout(dismissHero, DURATION_MS);

  // Skip button click
  const skipBtn = document.querySelector("#skip-hero-btn");
  if (skipBtn) {
    skipBtn.addEventListener("click", dismissHero);
  }

  // Keyboard dismiss (Escape, Space, Enter)
  window.addEventListener("keydown", (e) => {
    if (heroPage.style.display !== "none" && !heroPage.classList.contains("fade-out")) {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        dismissHero();
      }
    }
  });

  // Replay motion triggers
  document.querySelectorAll(".replay-motion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      heroPage.style.display = "flex";
      heroPage.classList.remove("fade-out");

      // Reset and retrigger animations
      const content = heroPage.querySelector(".hero-motion-content");
      if (content) {
        content.style.animation = "none";
        content.offsetHeight;
        content.style.animation = "";
      }
      const svg = heroPage.querySelector(".hero-motion-clock-svg");
      if (svg) {
        const animatedEls = svg.querySelectorAll(".hero-clock-track, .hero-clock-arrow, .hero-clock-pivot, .hero-hour-hand, .hero-minute-hand");
        animatedEls.forEach((el) => {
          el.style.animation = "none";
          el.offsetHeight;
          el.style.animation = "";
        });
      }
      const progressBar = heroPage.querySelector(".hero-progress-bar");
      if (progressBar) {
        progressBar.style.animation = "none";
        progressBar.offsetHeight;
        progressBar.style.animation = "";
      }

      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(dismissHero, DURATION_MS);
    });
  });
}
