//ui helpers to show/hide forms if user is logged in/not logged in

const showApp = () => {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
};

const showAuth = () => {
  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('authContainer').classList.remove('hidden');
};

// helper function to show username of logged in user
const updateWelcomeMessage = (username) => {
  document.getElementById('welcomeUser').textContent = username;
};

//task functions

// load & display tasks for logged in user
const loadTasks = async () => {
  const response = await fetch('/tasks');
  if (!response.ok) {
    showAuth();
    return;
  }

  const tasks = await response.json();
  const taskTableBody = document.getElementById('taskTableBody');
  taskTableBody.innerHTML = '';

  tasks.forEach(task => {
    const row = document.createElement('tr');
    const priorities = ["Urgent", "High", "Medium", "Low"];
    const optionsHtml = priorities.map(p =>
        `<option value="${p}" ${task.priority === p ? 'selected' : ''}>${p}</option>`
    ).join('');

    const createdDate = new Date(task.dateCreated).toLocaleDateString();
    const deadlineDate = new Date(task.suggestedDeadline).toLocaleDateString();

    row.innerHTML = `
      <td>${task.task}</td>
      <td>
        <select class="priority-select" aria-label="Change task priority" data-id="${task._id}">${optionsHtml}</select> <!-- dropdown to update task priority -->
      </td>
      <td>${createdDate}</td>
      <td>${deadlineDate}</td>
      <td>
            <input type="checkbox" class="complete-checkbox" aria-label="Mark task as complete" data-id="${task._id}">
      </td>
    `;
    taskTableBody.appendChild(row);
  });
};

// task submission
const submit = async (event) => {
  event.preventDefault();
  const taskInput = document.getElementById("task");
  const priorityInput = document.querySelector('input[name="priority"]:checked');

  if (taskInput.value.trim() !== "") {
    await fetch("/submit", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: taskInput.value,
        priority: priorityInput.value
      })
    });
    taskInput.value = "";
    loadTasks();
  }
};

// task deletion
const completeTask = async (event) => {
  if (event.target.classList.contains('complete-checkbox')) {
    const taskId = event.target.dataset.id;
    await fetch("/delete", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId })
    });
    loadTasks();
  }
};

// task updating
const updatePriority = async (event) => {
  if (event.target.classList.contains('priority-select')) {
    const taskId = event.target.dataset.id;
    const newPriority = event.target.value;
    await fetch("/update", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, priority: newPriority })
    });
    loadTasks();
  }
};

// user authentication

// reigstration form submission
const handleRegister = async (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const responseData = await response.json();
    updateWelcomeMessage(responseData.username);
    showApp();
    loadTasks();
  } else {
    alert('Registration failed! The username may be taken.');
  }
};

//login form submission
const handleLogin = async (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const responseData = await response.json();
    updateWelcomeMessage(responseData.username);
    showApp();
    loadTasks();
  } else {
    alert('Login failed! Please check your username and password.');
  }
};

// Handles the logout button click
const handleLogout = async () => {
  const response = await fetch('/logout', { method: 'POST' });
  if (response.ok) {
    showAuth();
  } else {
    alert('Logout failed!');
  }
};

// main setup
window.onload = () => {

  const setupEventListeners = () => {
    // auth view
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.onsubmit = handleLogin;

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.onsubmit = handleRegister;

    // app view
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.onclick = handleLogout;

    const todoForm = document.getElementById("todoForm");
    if (todoForm) todoForm.onsubmit = submit;

    const taskTableBody = document.getElementById('taskTableBody');
    if (taskTableBody) {
      taskTableBody.onclick = completeTask;
      taskTableBody.onchange = updatePriority;
    }
  };

  const checkLoginStatus = async () => {
    const response = await fetch('/api/session/status');
    const data = await response.json();

    if (data.loggedIn) {
      updateWelcomeMessage(data.username);
      showApp();
      loadTasks();
    } else {
      showAuth();
    }

    setupEventListeners();
  };

  // start
  checkLoginStatus();
};