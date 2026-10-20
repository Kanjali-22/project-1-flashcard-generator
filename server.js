// ============================================================
// server.js - AI Flashcard Generator Backend
// Entry point: Express server handling API requests
// ============================================================

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────
app.use(cors());                          // Allow cross-origin requests
app.use(express.json());                  // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend files

// ── Flashcard Templates (Local Fallback) ──────────────────
// These templates generate topic-specific flashcards without an AI API
const CATEGORY_TEMPLATES = {
  Definitions: [
    { q: 'What is {topic}?', a: '{topic} is a fundamental concept in {subject} that involves understanding its core principles and applications.' },
    { q: 'Define {topic} in the context of {subject}.', a: '{topic} in {subject} refers to the systematic approach of applying its methodologies to solve real-world problems.' },
    { q: 'What do you mean by {topic}?', a: '{topic} is a key term in {subject} that represents an important paradigm used by professionals in the field.' },
    { q: 'Give the technical definition of {topic}.', a: 'Technically, {topic} is defined as a structured framework within {subject} that enables efficient problem-solving and implementation.' },
    { q: 'What is the formal meaning of {topic}?', a: 'Formally, {topic} denotes a well-established concept in {subject} comprising defined rules, principles, and methodologies.' },
    { q: 'How is {topic} defined by experts in {subject}?', a: 'Experts define {topic} as a critical building block in {subject}, essential for understanding advanced topics and practical applications.' }
  ],
  Concepts: [
    { q: 'What are the core principles of {topic}?', a: 'The core principles of {topic} include abstraction, modularity, scalability, and systematic organization within {subject}.' },
    { q: 'How does {topic} work in {subject}?', a: '{topic} works by following a structured approach: input processing, transformation using defined rules, and producing meaningful output in {subject}.' },
    { q: 'What is the relationship between {topic} and {subject}?', a: '{topic} is an integral component of {subject}, forming the theoretical backbone upon which practical implementations are built.' },
    { q: 'Explain the working mechanism of {topic}.', a: 'The mechanism of {topic} involves initialization, processing through defined algorithms, and outputting results that serve the goals of {subject}.' },
    { q: 'What role does {topic} play in {subject}?', a: '{topic} plays a pivotal role in {subject} by providing a systematic methodology for solving complex problems efficiently.' },
    { q: 'How is {topic} implemented in real-world {subject} scenarios?', a: '{topic} is implemented in {subject} by applying its principles to design solutions, using appropriate tools and frameworks relevant to the domain.' }
  ],
  Advantages: [
    { q: 'What are the main advantages of {topic}?', a: 'The main advantages of {topic} include: improved efficiency, better organization, scalability, ease of maintenance, and enhanced problem-solving capability in {subject}.' },
    { q: 'Why is {topic} important in {subject}?', a: '{topic} is important in {subject} because it streamlines workflows, reduces complexity, and provides a reliable foundation for building advanced systems.' },
    { q: 'List the benefits of using {topic} in {subject}.', a: 'Benefits of {topic}: (1) Increased productivity, (2) Reduced errors, (3) Better code/system quality, (4) Easier debugging, (5) Industry-standard approach.' },
    { q: 'How does {topic} improve {subject} outcomes?', a: '{topic} improves {subject} outcomes by providing structured frameworks that reduce ambiguity, encourage best practices, and ensure consistent results.' },
    { q: 'What problems does {topic} solve in {subject}?', a: '{topic} solves key problems in {subject} such as complexity management, redundancy, poor scalability, and lack of standardization.' }
  ],
  Applications: [
    { q: 'Where is {topic} used in real life?', a: '{topic} is used in industries such as software development, data science, healthcare informatics, finance, and education to solve domain-specific problems.' },
    { q: 'Give practical applications of {topic} in {subject}.', a: 'Practical applications include: system design, algorithm implementation, data analysis, automation, and research in {subject}.' },
    { q: 'How is {topic} applied in the industry?', a: 'Industry applies {topic} through product development cycles, project management, quality assurance, and optimization in {subject}-related domains.' },
    { q: 'Name three use cases of {topic} in {subject}.', a: 'Use cases: (1) Academic research, (2) Enterprise system development, (3) Automated decision-making systems in the {subject} domain.' },
    { q: 'What industries rely on {topic}?', a: 'Industries relying on {topic} include IT, healthcare, manufacturing, education, finance, and telecommunications — all using {subject} principles.' },
    { q: 'How does {topic} relate to modern technology in {subject}?', a: '{topic} underpins modern technology in {subject} by enabling cloud computing, AI integration, microservices, and scalable architectures.' }
  ],
  Examples: [
    { q: 'Give an example of {topic} in {subject}.', a: 'A classic example of {topic} in {subject} is its use in designing modular systems where each component handles a specific responsibility independently.' },
    { q: 'Provide a real-world example of {topic}.', a: 'A real-world example: in software engineering, {topic} principles from {subject} are used to build scalable web applications and APIs.' },
    { q: 'Illustrate {topic} with a simple example.', a: 'Simple example: Consider a library system — {topic} is applied in {subject} to organize, retrieve, and manage book records efficiently.' },
    { q: 'Demonstrate how {topic} works with an example.', a: 'Example: A university management system uses {topic} concepts from {subject} to handle student enrollment, grading, and scheduling.' },
    { q: 'Give an example showing the advantages of {topic}.', a: 'Example showing advantages: Using {topic} in a banking system (a {subject} application) ensures data integrity, security, and fast transaction processing.' }
  ],
  'Types & Classifications': [
    { q: 'What are the different types of {topic}?', a: 'Types of {topic} include: (1) Basic/Fundamental type, (2) Advanced type, (3) Hybrid type, (4) Specialized type — each serving specific needs in {subject}.' },
    { q: 'How is {topic} classified in {subject}?', a: '{topic} is classified in {subject} based on complexity, purpose, and implementation approach: structural, behavioral, and creational categories.' },
    { q: 'Distinguish between types of {topic}.', a: 'The primary distinction in types of {topic}: some focus on efficiency, others on maintainability, and advanced types balance both in {subject} contexts.' }
  ],
  'Comparison & Difference': [
    { q: 'What is the difference between {topic} and related concepts in {subject}?', a: '{topic} differs from related concepts by its specific scope, methodology, and application domain — it is more specialized within {subject}.' },
    { q: 'Compare {topic} with traditional approaches in {subject}.', a: '{topic} vs traditional approaches: {topic} offers better scalability and automation; traditional methods may be simpler but less efficient in {subject}.' },
    { q: 'How does {topic} differ from similar concepts?', a: 'Key differences: {topic} has a defined structure, clear scope, and established standards, unlike loosely defined concepts in other areas of {subject}.' }
  ],
  Challenges: [
    { q: 'What are the challenges of implementing {topic}?', a: 'Challenges: (1) Steep learning curve, (2) Resource requirements, (3) Integration complexity, (4) Keeping up with evolving standards in {subject}.' },
    { q: 'What are the limitations of {topic} in {subject}?', a: 'Limitations of {topic}: may not suit all use cases, requires domain expertise, and can be over-engineered for simple {subject} problems.' },
    { q: 'How do you overcome difficulties in {topic}?', a: 'Overcome difficulties by: thorough planning, using established frameworks, continuous learning, and following best practices in {subject}.' }
  ],
  'Future Trends': [
    { q: 'What is the future of {topic} in {subject}?', a: 'The future of {topic} involves AI integration, automation, cloud-native implementations, and seamless integration with emerging technologies in {subject}.' },
    { q: 'How will {topic} evolve in the coming years?', a: '{topic} will evolve through increased automation, AI-driven optimization, and deeper integration with modern {subject} tools and platforms.' },
    { q: 'What emerging trends are shaping {topic} in {subject}?', a: 'Emerging trends: machine learning integration, serverless architectures, edge computing, and real-time processing are shaping {topic} in {subject}.' }
  ]
};

