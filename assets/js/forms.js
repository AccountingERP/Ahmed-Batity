/* =========================================
   Ahmed Batity ERP - Dynamic Forms
   =========================================
   نظام عام لفتح نموذج إضافة/تعديل داخل مودال واحد،
   مبني على تعريف حقول (schema) لكل كيان.
   ========================================= */

/**
 * يبني مصفوفة options لحقل select من مجموعة مفاتيح حالة،
 * بالاعتماد على CONFIG.STATUS_META كمصدر حقيقة واحد للتسميات.
 * يمنع تكرار كتابة { value, label } يدويًا لكل حقل حالة في كل نموذج.
 */
function buildStatusOptions(...statusKeys) {
  return statusKeys.map(key => ({
    value: key,
    label: (CONFIG.STATUS_META[key] || {}).label || key
  }));
}

/**
 * يبني مصفوفة options لحقل select من قيم الأولوية، بالاعتماد على CONFIG.PRIORITY_META.
 */
function buildPriorityOptions() {
  return Object.keys(CONFIG.PRIORITY_META).map(key => ({
    value: key,
    label: CONFIG.PRIORITY_META[key].label
  }));
}

/**
 * يبني مصفوفة options لحقل اختيار الأدوار من CONFIG.ROLE_LABELS.
 */
function buildRoleOptions(...roleKeys) {
  return roleKeys.map(key => ({
    value: key,
    label: CONFIG.ROLE_LABELS[key] || key
  }));
}

