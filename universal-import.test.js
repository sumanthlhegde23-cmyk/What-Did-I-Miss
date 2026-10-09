"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { File } = require("node:buffer");
const { deflateRawSync } = require("node:zlib");
require("./message-parser.js");
const { parseDocument, parseFile, detectPlatform } = require("./universal-import.js");

test("parses Telegram Desktop JSON chats into named normalized conversations", () => {
  const result = parseDocument(JSON.stringify({
    chats: {
      list: [{
        name: "Project room",
        messages: [
          { id: 11, date: "2026-10-08T10:00:00", from: "Sam", text: "Decision: ship Thursday" },
          { id: 12, date: "2026-10-08T10:02:00", from: "Lee", text: [{ type: "plain", text: "Review by Friday" }] }
        ]
      }]
    }
  }), { sourceName: "result.json", platform: "telegram", title: null });

  assert.equal(result.errors.length, 0);
  assert.equal(result.conversations[0].title, "Project room");
  assert.equal(result.conversations[0].parsed.format, "telegram-json");
  assert.equal(result.conversations[0].parsed.messages[1].sender, "Lee");
  assert.equal(result.conversations[0].parsed.messages[1].text, "Review by Friday");
  assert.equal(result.conversations[0].parsed.messages[0].originalReference, 11);
});

test("does not treat a JSON filename as an extracted conversation name", () => {
  const result = parseDocument(JSON.stringify({
    chats: { list: [{ messages: [{ id: 1, from: "Sam", text: "Keep the source filename." }] }] }
  }), { sourceName: "result.json", platform: "telegram", title: null });

  assert.equal(result.conversations[0].title, "Imported Conversation");
});

test("parses Telegram HTML exports and retains the actual chat header", () => {
  const result = parseDocument([
    '<div class="page_header">Design room</div>',
    '<div class="message default clearfix" id="message1">',
    '<div class="from_name">Ari</div>',
    '<div class="date details" title="08.10.2026 12:30:00 UTC+00:00">Today</div>',
    '<div class="text">Review the final layout by Friday.</div></div>'
  ].join(""), { sourceName: "messages.html", platform: "telegram", title: null });

  assert.equal(result.errors.length, 0);
  assert.equal(result.conversations[0].title, "Design room");
  assert.equal(result.conversations[0].parsed.messages[0].sender, "Ari");
  assert.equal(result.conversations[0].parsed.messages[0].text, "Review the final layout by Friday.");
});

test("does not use a text export filename as a conversation name", () => {
  const result = parseDocument("[08/10/2026, 9:00 AM] Ari: Hello", {
    sourceName: "whatsapp-chat.txt",
    platform: "whatsapp",
    title: null
  });

  assert.equal(result.conversations[0].title, "Imported Conversation");
  assert.equal(result.conversations[0].sourceName, "whatsapp-chat.txt");
});

test("detects WhatsApp text from message structure when the filename is generic", () => {
  const result = parseDocument("[08/10/2026, 9:00 AM] Ari: Hello", {
    sourceName: "chat-export.txt",
    platform: "other",
    title: null
  });

  assert.equal(result.conversations[0].sourcePlatform, "whatsapp");
  assert.equal(result.conversations[0].parsed.messages[0].sourcePlatform, "whatsapp");
});

test("parses Instagram direct-message JSON and preserves sender and reference", () => {
  const result = parseDocument(JSON.stringify({
    participants: [{ name: "Sam" }, { name: "Jordan" }],
    messages: [
      { sender_name: "Jordan", timestamp_ms: 1791460800000, content: "The venue is booked." },
      { sender_name: "Sam", timestamp_ms: 1791460860000, content: "Thanks!" }
    ]
  }), { sourceName: "message_1.json", platform: "instagram", title: "group chat" });

  assert.equal(result.conversations.length, 1);
  assert.equal(result.conversations[0].parsed.format, "instagram-json");
  assert.equal(result.conversations[0].parsed.messages[0].sender, "Jordan");
  assert.equal(result.conversations[0].parsed.messages[0].timestampISO, "2026-10-08T12:00:00.000Z");
});

test("parses Messenger messages JSON and safely skips invalid timestamps", () => {
  const result = parseDocument(JSON.stringify({
    title: "Messenger thread",
    messages: [
      { sender_name: "Morgan", timestamp_ms: "not-a-timestamp", content: "Can you review this?" },
      { sender_name: "Riley", timestamp_ms: 1000, content: "Yes." }
    ]
  }), { sourceName: "message.json", platform: "messenger", title: null });

  assert.equal(result.errors.length, 0);
  assert.equal(result.conversations[0].parsed.messages.length, 2);
  assert.equal(result.conversations[0].parsed.messages[0].timestampISO, null);
  assert.equal(result.conversations[0].parsed.messages[1].timestampISO, "1970-01-01T00:00:01.000Z");
});