// ── Helper: Fill template with actual topic/subject ────────
function fillTemplate(template, subject, topic) {
  return template
    .replace(/{topic}/g, topic)
    .replace(/{subject}/g, subject);
}

// ── Helper: Extract flashcards from study material ────────
function extractFromMaterial(material, subject, topic) {
  const cards = [];
  if (!material || material.trim().length < 20) return cards;

  // Split material into sentences and create Q&A pairs
  const sentences = material
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  sentences.forEach((sentence, i) => {
    if (i < 8) { // Use up to 8 sentences from material
      const words = sentence.split(' ');
      if (words.length > 5) {
        const keyPhrase = words.slice(0, 4).join(' ');
        cards.push({
          id: `mat_${i}`,
          question: `According to the study material, what is stated about "${keyPhrase}..."?`,
          answer: sentence + '.',
          category: 'From Study Material',
          difficulty: null
        });
      }
    }
  });
  return cards;
}

// ── Local Fallback: Generate Flashcards Without AI ────────
function generateLocalFlashcards(subject, topic, material, count) {
  const cards = [];
  let id = 1;

  // Get cards from study material first (if provided)
  const materialCards = extractFromMaterial(material, subject, topic);
  materialCards.forEach(c => {
    cards.push({ ...c, id: id++ });
  });

  // Generate from all category templates
  const categories = Object.keys(CATEGORY_TEMPLATES);

  // Keep cycling through categories until we have enough cards
  let catIdx = 0;
  let templateIdx = {};
  categories.forEach(cat => (templateIdx[cat] = 0));

  while (cards.length < count) {
    const category = categories[catIdx % categories.length];
    const templates = CATEGORY_TEMPLATES[category];
    const tIdx = templateIdx[category] % templates.length;
    const template = templates[tIdx];

    const question = fillTemplate(template.q, subject, topic);
    const answer = fillTemplate(template.a, subject, topic);

    // Avoid exact duplicates
    const isDuplicate = cards.some(c => c.question === question);
    if (!isDuplicate) {
      cards.push({
        id: id++,
        question,
        answer,
        category,
        difficulty: null
      });
    }

    templateIdx[category]++;
    catIdx++;
  }

  return cards.slice(0, count);
}

