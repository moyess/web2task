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

  // 添加震动效果（如果设备支持）
  if ('vibrate' in navigator) {
    navigator.vibrate(type === 'success' ? 100 : [100, 50, 100]);
  }

  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 5000);
}

// 设置默认日期为今天
function setDefaultDate() {
  const dueDateInput = document.getElementById('dueDate');
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  dueDateInput.value = `${year}-${month}-${day}`;
}

// 添加输入验证和视觉反馈
function setupInputValidation() {
  const titleInput = document.getElementById('title');

  titleInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length > 0) {
      e.target.style.borderColor = 'var(--success-color)';
    } else {
      e.target.style.borderColor = '';
    }
  });
}

// 处理表单提交
document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const originalHTML = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 6v6l4 2"></path>
    </svg>
    提交中...
  `;

  const formData = {
    title: document.getElementById('title').value.trim(),
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('dueDate').value,
    content: document.getElementById('content').value.trim()
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
      showMessage('✓ 任务创建成功！已添加到滴答清单', 'success');

      // 添加成功动画效果
      const form = document.getElementById('taskForm');
      form.style.transform = 'scale(0.98)';
      setTimeout(() => {
        form.style.transform = 'scale(1)';
      }, 200);

      // 重置表单
      document.getElementById('taskForm').reset();
      setDefaultDate(); // 重新设置默认日期

      // 重置输入框边框颜色
      document.getElementById('title').style.borderColor = '';
    } else {
      if (response.status === 401) {
        showMessage('⚠ 授权已过期，正在跳转到授权页面...', 'error');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showMessage('✗ ' + (data.message || '创建任务失败，请稍后重试'), 'error');
      }
    }
  } catch (error) {
    console.error('提交失败:', error);
    showMessage('✗ 网络错误，请检查连接后重试', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
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
        showMessage('正在跳转到授权页面...', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (error) {
      console.error('重新授权失败:', error);
      showMessage('操作失败，请稍后重试', 'error');
    }
  }
});

// 添加键盘快捷键支持
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter 提交表单
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('taskForm').dispatchEvent(new Event('submit'));
  }
});

// 检查URL参数，显示授权成功消息
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('authorized') === 'true') {
  showMessage('✓ 授权成功！现在可以提交任务了', 'success');
  // 清除URL参数
  window.history.replaceState({}, document.title, window.location.pathname);
}

// 添加旋转动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  #taskForm {
    transition: transform 0.2s ease;
  }
`;
document.head.appendChild(style);

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setDefaultDate();
  setupInputValidation();

  // 添加淡入动画
  document.querySelector('.form-card').style.animation = 'fadeInUp 0.6s ease-out';
});

// 添加表单字段的焦点效果
document.querySelectorAll('input, select, textarea').forEach(element => {
  element.addEventListener('focus', function() {
    this.parentElement.style.transform = 'translateX(2px)';
  });

  element.addEventListener('blur', function() {
    this.parentElement.style.transform = 'translateX(0)';
  });
});
