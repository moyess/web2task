/**
 * 滴答清单任务协作系统
 */

// 配置
const CONFIG = {
  API: {
    AUTH_STATUS: '/api/auth-status',
    CREATE_TASK: '/api/create-task',
    REAUTH: '/api/reauth'
  },
  MESSAGE_DURATION: 4000
};

// DOM 元素
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
 * 检查授权状态
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
    console.error('检查授权状态失败:', error);
  }
}

/**
 * 显示消息提示
 */
function showMessage(text, type = 'success') {
  if (!elements.messageBox) return;

  elements.messageBox.textContent = text;
  elements.messageBox.className = type === 'success'
    ? 'mt-6 p-4 rounded-xl bg-black text-white text-center'
    : 'mt-6 p-4 rounded-xl bg-gray-100 text-black text-center border border-gray-300';

  elements.messageBox.classList.remove('hidden');

  setTimeout(() => {
    elements.messageBox.classList.add('hidden');
  }, CONFIG.MESSAGE_DURATION);
}

/**
 * 设置默认日期为今天
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
 * 处理表单提交
 */
async function handleSubmit(event) {
  event.preventDefault();

  if (!elements.submitBtn) return;

  const originalText = elements.submitBtn.textContent;
  elements.submitBtn.disabled = true;
  elements.submitBtn.textContent = '提交中...';

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
      showMessage('任务创建成功', 'success');
      resetForm();
    } else {
      if (response.status === 401) {
        showMessage('授权已过期，正在跳转...', 'error');
        setTimeout(() => window.location.href = '/', 2000);
      } else {
        showMessage(data.message || '创建任务失败', 'error');
      }
    }
  } catch (error) {
    console.error('提交失败:', error);
    showMessage('网络错误', 'error');
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = originalText;
  }
}

/**
 * 重置表单
 */
function resetForm() {
  if (elements.taskForm) {
    elements.taskForm.reset();
    setDefaultDate();
  }
}

/**
 * 处理重新授权
 */
async function handleReauth() {
  if (!confirm('确定要重新授权吗？')) {
    return;
  }

  try {
    const response = await fetch(CONFIG.API.REAUTH, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('重新授权失败:', error);
    showMessage('操作失败', 'error');
  }
}

/**
 * 处理键盘快捷键
 */
function handleKeyboard(event) {
  // Ctrl/Cmd + Enter 提交表单
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (elements.taskForm) {
      elements.taskForm.dispatchEvent(new Event('submit'));
    }
  }
}

/**
 * 检查授权成功消息
 */
function checkAuthSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('authorized') === 'true') {
    showMessage('授权成功', 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/**
 * 初始化应用
 */
function init() {
  checkAuthStatus();
  setDefaultDate();
  checkAuthSuccess();

  if (elements.taskForm) {
    elements.taskForm.addEventListener('submit', handleSubmit);
  }

  if (elements.reauthBtn) {
    elements.reauthBtn.addEventListener('click', handleReauth);
  }

  document.addEventListener('keydown', handleKeyboard);
}

// 启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
