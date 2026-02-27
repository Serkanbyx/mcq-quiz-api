# MCQ Quiz API

A RESTful API for multiple-choice quiz games with random question selection and automatic score calculation. Built with Express.js and SQLite.

## Features

- **Start Quiz** — Begin a new quiz with randomly selected questions. Filter by category and difficulty.
- **Submit Answers** — Answer questions one by one and get instant feedback.
- **Score Calculation** — View detailed results with correct/incorrect breakdown and percentage score.
- **Question Management** — Full CRUD for managing the question bank.
- **Swagger Docs** — Interactive API documentation at `/api-docs`.

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Docs:** Swagger (swagger-jsdoc + swagger-ui-express)
- **Deploy:** Render

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <repo-url>
cd s3.9_MCQ-Quiz-API
npm install
```

### Seed the Database

```bash
npm run seed
```

### Run in Development

```bash
npm run dev
```

### Run in Production

```bash
npm start
```

The server starts at `http://localhost:3000`.  
Swagger docs are available at `http://localhost:3000/api-docs`.

## API Endpoints

| Method | Endpoint                      | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/api`                        | API info and available routes   |
| GET    | `/api/questions`              | List all questions (paginated)  |
| GET    | `/api/questions/:id`          | Get a single question           |
| POST   | `/api/questions`              | Create a new question           |
| DELETE | `/api/questions/:id`          | Delete a question               |
| POST   | `/api/quizzes`                | Start a new quiz                |
| GET    | `/api/quizzes/:quizId`        | Get quiz status & current question |
| POST   | `/api/quizzes/:quizId/answer` | Submit an answer                |
| GET    | `/api/quizzes/:quizId/score`  | Get final score & results       |

## Quiz Flow

1. **POST** `/api/quizzes` — Start a quiz (optional: `totalQuestions`, `category`, `difficulty`)
2. **POST** `/api/quizzes/:quizId/answer` — Submit `{ "optionId": 3 }` for each question
3. **GET** `/api/quizzes/:quizId/score` — View results after all questions are answered

## Environment Variables

| Variable   | Default           | Description          |
|------------|-------------------|----------------------|
| `PORT`     | `3000`            | Server port          |
| `NODE_ENV` | `development`     | Environment mode     |
| `DB_PATH`  | `./data/quiz.db`  | SQLite database path |

## Deploy to Render

1. Push this repo to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and configure the service
5. Add a **Disk** for persistent SQLite storage

## License

ISC
