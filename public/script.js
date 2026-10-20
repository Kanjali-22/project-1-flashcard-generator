// ============================================================
// script.js – FlashAI Flashcard Generator Frontend Logic
// Handles: API calls, card rendering, flip, navigation,
//          revision marking, localStorage, filtering, shuffle
// ============================================================

// ── State ─────────────────────────────────────────────────
let allCards       = [];     // All generated flashcards
let filteredCards  = [];     // Cards after category filter
let currentIndex   = 0;      // Index in filteredCards
let isFlipped      = false;  // Is current card showing answer?
let currentSubject = '';
let currentTopic   = '';
let currentSource  = 'local';
const STORAGE_KEY  = 'flashai_progress';

// ── DOM Helpers ────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Initialize ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restore any previous session cards from localStorage
  const saved = getSavedProgress();
  if (saved && saved.cards && saved.cards.length > 0) {
    // Auto-restore is NOT forced – user must regenerate or we just load silently
    // (keeping it simple for the exam demo)
  }

  // Character counter for textarea
  $('materialInput').addEventListener('input', function () {
    $('charCount').textContent = `${this.value.length} / 5000`;
  });

  // Allow Enter key to generate
  ['subjectInput', 'topicInput'].forEach(id => {
    $(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') generateFlashcards();
    });
  });

  // Allow Space / Enter to flip card
  $('flashcard').addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') toggleCard();
  });

  // Arrow keys for navigation
  document.addEventListener('keydown', e => {
    if (!$('studySection').style.display || $('studySection').style.display === 'none') return;
    if (e.key === 'ArrowLeft')  prevCard();
    if (e.key === 'ArrowRight') nextCard();
    if (e.key === 'ArrowUp')    markDifficulty('easy');
    if (e.key === 'ArrowDown')  markDifficulty('difficult');
  });
});

// ═══════════════════════════════════════════════════════════
// SECTION 1: GENERATE FLASHCARDS
// ═══════════════════════════════════════════════════════════

