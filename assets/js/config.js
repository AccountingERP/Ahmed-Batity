/* =========================================
   Ahmed Batity ERP - Configuration
   ========================================= */

/**
 * ⚠️ تحذير أمني مهم:
 * DEMO_CREDENTIALS تُستخدم فقط لأن رابط API الحقيقي (Google Apps Script)
 * غير مفعّل بعد في CONFIG.API.BASE_URL. بيانات الدخول هذه مكشوفة بالكامل
 * لأي شخص يفتح أدوات المطور في المتصفح (View Source / DevTools)، ولا تصلح
 * كحماية حقيقية بأي شكل.
 *
 * عند ربط API حقيقي:
 * 1. احذف هذا الكائن بالكامل.
 * 2. فعّل الاستدعاء الحقيقي المعلّق في Auth.login() (تعليق "In production").
 * 3. تحقق من كلمات المرور عبر الخادم (Google Apps Script) فقط، وليس في الفرونت إند.
 */
const DEMO_CREDENTIALS = Object.freeze({
  email: 'AhmedBatity@example.com',
  password: '2231986'
});

const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbxUWeIIifeVRqD9L8FI7TaO3E3jRTSqYtII7Jedquy_J4B8OPPfY6KnEKQsnd8m1DTITg/exec',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },

  // App Configuration
  APP: {
    NAME: 'Ahmed Batity ERP',
    VERSION: '1.0.0',
    DEFAULT_LANG: 'ar',
    SIDEBAR_COLLAPSED: false,
    ITEMS_PER_PAGE: 25,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    AUTO_LOGOUT_WARNING: 5 * 60 * 1000 // 5 minutes warning
  },

  // Storage Keys
  STORAGE: {
    TOKEN: 'erp_auth_token',
    USER: 'erp_user_data',
    SETTINGS: 'erp_settings',
    SIDEBAR: 'erp_sidebar_state',
    LAST_ACTIVITY: 'erp_last_activity',
    REMEMBER_ME: 'erp_remember_me',
    CACHE: 'erp_cache',
    // بادئة مفاتيح بيانات الكيانات المخزّنة عبر DataStore (عملاء، منتجات، فواتير...)
    ENTITY_DATA_PREFIX: 'erp_data_'
  },

  // Modules
  MODULES: [
    'dashboard', 'customers', 'suppliers', 'products', 'inventory',
    'sales', 'sales-returns', 'purchases', 'purchase-returns',
    'expenses', 'income', 'employees', 'attendance', 'tasks',
    'calendar', 'reports', 'settings', 'users', 'backup', 'logs'
  ],

  // Permissions
  PERMISSIONS: {
    VIEW: 'view',
    ADD: 'add',
    EDIT: 'edit',
    DELETE: 'delete',
    EXPORT: 'export',
    IMPORT: 'import',
    PRINT: 'print',
    APPROVE: 'approve'
  },

  // Roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    SALES_REP: 'sales_representative',
    WAREHOUSE: 'warehouse_employee',
    CUSTOM: 'custom_role'
  },

  // تسميات الأدوار المعروضة للمستخدم (مصدر حقيقة واحد لكل الصفحات)
  ROLE_LABELS: {
    super_admin: 'مدير النظام',
    admin: 'مدير',
    accountant: 'محاسب',
    sales_representative: 'مندوب مبيعات',
    warehouse_employee: 'موظف مخزن',
    custom_role: 'دور مخصص'
  },

  // تسميات الوحدات/الأقسام المعروضة (تُستخدم في القوائم، سجل النشاط، وغيرها)
  MODULE_LABELS: {
    dashboard: 'الرئيسية',
    customers: 'العملاء',
    suppliers: 'الموردين',
    products: 'المنتجات',
    inventory: 'المخزون',
    sales: 'فواتير المبيعات',
    'sales-returns': 'مردودات المبيعات',
    purchases: 'فواتير المشتريات',
    'purchase-returns': 'مردودات المشتريات',
    expenses: 'المصروفات',
    income: 'الإيرادات',
    employees: 'الموظفين',
    attendance: 'الحضور والانصراف',
    tasks: 'المهام',
    calendar: 'التقويم',
    reports: 'التقارير',
    'financial-report': 'التقرير المالي',
    settings: 'الإعدادات',
    users: 'المستخدمين',
    backup: 'النسخ الاحتياطي',
    logs: 'سجل النشاط',
    auth: 'الدخول والخروج',
    // مفاتيح DataStore الداخلية المختلفة عن اسم الصفحة في القائمة
    salesReturns: 'مردودات المبيعات',
    purchaseReturns: 'مردودات المشتريات'
  },

  /**
   * مصفوفة صلاحيات كل دور: لكل وحدة، إما '*' (كل الصلاحيات)
   * أو مصفوفة إجراءات محددة (مثال: ['view']) أو حذف الوحدة كليًا = ممنوع الوصول.
   * ملاحظة: super_admin دائمًا لديه صلاحية كاملة تلقائيًا (منطق ذلك في Auth.hasPermission)
   * ولا يحتاج تعريف هنا.
   */
  ROLE_PERMISSIONS: {
    admin: {
      dashboard: ['*'], customers: ['*'], suppliers: ['*'], products: ['*'],
      inventory: ['*'], sales: ['*'], 'sales-returns': ['*'], purchases: ['*'],
      'purchase-returns': ['*'], expenses: ['*'], income: ['*'], employees: ['*'],
      attendance: ['*'], tasks: ['*'], calendar: ['*'], reports: ['*'],
      settings: ['*'], users: ['*'], backup: ['*'], logs: ['*']
    },

    // المحاسب: صلاحيته الكاملة على الجزء المالي فقط (المصروفات/الإيرادات/التقارير)،
    // وصلاحية عرض فقط على الأقسام المرتبطة (لمتابعة الأرقام) بدون تعديلها
    accountant: {
      dashboard: ['view'],
      customers: ['view'],
      suppliers: ['view'],
      products: ['view'],
      sales: ['view'],
      'sales-returns': ['view'],
      purchases: ['view'],
      'purchase-returns': ['view'],
      expenses: ['*'],
      income: ['*'],
      reports: ['view', 'export', 'print'],
      calendar: ['view', 'add', 'edit'],
      tasks: ['view', 'add', 'edit']
    },

    // مندوب المبيعات: صلاحية كاملة على العملاء والمبيعات ومردوداتها فقط
    sales_representative: {
      dashboard: ['view'],
      customers: ['*'],
      products: ['view'],
      sales: ['*'],
      'sales-returns': ['*'],
      reports: ['view', 'print'],
      calendar: ['view', 'add', 'edit'],
      tasks: ['view', 'add', 'edit']
    },

    // موظف المخزن: صلاحية كاملة على المنتجات والمخزون والمشتريات ومردوداتها فقط
    warehouse_employee: {
      dashboard: ['view'],
      products: ['*'],
      inventory: ['*'],
      suppliers: ['view'],
      purchases: ['*'],
      'purchase-returns': ['*'],
      reports: ['view', 'print'],
      tasks: ['view', 'add', 'edit']
    },

    // دور مخصص: بدون صلاحيات افتراضية (يُترك لمدير النظام تحديدها لاحقًا)
    custom_role: {}
  },

  // قيم الحالة المستخدمة عبر الكيانات المختلفة (مصدر حقيقة واحد)
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    LEAVE: 'leave',
    PAID: 'paid',
    PENDING: 'pending',
    OVERDUE: 'overdue',
    COMPLETED: 'completed',
    DONE: 'done',
    IN_PROGRESS: 'in_progress',
    AVAILABLE: 'available',
    OUT_OF_STOCK: 'out'
  },

  // تسميات الحالة المعروضة للمستخدم + فئة الشارة اللونية المرتبطة بها
  STATUS_META: {
    active:      { label: 'نشط',          badgeClass: 'bg-success'   },
    inactive:    { label: 'غير نشط',      badgeClass: 'bg-secondary' },
    leave:       { label: 'إجازة',        badgeClass: 'bg-secondary' },
    paid:        { label: 'مدفوعة',       badgeClass: 'bg-success'   },
    pending:     { label: 'معلقة',        badgeClass: 'bg-warning'   },
    overdue:     { label: 'متأخرة',       badgeClass: 'bg-danger'    },
    completed:   { label: 'مكتمل',        badgeClass: 'bg-success'   },
    done:        { label: 'منتهية',       badgeClass: 'bg-success'   },
    in_progress: { label: 'قيد التنفيذ',  badgeClass: 'bg-info'      },
    available:   { label: 'متوفر',        badgeClass: 'bg-success'   },
    out:         { label: 'نفذ',          badgeClass: 'bg-danger'    }
  },

  // تسميات وألوان أولوية المهام (مصدر حقيقة واحد)
  PRIORITY_META: {
    high:   { label: 'عالية',   style: 'background:var(--danger-light);color:var(--danger)'   },
    medium: { label: 'متوسطة',  style: 'background:var(--warning-light);color:var(--warning)' },
    low:    { label: 'منخفضة',  style: 'background:var(--gray-200);color:var(--gray-700)'      }
  },

  // Currency
  CURRENCY: {
    CODE: 'EGP',
    SYMBOL: 'L.E',
    DECIMALS: 2,
    FORMAT: '{amount} {symbol}'
  },

  // Date Format
  DATE: {
    FORMAT: 'YYYY-MM-DD',
    DISPLAY_FORMAT: 'DD/MM/YYYY',
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm'
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
