const STORAGE_KEY = 'thiranex-todo-list';
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-button');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedButton = document.getElementById('clear-completed');

let tasks = [];
let activeFilter = 'all';

function loadTasks() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  tasks = saved ? JSON.parse(saved) : [];
}

function saveTasks() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  if (activeFilter === 'active') {
    return tasks.filter((task) => !task.completed);
  }
  if (activeFilter === 'completed') {
    return tasks.filter((task) => task.completed);
  }
  return tasks;
}

function updateRemainingCount() {
  const remaining = tasks.filter((task) => !task.completed).length;
  remainingCount.textContent = `${remaining} item${remaining === 1 ? '' : 's'} left`;
}

function setActiveFilterButton() {
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === activeFilter);
  });
}

function createTaskElement(task) {
  const listItem = document.createElement('li');
  listItem.className = 'task-item';
  listItem.dataset.id = task.id;
  if (task.completed) {
    listItem.classList.add('completed');
  }

  listItem.innerHTML = `
    <label class="checkbox-label">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} />
    </label>
    <p class="task-title" tabindex="0">${escapeHtml(task.title)}</p>
    <div class="task-controls">
      <button type="button" class="task-edit" title="Edit task">✎</button>
      <button type="button" class="task-delete" title="Delete task">✕</button>
    </div>
  `;

  return listItem;
}

function renderTasks() {
  taskList.innerHTML = '';
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No tasks here. Add one to get started.';
    taskList.appendChild(emptyState);
  } else {
    const fragment = document.createDocumentFragment();
    filteredTasks.forEach((task) => fragment.appendChild(createTaskElement(task)));
    taskList.appendChild(fragment);
  }

  updateRemainingCount();
  setActiveFilterButton();
}

function addTask(title) {
  const trimmed = title.trim();
  if (!trimmed) return;
  tasks.unshift({
    id: Date.now().toString(),
    title: trimmed,
    completed: false,
  });
  saveTasks();
  renderTasks();
}

function toggleTaskCompletion(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function editTask(taskId, newTitle) {
  const trimmed = newTitle.trim();
  if (!trimmed) {
    deleteTask(taskId);
    return;
  }
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, title: trimmed } : task
  );
  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function handleTaskListClick(event) {
  const item = event.target.closest('li.task-item');
  if (!item) return;
  const taskId = item.dataset.id;

  if (event.target.matches('.task-checkbox')) {
    toggleTaskCompletion(taskId);
    return;
  }

  if (event.target.matches('.task-delete')) {
    deleteTask(taskId);
    return;
  }

  if (event.target.matches('.task-edit') || event.target.matches('.task-title')) {
    startEditingTask(item, taskId);
    return;
  }
}

function startEditingTask(item, taskId) {
  const task = tasks.find((taskItem) => taskItem.id === taskId);
  if (!task) return;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'task-title-input';
  editInput.value = task.title;

  const titleElement = item.querySelector('.task-title');
  titleElement.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  const finishEditing = () => {
    editTask(taskId, editInput.value);
  };

  editInput.addEventListener('blur', finishEditing, { once: true });
  editInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      finishEditing();
    }
    if (event.key === 'Escape') {
      renderTasks();
    }
  });
}

function escapeHtml(text) {
  const span = document.createElement('span');
  span.textContent = text;
  return span.innerHTML;
}

function handleFilterChange(event) {
  const button = event.target.closest('.filter-button');
  if (!button) return;
  activeFilter = button.dataset.filter;
  renderTasks();
}

function handleFormSubmit(event) {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
}

function init() {
  loadTasks();
  renderTasks();

  taskForm.addEventListener('submit', handleFormSubmit);
  taskList.addEventListener('click', handleTaskListClick);
  taskList.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('.task-title')) {
      startEditingTask(event.target.closest('li.task-item'), event.target.closest('li.task-item').dataset.id);
    }
  });
  document.querySelector('.filters').addEventListener('click', handleFilterChange);
  clearCompletedButton.addEventListener('click', clearCompletedTasks);
}

init();
