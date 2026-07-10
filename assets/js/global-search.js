/* =========================================
   Ahmed Batity ERP - Global Search
   =========================================
   بحث شامل في التوب بار يدوّر في كل الأقسام اللي المستخدم عنده صلاحية
   عرضها (عملاء، موردين، منتجات، فواتير مبيعات ومشتريات، مصروفات،
   إيرادات، موظفين، مهام)، ويودّي مباشرة لصفحة العنصر عند الاختيار.
   ========================================= */

const GlobalSearch = {
  MIN_CHARS: 2,
  MAX_RESULTS_PER_GROUP: 5,

  // كل قسم قابل للبحث فيه: الكيان بالمخزن، الوحدة (للتحقق من الصلاحية
  // وربط الأيقونة/التسمية)، والحقول النصية التي يُبحث داخلها لكل سجل
  SOURCES: [
    { entity: 'customers', module: 'customers', icon: 'fa-users', fields: ['name', 'email', 'phone'] },
    { entity: 'suppliers', module: 'suppliers', icon: 'fa-truck', fields: ['name', 'email', 'phone'] },
    { entity: 'products', module: 'products', icon: 'fa-box', fields: ['name', 'sku', 'barcode'] },
    { entity: 'sales', module: 'sales', icon: 'fa-shopping-cart', fields: ['invoiceNumber', 'customerName'] },
    { entity: 'salesReturns', module: 'sales-returns', icon: 'fa-undo', fields: ['returnNumber', 'customerName'] },
    { entity: 'purchases', module: 'purchases', icon: 'fa-shopping-basket', fields: ['invoiceNumber', 'supplierName'] },
    { entity: 'purchaseReturns', module: 'purchase-returns', icon: 'fa-undo', fields: ['returnNumber', 'supplierName'] },
    { entity: 'expenses', module: 'expenses', icon: 'fa-money-bill-wave', fields: ['description', 'category'] },
    { entity: 'income', module: 'income', icon: 'fa-hand-holding-usd', fields: ['description', 'category'] },
    { entity: 'employees', module: 'employees', icon: 'fa-id-badge', fields: ['name', 'email', 'position'] },
    { entity: 'tasks', module: 'tasks', icon: 'fa-tasks', fields: ['title', 'description'] },
    { entity: 'users', module: 'users', icon: 'fa-user-shield', fields: ['name', 'email'] }
  ],

  init() {
    this.input = document.getElementById('global-search-input');
    this.resultsBox = document.getElementById('global-search-results');
    this.clearBtn = document.getElementById('global-search-clear');
    this.container = document.getElementById('global-search');

    if (!this.input || !this.resultsBox) return;

    const debouncedSearch = Utils.debounce(() => this._handleInput(), 200);

    this.input.addEventListener('input', () => {
      this.clearBtn.classList.toggle('d-none', this.input.value.trim().length === 0);
      debouncedSearch();
    });

    this.input.addEventListener('focus', () => {
      if (this.input.value.trim().length >= this.MIN_CHARS) this._show();
    });

    this.input.addEventListener('keydown', (e) => this._handleKeydown(e));

    this.clearBtn.addEventListener('click', () => {
      this.input.value = '';
      this.clearBtn.classList.add('d-none');
      this._hide();
      this.input.focus();
    });

    // إغلاق النتائج عند الضغط خارج مربع البحث
    document.addEventListener('click', (e) => {
      if (this.container && !this.container.contains(e.target)) this._hide();
    });
  },

  async _handleInput() {
    const query = this.input.value.trim();
    if (query.length < this.MIN_CHARS) {
      this._renderHint();
      return;
    }
    const groups = await this._search(query);
    this._render(groups, query);
  },

  async _search(query) {
    const lowerQuery = query.toLowerCase();

    const allowedSources = this.SOURCES.filter(source => {
      return !(typeof Auth !== 'undefined' && !Auth.hasPermission(source.module, CONFIG.PERMISSIONS.VIEW));
    });

    const groupsResults = await Promise.all(allowedSources.map(async source => {
      let items;
      try {
        items = (await DataStore.list(source.entity)) || [];
      } catch (e) {
        items = [];
      }

      const matches = items.filter(item =>
        source.fields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(lowerQuery);
        })
      ).slice(0, this.MAX_RESULTS_PER_GROUP);

      return matches.length > 0 ? { source, matches } : null;
    }));

    return groupsResults.filter(Boolean);
  },

  _render(groups, query) {
    if (groups.length === 0) {
      this.resultsBox.innerHTML = `<div class="gs-empty">لا توجد نتائج لـ "${Utils.sanitizeHtml(query)}"</div>`;
      this._show();
      return;
    }

    const html = groups.map(({ source, matches }) => {
      const moduleLabel = (CONFIG.MODULE_LABELS && CONFIG.MODULE_LABELS[source.module]) || source.module;
      const items = matches.map(item => {
        const title = this._primaryText(item, source);
        const subtitle = this._secondaryText(item, source);
        return `
          <div class="gs-result-item" data-module="${source.module}" data-entity="${source.entity}" data-id="${item.id}">
            <div class="gs-result-icon"><i class="fas ${source.icon}"></i></div>
            <div class="gs-result-text">
              <div class="gs-result-title">${Utils.sanitizeHtml(title)}</div>
              ${subtitle ? `<div class="gs-result-subtitle">${Utils.sanitizeHtml(subtitle)}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `<div class="gs-group-label">${Utils.sanitizeHtml(moduleLabel)}</div>${items}`;
    }).join('');

    this.resultsBox.innerHTML = html;

    this.resultsBox.querySelectorAll('.gs-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const { module, entity, id } = el.dataset;
        this._openResult(module, entity, id);
      });
    });

    this._show();
  },

  _renderHint() {
    this.resultsBox.innerHTML = `<div class="gs-hint">اكتب حرفين على الأقل للبحث</div>`;
    this._show();
  },

  _primaryText(item, source) {
    return item.name || item.title || item.invoiceNumber || item.returnNumber || item.description || `#${item.id}`;
  },

  _secondaryText(item, source) {
    if (item.name && item.email) return item.email;
    if (item.invoiceNumber && (item.customerName || item.supplierName)) return item.customerName || item.supplierName;
    if (item.returnNumber && (item.customerName || item.supplierName)) return item.customerName || item.supplierName;
    if (item.title && item.status) return item.status;
    return '';
  },

  _openResult(module, entity, id) {
    this._hide();
    this.input.value = '';
    this.clearBtn.classList.add('d-none');

    Router.navigate(module);

    // فتح نموذج التعديل مباشرة على نفس العنصر بعد رسم الصفحة
    setTimeout(async () => {
      if (typeof Forms !== 'undefined' && Forms.schemas && Forms.schemas[entity]) {
        await Forms.openEdit(entity, id);
      }
    }, 150);
  },

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this._hide();
      this.input.blur();
      return;
    }

    if (e.key === 'Enter') {
      const first = this.resultsBox.querySelector('.gs-result-item');
      if (first) first.click();
    }
  },

  _show() {
    this.resultsBox.classList.add('show');
  },

  _hide() {
    this.resultsBox.classList.remove('show');
  }
};

window.GlobalSearch = GlobalSearch;
