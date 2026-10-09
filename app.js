const sampleThreads = [
  {
    id: "launch",
    title: "Launch checklist & final assets",
    channel: "Product launch",
    dot: "dot-purple",
    age: "12 min ago",
    unread: true,
    transcript: [
      "Jamie: Quick update: we agreed to ship the refreshed onboarding flow on Thursday.",
      "Morgan: @Alex, can you review the final launch email by 3pm today? We need your sign-off before it goes out.",
      "Priya: Decision: we're using the new product screenshots in the announcement.",
      "Jamie: I'll own the release notes. Morgan is handling the social assets.",
      "Morgan: The only blocker is legal approval. I'll follow up with them this afternoon.",
      "Jamie: Please add any final feedback to the launch doc by end of day."
    ].join("\n")
  },
  {
    id: "design",
    title: "Homepage direction feedback",
    channel: "Design team",
    dot: "dot-coral",
    age: "38 min ago",
    unread: true,
    transcript: [
      "Riley: I shared two homepage directions in the design file.",
      "Noah: The warmer palette feels right. Let's go with concept B.",
      "Riley: Agreed — decision is concept B, with the simpler hero layout.",
      "Noah: @Alex, could you share any copy feedback before tomorrow's review?",
      "Riley: I'll update the mockups and send the revised version by Friday.",
      "Noah: Next step: I'll schedule a review for Monday morning."
    ].join("\n")
  },
  {
    id: "weekend",
    title: "Saturday hike plans",
    channel: "Weekend plans",
    dot: "dot-blue",
    age: "1 hr ago",
    unread: true,
    transcript: [
      "Sam: Forecast looks great for Saturday. Still on for the trail?",
      "Taylor: Definitely! Let's meet at the north entrance at 9am.",
      "Sam: I'll bring snacks. Can someone bring extra water?",
      "Taylor: I'll check if the café is open after the hike."
    ].join("\n")
  }
];

const urgencyPattern = /\b(urgent|asap|immediately|blocker|blocked|overdue|due today|today|tonight|by (?:end of day|eod|tomorrow|monday|tuesday|wednesday|thursday|friday)|before \d|deadline)\b/i;
const deadlinePattern = /\b(?:by|before|due|deadline)\s+(?:(?:end of day|eod|tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}(?::\d{2})?\s*(?:am|pm)?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2})\b/i;
const decisionPattern = /\b(decision|decided|agreed|approved|confirmed|let's go with|we'll use|moving forward|final choice|we are using)\b/i;
const actionPattern = /\b(action item|next step|i'll|i will|please|can you|could you|need you to|follow up|follow-up|send|review|share|prepare|update|schedule|own|take a look|add feedback|bring)\b/i;
const MAX_FILE_COUNT = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_BATCH_BYTES = 20 * 1024 * 1024;
const sampleConversation = [
  "[10/08/26, 9:14 AM] Jamie: Morning all — launch review is Thursday.",
  "[10/08/26, 9:16 AM] Morgan: @Alex, please review the customer email by 4pm today.",
  "[10/08/26, 9:18 AM] Priya: Decision: we will ship with the updated onboarding screenshots.",
  "[10/08/26, 9:20 AM] Jamie: Release notes are ready for review.",
  "Please add comments directly in the launch document.",
  "[10/08/26, 9:25 AM] Morgan: Correction: legal approval is still pending. The earlier green-light was for the old copy.",
  "[10/08/26, 9:27 AM] Sam: This message was edited",
  "The customer email deadline is now Friday at noon.",
  "[10/08/26, 9:31 AM] Priya: Thanks, I will update the checklist."
].join("\n");

function analyzeConversation(parsedMessages) {
  const messages = parsedMessages.map((message, index) => {
    const content = message.text;
    const mention = /@(?:alex|you|yourname)\b/i.test(content);
    const urgent = urgencyPattern.test(content);
    const deadline = deadlinePattern.test(content);
    const decision = decisionPattern.test(content);
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
  const maxScore = messages.reduce((highest, message) => Math.max(highest, message.score), 0);
  const priorityLabel = maxScore >= 8 ? "Needs your attention" : maxScore >= 4 ? "Worth a look" : "For your awareness";

  return { messages, summary, actions, decisions, deadlines, mentions, priorityLabel, maxScore };
}

const threads = sampleThreads.map((thread) => {
  const parsed = MissedMessageParser.parseConversation(thread.transcript, { sourceName: "Sample conversation", groupName: thread.channel });
  return { ...thread, parsed, analysis: analyzeConversation(parsed.messages) };
});
let activeFilter = "all";
let selectedThreadId = threads[0]?.id ?? null;
let searchTerm = "";
let nextThreadId = 4;
let toastTimer;

const threadList = document.querySelector("#thread-list");
const detailPanel = document.querySelector("#detail-panel");
const importDialog = document.querySelector("#import-dialog");
const fileInput = document.querySelector("#conversation-files");
const fileQueueElement = document.querySelector("#file-queue");
let queuedFiles = [];

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
      || (activeFilter === "mentions" && thread.analysis.mentions.length > 0)
      || (activeFilter === "actions" && thread.analysis.actions.length > 0);
    const haystack = `${thread.title} ${thread.channel} ${thread.transcript}`.toLowerCase();
    return matchesFilter && haystack.includes(searchTerm);
  }).sort((a, b) => {
    return b.analysis.maxScore - a.analysis.maxScore;
  });
}