async function generateFlashcards() {
  const subject  = $('subjectInput').value.trim();
  const topic    = $('topicInput').value.trim();
  const material = $('materialInput').value.trim();
  const count    = parseInt($('countInput').value) || 25;

  // ── Frontend Validation ──────────────────────────────────
  if (!subject) { showError('Please enter a Subject Name.'); $('subjectInput').focus(); return; }
  if (!topic)   { showError('Please enter a Topic Name.'); $('topicInput').focus(); return; }
  if (count < 25 || count > 100) { showError('Card count must be between 25 and 100.'); return; }

  hideError();
  showStatus('Generating your flashcards…');
  setGenerateLoading(true);

  try {
    const response = await fetch('/api/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, material, count })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error. Please try again.');
    }

    if (!data.cards || data.cards.length === 0) {
      throw new Error('No flashcards were generated. Please try again.');
    }

    // ── Merge with saved progress ──────────────────────────
    const saved = getSavedProgress();
    if (saved && saved.topic === topic && saved.subject === subject && saved.progress) {
      data.cards.forEach(card => {
        const savedCard = saved.progress[card.id];
        if (savedCard) card.difficulty = savedCard;
      });
    }

    currentSubject = subject;
    currentTopic   = topic;
    currentSource  = data.source || 'local';
    allCards       = data.cards;

    hideStatus();
    setGenerateLoading(false);
    initStudySection();

  } catch (err) {
    hideStatus();
    setGenerateLoading(false);
    showError(err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 2: STUDY SECTION SETUP
// ═══════════════════════════════════════════════════════════

function initStudySection() {
  // Update meta badges
  $('topicBadge').textContent   = `${currentSubject} › ${currentTopic}`;
  $('sourceBadge').textContent  = currentSource === 'ai' ? '🤖 AI Generated' : '🔧 Template Generated';
  $('sourceBadge').style.background = currentSource === 'ai' ? '#D1FAE5' : '#EDE9FE';
  $('sourceBadge').style.color      = currentSource === 'ai' ? '#065F46' : '#5B21B6';

  // Build category pills
  buildCategoryPills();

  // Start with all cards
  filteredCards = [...allCards];
  currentIndex  = 0;

  // Show study section, hide generate section
  $('generateSection').style.display = 'none';
  $('studySection').style.display    = 'block';
  $('navStats').style.display        = 'flex';

  // Render first card
  renderCard();
  updateStats();
  saveProgress();
}

function buildCategoryPills() {
  const categories = ['all', ...new Set(allCards.map(c => c.category))];
  const container  = $('categoryPills');
  container.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className    = `pill ${cat === 'all' ? 'active' : ''}`;
    btn.dataset.category = cat;
    btn.textContent  = cat === 'all' ? `All Cards (${allCards.length})` : cat;
    btn.onclick      = () => filterByCategory(cat);
    container.appendChild(btn);
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 3: CARD RENDERING
// ═══════════════════════════════════════════════════════════

function renderCard() {
  if (filteredCards.length === 0) {
    $('questionText').textContent = 'No cards in this category.';
    $('answerText').textContent   = '';
    $('cardCategory').textContent = '';
    $('currentCardNum').textContent = '0';
    $('totalCardNum').textContent   = '0';
    return;
  }

  const card = filteredCards[currentIndex];
  isFlipped   = false;

  // Reset flip state
  $('flashcard').classList.remove('flipped', 'is-easy', 'is-revision', 'is-hard', 'card-animate');

  // Force reflow for animation
  void $('flashcard').offsetWidth;
  $('flashcard').classList.add('card-animate');

  // Fill content
  $('questionText').textContent = card.question;
  $('answerText').textContent   = card.answer;
  $('cardCategory').textContent = card.category;

  // Show difficulty indicator on left border
  if (card.difficulty === 'easy')       $('flashcard').classList.add('is-easy');
  else if (card.difficulty === 'revision') $('flashcard').classList.add('is-revision');
  else if (card.difficulty === 'difficult') $('flashcard').classList.add('is-hard');

  // Show Answer button visibility (only before flip)
  $('showAnswerBtn').style.display = 'inline-flex';

  // Update counter
  $('currentCardNum').textContent = currentIndex + 1;
  $('totalCardNum').textContent   = filteredCards.length;

  // Update nav button states
  $('prevBtn').disabled = currentIndex === 0;
  $('nextBtn').disabled = currentIndex === filteredCards.length - 1;

  // Update active difficulty buttons
  updateDifficultyButtons(card.difficulty);
}

function toggleCard() {
  isFlipped = !isFlipped;
  $('flashcard').classList.toggle('flipped', isFlipped);
  $('showAnswerBtn').style.display = isFlipped ? 'none' : 'inline-flex';
}

function showAnswer() {
  if (!isFlipped) toggleCard();
}

// ═══════════════════════════════════════════════════════════
// SECTION 4: NAVIGATION
// ═══════════════════════════════════════════════════════════

function nextCard() {
  if (currentIndex < filteredCards.length - 1) {
    currentIndex++;
    renderCard();
  }
}

function prevCard() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCard();
  }
}

function goBackToForm() {
  $('studySection').style.display    = 'none';
  $('generateSection').style.display = 'block';
  $('navStats').style.display        = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════
// SECTION 5: FILTERING & SHUFFLE
// ═══════════════════════════════════════════════════════════

function filterByCategory(category) {
  // Update active pill
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.category === category);
  });

  filteredCards = category === 'all'
    ? [...allCards]
    : allCards.filter(c => c.category === category);

  currentIndex = 0;
  renderCard();
}

function shuffleCards() {
  // Fisher-Yates shuffle on filteredCards
  for (let i = filteredCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filteredCards[i], filteredCards[j]] = [filteredCards[j], filteredCards[i]];
  }
  currentIndex = 0;
  renderCard();

  // Brief visual feedback
  const btn = $('shuffleBtn');
  btn.textContent = '✅ Shuffled!';
  setTimeout(() => { btn.textContent = '🔀 Shuffle'; }, 1200);
}

// ═══════════════════════════════════════════════════════════
// SECTION 6: REVISION / DIFFICULTY TRACKING
// ═══════════════════════════════════════════════════════════

