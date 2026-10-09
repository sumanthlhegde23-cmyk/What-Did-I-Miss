(function attachMessageAnalyzer(root) {
  "use strict";

  const urgentPattern = /\b(?:urgent(?:ly)?|asap|immediately|critical|blocker|blocked|overdue|time[- ]sensitive|high priority)\b/i;
  const deadlineDatePattern = /(?:today|tonight|tomorrow|(?:next\s+)?(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s+(?:morning|afternoon|evening|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?|\d{1,2}(?:st|nd|rd|th)?(?:\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?)/i;
  const implicitTaskDeadlinePattern = /\b(?:today|tonight|tomorrow|(?:next\s+)?(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2})\b/i;
  const deadlineCuePattern = /\b(?:due|deadline|by|before|no later than|until)\b/i;
  const decisionPattern = /(?:\bdecision\s*:|\b(?:decided|agreed|approved|confirmed|let['’]s go with|we['’]ll use|moving forward|final choice|we are using|selected|chosen)\b)/i;
  const updatePattern = /\b(?:heads[- ]up|fyi|announcement|important update|change of plan|changed to|moved to|cancelled|canceled|postponed|rescheduled|now scheduled|is live|launched|outage|incident|breaking change)\b/i;
  const directedTaskPattern = /\b(?:please|can you|could you|would you|need you to|your (?:action|task|turn) is)\b/i;
  const taskVerbPattern = /\b(?:review|send|share|prepare|update|schedule|follow up|follow-up|reply|respond|finish|complete|submit|create|fix|check|confirm|approve|upload|call|book|add|remove|publish|write|read|test|deploy|bring|take a look)\b/i;
  const imperativeTaskPattern = /^\s*(?:(?:@[\p{L}\p{N}_.-]+)[,:\s]+)*(?:please\s+)?(?:review|send|share|prepare|update|schedule|follow up|follow-up|reply|respond|finish|complete|submit|create|fix|check|confirm|approve|upload|call|book|add|remove|publish|write|read|test|deploy|bring|take a look)\b/iu;
  const commitmentPattern = /\b(?:i|we)(?:['’]ll| will| am going to| are going to| plan to)\s+(?:review|send|share|prepare|update|schedule|follow up|follow-up|reply|respond|finish|complete|submit|create|fix|check|confirm|approve|upload|call|book|add|remove|publish|write|read|test|deploy|bring)\b/i;

  function isUrgent(text, hasDeadline) {
    if (/\b(?:not urgent|isn['’]t urgent|no rush|not time[- ]sensitive)\b/i.test(text)) return false;
    return urgentPattern.test(text)
      || (hasDeadline && /\b(?:due|deadline)\s+(?:is\s+)?(?:today|tonight|tomorrow)\b/i.test(text))
      || (hasDeadline && /\b(?:today|tonight)\b/i.test(text));
  }

  function isDeadline(text) {
    const hasDueDate = deadlineCuePattern.test(text) && deadlineDatePattern.test(text);
    const hasRelativeDueDate = /\b(?:due|deadline)\s+(?:is\s+)?(?:today|tonight|tomorrow|next\s+\w+)\b/i.test(text);
    return hasDueDate || hasRelativeDueDate;
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
      const decision = decisionPattern.test(content) && !content.trim().endsWith("?");
      const update = updatePattern.test(content);
      const directedToUser = directedTaskPattern.test(content) || (mention && taskVerbPattern.test(content));
      const action = directedToUser || imperativeTaskPattern.test(content) || commitmentPattern.test(content);
      const deadline = isDeadline(content) || (action && implicitTaskDeadlinePattern.test(content));
      const urgent = isUrgent(content, deadline);
      const question = content.includes("?");
      const score = (mention ? 3 : 0)
        + (urgent ? 5 : 0)
        + (deadline ? 4 : 0)
        + (directedToUser ? 4 : 0)
        + (action && !directedToUser ? 2 : 0)
        + (decision ? 3 : 0)
        + (update ? 3 : 0)
        + (question ? 1 : 0);
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
    const summaryItems = meaningful.slice(0, 3);
    const summary = summaryItems.length
      ? summaryItems.map((message) => message.text.trim()).join(" ")
      : messages.slice(0, 3).map((message) => message.text.trim()).join(" ");
    const actions = priority.filter((message) => message.action).slice(0, 5);
    const decisions = priority.filter((message) => message.decision).slice(0, 5);
    const deadlines = priority.filter((message) => message.deadline || message.urgent).slice(0, 5);
    const mentions = priority.filter((message) => message.mention);
    const important = priority.filter((message) => message.score >= 3 || message.action).slice(0, 8);
    const maxScore = messages.reduce((highest, message) => Math.max(highest, message.score), 0);
    const priorityLabel = maxScore >= 8 ? "Needs your attention" : maxScore >= 4 ? "Worth a look" : "For your awareness";
    const questions = priority.filter((message) => message.question).slice(0, 5);

    return { messages, summary, actions, decisions, deadlines, mentions, questions, important, priorityLabel, maxScore, isRuleBased: true };
  }

  const api = { analyzeConversation };
  root.MissedMessageAnalyzer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
