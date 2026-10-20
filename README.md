# ⚡ FlashAI – AI-Powered Flashcard Generator & Revision System

> MCA Practical Project | Built with Node.js + Express.js

## 📋 Project Overview

FlashAI is a web application that helps students generate study flashcards for any subject and topic. It supports an interactive revision system with difficulty tracking and progress persistence.

---

## 🚀 Setup & Installation

### Step 1: Install Dependencies
```bash
cd project-1-flashcard-generator
npm install
```

### Step 2: (Optional) Configure AI API Key
```bash
cp .env.example .env
# Open .env and add your OpenAI API key
# If no key is added, the app uses the local template-based generator
```

### Step 3: Start the Server
```bash
node server.js
```

### Step 4: Open in Browser
```
http://localhost:3001
```

---

## 📁 Project Structure

```
project-1-flashcard-generator/
├── server.js          ← Express backend (API endpoints + fallback logic)
├── package.json       ← Node.js project config & dependencies
├── .env.example       ← Environment variable template
├── .gitignore         ← Files to exclude from git
├── public/
│   ├── index.html     ← Frontend structure (UI layout & HTML)
│   ├── style.css      ← All styling (blue/white theme, animations)
│   └── script.js      ← Frontend logic (API calls, flashcard interactions)
└── README.md          ← This file
```

### File Explanations

| File | Purpose |
|------|---------|
| `server.js` | The backend Express server. Contains the `/api/flashcards/generate` endpoint, local flashcard template engine, and optional AI API integration. |
| `public/index.html` | The frontend HTML structure. Defines the layout: form section, flashcard display area, category filters, navigation buttons, and revision controls. |
| `public/style.css` | All CSS styling. Implements the blue-and-white professional theme, card flip animation (CSS 3D transform), responsive grid layout, and micro-animations. |
| `public/script.js` | Frontend JavaScript. Handles: form submission, fetch API calls to backend, flashcard rendering, flip animation, navigation, filtering, shuffle, difficulty marking, and localStorage persistence. |

---

## 🔌 API Documentation

### POST /api/flashcards/generate

Generates flashcards for a given subject and topic.

**Request Body:**
```json
{
  "subject": "Computer Science",
  "topic":   "Data Structures",
  "material": "Optional study material text...",
  "count":    25
}
```

**Success Response (200):**
```json
{
  "success": true,
  "subject": "Computer Science",
  "topic":   "Data Structures",
  "total":   25,
  "source":  "local",
  "message": "Flashcards generated using local template engine.",
  "cards": [
    {
      "id": 1,
      "question": "What is Data Structures?",
      "answer":   "Data Structures is a fundamental concept in Computer Science...",
      "category": "Definitions",
      "difficulty": null
    }
  ]
}
```

**Error Response (400):**
```json
{ "error": "Subject is required." }
```

### GET /api/health

Returns server status.

---

## 📮 Postman Test Cases

### Test Case 1: Basic Generation (25 cards)
- **Method:** POST
- **URL:** `http://localhost:3001/api/flashcards/generate`
- **Body (JSON):**
```json
{
  "subject": "Computer Science",
  "topic": "Operating Systems",
  "count": 25
}
```
- **Expected:** 200 OK, 25 flashcard objects in `cards` array

### Test Case 2: With Study Material (30 cards)
- **Method:** POST
- **URL:** `http://localhost:3001/api/flashcards/generate`
- **Body (JSON):**
```json
{
  "subject": "Mathematics",
  "topic": "Linear Algebra",
  "material": "Linear algebra is the branch of mathematics concerning linear equations, linear maps, and their representations in vector spaces and through matrices.",
  "count": 30
}
```
- **Expected:** 200 OK, cards include "From Study Material" category

### Test Case 3: Empty Subject (Validation Error)
- **Method:** POST
- **URL:** `http://localhost:3001/api/flashcards/generate`
- **Body (JSON):**
```json
{ "subject": "", "topic": "Test", "count": 25 }
```
- **Expected:** 400 Bad Request, `{ "error": "Subject is required." }`

### Test Case 4: Invalid Count (Validation Error)
- **Method:** POST
- **URL:** `http://localhost:3001/api/flashcards/generate`
- **Body (JSON):**
```json
{ "subject": "Science", "topic": "Physics", "count": 5 }
```
- **Expected:** 400 Bad Request, `{ "error": "Card count must be between 25 and 100." }`

---

## 🎯 Features

- ✅ Generate 25–100 flashcards per topic
- ✅ 9 category types: Definitions, Concepts, Advantages, Applications, Examples, Types & Classifications, Comparison, Challenges, Future Trends
- ✅ Card flip animation (front: question, back: answer)
- ✅ Category filtering with pill buttons
- ✅ Shuffle mode (Fisher-Yates algorithm)
- ✅ Keyboard navigation (←/→ arrow keys)
- ✅ Difficulty marking: Easy / Needs Revision / Difficult
- ✅ Progress statistics with animated bars
- ✅ localStorage persistence (survives page refresh)
- ✅ Reset progress with confirmation modal
- ✅ Works without AI API key (local fallback)

---

## 🔄 Application Workflow

```
User enters Subject + Topic
        ↓
Frontend validates inputs
        ↓
POST /api/flashcards/generate → server.js
        ↓
server.js checks for AI API key
  → If key exists: Call OpenAI API → parse response
  → If no key: Use CATEGORY_TEMPLATES → generate 25+ cards
        ↓
Return JSON array of flashcards
        ↓
Frontend renders flashcard interface
        ↓
User navigates cards, marks difficulty
        ↓
Progress saved to localStorage
```

---

## 🎓 Viva Questions & Answers

**Q1. What technology stack did you use?**
A: Frontend: HTML5, CSS3, JavaScript. Backend: Node.js with Express.js. Data storage: Browser localStorage.

**Q2. What is the purpose of `express.static()`?**
A: It serves static files (HTML, CSS, JS) from the `public/` folder to the browser automatically.

**Q3. How does the card flip animation work?**
A: Using CSS 3D transforms (`rotateY(180deg)`) with `transform-style: preserve-3d` and `backface-visibility: hidden` on both front and back faces.

**Q4. How is progress saved without a database?**
A: Using browser `localStorage`. The revision data (easy/revision/difficult per card) is serialized to JSON and saved with `localStorage.setItem()`.

**Q5. What happens if no AI API key is provided?**
A: The server uses the local `CATEGORY_TEMPLATES` object to generate topic-specific flashcards using template strings. The `source` field in the response will be `"local"` instead of `"ai"`.

**Q6. What is the Fisher-Yates shuffle algorithm?**
A: An unbiased shuffle algorithm that iterates from the last element to the first, swapping each element with a randomly chosen element before it, resulting in a uniformly random permutation.

**Q7. What HTTP method is used and why POST instead of GET?**
A: POST is used because we are sending a request body with data (subject, topic, material, count). GET requests don't have a body and are for retrieving data without sending input.
