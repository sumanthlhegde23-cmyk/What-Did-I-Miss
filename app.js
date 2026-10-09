const urgencyPattern = /\b(urgent|asap|immediately|blocker|blocked|overdue|due today|today|tonight|by (?:end of day|eod|tomorrow|monday|tuesday|wednesday|thursday|friday)|before \d|deadline)\b/i;
const deadlinePattern = /\b(?:by|before|due|deadline)\s+(?:(?:end of day|eod|tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}(?::\d{2})?\s*(?:am|pm)?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2})\b/i;
const decisionPattern = /\b(decision|decided|agreed|approved|confirmed|let's go with|we'll use|moving forward|final choice|we are using)\b/i;
const actionPattern = /\b(action item|next step|i'll|i will|please|can you|could you|need you to|follow up|follow-up|send|review|share|prepare|update|schedule|own|take a look|add feedback|bring)\b/i;
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

function analyzeConversation(parsedMessages, mentionKeywords = []) {
  const messages = parsedMessages.map((message, index) => {
    const content = message.text;
    const mention = message.mentions.some((mentionText) => {
      const target = mentionText.slice(1).toLowerCase();
      return target === "you" || mentionKeywords.some((keyword) => keyword.replace(/^@/, "").toLowerCase() === target);
    }) || mentionKeywords.some((keyword) => keyword && content.toLowerCase().includes(keyword.toLowerCase()));
    const urgent = urgencyPattern.test(content);
    const deadline = deadlinePattern.test(content);
    const decision = decisionPattern.test(content) && !content.trim().endsWith("?");
    const action = actionPattern.test(content);
    const directedToUser = /\b(?:can|could|would)\s+you\b|\bneed you to\b|\byour (?:action|task|turn)\b|\bplease\b/i.test(content)
      || (mention && action);
    const score = (mention ? 5 : 0) + (urgent ? 4 : 0) + (deadline ? 3 : 0) + (action ? 2 : 0) + (decision ? 2 : 0);
    return { ...message, text: content, source: content, index, mention, urgent, deadline, decision, action, directedToUser, score };
  });

  const priority = [...messages].sort((a, b) => b.score - a.score || a.index - b.index);
  const meaningful = priority.filter((message) => message.score > 0);
  const summaryItems = (meaningful.length ? meaningful : messages).slice(0, 3);
  const summary = summaryItems.map((message) => message.text).join(" ");
  const actions = messages.filter((message) => message.action && message.directedToUser).slice(0, 4);
  const decisions = messages.filter((message) => message.decision).slice(0, 3);
  const deadlines = messages.filter((message) => message.deadline || message.urgent).slice(0, 3);
  const mentions = messages.filter((message) => message.mention);
  const important = priority.filter((message) => message.score >= 3).slice(0, 5);
  const maxScore = messages.reduce((highest, message) => Math.max(highest, message.score), 0);
  const priorityLabel = maxScore >= 8 ? "Needs your attention" : maxScore >= 4 ? "Worth a look" : "For your awareness";

  const questions = messages.filter((message) => /\?\s*$/.test(message.text)).slice(0, 5);
  return { messages, summary, actions, decisions, deadlines, mentions, questions, important, priorityLabel, maxScore, isRuleBased: true };
}

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
    detailPanel.innerHTML = `<div class="empty-state"><strong>Select a conversation</strong><span>Choose a thread to see its summary and next steps.</span></div>`;
    return;
  }
  if (!thread.analysis) {
    thread.dismissedFindings ??= [];
    thread.corrections ??= {};
    thread.completedActions ??= [];
    detailPanel.innerHTML = `
      <div class="detail-head">
        <div><div class="detail-channel"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.sourcePlatform)} · ${escapeHtml(thread.sourceName)}</div><h3 class="detail-title">${escapeHtml(thread.title)}</h3><div class="detail-meta">${thread.parsed.messages.length} messages parsed · ${escapeHtml(thread.parsed.format)} format · ${escapeHtml(thread.age)}</div></div>
        <div class="detail-actions"><button class="detail-action" data-action="remove">Remove</button></div>
      </div>
      <section class="detail-summary"><div class="detail-summary-label"><span>✦</span> READY TO SUMMARIZE</div><p>Messages were parsed locally. The briefing uses a basic rule-based summary, not a generative AI model.</p></section>
      ${thread.analysisError ? `<p class="form-error" role="alert">${escapeHtml(thread.analysisError)}</p>` : ""}
      <div class="summary-controls"><button class="primary-button summarize-thread" type="button" ${isSummarizing ? "disabled" : ""}>${isSummarizing ? '<span class="spinner"></span> Summarizing…' : 'Summarize Messages <span>→</span>'}</button></div>
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
    <div class="detail-head">
      <div><div class="detail-channel"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.channel)}</div><h3 class="detail-title">${escapeHtml(thread.title)}</h3><div class="detail-meta">${analysis.messages.length} parsed messages · ${escapeHtml(thread.parsed.format)} format · ${escapeHtml(thread.age)}</div></div>
      <div class="detail-actions"><button class="detail-action" data-action="copy">Copy briefing</button><button class="detail-action" data-action="read">${thread.unread ? "Mark read" : "Mark unread"}</button><button class="detail-action" data-action="resummarize" ${isSummarizing ? "disabled" : ""}>${isSummarizing ? "Summarizing…" : "Summarize again"}</button><button class="detail-action" data-action="remove">Remove</button></div>
    </div>
    ${isSummarizing ? `<p class="analysis-running"><span class="spinner"></span> Re-analyzing this conversation locally…</p>` : ""}
    ${thread.analysisError ? `<p class="form-error" role="alert">${escapeHtml(thread.analysisError)}</p>` : ""}
    <section class="detail-summary"><div class="detail-summary-label"><span>✦</span> WHAT YOU MISSED · BASIC LOCAL SUMMARY</div><p>${escapeHtml(truncate(analysis.summary, 420))}</p></section>
    <div class="detail-grid">
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.important, "important")}</span> IMPORTANT MESSAGES</h4>${renderInsightList(analysis.important, "important", "No high-priority announcements identified.", thread)}</section>
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.decisions, "decisions")}</span> DECISIONS MADE</h4>${renderInsightList(analysis.decisions, "decisions", "No explicit decisions identified.", thread)}</section>
    </div>
    <div class="detail-grid">
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.actions, "actions")}</span> ACTION ITEMS</h4>${renderInsightList(analysis.actions, "actions", "No explicit action items identified.", thread)}</section>
      <section><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.questions, "questions")}</span> QUESTIONS TO REVISIT</h4>${renderInsightList(analysis.questions, "questions", "No explicit questions identified.", thread)}</section>
    </div>
    ${analysis.deadlines.length ? `<section style="margin-top:16px"><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.deadlines, "deadlines")}</span> DEADLINES & URGENCY</h4>${renderInsightList(analysis.deadlines, "deadlines", "", thread)}</section>` : ""}
    ${analysis.mentions.length ? `<section style="margin-top:16px"><h4 class="detail-section-title"><span class="section-count">${visibleCount(analysis.mentions, "mentions")}</span> YOUR MENTIONS</h4>${renderInsightList(analysis.mentions, "mentions", "", thread)}</section>` : ""}
    ${priorityMessage}
    <details class="parsed-messages">
      <summary>View parsed messages <span>${parsedMessages.length}</span></summary>
      <div class="parsed-message-list">${parsedMessages.slice(0, 200).map((message) => renderParsedMessage(message, thread)).join("")}
      ${parsedMessages.length > 200 ? `<p class="parse-note">Showing the first 200 of ${parsedMessages.length} parsed messages.</p>` : ""}</div>
    </details>
    <p class="summary-disclosure">Basic rule-based summary — it may miss context. Findings link to their source messages.</p>
    ${thread.parsed.warnings.length ? `<p class="parse-note">${thread.parsed.warnings.map(escapeHtml).join(" ")}</p>` : ""}`;
  bindDetailActions(thread);
}