// ── AI-Powered Generation (with local fallback) ────────────
async function generateWithAI(subject, topic, material, count) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    // No API key — use local fallback
    console.log('[INFO] No AI API key found. Using local fallback generator.');
    return {
      cards: generateLocalFlashcards(subject, topic, material, count),
      source: 'local'
    };
  }

  try {
    // Example: Using OpenAI API (can be swapped for any LLM)
    const fetch = (await import('node-fetch')).default;
    const prompt = `Generate exactly ${count} flashcards for the subject "${subject}", topic "${topic}".
${material ? `Use this study material as reference:\n${material}\n` : ''}
Return a JSON array of objects with these fields:
- question: string (clear, exam-style question)
- answer: string (detailed, informative answer)
- category: string (one of: Definitions, Concepts, Advantages, Applications, Examples, Types & Classifications, Comparison & Difference, Challenges, Future Trends)

Generate exactly ${count} diverse flashcards covering different aspects of the topic. Return ONLY the JSON array.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error(`API responded with status ${response.status}`);

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    const cards = parsed.map((c, i) => ({
      id: i + 1,
      question: c.question,
      answer: c.answer,
      category: c.category || 'Concepts',
      difficulty: null
    }));

    return { cards, source: 'ai' };

  } catch (err) {
    console.error('[ERROR] AI API failed:', err.message);
    console.log('[INFO] Falling back to local generator.');
    return {
      cards: generateLocalFlashcards(subject, topic, material, count),
      source: 'local'
    };
  }
}

// ── API Routes ─────────────────────────────────────────────

// POST /api/flashcards/generate
// Accepts: { subject, topic, material, count }
// Returns: { cards: [...], source: "ai"|"local", total: N }
app.post('/api/flashcards/generate', async (req, res) => {
  try {
    const { subject, topic, material, count } = req.body;

    // ── Input Validation ──────────────────────────────────
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({ error: 'Subject is required.' });
    }
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Topic is required.' });
    }
    const cardCount = parseInt(count) || 25;
    if (cardCount < 25 || cardCount > 100) {
      return res.status(400).json({ error: 'Card count must be between 25 and 100.' });
    }

    const cleanSubject = subject.trim().slice(0, 100);
    const cleanTopic = topic.trim().slice(0, 100);
    const cleanMaterial = material ? material.trim().slice(0, 5000) : '';

    console.log(`[REQUEST] Generating ${cardCount} flashcards for: ${cleanSubject} > ${cleanTopic}`);

    const result = await generateWithAI(cleanSubject, cleanTopic, cleanMaterial, cardCount);

    res.json({
      success: true,
      subject: cleanSubject,
      topic: cleanTopic,
      total: result.cards.length,
      source: result.source,
      message: result.source === 'ai'
        ? 'Flashcards generated using AI.'
        : 'Flashcards generated using local template engine (no AI API key configured).',
      cards: result.cards
    });

  } catch (err) {
    console.error('[ERROR] /api/flashcards/generate:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    project: 'AI Flashcard Generator',
    port: PORT,
    aiEnabled: !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ AI Flashcard Generator running at http://localhost:${PORT}`);
  console.log(`   AI Mode: ${process.env.OPENAI_API_KEY ? 'ENABLED (OpenAI)' : 'DISABLED (Local Fallback)'}`);
  console.log(`   Press Ctrl+C to stop.\n`);
});
