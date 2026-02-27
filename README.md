# 🧠 MCQ Quiz API

A RESTful API for multiple-choice quiz games with random question selection, category & difficulty filtering, and automatic score calculation. Built with Express.js and SQLite.

[![Created by Serkanby](https://img.shields.io/badge/Created%20by-Serkanby-blue?style=flat-square)](https://serkanbayraktar.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Serkanbyx-181717?style=flat-square&logo=github)](https://github.com/Serkanbyx)

## Features

- **Random Question Selection** — Each quiz gets a unique set of randomly shuffled questions using the Fisher-Yates algorithm
- **Category & Difficulty Filtering** — Filter questions by category (general, web, javascript, computer-science, database) and difficulty (easy, medium, hard)
- **Instant Feedback** — Get immediate feedback on each answer with correct/incorrect indication
- **Automatic Score Calculation** — Detailed results with correct/incorrect breakdown and percentage score
- **Question Management** — Full CRUD operations for managing the question bank
- **Interactive API Docs** — Swagger UI documentation with try-it-out functionality
- **Data Integrity** — SQLite transactions, foreign key constraints, and prepared statements for security

## Live Demo

[🎮 View Live API](https://mcq-quiz-api.onrender.com/api)

[📖 View Swagger Docs](https://mcq-quiz-api.onrender.com/api-docs)

> Note: The free Render instance may take ~30 seconds to wake up on the first request.

## Technologies

- **Node.js** — JavaScript runtime environment
- **Express.js** — Fast, minimalist web framework
- **SQLite (better-sqlite3)** — Lightweight, embedded relational database
- **Swagger (swagger-jsdoc + swagger-ui-express)** — Interactive API documentation
- **UUID** — Unique quiz session identifiers
- **CORS** — Cross-origin resource sharing support
- **dotenv** — Environment variable management
- **Nodemon** — Development auto-restart

## Installation

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/Serkanbyx/s3.9_MCQ-Quiz-API.git
cd s3.9_MCQ-Quiz-API
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (optional):

```bash
cp .env.example .env
```

4. Seed the database with sample questions:

```bash
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

6. Or start in production mode:

```bash
npm start
```

The server starts at `http://localhost:3000`.
Swagger docs are available at `http://localhost:3000/api-docs`.

## Usage

1. Start the server and navigate to `/api-docs` for interactive documentation
2. Create a new quiz with `POST /api/quizzes` (optionally filter by category and difficulty)
3. Answer each question using the `quizId` returned from the quiz creation
4. Submit answers one by one with `POST /api/quizzes/:quizId/answer`
5. After answering all questions, view your score with `GET /api/quizzes/:quizId/score`

## How It Works?

### Database Schema

The API uses 4 SQLite tables to manage quiz data:

- **questions** — Stores question text, category, and difficulty level
- **options** — Stores answer options linked to questions with a correct flag
- **quizzes** — Tracks quiz sessions with score, status, and progress
- **quiz_questions** — Maps questions to quizzes with ordering and answer tracking

### Quiz Flow

```
POST /api/quizzes              →  Create quiz, get first question
POST /api/quizzes/:id/answer   →  Submit answer, get next question (repeat)
GET  /api/quizzes/:id/score    →  View final results
```

### Random Selection Algorithm

Questions are shuffled using the **Fisher-Yates algorithm** to ensure true randomness. Options within each question are also randomized so the correct answer position changes every time.

### Score Calculation

```
Score Percentage = (Correct Answers / Total Questions) × 100
```

The final score endpoint returns a detailed breakdown of every question, the selected answer, the correct answer, and whether each response was correct.

## API Endpoints

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | List all questions (supports `category`, `difficulty`, `page`, `limit`) |
| GET | `/api/questions/:id` | Get a single question by ID |
| POST | `/api/questions` | Create a new question with options |
| DELETE | `/api/questions/:id` | Delete a question |

### Quizzes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quizzes` | Start a new quiz session |
| GET | `/api/quizzes/:quizId` | Get quiz status and current question |
| POST | `/api/quizzes/:quizId/answer` | Submit an answer for the current question |
| GET | `/api/quizzes/:quizId/score` | Get final score and detailed results |

### General

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API info and available routes |
| GET | `/api-docs` | Swagger UI interactive documentation |

## Customization

### Add Your Own Questions

Send a `POST` request to `/api/questions` with the following body:

```json
{
  "questionText": "What does HTML stand for?",
  "category": "web",
  "difficulty": "easy",
  "options": [
    { "optionText": "HyperText Markup Language", "isCorrect": true },
    { "optionText": "High Tech Modern Language", "isCorrect": false },
    { "optionText": "Home Tool Markup Language", "isCorrect": false },
    { "optionText": "Hyperlink Text Management Language", "isCorrect": false }
  ]
}
```

### Change Quiz Length

When starting a quiz, specify the number of questions:

```json
{
  "totalQuestions": 10,
  "category": "javascript",
  "difficulty": "hard"
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_PATH` | `./data/quiz.db` | SQLite database file path |

## Features in Detail

### Completed Features

- ✅ RESTful API with Express.js
- ✅ SQLite database with schema migrations
- ✅ Full CRUD for questions
- ✅ Quiz session management with UUID
- ✅ Random question selection (Fisher-Yates)
- ✅ Option shuffling per question
- ✅ Category and difficulty filtering
- ✅ Pagination for question listing
- ✅ Input validation middleware
- ✅ Centralized error handling
- ✅ Swagger API documentation
- ✅ Database seeding with sample questions
- ✅ Render.com deployment ready

### Future Features

- 🔮 [ ] Timed quizzes with countdown
- 🔮 [ ] Leaderboard and user tracking
- 🔮 [ ] Question update (PUT) endpoint
- 🔮 [ ] Quiz history and statistics
- 🔮 [ ] Bulk question import (CSV/JSON)

## Contributing

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feat/amazing-feature`
3. **Commit** your changes: `git commit -m "feat: add amazing feature"`
4. **Push** to the branch: `git push origin feat/amazing-feature`
5. **Open** a Pull Request

### Commit Message Format

- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code refactoring
- `docs:` — Documentation changes
- `chore:` — Maintenance tasks

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Developer

**Serkan Bayraktar**

- 🌐 [serkanbayraktar.com](https://serkanbayraktar.com)
- 🐙 [GitHub @Serkanbyx](https://github.com/Serkanbyx)
- 📧 [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)

## Acknowledgments

- [Express.js](https://expressjs.com/) — Web framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite driver
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express) — API documentation
- [Render](https://render.com/) — Cloud hosting platform

## Contact

- 🐛 [Report a Bug](https://github.com/Serkanbyx/s3.9_MCQ-Quiz-API/issues)
- 📧 [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)
- 🌐 [serkanbayraktar.com](https://serkanbayraktar.com)

---

⭐ If you like this project, don't forget to give it a star!
