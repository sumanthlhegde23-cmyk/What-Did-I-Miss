"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const samples = require("./sample-conversations.js");
const { parseConversation } = require("./message-parser.js");
const { analyzeConversation } = require("./message-analyzer.js");

const EXPECTED_LANGUAGES = ["en", "kn", "hi", "te", "ta", "ml", "es", "fr", "de"];

test("provides between 5 and 8 rich fictional samples for every supported language", () => {
  for (const lang of EXPECTED_LANGUAGES) {
    const list = samples[lang];
    assert.ok(Array.isArray(list), `Expected array of samples for ${lang}`);
    assert.ok(list.length >= 5 && list.length <= 8, `Expected 5-8 samples for ${lang}, found ${list.length}`);
  }
});

test("parses and summarizes every fictional sample with zero errors", () => {
  for (const lang of EXPECTED_LANGUAGES) {
    for (const sample of samples[lang]) {
      assert.ok(sample.title && sample.title.trim().length > 0, `Sample title required in ${sample.id}`);
      assert.ok(sample.text && sample.text.trim().length > 0, `Sample text required in ${sample.id}`);

      const parsed = parseConversation(sample.text);
      assert.equal(parsed.errors.length, 0, `Parse error in sample ${sample.id}: ${parsed.errors.join(", ")}`);
      assert.ok(parsed.messages.length >= 3, `Expected at least 3 messages in ${sample.id}`);

      const analysis = analyzeConversation(parsed.messages);
      assert.ok(analysis.summary && analysis.summary.length > 0, `Summary required for ${sample.id}`);
      assert.ok(analysis.messages.length === parsed.messages.length);
    }
  }
});
