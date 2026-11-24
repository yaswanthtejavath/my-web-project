/**
 * Smart Class Reminder Application Logic
 * Single Page Application with Student & Teacher Portals, Live Countdowns,
 * Pomodoro Focus Timer, Assignments, To-Dos, Calendar, Timetable, and Multi-Tab Synchronization.
 */

// Application State
let appState = {
  role: 'student', // 'student' or 'teacher'
  view: 'dashboard',
  theme: 'dark',
  soundEnabled: true,
  exams: [],
  assignments: [],
  todos: [],
  notifications: [],
  teacherItems: [],
  calendarDate: new Date(),
  todoFilter: 'all',
  assignmentFilter: 'all'
};

// Pomodoro Timer State
let pomodoroState = {
  mode: 'work', // 'work', 'shortBreak', 'longBreak'
  duration: 25 * 60,
  timeLeft: 25 * 60,
  isRunning: false,
  timerId: null,
  completedSessions: 0
};

// BroadcastChannel for instant cross-tab sync
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('smartclass_remind_channel') : null;

// Initial Seed Data Generator
function initSeedData() {
  const now = new Date();
  
  // Future dates for realistic countdowns
  const exam1Date = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000)).toISOString(); // 2 days 5 hrs
  const exam2Date = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000)).toISOString(); // 7 days
  const exam3Date = new Date(now.getTime() + (12 * 24 * 60 * 60 * 1000)).toISOString();

  const defaultExams = [
    {
      id: 'ex-1',
      title: 'Physics Midterm Mechanics Exam',
      datetime: exam1Date,
      category: 'Physics',
      priority: 'Urgent',
      notes: 'Covers Newton Laws, Energy & Momentum. Hall 3B.',
      createdRole: 'teacher'
    },
    {
      id: 'ex-2',
      title: 'Computer Science Data Structures Quiz',
      datetime: exam2Date,
      category: 'Computer Science',
      priority: 'High',
      notes: 'Trees, Graphs, and Hash Tables implementation in JS/C++',
      createdRole: 'teacher'
    },
    {
      id: 'ex-3',
      title: 'Mathematics Linear Algebra Final',
      datetime: exam3Date,
      category: 'Mathematics',
      priority: 'Medium',
      notes: 'Eigenvalues, Vector Spaces, Matrix Transformations.',
      createdRole: 'student'
    }
  ];

  const defaultAssignments = [
    {
      id: 'asg-1',
      title: 'Calculus Problem Set 5',
      subject: 'Mathematics',
      dueDate: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      status: 'pending',
      priority: 'High',
      description: 'Complete exercises 1 to 25 on differential equations.'
    },
    {
      id: 'asg-2',
      title: 'Chemistry Lab Experiment Report',
      subject: 'Chemistry',
      dueDate: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      status: 'pending',
      priority: 'Urgent',
      description: 'Submit titrations lab data analysis with safety graphs.'
    },
    {
      id: 'asg-3',
      title: 'English Literature Essay Draft',
      subject: 'English',
      dueDate: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      status: 'completed',
      priority: 'Medium',
      description: 'Compare theme analysis in Hamlet.'
    }
  ];

  const defaultTodos = [
    { id: 'td-1', title: 'Review Physics Chapter 4 notes', category: 'Study', priority: 'High', completed: false },
    { id: 'td-2', title: 'Practice Pomodoro 50 mins focus block', category: 'Study', priority: 'Medium', completed: true },
    { id: 'td-3', title: 'Organize study group for CS project', category: 'Personal', priority: 'Low', completed: false }
  ];

  const defaultTeacherItems = [
    {
      id: 'tch-1',
      title: 'Physics Midterm Mechanics Exam',
      category: 'Exam',
      priority: 'Urgent',
      date: exam1Date,
      description: 'Covers Newton Laws, Energy & Momentum. Bring scientific calculators.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'tch-2',
      title: 'Chemistry Lab Experiment Report',
      category: 'Assignment',
      priority: 'High',
      date: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      description: 'Submit titrations lab data analysis with safety graphs before 11:59 PM.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  const defaultNotifs = [
    {
      id: 'nt-1',
      title: 'Physics Midterm Mechanics Exam',
      category: 'Exam',
      priority: 'Urgent',
      description: 'Teacher assigned a new exam reminder for Physics.',
      time: 'Just now',
      read: false
    }
  ];

  if (!localStorage.getItem('sc_exams')) localStorage.setItem('sc_exams', JSON.stringify(defaultExams));
  if (!localStorage.getItem('sc_assignments')) localStorage.setItem('sc_assignments', JSON.stringify(defaultAssignments));
  if (!localStorage.getItem('sc_todos')) localStorage.setItem('sc_todos', JSON.stringify(defaultTodos));
  if (!localStorage.getItem('sc_teacherItems')) localStorage.setItem('sc_teacherItems', JSON.stringify(defaultTeacherItems));
  if (!localStorage.getItem('sc_notifications')) localStorage.setItem('sc_notifications', JSON.stringify(defaultNotifs));
}

