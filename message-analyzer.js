(function attachMessageAnalyzer(root) {
  "use strict";

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

  function isUrgent(text, hasDeadline) {
    if (/\b(?:not urgent|isn['’]t urgent|no rush|not time[- ]sensitive|low priority)\b/i.test(text)) return false;
    return urgentPattern.test(text)
      || (hasDeadline && /\b(?:due|deadline)\s+(?:is\s+)?(?:today|tonight|tomorrow)\b/i.test(text))
      || (hasDeadline && /\b(?:today|tonight)\b/i.test(text));
  }

  function isDeadline(text) {
    const hasDueDate = deadlineCuePattern.test(text) && deadlineDatePattern.test(text);
    const hasRelativeDueDate = /\b(?:due|deadline)\s+(?:is\s+)?(?:today|tonight|tomorrow|next\s+\w+)\b/i.test(text);
    return hasDueDate || hasRelativeDueDate;
  }

  function cleanSentence(text) {
    const trimmed = text.trim();
    if (!trimmed) return "";
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }

  function synthesizeSummary(meaningfulMessages, fallbackMessages) {
    if (!meaningfulMessages.length && !fallbackMessages.length) {
      return "No conversation messages to summarize.";
    }

    const pool = meaningfulMessages.length ? meaningfulMessages : fallbackMessages;
    
    // Select top high-value messages, prioritizing decisions, actions, and key updates
    const seen = new Set();
    const selected = [];

    // Prioritize high-signal items first: decisions, directed tasks, commitments
    const sorted = [...pool].sort((a, b) => {
      // Prioritize actions & decisions with clear deadlines or commitments
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

    // Sort the selected back into original conversation order for coherent reading
    selected.sort((a, b) => a.index - b.index);

    return selected.map((msg) => msg.text.trim()).join(" ");
  }

  function analyzeConversation(parsedMessages, mentionKeywords = []) {
    const normalizedKeywords = mentionKeywords
      .map((keyword) => keyword.replace(/^@/, "").trim().toLocaleLowerCase())
      .filter(Boolean);

    const messages = parsedMessages.map((message, index) => {
      const content = String(message.text ?? "");
      const lowerContent = content.toLocaleLowerCase();

      const mention = (message.mentions ?? []).some((mentionText) => {
        const target = mentionText.slice(1).toLocaleLowerCase();
        return target === "you" || normalizedKeywords.includes(target);
      }) || normalizedKeywords.some((keyword) => new RegExp(`(^|[^\\p{L}\\p{N}_])@?${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "iu").test(content));

      const isChatter = chatterPattern.test(content);
      const decision = !isChatter && decisionPattern.test(content) && !content.trim().endsWith("?");
      const update = !isChatter && updatePattern.test(content);
      const directedToUser = !isChatter && (directedTaskPattern.test(content) || (mention && taskVerbPattern.test(content)));
      const action = !isChatter && (directedToUser || imperativeTaskPattern.test(content) || commitmentPattern.test(content));
      const deadline = !isChatter && (isDeadline(content) || (action && implicitTaskDeadlinePattern.test(content)));
      const urgent = !isChatter && isUrgent(content, deadline);
      const question = !isChatter && content.includes("?");

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
    
    // Synthesize accurate, coherent summary
    const summary = synthesizeSummary(meaningful, messages);

    const actions = priority.filter((message) => message.action).slice(0, 6);
    const decisions = priority.filter((message) => message.decision).slice(0, 6);
    const deadlines = priority.filter((message) => message.deadline || message.urgent).slice(0, 6);
    const mentions = priority.filter((message) => message.mention);
    const important = priority.filter((message) => message.score >= 3 || message.action).slice(0, 8);
    const maxScore = messages.reduce((highest, message) => Math.max(highest, message.score), 0);
    const priorityLabel = maxScore >= 8 ? "Needs your attention" : maxScore >= 4 ? "Worth a look" : "For your awareness";
    const questions = priority.filter((message) => message.question).slice(0, 5);

    // Enhanced metrics & structured executive highlights
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
      isRuleBased: true
    };
  }

  const api = { analyzeConversation };
  root.MissedMessageAnalyzer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
