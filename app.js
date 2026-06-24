// ==========================================
// AetherStudy - Application Core JavaScript
// ==========================================

// Global Application State Object
let state = {
  tasks: [],
  quizzes: [],
  decks: [],
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15
  },
  stats: {
    studyTimeToday: 0, // in minutes
    focusScore: 0,
    totalQuizzesTaken: 0,
    quizTotalCorrect: 0,
    quizTotalQuestions: 0
  },
  reminders: []
};

// Pomodoro Timer State
let timerState = {
  timeLeft: 0, // in seconds
  totalDuration: 0, // in seconds
  status: 'idle', // 'idle' | 'running' | 'paused'
  currentMode: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
  completedIntervals: 0,
  timerIntervalId: null,
  lastTickTime: null
};

// Active Session States
let activeQuizGame = null;
let activeDeckStudy = null;

// Quotes Pool for Dashboard
const QUOTES = [
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Today a reader, tomorrow a leader.", author: "Margaret Fuller" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" }
];

// ==========================================
// 1. Core Lifecycle & Initializers
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  loadStateFromLocalStorage();
  setupNavigation();
  setupDashboard();
  setupTasksManager();
  setupPomodoroTimer();
  setupReminderSystem();
  setupQuizMaker();
  setupFlashcards();
  setupModals();
  
  // Show random quote
  displayRandomQuote();
  
  // Trigger initial renders
  renderAllViews();
  
  // Start reminder check interval loop (every second)
  setInterval(scanActiveReminders, 1000);
}

// LocalStorage Helper functions
function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem("aetherstudy_state");
  if (savedState) {
    try {
      state = JSON.parse(savedState);
      // Backwards compatibility checks
      if (!state.reminders) state.reminders = [];
      if (!state.stats) {
        state.stats = { studyTimeToday: 0, focusScore: 0, totalQuizzesTaken: 0, quizTotalCorrect: 0, quizTotalQuestions: 0 };
      }
    } catch (e) {
      console.error("Local storage corruption. Loading default data.");
      loadDefaultMockData();
    }
  } else {
    loadDefaultMockData();
  }
}

function saveStateToLocalStorage() {
  localStorage.setItem("aetherstudy_state", JSON.stringify(state));
  updateHeaderFocusScore();
}

function loadDefaultMockData() {
  state.tasks = [
    {
      id: "mock-task-1",
      title: "Review Biology Structure of Cell",
      desc: "Go through organelle functions and prepare sketch of mitochondria.",
      subject: "Biology",
      priority: "high",
      dueDate: getTodayDateString(),
      dueTime: "18:00",
      status: "pending"
    },
    {
      id: "mock-task-2",
      title: "Practice Calculus Derivatives sheet",
      desc: "Complete exercises 3 to 12. Check answers in index.",
      subject: "Mathematics",
      priority: "medium",
      dueDate: getTodayDateString(),
      dueTime: "",
      status: "pending"
    },
    {
      id: "mock-task-3",
      title: "Read Chapter 4 of History book",
      desc: "Analyze economic effects of the Industrial Revolution.",
      subject: "History",
      priority: "low",
      dueDate: getTodayDateString(1), // Tomorrow
      dueTime: "10:00",
      status: "completed"
    }
  ];

  state.quizzes = [
    {
      id: "mock-quiz-1",
      title: "General Science & Tech Concepts",
      subject: "Science",
      highScore: null,
      questions: [
        {
          question: "What is the speed of light in a vacuum?",
          options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "3,000 km/s"],
          correctIdx: 0
        },
        {
          question: "Which Newton law states that for every action, there is an equal and opposite reaction?",
          options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
          correctIdx: 2
        },
        {
          question: "What is the SI unit of electric current?",
          options: ["Volt", "Ohm", "Watt", "Ampere"],
          correctIdx: 3
        },
        {
          question: "What is the chemical symbol for Gold?",
          options: ["Gd", "Au", "Ag", "Fe"],
          correctIdx: 1
        },
        {
          question: "Which planet in our solar system is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correctIdx: 1
        },
        {
          question: "What is the main gas that makes up the Earth's atmosphere?",
          options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
          correctIdx: 2
        },
        {
          question: "Which organelle is known as the powerhouse of the cell?",
          options: ["Nucleus", "Ribosome", "Golgi Apparatus", "Mitochondria"],
          correctIdx: 3
        },
        {
          question: "Who proposed the theory of General Relativity?",
          options: ["Isaac Newton", "Albert Einstein", "Galileo Galilei", "Stephen Hawking"],
          correctIdx: 1
        },
        {
          question: "Which programming language is known as the language of the web?",
          options: ["Python", "C++", "Java", "JavaScript"],
          correctIdx: 3
        },
        {
          question: "What is the hardest natural substance on Earth?",
          options: ["Gold", "Iron", "Diamond", "Quartz"],
          correctIdx: 2
        }
      ]
    }
  ];

  state.decks = [
    {
      id: "mock-deck-1",
      title: "Spanish Basic Phrases",
      subject: "Languages",
      timesReviewed: 0,
      lastScore: null,
      cards: [
        { front: "Thank you very much", back: "Muchas gracias" },
        { front: "Good morning", back: "Buenos días" },
        { front: "Where is the library?", back: "¿Dónde está la biblioteca?" },
        { front: "Please / You're welcome", back: "Por favor / De nada" }
      ]
    }
  ];

  state.settings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15
  };

  state.stats = {
    studyTimeToday: 50,
    focusScore: 120,
    totalQuizzesTaken: 1,
    quizTotalCorrect: 2,
    quizTotalQuestions: 3
  };

  state.reminders = [
    {
      id: "mock-rem-1",
      title: "Complete Physics Homework",
      time: `${getTodayDateString()}T17:00`,
      triggered: false
    }
  ];

  saveStateToLocalStorage();
}

// Helpers
function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function updateHeaderFocusScore() {
  const scoreElem = document.getElementById("header-focus-score");
  if (scoreElem) {
    scoreElem.textContent = `${state.stats.focusScore} pts`;
  }
}

// ==========================================
// 2. Navigation Routing Manager
// ==========================================

function setupNavigation() {
  const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabName = item.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Welcome page focus shortcut
  document.getElementById("btn-dash-start-timer").addEventListener("click", () => {
    switchTab("pomodoro");
    startTimer();
  });

  // View All Tasks shortcut
  document.getElementById("btn-dash-view-tasks").addEventListener("click", () => {
    switchTab("tasks");
  });
}

