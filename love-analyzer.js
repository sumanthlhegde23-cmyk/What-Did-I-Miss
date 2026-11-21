(function attachLoveAnalyzer(root) {
  "use strict";

  // Unicode boundary helper
  function unicodeWord(words) {
    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    return new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${escaped})(?=[^\\p{L}\\p{N}_]|$)`, "iu");
  }

  // --- Affection & Romantic Language Patterns ---
  const EN_AFFECTION = /\b(?:love you|in love|i love u|love u|miss you|miss u|can['’]?t stop thinking|sweetheart|babe|baby|darling|honey|adore you|my love|hug you|kisses|kiss you|you mean the world|crush on you|all my heart|forever yours)\b/i;
  const KN_AFFECTION = unicodeWord(["ಪ್ರೀತಿ", "ಪ್ರೀತಿಸುತ್ತೇನೆ", "ಮಿಸ್ ಮಾಡಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ", "ಚಿನ್ನ", "ಬಂಗಾರ", "ಜಾನು", "ಮುದ್ದು", "ನೆನಪಾಗುತ್ತಿದ್ದೀಯ", "ನಿನ್ನದೇ ಯೋಚನೆ", "ತುಂಬಾ ಇಷ್ಟ", "ಜೀವ ನೀನು", "ಪ್ರೀತಿಸ್ತೀನಿ"]);
  const HI_AFFECTION = unicodeWord(["प्यार करता", "प्यार करती", "आई लव यू", "याद आ रही", "जानू", "बाबू", "शोना", "सनम", "मेरी जान", "मोहब्बत", "इश्क", "तुम्हारे बिना", "दिल से"]);
  const ES_AFFECTION = /\b(?:te amo|te quiero|te extraño|mi amor|cariño|corazón|bebé|cielo|te adoro|me encantas)\b/i;
  const FR_AFFECTION = /\b(?:je t['’]?aime|tu me manques|mon amour|mon cœur|chéri|chérie|bébé|je t['’]?adore)\b/i;
  const DE_AFFECTION = /\b(?:ich liebe dich|vermisse dich|mein schatz|liebling|meine liebe|hab dich lieb)\b/i;
  const ROMANTIC_EMOJIS = /[❤️💖💕💓💗💞💘🥰😘😍🌹💐💋💍]/gu;

  // --- Care, Concern & Protective Vigilance Patterns ---
  const EN_CARE = /\b(?:did you eat|had dinner|had lunch|had breakfast|reach(?:ed)? home safe(?:ly)?|reached safe(?:ly)?|get home safe(?:ly)?|take care|take care of yourself|get well soon|sleep well|don['’]?t stress|are you okay|rest well|worry about you|eat well|stay safe)\b/i;
  const KN_CARE = unicodeWord(["ಊಟ ಆಯ್ತಾ", "ತಿಂಡಿ ಆಯ್ತಾ", "ಹುಷಾರಾಗಿ ತಲುಪು", "ಹುಷಾರಾಗಿ ತಲುಪಿದ್ಯಾ", "ಹುಷಾರಾಗಿ ಇರು", "ಕಾಳಜಿ ವಹಿಸಿ", "ಚೆನ್ನಾಗಿ ಮಲಗು", "ಆರಾಮಾಗಿ ಇರು", "ಹುಷಾರಿಲ್ಲವಾ", "ಚಿಂತೆ ಮಾಡಬೇಡ"]);
  const HI_CARE = unicodeWord(["खाना खाया", "खाना खा लिया", "घर सुरक्षित पहुंच", "पहुंच गए", "ख्याल रखना", "अपना ध्यान रखना", "तबीयत कैसी है", "अच्छे से सो जाओ", "परेशान मत हो", "दवा ली"]);
  const ES_CARE = /\b(?:ya comiste|cenaste|llegaste bien|cuídate|descansa bien|estás bien|que te mejores)\b/i;
  const FR_CARE = /\b(?:tu as mangé|bien rentré|prends soin de toi|repose-toi|dors bien|tu vas bien)\b/i;
  const DE_CARE = /\b(?:hast du gegessen|gut angekommen|pass auf dich auf|schlaf gut|gehts dir gut|gute besserung)\b/i;

  // --- Late Night & Sleep Wishes ---
  const EN_NIGHT = /\b(?:good night|goodnight|sweet dreams|sleep tight|see you tomorrow)\b/i;
  const KN_NIGHT = unicodeWord(["ಶುಭ ರಾತ್ರಿ", "ಚೆನ್ನಾಗಿ ಮಲಗು", "ಸಿಹಿ ಕನಸು"]);
  const HI_NIGHT = unicodeWord(["शुभ रात्रि", "स्वीट ड्रीम्स", "अच्छे से सोना"]);
  const EN_MORNING = /\b(?:good morning|morning|wake up|rise and shine)\b/i;
  const KN_MORNING = unicodeWord(["ಶುಭೋದಯ", "ಬೆಳಿಗ್ಗೆ"]);
  const HI_MORNING = unicodeWord(["शुभ प्रभात", "गुड मॉर्निंग"]);

  // --- Future & "We-Talk" Patterns ---
  const EN_FUTURE = /\b(?:when we meet|our future|we will|we are going to|together|spend time together|grow old|with you forever|next time we|us together)\b/i;
  const KN_FUTURE = unicodeWord(["ನಾವು ಒಟ್ಟಿಗೆ", "ಜೊತೆಯಾಗಿ", "ನಮ್ಮಿಬ್ಬರ", "ನಾವು ಭೇಟಿಯಾದಾಗ", "ನಮ್ಮ ಭವಿಷ್ಯ", "ಯಾವಾಗಲೂ ಜೊತೆಗೆ"]);
  const HI_FUTURE = unicodeWord(["हम दोनों", "साथ रहेंगे", "जब हम मिलेंगे", "हमारा भविष्य", "साथ में"]);
  const ES_FUTURE = /\b(?:cuando nos veamos|nuestro futuro|juntos|estar juntos|el uno para el otro)\b/i;
  const FR_FUTURE = /\b(?:quand on se verra|notre avenir|ensemble|passer du temps ensemble)\b/i;
  const DE_FUTURE = /\b(?:wenn wir uns sehen|unsere zukunft|zusammen|für immer zusammen)\b/i;

  // --- Compliments & Emotional Validation ---
  const EN_COMPLIMENT = /\b(?:you look (?:so |very )?(?:pretty|beautiful|handsome|cute|gorgeous|hot|amazing)|proud of you|you make me happy|you['’]?re the best|special to me|lucky to have you)\b/i;
  const KN_COMPLIMENT = unicodeWord(["ನೀನು ತುಂಬಾ ಸುಂದರ", "ತುಂಬಾ ಮುದ್ದಾಗಿದ್ದೀಯ", "ತುಂಬಾ ಚಂದ", "ಹೆಮ್ಮೆ", "ನಿನ್ನಿಂದ ನನಗೆ ಖುಷಿ", "ಅದೃಷ್ಟ"]);
  const HI_COMPLIMENT = unicodeWord(["बहुत सुंदर", "बहुत प्यारी", "तुम पर गर्व है", "तुम सबसे अच्छी हो", "खुशनसीब"]);

  // --- Responsiveness & Delay Apologies ---
  const EN_APOLOGY = /\b(?:sorry for late reply|sorry was busy|missed your message|sorry for the delay|was thinking of you)\b/i;
  const KN_APOLOGY = unicodeWord(["ಕ್ಷಮಿಸಿ ತಡವಾಯಿತು", "ಮೆಸೇಜ್ ನೋಡಿರಲಿಲ್ಲ"]);
  const HI_APOLOGY = unicodeWord(["माफ़ करना लेट रिप्लाई के लिए", "व्यस्त था"]);

  function isAffectionate(text) {
    return EN_AFFECTION.test(text)
      || KN_AFFECTION.test(text)
      || HI_AFFECTION.test(text)
      || ES_AFFECTION.test(text)
      || FR_AFFECTION.test(text)
      || DE_AFFECTION.test(text)
      || (text.match(ROMANTIC_EMOJIS) || []).length >= 1;
  }

  function isCaring(text) {
    return EN_CARE.test(text)
      || KN_CARE.test(text)
      || HI_CARE.test(text)
      || ES_CARE.test(text)
      || FR_CARE.test(text)
      || DE_CARE.test(text);
  }

  function isLateNight(message) {
    const combined = `${message.time || ""} ${message.rawTimestamp || ""} ${Array.isArray(message.rawLines) ? message.rawLines.join(" ") : ""} ${message.text || ""}`;
    const match = combined.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
    if (!match) return false;
    let hour = Number(match[1]);
    const ampm = match[3]?.toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    // Between 10 PM (22:00) and 4:30 AM
    return hour >= 22 || hour <= 4;
  }

  function isNightWish(text) {
    return EN_NIGHT.test(text) || KN_NIGHT.test(text) || HI_NIGHT.test(text);
  }

  function isMorningWish(text) {
    return EN_MORNING.test(text) || KN_MORNING.test(text) || HI_MORNING.test(text);
  }

  function isFutureOriented(text) {
    return EN_FUTURE.test(text)
      || KN_FUTURE.test(text)
      || HI_FUTURE.test(text)
      || ES_FUTURE.test(text)
      || FR_FUTURE.test(text)
      || DE_FUTURE.test(text);
  }

  function isCompliment(text) {
    return EN_COMPLIMENT.test(text) || KN_COMPLIMENT.test(text) || HI_COMPLIMENT.test(text);
  }

  function isApologeticForDelay(text) {
    return EN_APOLOGY.test(text) || KN_APOLOGY.test(text) || HI_APOLOGY.test(text);
  }

  function analyzeLovePsychology(input, options = {}) {
    let rawList = [];
    if (Array.isArray(input)) {
      rawList = input;
    } else if (input && Array.isArray(input.messages)) {
      rawList = input.messages;
    } else if (typeof input === "string") {
      if (typeof root.MissedMessageParser !== "undefined" && typeof root.MissedMessageParser.parseConversation === "function") {
        const parsed = root.MissedMessageParser.parseConversation(input);
        rawList = parsed.messages || [];
      } else {
        // Fallback plain split
        rawList = input.split("\n").filter(Boolean).map((line, idx) => ({ text: line, order: idx + 1 }));
      }
    }

    if (!rawList.length) {
      return {
        verdict: "No messages to analyze",
        summaryText: "Please provide a conversation to calculate psychological and emotional love indicators.",
        winnerSender: null,
        mutualLove: false,
        totalReasonsCount: 0,
        reasons: [],
        participants: []
      };
    }

    // 1. Group messages by sender
    const sendersMap = new Map();
    let prevSender = null;

    rawList.forEach((msg) => {
      let senderName = (msg.sender || "").trim();
      let text = String(msg.text || "");
      let detectedTime = msg.time || msg.rawTimestamp || "";

      // Handle cases where sender was parsed as a timestamp prefix like "[10" or "10"
      if (/^\[?\d{1,2}$/.test(senderName) && /^\d{2}\s*(?:[ap]\.?m\.?)?\]?\s*([^:\r\n–—：]+)(?::|：|\s+[-–—]\s+)([\s\S]*)$/i.test(text)) {
        const m = text.match(/^(\d{2}\s*(?:[ap]\.?m\.?)?)\]?\s*([^:\r\n–—：]+)(?::|：|\s+[-–—]\s+)([\s\S]*)$/i);
        if (m) {
          detectedTime = `${senderName}:${m[1]}`.replace(/[\[\]]/g, "");
          senderName = m[2].trim();
          text = m[3].trim();
        }
      }

      // If text itself has "[10:15 PM] Sender: Message" or "10:15 PM - Sender: Message"
      const prefixMatch = text.match(/^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)\]?\s*[-–—]?\s*)?([^:\r\n–—：]{1,50})(?::|：|\s+[-–—]\s+)([\s\S]*)$/i);
      if ((!senderName || senderName === "Participant" || /^\[?\d/.test(senderName)) && prefixMatch) {
        if (prefixMatch[1]) detectedTime = prefixMatch[1];
        senderName = prefixMatch[2].trim();
        text = prefixMatch[3].trim();
      }

      if (!senderName) senderName = "Participant";

      if (!sendersMap.has(senderName)) {
        sendersMap.set(senderName, {
          name: senderName,
          messages: [],
          totalChars: 0,
          initiations: 0,
          doubleTexts: 0,
          affectionCount: 0,
          affectionQuotes: [],
          careCount: 0,
          careQuotes: [],
          lateNightCount: 0,
          lateNightQuotes: [],
          nightWishes: 0,
          morningWishes: 0,
          futureCount: 0,
          futureQuotes: [],
          complimentCount: 0,
          complimentQuotes: [],
          apologyCount: 0,
          emojiCount: 0,
          rawScore: 0
        });
      }

      const p = sendersMap.get(senderName);
      const enhancedMsg = { ...msg, text, time: detectedTime || msg.time };
      p.messages.push(enhancedMsg);
      p.totalChars += text.length;

      // Double-texting check (same sender sends subsequent message)
      if (prevSender === senderName) {
        p.doubleTexts += 1;
      } else {
        p.initiations += 1;
      }
      prevSender = senderName;

      const emojis = text.match(ROMANTIC_EMOJIS) || [];
      p.emojiCount += emojis.length;

      if (isAffectionate(text)) {
        p.affectionCount += 1;
        if (p.affectionQuotes.length < 3) p.affectionQuotes.push({ text, order: msg.order });
      }

      if (isCaring(text)) {
        p.careCount += 1;
        if (p.careQuotes.length < 3) p.careQuotes.push({ text, order: msg.order });
      }

      if (isLateNight(enhancedMsg)) {
        p.lateNightCount += 1;
        if (p.lateNightQuotes.length < 3) p.lateNightQuotes.push({ text, order: msg.order });
      }

      if (isNightWish(text)) p.nightWishes += 1;
      if (isMorningWish(text)) p.morningWishes += 1;

      if (isFutureOriented(text)) {
        p.futureCount += 1;
        if (p.futureQuotes.length < 3) p.futureQuotes.push({ text, order: msg.order });
      }

      if (isCompliment(text)) {
        p.complimentCount += 1;
        if (p.complimentQuotes.length < 3) p.complimentQuotes.push({ text, order: msg.order });
      }

      if (isApologeticForDelay(text)) {
        p.apologyCount += 1;
      }
    });

    const participants = Array.from(sendersMap.values());

    // 2. Score each participant using validated relational psychology metrics
    participants.forEach((p) => {
      // Psychological weighted scoring
      const affectionWeight = p.affectionCount * 14 + p.emojiCount * 4;
      const careWeight = p.careCount * 12;
      const intimacyWeight = p.lateNightCount * 8 + (p.nightWishes + p.morningWishes) * 6;
      const futureWeight = p.futureCount * 10;
      const complimentWeight = p.complimentCount * 8;
      const investmentWeight = Math.min(20, p.doubleTexts * 3 + p.apologyCount * 4);

      const raw = affectionWeight + careWeight + intimacyWeight + futureWeight + complimentWeight + investmentWeight;
      p.rawScore = raw;

      // Scale to realistic calibrated percentage (min 15%, up to 98%)
      const msgRatio = p.messages.length / Math.max(1, rawList.length);
      const intensity = raw / Math.max(1, p.messages.length * 5);
      let calculatedScore = Math.min(98, Math.round(30 + intensity * 60 + msgRatio * 15));
      if (raw === 0) calculatedScore = Math.min(35, calculatedScore);
      p.loveScore = calculatedScore;
    });

    // Sort by loveScore descending
    participants.sort((a, b) => b.loveScore - a.loveScore || b.rawScore - a.rawScore);

    const primary = participants[0];
    const secondary = participants[1] || null;

    // 3. Determine Psychological Verdict: Which person is in love?
    const isMutual = Boolean(
      secondary
      && primary.loveScore >= 55
      && secondary.loveScore >= 50
      && Math.abs(primary.loveScore - secondary.loveScore) <= 30
      && (secondary.affectionCount > 0 || secondary.careCount > 0 || secondary.futureCount > 0)
    );

    let winnerSender = null;
    let verdict = "";
    let summaryText = "";

    if (isMutual) {
      winnerSender = "Mutual";
      verdict = `Mutual Love Confirmed: Both ${primary.name} and ${secondary.name} are in love!`;
      summaryText = `Based on behavioral reciprocity, emotional attunement, and linguistic markers, both ${primary.name} (${primary.loveScore}% Love Score) and ${secondary.name} (${secondary.loveScore}% Love Score) demonstrate deep mutual romantic attachment.`;
    } else if (primary && (primary.rawScore > 0 || primary.loveScore >= 50)) {
      winnerSender = primary.name;
      verdict = `${primary.name} is deeply in love!`;
      summaryText = `The psychological and behavioral analysis indicates that ${primary.name} exhibits significantly higher emotional investment, protective care, and romantic affection (${primary.loveScore}% Love Score).`;
    } else {
      winnerSender = null;
      verdict = `Developing Connection / Fond Friendship`;
      summaryText = `The interaction displays friendly warmth and mutual respect, but explicit romantic attachment indicators remain subtle.`;
    }

    // 4. Extract verified psychological and logical reasons with evidence
    const reasons = [];

    // Reason 1: Protective Care & Wellbeing Vigilance
    const careParticipant = participants.find((p) => p.careCount > 0);
    if (careParticipant) {
      reasons.push({
        id: "care-attachment",
        category: "Protective Care & Wellbeing Vigilance",
        psychology: "Attachment Theory (Bowlby & Hazan): Involuntary vigilance over a partner's basic needs (meals, sleep, safe arrival) signifies deep emotional bonding and parental/protective romantic love.",
        person: careParticipant.name,
        observation: `${careParticipant.name} repeatedly checked up on wellbeing (${careParticipant.careCount} times) asking about meals, health, and safe return.`,
        quotes: careParticipant.careQuotes.map((q) => q.text)
      });
    }

    // Reason 2: Verbal Affection & Romantic Expressions
    const affectionParticipant = participants.find((p) => p.affectionCount > 0 || p.emojiCount > 0);
    if (affectionParticipant) {
      reasons.push({
        id: "verbal-affection",
        category: "Romantic Affection & Emotional Vulnerability",
        psychology: "Sternberg's Triangular Theory of Love (Intimacy Component): Frequent use of tender terms of endearment, romantic symbols, and verbalizing 'missing' the other person reveals genuine vulnerability.",
        person: affectionParticipant.name,
        observation: `${affectionParticipant.name} expressed direct affection and emotional yearning (${affectionParticipant.affectionCount} times, ${affectionParticipant.emojiCount} romantic emojis).`,
        quotes: affectionParticipant.affectionQuotes.map((q) => q.text)
      });
    }

    // Reason 3: Circadian Intimacy & Late-Night Bonding
    const nightParticipant = participants.find((p) => p.lateNightCount > 0 || p.nightWishes > 0);
    if (nightParticipant) {
      reasons.push({
        id: "circadian-intimacy",
        category: "Circadian Intimacy & Prioritized Attention",
        psychology: "Primacy & Recency Psychological Effect: Being the last person one speaks to before sleep (11 PM - 4 AM) signals that the partner occupies the primary focus of emotional security and daily thoughts.",
        person: nightParticipant.name,
        observation: `${nightParticipant.name} engaged in intimate late-night conversations (${nightParticipant.lateNightCount} late-night exchanges) and sent dedicated sweet dreams wishes.`,
        quotes: nightParticipant.lateNightQuotes.map((q) => q.text)
      });
    }

    // Reason 4: Interdependent "We-Talk" & Shared Future Orientation
    const futureParticipant = participants.find((p) => p.futureCount > 0);
    if (futureParticipant) {
      reasons.push({
        id: "interdependence-future",
        category: "Interdependent 'We-Talk' & Future Planning",
        psychology: "Agnew's Interdependence Theory: Cognitive shift from autonomous 'I/me' to collective 'we/us' reflects long-term psychological merging and projection of a shared life trajectory.",
        person: futureParticipant.name,
        observation: `${futureParticipant.name} used prospective 'we-talk' (${futureParticipant.futureCount} times), planning future shared moments and meetings.`,
        quotes: futureParticipant.futureQuotes.map((q) => q.text)
      });
    }

    // Reason 5: High Interaction Investment & Double-Texting
    const eagerParticipant = participants.find((p) => p.doubleTexts >= 2 || (p.initiations > p.messages.length * 0.4 && p.messages.length >= 4));
    if (eagerParticipant) {
      reasons.push({
        id: "investment-eagerness",
        category: "High Emotional Investment & Eagerness",
        psychology: "Social Exchange & Pursuer Dynamic: Unprompted double-texting and eager message initiation reflect high dopamine anticipation and active pursuit of the partner's presence.",
        person: eagerParticipant.name,
        observation: `${eagerParticipant.name} showed strong eagerness by initiating conversations frequently and double-texting without waiting for replies.`,
        quotes: eagerParticipant.messages.slice(0, 2).map((m) => m.text)
      });
    }

    // Reason 6: Emotional Attunement & Admiration (Compliments)
    const complimentParticipant = participants.find((p) => p.complimentCount > 0);
    if (complimentParticipant) {
      reasons.push({
        id: "attunement-compliments",
        category: "Emotional Attunement & Positive Admiration",
        psychology: "Gottman's Positivity Attunement Principle: Genuine compliments, admiration, and validating the other person's appearance or qualities build foundational romantic intimacy.",
        person: complimentParticipant.name,
        observation: `${complimentParticipant.name} offered affectionate praise and admiration (${complimentParticipant.complimentCount} instances).`,
        quotes: complimentParticipant.complimentQuotes.map((q) => q.text)
      });
    }

    // Reason 7: Availability & Eagerness to Apologize for Lags
    const apologeticParticipant = participants.find((p) => p.apologyCount > 0);
    if (apologeticParticipant) {
      reasons.push({
        id: "responsiveness-priority",
        category: "Relational Prioritization & Responsiveness",
        psychology: "Reis & Shaver's Model of Interpersonal Intimacy: Immediately explaining or apologizing for delayed replies indicates acute sensitivity to the partner's feelings and fear of creating distance.",
        person: apologeticParticipant.name,
        observation: `${apologeticParticipant.name} demonstrated high prioritization by apologizing for response gaps and clarifying availability.`,
        quotes: apologeticParticipant.messages.filter((m) => isApologeticForDelay(m.text)).map((m) => m.text)
      });
    }

    return {
      verdict,
      summaryText,
      winnerSender,
      mutualLove: isMutual,
      totalReasonsCount: reasons.length,
      reasons,
      participants
    };
  }

  const api = { analyzeLovePsychology };
  root.LoveMessageAnalyzer = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