function renderTags(thread) {
  const { analysis } = thread;
  const tags = [];
  const deadlineCount = analysis.messages.filter((message) => message.deadline).length;
  if (analysis.mentions.length) tags.push(`<span class="tag mention">@ You</span>`);
  if (deadlineCount) tags.push(`<span class="tag deadline">${deadlineCount} deadline${deadlineCount > 1 ? "s" : ""}</span>`);
  if (analysis.actions.length) tags.push(`<span class="tag">${analysis.actions.length} action${analysis.actions.length > 1 ? "s" : ""}</span>`);
  if (analysis.priorityLabel === "Needs your attention") tags.push(`<span class="tag urgent">Priority</span>`);
  return tags.slice(0, 3).join("");
}

function renderThreadList() {
  const filtered = getFilteredThreads();
  if (!filtered.length) {
    threadList.innerHTML = `<div class="empty-state"><strong>No conversations found</strong><span>Try another filter or search term.</span></div>`;
    return;
  }
  threadList.innerHTML = filtered.map((thread) => `
    <button class="thread-card ${thread.id === selectedThreadId ? "selected" : ""}" data-thread-id="${escapeHtml(thread.id)}" aria-pressed="${thread.id === selectedThreadId}">
      <span class="thread-topline"><span class="thread-space"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.channel)}</span><span class="thread-age">${escapeHtml(thread.age)}</span></span>
      <span class="thread-title-row"><span class="thread-title">${escapeHtml(thread.title)}</span>${thread.unread ? `<i class="unread-dot" aria-label="Unread"></i>` : ""}</span>
      <span class="thread-preview">${escapeHtml(truncate(thread.analysis.summary, 105))}</span>
      <span class="thread-tags">${renderTags(thread)}</span>
    </button>`).join("");
  threadList.querySelectorAll(".thread-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedThreadId = card.dataset.threadId;
      render();
    });
  });
}

function renderInsightList(items, kind, emptyText) {
  if (!items.length) return `<ul class="insight-list ${kind}"><li>${escapeHtml(emptyText)}</li></ul>`;
  return `<ul class="insight-list ${kind}">${items.map((item) => {
    const safeText = escapeHtml(truncate(item.text, 116));
    const text = item.mention ? safeText.replace(/(@(?:alex|you|yourname)\b)/i, '<span class="mention-text">$1</span>') : safeText;
    return `<li>${text}</li>`;
  }).join("")}</ul>`;
}

