// 检查授权状态
async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth-status');
    const data = await response.json();

    if (!data.authorized) {
      document.getElementById('authWarning').style.display = 'block';
      document.getElementById('taskForm').style.display = 'none';
    }
  } catch (error) {
    console.error('检查授权状态失败:', error);
  }
}

// 显示消息
function showMessage(message, type = 'success') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.className = `message ${type} show`;

  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 5000);
}

// 设置默认日期为明天
function setDefaultDate() {
  const dueDateInput = document.getElementById('dueDate');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');

  dueDateInput.value = `${year}-${month}-${day}`;
}

// 处理表单提交
document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '提交中...';

  const formData = {
    title: document.getElementById('title').value,
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('dueDate').value,
    content: document.getElementById('content').value
  };

  try {
    const response = await fetch('/api/create-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      showMessage('任务创建成功！已添加到滴答清单', 'success');

      // 重置表单
      document.getElementById('taskForm').reset();
      setDefaultDate(); // 重新设置默认日期
    } else {
      if (response.status === 401) {
        showMessage('授权已过期，请重新授权', 'error');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showMessage(data.message || '创建任务失败，请稍后重试', 'error');
      }
    }
  } catch (error) {
    console.error('提交失败:', error);
    showMessage('网络错误，请检查连接后重试', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 11 12 14 22 4"></polyline>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
      提交任务
    `;
  }
});

// 重新授权按钮
document.getElementById('reauthBtn').addEventListener('click', async () => {
  if (confirm('确定要重新授权吗？这将清除当前的授权信息。')) {
    try {
      const response = await fetch('/api/reauth', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('重新授权失败:', error);
      showMessage('操作失败，请稍后重试', 'error');
    }
  }
});

// 检查URL参数，显示授权成功消息
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('authorized') === 'true') {
  showMessage('授权成功！现在可以提交任务了', 'success');
  // 清除URL参数
  window.history.replaceState({}, document.title, window.location.pathname);
}

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setDefaultDate();
});
