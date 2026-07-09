/* =========================================
   Ahmed Batity ERP - Activity Logger
   =========================================
   يسجّل كل عملية (إنشاء/تعديل/حذف/تسجيل دخول) تتم في النظام،
   مع اسم المستخدم ودوره والوقت والقسم، بحيث يقدر مدير النظام
   والمدير يشوفوا كل خطوة يعملها المحاسب أو المندوب أو موظف المخزن.

   ملاحظة هامة: هذا السجل مرتبط بطبقة DataStore (اللي بتخزن البيانات
   محليًا عبر localStorage لحد ما يتم ربط API حقيقي). عند ربط الـ API
   الحقيقي، الأفضل نقل هذا التسجيل ليتم من طرف الخادم (Backend) نفسه
   حتى لا يقدر أي مستخدم يتلاعب بسجله من متصفحه.
   ========================================= */

const Logger = {
  ENTITY: 'activityLogs',
  MAX_ENTRIES: 1000, // حد أقصى لعدد السجلات المحفوظة محليًا

  ACTION_LABELS: {
    create: 'إنشاء',
    update: 'تعديل',
    delete: 'حذف',
    login: 'تسجيل دخول',
    logout: 'تسجيل خروج'
  },

  _key() {
    return CONFIG.STORAGE.ENTITY_DATA_PREFIX + this.ENTITY;
  },

  /**
   * تسجيل عملية جديدة في السجل
   */
  record(action, module, details, recordId) {
    try {
      const user = (typeof Auth !== 'undefined' && Auth.user) ? Auth.user : null;

      const entry = {
        id: Utils.generateId('log_'),
        timestamp: new Date().toISOString(),
        userId: user ? user.id : null,
        userName: user ? user.name : 'غير معروف',
        userRole: user ? user.role : null,
        action,
        module,
        recordId: recordId !== undefined ? recordId : null,
        details: details || '',
        device: this._getDeviceInfo()
      };

      const logs = Utils.storage.get(this._key(), []) || [];
      logs.unshift(entry); // الأحدث أولاً

      const trimmed = logs.length > this.MAX_ENTRIES ? logs.slice(0, this.MAX_ENTRIES) : logs;
      Utils.storage.set(this._key(), trimmed);
    } catch (e) {
      console.error('[Logger] فشل تسجيل العملية:', e);
    }
  },

  /**
   * استخراج نص وصفي مختصر للسجل من الحقول الشائعة
   */
  describe(record) {
    if (!record) return '';
    return record.name || record.title || record.invoiceNumber ||
           record.email || (record.id !== undefined ? `#${record.id}` : '');
  },

  /**
   * جلب كل السجلات (الأحدث أولًا) مع فلاتر اختيارية
   */
  list(filters = {}) {
    let logs = Utils.storage.get(this._key(), []) || [];

    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters.date) {
      logs = logs.filter(l => l.timestamp && l.timestamp.slice(0, 10) === filters.date);
    }
    if (filters.userId) {
      logs = logs.filter(l => String(l.userId) === String(filters.userId));
    }

    return logs;
  },

  /**
   * مسح كل السجلات (لمدير النظام/المدير فقط - يُتحقق من الصلاحية في الواجهة)
   */
  clear() {
    Utils.storage.set(this._key(), []);
  },

  /**
   * معلومات مبسطة عن الجهاز/المتصفح (بديل صادق بدل IP وهمي لا يمكن الحصول عليه من الفرونت إند)
   */
  _getDeviceInfo() {
    const ua = navigator.userAgent || '';
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);

    let browser = 'متصفح غير معروف';
    if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';

    return `${isMobile ? 'موبايل' : 'كمبيوتر'} - ${browser}`;
  }
};

window.Logger = Logger;
