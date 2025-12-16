/**
 * Task Submission System
 * Dida365 Integration
 */

// Configuration
const CONFIG = {
  API: {
    AUTH_STATUS: '/api/auth-status',
    CREATE_TASK: '/api/create-task',
    REAUTH: '/api/reauth'
  },
  MESSAGE_DURATION: 5000
};

// DOM Elements
const elements = {
  authWarning: document.getElementById('authWarning'),
  taskForm: document.getElementById('taskForm'),
  submitBtn: document.getElementById('submitBtn'),
  reauthBtn: document.getElementById('reauthBtn'),
  messageBox: document.getElementById('message'),
  title: document.getElementById('title'),
  priority: document.getElementById('priority'),
  dueDate: document.getElementById('dueDate'),
  content: document.getElementById('content')
};

/**
 * Check authorization status
 */
async function checkAuthStatus() {
  try {
    const response = await fetch(CONFIG.API.AUTH_STATUS);
    const data = await response.json();

    if (!data.authorized && elements.authWarning) {
      elements.authWarning.style.display = 'block';
      if (elements.taskForm) {
        elements.taskForm.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Authorization check failed:', error);
  }
}

/**
 * Display message to user
 */
function showMessage(text, type = 'success') {
  if (!elements.messageBox) return;

  elements.messageBox.textContent = text;
  elements.messageBox.className = `message-box ${type} show`;

  setTimeout(() => {
    elements.messageBox.classList.remove('show');
  }, CONFIG.MESSAGE_DURATION);
}

/**
 * Set default date to today
 */
function setDefaultDate() {
  if (!elements.dueDate) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  elements.dueDate.value = `${year}-${month}-${day}`;
}

/**
 * Handle form submission
 */
async function handleSubmit(event) {
  event.preventDefault();

  if (!elements.submitBtn) return;

  const originalHTML = elements.submitBtn.innerHTML;
  elements.submitBtn.disabled = true;
  elements.submitBtn.innerHTML = '<span>Submitting...</span>';

  const formData = {
    title: elements.title.value.trim(),
    priority: elements.priority.value,
    dueDate: elements.dueDate.value,
    content: elements.content.value.trim()
  };

  try {
    const response = await fetch(CONFIG.API.CREATE_TASK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      showMessage('Task created successfully', 'success');
      resetForm();
    } else {
      if (response.status === 401) {
        showMessage('Authorization expired. Redirecting...', 'error');
        setTimeout(() => window.location.href = '/', 2000);
      } else {
        showMessage(data.message || 'Failed to create task', 'error');
      }
    }
  } catch (error) {
    console.error('Submission failed:', error);
    showMessage('Network error. Please try again', 'error');
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = originalHTML;
  }
}

/**
 * Reset form to initial state
 */
function resetForm() {
  if (elements.taskForm) {
    elements.taskForm.reset();
    setDefaultDate();
  }
}

/**
 * Handle re-authorization
 */
async function handleReauth() {
  if (!confirm('Clear current authorization and re-authorize?')) {
    return;
  }

  try {
    const response = await fetch(CONFIG.API.REAUTH, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Re-authorization failed:', error);
    showMessage('Operation failed', 'error');
  }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboard(event) {
  // Ctrl/Cmd + Enter to submit
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (elements.taskForm) {
      elements.taskForm.dispatchEvent(new Event('submit'));
    }
  }
}

/**
 * Check for authorization success message
 */
function checkAuthSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('authorized') === 'true') {
    showMessage('Authorization successful', 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/**
 * Initialize application
 */
function init() {
  // Check authorization status
  checkAuthStatus();

  // Set default date
  setDefaultDate();

  // Check for success message
  checkAuthSuccess();

  // Event listeners
  if (elements.taskForm) {
    elements.taskForm.addEventListener('submit', handleSubmit);
  }

  if (elements.reauthBtn) {
    elements.reauthBtn.addEventListener('click', handleReauth);
  }

  document.addEventListener('keydown', handleKeyboard);
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