function switchTab(tabId) {
  // Update nav UI
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update views visible
  document.querySelectorAll(".view-container .tab-view").forEach(view => {
    if (view.id === `view-${tabId}`) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  // Update header text title
  const titleMap = {
    'dashboard': 'Dashboard Overview',
    'tasks': 'Tasks & Planner Grid',
    'pomodoro': 'Pomodoro Focus Space',
    'quizzes': 'Quiz Builder & Studio',
    'flashcards': 'Interactive Cards Deck'
  };
  document.getElementById("current-view-title").textContent = titleMap[tabId] || 'Workspace';

  // Render on switch
  renderViewContent(tabId);
}

function renderAllViews() {
  updateHeaderFocusScore();
  renderViewContent('dashboard');
  renderViewContent('tasks');
  renderViewContent('pomodoro');
  renderViewContent('quizzes');
  renderViewContent('flashcards');
}

function renderViewContent(tabId) {
  switch (tabId) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'tasks':
      renderTasks();
      break;
    case 'pomodoro':
      syncTimerUIDisplay();
      break;
    case 'quizzes':
      renderQuizzes();
      break;
    case 'flashcards':
      renderDecks();
      break;
  }
}

// ==========================================
// 3. Dashboard Manager
// ==========================================

function setupDashboard() {
  document.getElementById("btn-quick-reminder").addEventListener("click", () => {
    openModal("modal-reminder-log");
  });
}

function displayRandomQuote() {
  const quoteElem = document.getElementById("daily-quote");
  if (quoteElem) {
    const r = Math.floor(Math.random() * QUOTES.length);
    const q = QUOTES[r];
    quoteElem.innerHTML = `"${q.text}" <strong style="color:var(--accent-secondary); font-style:normal;">— ${q.author}</strong>`;
  }
}

function renderDashboard() {
  // Update Welcome Title
  const hrs = new Date().getHours();
  let greet = "Welcome back, Scholar";
  if (hrs < 12) greet = "Good morning, Scholar";
  else if (hrs < 18) greet = "Good afternoon, Scholar";
  else greet = "Good evening, Scholar";
  document.getElementById("welcome-title").textContent = greet;

  // Stats Card Value bindings
  document.getElementById("dash-study-time").textContent = `${state.stats.studyTimeToday}m`;
  
  const pendingCount = state.tasks.filter(t => t.status === 'pending').length;
  const completedCount = state.tasks.filter(t => t.status === 'completed').length;
  document.getElementById("dash-tasks-done").textContent = `${completedCount}/${state.tasks.length}`;

  // Average Quiz Accuracy
  let accPercent = 0;
  if (state.stats.quizTotalQuestions > 0) {
    accPercent = Math.round((state.stats.quizTotalCorrect / state.stats.quizTotalQuestions) * 100);
  }
  document.getElementById("dash-accuracy").textContent = `${accPercent}%`;

  // Render Agenda Lists (Limit 3 items)
  const agendaList = document.getElementById("dash-agenda-list");
  agendaList.innerHTML = "";
  
  const activeTasks = state.tasks.filter(t => t.status === 'pending').slice(0, 3);
  if (activeTasks.length === 0) {
    agendaList.innerHTML = `<div class="empty-state"><p>All tasks done! Focus on a quiz or review card decks.</p></div>`;
  } else {
    activeTasks.forEach(task => {
      const item = document.createElement("div");
      item.className = "agenda-item";
      
      const dueStr = task.dueDate ? `Due: ${task.dueDate} ${task.dueTime || ''}` : "No due date";
      
      item.innerHTML = `
        <div class="agenda-left">
          <span class="agenda-subject">${escapeHTML(task.subject || 'Study')}</span>
          <div>
            <div class="agenda-title">${escapeHTML(task.title)}</div>
            <div class="agenda-due">${dueStr}</div>
          </div>
        </div>
        <button class="btn btn-text" onclick="quickCompleteTask('${task.id}')">✓ Done</button>
      `;
      agendaList.appendChild(item);
    });
  }

  // Flashcards Progress bar widget
  const learnedFlashcards = state.decks.reduce((acc, d) => acc + (d.timesReviewed > 0 ? d.cards.length : 0), 0);
  const totalFlashcards = state.decks.reduce((acc, d) => acc + d.cards.length, 0);
  document.getElementById("dash-flashcard-learned-count").textContent = `${learnedFlashcards}/${totalFlashcards}`;
  
  const cardProg = totalFlashcards > 0 ? (learnedFlashcards / totalFlashcards) * 100 : 0;
  document.getElementById("dash-flashcard-learned-progress").style.width = `${cardProg}%`;

  // Quizzes Finished widget
  const quizzesTaken = state.stats.totalQuizzesTaken;
  document.getElementById("dash-quizzes-taken").textContent = `${quizzesTaken}`;
  const quizProg = Math.min((quizzesTaken / 5) * 100, 100); // Scale relative to target of 5 quizzes
  document.getElementById("dash-quizzes-taken-progress").style.width = `${quizProg}%`;

  // Update Pomodoro Preview Time
  const previewTimer = document.getElementById("dash-timer-preview");
  if (timerState.status === 'running') {
    previewTimer.textContent = formatTime(timerState.timeLeft);
  } else {
    previewTimer.textContent = `${state.settings.focusDuration}:00`;
  }
}

function quickCompleteTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'completed';
    state.stats.focusScore += 15; // Complete task rewards points!
    showToast("Task Finished", `Completed "${task.title}". earned +15 points!`, "success");
    saveStateToLocalStorage();
    renderAllViews();
  }
}

// ==========================================
// 4. Tasks & Planner Manager
// ==========================================

let activeTaskFilter = 'all';
let activeTaskSubjectFilter = 'all';
let taskSearchQuery = '';

function setupTasksManager() {
  // Modal hooks
  document.getElementById("btn-new-task").addEventListener("click", () => {
    openTaskModal();
  });
  
  document.getElementById("btn-close-task-modal").addEventListener("click", () => {
    closeModal("modal-task-form");
  });
  
  document.getElementById("btn-cancel-task-form").addEventListener("click", () => {
    closeModal("modal-task-form");
  });

  // Task form submission
  document.getElementById("task-creation-form").addEventListener("submit", handleTaskFormSubmit);

  // Search input
  document.getElementById("search-task-input").addEventListener("input", (e) => {
    taskSearchQuery = e.target.value.toLowerCase();
    renderTasksListOnly();
  });

  // Bind filter links
  const filters = document.querySelectorAll(".tasks-filters .filter-list .filter-item");
  filters.forEach(item => {
    item.addEventListener("click", () => {
      // Clear previous active
      filters.forEach(f => f.classList.remove("active"));
      item.classList.add("active");
      
      activeTaskFilter = item.getAttribute("data-filter");
      renderTasksListOnly();
    });
  });
}

function renderTasks() {
  renderTasksFilters();
  renderTasksListOnly();
}