function renderDetail() {
  const thread = threads.find((item) => item.id === selectedThreadId);
  if (!thread) {
    detailPanel.innerHTML = `<div class="empty-state"><strong>Select a conversation</strong><span>Choose a thread to see its summary and next steps.</span></div>`;
    return;
  }
  const { analysis } = thread;
  const parsedMessages = thread.parsed.messages;
  const topMessage = analysis.messages.reduce((highest, message) => message.score > (highest?.score ?? 0) ? message : highest, null);
  const priorityMessage = topMessage?.score
    ? `<div class="attention-banner"><span>◉</span><span><strong>${escapeHtml(analysis.priorityLabel)}:</strong> ${escapeHtml(truncate(topMessage.text, 105))}</span></div>`
    : "";
  detailPanel.innerHTML = `
    <div class="detail-head">
      <div><div class="detail-channel"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.channel)}</div><h3 class="detail-title">${escapeHtml(thread.title)}</h3><div class="detail-meta">${analysis.messages.length} parsed messages · ${escapeHtml(thread.parsed.format)} format · ${escapeHtml(thread.age)}</div></div>
      <div class="detail-actions"><button class="detail-action" data-action="copy">Copy summary</button><button class="detail-action" data-action="read">${thread.unread ? "Mark read" : "Mark unread"}</button></div>
    </div>
    <section class="detail-summary"><div class="detail-summary-label"><span>✦</span> THE SHORT VERSION</div><p>${escapeHtml(truncate(analysis.summary, 280))}</p></section>
    <div class="detail-grid">
      <section><h4 class="detail-section-title"><span class="section-count">${analysis.actions.length}</span> YOUR NEXT STEPS</h4>${renderInsightList(analysis.actions, "actions", "No clear action items found.")}</section>
      <section><h4 class="detail-section-title"><span class="section-count">${analysis.decisions.length}</span> DECISIONS</h4>${renderInsightList(analysis.decisions, "decisions", "No decisions spotted yet.")}</section>
    </div>
    ${analysis.deadlines.length ? `<section style="margin-top:16px"><h4 class="detail-section-title"><span class="section-count">${analysis.deadlines.length}</span> DEADLINES & URGENCY</h4>${renderInsightList(analysis.deadlines, "deadlines", "")}</section>` : ""}
    ${priorityMessage}
    <details class="parsed-messages">
      <summary>View parsed messages <span>${parsedMessages.length}</span></summary>
      <div class="parsed-message-list">
        ${parsedMessages.slice(0, 200).map((message) => `<div class="parsed-message">
          <div class="parsed-message-meta"><span>#${message.order}${message.sender ? ` · ${escapeHtml(message.sender)}` : " · Sender not identified"}</span><time>${escapeHtml(message.rawTimestamp ?? "No timestamp in source")}</time></div>
          <p>${escapeHtml(message.text)}</p>
          <span class="parsed-message-source">${escapeHtml(message.sourceName)}${message.edited ? " · Edited marker" : ""}${message.deleted ? " · Deleted marker" : ""}</span>
        </div>`).join("")}
        ${parsedMessages.length > 200 ? `<p class="parse-note">Showing the first 200 of ${parsedMessages.length} parsed messages.</p>` : ""}
      </div>
    </details>
    ${thread.parsed.warnings.length ? `<p class="parse-note">${thread.parsed.warnings.map(escapeHtml).join(" ")}</p>` : ""}`;
  detailPanel.querySelector('[data-action="copy"]').addEventListener("click", () => copySummary(thread));
  detailPanel.querySelector('[data-action="read"]').addEventListener("click", () => {
    thread.unread = !thread.unread;
    render();
    showToast(thread.unread ? "Marked as unread" : "Marked as read");
  });
}

function renderCounts() {
  const unread = threads.filter((thread) => thread.unread).length;
  const mentions = threads.reduce((count, thread) => count + thread.analysis.mentions.length, 0);
  const actions = threads.reduce((count, thread) => count + thread.analysis.actions.length, 0);
  document.querySelector("#all-count").textContent = String(threads.length);
  document.querySelector("#unread-count").textContent = String(unread);
  document.querySelector("#overview-unread").textContent = String(unread);
  document.querySelector("#overview-actions").textContent = String(actions);
  document.querySelector("#overview-mentions").textContent = String(mentions);
  document.querySelector("#tab-all-count").textContent = String(threads.length);
  document.querySelector("#thread-count").textContent = String(String(getFilteredThreads().length).padStart(2, "0"));
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
    row.className = `file-queue-item${entry.error ? " invalid" : ""}`;
    const description = document.createElement("span");
    description.textContent = `${entry.file.name} · ${formatFileSize(entry.file.size)}${entry.error ? ` — ${entry.error}` : " — ready to import"}`;
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
    row.append(description, remove);
    fileQueueElement.append(row);
  });
}

function getFileValidationError(file, batchBytes) {
  if (!file.name.toLowerCase().endsWith(".txt")) return "Only .txt exports are supported.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_BYTES) return "File exceeds the 5 MB per-file limit.";
  if (batchBytes > MAX_BATCH_BYTES) return "Selected files exceed the 20 MB total limit.";
  return "";
}

function updateFileError() {
  const errors = queuedFiles.filter((entry) => entry.error).map((entry) => `${entry.file.name}: ${entry.error}`);
  document.querySelector("#form-error").textContent = errors.join(" ");
}

