/* =========================================
   Ahmed Batity ERP - UI Manager
   ========================================= */

const UI = {
  /**
   * Initialize UI
   */
  init() {
    this.initSidebar();
    this.initTopbar();
    this.initNotifications();
    this.initLoginForm();
  },

  /**
   * إخفاء عناصر القائمة الجانبية التي لا يملك المستخدم الحالي صلاحية عرضها.
   * تُستدعى بعد كل تسجيل دخول (نجاح جديد أو جلسة محفوظة).
   */
  applySidebarPermissions() {
    if (typeof Auth === 'undefined' || !Auth.user) return;

    // إظهار/إخفاء كل رابط صفحة حسب صلاحية العرض الخاصة به
    document.querySelectorAll('.sidebar-nav a[data-page]').forEach(link => {
      const page = link.dataset.page;
      const allowed = Auth.hasPermission(page, CONFIG.PERMISSIONS.VIEW);
      const li = link.closest('li');
      if (li) li.style.display = allowed ? '' : 'none';
    });

    // إخفاء أي مجموعة (قائمة فرعية) بالكامل لو كل روابطها الداخلية مخفية
    document.querySelectorAll('.sidebar-nav .nav-item.has-submenu').forEach(parentLi => {
      const subLinks = parentLi.querySelectorAll('.submenu a[data-page]');
      if (subLinks.length === 0) return;
      const anyVisible = Array.from(subLinks).some(link => {
        const li = link.closest('li');
        return li && li.style.display !== 'none';
      });
      parentLi.style.display = anyVisible ? '' : 'none';
    });
  },

  /**
   * Initialize sidebar
   */
  initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // Submenu toggles
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = toggle.closest('.nav-item');
        parent.classList.toggle('open');
      });
    });

    // Mobile toggle
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
      });
    }

    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.remove('show');
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const confirmed = await UI.confirm('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟');
        if (confirmed) {
          Auth.logout();
        }
      });
    }

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && 
          !sidebar.contains(e.target) && 
          !menuToggle.contains(e.target) && 
          sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
      }
    });
  },

  /**
   * Initialize topbar
   */
  initTopbar() {
    // Fullscreen toggle
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });
    }
  },

  /**
   * Initialize notifications
   */
  initNotifications() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsPanel = document.getElementById('notifications-panel');
    const markAllRead = document.getElementById('mark-all-read');

    if (notificationsBtn && notificationsPanel) {
      notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationsPanel.classList.toggle('show');
        this.loadNotifications();
      });

      document.addEventListener('click', (e) => {
        if (!notificationsPanel.contains(e.target) && !notificationsBtn.contains(e.target)) {
          notificationsPanel.classList.remove('show');
        }
      });
    }

    if (markAllRead) {
      markAllRead.addEventListener('click', () => {
        this.markAllNotificationsRead();
      });
    }
  },

  /**
   * Initialize login form
   */
  initLoginForm() {
    const loginForm = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    if (togglePassword) {
      togglePassword.addEventListener('click', () => {
        const passwordInput = document.getElementById('login-password');
        const icon = togglePassword.querySelector('i');

        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
          passwordInput.type = 'password';
          icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        const result = await Auth.login(email, password, rememberMe);

        if (result.success) {
          Router.hideLogin();
          UI.applySidebarPermissions();
          Router.navigate('dashboard');
        }
      });
    }

    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showForgotPasswordModal();
      });
    }

    this.initResetPasswordForm();
  },

  /**
   * Initialize reset password form (الشاشة المفتوحة من رابط البريد الإلكتروني)
   */
  initResetPasswordForm() {
    const resetForm = document.getElementById('reset-password-form');
    const backToLoginLink = document.getElementById('back-to-login-link');

    if (resetForm) {
      resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('reset-new-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;

        if (newPassword.length < 8) {
          UI.showToast('كلمة المرور يجب ألا تقل عن 8 أحرف', 'error');
          return;
        }
        if (newPassword !== confirmPassword) {
          UI.showToast('كلمتا المرور غير متطابقتين', 'error');
          return;
        }

        const token = this._currentResetToken;
        if (!token) {
          UI.showToast('رابط إعادة التعيين غير صالح', 'error');
          return;
        }

        const result = await Auth.resetPassword(token, newPassword);
        if (result.success) {
          Router.hideResetPassword();
          window.location.hash = '';
          Router.showLogin();
        }
      });
    }

    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        Router.hideResetPassword();
        window.location.hash = '';
        Router.showLogin();
      });
    }
  },

  /**
   * Show forgot password modal
   */
  showForgotPasswordModal() {
    Swal.fire({
      title: 'نسيت كلمة المرور',
      input: 'email',
      inputLabel: 'أدخل بريدك الإلكتروني',
      inputPlaceholder: 'name@example.com',
      showCancelButton: true,
      confirmButtonText: 'إرسال',
      cancelButtonText: 'إلغاء',
      inputValidator: (value) => {
        if (!value) return 'يرجى إدخال البريد الإلكتروني';
        if (!Utils.isValidEmail(value)) return 'البريد الإلكتروني غير صحيح';
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Auth.forgotPassword(result.value);
      }
    });
  },

  /**
   * Show loading overlay
   */
  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  /**
   * Show skeleton loading
   */
  showSkeleton() {
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.style.display = 'block';
  },

  /**
   * Hide skeleton loading
   */
  hideSkeleton() {
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.style.display = 'none';
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const titles = {
      success: 'نجاح',
      error: 'خطأ',
      warning: 'تحذير',
      info: 'معلومة'
    };

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type]}"></i>
      <div class="toast-content">
        <h6>${titles[type]}</h6>
        <p>${message}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  /**
   * Show confirmation dialog
   */
  async confirm(title, text, confirmText = 'نعم', cancelText = 'إلغاء') {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#B3403A',
      reverseButtons: true
    });

    return result.isConfirmed;
  },

  /**
   * يبني قائمة إشعارات حقيقية مبنية على حالة النظام الفعلية:
   * منتجات منخفضة المخزون، مهام متأخرة، وآخر عمليات في سجل النشاط.
   * كل إشعار له "توقيع" (signature) ثابت يُستخدم لتتبع حالة القراءة.
   */
  _buildNotifications() {
    const notifications = [];

    // منتجات منخفضة المخزون (نفس الحد المستخدم في صفحة المخزون: 5 قطع)
    try {
      const lowStockProducts = DataStore.list('products').filter(p => (p.quantity ?? 0) <= 5);
      lowStockProducts.slice(0, 5).forEach(p => {
        notifications.push({
          signature: `low-stock-${p.id}`,
          type: 'warning',
          message: `الكمية المتبقية من "${p.name}" أوشكت على النفاد (${p.quantity ?? 0} فقط)`,
          time: null
        });
      });
    } catch (e) { /* تجاهل لو الكيان غير متاح بعد */ }

    // مهام متأخرة عن موعدها ولم تُنجز بعد
    try {
      const now = new Date();
      const overdueTasks = DataStore.list('tasks').filter(t =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed' && t.status !== 'done'
      );
      overdueTasks.slice(0, 5).forEach(t => {
        notifications.push({
          signature: `overdue-task-${t.id}`,
          type: 'warning',
          message: `مهمة "${t.title}" تجاوزت موعدها النهائي`,
          time: t.dueDate
        });
      });
    } catch (e) { /* تجاهل */ }

    // آخر العمليات في سجل النشاط (لغير أحداث الدخول/الخروج حتى لا تتكرر بلا فائدة)
    try {
      if (typeof Logger !== 'undefined') {
        const recentLogs = Logger.list().filter(l => l.action !== 'login' && l.action !== 'logout').slice(0, 5);
        recentLogs.forEach(l => {
          const actionLabel = (Logger.ACTION_LABELS && Logger.ACTION_LABELS[l.action]) || l.action;
          const moduleLabel = (CONFIG.MODULE_LABELS && CONFIG.MODULE_LABELS[l.module]) || l.module;
          notifications.push({
            signature: `log-${l.id}`,
            type: 'info',
            message: `${l.userName || 'مستخدم'}: ${actionLabel} - ${moduleLabel}${l.details ? ' (' + l.details + ')' : ''}`,
            time: l.timestamp
          });
        });
      }
    } catch (e) { /* تجاهل */ }

    return notifications;
  },

  _readNotificationSignatures() {
    return Utils.storage.get('erp_read_notifications', []);
  },

  /**
   * Load notifications (بيانات حقيقية محسوبة من حالة النظام، وليست بيانات تجريبية ثابتة)
   */
  async loadNotifications() {
    const list = document.getElementById('notifications-list');

    const notifications = this._buildNotifications();
    const readSignatures = this._readNotificationSignatures();
    const unreadCount = notifications.filter(n => !readSignatures.includes(n.signature)).length;

    const badge = document.getElementById('notification-count');
    if (badge) badge.textContent = unreadCount;

    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="empty-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>لا توجد إشعارات</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.map(n => {
      const isUnread = !readSignatures.includes(n.signature);
      const timeText = n.time ? Utils.formatDate(n.time, 'DD/MM HH:mm') : '';
      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" data-signature="${n.signature}">
          <div class="notification-icon ${n.type}">
            <i class="fas fa-${n.type === 'info' ? 'info' : n.type === 'success' ? 'check' : n.type === 'warning' ? 'exclamation' : 'times'}"></i>
          </div>
          <div class="notification-body">
            <p>${Utils.sanitizeHtml(n.message)}</p>
            ${timeText ? `<small>${timeText}</small>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Mark all notifications as read (تُحفظ الحالة فعليًا حتى تبقى مقروءة بعد إعادة الفتح)
   */
  markAllNotificationsRead() {
    const notifications = this._buildNotifications();
    const signatures = notifications.map(n => n.signature);

    Utils.storage.set('erp_read_notifications', signatures);

    document.querySelectorAll('.notification-item.unread').forEach(item => {
      item.classList.remove('unread');
    });

    const badge = document.getElementById('notification-count');
    if (badge) badge.textContent = '0';
  },

  /**
   * Initialize page components
   */
  initPageComponents() {
    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

    // Initialize popovers
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverTriggerList.forEach(el => new bootstrap.Popover(el));

    // Initialize date inputs
    // يُقيَّد الحد الأقصى بتاريخ اليوم فقط لحقول التواريخ التاريخية
    // (مثل تاريخ فاتورة أو مصروف)، لا لحقول التواريخ المستقبلية
    // (مثل تاريخ استحقاق مهمة) والتي تُستثنى عبر data-allow-future.
    document.querySelectorAll('input[type="date"]').forEach(input => {
      input.min = '2020-01-01';
      if (input.dataset.allowFuture !== 'true') {
        input.max = new Date().toISOString().split('T')[0];
      }
    });
  }
};