function renderParsedMessage(message, thread) {
  const id = `source-${thread.id}-${message.order}`;
  return `<div class="parsed-message" id="${escapeHtml(id)}">
    <div class="parsed-message-meta"><span>#${message.order}${message.sender ? ` · ${escapeHtml(message.sender)}` : " · Sender not identified"}</span><time>${escapeHtml(message.rawTimestamp ?? "No timestamp in source")}</time></div>
    <p>${escapeHtml(message.text)}</p>
    <span class="parsed-message-source">${escapeHtml(message.sourceName)}${message.edited ? " · Edited marker" : ""}${message.deleted ? " · Deleted marker" : ""}${message.originalReference ? ` · Ref ${escapeHtml(String(message.originalReference))}` : ""}</span>
  </div>`;
}

function bindDetailActions(thread) {
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
    thread.analysisError = error instanceof Error ? error.message : "The local summary could not be generated.";
  } finally {
    isSummarizing = false;
    render();
  }
  if (thread.analysisError) showToast(thread.analysisError);
  else showToast("Basic summary generated locally");
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
  document.querySelectorAll(".nav-item").forEach((button) => { button.hidden = threads.length === 0; });
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
  try {
    await navigator.clipboard.writeText(text);
    showToast("Summary copied to clipboard");
  } catch (error) {
    showToast("Clipboard access is unavailable in this browser");
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

async function handleFileSelection() {
  const files = Array.from(fileInput.files ?? []);
  fileInput.value = "";
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
    auto: "Auto-detect reads the file format and common export structure. Messaging apps do not appear as folders here; export and save the file to your device first.",
    whatsapp: "WhatsApp: open the chat/group → menu → More → Export chat, then save the .txt file (with or without media). Choose the text export; media is not analyzed.",
    telegram: "Telegram: in Telegram Desktop, open the chat menu → Export chat history. Import its .json or HTML export, or the generated .txt if available.",
    instagram: "Instagram: Accounts Center → Your information and permissions → Download your information. Choose Messages and an available JSON export; select the downloaded file or compatible ZIP.",
    messenger: "Messenger: download your information from Facebook/Accounts Center and select Messages in JSON. Select a message JSON file from the exported archive; this app has no direct account connection.",
    discord: "Discord: use an authorized data package or chat export in JSON/CSV/text format. MISSED. does not access Discord accounts or tokens.",
    other: "Choose a plain-text chat export, JSON/CSV with message text, or an HTML export in Telegram's export structure. You must save the export locally first."
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
  } else if (mode === "import") {
    fileInput.click();
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
document.querySelector("#help-button").addEventListener("click", () => showToast("Files and messages are analyzed in this browser. They are not uploaded."));
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
render();
