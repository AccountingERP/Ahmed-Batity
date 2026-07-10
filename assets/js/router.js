/* =========================================
   Ahmed Batity ERP - Router
   ========================================= */

const Router = {
  currentPage: 'dashboard',
  routes: {},

  // بعض الصفحات فرعية من وحدة أكبر ومفيش لها صلاحية مستقلة خاصة بيها؛
  // بنتحقق من صلاحية الوحدة الأصلية بدلًا من ذلك
  PAGE_MODULE_MAP: {
    'financial-report': 'reports'
  },

  /**
   * Initialize router
   */
  init() {
    // Handle hash changes
    window.addEventListener('hashchange', () => this.handleRoute());

    // Handle initial route
    this.handleRoute();

    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-page]');
      if (link) {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigate(page);
      }
    });
  },

  /**
   * Register route
   */
  register(page, handler) {
    this.routes[page] = handler;
  },

  /**
   * Navigate to page
   */
  navigate(page, params = {}) {
    if (!Auth.isAuthenticated() && page !== 'login') {
      page = 'login';
    }

    this.currentPage = page;
    window.location.hash = page;

    // Update active nav item
    this.updateActiveNav(page);

    // Update breadcrumb
    this.updateBreadcrumb(page);

    // Load page content
    this.loadPage(page, params);
  },

  /**
   * Handle route change
   */
  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const [page] = hash.split('/');

    if (!Auth.isAuthenticated() && page !== 'login') {
      this.showLogin();
      return;
    }

    this.currentPage = page;
    this.updateActiveNav(page);
    this.updateBreadcrumb(page);
    this.loadPage(page);
  },

  /**
   * Load page content
   */
  async loadPage(page, params = {}) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Show skeleton loading
    UI.showSkeleton();

    try {
      // Check permission
      const permissionModule = this.PAGE_MODULE_MAP[page] || page;
      if (Auth.isAuthenticated() && !Auth.hasPermission(permissionModule, CONFIG.PERMISSIONS.VIEW)) {
        contentArea.innerHTML = Components.renderAccessDenied();
        UI.hideSkeleton();
        return;
      }

      // Get page content
      let html = '';

      if (this.routes[page]) {
        html = await this.routes[page](params);
      } else {
        html = await this.loadPageTemplate(page);
      }

      contentArea.innerHTML = html;

      // Initialize page components
      UI.initPageComponents();

      // تهيئة رسوم لوحة التحكم البيانية (لا يمكن تنفيذها كـ<script> داخل innerHTML)
      if (page === 'dashboard') {
        await Components.initDashboardCharts();
      }

      // Initialize AOS animations
      if (typeof AOS !== 'undefined') {
        AOS.refresh();
      }

    } catch (error) {
      console.error('Error loading page:', error);
      contentArea.innerHTML = Components.renderError('حدث خطأ أثناء تحميل الصفحة');
    } finally {
      UI.hideSkeleton();
    }
  },

  /**
   * Load page template from file
   */
  async loadPageTemplate(page) {
    try {
      const response = await fetch(`pages/${page}/index.html`);
      if (!response.ok) throw new Error('Page not found');
      return await response.text();
    } catch (error) {
      // Fallback: render inline page
      return await this.renderInlinePage(page);
    }
  },

  /**
   * Render inline page (fallback)
   */
  async renderInlinePage(page) {
    switch (page) {
      case 'dashboard': return await Components.renderDashboard();
      case 'customers': return await Components.renderCustomers();
      case 'suppliers': return await Components.renderSuppliers();
      case 'products': return await Components.renderProducts();
      case 'inventory': return await Components.renderInventory();
      case 'sales': return await Components.renderSales();
      case 'sales-returns': return await Components.renderSalesReturns();
      case 'purchases': return await Components.renderPurchases();
      case 'purchase-returns': return await Components.renderPurchaseReturns();
      case 'expenses': return await Components.renderExpenses();
      case 'income': return await Components.renderIncome();
      case 'employees': return await Components.renderEmployees();
      case 'attendance': return await Components.renderAttendance();
      case 'tasks': return await Components.renderTasks();
      case 'calendar': return await Components.renderCalendar();
      case 'reports': return await Components.renderReports();
      case 'financial-report': return await Components.renderFinancialReport();
      case 'settings': return await Components.renderSettings();
      case 'users': return await Components.renderUsers();
      case 'backup': return await Components.renderBackup();
      case 'logs': return await Components.renderLogs();
      default: return Components.renderNotFound();
    }
  },

  /**
   * Update active navigation item
   */
  updateActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    document.querySelectorAll('.nav-item > a').forEach(link => {
      if (link.dataset.page === page) {
        link.closest('.nav-item').classList.add('active');
        // Open parent submenu if exists
        const parent = link.closest('.submenu');
        if (parent) {
          parent.closest('.nav-item').classList.add('open');
        }
      }
    });
  },

  /**
   * Update breadcrumb
   */
  updateBreadcrumb(page) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;

    const label = (CONFIG.MODULE_LABELS && CONFIG.MODULE_LABELS[page]) || page;

    breadcrumb.innerHTML = `
      <li class="breadcrumb-item"><a href="#dashboard">الرئيسية</a></li>
      <li class="breadcrumb-item active">${label}</li>
    `;
  },

  /**
   * Show login modal
   */
  showLogin() {
    const loginModal = document.getElementById('login-modal');
    const app = document.getElementById('app');

    if (loginModal) loginModal.style.display = 'flex';
    if (app) app.style.display = 'none';
  },

  /**
   * Hide login modal
   */
  hideLogin() {
    const loginModal = document.getElementById('login-modal');
    const app = document.getElementById('app');

    if (loginModal) loginModal.style.display = 'none';
    if (app) app.style.display = 'flex';
  },

  /**
   * Show reset password screen (بدل شاشة تسجيل الدخول العادية)
   */
  showResetPassword() {
    const loginModal = document.getElementById('login-modal');
    const resetModal = document.getElementById('reset-password-modal');
    const app = document.getElementById('app');

    if (loginModal) loginModal.style.display = 'none';
    if (resetModal) resetModal.style.display = 'flex';
    if (app) app.style.display = 'none';
  },

  hideResetPassword() {
    const resetModal = document.getElementById('reset-password-modal');
    if (resetModal) resetModal.style.display = 'none';
  }
};
