// Utilities/aiSummarizer.js
// ─── AI Meeting Summarizer ──────────────────────────────────────────────────
// Production: Uses Hugging Face Inference API (free, 1000 req/day)
// Development: Uses Transformers.js local pipeline (runs on your machine)
// Model: distilbart-cnn-6-6 (same model, both modes)
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production";
const HF_API_TOKEN = process.env.HF_API_TOKEN || "";
const HF_SUMMARIZATION_URL =
  "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-6-6";

// ─── Local pipeline (Development only) ─────────────────────────────────────
let summarizer = null;
let isLoading = false;

async function getLocalSummarizer() {
  if (summarizer) return summarizer;

  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return summarizer;
  }

  isLoading = true;
  try {
    const { pipeline } = await import("@huggingface/transformers");
    console.log("[AI] Loading local summarization model (first time takes ~20s)...");
    summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-6-6");
    console.log("[AI] Local summarization model loaded successfully!");
    return summarizer;
  } catch (err) {
    console.error("[AI] Failed to load local summarization model:", err.message);
    throw err;
  } finally {
    isLoading = false;
  }
}

// ─── HF Inference API (Production) ─────────────────────────────────────────
async function summarizeViaAPI(text) {
  const response = await fetch(HF_SUMMARIZATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        max_length: 150,
        min_length: 30,
        do_sample: false,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HF API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();

  // HF API returns: [{ summary_text: "..." }]
  if (Array.isArray(result) && result[0]?.summary_text) {
    return result[0].summary_text;
  }

  throw new Error("Unexpected HF API response format");
}

// ─── Local pipeline inference (Development) ─────────────────────────────────
async function summarizeLocally(text) {
  const model = await getLocalSummarizer();
  const result = await model(text, {
    max_length: 150,
    min_length: 30,
    do_sample: false,
  });
  return result[0].summary_text;
}

// ─── Main function ──────────────────────────────────────────────────────────

/**
 * Summarize meeting chat messages.
 * Production → HF Inference API | Development → local Transformers.js
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
    let summaryText;

    if (isProduction) {
      console.log("[AI] Summarizing via HF Inference API...");
      summaryText = await summarizeViaAPI(truncated);
      console.log("[AI] HF API summarization complete.");
    } else {
      console.log("[AI] Summarizing via local Transformers.js pipeline...");
      summaryText = await summarizeLocally(truncated);
      console.log("[AI] Local summarization complete.");
    }

    return {
      summary: summaryText,
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

module.exports = { summarizeMeeting, getSummarizer: getLocalSummarizer };