test("parses quoted CSV fields with sender, text, and timestamp headers", () => {
  const result = parseDocument('sender,timestamp,message\r\n"Ada, L","2026-10-08 10:00","First line\nsecond line"\r\n', {
    sourceName: "discord.csv",
    platform: "discord",
    title: null
  });

  assert.equal(result.conversations.length, 1);
  assert.equal(result.conversations[0].parsed.format, "csv");
  assert.equal(result.conversations[0].parsed.messages[0].sender, "Ada, L");
  assert.equal(result.conversations[0].parsed.messages[0].text, "First line\nsecond line");
});

test("returns readable errors for malformed JSON, unsupported files, and empty files", async () => {
  const malformed = parseDocument("{ nope", { sourceName: "bad.json", platform: "auto" });
  const unsupported = await parseFile(new File(["bad"], "conversation.pdf"), "auto");
  const empty = await parseFile(new File([], "empty.txt"), "auto");

  assert.match(malformed.errors[0], /malformed/i);
  assert.match(unsupported.errors[0], /supported exports/i);
  assert.match(empty.errors[0], /empty/i);
});

test("auto-detects platform export filenames without making live connections", () => {
  assert.equal(detectPlatform("instagram/messages/inbox/family/message_1.json"), "instagram");
  assert.equal(detectPlatform("telegram/result.json"), "telegram");
  assert.equal(detectPlatform("whatsapp-chat.txt"), "whatsapp");
  assert.equal(detectPlatform("other.csv"), "other");
});

function makeStoredZip(filename, content, method = 0) {
  const encoder = new TextEncoder();
  const name = encoder.encode(filename);
  const uncompressedBody = encoder.encode(content);
  const body = method === 8 ? deflateRawSync(uncompressedBody) : uncompressedBody;
  const local = new Uint8Array(30 + name.length + body.length);
  const localView = new DataView(local.buffer);
  localView.setUint32(0, 0x04034b50, true);
  localView.setUint16(4, 20, true);
  localView.setUint16(8, method, true);
  localView.setUint32(18, body.length, true);
  localView.setUint32(22, uncompressedBody.length, true);
  localView.setUint16(26, name.length, true);
  local.set(name, 30);
  local.set(body, 30 + name.length);

  const central = new Uint8Array(46 + name.length);
  const centralView = new DataView(central.buffer);
  centralView.setUint32(0, 0x02014b50, true);
  centralView.setUint16(4, 20, true);
  centralView.setUint16(6, 20, true);
  centralView.setUint16(10, method, true);
  centralView.setUint32(20, body.length, true);
  centralView.setUint32(24, uncompressedBody.length, true);
  centralView.setUint16(28, name.length, true);
  central.set(name, 46);

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, 1, true);
  endView.setUint16(10, 1, true);
  endView.setUint32(12, central.length, true);
  endView.setUint32(16, local.length, true);
  const archive = new Uint8Array(local.length + central.length + end.length);
  archive.set(local, 0);
  archive.set(central, local.length);
  archive.set(end, local.length + central.length);
  return archive;
}

test("reads a supported JSON entry from a ZIP without extracting files", async () => {
  const content = JSON.stringify({ messages: [{ sender_name: "Kai", content: "Archive message" }] });
  const file = new File([makeStoredZip("instagram/messages/message_1.json", content)], "instagram-export.zip");
  const result = await parseFile(file, "auto");

  assert.equal(result.errors.length, 0);
  assert.equal(result.conversations.length, 1);
  assert.equal(result.conversations[0].parsed.messages[0].text, "Archive message");
  assert.equal(result.conversations[0].sourcePlatform, "instagram");
});

test("reads deflate-compressed ZIP entries when the runtime supports deflate-raw", async () => {
  const content = JSON.stringify({ messages: [{ sender_name: "Kai", content: "Compressed message" }] });
  const file = new File([makeStoredZip("chat/messages.json", content, 8)], "chat-export.zip");
  const result = await parseFile(file, "auto");

  assert.equal(result.errors.length, 0);
  assert.equal(result.conversations[0].parsed.messages[0].text, "Compressed message");
});