const Forms = {
  modalInstance: null,
  currentSchema: null,
  currentEntity: null,
  currentId: null,

  /**
   * تعريفات النماذج لكل كيان في النظام
   * كل حقل: { name, label, type, required, options?, colClass? }
   */
  schemas: {
    customers: {
      title: { add: 'إضافة عميل جديد', edit: 'تعديل بيانات العميل' },
      entity: 'customers',
      fields: [
        { name: 'name', label: 'اسم العميل', type: 'text', required: true },
        { name: 'email', label: 'البريد الإلكتروني', type: 'email', required: false },
        { name: 'phone', label: 'الهاتف', type: 'tel', required: true },
        { name: 'address', label: 'العنوان', type: 'text', required: false },
        { name: 'balance', label: 'الرصيد الافتتاحي', type: 'number', required: false, default: 0 },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('active', 'inactive') }
      ]
    },

    suppliers: {
      title: { add: 'إضافة مورد جديد', edit: 'تعديل بيانات المورد' },
      entity: 'suppliers',
      fields: [
        { name: 'name', label: 'اسم المورد', type: 'text', required: true },
        { name: 'email', label: 'البريد الإلكتروني', type: 'email', required: false },
        { name: 'phone', label: 'الهاتف', type: 'tel', required: true },
        { name: 'address', label: 'العنوان', type: 'text', required: false },
        { name: 'balance', label: 'الرصيد الافتتاحي', type: 'number', required: false, default: 0 },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('active', 'inactive') }
      ]
    },

    products: {
      title: { add: 'إضافة منتج جديد', edit: 'تعديل بيانات المنتج' },
      entity: 'products',
      fields: [
        { name: 'name', label: 'اسم المنتج', type: 'text', required: true },
        { name: 'sku', label: 'الرمز (SKU)', type: 'text', required: true },
        { name: 'category', label: 'الفئة', type: 'text', required: false, suggestFrom: 'category',
          placeholder: 'اكتب أي فئة تريدها (مثال: إلكترونيات، أثاث...) - اختياري' },
        { name: 'price', label: 'سعر البيع', type: 'number', required: true, step: '0.01' },
        { name: 'cost', label: 'سعر التكلفة', type: 'number', required: false, step: '0.01' },
        { name: 'quantity', label: 'الكمية بالمخزون', type: 'number', required: false, default: 0 },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('available', 'out') }
      ]
    },

    sales: {
      title: { add: 'فاتورة مبيعات جديدة', edit: 'تعديل فاتورة المبيعات' },
      entity: 'sales',
      fields: [
        { name: 'invoiceNumber', label: 'رقم الفاتورة', type: 'text', required: true, auto: 'INV' },
        { name: 'customerName', label: 'اسم العميل', type: 'text', required: true },
        { name: 'date', label: 'التاريخ', type: 'date', required: true, default: 'today' },
        { name: 'amount', label: 'المبلغ', type: 'number', required: true, step: '0.01' },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('paid', 'pending', 'overdue') }
      ]
    },

    salesReturns: {
      title: { add: 'مردود مبيعات جديد', edit: 'تعديل مردود المبيعات' },
      entity: 'salesReturns',
      fields: [
        { name: 'returnNumber', label: 'رقم المردود', type: 'text', required: true, auto: 'SRET' },
        { name: 'customerName', label: 'اسم العميل', type: 'text', required: true },
        { name: 'date', label: 'التاريخ', type: 'date', required: true, default: 'today' },
        { name: 'amount', label: 'المبلغ', type: 'number', required: true, step: '0.01' },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('completed', 'pending') }
      ]
    },

    purchases: {
      title: { add: 'فاتورة شراء جديدة', edit: 'تعديل فاتورة الشراء' },
      entity: 'purchases',
      fields: [
        { name: 'invoiceNumber', label: 'رقم الفاتورة', type: 'text', required: true, auto: 'PUR' },
        { name: 'supplierName', label: 'اسم المورد', type: 'text', required: true },
        { name: 'date', label: 'التاريخ', type: 'date', required: true, default: 'today' },
        { name: 'amount', label: 'المبلغ', type: 'number', required: true, step: '0.01' },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('paid', 'pending') }
      ]
    },

    purchaseReturns: {
      title: { add: 'مردود مشتريات جديد', edit: 'تعديل مردود المشتريات' },
      entity: 'purchaseReturns',
      fields: [
        { name: 'returnNumber', label: 'رقم المردود', type: 'text', required: true, auto: 'PRET' },
        { name: 'supplierName', label: 'اسم المورد', type: 'text', required: true },
        { name: 'date', label: 'التاريخ', type: 'date', required: true, default: 'today' },
        { name: 'amount', label: 'المبلغ', type: 'number', required: true, step: '0.01' },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('completed', 'pending') }
      ]
    },

    expenses: {
      title: { add: 'مصروف جديد', edit: 'تعديل المصروف' },
      entity: 'expenses',
      fields: [
        { name: 'date', label: 'التاريخ', type: 'date', required: true, default: 'today' },
        { name: 'category', label: 'الفئة', type: 'text', required: true, suggestFrom: 'category',
          placeholder: 'اكتب فئة المصروف (مثال: إيجار، رواتب...)' },
        { name: 'description', label: 'الوصف', type: 'text', required: true },
        { name: 'amount', label: 'المبلغ', type: 'number', required: true, step: '0.01' }
      ]
    },

    income: {
      title: { add: 'إيراد جديد', edit: 'تعديل الإيراد' },
      entity: 'income',
      fields: [
        { name: 'date', label: 'التاريخ', type: 'date', required: true, default: 'today' },
        { name: 'category', label: 'الفئة', type: 'text', required: true, suggestFrom: 'category',
          placeholder: 'اكتب فئة الإيراد (مثال: مبيعات، خدمات...)' },
        { name: 'description', label: 'الوصف', type: 'text', required: true },
        { name: 'amount', label: 'المبلغ', type: 'number', required: true, step: '0.01' }
      ]
    },

    employees: {
      title: { add: 'موظف جديد', edit: 'تعديل بيانات الموظف' },
      entity: 'employees',
      fields: [
        { name: 'name', label: 'اسم الموظف', type: 'text', required: true },
        { name: 'department', label: 'القسم', type: 'text', required: true },
        { name: 'salary', label: 'الراتب', type: 'number', required: true, step: '0.01' },
        { name: 'hireDate', label: 'تاريخ التعيين', type: 'date', required: true, default: 'today' },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('active', 'leave') }
      ]
    },

    users: {
      title: { add: 'مستخدم جديد', edit: 'تعديل بيانات المستخدم' },
      entity: 'users',
      fields: [
        { name: 'name', label: 'الاسم', type: 'text', required: true },
        { name: 'email', label: 'البريد الإلكتروني', type: 'email', required: true },
        { name: 'password', label: 'كلمة المرور', type: 'password', required: true,
          requiredOnCreateOnly: true, minlength: 8,
          placeholder: 'كلمة مرور قوية لا تقل عن 8 أحرف',
          editHint: 'اتركه فارغًا للإبقاء على كلمة المرور الحالية' },
        { name: 'passwordConfirm', label: 'تأكيد كلمة المرور', type: 'password', required: true,
          requiredOnCreateOnly: true, minlength: 8,
          placeholder: 'أعد كتابة نفس كلمة المرور',
          editHint: 'اتركه فارغًا لو لم تغيّر كلمة المرور' },
        { name: 'role', label: 'الدور', type: 'select', required: true,
          options: buildRoleOptions('super_admin', 'admin', 'accountant', 'sales_representative', 'warehouse_employee') },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('active', 'inactive') }
      ]
    },

    tasks: {
      title: { add: 'مهمة جديدة', edit: 'تعديل المهمة' },
      entity: 'tasks',
      fields: [
        { name: 'title', label: 'عنوان المهمة', type: 'text', required: true },
        { name: 'description', label: 'الوصف', type: 'text', required: false },
        { name: 'priority', label: 'الأولوية', type: 'select', required: true,
          options: buildPriorityOptions() },
        { name: 'status', label: 'الحالة', type: 'select', required: true,
          options: buildStatusOptions('pending', 'in_progress', 'done') },
        { name: 'dueDate', label: 'تاريخ الاستحقاق', type: 'date', required: false, allowFuture: true }
      ]
    },

    calendarEvents: {
      title: { add: 'حدث جديد', edit: 'تعديل الحدث' },
      entity: 'calendarEvents',
      fields: [
        { name: 'title', label: 'عنوان الحدث', type: 'text', required: true },
        { name: 'date', label: 'التاريخ', type: 'date', required: true, allowFuture: true },
        { name: 'time', label: 'الوقت', type: 'text', required: false },
        { name: 'type', label: 'النوع', type: 'select', required: true,
          options: [
            { value: 'meeting', label: 'اجتماع' },
            { value: 'reminder', label: 'تذكير' },
            { value: 'deadline', label: 'موعد نهائي' },
            { value: 'other', label: 'أخرى' }
          ] },
        { name: 'description', label: 'الوصف', type: 'text', required: false }
      ]
    }
  },

  /**
   * فتح نموذج إضافة جديد
   */
  openCreate(entityKey, defaults = {}) {
    const schema = this.schemas[entityKey];
    if (!schema) {
      UI.showToast('نموذج غير معرّف لهذا القسم', 'error');
      return;
    }
    this.currentSchema = schema;
    this.currentEntity = entityKey;
    this.currentId = null;
    this._render(schema.title.add, defaults || {});
  },

  /**
   * فتح نموذج تعديل لسجل موجود
   */
  openEdit(entityKey, id) {
    const schema = this.schemas[entityKey];
    if (!schema) {
      UI.showToast('نموذج غير معرّف لهذا القسم', 'error');
      return;
    }
    const record = DataStore.get(schema.entity, id);
    if (!record) {
      UI.showToast('لم يتم العثور على السجل', 'error');
      return;
    }
    this.currentSchema = schema;
    this.currentEntity = entityKey;
    this.currentId = id;
    this._render(schema.title.edit, record);
  },

  /**
   * بناء حقول النموذج داخل المودال وعرضه
   */
  _render(title, data) {
    const titleEl = document.getElementById('app-form-modal-title');
    const bodyEl = document.getElementById('app-form-modal-body');
    if (!titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = this._buildFieldsHtml(this.currentSchema.fields, data);

    const modalEl = document.getElementById('app-form-modal');
    if (!this.modalInstance) {
      this.modalInstance = new bootstrap.Modal(modalEl);
    }

    const formEl = document.getElementById('app-form-modal-form');
    // استبدال الفورم بنسخة نظيفة لإزالة أي مستمع submit سابق، مع الحفاظ على محتواه
    const newForm = formEl.cloneNode(false);
    newForm.innerHTML = formEl.innerHTML;
    formEl.parentNode.replaceChild(newForm, formEl);
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    this.modalInstance.show();
  },

  _buildFieldsHtml(fields, data) {
    return `<div class="row g-3">` + fields.map(field => {
      const value = this._resolveValue(field, data);
      const colClass = field.colClass || 'col-md-6';
      let inputHtml = '';

      const isRequired = field.required && !(field.requiredOnCreateOnly && this.currentId);

      if (field.type === 'select') {
        inputHtml = `
          <select class="form-select" name="${field.name}" ${isRequired ? 'required' : ''}>
            <option value="" disabled ${!value ? 'selected' : ''}>اختر...</option>
            ${field.options.map(opt => `<option value="${opt.value}" ${String(value) === String(opt.value) ? 'selected' : ''}>${opt.label}</option>`).join('')}
          </select>`;
      } else {
        inputHtml = `<input
          type="${field.type}"
          class="form-control"
          name="${field.name}"
          value="${Utils.sanitizeHtml(value !== undefined && value !== null ? String(value) : '')}"
          ${field.placeholder ? `placeholder="${Utils.sanitizeHtml(field.placeholder)}"` : ''}
          ${field.step ? `step="${field.step}"` : ''}
          ${field.minlength ? `minlength="${field.minlength}"` : ''}
          ${field.type === 'date' && field.allowFuture ? 'data-allow-future="true"' : ''}
          ${field.suggestFrom ? `list="datalist-${field.name}"` : ''}
          ${isRequired ? 'required' : ''}
        >
        ${field.suggestFrom ? this._buildDatalist(field) : ''}`;
      }

      const hintText = (field.requiredOnCreateOnly && this.currentId && field.editHint) ? field.editHint : field.hint;

      return `
        <div class="${colClass}">
          <label class="form-label">${field.label}${isRequired ? ' <span class="text-danger">*</span>' : ''}</label>
          ${inputHtml}
          ${hintText ? `<small class="form-text text-muted">${hintText}</small>` : ''}
        </div>`;
    }).join('') + `</div>`;
  },

  /**
   * يبني datalist لحقل نصي من القيم الفعلية الفريدة المستخدمة سابقًا في نفس
   * الحقل عبر سجلات نفس الكيان - اقتراح فقط وليس قيدًا (المستخدم يقدر يكتب
   * أي قيمة جديدة يريدها بحرية تامة)
   */
  _buildDatalist(field) {
    let values = [];
    try {
      const items = DataStore.list(this.currentSchema.entity);
      values = [...new Set(items.map(i => i[field.suggestFrom]).filter(Boolean))];
    } catch (e) { /* تجاهل لو الكيان غير متاح بعد */ }

    return `<datalist id="datalist-${field.name}">
      ${values.map(v => `<option value="${Utils.sanitizeHtml(v)}">`).join('')}
    </datalist>`;
  },

  _resolveValue(field, data) {
    if (data && data[field.name] !== undefined) return data[field.name];
    if (field.default === 'today') return Utils.formatDate(new Date(), 'YYYY-MM-DD');
    if (field.default !== undefined) return field.default;
    if (field.auto) return this._generateAutoNumber(field.auto);
    return '';
  },

  _generateAutoNumber(prefix) {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    return `${prefix}-${year}-${seq}`;
  },

  /**
   * معالجة إرسال النموذج: تحقق، حفظ، تحديث الصفحة
   */
  async _handleSubmit() {
    const form = document.getElementById('app-form-modal-form');
    const formData = new FormData(form);
    const data = {};
    const isEditing = !!this.currentId;

    for (const field of this.currentSchema.fields) {
      let value = formData.get(field.name);
      if (field.type === 'number') {
        value = value === '' ? null : parseFloat(value);
      }
      data[field.name] = value;
    }

    // تحقق أساسي من الحقول المطلوبة (مع مراعاة الحقول المطلوبة فقط عند
    // الإنشاء، زي كلمة المرور اللي يجوز تُترك فارغة عند التعديل)
    const missing = this.currentSchema.fields.filter(f => {
      const isRequired = f.required && !(f.requiredOnCreateOnly && isEditing);
      return isRequired && (data[f.name] === '' || data[f.name] === null || data[f.name] === undefined);
    });
    if (missing.length > 0) {
      UI.showToast(`يرجى تعبئة الحقول المطلوبة: ${missing.map(f => f.label).join('، ')}`, 'error');
      return;
    }

    const entity = this.currentSchema.entity;

    // معالجة خاصة بحقل كلمة المرور (مستخدمين فقط)
    if (entity === 'users') {
      if (data.password || data.passwordConfirm) {
        if (data.password !== data.passwordConfirm) {
          UI.showToast('كلمة المرور وتأكيدها غير متطابقين', 'error');
          return;
        }
        if (data.password.length < 8) {
          UI.showToast('كلمة المرور يجب ألا تقل عن 8 أحرف', 'error');
          return;
        }
      } else if (isEditing) {
        // تُرك فارغًا عند التعديل = لا تغيير في كلمة المرور
        delete data.password;
      }
      // حقل التأكيد للتحقق في الواجهة فقط، لا يُرسل للخادم أبدًا
      delete data.passwordConfirm;

      // الصلاحيات تُشتق دائمًا من الدور تلقائيًا (مصدر الحقيقة: CONFIG.ROLE_PERMISSIONS)
      if (data.role) {
        data.permissions = CONFIG.ROLE_PERMISSIONS[data.role]
          ? Object.assign({}, CONFIG.ROLE_PERMISSIONS[data.role])
          : {};
      }
    }

    try {
      if (entity === 'users' && typeof DataStore !== 'undefined' && DataStore.isApiConfigured()) {
        // المستخدمون لازم يُنشأوا فعليًا عبر الخادم (Apps Script) حتى يقدروا
        // يسجّلوا دخول حقيقي، وليس فقط يُحفظوا محليًا في متصفح المدير
        if (isEditing) {
          await API.users.update(this.currentId, data);
        } else {
          await API.users.create(data);
        }
        UI.showToast(isEditing ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح، ويمكنه تسجيل الدخول الآن', 'success');
      } else if (entity === 'users') {
        // وضع العرض التجريبي (بدون API حقيقي): لا يوجد نظام حسابات فعلي
        // لتسجيل الدخول به، لذلك لا نخزّن كلمة المرور محليًا إطلاقًا
        delete data.password;
        if (isEditing) {
          DataStore.update(entity, this.currentId, data);
        } else {
          DataStore.create(entity, data);
        }
        UI.showToast('تم الحفظ في وضع العرض التجريبي فقط. لتفعيل تسجيل دخول حقيقي، اربط رابط Apps Script من الإعدادات.', 'warning');
      } else if (isEditing) {
        DataStore.update(entity, this.currentId, data);
        UI.showToast('تم تحديث البيانات بنجاح', 'success');
      } else {
        DataStore.create(entity, data);
        UI.showToast('تمت الإضافة بنجاح', 'success');
      }
    } catch (error) {
      UI.showToast(error.message || 'حدث خطأ غير متوقع أثناء الحفظ', 'error');
      return;
    }

    this.modalInstance.hide();
    this._refreshCurrentPage();
  },

  /**
   * حذف سجل مع تأكيد
   */
  async remove(entityKey, id) {
    const schema = this.schemas[entityKey];
    if (!schema) return;

    const confirmed = await UI.confirm('تأكيد الحذف', 'هل أنت متأكد من حذف هذا السجل؟');
    if (!confirmed) return;

    try {
      DataStore.delete(schema.entity, id);
      UI.showToast('تم الحذف بنجاح', 'success');
    } catch (error) {
      UI.showToast(error.message || 'حدث خطأ غير متوقع أثناء الحذف', 'error');
      return;
    }

    this._refreshCurrentPage();
  },

  /**
   * إعادة رسم الصفحة الحالية لتعكس أحدث البيانات
   */
  _refreshCurrentPage() {
    if (typeof Router !== 'undefined' && Router.currentPage) {
      Router.loadPage(Router.currentPage);
    }
  }
};
