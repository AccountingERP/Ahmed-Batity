/* =========================================
   Ahmed Batity ERP - Local Data Store
   =========================================
   طبقة بيانات مؤقتة تعمل عبر LocalStorage.
   تُستخدم عندما لا يكون رابط الـ API الحقيقي (Google Apps Script) مهيأً بعد،
   حتى تعمل شاشات الإضافة/التعديل/الحذف فعلياً من الآن.
   عند ربط الـ API الحقيقي لاحقاً، يمكن استبدال هذه الطبقة بسهولة
   لأن كل الاستدعاءات تمر من هنا فقط.
   ========================================= */

const DataStore = {
  LOG_ENTITY: 'activityLogs',

  ENTITIES: {
    customers: 'customers',
    suppliers: 'suppliers',
    products: 'products',
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
   * هل يوجد رابط API حقيقي مهيأ؟
   */
  isApiConfigured() {
    return CONFIG.API.BASE_URL && !CONFIG.API.BASE_URL.includes('YOUR_SCRIPT_ID');
  },

  _key(entity) {
    return CONFIG.STORAGE.ENTITY_DATA_PREFIX + entity;
  },

  list(entity) {
    return Utils.storage.get(this._key(entity), []) || [];
  },

  get(entity, id) {
    const items = this.list(entity);
    return items.find(item => String(item.id) === String(id)) || null;
  },

  create(entity, data) {
    const items = this.list(entity);
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

  update(entity, id, data) {
    const items = this.list(entity);
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

  delete(entity, id) {
    const items = this.list(entity);
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

  count(entity) {
    return this.list(entity).length;
  },

  clearAll() {
    Object.values(this.ENTITIES).forEach(entity => {
      Utils.storage.remove(this._key(entity));
    });
  }
};
