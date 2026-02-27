require("dotenv").config();
const { getConnection, closeConnection } = require("./connection");
const { initializeDatabase } = require("./schema");

const seedQuestions = [
  {
    question_text: "What does HTML stand for?",
    category: "web",
    difficulty: "easy",
    options: [
      { option_text: "Hyper Text Markup Language", is_correct: 1 },
      { option_text: "High Tech Modern Language", is_correct: 0 },
      { option_text: "Hyper Transfer Markup Language", is_correct: 0 },
      { option_text: "Home Tool Markup Language", is_correct: 0 },
    ],
  },
  {
    question_text: "Which language is used for styling web pages?",
    category: "web",
    difficulty: "easy",
    options: [
      { option_text: "HTML", is_correct: 0 },
      { option_text: "CSS", is_correct: 1 },
      { option_text: "Python", is_correct: 0 },
      { option_text: "Java", is_correct: 0 },
    ],
  },
  {
    question_text: "What does CSS stand for?",
    category: "web",
    difficulty: "easy",
    options: [
      { option_text: "Cascading Style Sheets", is_correct: 1 },
      { option_text: "Creative Style System", is_correct: 0 },
      { option_text: "Computer Style Sheets", is_correct: 0 },
      { option_text: "Colorful Style Sheets", is_correct: 0 },
    ],
  },
  {
    question_text: "Which data structure uses FIFO (First In, First Out)?",
    category: "computer-science",
    difficulty: "medium",
    options: [
      { option_text: "Stack", is_correct: 0 },
      { option_text: "Queue", is_correct: 1 },
      { option_text: "Tree", is_correct: 0 },
      { option_text: "Graph", is_correct: 0 },
    ],
  },
  {
    question_text: "What is the time complexity of binary search?",
    category: "computer-science",
    difficulty: "medium",
    options: [
      { option_text: "O(n)", is_correct: 0 },
      { option_text: "O(n log n)", is_correct: 0 },
      { option_text: "O(log n)", is_correct: 1 },
      { option_text: "O(1)", is_correct: 0 },
    ],
  },
  {
    question_text: "Which keyword is used to declare a constant in JavaScript?",
    category: "javascript",
    difficulty: "easy",
    options: [
      { option_text: "var", is_correct: 0 },
      { option_text: "let", is_correct: 0 },
      { option_text: "const", is_correct: 1 },
      { option_text: "static", is_correct: 0 },
    ],
  },
  {
    question_text: "What does the 'typeof' operator return for an array in JavaScript?",
    category: "javascript",
    difficulty: "medium",
    options: [
      { option_text: "array", is_correct: 0 },
      { option_text: "object", is_correct: 1 },
      { option_text: "list", is_correct: 0 },
      { option_text: "undefined", is_correct: 0 },
    ],
  },
  {
    question_text: "Which method converts a JSON string to a JavaScript object?",
    category: "javascript",
    difficulty: "easy",
    options: [
      { option_text: "JSON.stringify()", is_correct: 0 },
      { option_text: "JSON.parse()", is_correct: 1 },
      { option_text: "JSON.toObject()", is_correct: 0 },
      { option_text: "JSON.convert()", is_correct: 0 },
    ],
  },
  {
    question_text: "What is a closure in JavaScript?",
    category: "javascript",
    difficulty: "hard",
    options: [
      {
        option_text: "A function that has access to its outer function's scope",
        is_correct: 1,
      },
      { option_text: "A way to close a browser window", is_correct: 0 },
      { option_text: "A method to end a loop", is_correct: 0 },
      { option_text: "A type of variable declaration", is_correct: 0 },
    ],
  },
  {
    question_text: "Which HTTP method is typically used to update a resource?",
    category: "web",
    difficulty: "medium",
    options: [
      { option_text: "GET", is_correct: 0 },
      { option_text: "POST", is_correct: 0 },
      { option_text: "PUT", is_correct: 1 },
      { option_text: "DELETE", is_correct: 0 },
    ],
  },
  {
    question_text: "What does REST stand for?",
    category: "web",
    difficulty: "medium",
    options: [
      { option_text: "Representational State Transfer", is_correct: 1 },
      { option_text: "Remote Execution Service Technology", is_correct: 0 },
      { option_text: "Rapid Enterprise Software Testing", is_correct: 0 },
      { option_text: "Resource State Transformation", is_correct: 0 },
    ],
  },
  {
    question_text: "Which SQL keyword is used to retrieve data from a database?",
    category: "database",
    difficulty: "easy",
    options: [
      { option_text: "GET", is_correct: 0 },
      { option_text: "FETCH", is_correct: 0 },
      { option_text: "SELECT", is_correct: 1 },
      { option_text: "RETRIEVE", is_correct: 0 },
    ],
  },
  {
    question_text: "What is the default port for HTTP?",
    category: "web",
    difficulty: "easy",
    options: [
      { option_text: "443", is_correct: 0 },
      { option_text: "8080", is_correct: 0 },
      { option_text: "80", is_correct: 1 },
      { option_text: "3000", is_correct: 0 },
    ],
  },
  {
    question_text: "Which of these is NOT a JavaScript framework?",
    category: "javascript",
    difficulty: "medium",
    options: [
      { option_text: "React", is_correct: 0 },
      { option_text: "Angular", is_correct: 0 },
      { option_text: "Django", is_correct: 1 },
      { option_text: "Vue", is_correct: 0 },
    ],
  },
  {
    question_text: "What does the 'this' keyword refer to in a regular function?",
    category: "javascript",
    difficulty: "hard",
    options: [
      { option_text: "The function itself", is_correct: 0 },
      { option_text: "The global object or the calling context", is_correct: 1 },
      { option_text: "The parent function", is_correct: 0 },
      { option_text: "Always undefined", is_correct: 0 },
    ],
  },
  {
    question_text: "Which protocol is used for secure communication over the internet?",
    category: "web",
    difficulty: "easy",
    options: [
      { option_text: "HTTP", is_correct: 0 },
      { option_text: "FTP", is_correct: 0 },
      { option_text: "HTTPS", is_correct: 1 },
      { option_text: "SMTP", is_correct: 0 },
    ],
  },
  {
    question_text: "What is Big O notation used for?",
    category: "computer-science",
    difficulty: "medium",
    options: [
      { option_text: "Describing code syntax", is_correct: 0 },
      { option_text: "Measuring algorithm efficiency", is_correct: 1 },
      { option_text: "Defining variable types", is_correct: 0 },
      { option_text: "Managing memory allocation", is_correct: 0 },
    ],
  },
  {
    question_text: "Which sorting algorithm has the best average-case time complexity?",
    category: "computer-science",
    difficulty: "hard",
    options: [
      { option_text: "Bubble Sort — O(n²)", is_correct: 0 },
      { option_text: "Merge Sort — O(n log n)", is_correct: 1 },
      { option_text: "Selection Sort — O(n²)", is_correct: 0 },
      { option_text: "Insertion Sort — O(n²)", is_correct: 0 },
    ],
  },
  {
    question_text: "What does DNS stand for?",
    category: "web",
    difficulty: "easy",
    options: [
      { option_text: "Domain Name System", is_correct: 1 },
      { option_text: "Digital Network Service", is_correct: 0 },
      { option_text: "Data Name Server", is_correct: 0 },
      { option_text: "Dynamic Node System", is_correct: 0 },
    ],
  },
  {
    question_text: "Which data structure uses LIFO (Last In, First Out)?",
    category: "computer-science",
    difficulty: "easy",
    options: [
      { option_text: "Queue", is_correct: 0 },
      { option_text: "Stack", is_correct: 1 },
      { option_text: "Linked List", is_correct: 0 },
      { option_text: "Hash Table", is_correct: 0 },
    ],
  },
];

const seedDatabase = () => {
  const db = initializeDatabase();

  const existingCount = db.prepare("SELECT COUNT(*) as count FROM questions").get();
  if (existingCount.count > 0) {
    console.log(`Database already has ${existingCount.count} questions. Skipping seed.`);
    closeConnection();
    return;
  }

  const insertQuestion = db.prepare(
    "INSERT INTO questions (question_text, category, difficulty) VALUES (?, ?, ?)"
  );
  const insertOption = db.prepare(
    "INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)"
  );

  const seedTransaction = db.transaction(() => {
    for (const q of seedQuestions) {
      const { lastInsertRowid } = insertQuestion.run(
        q.question_text,
        q.category,
        q.difficulty
      );
      for (const opt of q.options) {
        insertOption.run(lastInsertRowid, opt.option_text, opt.is_correct);
      }
    }
  });

  seedTransaction();
  console.log(`Seeded ${seedQuestions.length} questions successfully.`);
  closeConnection();
};

seedDatabase();
