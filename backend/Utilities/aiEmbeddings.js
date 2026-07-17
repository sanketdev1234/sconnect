// Utilities/aiEmbeddings.js
// ─── Semantic Embedding Generator ───────────────────────────────────────────
// Production: Uses Hugging Face Inference API (free, 1000 req/day)
// Development: Uses Transformers.js local pipeline (runs on your machine)
// Model: all-MiniLM-L6-v2 (384-dim sentence embeddings, same model both modes)
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production";
const HF_API_TOKEN = process.env.HF_TOKEN || process.env.HF_API_TOKEN || "";
const HF_EMBEDDING_URL =
   "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2";

// ─── Local pipeline (Development only) ─────────────────────────────────────
let embedder = null;
let isLoading = false;

async function getLocalEmbedder() {
  if (embedder) return embedder;

  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return embedder;
  }

  isLoading = true;
  try {
    const { pipeline } = await import("@huggingface/transformers");
    console.log("[AI] Loading local embedding model (first time takes ~10s)...");
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("[AI] Local embedding model loaded successfully!");
    return embedder;
  } catch (err) {
    console.error("[AI] Failed to load local embedding model:", err.message);
    throw err;
  } finally {
    isLoading = false;
  }
}

// ─── HF Inference API (Production) ─────────────────────────────────────────
async function embedViaAPI(text) {
  const response = await fetch(HF_EMBEDDING_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      "Content-Type": "application/json",
      "x-wait-for-model": "true",  // Wait for model cold start
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HF API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();

  // HF returns token-level embeddings: [[token1_384d], [token2_384d], ...]
  // We need to mean-pool them into a single 384-dim vector
  if (Array.isArray(result) && Array.isArray(result[0])) {
    // If result is 2D array (tokens × dims), mean pool across tokens
    if (Array.isArray(result[0][0])) {
      // Shape: [1, num_tokens, 384] — squeeze first dim, then mean pool
      const tokens = result[0];
      const dims = tokens[0].length;
      const meanVec = new Array(dims).fill(0);
      for (const token of tokens) {
        for (let i = 0; i < dims; i++) {
          meanVec[i] += token[i];
        }
      }
      for (let i = 0; i < dims; i++) {
        meanVec[i] /= tokens.length;
      }
      // L2 normalize
      const norm = Math.sqrt(meanVec.reduce((sum, v) => sum + v * v, 0));
      if (norm > 0) {
        for (let i = 0; i < dims; i++) {
          meanVec[i] /= norm;
        }
      }
      return meanVec;
    }
    // Shape: [384] — already a single vector (sentence-transformers pipeline)
    return result[0];
  }

  throw new Error("Unexpected HF API embedding response format");
}

// ─── Local embedding (Development) ──────────────────────────────────────────
async function embedLocally(text) {
  const model = await getLocalEmbedder();
  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
}

// ─── Main function ──────────────────────────────────────────────────────────

/**
 * Generate a 384-dimensional embedding vector for the given text.
 * Production → HF Inference API | Development → local Transformers.js
 *
 * @param {string} text - The text to embed
 * @returns {number[]} 384-dimensional float array
 */
async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    console.log("[AI] Skipping embedding — empty text");
    return null;
  }

  try {
    if (isProduction) {
      console.log(`[AI] Generating embedding via HF API (token: ${HF_API_TOKEN ? "present" : "MISSING"})...`);
      console.log(`[AI] Text preview: "${text.substring(0, 80)}..."`);
      const embedding = await embedViaAPI(text);
      console.log(`[AI] Embedding generated successfully (${embedding.length} dims)`);
      return embedding;
    } else {
      const embedding = await embedLocally(text);
      return embedding;
    }
  } catch (err) {
    console.error("[AI] Embedding generation FAILED:", err.message);
    console.error("[AI] Full error:", err);
    return null;
  }
}

/**
 * Build a rich text representation of a profile for embedding.
 * Combines all relevant fields into a single string that captures the person's identity.
 *
 * @param {Object} profileDoc - Mongoose profile document (populated or not)
 * @param {Object} ownerDoc - The user document (for name)
 * @returns {string} Combined text for embedding
 */
function buildProfileText(profileDoc, ownerDoc = null) {
  const parts = [];

  if (ownerDoc?.full_name) parts.push(ownerDoc.full_name);
  if (ownerDoc?.display_name) parts.push(ownerDoc.display_name);
  if (profileDoc.headline) parts.push(profileDoc.headline);
  if (profileDoc.bio) parts.push(profileDoc.bio);
  if (profileDoc.location) parts.push(profileDoc.location);

  // Education: school names, degrees, fields
  if (profileDoc.Education && profileDoc.Education.length > 0) {
    profileDoc.Education.forEach((edu) => {
      if (edu.school) parts.push(edu.school);
      if (edu.degree) parts.push(edu.degree);
      if (edu.field_of_study) parts.push(edu.field_of_study);
    });
  }

  // Experience: company names, titles, locations
  if (profileDoc.Experience && profileDoc.Experience.length > 0) {
    profileDoc.Experience.forEach((exp) => {
      if (exp.company) parts.push(exp.company);
      if (exp.title) parts.push(exp.title);
      if (exp.location) parts.push(exp.location);
    });
  }

  return parts.filter(Boolean).join(". ");
}

/**
 * Compute cosine similarity between two vectors.
 * Both vectors must be the same length (384 for MiniLM).
 * Returns a value between -1 (opposite) and 1 (identical).
 *
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

module.exports = {
  generateEmbedding,
  buildProfileText,
  cosineSimilarity,
  getEmbedder: getLocalEmbedder,
};
