const { pool } = require('../config/db');
const { fetchUserProfile, fetchUserRepos, computeInsights } = require('../services/githubServices');

// POST /analyze/:username
const analyzeProfile = async (req, res) => {
  const { username } = req.params;
  const forceRefresh = req.query.force === 'true';

  try {
    // Check if profile exists and was analyzed recently (within 1 hour)
    const [existing] = await pool.query(
      'SELECT * FROM profiles WHERE username = ?',
      [username]
    );

    if (existing.length > 0 && !forceRefresh) {
      const lastAnalyzed = new Date(existing[0].last_analyzed_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (lastAnalyzed > oneHourAgo) {
        return res.json({
          message: 'Returning cached result. Use ?force=true to refresh.',
          cached: true,
          user_data: existing[0]
        });
      }
    }

    // Fetch from GitHub
    const profile = await fetchUserProfile(username);
    const repos = await fetchUserRepos(username);
    const { totalStars, topLanguages, activityScore } = computeInsights(profile, repos);

    // Upsert into MySQL (insert or update if exists)
    await pool.query(
      `INSERT INTO profiles 
        (username, name, bio, avatar_url, location, company, blog,
         public_repos, public_gists, followers, following,
         total_stars, top_languages, activity_score, github_created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        bio = VALUES(bio),
        avatar_url = VALUES(avatar_url),
        location = VALUES(location),
        company = VALUES(company),
        blog = VALUES(blog),
        public_repos = VALUES(public_repos),
        public_gists = VALUES(public_gists),
        followers = VALUES(followers),
        following = VALUES(following),
        total_stars = VALUES(total_stars),
        top_languages = VALUES(top_languages),
        activity_score = VALUES(activity_score),
        github_created_at = VALUES(github_created_at)`,
      [
        profile.login,
        profile.name,
        profile.bio,
        profile.avatar_url,
        profile.location,
        profile.company,
        profile.blog,
        profile.public_repos,
        profile.public_gists,
        profile.followers,
        profile.following,
        totalStars,
        JSON.stringify(topLanguages),
        activityScore,
        new Date(profile.created_at)
      ]
    );

    // Fetch and return the saved record
    const [saved] = await pool.query(
      'SELECT * FROM profiles WHERE username = ?',
      [username]
    );

    return res.status(201).json({
      message: 'Profile analyzed and stored successfully.',
      cached: false,
      user_data: saved[0]
    });

  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: `GitHub user '${username}' not found.` });
    }
    if (error.response?.status === 403) {
      return res.status(429).json({ error: 'GitHub API rate limit exceeded. Try again later.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /profiles
const getAllProfiles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const [profiles] = await pool.query(
      'SELECT * FROM profiles ORDER BY last_analyzed_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM profiles');

    return res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users_data: profiles
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /profiles/:username
const getProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const [profiles] = await pool.query(
      'SELECT * FROM profiles WHERE username = ?',
      [username]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: `Profile '${username}' not found. Analyze it first.` });
    }

    return res.json({ user_data: profiles[0] });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { analyzeProfile, getAllProfiles, getProfile };