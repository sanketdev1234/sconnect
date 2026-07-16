// Utilities/aiSummarizer.js
// ─── AI Meeting Summarizer ──────────────────────────────────────────────────
// Uses Transformers.js to run DistilBART locally (no API calls, no cost).
// Model: Xenova/distilbart-cnn-6-6 (~300MB, downloaded & cached on first use)
// ─────────────────────────────────────────────────────────────────────────────

let summarizer = null;
let isLoading = false;

/**
 * Lazy-load the summarization pipeline (singleton pattern).
 * First call downloads + loads the model (~20s), subsequent calls are instant.
 * The model runs 100% locally via ONNX Runtime — zero API calls.
 */
async function getSummarizer() {
  if (summarizer) return summarizer;

  if (isLoading) {
    // Another call is already loading — wait for it to finish
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return summarizer;
  }

  isLoading = true;
  try {
    // Dynamic import because @huggingface/transformers is ESM-only
    const { pipeline } = await import("@huggingface/transformers");
    console.log("[AI] Loading summarization model (first time takes ~20s)...");
    summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-6-6");
    console.log("[AI] Summarization model loaded successfully!");
    return summarizer;
  } catch (err) {
    console.error("[AI] Failed to load summarization model:", err.message);
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Summarize meeting chat messages using the DistilBART transformer model.
 *
 * @param {Array} chats - Array of populated chat objects ({ Author: { display_name }, Content })
 * @returns {Object} { summary: string, messageCount: number, generatedAt: Date }
 */
async function summarizeMeeting(chats) {
  if (!chats || chats.length === 0) {
    return {
      summary: "No messages were exchanged in this meeting.",
      messageCount: 0,
      generatedAt: new Date(),
    };
  }

  // Format: "Alice: Hello everyone\nBob: Hi Alice, let's discuss the project..."
  const chatText = chats
    .map(
      (c) => `${c.Author?.display_name || "Unknown"}: ${c.Content}`
    )
    .join("\n");

  // If too few words, skip the model (it needs ~15+ words for meaningful output)
  const wordCount = chatText.split(/\s+/).length;
  if (wordCount < 15) {
    return {
      summary: `Brief meeting with ${chats.length} message(s): "${chats.map((c) => c.Content).join("; ")}"`,
      messageCount: chats.length,
      generatedAt: new Date(),
    };
  }

  // DistilBART has a ~1024 token input limit — truncate long chats to ~3000 chars
  const truncated =
    chatText.length > 3000 ? chatText.slice(0, 3000) + "..." : chatText;

  try {
    const model = await getSummarizer();
    const result = await model(truncated, {
      max_length: 150,
      min_length: 30,
      do_sample: false,
    });

    return {
      summary: result[0].summary_text,
      messageCount: chats.length,
      generatedAt: new Date(),
    };
  } catch (err) {
    console.error("[AI] Summarization failed:", err.message);
    return {
      summary: "Summary generation failed. Please try again.",
      messageCount: chats.length,
      generatedAt: new Date(),
      error: true,
    };
  }
}

module.exports = { summarizeMeeting, getSummarizer };
