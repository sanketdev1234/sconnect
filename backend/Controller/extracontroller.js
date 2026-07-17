const profile=require("../model/profile");
const connection=require("../model/connections");
const post=require("../model/post");
const { generateEmbedding, buildProfileText, cosineSimilarity } = require("../Utilities/aiEmbeddings");

// ─── Semantic People Search ─────────────────────────────────────────────────
// Uses all-MiniLM-L6-v2 sentence-transformer embeddings for semantic matching.
// Falls back to regex search for profiles that don't have embeddings yet.
// ─────────────────────────────────────────────────────────────────────────────
module.exports.search_by_profile = async (req, res) => {
  const { query } = req.query;

  if (!query || !query.trim()) {
    return res.status(400).json({ results: [], message: "Search query is required" });
  }

  try {
    // 1. Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Fetch all profiles that HAVE embeddings (for semantic search)
    //    select('+embedding') overrides the `select: false` in schema
    const profilesWithEmbeddings = await profile
      .find({ embedding: { $ne: null, $exists: true, $not: { $size: 0 } } })
      .select("+embedding")
      .populate("owner");

    // 3. Fetch profiles WITHOUT embeddings (for regex fallback)
    const profilesWithoutEmbeddings = await profile
      .find({ $or: [{ embedding: null }, { embedding: { $exists: false } }, { embedding: { $size: 0 } }] })
      .populate("owner");

    let results = [];

    // 4. Semantic search — cosine similarity ranking
    if (queryEmbedding && profilesWithEmbeddings.length > 0) {
      const scored = profilesWithEmbeddings.map((p) => {
        const similarity = cosineSimilarity(queryEmbedding, p.embedding);
        // Convert to a plain object so we can add the score
        const profileObj = p.toObject();
        delete profileObj.embedding; // Don't send the 384-dim array to frontend
        return {
          ...profileObj,
          similarityScore: Math.round(similarity * 100) / 100, // 2 decimal places
          searchMethod: "semantic",
        };
      });

      // Filter: only include results with similarity > 0.15 (weak threshold)
      results = scored
        .filter((p) => p.similarityScore > 0.15)
        .sort((a, b) => b.similarityScore - a.similarityScore);
    }

    // 5. Regex fallback — for profiles without embeddings
    if (profilesWithoutEmbeddings.length > 0) {
      const regex = new RegExp(query, "i");
      const regexMatches = profilesWithoutEmbeddings
        .filter(
          (p) =>
            regex.test(p.headline || "") ||
            regex.test(p.bio || "") ||
            regex.test(p.location || "")
        )
        .map((p) => ({
          ...p.toObject(),
          similarityScore: null,
          searchMethod: "keyword",
        }));

      results = [...results, ...regexMatches];
    }

    res.status(200).json({
      results,
      totalResults: results.length,
      searchMethod: queryEmbedding ? "semantic" : "keyword-only",
      status: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// ─── Embed All Existing Profiles ────────────────────────────────────────────
// One-time utility to generate embeddings for profiles that don't have them.
// Called via POST /features/embed-all
// ─────────────────────────────────────────────────────────────────────────────
module.exports.embedAllProfiles = async (req, res) => {
  try {
    const profilesToEmbed = await profile
      .find({ $or: [{ embedding: null }, { embedding: { $exists: false } }, { embedding: { $size: 0 } }] })
      .populate("owner");

    if (profilesToEmbed.length === 0) {
      return res.status(200).json({ message: "All profiles already have embeddings", count: 0 });
    }

    let embeddedCount = 0;

    for (const p of profilesToEmbed) {
      const profileText = buildProfileText(p, p.owner);
      const embeddingVector = await generateEmbedding(profileText);

      if (embeddingVector) {
        await profile.findByIdAndUpdate(p._id, { embedding: embeddingVector });
        embeddedCount++;
        console.log(`[AI] Embedded profile ${embeddedCount}/${profilesToEmbed.length}: ${p.owner?.display_name || p._id}`);
      }
    }

    res.status(200).json({
      message: `Embeddings generated for ${embeddedCount} profile(s)`,
      count: embeddedCount,
      total: profilesToEmbed.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// ─── Connection Suggestions (Fixed) ─────────────────────────────────────────
// Uses embedding similarity to find people similar to the current user.
// Falls back to structured matching if no embedding exists.
// ─────────────────────────────────────────────────────────────────────────────
module.exports.suggestions = async (req, res) => {
  const userid = req.user._id;
  try {
    // 1. Get IDs to exclude (already connected + self)
    const excluded_connections = await connection.find({
      $or: [{ sender: userid }, { receiver: userid }],
    });
    const excludedIds = excluded_connections.map((conn) =>
      conn.sender.toString() === userid.toString() ? conn.receiver : conn.sender
    );
    excludedIds.push(userid);

    // 2. Get current user's profile with embedding
    const user_profile = await profile
      .findOne({ owner: userid })
      .select("+embedding")
      .populate("owner");

    if (!user_profile) {
      return res.status(400).json({
        message: "Create a profile first to get suggestions",
        suggestions: [],
      });
    }

    // 3. Get candidate profiles (not connected, not self)
    const candidates = await profile
      .find({ owner: { $nin: excludedIds } })
      .select("+embedding")
      .populate("owner");

    if (!candidates || candidates.length === 0) {
      return res.status(200).json({
        message: "No suggestions available right now",
        suggestions: [],
      });
    }

    // 4. Score candidates using embedding similarity
    let scored;
    if (user_profile.embedding && user_profile.embedding.length > 0) {
      scored = candidates
        .map((c) => {
          const similarity =
            c.embedding && c.embedding.length > 0
              ? cosineSimilarity(user_profile.embedding, c.embedding)
              : 0;
          const profileObj = c.toObject();
          delete profileObj.embedding;
          return { ...profileObj, similarityScore: Math.round(similarity * 100) / 100 };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 10); // Top 10
    } else {
      // No embedding — return candidates without scoring
      scored = candidates.slice(0, 10).map((c) => {
        const profileObj = c.toObject();
        delete profileObj.embedding;
        return { ...profileObj, similarityScore: null };
      });
    }

    res.status(200).json({
      message: "Suggestions fetched",
      suggestions: scored,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};


module.exports.get_personalized_feed = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get IDs of all accepted connections
        const friendsDocs = await connection.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: "accepted"
        });

        // 2. Create an array of IDs (Friends + Yourself)
        const followedIds = friendsDocs.map(conn => 
            conn.sender.toString() === userId.toString() ? conn.receiver : conn.sender
        );
        followedIds.push(userId); 

        // 3. Find posts from anyone in that list
        const feed = await post.find({ owner: { $in: followedIds } })
            .sort({ createdAt: -1 }) // Newest first
            .populate("owner")
            .populate({
                path: "comments",
                populate: { path: "Author" }
            });

        res.status(200).json(feed);
    } catch (err) {
        res.status(500).send(err.message);
    }
};