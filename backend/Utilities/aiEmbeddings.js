// Utilities/aiEmbeddings.js
// ─── Semantic Embedding Generator ───────────────────────────────────────────
// Uses Transformers.js to run all-MiniLM-L6-v2 locally (no API calls, no cost).
// Model: Xenova/all-MiniLM-L6-v2 (~80MB, downloaded & cached on first use)
// Produces 384-dimensional dense vectors for semantic similarity search.
// ─────────────────────────────────────────────────────────────────────────────

let embedder = null;
let isLoading = false;

/**
 * Lazy-load the feature-extraction (embedding) pipeline (singleton pattern).
 * First call downloads + loads the model (~10s), subsequent calls are instant.
 * Runs 100% locally via ONNX Runtime — zero API calls.
 */
async function getEmbedder() {
  if (embedder) return embedder;

  if (isLoading) {
    // Another call is already loading — wait for it to finish
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return embedder;
  }

  isLoading = true;
  try {
    const { pipeline } = await import("@huggingface/transformers");
    console.log("[AI] Loading embedding model (first time takes ~10s)...");
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("[AI] Embedding model loaded successfully!");
    return embedder;
  } catch (err) {
    console.error("[AI] Failed to load embedding model:", err.message);
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Generate a 384-dimensional embedding vector for the given text.
 * Uses mean pooling + L2 normalization (standard for sentence-transformers).
 *
 * @param {string} text - The text to embed
 * @returns {number[]} 384-dimensional float array
 */
async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    return null;
  }

  try {
    const model = await getEmbedder();
    const output = await model(text, {
      pooling: "mean",
      normalize: true,
    });

    // output.data is a Float32Array — convert to plain Array for MongoDB storage
    return Array.from(output.data);
  } catch (err) {
    console.error("[AI] Embedding generation failed:", err.message);
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
  getEmbedder,
};
