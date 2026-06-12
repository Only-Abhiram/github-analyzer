const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

const headers = {
  Accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN && {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
  })
};

const fetchUserProfile = async (username) => {
  const response = await axios.get(`${GITHUB_API}/users/${username}`, { headers });
  return response.data;
};

const fetchUserRepos = async (username) => {
  const response = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
    headers,
    params: {
      per_page: 100,
      sort: 'updated'
    }
  });
  return response.data;
};

const computeInsights = (profile, repos) => {
  // Total stars across all repos
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  // Language frequency count
  const languageMap = {};
  repos.forEach(repo => {
    if (repo.language) {
      languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
    }
  });

  // Sort languages by frequency, keep top 5
  const topLanguages = Object.fromEntries(
    Object.entries(languageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  );

  // Activity score formula:
  // followers * 2 + public_repos * 1.5 + totalStars * 3
  const activityScore = (
    profile.followers * 2 +
    profile.public_repos * 1.5 +
    totalStars * 3
  ).toFixed(2);

  return { totalStars, topLanguages, activityScore };
};

module.exports = { fetchUserProfile, fetchUserRepos, computeInsights };