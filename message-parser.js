(function attachMessageParser(root) {
  "use strict";

  const TIMESTAMP_LINE = /^\s*(?<bracket>\[)?(?<date>\d{1,4}[./-]\d{1,2}(?:[./-]\d{2,4})?)[, ]+\s*(?<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?)\]?\s*(?:[-–,]\s*)?(?<rest>.*)$/i;
  const MALFORMED_TIMESTAMP_LINE = /^\s*\[?\d{1,4}[./-]\d{1,2}(?:[./-]\d{2,4})?[, ]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?/i;
  const SENDER_LINE = /^\s*(?<sender>[^:\r\n]{1,80}):\s?(?<text>.*)$/;
  const MENTION_PATTERN = /(?<![\w.+-])@([\p{L}\p{N}_][\p{L}\p{N}._~-]*)/gu;
  const EDITED_PATTERN = /\b(?:this message was edited|message edited|edited message)\b|<this message was edited>/i;
  const DELETED_PATTERN = /\b(?:this message was deleted|message deleted|you deleted this message|this message was removed)\b|<this message was deleted>/i;

  function parseDate(dateText) {
    const parts = dateText.split(/[./-]/).map(Number);
    let year;
    let month;
    let day;

    if (parts.length === 3 && parts[0] >= 1000) {
      [year, month, day] = parts;
    } else if (parts.length === 3) {
      const [first, second, last] = parts;
      year = last < 100 ? 2000 + last : last;
      if (first > 12 && second <= 12) {
        day = first;
        month = second;
      } else if (second > 12 && first <= 12) {
        month = first;
        day = second;
      } else {
        if (first <= 12 && second <= 12) return { year, month: null, day: null, ambiguous: true };
        return null;
      }
    } else if (parts.length === 2 && parts[0] > 12 && parts[1] <= 12) {
      [day, month] = parts;
    } else if (parts.length === 2 && parts[1] > 12 && parts[0] <= 12) {
      [month, day] = parts;
    } else if (parts.length === 2 && parts[0] <= 12 && parts[1] <= 12) {
      return { month: null, day: null, ambiguous: true };
    } else {
      return null;
    }

    if (month === null) return { year, month, day, ambiguous: true };
    if (!month || month > 12 || !day || day > 31) return null;
    if (year !== undefined) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    }
    return { year, month, day };
  }

  function parseTime(timeText) {
    const match = timeText.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] ?? 0);
    const meridiem = match[4]?.toLowerCase();

    if (minute > 59 || second > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) return null;
    if (meridiem) hour = (hour % 12) + (meridiem === "p" ? 12 : 0);
    return { hour, minute, second };
  }

  function parseTimestampLine(line) {
    const match = line.match(TIMESTAMP_LINE);
    if (!match?.groups) return null;
    const dateParts = parseDate(match.groups.date);
    const timeParts = parseTime(match.groups.time);
    if (!dateParts || !timeParts) return null;
    const dateStart = line.indexOf(match.groups.date);
    const timeStart = line.indexOf(match.groups.time, dateStart + match.groups.date.length);
    const bracketStart = line.indexOf("[");
    const bracketEnd = line.indexOf("]", timeStart);
    const rawTimestamp = match.groups.bracket && bracketStart >= 0 && bracketEnd >= 0
      ? line.slice(bracketStart, bracketEnd + 1)
      : line.slice(dateStart, timeStart + match.groups.time.length);
    const timestampISO = dateParts.year === undefined || dateParts.ambiguous
      ? null
      : `${String(dateParts.year).padStart(4, "0")}-${String(dateParts.month).padStart(2, "0")}-${String(dateParts.day).padStart(2, "0")}T${String(timeParts.hour).padStart(2, "0")}:${String(timeParts.minute).padStart(2, "0")}:${String(timeParts.second).padStart(2, "0")}`;
    return {
      rawTimestamp,
      date: match.groups.date,
      time: match.groups.time,
      timestampISO,
      rest: match.groups.rest,
      bracketed: Boolean(match.groups.bracket)
    };
  }

  function extractSenderAndText(value) {
    const match = value.match(SENDER_LINE);
    if (!match?.groups) return { sender: null, text: value };
    const sender = match.groups.sender.trim();
    if (!sender || sender.length > 80) return { sender: null, text: value };
    return { sender, text: match.groups.text };
  }

  function createMessage({ sender, text, timestamp = null, rawLines = [], sourceName, groupName, order }) {
    const messageText = text;
    return {
      sender,
      text: messageText,
      rawMessage: rawLines.join("\n"),
      rawTimestamp: timestamp?.rawTimestamp ?? null,
      date: timestamp?.date ?? null,
      time: timestamp?.time ?? null,
      timestampISO: timestamp?.timestampISO ?? null,
      sourceName,
      groupName,
      order,
      mentions: [...messageText.matchAll(MENTION_PATTERN)].map((match) => match[0]),
      edited: EDITED_PATTERN.test(messageText),
      deleted: DELETED_PATTERN.test(messageText)
    };
  }

  function parseConversation(input, options = {}) {
    const settings = options && typeof options === "object" ? options : {};
    const sourceName = typeof settings.sourceName === "string" && settings.sourceName.trim()
      ? settings.sourceName.trim()
      : "Pasted conversation";
    const groupName = typeof settings.groupName === "string" && settings.groupName.trim()
      ? settings.groupName.trim()
      : null;
    const base = { sourceName, groupName, messages: [], warnings: [], errors: [] };

    if (typeof input !== "string" || !input.trim()) {
      return { ...base, format: "unsupported", errors: ["The conversation is empty. Paste messages or choose a non-empty .txt export."] };
    }

    const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/);
    const containsTimestamps = lines.some((line) => parseTimestampLine(line));
    const messages = [];
    let current = null;
    let timestampCount = 0;
    let genericCount = 0;
    let malformedTimestampCount = 0;
    const leadingLines = [];

    function flushCurrent() {
      if (current) messages.push(createMessage({ ...current, sourceName, groupName, order: messages.length + 1 }));
      current = null;
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const timestamp = parseTimestampLine(line);
      if (timestamp) {
        flushCurrent();
        timestampCount += 1;
        const parsed = extractSenderAndText(timestamp.rest);
        current = { ...parsed, timestamp, rawLines: [line] };
        continue;
      }

      const senderMatch = containsTimestamps ? null : line.match(SENDER_LINE);
      if (senderMatch?.groups) {
        flushCurrent();
        genericCount += 1;
        current = { sender: senderMatch.groups.sender.trim(), text: senderMatch.groups.text, timestamp: null, rawLines: [line] };
        continue;
      }

      if (MALFORMED_TIMESTAMP_LINE.test(line)) malformedTimestampCount += 1;
      if (current) {
        current.text += `${current.text ? "\n" : ""}${line}`;
        current.rawLines.push(line);
      } else if (line.trim()) {
        leadingLines.push(line);
      }
    }
    flushCurrent();

    if (leadingLines.length) {
      messages.unshift(createMessage({
        sender: null,
        text: leadingLines.join("\n"),
        rawLines: leadingLines,
        sourceName,
        groupName,
        order: 1
      }));
      messages.forEach((message, index) => { message.order = index + 1; });
      base.warnings.push(`${leadingLines.length} line(s) before the first recognized message were kept as an untimestamped message.`);
    }
    if (malformedTimestampCount) {
      base.warnings.push(`${malformedTimestampCount} line(s) looked like timestamps but could not be parsed; their original text was retained.`);
    }
    if (!messages.length) {
      return {
        ...base,
        format: "unsupported",
        errors: ["No recognizable chat messages were found. Use a WhatsApp/Telegram .txt export or lines formatted as “Name: message”."]
      };
    }

    const format = timestampCount
      ? lines.some((line) => {
        const timestamp = parseTimestampLine(line);
        return timestamp && (/^\s*\[/.test(line) || timestamp.date.includes("/") || timestamp.date.includes("."));
      })
        ? "whatsapp"
        : "telegram"
      : genericCount
        ? "plain-text"
        : "unsupported";
    if (format === "unsupported") {
      return {
        ...base,
        messages,
        format,
        errors: ["This export format is not recognized. Export as plain-text (.txt) from WhatsApp or Telegram, or paste messages as “Name: message”."]
      };
    }
    return { ...base, format, messages };
  }

  const api = { parseConversation };
  root.MissedMessageParser = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