// Load Data from LocalStorage
function loadData() {
  initSeedData();
  appState.exams = JSON.parse(localStorage.getItem('sc_exams')) || [];
  appState.assignments = JSON.parse(localStorage.getItem('sc_assignments')) || [];
  appState.todos = JSON.parse(localStorage.getItem('sc_todos')) || [];
  appState.teacherItems = JSON.parse(localStorage.getItem('sc_teacherItems')) || [];
  appState.notifications = JSON.parse(localStorage.getItem('sc_notifications')) || [];
  appState.role = localStorage.getItem('sc_role') || 'student';
}

// Save Data to LocalStorage & Dispatch Sync Event
function saveData() {
  localStorage.setItem('sc_exams', JSON.stringify(appState.exams));
  localStorage.setItem('sc_assignments', JSON.stringify(appState.assignments));
  localStorage.setItem('sc_todos', JSON.stringify(appState.todos));
  localStorage.setItem('sc_teacherItems', JSON.stringify(appState.teacherItems));
  localStorage.setItem('sc_notifications', JSON.stringify(appState.notifications));
  localStorage.setItem('sc_role', appState.role);
}

// Web Audio API Audio Chime Synthesizer
function playAudioAlert(type = 'notification') {
  if (!appState.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'notification') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'pomodoro') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4); // G5
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {
    console.log('Audio playback context warning', e);
  }
}

// Show Toast Alert Notification
function showNotificationToast(title, description, priority = 'Medium') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  
  let priorityBorder = 'var(--accent-primary)';
  if (priority === 'Urgent') priorityBorder = 'var(--accent-danger)';
  if (priority === 'High') priorityBorder = 'var(--accent-warning)';

  toast.style.borderLeftColor = priorityBorder;
  toast.innerHTML = `
    <div class="d-flex align-items-start gap-2">
      <i class="fa-solid fa-bell text-indigo fs-5 mt-1"></i>
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong class="text-main">${escapeHtml(title)}</strong>
          <span class="badge badge-priority-${priority.toLowerCase()}">${priority}</span>
        </div>
        <div class="small text-muted mb-0">${escapeHtml(description)}</div>
      </div>
      <button type="button" class="btn-close btn-close-white btn-sm" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;

  toastContainer.appendChild(toast);
  playAudioAlert('notification');

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 6000);
}

// Navigation & View Handler
function switchView(targetView) {
  appState.view = targetView;
  
  // Update sidebar button states
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === targetView) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update panel displays
  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `view-${targetView}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  renderAllViews();
}

// Role Switching Logic (Student vs Teacher)
function switchRole(newRole) {
  appState.role = newRole;
  saveData();
  updateRoleUI();

  if (newRole === 'teacher') {
    switchView('teacher');
    showNotificationToast('Teacher Mode Enabled', 'You can now publish exams, assignments, and alerts directly to all students.', 'High');
  } else {
    switchView('dashboard');
  }
}

function updateRoleUI() {
  const roleBadge = document.getElementById('role-badge');
  if (!roleBadge) return;

  if (appState.role === 'teacher') {
    roleBadge.className = 'role-badge teacher';
    roleBadge.innerHTML = `<i class="fa-solid fa-chalkboard-user me-1"></i> Teacher Portal`;
  } else {
    roleBadge.className = 'role-badge student';
    roleBadge.innerHTML = `<i class="fa-solid fa-user-graduate me-1"></i> Student Portal`;
  }
}

