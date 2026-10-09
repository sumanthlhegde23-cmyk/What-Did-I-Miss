# What Did I Miss?

What Did I Miss? is a local-first conversation catch-up app. Its visual identity pairs a conversation bubble with a focused, checked discovery lens. The original SVG brand assets include a primary wordmark, compact sidebar mark, app icon, and monochrome mark in `public/assets/`.

The first launch starts with an empty welcome screen. Paste a transcript or import exported conversations to get a local, rule-based briefing.

## Run it

Open `index.html` in a modern browser. There is no build step, account, API key, or server.

## Import limits and supported formats

Paste timestamped WhatsApp or Telegram messages, or untimestamped `Name: message` lines. The parser handles common WhatsApp bracketed iOS and dash-separated Android timestamps, ISO-style Telegram timestamps, 12-hour and 24-hour time, multiline messages, and exports with or without a year. Original message text and raw timestamps are retained. An ISO-like normalized timestamp is provided only when the date order and year can be determined without guessing; ambiguous dates remain raw.

Import supports saved WhatsApp, Telegram, Instagram, and Facebook Messenger exports through `.txt`, `.json`, `.html`/`.htm`, `.csv`, and `.zip` archives containing supported files. WhatsApp/Telegram plain text, Telegram Desktop JSON/HTML, and Instagram/Facebook Messenger message JSON are normalized locally; split `message_N.json` files for a chat are combined when they are in the same exported folder. Message-oriented CSV columns (`sender`, `timestamp`, `message`) are also supported. On mobile, export the chat and save the file to Files/Downloads before choosing it in the app. ZIP entries using stored or deflate compression are read in memory; nothing is extracted or executed. Deflate support requires the browser's `DecompressionStream("deflate-raw")`; if unavailable, extract the archive on-device and import its text files. Limits are 10 selected files, 20 MB per file/batch, 100 ZIP entries, and 50 MB expanded archive data. Exact support depends on the structure of the export; unsupported formats display an error. There is no direct connection to any messaging account.

## Privacy and analysis

Conversation text and selected files are read and processed by JavaScript in the current browser page. The app does not upload conversations or call an AI service. Its local rule-based analyzer ranks explicit requests, deadlines, urgency, decisions, announcements, and mentions, and marks the matching source messages. These are heuristic findings, not AI-generated summaries, so always verify context in the linked original messages. Imported conversations live in memory for the current page session and are not persisted. The clear-data control removes imported conversations from that session.

The app uses system fonts and makes no network requests. It works offline once the local files are available. Synthetic examples are optional and only loaded after the user chooses “Try fictional sample.”