function renderTasksFilters() {
  // 1. Update task counts
  const total = state.tasks.length;
  const pending = state.tasks.filter(t => t.status === 'pending').length;
  const completed = state.tasks.filter(t => t.status === 'completed').length;
  
  document.getElementById("count-all-tasks").textContent = total;
  document.getElementById("count-pending-tasks").textContent = pending;
  document.getElementById("count-completed-tasks").textContent = completed;

  // 2. Populating unique subject tags
  const subjectsContainer = document.getElementById("subject-filters-list");
  subjectsContainer.innerHTML = "";

  // Add default "All" button
  const allBtn = document.createElement("button");
  allBtn.className = `tag-btn ${activeTaskSubjectFilter === 'all' ? 'active' : ''}`;
  allBtn.textContent = "All Subjects";
  allBtn.addEventListener("click", () => {
    activeTaskSubjectFilter = 'all';
    document.querySelectorAll("#subject-filters-list .tag-btn").forEach(b => b.classList.remove("active"));
    allBtn.classList.add("active");
    renderTasksListOnly();
  });
  subjectsContainer.appendChild(allBtn);

  // Unique lists from state
  const subjects = [...new Set(state.tasks.map(t => t.subject).filter(Boolean))];
  subjects.forEach(subject => {
    const btn = document.createElement("button");
    btn.className = `tag-btn ${activeTaskSubjectFilter === subject ? 'active' : ''}`;
    btn.textContent = subject;
    btn.addEventListener("click", () => {
      activeTaskSubjectFilter = subject;
      document.querySelectorAll("#subject-filters-list .tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasksListOnly();
    });
    subjectsContainer.appendChild(btn);
  });

  // 3. Populate Form Autofill Datalist
  const datalist = document.getElementById("subject-datalist");
  datalist.innerHTML = "";
  subjects.forEach(sub => {
    const option = document.createElement("option");
    option.value = sub;
    datalist.appendChild(option);
  });
}

function renderTasksListOnly() {
  const container = document.getElementById("tasks-list-container");
  container.innerHTML = "";

  let filtered = state.tasks;

  // Status Filter
  if (activeTaskFilter === 'pending') {
    filtered = filtered.filter(t => t.status === 'pending');
  } else if (activeTaskFilter === 'completed') {
    filtered = filtered.filter(t => t.status === 'completed');
  } else if (activeTaskFilter.startsWith('priority-')) {
    const prio = activeTaskFilter.replace('priority-', '');
    filtered = filtered.filter(t => t.priority === prio);
  }

  // Subject Filter
  if (activeTaskSubjectFilter !== 'all') {
    filtered = filtered.filter(t => t.subject === activeTaskSubjectFilter);
  }

  // Search Filter
  if (taskSearchQuery) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(taskSearchQuery) || 
                                     (t.desc && t.desc.toLowerCase().includes(taskSearchQuery)));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card">
        <p>No tasks match the active filters. Go ahead and create one!</p>
      </div>
    `;
    return;
  }

  // Sort: Pending first, then High -> Low priority, then date
  filtered.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    const prioWeight = { 'high': 3, 'medium': 2, 'low': 1 };
    if (prioWeight[a.priority] !== prioWeight[b.priority]) {
      return prioWeight[b.priority] - prioWeight[a.priority];
    }
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.dueDate ? -1 : 1;
  });

  filtered.forEach(task => {
    const item = document.createElement("div");
    item.className = `task-item-card ${task.status === 'completed' ? 'completed' : ''}`;
    
    const isChecked = task.status === 'completed' ? 'checked' : '';
    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    
    // Formatting date
    let dateStr = "";
    if (task.dueDate) {
      dateStr = `<div class="meta-item">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>${task.dueDate} ${task.dueTime || ''}</span>
      </div>`;
    }

    item.innerHTML = `
      <div class="task-item-left">
        <div class="task-checkbox-wrapper">
          <input type="checkbox" class="task-checkbox-hidden" ${isChecked} onchange="toggleTaskStatus('${task.id}')">
          <div class="task-checkbox-custom"></div>
        </div>
        <div class="task-details">
          <div class="task-headline">
            <span class="task-title-text">${escapeHTML(task.title)}</span>
            <span class="task-p-badge ${task.priority}">${priorityLabel}</span>
          </div>
          ${task.desc ? `<div class="task-description-text">${escapeHTML(task.desc)}</div>` : ''}
          <div class="task-meta-info">
            <span class="meta-subject">${escapeHTML(task.subject || 'General')}</span>
            ${dateStr}
          </div>
        </div>
      </div>
      <div class="task-actions-row">
        <button class="btn-task-action edit" onclick="openTaskModal('${task.id}')" title="Edit Task">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-task-action delete" onclick="deleteTask('${task.id}')" title="Delete Task">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

function openTaskModal(taskId = null) {
  const modal = document.getElementById("modal-task-form");
  const form = document.getElementById("task-creation-form");
  const modalTitle = document.getElementById("task-modal-title");
  
  form.reset();
  
  if (taskId) {
    modalTitle.textContent = "Edit Study Task";
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      document.getElementById("task-form-id").value = task.id;
      document.getElementById("task-title").value = task.title;
      document.getElementById("task-desc").value = task.desc || "";
      document.getElementById("task-subject").value = task.subject || "";
      document.getElementById("task-priority").value = task.priority;
      document.getElementById("task-due-date").value = task.dueDate || "";
      document.getElementById("task-due-time").value = task.dueTime || "";
    }
  } else {
    modalTitle.textContent = "Create New Task";
    document.getElementById("task-form-id").value = "";
    document.getElementById("task-due-date").value = getTodayDateString();
  }
  
  openModal("modal-task-form");
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  
  const taskId = document.getElementById("task-form-id").value;
  const title = document.getElementById("task-title").value.trim();
  const desc = document.getElementById("task-desc").value.trim();
  const subject = document.getElementById("task-subject").value.trim();
  const priority = document.getElementById("task-priority").value;
  const dueDate = document.getElementById("task-due-date").value;
  const dueTime = document.getElementById("task-due-time").value;

  if (taskId) {
    // Edit existing
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = title;
      task.desc = desc;
      task.subject = subject;
      task.priority = priority;
      task.dueDate = dueDate;
      task.dueTime = dueTime;
      showToast("Task Updated", `Successfully updated details for "${title}".`, "info");
    }
  } else {
    // Add new
    const newTask = {
      id: "task-" + Date.now(),
      title,
      desc,
      subject,
      priority,
      dueDate,
      dueTime,
      status: "pending"
    };
    state.tasks.push(newTask);
    state.stats.focusScore += 5; // Creating a task gets +5 points
    showToast("Task Created", `"${title}" has been scheduled. earned +5 points!`, "success");
  }

  saveStateToLocalStorage();
  closeModal("modal-task-form");
  renderAllViews();
}

function toggleTaskStatus(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    if (task.status === 'pending') {
      task.status = 'completed';
      state.stats.focusScore += 15;
      showToast("Task Completed", `"${task.title}" is finished! +15 points.`, "success");
    } else {
      task.status = 'pending';
      state.stats.focusScore = Math.max(0, state.stats.focusScore - 15);
      showToast("Task Reopened", `"${task.title}" marked as pending.`, "info");
    }
    saveStateToLocalStorage();
    renderAllViews();
  }
}

