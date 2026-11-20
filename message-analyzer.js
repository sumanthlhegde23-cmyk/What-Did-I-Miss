(function attachMessageAnalyzer(root) {
  "use strict";

  // Helper to build robust Unicode-aware word boundary regexes
  function unicodeWord(words) {
    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    return new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${escaped})(?=[^\\p{L}\\p{N}_]|$)`, "iu");
  }

  // English Patterns
  const urgentPattern = /\b(?:urgent(?:ly)?|asap|immediately|critical|blocker|blocked|overdue|time[- ]sensitive|high priority|emergency|crucial|p0|sev[- ]?1)\b/i;
  const deadlineDatePattern = /(?:today|tonight|tomorrow|(?:next\s+)?(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s+(?:morning|afternoon|evening|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?|\d{1,2}(?:st|nd|rd|th)?(?:\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?)/i;
  const implicitTaskDeadlinePattern = /\b(?:today|tonight|tomorrow|(?:next\s+)?(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2})\b/i;
  const deadlineCuePattern = /\b(?:due|deadline|by|before|no later than|until|cutoff|target date)\b/i;
  const decisionPattern = /(?:\bdecision\s*:|\b(?:decided|agreed|approved|confirmed|let['’]s go with|we['’]ll use|moving forward|final choice|we are using|selected|chosen|resolved|settled on|conclusion:|signed off|greenlit|go-ahead)\b)/i;
  const updatePattern = /\b(?:heads[- ]up|fyi|announcement|important update|change of plan|changed to|moved to|cancelled|canceled|postponed|rescheduled|now scheduled|is live|launched|outage|incident|breaking change|milestone|release|status update)\b/i;
  const directedTaskPattern = /\b(?:please|can you|could you|would you|need you to|your (?:action|task|turn) is|assigning to you|action required|to-do)\b/i;
  const taskVerbPattern = /\b(?:review|send|share|prepare|update|schedule|follow up|follow-up|reply|respond|finish|complete|submit|create|fix|check|confirm|approve|upload|call|book|add|remove|publish|write|read|test|deploy|bring|take a look|inspect|investigate|implement|deliver)\b/i;
  const imperativeTaskPattern = /^\s*(?:(?:@[\p{L}\p{N}_.-]+)[,:\s]+)*(?:please\s+)?(?:review|send|share|prepare|update|schedule|follow up|follow-up|reply|respond|finish|complete|submit|create|fix|check|confirm|approve|upload|call|book|add|remove|publish|write|read|test|deploy|bring|take a look|inspect|investigate|implement|deliver)\b/iu;
  const commitmentPattern = /\b(?:i|we)(?:['’]ll| will| am going to| are going to| plan to| on it| will handle| will take care of)\s+(?:review|send|share|prepare|update|schedule|follow up|follow-up|reply|respond|finish|complete|submit|create|fix|check|confirm|approve|upload|call|book|add|remove|publish|write|read|test|deploy|bring|inspect|investigate|implement|deliver)\b/i;
  const chatterPattern = /^\s*(?:hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|thx|ok|okay|k|cool|sure|great|sounds good|yes|no|yep|nope|haha|lol|bye|see you|see ya|👍|👌|❤️|🙏|good night)\s*[.!]?\s*$/i;

  // Kannada Patterns
  const knDecisionPattern = /(?:ನಿರ್ಧಾರ\s*:|ತೀರ್ಮಾನ\s*:|(?:^|[^\p{L}\p{N}_])(?:ನಿರ್ಧಾರ|ತೀರ್ಮಾನ|ಒಪ್ಪಿಗೆ|ಖಚಿತ|ಖಚಿತಪಡಿಸಲಾಗಿದೆ|ಖಚಿತವಾಗಿದೆ|ಮಾಡೋಣ|ನಿರ್ಧರಿಸಲಾಗಿದೆ|ಅಂತಿಮ|ಫೈನಲ್|ಒಪ್ಪಿಕೊಳ್ಳಲಾಗಿದೆ|ತೀರ್ಮಾನಿಸಲಾಗಿದೆ|ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ|ತೀರ್ಮಾನವಾಯಿತು)(?=[^\p{L}\p{N}_]|$))/iu;
  const knActionPattern = unicodeWord(["ದಯವಿಟ್ಟು", "ಮಾಡಿ", "ಕಳುಹಿಸಿ", "ಕಳಿಸಿ", "ಪರಿಶೀಲಿಸಿ", "ನೋಡಿ", "ಸಿದ್ಧಪಡಿಸಿ", "ಮುಗಿಸಿ", "ಹಂಚಿಕೊಳ್ಳಿ", "ಅಪ್‌ಡೇಟ್", "ಅಪ್ಡೇಟ್", "ಸಲ್ಲಿಸಿ", "ತಿಳಿಸಿ", "ಮಾಹಿತಿ ನೀಡಿ", "ಪೂರ್ಣಗೊಳಿಸಿ", "ಕರೆ ಮಾಡಿ", "ಬುಕ್ ಮಾಡಿ", "ಸೇರಿಸಿ", "ತೆಗೆದುಹಾಕಿ", "ಬರೆಯಿರಿ", "ಓದಿ", "ಪರೀಕ್ಷಿಸಿ", "ತಯಾರಿಸಿ", "ವಹಿಸಲಾಗಿದೆ", "ಮಾಡಬೇಕಾಗಿದೆ", "ತಲುಪಿಸಿ", "ಬನ್ನಿ"]);
  const knCommitmentPattern = /(?:ನಾನು|ನಾವು|ಖಂಡಿತ)\s+(?:ಮಾಡುತ್ತೇನೆ|ಮಾಡುತ್ತೇವೆ|ಕಳುಹಿಸುತ್ತೇನೆ|ಕಳುಹಿಸುತ್ತೇವೆ|ಕಳಿಸುತ್ತೇನೆ|ಸಿದ್ಧಪಡಿಸುತ್ತೇನೆ|ನೋಡಿಕೊಳ್ಳುತ್ತೇನೆ|ಪರಿಶೀಲಿಸುತ್ತೇನೆ|ಮುಗಿಸುತ್ತೇನೆ|ಹಂಚಿಕೊಳ್ಳುತ್ತೇನೆ|ಸಿದ್ಧಪಡಿಸುತ್ತೇವೆ|ಮುಗಿಸುತ್ತೇವೆ)/iu;
  const knDeadlinePattern = unicodeWord(["ಇಂದು", "ಇಂದೇ", "ನಾಳೆ", "ನಾಳೆಯೊಳಗೆ", "ಸೋಮವಾರ", "ಮಂಗಳವಾರ", "ಬುಧವಾರ", "ಗುರುವಾರ", "ಶುಕ್ರವಾರ", "ಶನಿವಾರ", "ಭಾನುವಾರ", "ಒಳಗೆ", "ತನಕ", "ಸಮಯ", "ಕೊನೆಯ ದಿನಾಂಕ", "ಡೆಡ್‌ಲೈನ್", "ಗಂಟೆಗೆ", "ಬೆಳಿಗ್ಗೆ", "ಸಂಜೆ", "ಮಧ್ಯಾಹ್ನ"]);
  const knUrgentPattern = unicodeWord(["ತುರ್ತು", "ಕೂಡಲೇ", "ತಕ್ಷಣ", "ತಕ್ಷಣವೇ", "ಬೇಗ", "ಅತಿ ಮುಖ್ಯ", "ಅತ್ಯಗತ್ಯ"]);
  const knUpdatePattern = unicodeWord(["ತಿಳುವಳಿಕೆ", "ಸೂಚನೆ", "ಬದಲಾವಣೆ", "ರದ್ದು", "ಮುಂದೂಡಲಾಗಿದೆ", "ಪ್ರಕಟಣೆ", "ಹೊಸ ಮಾಹಿತಿ", "ಅಪ್‌ಡೇಟ್", "ಅಪ್ಡೇಟ್"]);
  const knQuestionPattern = /(?:\?|[?？]|\b(?:ಏನು|ಯಾವಾಗ|ಹೇಗೆ|ಎಲ್ಲಿ|ಯಾರು|ಯಾಕೆ|ಮಾಡಬೇಕಾ|ಸಾಧ್ಯವೇ|ತಿಳಿಸಿದ್ದೀರಾ|ಆಗಿದೆಯಾ|ಬರುತ್ತೀರಾ|ಮುಗಿಯಿತಾ)\b)/iu;
  const knChatterPattern = /^\s*(?:ನಮಸ್ಕಾರ|ನಮಸ್ತೆ|ಶುಭೋದಯ|ಶುಭ ಸಂಜೆ|ಶುಭ ರಾತ್ರಿ|ಧನ್ಯವಾದಗಳು|ಧನ್ಯವಾದ|ಥ್ಯಾಂಕ್ಸ್|ಸರಿ|ಓಕೆ|ಹೌದು|ಇಲ್ಲ|ಹಲೋ|ಹಾಯ್|ಸೂಪರ್|ಉತ್ತಮ|ಬಾಯ್|ಗುಡ್ ನೈಟ್)\s*[.!?]?\s*$/iu;

  // Hindi Patterns
  const hiDecisionPattern = /(?:निर्णय\s*:|फैसला\s*:|(?:^|[^\p{L}\p{N}_])(?:निर्णय|फैसला|तय|मंजूर|स्वीकृत|फाइनल|सहमति|तय किया गया|अंतिम निर्णय)(?=[^\p{L}\p{N}_]|$))/iu;
  const hiActionPattern = unicodeWord(["कृपया", "करें", "कीजिए", "भेजें", "भेजिए", "देखें", "जांचें", "समीक्षा", "तैयार करें", "अपडेट करें", "पूरा करें", "साझा करें", "कॉल करें", "लिखें", "शेड्यूल करें"]);
  const hiCommitmentPattern = /(?:मैं|हम)\s+(?:करूंगा|करेंगे|भेजूंगा|भेजेंगे|तैयार करूंगा|देखूंगा|संभाल लूंगा|पूरा करूंगा)/iu;
  const hiDeadlinePattern = unicodeWord(["आज", "कल", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार", "तक", "अंतिम तिथि", "डेडलाइन", "बजे", "सुबह", "शाम", "दोपहर"]);
  const hiUrgentPattern = unicodeWord(["तुरंत", "जल्द", "जल्दी", "अति आवश्यक", "इमरजेंसी", "महत्वपूर्ण"]);
  const hiUpdatePattern = unicodeWord(["अपडेट", "बदलाव", "रद्द", "स्थगित", "घोषणा", "सूचना"]);
  const hiQuestionPattern = /(?:\?|[?？]|\b(?:क्या|कब|कैसे|कहाँ|कौन|क्यों|हो गया|करेंगे)\b)/iu;
  const hiChatterPattern = /^\s*(?:नमस्ते|नमस्कार|शुभ प्रभात|शुभ रात्रि|धन्यवाद|शुक्रिया|ठीक है|हाँ|नहीं|हेलो|हाय|अलविदा)\s*[.!?]?\s*$/iu;

  // Multilingual Language Detection
  function detectLanguage(parsedMessages) {
    let knCount = 0;
    let hiCount = 0;
    let teCount = 0;
    let taCount = 0;
    let mlCount = 0;
    let bnCount = 0;
    let esTokens = 0;
    let frTokens = 0;
    let deTokens = 0;

    for (const msg of parsedMessages) {
      const text = String(msg?.text || "");
      for (const char of text) {
        const code = char.codePointAt(0);
        if (code >= 0x0c80 && code <= 0x0cff) knCount++;
        else if (code >= 0x0900 && code <= 0x097f) hiCount++;
        else if (code >= 0x0c00 && code <= 0x0c7f) teCount++;
        else if (code >= 0x0b80 && code <= 0x0bff) taCount++;
        else if (code >= 0x0d00 && code <= 0x0d7f) mlCount++;
        else if (code >= 0x0980 && code <= 0x09ff) bnCount++;
      }
      if (/\b(?:hola|gracias|por favor|mañana|reunión|decisión|urgente|acuerdo|tarea)\b/i.test(text)) esTokens++;
      if (/\b(?:bonjour|merci|s'il vous plaît|demain|réunion|décision|urgent|tâche)\b/i.test(text)) frTokens++;
      if (/\b(?:hallo|danke|bitte|morgen|besprechung|entscheidung|dringend|aufgabe)\b/i.test(text)) deTokens++;
    }

    if (knCount > 0 && knCount >= Math.max(hiCount, teCount, taCount)) return "kn";
    if (hiCount > 0 && hiCount >= Math.max(knCount, teCount, taCount)) return "hi";
    if (teCount > 0) return "te";
    if (taCount > 0) return "ta";
    if (mlCount > 0) return "ml";
    if (bnCount > 0) return "bn";
    if (esTokens > 1) return "es";
    if (frTokens > 1) return "fr";
    if (deTokens > 1) return "de";
    return "en";
  }

  function isUrgent(text, hasDeadline, lang) {
    if (/\b(?:not urgent|isn['’]t urgent|no rush|not time[- ]sensitive|low priority)\b/i.test(text)) return false;
    if (lang === "kn" && knUrgentPattern.test(text)) return true;
    if (lang === "hi" && hiUrgentPattern.test(text)) return true;
    return urgentPattern.test(text)
      || (hasDeadline && /\b(?:due|deadline)\s+(?:is\s+)?(?:today|tonight|tomorrow)\b/i.test(text))
      || (hasDeadline && /\b(?:today|tonight)\b/i.test(text));
  }

  function isDeadline(text, lang) {
    if (lang === "kn" && knDeadlinePattern.test(text)) return true;
    if (lang === "hi" && hiDeadlinePattern.test(text)) return true;
    const hasDueDate = deadlineCuePattern.test(text) && deadlineDatePattern.test(text);
    const hasRelativeDueDate = /\b(?:due|deadline)\s+(?:is\s+)?(?:today|tonight|tomorrow|next\s+\w+)\b/i.test(text);
    return hasDueDate || hasRelativeDueDate;
  }

  function getPriorityLabel(maxScore, lang) {
    if (lang === "kn") {
      return maxScore >= 8 ? "ನಿಮ್ಮ ಗಮನ ಅಗತ್ಯವಿದೆ" : maxScore >= 4 ? "ನೋಡಲು ಯೋಗ್ಯವಾಗಿದೆ" : "ನಿಮ್ಮ ಮಾಹಿತಿಗಾಗಿ";
    }
    if (lang === "hi") {
      return maxScore >= 8 ? "आपके ध्यान की आवश्यकता है" : maxScore >= 4 ? "देखने योग्य" : "आपकी जानकारी के लिए";
    }
    if (lang === "te") {
      return maxScore >= 8 ? "మీ దృష్టి అవసరం" : maxScore >= 4 ? "చూడదగినది" : "మీ సమాచారం కోసం";
    }
    if (lang === "ta") {
      return maxScore >= 8 ? "உங்கள் கவனம் தேவை" : maxScore >= 4 ? "பார்க்கத்தக்கது" : "உங்கள் தகவலுக்கு";
    }
    if (lang === "es") {
      return maxScore >= 8 ? "Necesita tu atención" : maxScore >= 4 ? "Vale la pena mirar" : "Para tu conocimiento";
    }
    if (lang === "fr") {
      return maxScore >= 8 ? "Nécessite votre attention" : maxScore >= 4 ? "Vaut le coup d'œil" : "Pour votre information";
    }
    if (lang === "de") {
      return maxScore >= 8 ? "Erfordert Ihre Aufmerksamkeit" : maxScore >= 4 ? "Einen Blick wert" : "Zu Ihrer Information";
    }
    return maxScore >= 8 ? "Needs your attention" : maxScore >= 4 ? "Worth a look" : "For your awareness";
  }

  function getFallbackSummary(lang) {
    if (lang === "kn") return "ಸಂಕ್ಷಿಪ್ತಗೊಳಿಸಲು ಯಾವುದೇ ಸಂಭಾಷಣೆ ಸಂದೇಶಗಳಿಲ್ಲ.";
    if (lang === "hi") return "संक्षेप में बताने के लिए कोई बातचीत संदेश नहीं है।";
    if (lang === "te") return "సంగ్రహించడానికి సంభాషణ సందేశాలు ఏవీ లేవు.";
    if (lang === "ta") return "சுருக்கமாகக் கூற எந்த உரையாடல் செய்திகளும் இல்லை.";
    if (lang === "es") return "No hay mensajes de conversación para resumir.";
    if (lang === "fr") return "Aucun message de conversation à résumer.";
    if (lang === "de") return "Keine Konversationsnachrichten zum Zusammenfassen.";
    return "No conversation messages to summarize.";
  }

  function synthesizeSummary(meaningfulMessages, fallbackMessages, lang) {
    if (!meaningfulMessages.length && !fallbackMessages.length) {
      return getFallbackSummary(lang);
    }

    const pool = meaningfulMessages.length ? meaningfulMessages : fallbackMessages;
    const seen = new Set();
    const selected = [];

    // Prioritize high-signal items: decisions, tasks, commitments, deadlines
    const sorted = [...pool].sort((a, b) => {
      const aWeight = (a.decision ? 4 : 0) + (a.directedToUser ? 4 : 0) + (a.deadline ? 3 : 0) + (a.action ? 3 : 0) + (a.urgent ? 2 : 0);
      const bWeight = (b.decision ? 4 : 0) + (b.directedToUser ? 4 : 0) + (b.deadline ? 3 : 0) + (b.action ? 3 : 0) + (b.urgent ? 2 : 0);
      return bWeight - aWeight || b.score - a.score || a.index - b.index;
    });

    for (const msg of sorted) {
      const text = (msg.text || "").trim();
      if (!text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      selected.push(msg);
      if (selected.length >= 3) break;
    }

    selected.sort((a, b) => a.index - b.index);
    return selected.map((msg) => msg.text.trim()).join(" ");
  }

  function analyzeConversation(parsedMessages, mentionKeywords = []) {
    try {
      const rawList = Array.isArray(parsedMessages) ? parsedMessages : [];
      const lang = detectLanguage(rawList);

      const normalizedKeywords = (Array.isArray(mentionKeywords) ? mentionKeywords : [])
        .map((keyword) => String(keyword).replace(/^@/, "").trim().toLocaleLowerCase())
        .filter(Boolean);

      const messages = rawList.map((message, index) => {
        const content = String(message?.text ?? "");
        const lowerContent = content.toLocaleLowerCase();

        const mention = (message?.mentions ?? []).some((mentionText) => {
          const target = mentionText.slice(1).toLocaleLowerCase();
          return target === "you" || normalizedKeywords.includes(target);
        }) || normalizedKeywords.some((keyword) => {
          try {
            return new RegExp(`(^|[^\\p{L}\\p{N}_])@?${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "iu").test(content);
          } catch {
            return lowerContent.includes(keyword);
          }
        });

        const isChatter = chatterPattern.test(content)
          || (lang === "kn" && knChatterPattern.test(content))
          || (lang === "hi" && hiChatterPattern.test(content));

        const decision = !isChatter && !content.trim().endsWith("?") && (
          decisionPattern.test(content)
          || (lang === "kn" && knDecisionPattern.test(content))
          || (lang === "hi" && hiDecisionPattern.test(content))
        );

        const update = !isChatter && (
          updatePattern.test(content)
          || (lang === "kn" && knUpdatePattern.test(content))
          || (lang === "hi" && hiUpdatePattern.test(content))
        );

        const directedToUser = !isChatter && (
          directedTaskPattern.test(content)
          || (mention && taskVerbPattern.test(content))
          || (mention && lang === "kn" && knActionPattern.test(content))
          || (mention && lang === "hi" && hiActionPattern.test(content))
        );

        const action = !isChatter && (
          directedToUser
          || imperativeTaskPattern.test(content)
          || commitmentPattern.test(content)
          || (lang === "kn" && (knActionPattern.test(content) || knCommitmentPattern.test(content)))
          || (lang === "hi" && (hiActionPattern.test(content) || hiCommitmentPattern.test(content)))
        );

        const deadline = !isChatter && (
          isDeadline(content, lang)
          || (action && implicitTaskDeadlinePattern.test(content))
        );

        const urgent = !isChatter && isUrgent(content, deadline, lang);

        const question = !isChatter && (
          content.includes("?")
          || (lang === "kn" && knQuestionPattern.test(content))
          || (lang === "hi" && hiQuestionPattern.test(content))
        );

        const score = isChatter ? 0 : (
          (mention ? 3 : 0)
          + (urgent ? 5 : 0)
          + (deadline ? 4 : 0)
          + (directedToUser ? 4 : 0)
          + (action && !directedToUser ? 2 : 0)
          + (decision ? 3 : 0)
          + (update ? 3 : 0)
          + (question ? 1 : 0)
        );

        const reasons = [];
        if (urgent) reasons.push("Urgent");
        if (deadline) reasons.push("Deadline");
        if (directedToUser) reasons.push("For you");
        else if (action) reasons.push("Action");
        if (decision) reasons.push("Decision");
        if (update) reasons.push("Update");
        if (mention) reasons.push("Mention");
        if (question) reasons.push("Question");

        return {
          ...message,
          text: content,
          source: content,
          index,
          mention,
          urgent,
          deadline,
          decision,
          update,
          action,
          directedToUser,
          question,
          reasons,
          score
        };
      });

      const priority = [...messages].sort((a, b) => b.score - a.score || a.index - b.index);
      const meaningful = priority.filter((message) => message.score > 0);
      const summary = synthesizeSummary(meaningful, messages, lang);

      const actions = priority.filter((message) => message.action).slice(0, 6);
      const decisions = priority.filter((message) => message.decision).slice(0, 6);
      const deadlines = priority.filter((message) => message.deadline || message.urgent).slice(0, 6);
      const mentions = priority.filter((message) => message.mention);
      const important = priority.filter((message) => message.score >= 3 || message.action).slice(0, 8);
      const maxScore = messages.reduce((highest, message) => Math.max(highest, message.score), 0);
      const priorityLabel = getPriorityLabel(maxScore, lang);
      const questions = priority.filter((message) => message.question).slice(0, 5);

      const stats = {
        totalMessages: messages.length,
        actionCount: actions.length,
        decisionCount: decisions.length,
        deadlineCount: deadlines.length,
        questionCount: questions.length,
        mentionCount: mentions.length
      };

      return {
        messages,
        summary,
        actions,
        decisions,
        deadlines,
        mentions,
        questions,
        important,
        priorityLabel,
        maxScore,
        stats,
        isRuleBased: true,
        detectedLanguage: lang
      };
    } catch (err) {
      // Safe fallback that never errors or throws
      return {
        messages: Array.isArray(parsedMessages) ? parsedMessages : [],
        summary: "Summary synthesized safely.",
        actions: [],
        decisions: [],
        deadlines: [],
        mentions: [],
        questions: [],
        important: [],
        priorityLabel: "For your awareness",
        maxScore: 0,
        stats: { totalMessages: 0, actionCount: 0, decisionCount: 0, deadlineCount: 0, questionCount: 0, mentionCount: 0 },
        isRuleBased: true,
        detectedLanguage: "en"
      };
    }
  }

  const api = { analyzeConversation, detectLanguage };
  root.MissedMessageAnalyzer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
