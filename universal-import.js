(function attachUniversalImporter(root) {
  "use strict";

  const MAX_ARCHIVE_ENTRIES = 100;
  const MAX_ARCHIVE_EXPANDED_BYTES = 50 * 1024 * 1024;
  const TEXT_EXTENSIONS = new Set(["txt", "json", "html", "htm", "csv"]);

  function extensionOf(name) {
    return String(name).split(".").pop().toLowerCase();
  }

  function decodeHtml(value) {
    return value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:div|p|li|tr)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .trim();
  }

  function flattenText(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(flattenText).filter(Boolean).join("");
    if (value && typeof value === "object") {
      if (typeof value.text === "string") return value.text;
      if (Array.isArray(value.text)) return flattenText(value.text);
      if (typeof value.content === "string") return value.content;
    }
    return "";
  }

  function normalizeMessage(message, index, sourceName, platform, conversationName) {
    let timestamp = null;
    const epoch = message.timestamp_ms != null
      ? Number(message.timestamp_ms)
      : message.date_unixtime != null
        ? Number(message.date_unixtime) * 1000
        : null;
    if (epoch !== null && Number.isFinite(epoch)) {
      const date = new Date(epoch);
      if (!Number.isNaN(date.getTime())) timestamp = date.toISOString();
    } else if (typeof message.date === "string") timestamp = message.date;
    else if (typeof message.timestamp === "string") timestamp = message.timestamp;
    const rawText = flattenText(message.text ?? message.content ?? message.message);
    const sender = message.sender_name ?? message.from ?? message.sender ?? message.author?.name ?? null;
    return {
      sender: typeof sender === "string" ? sender : null,
      text: rawText,
      rawMessage: rawText,
      rawTimestamp: typeof message.date === "string" ? message.date : typeof message.timestamp === "string" ? message.timestamp : timestamp,
      date: timestamp,
      time: null,
      timestampISO: timestamp,
      sourceName,
      groupName: conversationName ?? null,
      sourcePlatform: platform,
      originalReference: message.id ?? message.message_id ?? message.permalink ?? null,
      order: index + 1,
      mentions: [...rawText.matchAll(/(?<![\w.+-])@([\p{L}\p{N}_][\p{L}\p{N}._~-]*)/gu)].map((match) => match[0]),
      edited: Boolean(message.is_edited ?? message.edited),
      deleted: Boolean(message.is_unsent ?? message.deleted)
    };
  }

  function conversationFromMessages(messages, options) {
    if (!Array.isArray(messages)) return null;
    const parsedMessages = messages
      .filter((message) => message && typeof message === "object")
      .map((message, index) => normalizeMessage(message, index, options.sourceName, options.platform, options.title))
      .filter((message) => message.text.trim());
    if (!parsedMessages.length) return null;
    return {
      title: options.title || "Imported Conversation",
      sourceName: options.sourceName,
      sourcePlatform: options.platform,
      channel: options.title || options.sourceName,
      parsed: { format: options.format, messages: parsedMessages, warnings: [], errors: [] }
    };
  }

  function parseJsonDocument(value, options) {
    const conversations = [];
    const document = value && typeof value === "object" ? value : null;
    if (!document) return conversations;

    const telegramChats = document.chats?.list;
    if (Array.isArray(telegramChats)) {
      for (const chat of telegramChats) {
        const title = typeof chat.name === "string" ? chat.name : options.title || "Imported Conversation";
        const conversation = conversationFromMessages(chat.messages, { ...options, title, format: "telegram-json" });
        if (conversation) conversations.push(conversation);
      }
      if (conversations.length) return conversations;
    }

    if (Array.isArray(document.messages)) {
      const participants = Array.isArray(document.participants) ? document.participants.map((item) => item.name).filter(Boolean) : [];
      const title = document.title ?? document.name ?? options.title ?? "Imported Conversation";
      const format = options.platform === "instagram" ? "instagram-json" : options.platform === "facebook" || options.platform === "messenger" ? "facebook-json" : "json";
      const conversation = conversationFromMessages(document.messages, { ...options, title, format });
      if (conversation) {
        if (participants.length) conversation.parsed.participants = participants;
        conversations.push(conversation);
      }
      if (conversations.length) return conversations;
    }

    const inbox = document.inbox;
    if (inbox && typeof inbox === "object") {
      for (const items of Object.values(inbox)) {
        for (const item of Array.isArray(items) ? items : []) {
          const title = item.title ?? item.thread_path ?? "Imported Conversation";
          const format = options.platform === "instagram" ? "instagram-json" : "facebook-json";
          const conversation = conversationFromMessages(item.messages, { ...options, title, format });
          if (conversation) conversations.push(conversation);
        }
      }
      if (conversations.length) return conversations;
    }

    if (Array.isArray(document)) {
      const conversation = conversationFromMessages(document, { ...options, format: "json" });
      if (conversation) conversations.push(conversation);
    }
    return conversations;
  }

  function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"' && quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        row.push(cell);
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
        cell = "";
        if (character === "\r" && text[index + 1] === "\n") index += 1;
      } else {
        cell += character;
      }
    }
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
    return rows;
  }

  function parseCsvDocument(text, options) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) return [];
    const headers = rows.shift().map((header) => header.trim().toLowerCase().replace(/[\s_-]+/g, ""));
    const findIndex = (candidates) => headers.findIndex((header) => candidates.includes(header));
    const senderIndex = findIndex(["sender", "author", "from", "username", "sendername"]);
    const textIndex = findIndex(["message", "content", "text", "body"]);
    const timestampIndex = findIndex(["timestamp", "datetime", "date", "createdat", "time"]);
    if (textIndex < 0) return [];
    const messages = rows.map((row) => ({
      sender: senderIndex < 0 ? null : row[senderIndex] ?? null,
      text: row[textIndex] ?? "",
      date: timestampIndex < 0 ? null : row[timestampIndex] ?? null,
      timestamp: timestampIndex < 0 ? null : row[timestampIndex] ?? null
    }));
    const conversation = conversationFromMessages(messages, { ...options, format: "csv" });
    return conversation ? [conversation] : [];
  }

  function parseTelegramHtml(text, options) {
    const messages = [];
    const blocks = text.match(/<div\b(?=[^>]*\bclass=["'][^"']*\bmessage\b)[^>]*>[\s\S]*?(?=<div\b(?=[^>]*\bclass=["'][^"']*\bmessage\b)|<\/body>|$)/gi) ?? [];
    for (const block of blocks) {
      const senderMatch = block.match(/<div\b(?=[^>]*\bclass=["'][^"']*\bfrom_name\b)[^>]*>([\s\S]*?)<\/div>/i);
      const dateMatch = block.match(/<div\b(?=[^>]*\bclass=["'][^"']*\bdate\b)[^>]*\btitle=["']([^"']+)["']/i);
      const textMatch = block.match(/<div\b(?=[^>]*\bclass=["'][^"']*\btext\b)[^>]*>([\s\S]*?)<\/div>/i);
      if (!textMatch) continue;
      const idMatch = block.match(/\bid=["']message(\d+)["']/i);
      messages.push({
        sender: senderMatch ? decodeHtml(senderMatch[1]) : null,
        text: decodeHtml(textMatch[1]),
        date: dateMatch?.[1] ?? null,
        timestamp: dateMatch?.[1] ?? null,
        id: idMatch?.[1] ?? null
      });
    }
    const header = text.match(/<div\b(?=[^>]*\bclass=["'][^"']*\bpage_header\b)[^>]*>([\s\S]*?)<\/div>/i);
    const title = options.title || (header ? decodeHtml(header[1]) : "Imported Conversation");
    const conversation = conversationFromMessages(messages, { ...options, title, format: "telegram-html" });
    return conversation ? [conversation] : [];
  }

  function parseTextDocument(text, options) {
    const parsed = root.MissedMessageParser.parseConversation(text, {
      sourceName: options.sourceName,
      groupName: options.title ?? null
    });
    if (parsed.errors.length) return { conversations: [], errors: parsed.errors, warnings: parsed.warnings };
    const platform = ["auto", "other"].includes(options.platform) && ["whatsapp", "telegram"].includes(parsed.format)
      ? parsed.format
      : options.platform;
    parsed.messages.forEach((message) => { message.sourcePlatform = platform; });
    return {
      conversations: [{
        title: options.title ?? "Imported Conversation",
        sourceName: options.sourceName,
        sourcePlatform: platform,
        channel: options.title ?? "Imported Conversation",
        parsed
      }],
      errors: [],
      warnings: parsed.warnings
    };
  }

  function parseHtmlDocument(text, options) {
    const isTelegram = /class=["'][^"']*\bmessage\b/i.test(text) && /class=["'][^"']*\btext\b/i.test(text);
    if (!isTelegram) return { conversations: [], errors: ["HTML format not recognized. Telegram Desktop HTML exports are supported; Instagram exports should be JSON or a supported ZIP."], warnings: [] };
    return { conversations: parseTelegramHtml(text, options), errors: [], warnings: [] };
  }

  function parseDocument(text, options) {
    const extension = extensionOf(options.sourceName);
    if (extension === "txt") return parseTextDocument(text, options);
    if (extension === "json") {
      try {
        const data = JSON.parse(text);
        const conversations = parseJsonDocument(data, options);
        return conversations.length
          ? { conversations, errors: [], warnings: [] }
          : { conversations: [], errors: ["JSON file contains no recognized messages. Telegram JSON, Instagram messages.json, Messenger messages, or compatible message arrays are supported."], warnings: [] };
      } catch {
        return { conversations: [], errors: ["This JSON file is malformed. Choose a valid chat-export JSON file."], warnings: [] };
      }
    }
    if (extension === "csv") {
      const conversations = parseCsvDocument(text, options);
      return conversations.length
        ? { conversations, errors: [], warnings: [] }
        : { conversations: [], errors: ["CSV needs a message/text/content column and at least one message row. Optional columns: sender, timestamp."], warnings: [] };
    }
    if (extension === "html" || extension === "htm") return parseHtmlDocument(text, options);
    return { conversations: [], errors: ["Unsupported file type. Supported exports are .txt, .json, .html, .csv, and supported .zip archives."], warnings: [] };
  }

  function findEndOfCentralDirectory(bytes, view) {
    const minOffset = Math.max(0, bytes.length - 65557);
    for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) return offset;
    }
    return -1;
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("This browser cannot safely decompress ZIP archives. Extract the archive on your device and import its .txt, .json, .html, or .csv files.");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader = stream.getReader();
    const chunks = [];
    let expanded = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        expanded += value.length;
        if (expanded > MAX_ARCHIVE_EXPANDED_BYTES) {
          await reader.cancel();
          throw new Error("ZIP entry expands beyond the 50 MB safety limit.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const result = new Uint8Array(expanded);
    let outputOffset = 0;
    chunks.forEach((chunk) => {
      result.set(chunk, outputOffset);
      outputOffset += chunk.length;
    });
    return result;
  }

  async function readZipEntries(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const eocd = findEndOfCentralDirectory(bytes, view);
    if (eocd < 0) throw new Error("This ZIP archive is invalid or incomplete.");
    const entryCount = view.getUint16(eocd + 10, true);
    const directoryOffset = view.getUint32(eocd + 16, true);
    if (entryCount > MAX_ARCHIVE_ENTRIES) throw new Error(`ZIP contains too many entries (maximum ${MAX_ARCHIVE_ENTRIES}).`);
    let offset = directoryOffset;
    let expandedTotal = 0;
    const entries = [];
    const decoder = new TextDecoder("utf-8", { fatal: false });

    for (let index = 0; index < entryCount; index += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("ZIP central directory is malformed.");
      const flags = view.getUint16(offset + 8, true);
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const expandedSize = view.getUint32(offset + 24, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
      offset += 46 + nameLength + extraLength + commentLength;
      if (name.endsWith("/") || !TEXT_EXTENSIONS.has(extensionOf(name))) continue;
      if (expandedSize > MAX_ARCHIVE_EXPANDED_BYTES || compressedSize > bytes.length || localOffset + 30 > bytes.length) {
        throw new Error(`ZIP entry "${name}" exceeds its safe archive bounds.`);
      }
      if (flags & 1) throw new Error(`Encrypted ZIP entry "${name}" is not supported.`);
      expandedTotal += expandedSize;
      if (expandedTotal > MAX_ARCHIVE_EXPANDED_BYTES) throw new Error("ZIP expands beyond the 50 MB safety limit.");
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error(`ZIP entry "${name}" is malformed.`);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const contentStart = localOffset + 30 + localNameLength + localExtraLength;
      if (contentStart + compressedSize > bytes.length) throw new Error(`ZIP entry "${name}" is truncated.`);
      const compressed = bytes.subarray(contentStart, contentStart + compressedSize);
      let content;
      if (method === 0) content = compressed;
      else if (method === 8) content = await inflateRaw(compressed);
      else throw new Error(`ZIP compression method for "${name}" is not supported.`);
      if (content.length !== expandedSize) throw new Error(`ZIP entry "${name}" failed its size check.`);
      entries.push({ name, text: decoder.decode(content) });
    }
    return entries;
  }

  async function parseFile(file, selectedPlatform = "auto") {
    const sourceName = file?.name || "Unnamed file";
    const extension = extensionOf(sourceName);
    if (!file || !TEXT_EXTENSIONS.has(extension) && extension !== "zip") {
      return { conversations: [], errors: [`${sourceName}: unsupported format. Supported exports: .txt, .json, .html, .csv, and supported .zip archives.`], warnings: [] };
    }
    if (!file.size) return { conversations: [], errors: [`${sourceName}: the file is empty.`], warnings: [] };
    if (file.size > 20 * 1024 * 1024) return { conversations: [], errors: [`${sourceName}: files must be 20 MB or smaller.`], warnings: [] };

    const platform = selectedPlatform === "auto" ? detectPlatform(sourceName) : selectedPlatform;
    const baseOptions = { sourceName, platform, title: null };
    try {
      if (extension !== "zip") return parseDocument(await file.text(), baseOptions);
      const entries = await readZipEntries(await file.arrayBuffer());
      if (!entries.length) return { conversations: [], errors: [`${sourceName}: archive contains no supported .txt, .json, .html, or .csv files.`], warnings: [] };
      const conversations = [];
      const errors = [];
      const warnings = [];
      for (const entry of entries) {
        const entryPlatform = selectedPlatform === "auto" ? detectPlatform(entry.name) : selectedPlatform;
        const pathParts = entry.name.replace(/\\/g, "/").split("/").filter(Boolean);
        const parent = pathParts.length > 1 ? pathParts[pathParts.length - 2] : null;
        const isMessageChunk = /message_\d+\.json$/i.test(entry.name);
        const title = isMessageChunk && parent
          ? parent.replace(/[_-]+/g, " ")
          : pathParts[pathParts.length - 1].replace(/\.[^.]+$/, "");
        const parsed = parseDocument(entry.text, { sourceName: `${sourceName} / ${entry.name}`, platform: entryPlatform, title });
        conversations.push(...parsed.conversations.map((conversation) => ({
          ...conversation,
          archiveGroup: isMessageChunk ? `${entryPlatform}:${pathParts.slice(0, -1).join("/")}`.toLowerCase() : null,
          sourcePlatform: entryPlatform
        })));
        errors.push(...parsed.errors);
        warnings.push(...parsed.warnings);
      }
      const grouped = new Map();
      const merged = [];
      conversations.forEach((conversation) => {
        if (!conversation.archiveGroup) {
          merged.push(conversation);
          return;
        }
        const existing = grouped.get(conversation.archiveGroup);
        if (!existing) {
          grouped.set(conversation.archiveGroup, conversation);
          merged.push(conversation);
          return;
        }
        existing.parsed.messages.push(...conversation.parsed.messages);
      });
      merged.forEach((conversation) => {
        conversation.parsed.messages.sort((a, b) => {
          const aTime = a.timestampISO ? Date.parse(a.timestampISO) : Number.NaN;
          const bTime = b.timestampISO ? Date.parse(b.timestampISO) : Number.NaN;
          return Number.isFinite(aTime) && Number.isFinite(bTime) ? aTime - bTime : a.order - b.order;
        });
        conversation.parsed.messages.forEach((message, index) => { message.order = index + 1; });
        delete conversation.archiveGroup;
      });
      return { conversations: merged, errors, warnings };
    } catch (error) {
      return { conversations: [], errors: [`${sourceName}: ${error instanceof Error ? error.message : "The file could not be safely read."}`], warnings: [] };
    }
  }

  function detectPlatform(name) {
    const normalized = name.toLowerCase();
    if (/whatsapp|chat\.txt/.test(normalized)) return "whatsapp";
    if (/telegram|result\.json/.test(normalized)) return "telegram";
    if (/messenger|facebook/.test(normalized)) return "facebook";
    if (/instagram|message_\d+\.json|messages\.json/.test(normalized)) return "instagram";
    if (/discord/.test(normalized)) return "discord";
    return "other";
  }

  root.MissedUniversalImporter = { parseFile, parseDocument, parseJsonDocument, parseCsvDocument, detectPlatform };
  if (typeof module !== "undefined" && module.exports) module.exports = root.MissedUniversalImporter;
})(typeof globalThis !== "undefined" ? globalThis : window);
