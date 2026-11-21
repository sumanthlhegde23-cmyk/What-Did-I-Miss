(function attachSampleConversations(root) {
  "use strict";

  const SAMPLE_CONVERSATIONS = {
    en: [
      {
        id: "en-launch",
        icon: "🚀",
        title: "Product Launch Final Sprint",
        desc: "Final checks, QA sign-off, payments gateway test and launch scheduling.",
        tags: ["Launch", "Decisions", "Deadlines"],
        text: [
          "[08/10/2026, 9:14 AM] Jamie: Morning all — final launch review is this Thursday at 10 AM.",
          "[08/10/2026, 9:16 AM] Morgan: @Taylor, please verify payment gateway integration by 4 PM today.",
          "[08/10/2026, 9:18 AM] Priya: Decision: we will proceed with the dark mode onboarding screen.",
          "[08/10/2026, 9:20 AM] Jamie: Release notes are prepared and ready for final approval.",
          "[08/10/2026, 9:25 AM] Morgan: Correction: staging environment was refreshed. Please test there.",
          "[08/10/2026, 9:28 AM] Taylor: I will finish testing the payment flows before 3 PM.",
          "[08/10/2026, 9:32 AM] Sam: Has marketing received the updated banner graphics?",
          "[08/10/2026, 9:35 AM] Jamie: Yes, sent them this morning."
        ].join("\n")
      },
      {
        id: "en-server",
        icon: "⚠️",
        title: "Emergency Database Outage Fix",
        desc: "Critical production incident, failover to replica, and post-mortem assignment.",
        tags: ["Urgent", "Infrastructure", "Incident"],
        text: [
          "[14/10/2026, 14:05] Alex: Urgent: API gateway is throwing 502 errors on production.",
          "[14/10/2026, 14:07] Dev: Looking into the connection pool right now. High CPU on db-cluster-1.",
          "[14/10/2026, 14:10] Alex: Decision: failover to replica cluster immediately.",
          "[14/10/2026, 14:12] Sara: Replica cluster is healthy. Switching DNS traffic now.",
          "[14/10/2026, 14:15] Dev: Failover complete. Error rates back to 0.01%.",
          "[14/10/2026, 14:20] Alex: Great job team. @Sara, please prepare the post-mortem report by tomorrow morning.",
          "[14/10/2026, 14:22] Sara: I will write and share the report before 10 AM."
        ].join("\n")
      },
      {
        id: "en-marketing",
        icon: "📢",
        title: "Diwali Campaign & Social Media",
        desc: "Ad creative review, budget boosting decision, and influencer outreach.",
        tags: ["Marketing", "Campaign", "Social"],
        text: [
          "[02/11/2026, 11:00 AM] Ananya: The festive campaign visual assets are ready for review.",
          "[02/11/2026, 11:05 AM] Rohan: Can everyone review the video reels by 2 PM today?",
          "[02/11/2026, 11:12 AM] Ananya: Decision: we are boosting Instagram and YouTube ads starting Friday.",
          "[02/11/2026, 11:18 AM] Rohan: I will schedule the influencer collaborations tonight.",
          "[02/11/2026, 11:22 AM] Meera: Did legal sign off on the lucky draw terms?",
          "[02/11/2026, 11:26 AM] Ananya: Yes, approved with no changes."
        ].join("\n")
      },
      {
        id: "en-budget",
        icon: "💰",
        title: "Q4 Engineering Budget Review",
        desc: "Cloud infrastructure savings, AI tooling approvals, and purchase orders.",
        tags: ["Finance", "Budget", "Approval"],
        text: [
          "[18/10/2026, 10:00 AM] Marcus: Reviewing Q4 infrastructure and licensing costs.",
          "[18/10/2026, 10:06 AM] Elena: The cloud compute bill is 15% under budget this month.",
          "[18/10/2026, 10:12 AM] Marcus: Decision: approved $8,000 extra allocation for AI developer tooling.",
          "[18/10/2026, 10:18 AM] Elena: I will send the purchase orders to procurement by tomorrow noon.",
          "[18/10/2026, 10:24 AM] David: Are we renewing the Figma enterprise plan as well?",
          "[18/10/2026, 10:28 AM] Marcus: Yes, renewal approved for another year."
        ].join("\n")
      },
      {
        id: "en-retreat",
        icon: "🌴",
        title: "Goa Team Retreat Planning",
        desc: "Date finalization, resort booking confirmation, and hackathon organization.",
        tags: ["Team Event", "Travel", "Logistics"],
        text: [
          "[05/11/2026, 15:30] Vikram: Let's finalize our annual team retreat dates.",
          "[05/11/2026, 15:35] Neha: Dates proposed are November 20-22 in South Goa.",
          "[05/11/2026, 15:40] Vikram: Decision: agreed on Nov 20-22. Resort booking confirmed.",
          "[05/11/2026, 15:45] Neha: Please submit your flight preferences in the sheet by Wednesday.",
          "[05/11/2026, 15:50] Arjun: I will organize the team hackathon and outdoor activities.",
          "[05/11/2026, 15:55] Vikram: Do we need vegetarian options for all meals? Yes, confirmed."
        ].join("\n")
      },
      {
        id: "en-client",
        icon: "🤝",
        title: "Acme Corp Deliverable Sign-Off",
        desc: "Client milestone sign-off, demo recap, and code handover schedule.",
        tags: ["Client", "Milestone", "Handover"],
        text: [
          "[22/10/2026, 16:00] Rachel: Acme Corp client demo went exceptionally well today!",
          "[22/10/2026, 16:05] Kevin: They approved all Phase 1 milestones without any revisions.",
          "[22/10/2026, 16:10] Rachel: Decision: final handover sign-off scheduled for Monday at 11 AM.",
          "[22/10/2026, 16:15] Kevin: I will package the source code and deployment guide tonight.",
          "[22/10/2026, 16:20] Rachel: @Kevin, please include the user credentials sheet as well.",
          "[22/10/2026, 16:25] Kevin: Understood, checklist is updated."
        ].join("\n")
      }
    ],

    kn: [
      {
        id: "kn-launch",
        icon: "🚀",
        title: "ಯೋಜನೆ ಬಿಡುಗಡೆ ಅಂತಿಮ ಸಿದ್ಧತೆ",
        desc: "ಅಪ್ಲಿಕೇಶನ್ ಬಿಡುಗಡೆ ಸಭೆ, ಡಿಸೈನ್ ನಿರ್ಧಾರಗಳು, ಬಜೆಟ್ ವರದಿ ಮತ್ತು ಕ್ಲೈಂಟ್ ಸಂವಹನ.",
        tags: ["ಬಿಡುಗಡೆ", "ನಿರ್ಧಾರಗಳು", "ಡೆಡ್‌ಲೈನ್‌ಗಳು"],
        text: [
          "[08/10/2026, 9:15 AM] ರಮೇಶ್: ಎಲ್ಲರಿಗೂ ನಮಸ್ಕಾರ, ಅಪ್ಲಿಕೇಶನ್ ಬಿಡುಗಡೆ ವಿಮರ್ಶೆ ಸಭೆ ಗುರುವಾರ ಬೆಳಿಗ್ಗೆ 10:00 ಗಂಟೆಗೆ ಇರುತ್ತದೆ.",
          "[08/10/2026, 9:18 AM] ಸುರೇಶ್: ದಯವಿಟ್ಟು ಎಲ್ಲರೂ ಸಿದ್ಧರಾಗಿ ಬನ್ನಿ ಮತ್ತು ಪರೀಕ್ಷಾ ವರದಿಯನ್ನು ತಂದುಕೊಡಿ.",
          "[08/10/2026, 9:22 AM] ರಮೇಶ್: ನಿರ್ಧಾರ: ನಾವು ಹೊಸ ಡಿಸೈನ್ ಮತ್ತು ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಸ್ಕ್ರೀನ್ ಬಳಸಲಿದ್ದೇವೆ.",
          "[08/10/2026, 9:25 AM] ಪ್ರಿಯಾ: ನಾನು ಬಜೆಟ್ ಮತ್ತು ತಾಂತ್ರಿಕ ವರದಿಯನ್ನು ಇಂದು ಸಂಜೆಯೊಳಗೆ ಕಳುಹಿಸುತ್ತೇನೆ.",
          "[08/10/2026, 9:30 AM] ಸುರೇಶ್: ಪ್ರಸ್ತುತ ಸ್ಥಿತಿಯ ಬಗ್ಗೆ ಯಾರಾದರೂ ಕ್ಲೈಂಟ್‌ಗೆ ಮಾಹಿತಿ ನೀಡಿದ್ದೀರಾ?",
          "[08/10/2026, 9:35 AM] ಪ್ರಿಯಾ: ಹೌದು, ನಾನು ಕ್ಲೈಂಟ್‌ಗೆ ಅಧಿಕೃತ ಇಮೇಲ್ ಕಳುಹಿಸಿದ್ದೇನೆ."
        ].join("\n")
      },
      {
        id: "kn-server",
        icon: "⚠️",
        title: "ತುರ್ತು ಸರ್ವರ್ ದೋಷ ಪರಿಹಾರ",
        desc: "ಡೇಟಾಬೇಸ್ ಸಮಸ್ಯೆ, ಬ್ಯಾಕಪ್ ಸರ್ವರ್‌ಗೆ ಬದಲಾವಣೆ ಮತ್ತು ವರದಿ ಸಲ್ಲಿಕೆ.",
        tags: ["ತುರ್ತು", "ತಾಂತ್ರಿಕ", "ಸರ್ವರ್"],
        text: [
          "[14/10/2026, 14:10] ಕಾರ್ತಿಕ್: ತುರ್ತು: ಲಾಗಿನ್ ಸರ್ವರ್‌ನಲ್ಲಿ ತಾಂತ್ರಿಕ ದೋಷ ಕಂಡುಬಂದಿದೆ.",
          "[14/10/2026, 14:12] ವಿನೋದ್: ಡೇಟಾಬೇಸ್ ಕನೆಕ್ಷನ್ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇನೆ. ಸಿಪಿಯು ಬಳಕೆ ಹೆಚ್ಚಾಗಿದೆ.",
          "[14/10/2026, 14:15] ಕಾರ್ತಿಕ್: ನಿರ್ಧಾರ: ಬ್ಯಾಕಪ್ ಸರ್ವರ್‌ಗೆ ಕೂಡಲೇ ಬದಲಾಯಿಸೋಣ.",
          "[14/10/2026, 14:18] ವಿನೋದ್: ಬದಲಾವಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ದೋಷ ಪರಿಹಾರವಾಗಿದೆ.",
          "[14/10/2026, 14:22] ಕಾರ್ತಿಕ್: ದಯವಿಟ್ಟು ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಘಟನೆಯ ವಿವರವಾದ ವರದಿ ಕಳುಹಿಸಿ.",
          "[14/10/2026, 14:25] ವಿನೋದ್: ಖಂಡಿತ, ನಾಳೆ 10 ಗಂಟೆಯೊಳಗೆ ವರದಿ ಸಿದ್ಧಪಡಿಸುತ್ತೇನೆ."
        ].join("\n")
      },
      {
        id: "kn-marketing",
        icon: "📢",
        title: "ದೀಪಾವಳಿ ಹಬ್ಬದ ಮಾರ್ಕೆಟಿಂಗ್ ಪ್ರಚಾರ",
        desc: "ಜಾಹೀರಾತು ಪೋಸ್ಟರ್‌ಗಳು, ಸೋಶಿಯಲ್ ಮೀಡಿಯಾ ಆಫರ್‌ಗಳು ಮತ್ತು ಇನ್‌ಫ್ಲುಯೆನ್ಸರ್ ಚರ್ಚೆ.",
        tags: ["ಮಾರ್ಕೆಟಿಂಗ್", "ಪ್ರಚಾರ", "ಜಾಹೀರಾತು"],
        text: [
          "[02/11/2026, 11:00 AM] ದೀಪಾ: ದೀಪಾವಳಿ ಹಬ್ಬದ ಆಫರ್ ಪೋಸ್ಟರ್‌ಗಳು ಸಿದ್ಧವಾಗಿವೆ.",
          "[02/11/2026, 11:05 AM] ರವಿಕಿರಣ್: ಎಲ್ಲರೂ ಇಂದು ಮಧ್ಯಾಹ್ನ 2 ಗಂಟೆಯೊಳಗೆ ವೀಡಿಯೊ ಪರಿಶೀಲಿಸಿ.",
          "[02/11/2026, 11:12 AM] ದೀಪಾ: ತೀರ್ಮಾನ: ಶುಕ್ರವಾರದಿಂದ ಸೋಶಿಯಲ್ ಮೀಡಿಯಾದಲ್ಲಿ ಜಾಹೀರಾತು ಆರಂಭಿಸೋಣ.",
          "[02/11/2026, 11:18 AM] ರವಿಕಿರಣ್: ನಾನು ಇನ್‌ಫ್ಲುಯೆನ್ಸರ್ ತಂಡದ ಜೊತೆ ಇಂದು ಸಂಜೆ ಮಾತನಾಡುತ್ತೇನೆ.",
          "[02/11/2026, 11:25 AM] ಮಂಜುಳಾ: ಕೊಡುಗೆಯ ನಿಯಮಗಳನ್ನು ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗಿದೆಯೇ?",
          "[02/11/2026, 11:30 AM] ದೀಪಾ: ಹೌದು, ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಅಪ್‌ಡೇಟ್ ಮಾಡಲಾಗಿದೆ."
        ].join("\n")
      },
      {
        id: "kn-trip",
        icon: "🌴",
        title: "ಚಿಕ್ಕಮಗಳೂರು ಕಚೇರಿ ಪ್ರವಾಸ ಯೋಜನೆ",
        desc: "ದಿನಾಂಕ ನಿಗದಿ, ರೆಸಾರ್ಟ್ ಬುಕಿಂಗ್, ಸಾರಿಗೆ ಮತ್ತು ಆಹಾರ ವ್ಯವಸ್ಥೆ.",
        tags: ["ಪ್ರವಾಸ", "ಸಂಭ್ರಮ", "ಆಯೋಜನೆ"],
        text: [
          "[05/11/2026, 15:30] ಚೇತನ್: ಈ ಬಾರಿಯ ವಾರ್ಷಿಕ ಕಚೇರಿ ಪ್ರವಾಸ ಚಿಕ್ಕಮಗಳೂರಿಗೆ ಎಂದು ನಿಗದಿ ಮಾಡೋಣ.",
          "[05/11/2026, 15:35] ಸುಷ್ಮಾ: ನವೆಂಬರ್ 22 ಮತ್ತು 23 ತಾರೀಕು ಎಲ್ಲರಿಗೂ ಅನುಕೂಲವೇ?",
          "[05/11/2026, 15:40] ಚೇತನ್: ನಿರ್ಧಾರ: ನವೆಂಬರ್ 22-23 ದಿನಾಂಕ ಖಚಿತಪಡಿಸಲಾಗಿದೆ. ರೆಸಾರ್ಟ್ ಬುಕಿಂಗ್ ಮುಗಿದಿದೆ.",
          "[05/11/2026, 15:45] ಸುಷ್ಮಾ: ದಯವಿಟ್ಟು ಬರುವವರು ನಾಳೆ ಸಂಜೆಯೊಳಗೆ ತಮ್ಮ ಹೆಸರು ನೋಂದಾಯಿಸಿ.",
          "[05/11/2026, 15:50] ವಿಜಯ್: ನಾನು ಸಾರಿಗೆ ಮತ್ತು ಆಹಾರದ ವ್ಯವಸ್ಥೆಯನ್ನು ನೋಡಿಕೊಳ್ಳುತ್ತೇನೆ.",
          "[05/11/2026, 15:55] ಚೇತನ್: ಎಲ್ಲರಿಗೂ ಶುಭವಾಗಲಿ, ಉತ್ತಮ ಪ್ರವಾಸವಾಗಲಿ."
        ].join("\n")
      },
      {
        id: "kn-client",
        icon: "🤝",
        title: "ಕ್ಲೈಂಟ್ ಪ್ರಾಜೆಕ್ಟ್ ಅಂತಿಮ ಹಸ್ತಾಂತರ",
        desc: "ಡೆಮೊ ಯಶಸ್ಸು, ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳ ಒಪ್ಪಿಗೆ ಮತ್ತು ಕೋಡ್ ಹಸ್ತಾಂತರ.",
        tags: ["ಕ್ಲೈಂಟ್", "ಪ್ರಾಜೆಕ್ಟ್", "ಹಸ್ತಾಂತರ"],
        text: [
          "[22/10/2026, 16:00] ಆನಂದ್: ಕ್ಲೈಂಟ್ ಡೆಮೊ ಯಶಸ್ವಿಯಾಗಿ ಮುಕ್ತಾಯಗೊಂಡಿದೆ.",
          "[22/10/2026, 16:05] ಭವ್ಯ: ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳಿಗೆ ಕ್ಲೈಂಟ್ ಒಪ್ಪಿಗೆ ನೀಡಿದ್ದಾರೆ.",
          "[22/10/2026, 16:10] ಆನಂದ್: ನಿರ್ಧಾರ: ಸೋಮವಾರ ಬೆಳಿಗ್ಗೆ 11:00 ಗಂಟೆಗೆ ಅಂತಿಮ ಕೋಡ್ ಹಸ್ತಾಂತರ.",
          "[22/10/2026, 16:15] ಭವ್ಯ: ನಾನು ಪ್ರಾಜೆಕ್ಟ್ ಡಾಕ್ಯುಮೆಂಟೇಶನ್ ಇಂದು ರಾತ್ರಿಯೊಳಗೆ ಮುಗಿಸುತ್ತೇನೆ.",
          "[22/10/2026, 16:20] ಆನಂದ್: ದಯವಿಟ್ಟು ಯೂಸರ್ ಗೈಡ್ ಕೂಡ ಜೊತೆಯಲ್ಲಿ ಸೇರಿಸಿ.",
          "[22/10/2026, 16:25] ಭವ್ಯ: ಖಂಡಿತ, ಎಲ್ಲವನ್ನೂ ಸೇರಿಸಿ ಜಿಪ್ ಫೈಲ್ ಮಾಡುತ್ತೇನೆ."
        ].join("\n")
      },
      {
        id: "kn-budget",
        icon: "💰",
        title: "ವಾರ್ಷಿಕ ಬಜೆಟ್ ಮತ್ತು ಹಣಕಾಸು ಸಭೆ",
        desc: "ಕ್ಲೌಡ್ ವೆಚ್ಚದ ಉಳಿತಾಯ, ಹೊಸ ಸಾಧನಗಳ ಖರೀದಿ ಅನುಮೋದನೆ.",
        tags: ["ಹಣಕಾಸು", "ಬಜೆಟ್", "ಅನುಮೋದನೆ"],
        text: [
          "[18/10/2026, 10:00 AM] ಪ್ರಕಾಶ್: ಮುಂದಿನ ತ್ರೈಮಾಸಿಕದ ಬಜೆಟ್ ಪರಿಶೀಲನೆ ಆರಂಭಿಸೋಣ.",
          "[18/10/2026, 10:06 AM] ಶ್ವೇತಾ: ಕ್ಲೌಡ್ ಸರ್ವರ್ ವೆಚ್ಚದಲ್ಲಿ ಶೇಕಡಾ 12 ರಷ್ಟು ಉಳಿತಾಯವಾಗಿದೆ.",
          "[18/10/2026, 10:12 AM] ಪ್ರಕಾಶ್: ತೀರ್ಮಾನ: ಹೊಸ ಲ್ಯಾಪ್‌ಟಾಪ್ ಮತ್ತು ಮಾನಿಟರ್ ಖರೀದಿಗೆ ಅನುಮೋದನೆ ನೀಡಲಾಗಿದೆ.",
          "[18/10/2026, 10:18 AM] ಶ್ವೇತಾ: ನಾನು ಹಣಕಾಸು ಇಲಾಖೆಗೆ ನಾಳೆ ಪತ್ರ ಕಳುಹಿಸುತ್ತೇನೆ.",
          "[18/10/2026, 10:24 AM] ವಿಕ್ರಮ್: ತರಬೇತಿ ಬಜೆಟ್ ಎಷ್ಟು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ?",
          "[18/10/2026, 10:30 AM] ಪ್ರಕಾಶ್: ಒಟ್ಟು 2 ಲಕ್ಷ ರೂಪಾಯಿ ಮೀಸಲಿಡಲಾಗಿದೆ."
        ].join("\n")
      }
    ],

    hi: [
      {
        id: "hi-launch",
        icon: "🚀",
        title: "उत्पाद लॉन्च और नई रिलीज़",
        desc: "अंतिम समीक्षा बैठक, यूआई डिज़ाइन का निर्णय और बजट रिपोर्ट।",
        tags: ["लॉन्च", "निर्णय", "डेडलाइन"],
        text: [
          "[08/10/2026, 9:15 AM] अमित: नमस्ते टीम, हमारे ऐप लॉन्च की अंतिम समीक्षा बैठक गुरुवार सुबह 10:00 बजे है।",
          "[08/10/2026, 9:18 AM] राहुल: कृपया सभी समय पर आएं और अपनी अंतिम रिपोर्ट साथ लाएं।",
          "[08/10/2026, 9:22 AM] अमित: फैसला: हम नए यूआई डिज़ाइन के साथ आगे बढ़ेंगे।",
          "[08/10/2026, 9:25 AM] पूजा: मैं आज शाम तक बजट और टेस्टिंग रिपोर्ट भेज दूंगी।",
          "[08/10/2026, 9:30 AM] राहुल: क्या क्लाइंट को नए अपडेट की जानकारी दे दी गई है?",
          "[08/10/2026, 9:35 AM] पूजा: हाँ, क्लाइंट को सुबह ईमेल भेज दिया गया है।"
        ].join("\n")
      },
      {
        id: "hi-server",
        icon: "⚠️",
        title: "आपातकालीन डेटाबेस सर्वर सुधार",
        desc: "प्रोडक्शन एरर, बैकअप क्लस्टर पर ट्रैफिक स्विच और रिपोर्ट।",
        tags: ["आपातकालीन", "सर्वर", "तकनीकी"],
        text: [
          "[14/10/2026, 14:10] विकास: तुरंत: मुख्य डेटाबेस सर्वर पर एरर आ रहे हैं।",
          "[14/10/2026, 14:12] सचिन: कनेक्शन पूल चेक कर रहा हूँ। लोड काफी अधिक है।",
          "[14/10/2026, 14:15] विकास: निर्णय: तुरंत बैकअप क्लस्टर पर ट्रैफिक स्विच करें।",
          "[14/10/2026, 14:18] सचिन: स्विच पूरा हो गया है। सेवा सामान्य हो गई है।",
          "[14/10/2026, 14:22] विकास: कृपया कल सुबह तक इसकी विस्तृत रिपोर्ट तैयार करें।",
          "[14/10/2026, 14:25] सचिन: मैं कल 10 बजे तक रिपोर्ट भेज दूंगा।"
        ].join("\n")
      },
      {
        id: "hi-marketing",
        icon: "📢",
        title: "दिवाली मार्केटिंग और सोशल मीडिया कैंपेन",
        desc: "क्रिएटिव रिव्यू, यूट्यूब ऐड प्रमोशन और इनफ्लुएंसर पार्टनरशिप।",
        tags: ["मार्केटिंग", "सोशल मीडिया", "कैंपेन"],
        text: [
          "[02/11/2026, 11:00 AM] नेहा: दिवाली स्पेशल ऑफर्स के क्रिएटिव तैयार हैं।",
          "[02/11/2026, 11:05 AM] रोहन: कृपया सभी आज दोपहर 2 बजे तक वीडियो रिव्यू करें।",
          "[02/11/2026, 11:12 AM] नेहा: फैसला: शुक्रवार से यूट्यूब और इंस्टाग्राम पर ऐड शुरू करेंगे।",
          "[02/11/2026, 11:18 AM] रोहन: मैं इनफ्लुएंसर टीम से आज शाम बात करूंगा।",
          "[02/11/2026, 11:25 AM] अंजलि: क्या डिस्काउंट कूपन एक्टिवेट हो गए हैं?",
          "[02/11/2026, 11:30 AM] नेहा: हाँ, वेबसाइट पर कोड लाइव हैं।"
        ].join("\n")
      },
      {
        id: "hi-trip",
        icon: "🌴",
        title: "मनाली टीम ट्रिप योजना",
        desc: "तारीख पक्की करना, होटल बुकिंग और आउटडोर एक्टिविटी प्लानिंग।",
        tags: ["टीम ट्रिप", "यात्रा", "योजना"],
        text: [
          "[05/11/2026, 15:30] वरुण: इस साल की टीम आउटिंग मनाली में फाइनल करते हैं।",
          "[05/11/2026, 15:35] स्नेहा: 20 से 23 नवंबर की तारीख सभी के लिए सही रहेगी।",
          "[05/11/2026, 15:40] वरुण: निर्णय: 20-23 नवंबर पक्का किया गया। होटल बुकिंग हो गई है।",
          "[05/11/2026, 15:45] स्नेहा: कृपया कल शाम तक सभी अपनी फ्लाइट की जानकारी भर दें।",
          "[05/11/2026, 15:50] दीपक: मैं आउटडोर एक्टिविटी और कैंपफायर की व्यवस्था देखूंगा।",
          "[05/11/2026, 15:55] वरुण: सभी समय पर तैयारी पूरी कर लें।"
        ].join("\n")
      },
      {
        id: "hi-client",
        icon: "🤝",
        title: "क्लाइंट प्रोजेक्ट अंतिम हैंडओवर",
        desc: "डेमो की सफलता, माइलस्टोन अप्रूवल और अंतिम कोड डिलीवरी।",
        tags: ["क्लाइंट", "प्रोजेक्ट", "डिलीवरी"],
        text: [
          "[22/10/2026, 16:00] गौरव: आज का क्लाइंट डेमो बहुत सफल रहा।",
          "[22/10/2026, 16:05] रिया: क्लाइंट ने बिना किसी बदलाव के सभी फीचर्स पास कर दिए।",
          "[22/10/2026, 16:10] गौरव: निर्णय: सोमवार सुबह 11 बजे अंतिम कोड हैंडओवर होगा।",
          "[22/10/2026, 16:15] रिया: मैं आज रात तक सभी दस्तावेज़ पूरे कर दूंगी।",
          "[22/10/2026, 16:20] गौरव: कृपया एडमिन क्रेडेंशियल्स भी सुरक्षित रूप से साझा करें।",
          "[22/10/2026, 16:25] रिया: जी, पासवर्ड शीट तैयार कर ली है।"
        ].join("\n")
      },
      {
        id: "hi-budget",
        icon: "💰",
        title: "चौथी तिमाही बजट समीक्षा",
        desc: "क्लाउड इन्फ्रास्ट्रक्चर बचत और नए सॉफ्टवेयर टूल्स की मंजूरी।",
        tags: ["बजट", "वित्त", "मंजूरी"],
        text: [
          "[18/10/2026, 10:00 AM] विवेक: Q4 बजट और इंफ्रास्ट्रक्चर खर्च की समीक्षा शुरू करते हैं।",
          "[18/10/2026, 10:06 AM] कविता: इस महीने क्लाउड बिल बजट से 10% कम आया है।",
          "[18/10/2026, 10:12 AM] विवेक: फैसला: नई टूल्स की खरीद के लिए अतिरिक्त फंड स्वीकृत किया गया।",
          "[18/10/2026, 10:18 AM] कविता: मैं कल फाइनेंस टीम को परचेस ऑर्डर भेज दूंगी।",
          "[18/10/2026, 10:24 AM] विवेक: क्या एनुअल सॉफ्टवेयर रिन्यूअल पूरा हो गया?",
          "[18/10/2026, 10:30 AM] कविता: हाँ, रिन्यूअल लेटर भेज दिया है।"
        ].join("\n")
      }
    ],

    te: [
      {
        id: "te-launch",
        icon: "🚀",
        title: "ప్రాజెక్ట్ లాంచ్ మరియు విడుదల ప్రణాళిక",
        desc: "యాప్ లాంచ్ రివ్యూ మీటింగ్, డిజైన్ నిర్ణయాలు మరియు బడ్జెట్ నివేదిక.",
        tags: ["లాంచ్", "నిర్ణయాలు", "డెడ్‌లైన్లు"],
        text: [
          "[08/10/2026, 9:15 AM] సురేష్: అందరికీ నమస్కారం, యాప్ లాంచ్ సమీక్షా సమావేశం గురువారం ఉదయం 10:00 గంటలకు ఉంటుంది.",
          "[08/10/2026, 9:18 AM] రాజేష్: దయచేసి అందరూ సమయానికి వచ్చి టెస్టింగ్ రిపోర్ట్ తీసుకురండి.",
          "[08/10/2026, 9:22 AM] సురేష్: నిర్ణయం: మేము కొత్త ఆన్‌బోర్డింగ్ స్క్రీన్‌లతో ముందుకు వెళ్తాము.",
          "[08/10/2026, 9:25 AM] స్వప్న: నేను బడ్జెట్ మరియు టెక్నికల్ రిపోర్ట్‌ను ఈరోజు సాయంత్రంలోగా పంపుతాను.",
          "[08/10/2026, 9:30 AM] రాజేష్: ప్రస్తుత స్థితి గురించి క్లయింట్‌కు సమాచారం అందించారా?",
          "[08/10/2026, 9:35 AM] స్వప్న: అవును, ఉదయమే ఇమెయిల్ పంపించాను."
        ].join("\n")
      },
      {
        id: "te-server",
        icon: "⚠️",
        title: "అత్యవసర సర్వర్ సమస్య పరిష్కారం",
        desc: "డేటాబేస్ లోపం, బ్యాకప్ క్లస్టర్‌కు మార్పు మరియు నివేదిక తయారీ.",
        tags: ["అత్యవసరం", "సర్వర్", "సాంకేతిక"],
        text: [
          "[14/10/2026, 14:10] ప్రవీణ్: అత్యవసరం: లాగిన్ సర్వర్‌లో సాంకేతిక సమస్య ఏర్పడింది.",
          "[14/10/2026, 14:12] కిరణ్: డేటాబేస్ కనెక్షన్‌ను పరిశీలిస్తున్నాను. లోడ్ ఎక్కువగా ఉంది.",
          "[14/10/2026, 14:15] ప్రవీణ్: నిర్ణయం: వెంటనే బ్యాకప్ సర్వర్‌కు ట్రాఫిక్‌ను మళ్లించండి.",
          "[14/10/2026, 14:18] కిరణ్: మార్పు పూర్తయింది. సర్వర్ సాధారణ స్థితికి వచ్చింది.",
          "[14/10/2026, 14:22] ప్రవీణ్: దయచేసి రేపు ఉదయానికి పూర్తి రిపోర్ట్ సిద్ధం చేయండి."
        ].join("\n")
      },
      {
        id: "te-marketing",
        icon: "📢",
        title: "సంక్రాంతి ప్రత్యేక మార్కెటింగ్ ప్రచారం",
        desc: "సోషల్ మీడియా ప్రకటనలు, వీడియో ప్రమోషన్ మరియు ప్రచార ప్రణాళిక.",
        tags: ["మార్కెటింగ్", "ప్రచారం", "సోషల్ మీడియా"],
        text: [
          "[02/11/2026, 11:00 AM] వాణి: పండుగ ప్రత్యేక ఆఫర్ల పోస్టర్లు సిద్ధంగా ఉన్నాయి.",
          "[02/11/2026, 11:05 AM] మహేష్: దయచేసి అందరూ ఈరోజు మధ్యాహ్నం 2 గంటలలోపు వీడియోలను సమీక్షించండి.",
          "[02/11/2026, 11:12 AM] వాణి: నిర్ణయం: శుక్రవారం నుండి యూట్యూబ్ మరియు ఇన్‌స్టాగ్రామ్‌లో యాడ్స్ ప్రారంభిస్తాము.",
          "[02/11/2026, 11:18 AM] మహేష్: నేను ఇన్‌ఫ్లుయెన్సర్ బృందంతో ఈ సాయంత్రం మాట్లాడతాను.",
          "[02/11/2026, 11:25 AM] రమ్య: ఆఫర్ కూపన్లు వెబ్‌సైట్‌లో లైవ్ అయ్యాయా?"
        ].join("\n")
      },
      {
        id: "te-trip",
        icon: "🌴",
        title: "అరకు టీమ్ ట్రిప్ ప్లానింగ్",
        desc: "తేదీల ఖరారు, రిసార్ట్ బుకింగ్ మరియు రవాణా ఏర్పాట్లు.",
        tags: ["టూర్", "టీమ్ ఈవెంట్", "ప్రణాళిక"],
        text: [
          "[05/11/2026, 15:30] చరణ్: ఈ సంవత్సరం వార్షిక టీమ్ ట్రిప్ అరకు లోయకు వెళ్దాం.",
          "[05/11/2026, 15:35] లావణ్య: నవంబర్ 20 నుండి 22 తేదీలు అందరికీ అనుకూలమేనా?",
          "[05/11/2026, 15:40] చరణ్: నిర్ణయం: నవంబర్ 20-22 ఖరారైంది. రిసార్ట్ బుకింగ్ పూర్తయింది.",
          "[05/11/2026, 15:45] లావణ్య: దయచేసి రేపు సాయంత్రంలోగా అందరూ తమ పేర్లు నమోదు చేసుకోండి.",
          "[05/11/2026, 15:50] తరుణ్: నేను బస్సు మరియు ఆహార ఏర్పాట్లను చూసుకుంటాను."
        ].join("\n")
      },
      {
        id: "te-client",
        icon: "🤝",
        title: "క్లయింట్ ప్రాజెక్ట్ తుది అప్పగింత",
        desc: "డెమో విజయం, క్లయింట్ ఆమోదం మరియు సోమవారం కోడ్ హ్యాండోవర్.",
        tags: ["క్లయింట్", "డెలివరీ", "హ్యాండోవర్"],
        text: [
          "[22/10/2026, 16:00] నవీన్: ఈరోజు క్లయింట్ డెమో చాలా బాగా జరిగింది.",
          "[22/10/2026, 16:05] సంధ్య: క్లయింట్ ఎటువంటి మార్పులు లేకుండా అన్ని ఫీచర్లను ఆమోదించారు.",
          "[22/10/2026, 16:10] నవీన్: నిర్ణయం: సోమవారం ఉదయం 11:00 గంటలకు తుది కోడ్ హ్యాండోవర్ జరుగుతుంది.",
          "[22/10/2026, 16:15] సంధ్య: నేను ప్రాజెక్ట్ డాక్యుమెంటేషన్‌ను ఈ రాత్రికల్లా పూర్తి చేస్తాను.",
          "[22/10/2026, 16:20] నవీన్: దయచేసి యూజర్ మాన్యువల్‌ను కూడా జత చేయండి."
        ].join("\n")
      },
      {
        id: "te-budget",
        icon: "💰",
        title: "వార్షిక బడ్జెట్ మరియు వనరుల సమీక్ష",
        desc: "క్లౌడ్ ఖర్చుల ఆదా, కొత్త పరికరాల కొనుగోలు ఆమోదం.",
        tags: ["బడ్జెట్", "ఆర్థికం", "వనరులు"],
        text: [
          "[18/10/2026, 10:00 AM] శ్రీధర్: వచ్చే త్రైమాసికం బడ్జెట్ సమీక్ష ప్రారంభిద్దాం.",
          "[18/10/2026, 10:06 AM] భావన: క్లౌడ్ సర్వర్ ఖర్చులలో 15% ఆదా నమోదైంది.",
          "[18/10/2026, 10:12 AM] శ్రీధర్: నిర్ణయం: కొత్త ల్యాప్‌టాప్‌లు మరియు టూల్స్ కొనుగోలుకు నిధులు మంజూరయ్యాయి.",
          "[18/10/2026, 10:18 AM] భావన: నేను ఫైనాన్స్ టీమ్‌కు రేపు ఉదయం పత్రాలను సమర్పిస్తాను.",
          "[18/10/2026, 10:24 AM] శ్రీధర్: శిక్షణా బడ్జెట్ కూడా కేటాయించబడిందా?"
        ].join("\n")
      }
    ],

    ta: [
      {
        id: "ta-launch",
        icon: "🚀",
        title: "தயாரிப்பு வெளியீடு இறுதி மதிப்பாய்வு",
        desc: "வெளியீட்டு தேதி உறுதி, பயனர் இடைமுக முடிவு மற்றும் சோதனைகள்.",
        tags: ["வெளியீடு", "முடிவுகள்", "காலக்கெடு"],
        text: [
          "[08/10/2026, 9:15 AM] கார்த்திக்: அனைவருக்கும் வணக்கம், செயலி வெளியீட்டு மதிப்பாய்வு வியாழன் காலை 10:00 மணிக்கு நடைபெறும்.",
          "[08/10/2026, 9:18 AM] சுரேஷ்: தயவுசெய்து அனைவரும் நேரத்திற்கு வந்து உங்கள் சோதனை அறிக்கையைக் கொண்டு வாருங்கள்.",
          "[08/10/2026, 9:22 AM] கார்த்திக்: முடிவு: நாங்கள் புதிய டார்க் மோட் வடிவமைப்பை இறுதி செய்துள்ளோம்.",
          "[08/10/2026, 9:25 AM] பிரியா: நான் பட்ஜெட் மற்றும் தொழில்நுட்ப அறிக்கையை இன்று மாலைக்குள் அனுப்புகிறேன்.",
          "[08/10/2026, 9:30 AM] சுரேஷ்: வாடிக்கையாளருக்கு நிலவரம் தெரிவிக்கப்பட்டுவிட்டதா?",
          "[08/10/2026, 9:35 AM] பிரியா: ஆம், காலையிலேயே மின்னஞ்சல் அனுப்பப்பட்டுவிட்டது."
        ].join("\n")
      },
      {
        id: "ta-server",
        icon: "⚠️",
        title: "அவசர சர்வர் பிழை திருத்தம்",
        desc: "பிரதான சர்வர் பிரச்சனை, மாற்று அமைப்பிற்கு மாறுதல் மற்றும் அறிக்கை.",
        tags: ["அவசரம்", "சர்வர்", "தொழில்நுட்பம்"],
        text: [
          "[14/10/2026, 14:10] விஜய்: அவசரம்: முதன்மை சர்வரில் இணைப்புப் பிழை ஏற்பட்டுள்ளது.",
          "[14/10/2026, 14:12] தினேஷ்: டேட்டாபேஸ் இணைப்பை ஆய்வு செய்கிறேன். சுமை அதிகமாக உள்ளது.",
          "[14/10/2026, 14:15] விஜய்: முடிவு: உடனடியாக காப்பு சர்வரிற்கு ட்ராஃபிக்கை மாற்றவும்.",
          "[14/10/2026, 14:18] தினேஷ்: மாற்றம் முடிந்தது. சேவை வழக்கம் போல் இயங்குகிறது.",
          "[14/10/2026, 14:22] விஜய்: தயவுசெய்து நாளை காலைக்குள் முழுமையான அறிக்கையை சமர்ப்பிக்கவும்."
        ].join("\n")
      },
      {
        id: "ta-marketing",
        icon: "📢",
        title: "பொங்கல் சிறப்பு விளம்பர பிரச்சாரம்",
        desc: "சமூக ஊடக விளம்பரங்கள், வீடியோ வெளியீடு மற்றும் பிரபலங்கள் ஒப்பந்தம்.",
        tags: ["சந்தைப்படுத்தல்", "விளம்பரம்", "சமூகம்"],
        text: [
          "[02/11/2026, 11:00 AM] அனு: பொங்கல் சிறப்பு சலுகைக்கான பதாகைகள் தயாராக உள்ளன.",
          "[02/11/2026, 11:05 AM] ரமேஷ்: தயவுசெய்து அனைவரும் இன்று மதியம் 2 மணிக்குள் வீடியோவை சரிபார்க்கவும்.",
          "[02/11/2026, 11:12 AM] அனு: முடிவு: வெள்ளிக்கிழமை முதல் யூடியூப் மற்றும் இன்ஸ்டாகிராமில் விளம்பரங்கள் தொடங்கும்.",
          "[02/11/2026, 11:18 AM] ரமேஷ்: நான் விளம்பரக் குழுவினருடன் இன்று மாலை பேசுகிறேன்.",
          "[02/11/2026, 11:25 AM] கவிதா: தள்ளுபடி கூப்பன்கள் இணையதளத்தில் சேர்க்கப்பட்டுவிட்டனவா?"
        ].join("\n")
      },
      {
        id: "ta-trip",
        icon: "🌴",
        title: "ஊட்டி குழு சுற்றுலா திட்டம்",
        desc: "தேதிகள் இறுதி செய்தல், தங்குமிடம் முன்பதிவு மற்றும் போக்குவரத்து.",
        tags: ["சுற்றுலா", "குழு நிகழ்வு", "திட்டம்"],
        text: [
          "[05/11/2026, 15:30] அரவிந்த்: இந்த ஆண்டின் குழு சுற்றுலா ஊட்டிக்கு செல்வோம்.",
          "[05/11/2026, 15:35] மேகலா: நவம்பர் 20 முதல் 22 தேதிகள் அனைவருக்கும் வசதியாக இருக்குமா?",
          "[05/11/2026, 15:40] அரவிந்த்: முடிவு: நவம்பர் 20-22 உறுதி செய்யப்பட்டது. தங்கும் விடுதி பதிவு முடிந்தது.",
          "[05/11/2026, 15:45] மேகலா: தயவுசெய்து நாளை மாலைக்குள் விருப்பப்பட்டியலை நிரப்பவும்.",
          "[05/11/2026, 15:50] பாலாஜி: பேருந்து மற்றும் உணவு ஏற்பாடுகளை நான் கவனித்துக் கொள்கிறேன்."
        ].join("\n")
      },
      {
        id: "ta-client",
        icon: "🤝",
        title: "வாடிக்கையாளர் திட்ட ஒப்படைப்பு",
        desc: "மாதிரி செயல்முறை வெற்றி, வாடிக்கையாளர் ஒப்புதல் மற்றும் குறியீடு ஒப்படைப்பு.",
        tags: ["வாடிக்கையாளர்", "திட்டம்", "ஒப்படைப்பு"],
        text: [
          "[22/10/2026, 16:00] சஞ்சய்: இன்று நடந்த வாடிக்கையாளர் செயல்விளக்கம் பெரும் வெற்றி பெற்றது.",
          "[22/10/2026, 16:05] திவ்யா: வாடிக்கையாளர் அனைத்து அம்சங்களையும் எந்த மாற்றமும் இன்றி ஏற்றுக்கொண்டார்.",
          "[22/10/2026, 16:10] சஞ்சய்: முடிவு: திங்கள் காலை 11:00 மணிக்கு இறுதி குறியீடு ஒப்படைப்பு.",
          "[22/10/2026, 16:15] திவ்யா: நான் ஆவணங்களை இன்று இரவுக்குள் தயார் செய்து விடுகிறேன்.",
          "[22/10/2026, 16:20] சஞ்சய்: தயவுசெய்து பயனர் கையேட்டையும் இணைக்கவும்."
        ].join("\n")
      },
      {
        id: "ta-budget",
        icon: "💰",
        title: "ஆண்டு நிதி ஒதுக்கீடு மதிப்பாய்வு",
        desc: "சேமிப்பு ஆய்வு, புதிய உபகரணங்கள் வாங்குதல் ஒப்புதல்.",
        tags: ["பட்ஜெட்", "நிதி", "ஒப்புதல்"],
        text: [
          "[18/10/2026, 10:00 AM] பிரகாஷ்: அடுத்த காலாண்டுக்கான நிதி மதிப்பாய்வைத் தொடங்குவோம்.",
          "[18/10/2026, 10:06 AM] ரேவதி: கிளவுட் சர்வர் செலவில் 12% சேமிக்கப்பட்டுள்ளது.",
          "[18/10/2026, 10:12 AM] பிரகாஷ்: முடிவு: புதிய கணினிகள் மற்றும் மென்பொருட்கள் வாங்க ஒப்புதல் அளிக்கப்பட்டது.",
          "[18/10/2026, 10:18 AM] ரேவதி: நிதித்துறைக்கு நாளை உரிய ஆவணங்களை அனுப்பிவிடுகிறேன்.",
          "[18/10/2026, 10:24 AM] பிரகாஷ்: பயிற்சி நிதி எவ்வளவு ஒதுக்கப்பட்டுள்ளது?"
        ].join("\n")
      }
    ],

    ml: [
      {
        id: "ml-launch",
        icon: "🚀",
        title: "പ്രോജക്ട് ലോഞ്ച് അന്തിമ അവലോകനം",
        desc: "ആപ്പ് ലോഞ്ച് മീറ്റിംഗ്, ഡിസൈൻ തീരുമാനങ്ങൾ, ബജറ്റ് റിപ്പോർട്ട്.",
        tags: ["ലോഞ്ച്", "തീരുമാനങ്ങൾ", "സമയപരിധി"],
        text: [
          "[08/10/2026, 9:15 AM] രാഹുൽ: എല്ലാവർക്കും നമസ്കാരം, ആപ്പ് ലോഞ്ച് അവലോകന യോഗം വ്യാഴാഴ്ച രാവിലെ 10:00 മണിക്ക് നടക്കും.",
          "[08/10/2026, 9:18 AM] മനു: ദയവായി എല്ലാവരും സമയത്ത് വരികയും ടെസ്റ്റിംഗ് റിപ്പോർട്ട് കൊണ്ടുവരികയും ചെയ്യുക.",
          "[08/10/2026, 9:22 AM] രാഹുൽ: തീരുമാനം: ഞങ്ങൾ പുതിയ ഓൺബോർഡിംഗ് സ്ക്രീനുകളുമായി മുന്നോട്ട് പോകും.",
          "[08/10/2026, 9:25 AM] അഞ്ജലി: ഞാൻ ബജറ്റ് റിപ്പോർട്ട് ഇന്ന് വൈകുന്നേരത്തിനകം അയക്കാം.",
          "[08/10/2026, 9:30 AM] മനു: ക്ലയന്റിനെ പുതിയ വിവരങ്ങൾ അറിയിച്ചോ?",
          "[08/10/2026, 9:35 AM] അഞ്ജലി: അതെ, രാവിലെ തന്നെ മെയിൽ അയച്ചിട്ടുണ്ട്."
        ].join("\n")
      },
      {
        id: "ml-server",
        icon: "⚠️",
        title: "അടിയന്തിര സെർവർ തകരാർ പരിഹാരം",
        desc: "ഡാറ്റാബേസ് തകരാർ, ബാക്കപ്പ് സെർവറിലേക്ക് മാറ്റൽ, സമഗ്ര റിപ്പോർട്ട്.",
        tags: ["അടിയന്തിരം", "സെർവർ", "സാങ്കേതികം"],
        text: [
          "[14/10/2026, 14:10] വിഷ്ണു: അടിയന്തിരം: ലോഗിൻ സെർവറിൽ വലിയ തകരാർ സംഭവിച്ചു.",
          "[14/10/2026, 14:12] അരുൺ: ഡാറ്റാബേസ് കണക്ഷൻ പരിശോധിക്കുന്നു. ലോഡ് വളരെ കൂടുതലാണ്.",
          "[14/10/2026, 14:15] വിഷ്ണു: തീരുമാനം: ഉടൻ തന്നെ ബാക്കപ്പ് ക്ലസ്റ്ററിലേക്ക് ട്രാഫിക് മാറ്റുക.",
          "[14/10/2026, 14:18] അരുൺ: മാറ്റം പൂർത്തിയായി. സെർവർ പ്രവർത്തനം സാധാരണ നിലയിലായി.",
          "[14/10/2026, 14:22] വിഷ്ണു: ദയവായി നാളെ രാവിലത്തേക്ക് വിശദമായ റിപ്പോർട്ട് തയ്യാറാക്കുക."
        ].join("\n")
      },
      {
        id: "ml-marketing",
        icon: "📢",
        title: "ഓണം മാർക്കറ്റിംഗ് കാമ്പെയ്ൻ",
        desc: "പ്രത്യേക പരസ്യങ്ങൾ, സോഷ്യൽ മീഡിയ കാമ്പെയ്ൻ, ഇൻഫ്ലുവൻസർ ചർച്ച.",
        tags: ["മാർക്കറ്റിംഗ്", "പരസ്യം", "സോഷ്യൽ മീഡിയ"],
        text: [
          "[02/11/2026, 11:00 AM] ലക്ഷ്മി: ഉത്സവ ഓഫർ പോസ്റ്ററുകൾ തയ്യാറായിക്കഴിഞ്ഞു.",
          "[02/11/2026, 11:05 AM] സൂരജ്: എല്ലാവരും ഇന്ന് ഉച്ചയ്ക്ക് 2 മണിക്കുള്ളിൽ വീഡിയോ പരിശോധിക്കുക.",
          "[02/11/2026, 11:12 AM] ലക്ഷ്മി: തീരുമാനം: വെള്ളിയാഴ്ച മുതൽ യൂട്യൂബിലും ഇൻസ്റ്റാഗ്രാമിലും പരസ്യം ആരംഭിക്കും.",
          "[02/11/2026, 11:18 AM] സൂരജ്: ഞാൻ ഇൻഫ്ലുവൻസർ ടീമുമായി ഇന്ന് സംസാരിക്കും.",
          "[02/11/2026, 11:25 AM] രമ്യ: വെബ്സൈറ്റിൽ ഓഫർ കോഡുകൾ ലൈവ് ആയോ?"
        ].join("\n")
      },
      {
        id: "ml-trip",
        icon: "🌴",
        title: "മൂന്നാർ ടീം ട്രിപ്പ് പ്ലാനിംഗ്",
        desc: "തീയതി നിശ്ചയിക്കൽ, റിസോർട്ട് ബുക്കിംഗ്, യാത്രാ ക്രമീകരണങ്ങൾ.",
        tags: ["ട്രിപ്പ്", "ടൂർ", "പ്ലാനിംഗ്"],
        text: [
          "[05/11/2026, 15:30] കിരൺ: ഈ വർഷത്തെ ടീം ട്രിപ്പ് മൂന്നാറിലേക്ക് പോകാമെന്ന് തീരുമാനിക്കാം.",
          "[05/11/2026, 15:35] ശരണ്യ: നവംബർ 20 മുതൽ 22 വരെയുള്ള തീയതികൾ സൗകര്യപ്രദമാണോ?",
          "[05/11/2026, 15:40] കിരൺ: തീരുമാനം: നവംബർ 20-22 സ്ഥിരീകരിച്ചു. റിസോർട്ട് ബുക്കിംഗ് കഴിഞ്ഞു.",
          "[05/11/2026, 15:45] ശരണ്യ: ദയവായി നാളെ വൈകുന്നേരത്തിനകം പേരുകൾ രജിസ്റ്റർ ചെയ്യുക.",
          "[05/11/2026, 15:50] അഖിൽ: യാത്രാ വാഹനങ്ങളും ഭക്ഷണവും ഞാൻ ക്രമീകരിക്കാം."
        ].join("\n")
      },
      {
        id: "ml-client",
        icon: "🤝",
        title: "ക്ലയന്റ് പ്രോജക്ട് കൈമാറൽ",
        desc: "ഡെമോ വിജയം, ക്ലയന്റ് അംഗീകാരം, സോഫ്റ്റ്‌വെയർ കൈമാറ്റം.",
        tags: ["ക്ലയന്റ്", "ഡെലിവറി", "പ്രോജക്ട്"],
        text: [
          "[22/10/2026, 16:00] നിതിൻ: ഇന്നത്തെ ക്ലയന്റ് ഡെമോ വളരെ വിജയകരമായിരുന്നു.",
          "[22/10/2026, 16:05] ദീപ്തി: മാറ്റങ്ങളൊന്നും കൂടാതെ ക്ലയന്റ് പ്രോജക്ട് അംഗീകരിച്ചു.",
          "[22/10/2026, 16:10] നിതിൻ: തീരുമാനം: തിങ്കളാഴ്ച രാവിലെ 11:00 മണിക്ക് അന്തിമ കോഡ് കൈമാറും.",
          "[22/10/2026, 16:15] ദീപ്തി: ഞാൻ ഡോക്യുമെന്റേഷൻ ഇന്ന് രാത്രി തന്നെ പൂർത്തിയാക്കും.",
          "[22/10/2026, 16:20] നിതിൻ: ദയവായി യൂസർ മാനുവലും കൂടെ ചേർക്കുക."
        ].join("\n")
      },
      {
        id: "ml-budget",
        icon: "💰",
        title: "വാർഷിക ബജറ്റ് അവലോകനം",
        desc: "ക്ലൗഡ് ചെലവ് ലാഭം, പുതിയ ടൂളുകൾ വാങ്ങുന്നതിനുള്ള അംഗീകാരം.",
        tags: ["ബജറ്റ്", "ധനകാര്യം", "അംഗീകാരം"],
        text: [
          "[18/10/2026, 10:00 AM] പ്രമോദ്: അടുത്ത പാദത്തിലേക്കുള്ള ബജറ്റ് അവലോകനം തുടങ്ങാം.",
          "[18/10/2026, 10:06 AM] വിദ്യ: ക്ലൗഡ് സെർവർ ചെലവിൽ 15% ലാഭം രേഖപ്പെടുത്തി.",
          "[18/10/2026, 10:12 AM] പ്രമോദ്: തീരുമാനം: പുതിയ ലാപ്‌ടോപ്പുകൾ വാങ്ങാൻ അനുമതി ലഭിച്ചു.",
          "[18/10/2026, 10:18 AM] വിദ്യ: ഞാൻ ധനകാര്യ വിഭാഗത്തിന് നാളെ അപേക്ഷ അയക്കാം.",
          "[18/10/2026, 10:24 AM] പ്രമോദ്: ട്രെയിനിംഗ് ബജറ്റ് എത്രയാണ് വകയിരുത്തിയത്?"
        ].join("\n")
      }
    ],

    es: [
      {
        id: "es-launch",
        icon: "🚀",
        title: "Lanzamiento Final del Producto",
        desc: "Revisión final de QA, pasarela de pagos y programación del lanzamiento.",
        tags: ["Lanzamiento", "Decisiones", "Plazos"],
        text: [
          "[08/10/2026, 9:15 AM] Carlos: Buenos días a todos, la revisión final de lanzamiento es este jueves a las 10:00.",
          "[08/10/2026, 9:18 AM] Laura: Por favor verifiquen la integración de pagos antes de las 16:00 de hoy.",
          "[08/10/2026, 9:22 AM] Carlos: Decisión: avanzaremos con el nuevo diseño de onboarding en modo oscuro.",
          "[08/10/2026, 9:25 AM] Sofía: Enviaré el informe financiero y de pruebas hoy antes de que termine el día.",
          "[08/10/2026, 9:30 AM] Laura: ¿El cliente ya recibió la notificación oficial?",
          "[08/10/2026, 9:35 AM] Sofía: Sí, el correo se envió esta mañana."
        ].join("\n")
      },
      {
        id: "es-server",
        icon: "⚠️",
        title: "Reparación Urgente de Servidor",
        desc: "Incidencia crítica en base de datos, conmutación por error y post-mortem.",
        tags: ["Urgente", "Servidor", "Infraestructura"],
        text: [
          "[14/10/2026, 14:10] Javier: Urgente: la pasarela de API está dando errores 502 en producción.",
          "[14/10/2026, 14:12] Mateo: Revisando el grupo de conexiones. Alto uso de CPU en la base de datos.",
          "[14/10/2026, 14:15] Javier: Decisión: conmutar inmediatamente al clúster de réplica.",
          "[14/10/2026, 14:18] Mateo: Conmutación completada. Las tasas de error han vuelto a la normalidad.",
          "[14/10/2026, 14:22] Javier: Excelente trabajo. Por favor prepara el informe post-mortem para mañana por la mañana."
        ].join("\n")
      },
      {
        id: "es-marketing",
        icon: "📢",
        title: "Campaña de Marketing y Redes Sociales",
        desc: "Revisión creativa, presupuesto de anuncios e influencers.",
        tags: ["Marketing", "Campaña", "Redes"],
        text: [
          "[02/11/2026, 11:00 AM] Lucía: Los recursos gráficos para la campaña navideña están listos.",
          "[02/11/2026, 11:05 AM] Andrés: Por favor revisen los videos publicitarios antes de las 14:00.",
          "[02/11/2026, 11:12 AM] Lucía: Decisión: aumentaremos la inversión en Instagram y YouTube a partir del viernes.",
          "[02/11/2026, 11:18 AM] Andrés: Me pondré en contacto con los influencers esta tarde.",
          "[02/11/2026, 11:25 AM] Paula: ¿Los cupones de descuento ya están activos en la web?"
        ].join("\n")
      },
      {
        id: "es-retreat",
        icon: "🌴",
        title: "Planificación del Retiro de Equipo",
        desc: "Elección de fechas, reserva de hotel y actividades al aire libre.",
        tags: ["Retiro", "Equipo", "Viaje"],
        text: [
          "[05/11/2026, 15:30] Manuel: Definamos las fechas para el retiro anual del equipo.",
          "[05/11/2026, 15:35] Elena: Proponemos del 20 al 22 de noviembre en Mallorca.",
          "[05/11/2026, 15:40] Manuel: Decisión: fechas acordadas para el 20-22 de nov. Hotel reservado.",
          "[05/11/2026, 15:45] Elena: Por favor confirmen su asistencia en el documento antes del miércoles.",
          "[05/11/2026, 15:50] Diego: Me encargo de organizar el hackathon y las actividades."
        ].join("\n")
      },
      {
        id: "es-client",
        icon: "🤝",
        title: "Entrega Final y Aprobación del Cliente",
        desc: "Demostración exitosa, aprobación de hitos y traspaso de código.",
        tags: ["Cliente", "Entrega", "Hitos"],
        text: [
          "[22/10/2026, 16:00] Martín: La demostración con el cliente fue un éxito rotundo.",
          "[22/10/2026, 16:05] Clara: Aprobaron todos los módulos sin solicitar cambios.",
          "[22/10/2026, 16:10] Martín: Decisión: entrega final y firma programada para el lunes a las 11:00.",
          "[22/10/2026, 16:15] Clara: Terminaré la documentación del proyecto esta noche.",
          "[22/10/2026, 16:20] Martín: Por favor incluye la guía de instalación para el usuario."
        ].join("\n")
      },
      {
        id: "es-budget",
        icon: "💰",
        title: "Revisión del Presupuesto Trimestral",
        desc: "Ahorro en servidores y aprobación de nuevas herramientas de desarrollo.",
        tags: ["Presupuesto", "Finanzas", "Aprobación"],
        text: [
          "[18/10/2026, 10:00 AM] Roberto: Iniciemos la revisión presupuestaria del cuarto trimestre.",
          "[18/10/2026, 10:06 AM] Natalia: El gasto en la nube se redujo un 12% este mes.",
          "[18/10/2026, 10:12 AM] Roberto: Decisión: aprobados 7.000€ adicionales para herramientas de desarrollo.",
          "[18/10/2026, 10:18 AM] Natalia: Enviaré las órdenes de compra a finanzas mañana al mediodía.",
          "[18/10/2026, 10:24 AM] Roberto: ¿La renovación de licencias ya está tramitada?"
        ].join("\n")
      }
    ],

    fr: [
      {
        id: "fr-launch",
        icon: "🚀",
        title: "Sprint Final du Lancement de Produit",
        desc: "Validation qualité, tests de paiement et planification du lancement.",
        tags: ["Lancement", "Décisions", "Échéances"],
        text: [
          "[08/10/2026, 9:15 AM] Thomas: Bonjour à tous, la revue finale du lancement aura lieu jeudi à 10h00.",
          "[08/10/2026, 9:18 AM] Camille: Merci de vérifier l'intégration de la passerelle de paiement avant 16h aujourd'hui.",
          "[08/10/2026, 9:22 AM] Thomas: Décision: nous validons la nouvelle interface d'intégration en mode sombre.",
          "[08/10/2026, 9:25 AM] Julie: J'enverrai le rapport de test et le budget d'ici ce soir.",
          "[08/10/2026, 9:30 AM] Camille: Le client a-t-il bien reçu la dernière mise à jour?",
          "[08/10/2026, 9:35 AM] Julie: Oui, un e-mail officiel a été envoyé ce matin."
        ].join("\n")
      },
      {
        id: "fr-server",
        icon: "⚠️",
        title: "Réparation Urgente de Panne Serveur",
        desc: "Incident de production, basculement vers réplica et rapport d'incident.",
        tags: ["Urgent", "Serveur", "Incident"],
        text: [
          "[14/10/2026, 14:10] Nicolas: Urgent: la passerelle API renvoie des erreurs 502 en production.",
          "[14/10/2026, 14:12] Antoine: J'analyse le pool de connexions. Utilisation CPU critique sur la base de données.",
          "[14/10/2026, 14:15] Nicolas: Décision: basculer immédiatement sur le cluster répliqué.",
          "[14/10/2026, 14:18] Antoine: Basculement effectué avec succès. Taux d'erreur revenu à la normale.",
          "[14/10/2026, 14:22] Nicolas: Beau travail. Merci de préparer le rapport d'incident d'ici demain matin."
        ].join("\n")
      },
      {
        id: "fr-marketing",
        icon: "📢",
        title: "Campagne Marketing et Réseaux Sociaux",
        desc: "Revue créative, décision d'augmentation budgétaire et partenariats.",
        tags: ["Marketing", "Campagne", "Réseaux"],
        text: [
          "[02/11/2026, 11:00 AM] Sarah: Les visuels de la campagne des fêtes sont prêts pour relecture.",
          "[02/11/2026, 11:05 AM] Maxime: Merci de valider les vidéos promotionnelles avant 14h aujourd'hui.",
          "[02/11/2026, 11:12 AM] Sarah: Décision: nous augmentons les campagnes publicitaires sur Instagram dès vendredi.",
          "[02/11/2026, 11:18 AM] Maxime: Je contacterai les créateurs de contenu ce soir.",
          "[02/11/2026, 11:25 AM] Emma: Les codes promotionnels sont-ils opérationnels sur le site?"
        ].join("\n")
      },
      {
        id: "fr-retreat",
        icon: "🌴",
        title: "Organisation du Séminaire d'Équipe",
        desc: "Dates confirmées, réservation d'hôtel et organisation d'activités.",
        tags: ["Séminaire", "Équipe", "Voyage"],
        text: [
          "[05/11/2026, 15:30] Laurent: Finalisons les dates du séminaire annuel d'entreprise.",
          "[05/11/2026, 15:35] Claire: Les dates suggérées sont du 20 au 22 novembre à Annecy.",
          "[05/11/2026, 15:40] Laurent: Décision: dates validées du 20 au 22 nov. Réservation de l'hôtel effectuée.",
          "[05/11/2026, 15:45] Claire: Merci de remplir vos préférences de transport d'ici mercredi.",
          "[05/11/2026, 15:50] Romain: Je m'occupe d'organiser les ateliers et activités de plein air."
        ].join("\n")
      },
      {
        id: "fr-client",
        icon: "🤝",
        title: "Livraison Finale et Recette Client",
        desc: "Démonstration client réussie, validation sans réserve et livraison.",
        tags: ["Client", "Recette", "Livraison"],
        text: [
          "[22/10/2026, 16:00] Alexandre: La démonstration client s'est déroulée à merveille aujourd'hui.",
          "[22/10/2026, 16:05] Léa: Ils ont validé l'ensemble des fonctionnalités sans réserve.",
          "[22/10/2026, 16:10] Alexandre: Décision: livraison officielle et signature prévues lundi à 11h.",
          "[22/10/2026, 16:15] Léa: Je finaliserai la documentation technique ce soir.",
          "[22/10/2026, 16:20] Alexandre: N'oublie pas d'inclure le guide utilisateur."
        ].join("\n")
      },
      {
        id: "fr-budget",
        icon: "💰",
        title: "Revue Budgétaire Trimestrielle",
        desc: "Économies d'infrastructure cloud et validation d'outils d'IA.",
        tags: ["Budget", "Finance", "Validation"],
        text: [
          "[18/10/2026, 10:00 AM] Sébastien: Commençons la revue budgétaire pour le quatrième trimestre.",
          "[18/10/2026, 10:06 AM] Manon: La facture d'infrastructure cloud a baissé de 14% ce mois-ci.",
          "[18/10/2026, 10:12 AM] Sébastien: Décision: allocation supplémentaire de 8 000 € approuvée pour les outils IA.",
          "[18/10/2026, 10:18 AM] Manon: J'enverrai les bons de commande au service financier demain midi.",
          "[18/10/2026, 10:24 AM] Sébastien: Le renouvellement des licences est-il acté?"
        ].join("\n")
      }
    ],

    de: [
      {
        id: "de-launch",
        icon: "🚀",
        title: "Finaler Produkt-Launch Sprint",
        desc: "Abschluss-Review, Zahlungs-Gateways und Launch-Terminierung.",
        tags: ["Launch", "Entscheidungen", "Fristen"],
        text: [
          "[08/10/2026, 9:15 AM] Michael: Guten Morgen zusammen, unser finales Launch-Review findet diesen Donnerstag um 10:00 Uhr statt.",
          "[08/10/2026, 9:18 AM] Laura: Bitte prüfen Sie die Zahlungs-Gateway-Integration heute bis spätestens 16:00 Uhr.",
          "[08/10/2026, 9:22 AM] Michael: Entscheidung: Wir setzen auf das neue Dark-Mode-Onboarding.",
          "[08/10/2026, 9:25 AM] Anna: Ich werde den Budget- und Testbericht heute bis zum Feierabend senden.",
          "[08/10/2026, 9:30 AM] Laura: Wurde der Kunde bereits über das Release informiert?",
          "[08/10/2026, 9:35 AM] Anna: Ja, die E-Mail ging heute früh raus."
        ].join("\n")
      },
      {
        id: "de-server",
        icon: "⚠️",
        title: "Notfall-Serverausfall Behebung",
        desc: "Kritischer Datenbankausfall, Failover und Ursachenanalyse.",
        tags: ["Dringend", "Server", "Vorfall"],
        text: [
          "[14/10/2026, 14:10] Stefan: Dringend: Das API-Gateway meldet 502-Fehler in Produktion.",
          "[14/10/2026, 14:12] Markus: Ich prüfe den Connection-Pool. Sehr hohe CPU-Auslastung auf der Datenbank.",
          "[14/10/2026, 14:15] Stefan: Entscheidung: Sofortiges Failover auf den Replica-Cluster durchführen.",
          "[14/10/2026, 14:18] Markus: Umschaltung erfolgreich abgeschlossen. Fehlerrate wieder im Normalbereich.",
          "[14/10/2026, 14:22] Stefan: Sehr gute Arbeit. Bitte bis morgen früh den Post-Mortem-Bericht erstellen."
        ].join("\n")
      },
      {
        id: "de-marketing",
        icon: "📢",
        title: "Marketingkampagne & Social Media",
        desc: "Grafik-Prüfung, Erhöhung des Werbebudgets und Influencer-Kooperation.",
        tags: ["Marketing", "Kampagne", "Social Media"],
        text: [
          "[02/11/2026, 11:00 AM] Lisa: Die Werbemittel für die Feiertagskampagne liegen zur Prüfung bereit.",
          "[02/11/2026, 11:05 AM] Jonas: Bitte prüfen Sie die Videos heute bis spätestens 14:00 Uhr.",
          "[02/11/2026, 11:12 AM] Lisa: Entscheidung: Wir erhöhen das Werbebudget auf Instagram ab Freitag.",
          "[02/11/2026, 11:18 AM] Jonas: Ich werde die Influencer-Partner heute Abend kontaktieren.",
          "[02/11/2026, 11:25 AM] Katrin: Sind die Rabattcodes im Onlineshop bereits aktiv?"
        ].join("\n")
      },
      {
        id: "de-retreat",
        icon: "🌴",
        title: "Planung des Team-Events",
        desc: "Terminabsprache, Hotelreservierung und Aktivitätsplanung.",
        tags: ["Team-Event", "Reise", "Planung"],
        text: [
          "[05/11/2026, 15:30] Christian: Lasst uns die Termine für unser jährliches Team-Event festlegen.",
          "[05/11/2026, 15:35] Sarah: Vorgeschlagen ist der 20. bis 22. November im Allgäu.",
          "[05/11/2026, 15:40] Christian: Entscheidung: Termin vom 20.-22. Nov bestätigt. Hotel ist gebucht.",
          "[05/11/2026, 15:45] Sarah: Bitte tragt eure Anreisewünsche bis Mittwoch in die Liste ein.",
          "[05/11/2026, 15:50] Felix: Ich übernehme die Organisation der Outdoor-Aktivitäten."
        ].join("\n")
      },
      {
        id: "de-client",
        icon: "🤝",
        title: "Finale Kundenübergabe & Abnahme",
        desc: "Erfolgreiche Demo, vollständige Abnahme und Code-Übergabe.",
        tags: ["Kunde", "Abnahme", "Übergabe"],
        text: [
          "[22/10/2026, 16:00] Tobias: Die Kundendemo verlief heute überaus erfolgreich.",
          "[22/10/2026, 16:05] Julia: Der Kunde hat alle Module ohne Einwände abgenommen.",
          "[22/10/2026, 16:10] Tobias: Entscheidung: Offizielle Übergabe und Abnahme am Montag um 11:00 Uhr.",
          "[22/10/2026, 16:15] Julia: Ich werde die Projektdokumentation heute Abend fertigstellen.",
          "[22/10/2026, 16:20] Tobias: Bitte denke auch an das Benutzerhandbuch."
        ].join("\n")
      },
      {
        id: "de-budget",
        icon: "💰",
        title: "Quartals-Budgetprüfung",
        desc: "Cloud-Einsparungen und Genehmigung zusätzlicher Softwarelizenzen.",
        tags: ["Budget", "Finanzen", "Genehmigung"],
        text: [
          "[18/10/2026, 10:00 AM] Frank: Beginnen wir mit der Budgetprüfung für das vierte Quartal.",
          "[18/10/2026, 10:06 AM] Nicole: Die Cloud-Infrastrukturkosten sind diesen Monat um 11% gesunken.",
          "[18/10/2026, 10:12 AM] Frank: Entscheidung: Zusätzliche 7.500 € für neue Entwicklertools genehmigt.",
          "[18/10/2026, 10:18 AM] Nicole: Ich reiche die Bestellungen morgen Mittag bei der Buchhaltung ein.",
          "[18/10/2026, 10:24 AM] Frank: Wurden alle Lizenzen fristgerecht verlängert?"
        ].join("\n")
      }
    ]
  };

  root.SampleConversations = SAMPLE_CONVERSATIONS;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SAMPLE_CONVERSATIONS;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
