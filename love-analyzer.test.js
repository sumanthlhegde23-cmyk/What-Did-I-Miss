"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeLovePsychology } = require("./love-analyzer.js");
const { parseConversation } = require("./message-parser.js");

test("accurately identifies one-sided love with reasons and quotes in English", () => {
  const chat = `
[10:15 PM] Alex: Hey Maya, did you reach home safely? It was raining so heavily!
[10:16 PM] Alex: Please make sure you have dinner and take some hot tea ❤️
[10:17 PM] Alex: I can't stop thinking about our conversation today. You looked so beautiful.
[10:20 PM] Maya: Yes reached. Thanks. Had some soup.
[11:45 PM] Alex: I miss you already babe. Sleep well, sweet dreams!
[11:46 PM] Alex: Next time we meet, we will go to that lakeside place together.
[11:48 PM] Maya: Goodnight.
`;
  const parsed = parseConversation(chat);
  const result = analyzeLovePsychology(parsed);

  assert.equal(result.winnerSender, "Alex");
  assert.equal(result.mutualLove, false);
  assert.ok(result.totalReasonsCount >= 4, `Expected at least 4 reasons, got ${result.totalReasonsCount}`);
  assert.match(result.verdict, /Alex is deeply in love/);

  // Check specific psychological reasons
  const reasonCategories = result.reasons.map((r) => r.category);
  assert.ok(reasonCategories.some((c) => c.includes("Protective Care")));
  assert.ok(reasonCategories.some((c) => c.includes("Romantic Affection")));
  assert.ok(reasonCategories.some((c) => c.includes("Circadian Intimacy")));
  assert.ok(reasonCategories.some((c) => c.includes("We-Talk")));

  // Verify evidence quotes are present
  const careReason = result.reasons.find((r) => r.id === "care-attachment");
  assert.ok(careReason.quotes.length > 0);
  assert.match(careReason.quotes[0], /reach home safely/i);
});

test("accurately identifies mutual love when both parties reciprocate in English", () => {
  const chat = `
[11:15 PM] Rahul: Hey Ananya, reached home? Did you eat dinner?
[11:16 PM] Rahul: I miss you so much sweetheart ❤️
[11:18 PM] Ananya: Yes Rahul! Just had dinner. I miss you too baby 🥰 You mean the world to me.
[11:20 PM] Rahul: When we meet this weekend, our future plans will be amazing together.
[11:22 PM] Ananya: I can't wait! We will spend all our time together. Take care and sleep tight!
[11:24 PM] Rahul: Sweet dreams my love!
`;
  const parsed = parseConversation(chat);
  const result = analyzeLovePsychology(parsed);

  assert.equal(result.mutualLove, true);
  assert.match(result.verdict, /Mutual Love Confirmed/i);
  assert.ok(result.totalReasonsCount >= 3);
});

test("accurately analyzes romantic conversation in Kannada (ಕನ್ನಡ)", () => {
  const chat = `
[10:30 PM] ರಮೇಶ್: ಪ್ರಿಯಾ, ಮನೆಗೆ ಹುಷಾರಾಗಿ ತಲುಪಿದ್ಯಾ? ಊಟ ಆಯ್ತಾ?
[10:31 PM] ರಮೇಶ್: ನಿನ್ನದೇ ಯೋಚನೆ ನನಗೆ. ನೀನು ತುಂಬಾ ಮುದ್ದಾಗಿದ್ದೀಯಾ ❤️
[10:32 PM] ರಮೇಶ್: ನಿನ್ನ ಪ್ರೀತಿ ನನ್ನ ಜೀವನ ಬಂಗಾರ. ಐ ಲವ್ ಯು.
[10:35 PM] ಪ್ರಿಯಾ: ಹೌದು ರಮೇಶ್, ಊಟ ಆಯ್ತು. ನೀನು ಊಟ ಮಾಡಿದ್ಯಾ?
[11:45 PM] ರಮೇಶ್: ನಾವು ಒಟ್ಟಿಗೆ ಮುಂದಿನ ವಾರ ಭೇಟಿಯಾಗೋಣ. ಶುಭ ರಾತ್ರಿ ಚಿನ್ನ, ಸಿಹಿ ಕನಸು!
`;
  const parsed = parseConversation(chat);
  const result = analyzeLovePsychology(parsed);

  assert.equal(result.winnerSender, "ರಮೇಶ್");
  assert.ok(result.totalReasonsCount >= 3, `Expected at least 3 reasons in Kannada, got ${result.totalReasonsCount}`);
  assert.match(result.verdict, /ರಮೇಶ್/);

  const ramesh = result.participants.find((p) => p.name === "ರಮೇಶ್");
  assert.ok(ramesh.affectionCount >= 1);
  assert.ok(ramesh.careCount >= 1);
  assert.ok(ramesh.loveScore >= 70);
});

test("accurately analyzes romantic conversation in Hindi (हिंदी)", () => {
  const chat = `
[10:15 PM] कबीर: जोया, घर सुरक्षित पहुंच गई? खाना खाया तुमने?
[10:16 PM] कबीर: मुझे तुम्हारी बहुत याद आ रही है जानू ❤️
[10:17 PM] कबीर: तुम बहुत सुंदर लग रही थी आज।
[10:20 PM] जोया: हां कबीर, पहुंच गई। खाना भी खा लिया।
[11:30 PM] कबीर: हम दोनों साथ रहेंगे हमेशा। अपना ख्याल रखना। शुभ रात्रि स्वीट ड्रीम्स!
`;
  const parsed = parseConversation(chat);
  const result = analyzeLovePsychology(parsed);

  assert.equal(result.winnerSender, "कबीर");
  assert.ok(result.totalReasonsCount >= 3, `Expected at least 3 reasons in Hindi, got ${result.totalReasonsCount}`);
  assert.match(result.verdict, /कबीर/);

  const kabir = result.participants.find((p) => p.name === "कबीर");
  assert.ok(kabir.affectionCount >= 1);
  assert.ok(kabir.careCount >= 1);
  assert.ok(kabir.loveScore >= 70);
});

test("handles empty or neutral non-romantic conversation gracefully", () => {
  const chat = `
[09:00 AM] Sam: Here is the spreadsheet.
[09:05 AM] Dave: Thanks, reviewed the numbers.
[09:10 AM] Sam: Let's discuss in the standup meeting.
`;
  const parsed = parseConversation(chat);
  const result = analyzeLovePsychology(parsed);

  assert.equal(result.mutualLove, false);
  assert.match(result.verdict, /Developing Connection|Fond Friendship/);
  assert.ok(result.participants.every((p) => p.loveScore < 50));
});
