# GitHub Profile Analyzer API

A backend service built with Node.js and Express that analyzes GitHub user profiles using the GitHub public API and stores useful insights in a MySQL database.

---

## Live Deployment

**Base URL:** https://github-analyzer-pyoe.onrender.com/

> **Note:** The server is hosted on Render's free tier and may take 30-60 seconds to wake up on the first request.

---

## Features

### Required Features
- Fetch public profile data from GitHub using username
- Store useful insights in MySQL (public repos, followers, following, etc.)
- Store analysis results in MySQL database
- API to fetch all stored analyzed profiles
- API to fetch data of a single profile

### Extra Features Added
- **Caching** — if a profile was analyzed within the last 1 hour, returns cached result without hitting GitHub API again (saves API quota)
- **Force Refresh** — `?force=true` query param to bypass cache and force re-analysis
- **Top Languages** — aggregates top 5 programming languages used across all public repos
- **Total Stars** — computes total stars received across all repositories
- **Activity Score** — custom weighted formula: `(followers × 2) + (public_repos × 1.5) + (total_stars × 3)`
- **Pagination** — `GET /profiles` supports `?page` and `?limit` query params
- **GitHub Rate Limit Handling** — graceful error response when GitHub API quota is exceeded
- **404 Handling** — clean error when GitHub username doesn't exist

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Third-Party API:** GitHub REST API v3
- **Libraries:** mysql2, axios, dotenv

---

## 📁 Project Structure

```
github-analyzer/
├── src/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   └── profileController.js   # Request/response logic
│   ├── services/
│   │   └── githubServices.js       # GitHub API calls + insights computation
│   ├── routes/
│   │   └── profileRoutes.js       # Route definitions
│   └── app.js                     # Express app setup
├── schema.sql                     # Database schema
├── .env.example                   # Environment variables template
└── README.md
```

---

## 📦 API Endpoints

### `GET /`
Health check — returns API info and available endpoints.

---

### `POST /api/analyze/:username`
Fetches a GitHub profile, computes insights, and stores in DB.

- Returns cached result if analyzed within last 1 hour
- Use `?force=true` to force re-analysis

**Example:**
```
POST https://github-analyzer-pyoe.onrender.com/api/analyze/only-abhiram
POST https://github-analyzer-pyoe.onrender.com/api/analyze/only-abhiram?force=true
```

**Response:**
```json
{
    "message": "Profile analyzed and stored successfully.",
    "cached": false,
    "user_data": {
        "id": 1,
        "username": "Only-Abhiram",
        "name": "Abhiram",
        "bio": "fixing frictions that cost time and money. ",
        "avatar_url": "https://avatars.githubusercontent.com/u/147290633?v=4",
        "location": null,
        "company": null,
        "blog": "",
        "public_repos": 35,
        "public_gists": 0,
        "followers": 4,
        "following": 3,
        "total_stars": 1,
        "top_languages": {
            "HTML": 6,
            "Python": 1,
            "JavaScript": 22,
            "TypeScript": 4
        },
        "activity_score": 63.5,
        "github_created_at": "...",
        "last_analyzed_at": "...",
        "created_at": "..."
    }
}
```

---

### `GET /api/profiles`
Returns all analyzed profiles with pagination.

**Query Params:**
| Param | Default | Description |
|-------|---------|-------------|
| page  | 1       | Page number |
| limit | 10      | Results per page (max 100) |

**Example:**
```
GET https://github-analyzer-pyoe.onrender.com/api/profiles
GET https://github-analyzer-pyoe.onrender.com/api/profiles?page=2&limit=5
```

**Response:**
```json
{
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "users_data": [...]
}
```

---

### `GET /api/profiles/:username`
Returns stored data for a single analyzed profile.

**Example:**
```
GET https://github-analyzer-pyoe.onrender.com/api/profiles/only-abhiram
```

> Note: This reads from DB only. Use `/api/analyze/:username` first if the profile hasn't been analyzed yet.

---

## 🗄️ Database Schema

```sql
CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200),
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(200),
  company VARCHAR(200),
  blog VARCHAR(300),
  public_repos INT DEFAULT 0,
  public_gists INT DEFAULT 0,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  total_stars INT DEFAULT 0,
  top_languages JSON,
  activity_score FLOAT DEFAULT 0,
  github_created_at DATETIME,
  last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL v8+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Only-Abhiram/github-analyzer.git
cd github-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup the database

Open MySQL command line and run:

```sql
CREATE DATABASE github_analyzer;
USE github_analyzer;

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200),
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(200),
  company VARCHAR(200),
  blog VARCHAR(300),
  public_repos INT DEFAULT 0,
  public_gists INT DEFAULT 0,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  total_stars INT DEFAULT 0,
  top_languages JSON,
  activity_score FLOAT DEFAULT 0,
  github_created_at DATETIME,
  last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer
GITHUB_TOKEN=your_github_token (optional)
```

> `GITHUB_TOKEN` is optional but recommended. Without it, GitHub limits you to 60 requests/hour. Get one at: github.com → Settings → Developer Settings → Personal Access Tokens

### 5. Run the server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`

---

## 🧪 Testing with Postman

### Postman Collection
> https://www.postman.com/universal-rocket-302694/workspace/educase-assginment/collection/40887651-2bf37a3b-b3c5-4f15-ac33-9180bf0561a9?action=share&source=copy-link&creator=40887651

### Quick Test Sequence
1. `GET /` — verify server is running
2. `POST /api/analyze/username` — analyze a profile  
3. `POST /api/analyze/username` — should return `cached: true`
4. `POST /api/analyze/username?force=true` — force refresh
5. `GET /api/profiles` — list all profiles
6. `GET /api/profiles/username` — get single profile
7. `POST /api/analyze/invaliduser99999` — should return 404 (if username is invalid)
Note: replace "username" with actual username
---

## 📊 Activity Score Formula

```
activity_score = (followers × 2) + (public_repos × 1.5) + (total_stars × 3)
```

Higher score = more active and influential GitHub profile.

---

## 🔗 Repository

https://github.com/Only-Abhiram/github-analyzer