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

// ─── AI Connection Recommendations (Multi-Signal + Embeddings) ──────────────
// Combines 5 scoring signals to recommend connections:
//   1. Mutual connections (graph analysis)     → weight: 0.30
//   2. Same company (current/past)             → weight: 0.25
//   3. Same school/university                  → weight: 0.20
//   4. Same location                           → weight: 0.10
//   5. Profile embedding similarity (AI)       → weight: 0.15
// Each recommendation includes human-readable "reasons" explaining WHY.
// ─────────────────────────────────────────────────────────────────────────────

// Signal weights — tunable for experimentation
const WEIGHTS = {
  mutualConnections: 0.30,
  sameCompany: 0.25,
  sameSchool: 0.20,
  sameLocation: 0.10,
  profileSimilarity: 0.15,
};

module.exports.suggestions = async (req, res) => {
  const userid = req.user._id;
  try {
    // ── Step 1: Get all connections involving the current user ──────────────
    const allUserConnections = await connection.find({
      $or: [{ sender: userid }, { receiver: userid }],
    });

    // IDs of people already connected (any status) — to exclude from suggestions
    const excludedIds = allUserConnections.map((conn) =>
      conn.sender.toString() === userid.toString() ? conn.receiver : conn.sender
    );
    excludedIds.push(userid);

    // IDs of ACCEPTED connections only — needed for mutual connection analysis
    const acceptedFriendIds = allUserConnections
      .filter((conn) => conn.status === "accepted")
      .map((conn) =>
        conn.sender.toString() === userid.toString() ? conn.receiver : conn.sender
      );

    // ── Step 2: Get current user's profile ──────────────────────────────────
    const user_profile = await profile
      .findOne({ owner: userid })
      .select("+embedding")
      .populate("owner");

    if (!user_profile) {
      return res.status(400).json({
        message: "Create a profile first to get recommendations",
        suggestions: [],
      });
    }

    // Extract user's structured data for matching
    const userSchools = (user_profile.Education || []).map((e) => e.school?.toLowerCase()).filter(Boolean);
    const userCompanies = (user_profile.Experience || []).map((e) => e.company?.toLowerCase()).filter(Boolean);
    const userLocation = user_profile.location?.toLowerCase() || "";

    // ── Step 3: Get candidate profiles ──────────────────────────────────────
    const candidates = await profile
      .find({ owner: { $nin: excludedIds } })
      .select("+embedding")
      .populate("owner");

    if (!candidates || candidates.length === 0) {
      return res.status(200).json({
        message: "No recommendations available right now",
        suggestions: [],
      });
    }

    // ── Step 4: Get mutual connection data (batch) ──────────────────────────
    // For each candidate, find how many of MY friends are also THEIR friends
    const candidateOwnerIds = candidates.map((c) => c.owner._id || c.owner);

    // Fetch all connections of all candidates in ONE query (efficient)
    const candidateConnections = await connection.find({
      status: "accepted",
      $or: [
        { sender: { $in: candidateOwnerIds } },
        { receiver: { $in: candidateOwnerIds } },
      ],
    });

    // Build a map: candidateOwnerId → Set of their friend IDs
    const candidateFriendsMap = {};
    for (const conn of candidateConnections) {
      const s = conn.sender.toString();
      const r = conn.receiver.toString();
      if (!candidateFriendsMap[s]) candidateFriendsMap[s] = new Set();
      if (!candidateFriendsMap[r]) candidateFriendsMap[r] = new Set();
      candidateFriendsMap[s].add(r);
      candidateFriendsMap[r].add(s);
    }

    // ── Step 5: Score each candidate ────────────────────────────────────────
    const scored = candidates.map((candidate) => {
      const candidateOwnerId = (candidate.owner._id || candidate.owner).toString();
      const reasons = []; // Human-readable reasons for this recommendation
      const signals = {}; // Raw signal scores for transparency

      // ── Signal 1: Mutual Connections (weight: 0.30) ──
      const candidateFriends = candidateFriendsMap[candidateOwnerId] || new Set();
      const mutualFriendIds = acceptedFriendIds.filter((fid) =>
        candidateFriends.has(fid.toString())
      );
      const mutualCount = mutualFriendIds.length;
      // Normalize: cap at 10 mutual connections = max score
      const mutualScore = Math.min(mutualCount / 5, 1);
      signals.mutualConnections = { count: mutualCount, score: mutualScore };

      if (mutualCount > 0) {
        reasons.push(`${mutualCount} mutual connection${mutualCount > 1 ? "s" : ""}`);
      }

      // ── Signal 2: Same Company (weight: 0.25) ──
      const candidateCompanies = (candidate.Experience || [])
        .map((e) => e.company?.toLowerCase())
        .filter(Boolean);
      const sharedCompanies = userCompanies.filter((uc) =>
        candidateCompanies.some((cc) => cc.includes(uc) || uc.includes(cc))
      );
      const companyScore = sharedCompanies.length > 0 ? 1 : 0;
      signals.sameCompany = { matches: sharedCompanies, score: companyScore };

      if (sharedCompanies.length > 0) {
        // Capitalize for display
        const displayName = sharedCompanies[0].charAt(0).toUpperCase() + sharedCompanies[0].slice(1);
        reasons.push(`Both worked at ${displayName}`);
      }

      // ── Signal 3: Same School (weight: 0.20) ──
      const candidateSchools = (candidate.Education || [])
        .map((e) => e.school?.toLowerCase())
        .filter(Boolean);
      const sharedSchools = userSchools.filter((us) =>
        candidateSchools.some((cs) => cs.includes(us) || us.includes(cs))
      );
      const schoolScore = sharedSchools.length > 0 ? 1 : 0;
      signals.sameSchool = { matches: sharedSchools, score: schoolScore };

      if (sharedSchools.length > 0) {
        const displayName = sharedSchools[0].charAt(0).toUpperCase() + sharedSchools[0].slice(1);
        reasons.push(`Both studied at ${displayName}`);
      }

      // ── Signal 4: Same Location (weight: 0.10) ──
      const candidateLocation = candidate.location?.toLowerCase() || "";
      const locationMatch =
        userLocation &&
        candidateLocation &&
        (candidateLocation.includes(userLocation) || userLocation.includes(candidateLocation));
      const locationScore = locationMatch ? 1 : 0;
      signals.sameLocation = { match: locationMatch, score: locationScore };

      if (locationMatch) {
        reasons.push(`Both in ${candidate.location}`);
      }

      // ── Signal 5: Profile Embedding Similarity (weight: 0.15) ──
      let embeddingSimilarity = 0;
      if (
        user_profile.embedding &&
        user_profile.embedding.length > 0 &&
        candidate.embedding &&
        candidate.embedding.length > 0
      ) {
        embeddingSimilarity = cosineSimilarity(user_profile.embedding, candidate.embedding);
      }
      signals.profileSimilarity = { score: Math.round(embeddingSimilarity * 100) / 100 };

      if (embeddingSimilarity > 0.4) {
        reasons.push("Similar professional profile");
      }

      // ── Compute final weighted score ──
      const finalScore =
        WEIGHTS.mutualConnections * mutualScore +
        WEIGHTS.sameCompany * companyScore +
        WEIGHTS.sameSchool * schoolScore +
        WEIGHTS.sameLocation * locationScore +
        WEIGHTS.profileSimilarity * embeddingSimilarity;

      // Build clean output object (strip embedding array)
      const profileObj = candidate.toObject();
      delete profileObj.embedding;

      return {
        ...profileObj,
        recommendationScore: Math.round(finalScore * 100) / 100,
        reasons,
        signals,
      };
    });

    // Sort by recommendation score (highest first) and take top 15
    const topRecommendations = scored
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .filter((s) => s.recommendationScore > 0 || s.reasons.length > 0)
      .slice(0, 15);

    res.status(200).json({
      message: "Recommendations generated",
      suggestions: topRecommendations,
      totalCandidates: candidates.length,
      weights: WEIGHTS,
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