function deleteTask(taskId) {
  const idx = state.tasks.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    const title = state.tasks[idx].title;
    state.tasks.splice(idx, 1);
    showToast("Task Deleted", `"${title}" has been removed.`, "danger");
    saveStateToLocalStorage();
    renderAllViews();
  }
}

// ==========================================
// 5. Pomodoro Timer Engine
// ==========================================

function setupPomodoroTimer() {
  // Sync state values with form inputs initially
  document.getElementById("input-focus-duration").value = state.settings.focusDuration;
  document.getElementById("input-short-duration").value = state.settings.shortBreakDuration;
  document.getElementById("input-long-duration").value = state.settings.longBreakDuration;

  // Event Listeners
  document.getElementById("btn-timer-play").addEventListener("click", toggleTimerPlayState);
  document.getElementById("btn-timer-reset").addEventListener("click", resetTimer);
  document.getElementById("btn-timer-skip").addEventListener("click", skipTimerMode);
  
  // Timer Mode selector buttons
  const modeBtns = document.querySelectorAll(".timer-modes .mode-btn");
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (timerState.status === 'running') {
        if (!confirm("A focus session is active. Switch mode and reset?")) return;
      }
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const mode = btn.getAttribute("data-mode");
      setTimerMode(mode);
    });
  });

  // Settings Save
  document.getElementById("btn-save-timer-settings").addEventListener("click", (e) => {
    e.preventDefault();
    const focus = parseInt(document.getElementById("input-focus-duration").value) || 25;
    const short = parseInt(document.getElementById("input-short-duration").value) || 5;
    const long = parseInt(document.getElementById("input-long-duration").value) || 15;
    
    state.settings.focusDuration = focus;
    state.settings.shortBreakDuration = short;
    state.settings.longBreakDuration = long;
    
    saveStateToLocalStorage();
    showToast("Timer Configured", "Durations updated successfully.", "success");
    
    if (timerState.status === 'idle') {
      setTimerMode(timerState.currentMode);
    }
  });

  // Initial load config
  setTimerMode('focus');
}

