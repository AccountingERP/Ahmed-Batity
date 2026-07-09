/* =========================================
   Ahmed Batity ERP - API Client
   ========================================= */

const API = {
  baseUrl: CONFIG.API.BASE_URL,

  /**
   * Build API URL with parameters
   */
  buildUrl(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.append('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    return url.toString();
  },

  /**
   * Make API request with retry logic
   *
   * ملاحظتان مهمتان بخصوص Google Apps Script Web App تحديدًا:
   * 1) لا يدعم فعليًا سوى GET وPOST (أي PUT/DELETE يتم تحويلهما لـ POST هنا).
   * 2) لا يتعامل بشكل موثوق مع CORS Preflight (طلب OPTIONS)، لذلك نتفادى
   *    إثارته أصلًا بعدم إرسال أي Header مخصص (لا Authorization ولا حتى
   *    application/json)، ونرسل التوكن كجزء من البيانات نفسها بدل الـ Header.
   */
  async request(action, params = {}, options = {}) {
    const { method = 'GET', body = null, retries = CONFIG.API.RETRY_ATTEMPTS } = options;

    // كل الطلبات غير GET تُرسل فعليًا كـ POST (Apps Script لا يستدعي doPut/doDelete إطلاقًا)
    const httpMethod = method === 'GET' ? 'GET' : 'POST';

    // إرفاق التوكن مع بيانات الطلب نفسها (وليس Header) حتى يقدر السيرفر يقرأه فعليًا
    const token = Utils.storage.get(CONFIG.STORAGE.TOKEN) || Utils.session.get(CONFIG.STORAGE.TOKEN);
    const paramsWithToken = Object.assign({}, params, token ? { token } : {});
    const bodyWithToken = Object.assign({}, body || {}, token ? { token } : {});

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = httpMethod === 'GET'
          ? this.buildUrl(action, paramsWithToken)
          : this.buildUrl(action);

        const fetchOptions = {
          method: httpMethod,
          // text/plain يتفادى إثارة CORS Preflight (OPTIONS) الذي لا تتعامل معه
          // خدمات Apps Script Web App بشكل موثوق. الخادم يقرأ المحتوى الخام
          // كنص ثم يعمل JSON.parse بنفسه بغض النظر عن الـ Content-Type المُعلن.
          headers: httpMethod === 'POST' ? { 'Content-Type': 'text/plain;charset=utf-8' } : {},
          mode: 'cors',
          redirect: 'follow'
        };

        if (httpMethod === 'POST') {
          fetchOptions.body = JSON.stringify(bodyWithToken);
        }

        const controller = new AbortController();
        fetchOptions.signal = controller.signal;

        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success === false) {
          // انتهاء الجلسة أو رفض الصلاحية: أعد توجيه المستخدم لتسجيل الدخول تلقائيًا
          if (data.code === 'UNAUTHORIZED' && typeof Auth !== 'undefined') {
            Auth.clearSession();
            if (typeof Router !== 'undefined') Router.showLogin();
          }
          throw new Error(data.message || 'Request failed');
        }

        return data;

      } catch (error) {
        lastError = error;

        if (error.name === 'AbortError') {
          console.warn('Request timeout, retrying...');
        }

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.API.RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    throw lastError;
  },

  /**
   * GET request
   */
  async get(action, params = {}) {
    return this.request(action, params, { method: 'GET' });
  },

  /**
   * POST request
   */
  async post(action, data = {}) {
    return this.request(action, {}, { method: 'POST', body: data });
  },

  /**
   * "PUT" request — Apps Script لا يستدعي doPut إطلاقًا، فتُرسل كـ POST فعليًا
   */
  async put(action, data = {}) {
    return this.request(action, {}, { method: 'POST', body: data });
  },

  /**
   * "DELETE" request — Apps Script لا يستدعي doDelete إطلاقًا، فتُرسل كـ POST فعليًا
   */
  async delete(action, params = {}) {
    return this.request(action, {}, { method: 'POST', body: params });
  },

  // ====================
  // Auth Endpoints
  // ====================
  auth: {
    async login(email, password, rememberMe = false) {
      return API.post('auth_login', { email, password, rememberMe });
    },

    async logout() {
      return API.post('auth_logout');
    },

    async refresh() {
      return API.get('auth_refresh');
    },

    async changePassword(currentPassword, newPassword) {
      return API.post('auth_change_password', { currentPassword, newPassword });
    },

    async forgotPassword(email) {
      return API.post('auth_forgot_password', { email });
    },

    async resetPassword(token, newPassword) {
      return API.post('auth_reset_password', { token, newPassword });
    }
  },

  // ====================
  // Users Endpoints
  // ====================
  users: {
    async list(params = {}) {
      return API.get('users_list', params);
    },

    async get(id) {
      return API.get('users_get', { id });
    },

    async create(data) {
      return API.post('users_create', data);
    },

    async update(id, data) {
      return API.post('users_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('users_delete', { id });
    },

    async toggleStatus(id) {
      return API.post('users_toggle_status', { id });
    }
  },

  // ====================
  // Customers Endpoints
  // ====================
  customers: {
    async list(params = {}) {
      return API.get('customers_list', params);
    },

    async get(id) {
      return API.get('customers_get', { id });
    },

    async create(data) {
      return API.post('customers_create', data);
    },

    async update(id, data) {
      return API.post('customers_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('customers_delete', { id });
    },

    async search(query) {
      return API.get('customers_search', { query });
    }
  },

  // ====================
  // Suppliers Endpoints
  // ====================
  suppliers: {
    async list(params = {}) {
      return API.get('suppliers_list', params);
    },

    async get(id) {
      return API.get('suppliers_get', { id });
    },

    async create(data) {
      return API.post('suppliers_create', data);
    },

    async update(id, data) {
      return API.post('suppliers_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('suppliers_delete', { id });
    }
  },

  // ====================
  // Products Endpoints
  // ====================
  products: {
    async list(params = {}) {
      return API.get('products_list', params);
    },

    async get(id) {
      return API.get('products_get', { id });
    },

    async create(data) {
      return API.post('products_create', data);
    },

    async update(id, data) {
      return API.post('products_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('products_delete', { id });
    },

    async search(query) {
      return API.get('products_search', { query });
    }
  },

  // ====================
  // Inventory Endpoints
  // ====================
  inventory: {
    async list(params = {}) {
      return API.get('inventory_list', params);
    },

    async get(id) {
      return API.get('inventory_get', { id });
    },

    async adjust(data) {
      return API.post('inventory_adjust', data);
    },

    async transfer(data) {
      return API.post('inventory_transfer', data);
    },

    async lowStock() {
      return API.get('inventory_low_stock');
    }
  },

  // ====================
  // Sales Endpoints
  // ====================
  sales: {
    async list(params = {}) {
      return API.get('sales_list', params);
    },

    async get(id) {
      return API.get('sales_get', { id });
    },

    async create(data) {
      return API.post('sales_create', data);
    },

    async update(id, data) {
      return API.post('sales_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('sales_delete', { id });
    },

    async cancel(id) {
      return API.post('sales_cancel', { id });
    },

    async refund(id, data) {
      return API.post('sales_refund', { id, ...data });
    }
  },

  // ====================
  // Purchases Endpoints
  // ====================
  purchases: {
    async list(params = {}) {
      return API.get('purchases_list', params);
    },

    async get(id) {
      return API.get('purchases_get', { id });
    },

    async create(data) {
      return API.post('purchases_create', data);
    },

    async update(id, data) {
      return API.post('purchases_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('purchases_delete', { id });
    }
  },

  // ====================
  // Expenses Endpoints
  // ====================
  expenses: {
    async list(params = {}) {
      return API.get('expenses_list', params);
    },

    async get(id) {
      return API.get('expenses_get', { id });
    },

    async create(data) {
      return API.post('expenses_create', data);
    },

    async update(id, data) {
      return API.post('expenses_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('expenses_delete', { id });
    }
  },

  // ====================
  // Income Endpoints
  // ====================
  income: {
    async list(params = {}) {
      return API.get('income_list', params);
    },

    async get(id) {
      return API.get('income_get', { id });
    },

    async create(data) {
      return API.post('income_create', data);
    },

    async update(id, data) {
      return API.post('income_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('income_delete', { id });
    }
  },

  // ====================
  // Employees Endpoints
  // ====================
  employees: {
    async list(params = {}) {
      return API.get('employees_list', params);
    },

    async get(id) {
      return API.get('employees_get', { id });
    },

    async create(data) {
      return API.post('employees_create', data);
    },

    async update(id, data) {
      return API.post('employees_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('employees_delete', { id });
    }
  },

  // ====================
  // Attendance Endpoints
  // ====================
  attendance: {
    async list(params = {}) {
      return API.get('attendance_list', params);
    },

    async checkIn(data) {
      return API.post('attendance_checkin', data);
    },

    async checkOut(data) {
      return API.post('attendance_checkout', data);
    },

    async getToday() {
      return API.get('attendance_today');
    }
  },

  // ====================
  // Tasks Endpoints
  // ====================
  tasks: {
    async list(params = {}) {
      return API.get('tasks_list', params);
    },

    async get(id) {
      return API.get('tasks_get', { id });
    },

    async create(data) {
      return API.post('tasks_create', data);
    },

    async update(id, data) {
      return API.post('tasks_update', { id, ...data });
    },

    async delete(id) {
      return API.delete('tasks_delete', { id });
    },

    async toggleComplete(id) {
      return API.post('tasks_toggle_complete', { id });
    }
  },

  // ====================
  // Reports Endpoints
  // ====================
  reports: {
    async sales(params = {}) {
      return API.get('reports_sales', params);
    },

    async purchases(params = {}) {
      return API.get('reports_purchases', params);
    },

    async inventory(params = {}) {
      return API.get('reports_inventory', params);
    },

    async financial(params = {}) {
      return API.get('reports_financial', params);
    },

    async export(type, params = {}) {
      return API.get(`reports_export_${type}`, params);
    }
  },

  // ====================
  // Settings Endpoints
  // ====================
  settings: {
    async get() {
      return API.get('settings_get');
    },

    async update(data) {
      return API.post('settings_update', data);
    },

    async backup() {
      return API.post('settings_backup');
    },

    async restore(data) {
      return API.post('settings_restore', data);
    }
  },

  // ====================
  // Logs Endpoints
  // ====================
  logs: {
    async list(params = {}) {
      return API.get('logs_list', params);
    },

    async clear() {
      return API.post('logs_clear');
    }
  },

  // ====================
  // Dashboard Endpoints
  // ====================
  dashboard: {
    async stats() {
      return API.get('dashboard_stats');
    },

    async activities() {
      return API.get('dashboard_activities');
    },

    async notifications() {
      return API.get('dashboard_notifications');
    }
  }
};
