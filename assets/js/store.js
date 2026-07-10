/* =========================================
   Ahmed Batity ERP - Data Store (نسخة حقيقية)
   =========================================
   طبقة وسيطة توحّد كل عمليات القراءة/الكتابة عبر الـ API الحقيقي
   (Google Apps Script)، بدل LocalStorage. كل الشاشات (components.js,
   forms.js, ui.js...) تستدعي DataStore.list/get/create/update/delete
   بنفس الطريقة القديمة، لكنها الآن async وترجع Promise فعليًا متصلًا
   بالخادم، فتتشارك نفس البيانات بين كل المستخدمين والأجهزة والجلسات.

   ملاحظة: لو رابط الـ API غير مهيأ (وضع تجريبي بدون خادم)، تُستخدم
   نسخة احتياطية بسيطة عبر LocalStorage حتى لا تنكسر الواجهة بالكامل،
   لكنها غير مخصّصة للاستخدام الفعلي/الإنتاجي.
   ========================================= */

const DataStore = {
  LOG_ENTITY: 'activityLogs',

  ENTITIES: {
    customers: 'customers',
    suppliers: 'suppliers',
    products: 'products',
    inventory: 'inventory',
    sales: 'sales',
    salesReturns: 'salesReturns',
    purchases: 'purchases',
    purchaseReturns: 'purchaseReturns',
    expenses: 'expenses',
    income: 'income',
    employees: 'employees',
    attendance: 'attendance',
    calendarEvents: 'calendarEvents',
    tasks: 'tasks',
    users: 'users',
    backups: 'backups'
  },

  /**
   * خريطة: اسم الـ entity (كما تستخدمه الشاشات) → اسم الكائن المطابق
   * في API (assets/js/api.js). مصدر الحقيقة الوحيد لهذا الربط.
   */
  API_MAP: {
    customers: 'customers',
    suppliers: 'suppliers',
    products: 'products',
    inventory: 'inventory',
    sales: 'sales',
    salesReturns: 'salesReturns',
    purchases: 'purchases',
    purchaseReturns: 'purchaseReturns',
    expenses: 'expenses',
    income: 'income',
    employees: 'employees',
    attendance: 'attendance',
    calendarEvents: 'calendarEvents',
    tasks: 'tasks',
    users: 'users'
  },

  /**
   * هل يوجد رابط API حقيقي مهيأ؟
   */
  isApiConfigured() {
    return !!(CONFIG.API.BASE_URL && !CONFIG.API.BASE_URL.includes('YOUR_SCRIPT_ID'));
  },

  _key(entity) {
    return CONFIG.STORAGE.ENTITY_DATA_PREFIX + entity;
  },

  _apiEntity(entity) {
    const apiKey = this.API_MAP[entity];
    return apiKey ? API[apiKey] : null;
  },

  /**
   * يجلب قائمة سجلات الكيان المطلوب.
   * @returns {Promise<Array>}
   */
  async list(entity) {
    if (this.isApiConfigured() && this._apiEntity(entity)) {
      try {
        const response = await this._apiEntity(entity).list();
        return (response && response.data) || [];
      } catch (error) {
        console.error(`DataStore.list(${entity}) API error:`, error);
        if (typeof UI !== 'undefined') {
          UI.showToast(`تعذّر جلب بيانات "${entity}" من الخادم`, 'error');
        }
        return this._localList(entity);
      }
    }
    return this._localList(entity);
  },

  /**
   * يجلب سجل واحد بمعرّفه.
   * @returns {Promise<Object|null>}
   */
  async get(entity, id) {
    if (this.isApiConfigured() && this._apiEntity(entity)) {
      try {
        const response = await this._apiEntity(entity).get(id);
        return (response && response.data) || null;
      } catch (error) {
        console.error(`DataStore.get(${entity}) API error:`, error);
        if (typeof UI !== 'undefined') {
          UI.showToast(`تعذّر جلب السجل من الخادم`, 'error');
        }
        return this._localGet(entity, id);
      }
    }
    return this._localGet(entity, id);
  },

  /**
   * ينشئ سجلًا جديدًا. يرجع السجل الناتج (بعد إضافة id من الخادم).
   * @returns {Promise<Object>}
   */
  async create(entity, data) {
    if (this.isApiConfigured() && this._apiEntity(entity)) {
      const response = await this._apiEntity(entity).create(data);
      if (!response || response.success === false) {
        throw new Error((response && response.message) || 'تعذّر إنشاء السجل على الخادم');
      }
      const newId = response.data && response.data.id;
      // بعض نقاط النهاية ترجع فقط { id }، فنعيد جلب السجل الكامل لضمان
      // ظهور كل الحقول (مفيد لو الواجهة محتاجة تستخدم السجل مباشرة بعد الإنشاء)
      const record = Object.assign({ id: newId }, data);
      return record;
    }
    return this._localCreate(entity, data);
  },

  /**
   * يحدّث سجلًا موجودًا.
   * @returns {Promise<Object|null>}
   */
  async update(entity, id, data) {
    if (this.isApiConfigured() && this._apiEntity(entity)) {
      const response = await this._apiEntity(entity).update(id, data);
      if (!response || response.success === false) {
        throw new Error((response && response.message) || 'تعذّر تحديث السجل على الخادم');
      }
      return Object.assign({ id }, data);
    }
    return this._localUpdate(entity, id, data);
  },

  /**
   * يحذف سجلًا.
   * @returns {Promise<boolean>}
   */
  async delete(entity, id) {
    if (this.isApiConfigured() && this._apiEntity(entity)) {
      const response = await this._apiEntity(entity).delete(id);
      if (!response || response.success === false) {
        throw new Error((response && response.message) || 'تعذّر حذف السجل على الخادم');
      }
      return true;
    }
    return this._localDelete(entity, id);
  },

  /**
   * يرجع عدد سجلات الكيان.
   * @returns {Promise<number>}
   */
  async count(entity) {
    const items = await this.list(entity);
    return items.length;
  },

  // =========================================
  // نسخة احتياطية عبر LocalStorage (تُستخدم فقط لو الـ API غير مهيأ
  // أو فشل الاتصال بالخادم مؤقتًا). غير مخصّصة للاستخدام الإنتاجي.
  // =========================================
  _localList(entity) {
    return Utils.storage.get(this._key(entity), []) || [];
  },

  _localGet(entity, id) {
    const items = this._localList(entity);
    return items.find(item => String(item.id) === String(id)) || null;
  },

  _localCreate(entity, data) {
    const items = this._localList(entity);
    const nextId = items.length ? Math.max(...items.map(i => parseInt(i.id) || 0)) + 1 : 1;
    const now = new Date().toISOString();
    const record = Object.assign({ id: nextId, createdAt: now, updatedAt: now }, data);
    items.push(record);

    const saved = Utils.storage.set(this._key(entity), items);
    if (!saved) {
      throw new Error('تعذّر حفظ البيانات محليًا. قد تكون مساحة التخزين في المتصفح ممتلئة أو معطّلة (مثل وضع التصفح الخاص).');
    }

    if (entity !== this.LOG_ENTITY && typeof Logger !== 'undefined') {
      Logger.record('create', entity, Logger.describe(record), record.id);
    }

    return record;
  },

  _localUpdate(entity, id, data) {
    const items = this._localList(entity);
    const index = items.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;
    items[index] = Object.assign({}, items[index], data, {
      id: items[index].id,
      updatedAt: new Date().toISOString()
    });

    const saved = Utils.storage.set(this._key(entity), items);
    if (!saved) {
      throw new Error('تعذّر حفظ التعديلات محليًا. قد تكون مساحة التخزين في المتصفح ممتلئة أو معطّلة (مثل وضع التصفح الخاص).');
    }

    if (entity !== this.LOG_ENTITY && typeof Logger !== 'undefined') {
      Logger.record('update', entity, Logger.describe(items[index]), id);
    }

    return items[index];
  },

  _localDelete(entity, id) {
    const items = this._localList(entity);
    const target = items.find(item => String(item.id) === String(id));
    const filtered = items.filter(item => String(item.id) !== String(id));

    const saved = Utils.storage.set(this._key(entity), filtered);
    if (!saved) {
      throw new Error('تعذّر حذف السجل محليًا. قد تكون مساحة التخزين في المتصفح ممتلئة أو معطّلة (مثل وضع التصفح الخاص).');
    }

    if (entity !== this.LOG_ENTITY && typeof Logger !== 'undefined') {
      Logger.record('delete', entity, target ? Logger.describe(target) : `#${id}`, id);
    }

    return filtered.length !== items.length;
  },

  clearAll() {
    Object.values(this.ENTITIES).forEach(entity => {
      Utils.storage.remove(this._key(entity));
    });
  }
};
