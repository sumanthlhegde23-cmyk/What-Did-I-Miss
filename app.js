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

function cleanLine(line) {
  return line.replace(/^\s*(?:\[[^\]]+\]\s*)?/, "").replace(/^[^:\n]{1,40}:\s*/, "").trim();
}

function analyzeConversation(transcript) {
  const lines = transcript.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const messages = lines.map((text, index) => {
    const content = cleanLine(text);
    const mention = /@(?:alex|you|yourname)\b/i.test(text);
    const urgent = urgencyPattern.test(content);
    const deadline = deadlinePattern.test(content);
    const decision = decisionPattern.test(content);
    const action = actionPattern.test(content);
    const directedToUser = /\b(?:can|could|would)\s+you\b|\bneed you to\b|\byour (?:action|task|turn)\b|\bplease\b/i.test(content)
      || (mention && action);
    const score = (mention ? 5 : 0) + (urgent ? 4 : 0) + (deadline ? 3 : 0) + (action ? 2 : 0) + (decision ? 2 : 0);
    return { text: content, source: text, index, mention, urgent, deadline, decision, action, directedToUser, score };
  });

  const priority = [...messages].sort((a, b) => b.score - a.score || a.index - b.index);
  const meaningful = priority.filter((message) => message.score > 0);
  const summaryItems = (meaningful.length ? meaningful : messages).slice(0, 3);
  const summary = summaryItems.map((message) => message.text).join(" ");
  const actions = messages.filter((message) => message.action && message.directedToUser).slice(0, 4);
  const decisions = messages.filter((message) => message.decision).slice(0, 3);
  const deadlines = messages.filter((message) => message.deadline || message.urgent).slice(0, 3);
  const mentions = messages.filter((message) => message.mention);
  const maxScore = Math.max(0, ...messages.map((message) => message.score));
  const priorityLabel = maxScore >= 8 ? "Needs your attention" : maxScore >= 4 ? "Worth a look" : "For your awareness";

  return { messages, summary, actions, decisions, deadlines, mentions, priorityLabel };
}

const threads = sampleThreads.map((thread) => ({ ...thread, analysis: analyzeConversation(thread.transcript) }));
let activeFilter = "all";
let selectedThreadId = threads[0]?.id ?? null;
let searchTerm = "";
let nextThreadId = 4;
let toastTimer;

const threadList = document.querySelector("#thread-list");
const detailPanel = document.querySelector("#detail-panel");
const importDialog = document.querySelector("#import-dialog");

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
    const aPriority = Math.max(0, ...a.analysis.messages.map((message) => message.score));
    const bPriority = Math.max(0, ...b.analysis.messages.map((message) => message.score));
    return bPriority - aPriority;
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
  const topMessage = [...analysis.messages].sort((a, b) => b.score - a.score)[0];
  const priorityMessage = topMessage?.score
    ? `<div class="attention-banner"><span>◉</span><span><strong>${escapeHtml(analysis.priorityLabel)}:</strong> ${escapeHtml(truncate(topMessage.text, 105))}</span></div>`
    : "";
  detailPanel.innerHTML = `
    <div class="detail-head">
      <div><div class="detail-channel"><i class="space-dot ${thread.dot}"></i>${escapeHtml(thread.channel)}</div><h3 class="detail-title">${escapeHtml(thread.title)}</h3><div class="detail-meta">Updated ${escapeHtml(thread.age)} · ${analysis.messages.length} messages analyzed</div></div>
      <div class="detail-actions"><button class="detail-action" data-action="copy">Copy summary</button><button class="detail-action" data-action="read">${thread.unread ? "Mark read" : "Mark unread"}</button></div>
    </div>
    <section class="detail-summary"><div class="detail-summary-label"><span>✦</span> THE SHORT VERSION</div><p>${escapeHtml(truncate(analysis.summary, 280))}</p></section>
    <div class="detail-grid">
      <section><h4 class="detail-section-title"><span class="section-count">${analysis.actions.length}</span> YOUR NEXT STEPS</h4>${renderInsightList(analysis.actions, "actions", "No clear action items found.")}</section>
      <section><h4 class="detail-section-title"><span class="section-count">${analysis.decisions.length}</span> DECISIONS</h4>${renderInsightList(analysis.decisions, "decisions", "No decisions spotted yet.")}</section>
    </div>
    ${analysis.deadlines.length ? `<section style="margin-top:16px"><h4 class="detail-section-title"><span class="section-count">${analysis.deadlines.length}</span> DEADLINES & URGENCY</h4>${renderInsightList(analysis.deadlines, "deadlines", "")}</section>` : ""}
    ${priorityMessage}`;
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

function addConversation() {
  const transcriptInput = document.querySelector("#conversation-input");
  const titleInput = document.querySelector("#conversation-title");
  const error = document.querySelector("#form-error");
  const transcript = transcriptInput.value.trim();
  if (!transcript) {
    error.textContent = "Paste a conversation first so there’s something to analyze.";
    transcriptInput.focus();
    return;
  }
  const title = titleInput.value.trim() || cleanLine(transcript.split(/\r?\n/).find((line) => line.trim()) ?? "") || "Untitled conversation";
  const thread = {
    id: `imported-${nextThreadId++}`,
    title: truncate(title, 62),
    channel: "Pasted conversation",
    dot: "dot-blue",
    age: "just now",
    unread: true,
    transcript,
    analysis: analyzeConversation(transcript)
  };
  threads.unshift(thread);
  selectedThreadId = thread.id;
  activeFilter = "all";
  searchTerm = "";
  document.querySelector("#search-input").value = "";
  transcriptInput.value = "";
  titleInput.value = "";
  error.textContent = "";
  importDialog.close();
  render();
  showToast("Conversation analyzed on this device");
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
document.querySelector("#analyze-button").addEventListener("click", addConversation);
document.querySelector("#help-button").addEventListener("click", () => showToast("Analysis happens in this page. Nothing is sent to a server."));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#search-input").focus();
  }
});

render();
