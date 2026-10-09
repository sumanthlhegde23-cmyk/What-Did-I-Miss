"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeConversation } = require("./message-analyzer.js");

function messages(...texts) {
  return texts.map((text, index) => ({
    text,
    order: index + 1,
    mentions: [...text.matchAll(/@[\p{L}\p{N}_][\p{L}\p{N}._~-]*/gu)].map((match) => match[0])
  }));
}

test("ranks commitments, explicit decisions, announcements and direct requests over chatter", () => {
  const result = analyzeConversation(messages(
    "Good morning everyone!",
    "I will send the revised budget tonight.",
    "Decision: we are moving the launch to Friday.",
    "Can you review the final copy by tomorrow?",
    "Heads-up: the venue changed to Hall B."
  ), ["Sam"]);

  assert.equal(result.messages[0].score, 0);
  assert.ok(result.actions.some((message) => message.text.startsWith("Can you")));
  assert.ok(result.actions.some((message) => message.text.startsWith("I will")));
  assert.ok(result.important.some((message) => message.text.startsWith("I will")));
  assert.ok(result.decisions.some((message) => message.text.startsWith("Decision:")));
  assert.ok(result.deadlines.some((message) => message.text.startsWith("Can you")));
  assert.ok(result.important.some((message) => message.text.startsWith("Heads-up:")));
  assert.match(result.summary, /Can you review|I will send/);
});

test("matches user mentions case-insensitively without matching name substrings", () => {
  const result = analyzeConversation(messages(
    "@Sam, please review the contract.",
    "Samira already reviewed it.",
    "@alex the meeting is starting."
  ), ["sam"]);

  assert.deepEqual(result.mentions.map((message) => message.order), [1]);
  assert.equal(result.messages[0].directedToUser, true);
  assert.equal(result.messages[1].mention, false);
});

test("recognizes common deadline forms and avoids treating routine today or no-rush text as urgent", () => {
  const result = analyzeConversation(messages(
    "The proposal is due Friday at noon.",
    "The deadline is now October 12.",
    "I worked on this today.",
    "No rush, this is not urgent.",
    "Please finish this by tomorrow."
  ));

  assert.deepEqual(result.deadlines.map((message) => message.order).sort(), [1, 2, 5]);
  assert.equal(result.messages[2].urgent, false);
  assert.equal(result.messages[3].urgent, false);
});

test("does not mistake counts in task messages for dates", () => {
  const result = analyzeConversation(messages("Please add 2 columns to the spreadsheet."));
  assert.equal(result.actions.length, 1);
  assert.equal(result.deadlines.length, 0);
});

test("keeps corrections, questions, and highlights tied to the original message order", () => {
  const result = analyzeConversation(messages(
    "Correction: the release is postponed to Monday.",
    "Has anyone informed the customer?",
    "Thanks!"
  ));

  assert.ok(result.important.some((message) => message.order === 1 && message.update));
  assert.deepEqual(result.questions.map((message) => message.order), [2]);
  assert.equal(result.messages[0].source, "Correction: the release is postponed to Monday.");
});