// Render Dashboard View
function renderDashboard() {
  document.getElementById('stat-upcoming-exams').textContent = appState.exams.length;
  document.getElementById('stat-pending-assignments').textContent = appState.assignments.filter(a => a.status === 'pending').length;
  document.getElementById('stat-todos-today').textContent = appState.todos.filter(t => !t.completed).length;

  // Urgent Exam Countdowns on Dashboard
  const dashboardExamContainer = document.getElementById('dashboard-exam-container');
  if (dashboardExamContainer) {
    if (appState.exams.length === 0) {
      dashboardExamContainer.innerHTML = `<div class="text-muted small text-center py-3">No upcoming exams scheduled.</div>`;
    } else {
      const sortedExams = [...appState.exams].sort((a, b) => new Date(a.datetime) - new Date(b.datetime)).slice(0, 3);
      dashboardExamContainer.innerHTML = sortedExams.map(exam => {
        const timeDiff = new Date(exam.datetime) - new Date();
        const days = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        const hours = Math.max(0, Math.floor((timeDiff / (1000 * 60 * 60)) % 24));
        const mins = Math.max(0, Math.floor((timeDiff / 1000 / 60) % 60));

        return `
          <div class="glass-card p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge badge-priority-${exam.priority.toLowerCase()}">${exam.priority}</span>
                <span class="badge bg-secondary text-light">${escapeHtml(exam.category)}</span>
              </div>
              <strong class="text-main d-block">${escapeHtml(exam.title)}</strong>
              <small class="text-muted"><i class="fa-regular fa-clock me-1"></i>${new Date(exam.datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small>
            </div>
            <div class="countdown-box">
              <div class="countdown-num">${days}d ${hours}h ${mins}m</div>
              <div class="countdown-label">Time Remaining</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Dashboard Broadcasts Container
  const broadcastsContainer = document.getElementById('dashboard-broadcasts-container');
  if (broadcastsContainer) {
    if (appState.teacherItems.length === 0) {
      broadcastsContainer.innerHTML = `<div class="text-muted small text-center py-3">No announcements posted yet.</div>`;
    } else {
      broadcastsContainer.innerHTML = appState.teacherItems.slice(0, 3).map(item => `
        <div class="p-3 glass-card rounded-md">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="badge bg-purple" style="background: var(--accent-purple);">${item.category}</span>
            <small class="text-muted">${item.timestamp || 'Today'}</small>
          </div>
          <h6 class="fw-bold mb-1">${escapeHtml(item.title)}</h6>
          <p class="small text-muted mb-0 text-truncate">${escapeHtml(item.description)}</p>
        </div>
      `).join('');
    }
  }
}

// Render Exams View & Real-time Countdown Loop
function renderExams() {
  const examsContainer = document.getElementById('exams-list-container');
  if (!examsContainer) return;

  if (appState.exams.length === 0) {
    examsContainer.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="fa-solid fa-graduation-cap fs-1 opacity-25 mb-3 d-block"></i>
        <h5>No Exams Scheduled</h5>
        <p class="small">Click "Add Personal Exam" above or wait for your teacher to broadcast an exam.</p>
      </div>
    `;
    return;
  }

  examsContainer.innerHTML = appState.exams.map(exam => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card exam-card h-100 d-flex flex-direction-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge badge-priority-${exam.priority.toLowerCase()}">${exam.priority} Priority</span>
            <span class="badge bg-dark border border-secondary text-light">${escapeHtml(exam.category)}</span>
          </div>
          <h5 class="fw-bold mb-2">${escapeHtml(exam.title)}</h5>
          <p class="small text-muted mb-3"><i class="fa-solid fa-location-dot me-1 text-indigo"></i>${escapeHtml(exam.notes || 'No room details specified.')}</p>
        </div>

        <div>
          <div class="countdown-box mb-3 py-2">
            <div class="countdown-num live-countdown" data-datetime="${exam.datetime}">Calculating...</div>
            <div class="countdown-label"><i class="fa-regular fa-calendar-alt me-1"></i>Date: ${new Date(exam.datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <span class="small text-muted">${exam.createdRole === 'teacher' ? '📢 Teacher Assigned' : '👤 Personal Task'}</span>
            <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteExam('${exam.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  updateCountdownTimers();
}

function updateCountdownTimers() {
  document.querySelectorAll('.live-countdown').forEach(elem => {
    const targetTime = new Date(elem.getAttribute('data-datetime')).getTime();
    const now = new Date().getTime();
    const diff = targetTime - now;

    if (diff <= 0) {
      elem.textContent = "OVERDUE / STARTED";
      elem.style.color = "var(--accent-danger)";
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      elem.textContent = `${days}d ${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
  });
}

function deleteExam(id) {
  appState.exams = appState.exams.filter(e => e.id !== id);
  saveData();
  renderExams();
  renderDashboard();
}

// Pomodoro Focus Timer Logic
function setPomodoroMode(mode) {
  pomodoroState.mode = mode;
  document.querySelectorAll('.timer-mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`mode-${mode}`).classList.add('active');

  if (mode === 'work') pomodoroState.duration = 25 * 60;
  if (mode === 'shortBreak') pomodoroState.duration = 5 * 60;
  if (mode === 'longBreak') pomodoroState.duration = 15 * 60;

  pomodoroState.timeLeft = pomodoroState.duration;
  if (pomodoroState.isRunning) togglePomodoroTimer();
  updatePomodoroUI();
}

function togglePomodoroTimer() {
  const toggleBtn = document.getElementById('pomodoro-toggle-btn');

  if (pomodoroState.isRunning) {
    clearInterval(pomodoroState.timerId);
    pomodoroState.isRunning = false;
    toggleBtn.innerHTML = `<i class="fa-solid fa-play me-2"></i> Start Focus`;
    toggleBtn.className = "btn btn-primary btn-lg rounded-pill px-4 shadow-sm";
  } else {
    pomodoroState.isRunning = true;
    toggleBtn.innerHTML = `<i class="fa-solid fa-pause me-2"></i> Pause Session`;
    toggleBtn.className = "btn btn-warning btn-lg rounded-pill px-4 shadow-sm text-dark";

    pomodoroState.timerId = setInterval(() => {
      if (pomodoroState.timeLeft > 0) {
        pomodoroState.timeLeft--;
        updatePomodoroUI();
      } else {
        clearInterval(pomodoroState.timerId);
        pomodoroState.isRunning = false;
        playAudioAlert('pomodoro');
        showNotificationToast('Pomodoro Session Complete!', `Great job! Your ${pomodoroState.mode} timer finished.`, 'High');

        if (pomodoroState.mode === 'work') {
          pomodoroState.completedSessions++;
          document.getElementById('pomodoro-completed-count').textContent = `${pomodoroState.completedSessions} Sessions`;
        }
        toggleBtn.innerHTML = `<i class="fa-solid fa-play me-2"></i> Start Focus`;
        toggleBtn.className = "btn btn-primary btn-lg rounded-pill px-4 shadow-sm";
      }
    }, 1000);
  }
}

function resetPomodoroTimer() {
  if (pomodoroState.isRunning) {
    clearInterval(pomodoroState.timerId);
    pomodoroState.isRunning = false;
  }
  pomodoroState.timeLeft = pomodoroState.duration;
  document.getElementById('pomodoro-toggle-btn').innerHTML = `<i class="fa-solid fa-play me-2"></i> Start Focus`;
  document.getElementById('pomodoro-toggle-btn').className = "btn btn-primary btn-lg rounded-pill px-4 shadow-sm";
  updatePomodoroUI();
}

function updatePomodoroUI() {
  const mins = Math.floor(pomodoroState.timeLeft / 60);
  const secs = pomodoroState.timeLeft % 60;
  const displayStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  const timeElem = document.getElementById('pomodoro-time');
  if (timeElem) timeElem.textContent = displayStr;

  // SVG ring stroke dashoffset (Circle Circumference = 2 * PI * 130 = 816.8)
  const circleProgress = document.getElementById('timer-progress');
  if (circleProgress) {
    const totalCircumference = 816.8;
    const progressOffset = totalCircumference - (pomodoroState.timeLeft / pomodoroState.duration) * totalCircumference;
    circleProgress.style.strokeDashoffset = progressOffset;

    if (pomodoroState.mode === 'work') circleProgress.style.stroke = 'var(--accent-primary)';
    if (pomodoroState.mode === 'shortBreak') circleProgress.style.stroke = 'var(--accent-secondary)';
    if (pomodoroState.mode === 'longBreak') circleProgress.style.stroke = 'var(--accent-purple)';
  }
}

// Render Assignments View
function renderAssignments() {
  const grid = document.getElementById('assignments-grid-container');
  if (!grid) return;

  const filter = document.getElementById('assignment-filter-status') ? document.getElementById('assignment-filter-status').value : 'all';
  let filtered = appState.assignments;
  if (filter !== 'all') filtered = filtered.filter(a => a.status === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted">No assignments matching current filter.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(asg => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card p-4 h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-secondary text-light">${escapeHtml(asg.subject)}</span>
            <span class="badge ${asg.status === 'completed' ? 'bg-success' : 'badge-priority-' + asg.priority.toLowerCase()}">
              ${asg.status === 'completed' ? 'Submitted ✓' : asg.priority + ' Priority'}
            </span>
          </div>
          <h5 class="fw-bold mb-2">${escapeHtml(asg.title)}</h5>
          <p class="small text-muted mb-3">${escapeHtml(asg.description || 'No detailed instructions provided.')}</p>
        </div>

        <div>
          <div class="d-flex justify-content-between align-items-center pt-3 border-top border-secondary">
            <small class="text-muted"><i class="fa-regular fa-calendar me-1"></i>Due: ${asg.dueDate}</small>
            <button class="btn btn-sm ${asg.status === 'completed' ? 'btn-outline-secondary' : 'btn-success'} rounded-pill" onclick="toggleAssignmentStatus('${asg.id}')">
              ${asg.status === 'completed' ? '<i class="fa-solid fa-rotate-left me-1"></i> Undo' : '<i class="fa-solid fa-check me-1"></i> Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleAssignmentStatus(id) {
  appState.assignments = appState.assignments.map(a => {
    if (a.id === id) {
      a.status = a.status === 'completed' ? 'pending' : 'completed';
    }
    return a;
  });
  saveData();
  renderAssignments();
  renderDashboard();
}

// Render To-Do List View
function renderTodos() {
  const container = document.getElementById('todo-items-container');
  if (!container) return;

  let filtered = appState.todos;
  if (appState.todoFilter === 'active') filtered = filtered.filter(t => !t.completed);
  if (appState.todoFilter === 'completed') filtered = filtered.filter(t => t.completed);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-4 text-muted small">No tasks found. Add a task to get started!</div>`;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="task-item ${t.completed ? 'completed' : ''}">
      <div class="custom-checkbox ${t.completed ? 'checked' : ''}" onclick="toggleTodo('${t.id}')">
        ${t.completed ? '<i class="fa-solid fa-check fs-6"></i>' : ''}
      </div>
      <div class="flex-grow-1">
        <span class="task-title fw-semibold text-main d-block">${escapeHtml(t.title)}</span>
        <small class="text-muted">${t.category} • Priority: <span class="text-${t.priority === 'Urgent' ? 'danger' : 'warning'}">${t.priority}</span></small>
      </div>
      <button class="btn btn-sm text-muted border-0" onclick="deleteTodo('${t.id}')"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');
}

function toggleTodo(id) {
  appState.todos = appState.todos.map(t => {
    if (t.id === id) t.completed = !t.completed;
    return t;
  });
  saveData();
  renderTodos();
  renderDashboard();
}

function deleteTodo(id) {
  appState.todos = appState.todos.filter(t => t.id !== id);
  saveData();
  renderTodos();
  renderDashboard();
}

function filterTodos(type, elem) {
  appState.todoFilter = type;
  document.querySelectorAll('#view-todo .btn-group button').forEach(b => b.classList.remove('active'));
  elem.classList.add('active');
  renderTodos();
}

// Render Academic Calendar
function renderCalendar() {
  const grid = document.getElementById('calendar-days-grid');
  const monthDisplay = document.getElementById('cal-month-year-display');
  if (!grid || !monthDisplay) return;

  const year = appState.calendarDate.getFullYear();
  const month = appState.calendarDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  monthDisplay.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  let html = '';

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day-cell other-month"><div class="calendar-date-num">${prevMonthDays - i}</div></div>`;
  }

  const today = new Date();

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

    // Find exams or assignments on this date
    const dayExams = appState.exams.filter(e => e.datetime.startsWith(currentDateStr));
    const dayAsgs = appState.assignments.filter(a => a.dueDate === currentDateStr);

    let eventBadges = '';
    dayExams.forEach(e => {
      eventBadges += `<span class="event-dot-tag bg-danger text-white" title="${escapeHtml(e.title)}">📝 ${escapeHtml(e.category)} Exam</span>`;
    });
    dayAsgs.forEach(a => {
      eventBadges += `<span class="event-dot-tag bg-warning text-dark" title="${escapeHtml(a.title)}">📚 ${escapeHtml(a.subject)} Due</span>`;
    });

    html += `
      <div class="calendar-day-cell ${isToday ? 'today' : ''}">
        <div class="calendar-date-num">${d}</div>
        ${eventBadges}
      </div>
    `;
  }

  grid.innerHTML = html;
}

// Render Timetable & Live Period Highlighter
function renderTimetable() {
  const body = document.getElementById('timetable-body-container');
  if (!body) return;

  const timeSlots = [
    { label: '09:00 AM - 10:00 AM', startHour: 9, endHour: 10 },
    { label: '10:15 AM - 11:15 AM', startHour: 10, endHour: 11 },
    { label: '11:30 AM - 12:30 PM', startHour: 11, endHour: 12 },
    { label: '01:30 PM - 02:30 PM', startHour: 13, endHour: 14 },
    { label: '02:45 PM - 03:45 PM', startHour: 14, endHour: 15 }
  ];

  const schedule = [
    { slot: 0, mon: 'Physics I (Room 101)', tue: 'Mathematics (Room 202)', wed: 'Computer Science (Lab A)', thu: 'Chemistry (Lab B)', fri: 'English Literature' },
    { slot: 1, mon: 'Calculus II', tue: 'Physics Lab', wed: 'Linear Algebra', thu: 'Data Structures', fri: 'Physical Education' },
    { slot: 2, mon: 'Chemistry', tue: 'Computer Science', wed: 'Ethics in Tech', thu: 'Physics I', fri: 'Calculus II' },
    { slot: 3, mon: 'Data Structures', tue: 'English Lit', wed: 'Physics Lab', thu: 'Mathematics', fri: 'Chemistry' },
    { slot: 4, mon: 'Library Study', tue: 'Seminar Class', wed: 'Group Project', thu: 'Tutorial Session', fri: 'Weekly Quiz' }
  ];

  const now = new Date();
  const currentDay = now.getDay(); // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const currentHour = now.getHours();

  body.innerHTML = schedule.map((row, idx) => {
    const slot = timeSlots[idx];
    const isSlotActive = (currentHour >= slot.startHour && currentHour < slot.endHour);

    return `
      <tr>
        <td class="text-muted fw-bold small text-center align-middle">${slot.label}</td>
        <td class="timetable-cell ${isSlotActive && currentDay === 1 ? 'active-period' : ''}"><strong>${row.mon}</strong></td>
        <td class="timetable-cell ${isSlotActive && currentDay === 2 ? 'active-period' : ''}"><strong>${row.tue}</strong></td>
        <td class="timetable-cell ${isSlotActive && currentDay === 3 ? 'active-period' : ''}"><strong>${row.wed}</strong></td>
        <td class="timetable-cell ${isSlotActive && currentDay === 4 ? 'active-period' : ''}"><strong>${row.thu}</strong></td>
        <td class="timetable-cell ${isSlotActive && currentDay === 5 ? 'active-period' : ''}"><strong>${row.fri}</strong></td>
      </tr>
    `;
  }).join('');
}

// Render Teacher Mode View & History
function renderTeacherView() {
  const historyContainer = document.getElementById('teacher-history-container');
  const countElem = document.getElementById('teacher-items-count');

  if (countElem) countElem.textContent = `${appState.teacherItems.length} Broadcasted Items`;

  if (!historyContainer) return;

  if (appState.teacherItems.length === 0) {
    historyContainer.innerHTML = `<div class="text-muted text-center py-4">No published broadcasts yet. Use the form on the left to assign items!</div>`;
    return;
  }

  historyContainer.innerHTML = appState.teacherItems.map(item => `
    <div class="glass-card p-3 border border-secondary">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex gap-2 align-items-center">
          <span class="badge bg-purple" style="background: var(--accent-purple);">${item.category}</span>
          <span class="badge badge-priority-${item.priority.toLowerCase()}">${item.priority}</span>
        </div>
        <button class="btn btn-sm text-danger border-0" onclick="deleteTeacherItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
      <h5 class="fw-bold mb-1">${escapeHtml(item.title)}</h5>
      <p class="small text-muted mb-2">${escapeHtml(item.description)}</p>
      <div class="d-flex justify-content-between align-items-center small text-muted border-top border-secondary pt-2">
        <span><i class="fa-regular fa-clock me-1"></i>Event Date: ${new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
        <span class="text-success"><i class="fa-solid fa-circle-check me-1"></i>Live on Student Portals</span>
      </div>
    </div>
  `).join('');
}

function deleteTeacherItem(id) {
  appState.teacherItems = appState.teacherItems.filter(i => i.id !== id);
  saveData();
  renderTeacherView();
}

// Teacher Portal Form Submission & Multi-Tab Broadcast Dispatcher
function handleTeacherBroadcastSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('teacher-title').value;
  const category = document.getElementById('teacher-category').value;
  const priority = document.getElementById('teacher-priority').value;
  const date = document.getElementById('teacher-date').value;
  const description = document.getElementById('teacher-description').value;

  const newItem = {
    id: 'tch-' + Date.now(),
    title,
    category,
    priority,
    date: new Date(date).toISOString(),
    description,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  appState.teacherItems.unshift(newItem);

  // If Exam category, also push into Exams list
  if (category === 'Exam') {
    appState.exams.unshift({
      id: 'ex-' + Date.now(),
      title,
      datetime: new Date(date).toISOString(),
      category: 'Teacher Broadcast',
      priority,
      notes: description,
      createdRole: 'teacher'
    });
  } else if (category === 'Assignment') {
    appState.assignments.unshift({
      id: 'asg-' + Date.now(),
      title,
      subject: 'Teacher Broadcast',
      dueDate: new Date(date).toISOString().split('T')[0],
      status: 'pending',
      priority,
      description
    });
  }

  // Push to notifications
  const newNotif = {
    id: 'nt-' + Date.now(),
    title,
    category,
    priority,
    description: `Teacher posted a new ${category}: ${title}`,
    time: 'Just now',
    read: false
  };
  appState.notifications.unshift(newNotif);

  saveData();

  // Send cross-tab broadcast message via BroadcastChannel
  if (syncChannel) {
    syncChannel.postMessage({
      type: 'TEACHER_BROADCAST',
      item: newItem,
      notif: newNotif
    });
  }

  // Show local toast alert
  showNotificationToast(`📢 Broadcast Published!`, `${category}: ${title}`, priority);

  // Reset Form
  document.getElementById('teacher-broadcast-form').reset();
  renderTeacherView();
  renderAllViews();
}

// Render Notifications Bell Dropdown List
function renderNotifications() {
  const container = document.getElementById('notif-list-container');
  const badgeCount = document.getElementById('notif-badge-count');

  if (!container || !badgeCount) return;

  const unreadCount = appState.notifications.filter(n => !n.read).length;
  badgeCount.textContent = unreadCount;
  badgeCount.style.display = unreadCount > 0 ? 'flex' : 'none';

  if (appState.notifications.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted small">
        <i class="fa-regular fa-bell-slash fs-3 d-block mb-2 opacity-50"></i>
        No new announcements or reminders yet.
      </div>
    `;
    return;
  }

  container.innerHTML = appState.notifications.map(n => `
    <div class="p-2 border-bottom border-secondary rounded hover-bg mb-1">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span class="badge bg-purple" style="font-size:0.65rem;">${n.category}</span>
        <small class="text-muted" style="font-size:0.68rem;">${n.time}</small>
      </div>
      <strong class="d-block small text-main">${escapeHtml(n.title)}</strong>
      <p class="mb-0 text-muted" style="font-size:0.75rem;">${escapeHtml(n.description)}</p>
    </div>
  `).join('');
}

// Render All Views Helper
function renderAllViews() {
  renderDashboard();
  renderExams();
  renderAssignments();
  renderTodos();
  renderCalendar();
  renderTimetable();
  renderTeacherView();
  renderNotifications();

  // Update navigation badges
  const examBadge = document.getElementById('exam-badge-count');
  if (examBadge) examBadge.textContent = appState.exams.length;

  const asgBadge = document.getElementById('assignment-badge-count');
  if (asgBadge) asgBadge.textContent = appState.assignments.filter(a => a.status === 'pending').length;
}

// Utility: HTML Escaper
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Global Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateRoleUI();
  updatePomodoroUI();
  renderAllViews();

  // Navigation sidebar button handlers
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  // Teacher broadcast form submit
  const teacherForm = document.getElementById('teacher-broadcast-form');
  if (teacherForm) teacherForm.addEventListener('submit', handleTeacherBroadcastSubmit);

  // Quick Pomodoro button from Dashboard
  const quickPomoBtn = document.getElementById('quick-pomodoro-btn');
  if (quickPomoBtn) quickPomoBtn.addEventListener('click', () => switchView('pomodoro'));

  // Personal Exam Form Submit
  const examForm = document.getElementById('add-exam-form');
  if (examForm) {
    examForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('exam-title').value;
      const datetime = document.getElementById('exam-datetime').value;
      const category = document.getElementById('exam-category').value;
      const priority = document.getElementById('exam-priority').value;
      const notes = document.getElementById('exam-notes').value;

      appState.exams.unshift({
        id: 'ex-' + Date.now(),
        title,
        datetime: new Date(datetime).toISOString(),
        category,
        priority,
        notes,
        createdRole: 'student'
      });

      saveData();
      renderExams();
      renderDashboard();
      showNotificationToast('Exam Reminder Saved', `${title} set for ${new Date(datetime).toLocaleDateString()}`);
      examForm.reset();
    });
  }

  // To-Do Form Submit
  const todoForm = document.getElementById('add-todo-form');
  if (todoForm) {
    todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('todo-title-input').value;
      const category = document.getElementById('todo-category-input').value;
      const priority = document.getElementById('todo-priority-input').value;

      appState.todos.unshift({
        id: 'td-' + Date.now(),
        title,
        category,
        priority,
        completed: false
      });

      saveData();
      renderTodos();
      renderDashboard();
      todoForm.reset();
    });
  }

  // Pomodoro controls
  document.getElementById('pomodoro-toggle-btn').addEventListener('click', togglePomodoroTimer);
  document.getElementById('pomodoro-reset-btn').addEventListener('click', resetPomodoroTimer);

  // Sound toggle button
  document.getElementById('pomodoro-sound-toggle').addEventListener('click', function() {
    appState.soundEnabled = !appState.soundEnabled;
    this.innerHTML = appState.soundEnabled 
      ? `<i class="fa-solid fa-volume-high text-success me-1"></i> Enabled`
      : `<i class="fa-solid fa-volume-xmark text-muted me-1"></i> Muted`;
  });

  // Calendar month navigation
  document.getElementById('cal-prev-month').addEventListener('click', () => {
    appState.calendarDate.setMonth(appState.calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('cal-next-month').addEventListener('click', () => {
    appState.calendarDate.setMonth(appState.calendarDate.getMonth() + 1);
    renderCalendar();
  });

  // Clear notifications button
  document.getElementById('clear-notifs-btn').addEventListener('click', () => {
    appState.notifications = [];
    saveData();
    renderNotifications();
  });

  // Theme toggle
  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('theme-icon').className = newTheme === 'dark' ? 'fa-solid fa-moon text-warning fs-5' : 'fa-solid fa-sun text-warning fs-5';
  });

  // Live timer interval for exam countdowns & timetable clock
  setInterval(() => {
    updateCountdownTimers();
    const clockElem = document.getElementById('timetable-live-clock');
    if (clockElem) clockElem.textContent = new Date().toLocaleTimeString();
  }, 1000);

  // Multi-tab Listener via BroadcastChannel & Storage Event
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'TEACHER_BROADCAST') {
        loadData();
        renderAllViews();
        showNotificationToast(`🔔 New Teacher Broadcast!`, `${event.data.item.category}: ${event.data.item.title}`, event.data.item.priority);
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key.startsWith('sc_')) {
      loadData();
      renderAllViews();
    }
  });
});
