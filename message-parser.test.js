"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseConversation } = require("./message-parser.js");

test("parses WhatsApp iOS timestamps and preserves sender, mentions, and source", () => {
  const result = parseConversation("[12/31/2024, 11:59 PM] Jamie: @Alex, please review this.", {
    sourceName: "launch.txt",
    groupName: "Launch team"
  });

  assert.equal(result.format, "whatsapp");
  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].sender, "Jamie");
  assert.equal(result.messages[0].text, "@Alex, please review this.");
  assert.equal(result.messages[0].rawTimestamp, "[12/31/2024, 11:59 PM]");
  assert.equal(result.messages[0].timestampISO, "2024-12-31T23:59:00");
  assert.deepEqual(result.messages[0].mentions, ["@Alex"]);
  assert.equal(result.messages[0].sourceName, "launch.txt");
  assert.equal(result.messages[0].groupName, "Launch team");
  assert.equal(result.messages[0].order, 1);
});

test("parses WhatsApp day-first 24-hour timestamps and timestamps without a year", () => {
  const withYear = parseConversation("31/12/24, 23:59 - Morgan: Ready");
  const withoutYear = parseConversation("31.12, 9:05 - Morgan: Ready");

  assert.equal(withYear.format, "whatsapp");
  assert.equal(withYear.messages[0].timestampISO, "2024-12-31T23:59:00");
  assert.equal(withoutYear.messages[0].date, "31.12");
  assert.equal(withoutYear.messages[0].timestampISO, null);
});

test("keeps ambiguous date order instead of inventing a normalized date", () => {
  const result = parseConversation("10/08/26, 9:05 AM - Casey: Check-in");

  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].rawTimestamp, "10/08/26, 9:05 AM");
  assert.equal(result.messages[0].timestampISO, null);
});

test("parses Telegram ISO-style exports and multiline message bodies", () => {
  const result = parseConversation([
    "2024-03-25 15:04:05 Riley: First line",
    "Second line: still the same message",
    "2024-03-25 15:10:00, Taylor: Next message"
  ].join("\n"), { sourceName: "telegram.txt" });

  assert.equal(result.format, "telegram");
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].text, "First line\nSecond line: still the same message");
  assert.equal(result.messages[0].rawTimestamp, "2024-03-25 15:04:05");
  assert.equal(result.messages[0].rawMessage, "2024-03-25 15:04:05 Riley: First line\nSecond line: still the same message");
  assert.equal(result.messages[0].timestampISO, "2024-03-25T15:04:05");
  assert.equal(result.messages[1].sender, "Taylor");
  assert.equal(result.messages[1].order, 2);
});

test("recognizes edited and deleted markers without removing source text", () => {
  const result = parseConversation([
    "[08/10/26, 9:00 AM] Lee: This message was edited",
    "[08/10/26, 9:01 AM] Lee: This message was deleted"
  ].join("\n"));

  assert.equal(result.messages[0].edited, true);
  assert.equal(result.messages[0].text, "This message was edited");
  assert.equal(result.messages[1].deleted, true);
  assert.equal(result.messages[1].text, "This message was deleted");
});

test("supports untimestamped sender lines and keeps multiline continuations", () => {
  const result = parseConversation("Ari: Hi\ncontinuation\nBo: Hello");

  assert.equal(result.format, "plain-text");
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].text, "Hi\ncontinuation");
  assert.equal(result.messages[1].sender, "Bo");
  assert.equal(result.messages[1].rawTimestamp, null);
  assert.equal(result.messages[0].groupName, null);
});

test("preserves duplicate messages and parses large conversations in order", () => {
  const transcript = Array.from({ length: 125 }, (_, index) =>
    `2024-04-01 ${String(index % 24).padStart(2, "0")}:${String(index % 60).padStart(2, "0")} Sender${index % 5}: repeated text`
  ).join("\n");
  const result = parseConversation(transcript);

  assert.equal(result.messages.length, 125);
  assert.equal(result.messages[0].order, 1);
  assert.equal(result.messages[124].order, 125);
  assert.equal(result.messages[0].text, result.messages[1].text);
});

test("reports empty and unsupported text without throwing", () => {
  const empty = parseConversation(" \n\t");
  const unsupported = parseConversation("<html><body>not a text export</body></html>");

  assert.equal(empty.format, "unsupported");
  assert.match(empty.errors[0], /empty/i);
  assert.equal(unsupported.format, "unsupported");
  assert.match(unsupported.errors[0], /WhatsApp or Telegram/i);
});

test("retains malformed timestamp-like lines and reports a warning", () => {
  const result = parseConversation([
    "31/12/24, 23:59 - Morgan: First",
    "32/13/24, 25:99 - malformed but retained"
  ].join("\n"));

  assert.equal(result.messages.length, 1);
  assert.match(result.messages[0].text, /32\/13\/24, 25:99 - malformed but retained/);
  assert.match(result.warnings[0], /could not be parsed/);
});