function markDifficulty(level) {
  if (filteredCards.length === 0) return;

  const card = filteredCards[currentIndex];

  // Toggle off if same level clicked again
  if (card.difficulty === level) {
    card.difficulty = null;
  } else {
    card.difficulty = level;
  }

  // Sync back to allCards array (by id)
  const masterCard = allCards.find(c => c.id === card.id);
  if (masterCard) masterCard.difficulty = card.difficulty;

  // Update visual indicators
  $('flashcard').classList.remove('is-easy', 'is-revision', 'is-hard');
  if (card.difficulty === 'easy')       $('flashcard').classList.add('is-easy');
  else if (card.difficulty === 'revision') $('flashcard').classList.add('is-revision');
  else if (card.difficulty === 'difficult') $('flashcard').classList.add('is-hard');

  updateDifficultyButtons(card.difficulty);
  updateStats();
  saveProgress();

  // Auto-advance to next card after marking (after short delay)
  if (card.difficulty !== null && currentIndex < filteredCards.length - 1) {
    setTimeout(nextCard, 600);
  }
}

function updateDifficultyButtons(difficulty) {
  $('easyBtn').classList.toggle('active',     difficulty === 'easy');
  $('revisionBtn').classList.toggle('active', difficulty === 'revision');
  $('hardBtn').classList.toggle('active',     difficulty === 'difficult');
}

// ═══════════════════════════════════════════════════════════
// SECTION 7: STATISTICS
// ═══════════════════════════════════════════════════════════

function updateStats() {
  const easy     = allCards.filter(c => c.difficulty === 'easy').length;
  const revision = allCards.filter(c => c.difficulty === 'revision').length;
  const hard     = allCards.filter(c => c.difficulty === 'difficult').length;
  const total    = allCards.length;

  // Progress overview
  $('easyCount').textContent     = easy;
  $('revisionCount').textContent = revision;
  $('hardCount').textContent     = hard;
  $('totalCount').textContent    = total;

  // Progress bars (% of total)
  $('easyBar').style.width     = total > 0 ? `${(easy / total * 100)}%`     : '0%';
  $('revisionBar').style.width = total > 0 ? `${(revision / total * 100)}%` : '0%';
  $('hardBar').style.width     = total > 0 ? `${(hard / total * 100)}%`     : '0%';

  // Navbar stats
  $('navEasy').textContent     = easy;
  $('navRevision').textContent = revision;
  $('navHard').textContent     = hard;
}

// ═══════════════════════════════════════════════════════════
// SECTION 8: LOCAL STORAGE – PERSISTENCE
// ═══════════════════════════════════════════════════════════

function saveProgress() {
  const progress = {};
  allCards.forEach(c => {
    if (c.difficulty) progress[c.id] = c.difficulty;
  });

  const data = {
    subject: currentSubject,
    topic: currentTopic,
    source: currentSource,
    cards: allCards,
    progress,
    savedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
}

function getSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function confirmResetProgress() {
  $('confirmModal').style.display = 'flex';
}

function closeModal() {
  $('confirmModal').style.display = 'none';
}

function resetProgress() {
  // Clear difficulty markings
  allCards.forEach(c => { c.difficulty = null; });
  filteredCards.forEach(c => { c.difficulty = null; });

  // Clear localStorage
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}

  // Re-render
  renderCard();
  updateStats();
  closeModal();
}

// ═══════════════════════════════════════════════════════════
// SECTION 9: UI HELPERS
// ═══════════════════════════════════════════════════════════

function showStatus(msg) {
  $('statusBar').style.display    = 'block';
  $('statusMessage').textContent  = msg;
}

function hideStatus() {
  $('statusBar').style.display = 'none';
}

function showError(msg) {
  $('errorAlert').style.display = 'flex';
  $('errorMessage').textContent = msg;
}

function hideError() {
  $('errorAlert').style.display = 'none';
}

function setGenerateLoading(loading) {
  const btn  = $('generateBtn');
  const icon = btn.querySelector('.btn-icon');
  const text = btn.querySelector('.btn-text');

  btn.disabled = loading;
  if (loading) {
    icon.textContent = '⏳';
    text.textContent = 'Generating…';
  } else {
    icon.textContent = '✨';
    text.textContent = 'Generate Flashcards';
  }
}

function clearForm() {
  $('subjectInput').value  = '';
  $('topicInput').value    = '';
  $('materialInput').value = '';
  $('countInput').value    = '25';
  $('charCount').textContent = '0 / 5000';
  hideError();
  hideStatus();
  $('subjectInput').focus();
}