function setTimerMode(mode) {
  timerState.currentMode = mode;
  
  // Clear any existing intervals
  if (timerState.timerIntervalId) {
    clearInterval(timerState.timerIntervalId);
    timerState.timerIntervalId = null;
  }
  
  timerState.status = 'idle';
  
  // Fetch durations in minutes
  const mins = {
    'focus': state.settings.focusDuration,
    'shortBreak': state.settings.shortBreakDuration,
    'longBreak': state.settings.longBreakDuration
  }[mode];

  timerState.timeLeft = mins * 60;
  timerState.totalDuration = mins * 60;
  
  // Update Buttons UI
  document.getElementById("btn-timer-play").classList.remove("active");
  document.getElementById("play-icon").style.display = "block";
  document.getElementById("pause-icon").style.display = "none";
  
  const statusTexts = {
    'focus': 'Time to focus!',
    'shortBreak': 'Short break. Unwind.',
    'longBreak': 'Long break. Rest up.'
  };
  document.getElementById("pomodoro-status-text").textContent = statusTexts[mode];

  // Set mode button class state
  document.querySelectorAll(".timer-modes .mode-btn").forEach(btn => {
    if (btn.getAttribute("data-mode") === mode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  syncTimerUIDisplay();
  renderDashboard();
}

function syncTimerUIDisplay() {
  // Update Display
  document.getElementById("pomodoro-time-display").textContent = formatTime(timerState.timeLeft);
  
  // Circular Progress bar calculation
  const circle = document.getElementById("timer-progress-bar");
  const r = 140;
  const circ = 2 * Math.PI * r; // ~ 879.645
  
  circle.style.strokeDasharray = `${circ}`;
  
  let pct = 0;
  if (timerState.totalDuration > 0) {
    pct = timerState.timeLeft / timerState.totalDuration;
  }
  
  // Invert percent for remaining path (shrinking ring effect)
  const offset = circ - (pct * circ);
  circle.style.strokeDashoffset = `${offset}`;
  
  // Color code based on mode
  if (timerState.currentMode === 'focus') {
    circle.style.stroke = "var(--accent-primary)";
  } else if (timerState.currentMode === 'shortBreak') {
    circle.style.stroke = "var(--accent-secondary)";
  } else {
    circle.style.stroke = "var(--success)";
  }

  // Sync Pomo intervals indicators completed before long break (usually 4 focus blocks)
  const indContainer = document.getElementById("pomo-indicators-container");
  indContainer.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement("span");
    dot.className = `indicator-dot ${i < timerState.completedIntervals ? 'active' : ''}`;
    indContainer.appendChild(dot);
  }
}

function toggleTimerPlayState() {
  if (timerState.status === 'running') {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (timerState.status === 'running') return;
  
  timerState.status = 'running';
  timerState.lastTickTime = Date.now();
  
  // Play/Pause button updates
  document.getElementById("btn-timer-play").classList.add("active");
  document.getElementById("play-icon").style.display = "none";
  document.getElementById("pause-icon").style.display = "block";

  timerState.timerIntervalId = setInterval(() => {
    const now = Date.now();
    const dt = Math.round((now - timerState.lastTickTime) / 1000);
    
    if (dt >= 1) {
      timerState.timeLeft = Math.max(0, timerState.timeLeft - dt);
      timerState.lastTickTime = now;
      
      syncTimerUIDisplay();
      renderDashboard();

      if (timerState.timeLeft <= 0) {
        handleTimerExpiry();
      }
    }
  }, 200);

  showToast("Timer Started", "Focus session has begun.", "info");
}

function pauseTimer() {
  if (timerState.status !== 'running') return;
  
  timerState.status = 'paused';
  if (timerState.timerIntervalId) {
    clearInterval(timerState.timerIntervalId);
    timerState.timerIntervalId = null;
  }
  
  document.getElementById("btn-timer-play").classList.remove("active");
  document.getElementById("play-icon").style.display = "block";
  document.getElementById("pause-icon").style.display = "none";
  
  showToast("Timer Paused", "Focus session suspended.", "warning");
}

function resetTimer() {
  setTimerMode(timerState.currentMode);
  showToast("Timer Reset", "Current interval timer has been reset.", "info");
}

function skipTimerMode() {
  if (timerState.status === 'running') {
    if (!confirm("Skip current interval? Your focus stats won't be saved for this block.")) return;
  }
  
  // Decide next state
  transitionNextTimerState(false);
}

function handleTimerExpiry() {
  pauseTimer();
  playChime();
  transitionNextTimerState(true);
}

function transitionNextTimerState(saveStats = true) {
  if (timerState.currentMode === 'focus') {
    if (saveStats) {
      const addedMins = state.settings.focusDuration;
      state.stats.studyTimeToday += addedMins;
      state.stats.focusScore += addedMins * 2; // +2 focus points per minute of study!
      
      timerState.completedIntervals++;
      saveStateToLocalStorage();
      showToast("Session Complete!", `Awesome! You focused for ${addedMins} mins. Earned +${addedMins * 2} points!`, "success");
    }

    if (timerState.completedIntervals >= 4) {
      timerState.completedIntervals = 0;
      setTimerMode('longBreak');
      showToast("Time for Long Break", "Well deserved break! Grab some water.", "success");
    } else {
      setTimerMode('shortBreak');
      showToast("Time for Short Break", "Take 5 minutes to stretch and relax.", "success");
    }
  } else {
    // Break completed
    setTimerMode('focus');
    showToast("Break Over", "Let's dive back into study mode! Ready?", "info");
  }
  
  renderAllViews();
}

// ==========================================
// 6. Reminder System
// ==========================================

function setupReminderSystem() {
  document.getElementById("btn-toggle-notification").addEventListener("click", () => {
    openModal("modal-reminder-log");
    renderRemindersList();
  });
  
  document.getElementById("btn-close-reminders").addEventListener("click", () => {
    closeModal("modal-reminder-log");
  });

  // Adding reminder
  document.getElementById("btn-add-reminder").addEventListener("click", (e) => {
    e.preventDefault();
    const titleInput = document.getElementById("rem-title-input");
    const timeInput = document.getElementById("rem-time-input");
    
    const title = titleInput.value.trim();
    const timeVal = timeInput.value;
    
    if (!title || !timeVal) {
      showToast("Validation Error", "Please provide a title and date/time.", "danger");
      return;
    }

    const newReminder = {
      id: "rem-" + Date.now(),
      title,
      time: timeVal,
      triggered: false
    };

    state.reminders.push(newReminder);
    saveStateToLocalStorage();
    
    titleInput.value = "";
    timeInput.value = "";
    
    showToast("Reminder Set", `Scheduled: "${title}"`, "success");
    renderRemindersList();
    updateReminderBadge();
  });
}

function updateReminderBadge() {
  const badge = document.getElementById("reminder-badge");
  const pendingRemindersCount = state.reminders.filter(r => !r.triggered).length;
  
  if (pendingRemindersCount > 0) {
    badge.textContent = pendingRemindersCount;
    badge.style.display = "block";
  } else {
    badge.style.display = "none";
  }
}

function renderRemindersList() {
  const container = document.getElementById("scheduled-reminders-list");
  container.innerHTML = "";

  // Sort: Active pending first, then by date/time ascending
  const sorted = [...state.reminders].sort((a, b) => {
    if (a.triggered !== b.triggered) {
      return a.triggered ? 1 : -1;
    }
    return a.time.localeCompare(b.time);
  });

  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No reminders set. Schedule one above!</p></div>`;
    return;
  }

  sorted.forEach(rem => {
    const li = document.createElement("li");
    li.className = "reminder-list-item";
    
    const formatTimeStr = rem.time.replace("T", " ");
    const triggeredBadge = rem.triggered ? `<span class="count-pill success-bg">Triggered</span>` : `<span class="count-pill warning-bg">Pending</span>`;
    
    li.innerHTML = `
      <div>
        <div style="font-weight:600; margin-bottom: 2px;">${escapeHTML(rem.title)}</div>
        <div class="rem-time">${formatTimeStr} ${triggeredBadge}</div>
      </div>
      <button class="btn btn-danger" style="padding: 4px 10px; font-size:11px;" onclick="deleteReminder('${rem.id}')">Delete</button>
    `;
    container.appendChild(li);
  });
}

function deleteReminder(id) {
  const idx = state.reminders.findIndex(r => r.id === id);
  if (idx !== -1) {
    state.reminders.splice(idx, 1);
    saveStateToLocalStorage();
    renderRemindersList();
    updateReminderBadge();
    showToast("Reminder Deleted", "Scheduled notice has been canceled.", "danger");
  }
}

function scanActiveReminders() {
  const now = new Date();
  let stateChanged = false;

  state.reminders.forEach(rem => {
    if (!rem.triggered) {
      const remTime = new Date(rem.time);
      if (now >= remTime) {
        rem.triggered = true;
        stateChanged = true;
        
        // Push notification in app
        showToast("Study Reminder Alert!", rem.title, "warning", 8000);
        playChime();
        
        // Send HTML5 Desktop Notification if authorized
        triggerDesktopNotification("Study Alert!", rem.title);
      }
    }
  });

  if (stateChanged) {
    saveStateToLocalStorage();
    updateReminderBadge();
    renderRemindersList();
  }
}

// Request notification permission on call
function triggerDesktopNotification(title, message) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body: message, icon: "favicon.ico" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body: message });
      }
    });
  }
}

// ==========================================
// 7. Quiz Maker & Player
// ==========================================

function setupQuizMaker() {
  document.getElementById("btn-create-quiz").addEventListener("click", () => {
    openQuizCreationModal();
  });
  document.getElementById("btn-close-quiz-modal").addEventListener("click", () => {
    closeModal("modal-quiz-form");
  });
  document.getElementById("btn-cancel-quiz-form").addEventListener("click", () => {
    closeModal("modal-quiz-form");
  });

  document.getElementById("btn-add-question-to-form").addEventListener("click", () => {
    addQuestionFieldToForm();
  });

  document.getElementById("quiz-creation-form").addEventListener("submit", handleQuizFormSubmit);

  // Play controls
  document.getElementById("btn-close-quiz-player").addEventListener("click", () => {
    if (confirm("Are you sure you want to quit the quiz? Your score will not be saved.")) {
      closeModal("modal-quiz-player");
      activeQuizGame = null;
    }
  });
  document.getElementById("btn-quiz-next-question").addEventListener("click", loadNextQuizQuestion);
  document.getElementById("btn-finish-quiz-game").addEventListener("click", () => {
    closeModal("modal-quiz-player");
    activeQuizGame = null;
    renderQuizzes();
  });
}

function renderQuizzes() {
  const container = document.getElementById("quizzes-grid-container");
  container.innerHTML = "";

  if (state.quizzes.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card span-2" style="grid-column: 1 / -1;">
        <p>No study quizzes available. Click "New Quiz" to build one!</p>
      </div>
    `;
    return;
  }

  state.quizzes.forEach(quiz => {
    const card = document.createElement("div");
    card.className = "card glass-card study-item-card";
    
    const highScoreText = quiz.highScore !== null ? `${quiz.highScore}%` : "No attempts";
    
    card.innerHTML = `
      <div class="study-item-header">
        <span class="study-item-subject">${escapeHTML(quiz.subject || 'Quiz')}</span>
        <button class="btn-task-action delete" onclick="deleteQuiz('${quiz.id}')" title="Delete Quiz">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
      <h3 class="study-item-title">${escapeHTML(quiz.title)}</h3>
      <p class="study-item-desc">Test your understanding with this ${quiz.questions.length} question challenge.</p>
      <div class="study-item-footer">
        <span class="study-item-stat">Best Score: ${highScoreText}</span>
        <button class="btn btn-primary" style="padding: 8px 16px; font-size:12px;" onclick="startQuizPlay('${quiz.id}')">Start Quiz</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openQuizCreationModal() {
  const form = document.getElementById("quiz-creation-form");
  form.reset();
  
  // Clear Questions Container
  const qContainer = document.getElementById("quiz-questions-container");
  qContainer.innerHTML = "";
  
  // Add 1 default question template to start
  addQuestionFieldToForm();
  
  openModal("modal-quiz-form");
}

function addQuestionFieldToForm() {
  const container = document.getElementById("quiz-questions-container");
  const qId = "q-field-" + Date.now();
  const qIndex = container.children.length + 1;
  
  const div = document.createElement("div");
  div.className = "form-question-card";
  div.id = qId;
  
  div.innerHTML = `
    <button type="button" class="btn-remove-dynamic-item" onclick="removeQuestionField('${qId}')">Remove Question</button>
    <div class="form-group" style="margin-bottom: 10px;">
      <label>Question ${qIndex}</label>
      <input type="text" class="question-text-input" required placeholder="e.g. What is force equal to in mechanics?">
    </div>
    <label style="font-size:11px; font-weight:700; color:var(--text-muted);">Options (Check circle for the correct answer)</label>
    <div class="question-options-grid">
      <div class="option-input-wrapper">
        <input type="radio" name="correct-${qId}" value="0" checked>
        <input type="text" class="option-val-input" required placeholder="Option A">
      </div>
      <div class="option-input-wrapper">
        <input type="radio" name="correct-${qId}" value="1">
        <input type="text" class="option-val-input" required placeholder="Option B">
      </div>
      <div class="option-input-wrapper">
        <input type="radio" name="correct-${qId}" value="2">
        <input type="text" class="option-val-input" required placeholder="Option C">
      </div>
      <div class="option-input-wrapper">
        <input type="radio" name="correct-${qId}" value="3">
        <input type="text" class="option-val-input" required placeholder="Option D">
      </div>
    </div>
  `;
  container.appendChild(div);
  
  // Scroll to bottom of pane
  container.scrollTop = container.scrollHeight;
}

function removeQuestionField(qId) {
  const el = document.getElementById(qId);
  if (el) {
    el.remove();
    // Reindex question labels
    const qLabels = document.querySelectorAll("#quiz-questions-container .form-question-card");
    qLabels.forEach((card, idx) => {
      const lbl = card.querySelector(".form-group label");
      if (lbl) lbl.textContent = `Question ${idx + 1}`;
    });
  }
}

function handleQuizFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("quiz-title").value.trim();
  const subject = document.getElementById("quiz-subject").value.trim();
  
  const questionCards = document.querySelectorAll("#quiz-questions-container .form-question-card");
  if (questionCards.length === 0) {
    showToast("Error", "Quiz must have at least one question.", "danger");
    return;
  }

  const questions = [];
  let valid = true;

  questionCards.forEach(card => {
    const qText = card.querySelector(".question-text-input").value.trim();
    const optInputs = card.querySelectorAll(".option-val-input");
    const correctIdxVal = card.querySelector(`input[type="radio"]:checked`).value;
    
    const options = Array.from(optInputs).map(opt => opt.value.trim());
    
    questions.push({
      question: qText,
      options,
      correctIdx: parseInt(correctIdxVal)
    });
  });

  const newQuiz = {
    id: "quiz-" + Date.now(),
    title,
    subject,
    highScore: null,
    questions
  };

  state.quizzes.push(newQuiz);
  state.stats.focusScore += 25; // Creating a quiz gets +25 points
  saveStateToLocalStorage();
  
  closeModal("modal-quiz-form");
  renderQuizzes();
  showToast("Quiz Created", `"${title}" has been added. earned +25 points!`, "success");
}

function deleteQuiz(id) {
  if (!confirm("Are you sure you want to delete this quiz?")) return;
  const idx = state.quizzes.findIndex(q => q.id === id);
  if (idx !== -1) {
    const name = state.quizzes[idx].title;
    state.quizzes.splice(idx, 1);
    saveStateToLocalStorage();
    renderQuizzes();
    showToast("Quiz Deleted", `"${name}" removed.`, "danger");
  }
}

// ==========================================
// Quiz Player Engine
// ==========================================

function startQuizPlay(quizId) {
  const quiz = state.quizzes.find(q => q.id === quizId);
  if (!quiz || quiz.questions.length === 0) return;

  activeQuizGame = {
    quiz,
    currentQuestionIdx: 0,
    score: 0,
    answersLog: [], // tracks user selection
    timeLeft: 15.0, // 15 seconds per question
    timerId: null
  };

  document.getElementById("quiz-player-title").textContent = quiz.title;
  
  // Show game interface, hide summary pane
  document.getElementById("quiz-game-panel").style.display = "block";
  document.getElementById("quiz-action-bar").style.display = "none";
  document.getElementById("quiz-summary-panel").style.display = "none";

  loadQuizQuestion(0);
  openModal("modal-quiz-player");
}

function loadQuizQuestion(idx) {
  if (!activeQuizGame) return;
  
  const question = activeQuizGame.quiz.questions[idx];
  
  document.getElementById("quiz-progress-text").textContent = `Q ${idx + 1}/${activeQuizGame.quiz.questions.length}`;
  document.getElementById("quiz-question-prompt").textContent = question.question;
  
  const optionsList = document.getElementById("quiz-options-list");
  optionsList.innerHTML = "";
  
  question.options.forEach((opt, oIdx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleQuizOptionClick(oIdx));
    optionsList.appendChild(btn);
  });

  // Reset progress bar
  document.getElementById("quiz-timer-fill").style.width = "100%";
  document.getElementById("quiz-action-bar").style.display = "none";
  
  // Start countdown timer (15 seconds)
  activeQuizGame.timeLeft = 15.0;
  if (activeQuizGame.timerId) clearInterval(activeQuizGame.timerId);
  
  activeQuizGame.timerId = setInterval(() => {
    activeQuizGame.timeLeft -= 0.1;
    const pct = Math.max(0, (activeQuizGame.timeLeft / 15.0) * 100);
    document.getElementById("quiz-timer-fill").style.width = `${pct}%`;
    
    if (activeQuizGame.timeLeft <= 0) {
      clearInterval(activeQuizGame.timerId);
      handleQuizQuestionTimeout();
    }
  }, 100);
}

function handleQuizOptionClick(selectedIdx) {
  if (!activeQuizGame) return;
  
  clearInterval(activeQuizGame.timerId);
  
  const currentQ = activeQuizGame.quiz.questions[activeQuizGame.currentQuestionIdx];
  const correctIdx = currentQ.correctIdx;
  
  const optionBtns = document.querySelectorAll("#quiz-options-list .option-btn");
  
  // Freeze clicks
  optionBtns.forEach(btn => btn.style.pointerEvents = "none");
  
  const feedbackText = document.getElementById("quiz-feedback-text");
  
  if (selectedIdx === correctIdx) {
    optionBtns[selectedIdx].classList.add("correct");
    feedbackText.textContent = "Correct! +10 points";
    feedbackText.className = "quiz-feedback-text correct";
    activeQuizGame.score++;
    state.stats.focusScore += 10; // Complete correct answer yields 10 focus points
    playQuizTickChime(true);
  } else {
    optionBtns[selectedIdx].classList.add("wrong");
    optionBtns[correctIdx].classList.add("correct"); // Highlight correct one
    feedbackText.textContent = `Incorrect! The answer is "${currentQ.options[correctIdx]}"`;
    feedbackText.className = "quiz-feedback-text wrong";
    playQuizTickChime(false);
  }

  document.getElementById("quiz-action-bar").style.display = "flex";
}

function handleQuizQuestionTimeout() {
  const currentQ = activeQuizGame.quiz.questions[activeQuizGame.currentQuestionIdx];
  const correctIdx = currentQ.correctIdx;
  
  const optionBtns = document.querySelectorAll("#quiz-options-list .option-btn");
  optionBtns.forEach(btn => btn.style.pointerEvents = "none");
  
  // Highlight correct answer
  optionBtns[correctIdx].classList.add("correct");
  
  const feedbackText = document.getElementById("quiz-feedback-text");
  feedbackText.textContent = "Time's Up!";
  feedbackText.className = "quiz-feedback-text wrong";
  
  playQuizTickChime(false);
  document.getElementById("quiz-action-bar").style.display = "flex";
}

function loadNextQuizQuestion() {
  if (!activeQuizGame) return;
  
  activeQuizGame.currentQuestionIdx++;
  
  if (activeQuizGame.currentQuestionIdx < activeQuizGame.quiz.questions.length) {
    loadQuizQuestion(activeQuizGame.currentQuestionIdx);
  } else {
    // Show summary screen
    showQuizSummary();
  }
}

function showQuizSummary() {
  if (!activeQuizGame) return;
  
  document.getElementById("quiz-game-panel").style.display = "none";
  document.getElementById("quiz-action-bar").style.display = "none";
  
  const total = activeQuizGame.quiz.questions.length;
  const score = activeQuizGame.score;
  const pct = Math.round((score / total) * 100);
  
  document.getElementById("quiz-final-score").textContent = `${pct}%`;
  document.getElementById("quiz-final-fraction").textContent = `(${score} of ${total} questions correct)`;
  
  // Custom feedback messages
  let feedback = "Review the material and try again!";
  if (pct === 100) feedback = "Perfect Score! You are a master of this topic.";
  else if (pct >= 80) feedback = "Excellent job! You have a solid grasp of this material.";
  else if (pct >= 50) feedback = "Good effort! Practice makes perfect.";
  
  document.getElementById("quiz-summary-feedback").textContent = feedback;
  document.getElementById("quiz-summary-panel").style.display = "block";
  
  // Update state stats
  state.stats.totalQuizzesTaken++;
  state.stats.quizTotalCorrect += score;
  state.stats.quizTotalQuestions += total;
  
  // Save High Score
  if (activeQuizGame.quiz.highScore === null || pct > activeQuizGame.quiz.highScore) {
    activeQuizGame.quiz.highScore = pct;
    showToast("New High Score!", `"${activeQuizGame.quiz.title}": ${pct}%!`, "success");
  }
  
  saveStateToLocalStorage();
  renderAllViews();
}

function playQuizTickChime(correct) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    if (correct) {
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    } else {
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    }
    
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// 8. Flashcards Manager & Player
// ==========================================

function setupFlashcards() {
  document.getElementById("btn-create-deck").addEventListener("click", () => {
    openDeckCreationModal();
  });
  document.getElementById("btn-close-deck-modal").addEventListener("click", () => {
    closeModal("modal-deck-form");
  });
  document.getElementById("btn-cancel-deck-form").addEventListener("click", () => {
    closeModal("modal-deck-form");
  });

  document.getElementById("btn-add-card-to-form").addEventListener("click", () => {
    addCardFieldToForm();
  });

  document.getElementById("deck-creation-form").addEventListener("submit", handleDeckFormSubmit);

  // Deck review hooks
  document.getElementById("btn-close-deck-viewer").addEventListener("click", () => {
    if (confirm("Are you sure you want to stop studying this deck?")) {
      closeModal("modal-deck-viewer");
      activeDeckStudy = null;
    }
  });

  // Flipping triggers
  document.getElementById("flashcard-card-object").addEventListener("click", () => {
    const card = document.getElementById("flashcard-card-object");
    card.classList.toggle("flipped");
  });

  document.getElementById("btn-card-failed").addEventListener("click", () => {
    handleFlashcardAnswer(false);
  });
  
  document.getElementById("btn-card-passed").addEventListener("click", () => {
    handleFlashcardAnswer(true);
  });

  document.getElementById("btn-finish-deck-view").addEventListener("click", () => {
    closeModal("modal-deck-viewer");
    activeDeckStudy = null;
    renderDecks();
  });
}

function renderDecks() {
  const container = document.getElementById("decks-grid-container");
  container.innerHTML = "";

  if (state.decks.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card span-2" style="grid-column: 1 / -1;">
        <p>No flashcard decks. Click "New Card Deck" to create one!</p>
      </div>
    `;
    return;
  }

  state.decks.forEach(deck => {
    const card = document.createElement("div");
    card.className = "card glass-card study-item-card";
    
    const timesText = deck.timesReviewed > 0 ? `${deck.timesReviewed} runs` : "Not reviewed";
    
    card.innerHTML = `
      <div class="study-item-header">
        <span class="study-item-subject">${escapeHTML(deck.subject || 'Study')}</span>
        <button class="btn-task-action delete" onclick="deleteDeck('${deck.id}')" title="Delete Deck">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
      <h3 class="study-item-title">${escapeHTML(deck.title)}</h3>
      <p class="study-item-desc">Memorize key terms with this ${deck.cards.length} cards stack.</p>
      <div class="study-item-footer">
        <span class="study-item-stat">Activity: ${timesText}</span>
        <button class="btn btn-primary" style="padding: 8px 16px; font-size:12px;" onclick="startDeckReview('${deck.id}')">Review Deck</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openDeckCreationModal() {
  const form = document.getElementById("deck-creation-form");
  form.reset();

  const container = document.getElementById("deck-cards-container");
  container.innerHTML = "";

  addCardFieldToForm();
  openModal("modal-deck-form");
}

function addCardFieldToForm() {
  const container = document.getElementById("deck-cards-container");
  const cId = "c-field-" + Date.now();
  const cIdx = container.children.length + 1;

  const div = document.createElement("div");
  div.className = "form-card-item";
  div.id = cId;

  div.innerHTML = `
    <button type="button" class="btn-remove-dynamic-item" onclick="removeCardField('${cId}')">Remove Card</button>
    <div style="font-weight:700; font-size:12px; margin-bottom: 8px; color: var(--text-muted);">Card #${cIdx}</div>
    <div class="form-row">
      <div class="form-group col">
        <label>Front side text</label>
        <input type="text" class="card-front-input" required placeholder="e.g. Concept, Term, Question">
      </div>
      <div class="form-group col">
        <label>Back side text</label>
        <input type="text" class="card-back-input" required placeholder="e.g. Definition, Answer, Notes">
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeCardField(cId) {
  const el = document.getElementById(cId);
  if (el) {
    el.remove();
    // Reindex card labels
    const cards = document.querySelectorAll("#deck-cards-container .form-card-item");
    cards.forEach((card, idx) => {
      const lbl = card.querySelector("div");
      if (lbl) lbl.textContent = `Card #${idx + 1}`;
    });
  }
}

function handleDeckFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("deck-title").value.trim();
  const subject = document.getElementById("deck-subject").value.trim();

  const cardItems = document.querySelectorAll("#deck-cards-container .form-card-item");
  if (cardItems.length === 0) {
    showToast("Validation Error", "Deck must have at least one card.", "danger");
    return;
  }

  const cards = [];
  cardItems.forEach(item => {
    const front = item.querySelector(".card-front-input").value.trim();
    const back = item.querySelector(".card-back-input").value.trim();
    cards.push({ front, back });
  });

  const newDeck = {
    id: "deck-" + Date.now(),
    title,
    subject,
    timesReviewed: 0,
    lastScore: null,
    cards
  };

  state.decks.push(newDeck);
  state.stats.focusScore += 20; // Creating a deck rewards 20 points
  saveStateToLocalStorage();

  closeModal("modal-deck-form");
  renderDecks();
  showToast("Deck Created", `"${title}" has been saved. earned +20 points!`, "success");
}

function deleteDeck(id) {
  if (!confirm("Are you sure you want to delete this deck?")) return;
  const idx = state.decks.findIndex(d => d.id === id);
  if (idx !== -1) {
    const name = state.decks[idx].title;
    state.decks.splice(idx, 1);
    saveStateToLocalStorage();
    renderDecks();
    showToast("Deck Deleted", `"${name}" removed.`, "danger");
  }
}

// Study Deck Play Session
function startDeckReview(deckId) {
  const deck = state.decks.find(d => d.id === deckId);
  if (!deck || deck.cards.length === 0) return;

  activeDeckStudy = {
    deck,
    currentIndex: 0,
    correctCount: 0,
    failedCount: 0
  };

  document.getElementById("deck-viewer-title").textContent = deck.title;
  
  // Hide Complete panel, show reviewer
  document.getElementById("flashcard-scene").style.display = "block";
  document.getElementById("deck-feedback-controls").style.display = "flex";
  document.getElementById("deck-complete-panel").style.display = "none";

  loadFlashcard(0);
  openModal("modal-deck-viewer");
}

function loadFlashcard(idx) {
  if (!activeDeckStudy) return;

  const cardObj = activeDeckStudy.deck.cards[idx];
  document.getElementById("deck-progress-text").textContent = `Card ${idx + 1}/${activeDeckStudy.deck.cards.length}`;
  
  // Reset card flipped transform
  const cardElement = document.getElementById("flashcard-card-object");
  cardElement.classList.remove("flipped");

  // Load content sides
  document.getElementById("card-front-content").textContent = cardObj.front;
  document.getElementById("card-back-content").textContent = cardObj.back;
}

function handleFlashcardAnswer(known) {
  if (!activeDeckStudy) return;

  // Track stats
  if (known) {
    activeDeckStudy.correctCount++;
    state.stats.focusScore += 2; // +2 points per correct card!
  } else {
    activeDeckStudy.failedCount++;
  }

  saveStateToLocalStorage();
  updateHeaderFocusScore();

  activeDeckStudy.currentIndex++;

  // Delay slightly to allow cards flip transition
  const cardElement = document.getElementById("flashcard-card-object");
  cardElement.classList.remove("flipped");

  setTimeout(() => {
    if (activeDeckStudy.currentIndex < activeDeckStudy.deck.cards.length) {
      loadFlashcard(activeDeckStudy.currentIndex);
    } else {
      showDeckCompleteSummary();
    }
  }, 300);
}

function showDeckCompleteSummary() {
  if (!activeDeckStudy) return;

  document.getElementById("flashcard-scene").style.display = "none";
  document.getElementById("deck-feedback-controls").style.display = "none";

  document.getElementById("deck-correct-val").textContent = activeDeckStudy.correctCount;
  document.getElementById("deck-failed-val").textContent = activeDeckStudy.failedCount;

  document.getElementById("deck-complete-panel").style.display = "block";

  // Save reviewed counts
  activeDeckStudy.deck.timesReviewed++;
  saveStateToLocalStorage();
  renderAllViews();
}

// ==========================================
// 9. Modals Helper & Notification Alerts
// ==========================================

function setupModals() {
  // Global listener to close modal on overlay background click
  const overlays = document.querySelectorAll(".modal-overlay");
  overlays.forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        // Do not close during active gameplay/study session without warning
        if (overlay.id === 'modal-quiz-player') {
          if (activeQuizGame && confirm("Quit current quiz? Score will be lost.")) {
            closeModal(overlay.id);
            activeQuizGame = null;
          }
        } else if (overlay.id === 'modal-deck-viewer') {
          if (activeDeckStudy && confirm("Quit study deck?")) {
            closeModal(overlay.id);
            activeDeckStudy = null;
          }
        } else {
          closeModal(overlay.id);
        }
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
}

// Premium toast notification alerts
function showToast(title, message, type = 'info', duration = 4000) {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  // Custom icons based on toast alert type
  let svgIcon = "";
  if (type === 'success') {
    svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === 'warning') {
    svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`;
  } else if (type === 'danger') {
    svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else {
    svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon-box">${svgIcon}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHTML(title)}</div>
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
    <button class="toast-close">✕</button>
  `;

  // Bind manual close button
  toast.querySelector(".toast-close").addEventListener("click", () => {
    removeToast(toast);
  });

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    removeToast(toast);
  }, duration);
}

function removeToast(toast) {
  if (toast.parentNode) {
    toast.classList.add("removing");
    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
    // Fallback if transition event fails
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

// Helper: synth audio chimer (C5, E5, G5 chimes)
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playTone = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    playTone(523.25, now, 0.2);       // C5
    playTone(659.25, now + 0.15, 0.2);  // E5
    playTone(783.99, now + 0.3, 0.4);   // G5
  } catch (e) {
    console.error("Synthesizer AudioContext not allowed or supported before interaction:", e);
  }
}

// Utility Helpers
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
