/* =========================================
   Ahmed Batity ERP - Authentication
   ========================================= */

const Auth = {
  user: null,
  token: null,
  sessionTimer: null,
  warningTimer: null,

  /**
   * Initialize auth
   */
  init() {
    this.token = Utils.storage.get(CONFIG.STORAGE.TOKEN);
    this.user = Utils.storage.get(CONFIG.STORAGE.USER);

    if (this.token && this.user) {
      this.startSessionTimer();
      this.updateUserInfo();
    }
  },

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  },

  /**
   * Check if user has permission
   */
  hasPermission(module, action) {
    if (!this.user || !this.user.permissions) return false;
    if (this.user.role === CONFIG.ROLES.SUPER_ADMIN) return true;

    const modulePerms = this.user.permissions[module];
    if (!modulePerms) return false;

    return modulePerms.includes(action) || modulePerms.includes('*');
  },

  /**
   * Check if user has role
   */
  hasRole(role) {
    if (!this.user) return false;
    if (this.user.role === CONFIG.ROLES.SUPER_ADMIN) return true;
    return this.user.role === role;
  },

  /**
   * Login
   */
  async login(email, password, rememberMe = false) {
    try {
      UI.showLoading();

      // لو رابط API حقيقي متصل (Google Apps Script)، استخدمه فعليًا بدل الوضع التجريبي
      if (typeof DataStore !== 'undefined' && DataStore.isApiConfigured()) {
        const response = await API.auth.login(email, password, rememberMe);

        const apiUser = response.user;
        let permissions = {};
        try {
          permissions = apiUser.Permissions ? JSON.parse(apiUser.Permissions) : {};
        } catch (e) {
          permissions = {};
        }

        const user = {
          id: apiUser.ID,
          name: apiUser.Name,
          email: apiUser.Email,
          role: apiUser.Role,
          avatar: null,
          permissions,
          lastLogin: apiUser.LastLogin || new Date().toISOString()
        };

        this.token = response.token;
        this.user = user;

        if (rememberMe) {
          Utils.storage.set(CONFIG.STORAGE.TOKEN, this.token);
          Utils.storage.set(CONFIG.STORAGE.USER, user);
          Utils.storage.set(CONFIG.STORAGE.REMEMBER_ME, true);
        } else {
          Utils.session.set(CONFIG.STORAGE.TOKEN, this.token);
          Utils.session.set(CONFIG.STORAGE.USER, user);
          Utils.storage.remove(CONFIG.STORAGE.REMEMBER_ME);
        }

        this.startSessionTimer();
        this.updateUserInfo();

        // ملاحظة: لا حاجة لتسجيل الدخول محليًا عبر Logger هنا، لأن الخادم
        // (backend.gs) بيسجّله فعليًا في شيت Logs بهوية موثّقة من التوكن.

        UI.showToast('تم تسجيل الدخول بنجاح', 'success');
        return { success: true, user };
      }

      // Demo mode - simulate login
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate credentials (demo) — راجع تحذير DEMO_CREDENTIALS في config.js
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        const user = {
          id: '1',
          name: 'المدير',
          email: DEMO_CREDENTIALS.email,
          role: CONFIG.ROLES.SUPER_ADMIN,
          avatar: null,
          permissions: { '*': ['*'] },
          lastLogin: new Date().toISOString()
        };

        const token = Utils.generateId('token_');

        this.token = token;
        this.user = user;

        if (rememberMe) {
          Utils.storage.set(CONFIG.STORAGE.TOKEN, token);
          Utils.storage.set(CONFIG.STORAGE.USER, user);
          Utils.storage.set(CONFIG.STORAGE.REMEMBER_ME, true);
        } else {
          Utils.session.set(CONFIG.STORAGE.TOKEN, token);
          Utils.session.set(CONFIG.STORAGE.USER, user);
          Utils.storage.remove(CONFIG.STORAGE.REMEMBER_ME);
        }

        this.startSessionTimer();
        this.updateUserInfo();

        if (typeof Logger !== 'undefined') {
          Logger.record('login', 'auth', `تسجيل دخول: ${user.name}`, user.id);
        }

        UI.showToast('تم تسجيل الدخول بنجاح', 'success');

        return { success: true, user };
      }

      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    } catch (error) {
      UI.showToast(error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      UI.hideLoading();
    }
  },

  /**
   * Logout
   */
  async logout() {
    try {
      if (typeof DataStore !== 'undefined' && DataStore.isApiConfigured()) {
        await API.auth.logout();
      }
    } catch (e) {
      console.error('Logout API error:', e);
    }

    if (typeof Logger !== 'undefined' && this.user) {
      Logger.record('logout', 'auth', `تسجيل خروج: ${this.user.name}`, this.user.id);
    }

    this.clearSession();
    UI.showToast('تم تسجيل الخروج بنجاح', 'info');

    setTimeout(() => {
      window.location.reload();
    }, 500);
  },

  /**
   * Clear session
   */
  clearSession() {
    this.token = null;
    this.user = null;

    Utils.storage.remove(CONFIG.STORAGE.TOKEN);
    Utils.storage.remove(CONFIG.STORAGE.USER);
    Utils.storage.remove(CONFIG.STORAGE.LAST_ACTIVITY);
    Utils.session.remove(CONFIG.STORAGE.TOKEN);
    Utils.session.remove(CONFIG.STORAGE.USER);

    this.stopSessionTimer();
  },

  /**
   * Start session timer
   */
  startSessionTimer() {
    this.stopSessionTimer();

    const updateActivity = () => {
      Utils.storage.set(CONFIG.STORAGE.LAST_ACTIVITY, Date.now());
    };

    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    this.warningTimer = setInterval(() => {
      const lastActivity = Utils.storage.get(CONFIG.STORAGE.LAST_ACTIVITY, Date.now());
      const inactive = Date.now() - lastActivity;

      if (inactive >= CONFIG.APP.SESSION_TIMEOUT - CONFIG.APP.AUTO_LOGOUT_WARNING) {
        this.showLogoutWarning(CONFIG.APP.SESSION_TIMEOUT - inactive);
      }

      if (inactive >= CONFIG.APP.SESSION_TIMEOUT) {
        this.logout();
      }
    }, 60000);
  },

  /**
   * Stop session timer
   */
  stopSessionTimer() {
    if (this.warningTimer) {
      clearInterval(this.warningTimer);
      this.warningTimer = null;
    }
  },

  /**
   * Show logout warning
   */
  showLogoutWarning(remainingTime) {
    const minutes = Math.ceil(remainingTime / 60000);

    Swal.fire({
      title: 'جلسة العمل ستنتهي',
      text: `سيتم تسجيل خروجك تلقائياً خلال ${minutes} دقيقة. هل تريد البقاء متصلاً؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، البقاء متصلاً',
      cancelButtonText: 'تسجيل الخروج',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        Utils.storage.set(CONFIG.STORAGE.LAST_ACTIVITY, Date.now());
      } else {
        this.logout();
      }
    });
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      UI.showLoading();
      // const response = await API.auth.changePassword(currentPassword, newPassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      UI.showToast('تم تغيير كلمة المرور بنجاح', 'success');
      return { success: true };
    } catch (error) {
      UI.showToast(error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      UI.hideLoading();
    }
  },

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      UI.showLoading();

      if (typeof DataStore !== 'undefined' && DataStore.isApiConfigured()) {
        const response = await API.auth.forgotPassword(email);
        UI.showToast(response.message || 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
        return { success: true };
      }

      // Demo mode - simulate sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      UI.showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
      return { success: true };
    } catch (error) {
      UI.showToast(error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      UI.hideLoading();
    }
  },

  /**
   * إتمام إعادة تعيين كلمة المرور بتوكن مُرسل عبر البريد الإلكتروني
   */
  async resetPassword(token, newPassword) {
    try {
      UI.showLoading();

      if (typeof DataStore !== 'undefined' && DataStore.isApiConfigured()) {
        const response = await API.auth.resetPassword(token, newPassword);
        UI.showToast(response.message || 'تم تغيير كلمة المرور بنجاح', 'success');
        return { success: true };
      }

      // Demo mode - لا يوجد نظام مستخدمين حقيقي متعدد في وضع العرض التجريبي
      await new Promise(resolve => setTimeout(resolve, 1000));
      UI.showToast('تم تغيير كلمة المرور بنجاح (وضع العرض التجريبي)', 'success');
      return { success: true };
    } catch (error) {
      UI.showToast(error.message || 'تعذّر إعادة تعيين كلمة المرور', 'error');
      return { success: false, error: error.message };
    } finally {
      UI.hideLoading();
    }
  },

  /**
   * Update user info in UI
   */
  updateUserInfo() {
    if (!this.user) return;

    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');

    if (nameEl) nameEl.textContent = this.user.name || 'مستخدم';
    if (roleEl) roleEl.textContent = this.getRoleLabel(this.user.role);
  },

  /**
   * Get role label
   */
  getRoleLabel(role) {
    const labels = {
      [CONFIG.ROLES.SUPER_ADMIN]: 'مدير النظام',
      [CONFIG.ROLES.ADMIN]: 'مدير',
      [CONFIG.ROLES.ACCOUNTANT]: 'محاسب',
      [CONFIG.ROLES.SALES_REP]: 'مندوب مبيعات',
      [CONFIG.ROLES.WAREHOUSE]: 'موظف مخزن',
      [CONFIG.ROLES.CUSTOM]: 'دور مخصص'
    };
    return labels[role] || role;
  }
};