function handleFileSelection() {
  const files = Array.from(fileInput.files ?? []);
  let batchBytes = 0;
  queuedFiles = files.map((file, index) => {
    batchBytes += file.size;
    const error = index >= MAX_FILE_COUNT
      ? `Only the first ${MAX_FILE_COUNT} selected files can be imported.`
      : getFileValidationError(file, batchBytes);
    return { file, error };
  });
  renderFileQueue();
  updateFileError();
}

function createImportedThread({ title, channel, sourceName, transcript, parsed }) {
  return {
    id: `imported-${nextThreadId++}`,
    title: truncate(title, 62),
    channel,
    sourceName,
    dot: "dot-blue",
    age: "just now",
    unread: true,
    transcript,
    parsed,
    analysis: analyzeConversation(parsed.messages)
  };
}

function importParsedConversation({ title, sourceName, channel, groupName = channel, transcript }) {
  const parsed = MissedMessageParser.parseConversation(transcript, { sourceName, groupName });
  if (parsed.errors.length) return { error: `${sourceName}: ${parsed.errors.join(" ")}` };
  const thread = createImportedThread({ title, sourceName, channel, transcript, parsed });
  return { thread, warnings: parsed.warnings.map((warning) => `${sourceName}: ${warning}`) };
}

async function importConversations() {
  const transcriptInput = document.querySelector("#conversation-input");
  const titleInput = document.querySelector("#conversation-title");
  const error = document.querySelector("#form-error");
  const pastedText = transcriptInput.value;
  const customTitle = titleInput.value.trim();
  const imported = [];
  const messages = [];
  const warnings = [];

  if (pastedText.trim()) {
    const title = customTitle || "Pasted conversation";
    const result = importParsedConversation({
      title,
      channel: customTitle || "Pasted messages",
      groupName: customTitle || null,
      sourceName: "Pasted messages",
      transcript: pastedText
    });
    if (result.error) messages.push(result.error);
    else {
      imported.push(result.thread);
      warnings.push(...result.warnings);
    }
  }

  const successfulFiles = [];
  for (const entry of queuedFiles) {
    if (entry.error) {
      messages.push(`${entry.file.name}: ${entry.error}`);
      continue;
    }
    try {
      const transcript = await entry.file.text();
      if (!transcript.trim()) {
        messages.push(`${entry.file.name}: The file contains no readable messages.`);
        successfulFiles.push(entry);
        continue;
      }
      const sourceName = entry.file.name;
      const groupName = sourceName.replace(/\.txt$/i, "");
      const result = importParsedConversation({
        title: groupName,
        channel: groupName,
        sourceName,
        transcript
      });
      if (result.error) messages.push(result.error);
      else {
        imported.push(result.thread);
        warnings.push(...result.warnings);
      }
      successfulFiles.push(entry);
    } catch (readError) {
      messages.push(`${entry.file.name}: The browser could not read this file. Please choose it again or paste its text.`);
      successfulFiles.push(entry);
    }
  }

  queuedFiles = queuedFiles.filter((entry) => !successfulFiles.includes(entry));
  if (successfulFiles.length) fileInput.value = "";
  renderFileQueue();

  if (!imported.length) {
    error.textContent = messages.join(" ") || "Paste messages or choose at least one supported .txt export.";
    return;
  }

  threads.unshift(...imported);
  selectedThreadId = imported[0].id;
  activeFilter = "all";
  searchTerm = "";
  document.querySelector("#search-input").value = "";
  transcriptInput.value = "";
  titleInput.value = "";
  render();

  if (messages.length) {
    error.textContent = [...messages, ...warnings].join(" ");
    showToast(`${imported.length} conversation${imported.length > 1 ? "s" : ""} imported; some items need attention`);
    return;
  }
  error.textContent = warnings.join(" ");
  importDialog.close();
  showToast(`${imported.length} conversation${imported.length > 1 ? "s" : ""} imported and parsed on this device`);
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
document.querySelector("#import-button").addEventListener("click", () => {
  document.querySelector("#form-error").textContent = "";
  importDialog.showModal();
});
document.querySelector("#analyze-button").addEventListener("click", importConversations);
fileInput.addEventListener("change", handleFileSelection);
document.querySelector("#sample-button").addEventListener("click", () => {
  document.querySelector("#conversation-title").value = "Sample launch conversation";
  document.querySelector("#conversation-input").value = sampleConversation;
  document.querySelector("#form-error").textContent = "";
});
document.querySelector("#help-button").addEventListener("click", () => showToast("Analysis happens in this page. Nothing is sent to a server."));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#search-input").focus();
  }
});

render();
