/* =========================================
   Ahmed Batity ERP - Page Components
   ========================================= */

const Components = {

  // ====================
  // Dashboard
  // ====================
  renderDashboard() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const sales = DataStore.list('sales');
    const expenses = DataStore.list('expenses');
    const income = DataStore.list('income');

    const todaySales = sales
      .filter(s => (s.date || '').slice(0, 10) === todayStr)
      .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

    const monthSales = sales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalIncome = income.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const netProfit = (monthSales + totalIncome) - totalExpenses;

    return `
      <div class="dashboard-header" data-aos="fade-down">
        <h1>لوحة التحكم</h1>
        <p>مرحباً بك، إليك نظرة عامة على أداء عملك اليوم</p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-xl-3" data-aos="fade-up" data-aos-delay="0">
          <div class="stats-card primary">
            <div class="stats-icon primary"><i class="fas fa-shopping-cart"></i></div>
            <div class="stats-value">${Utils.formatCurrency(todaySales)}</div>
            <div class="stats-label">مبيعات اليوم</div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3" data-aos="fade-up" data-aos-delay="100">
          <div class="stats-card success">
            <div class="stats-icon success"><i class="fas fa-chart-line"></i></div>
            <div class="stats-value">${Utils.formatCurrency(monthSales)}</div>
            <div class="stats-label">إجمالي المبيعات (شهر)</div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3" data-aos="fade-up" data-aos-delay="200">
          <div class="stats-card warning">
            <div class="stats-icon warning"><i class="fas fa-money-bill-wave"></i></div>
            <div class="stats-value">${Utils.formatCurrency(totalExpenses)}</div>
            <div class="stats-label">المصروفات</div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3" data-aos="fade-up" data-aos-delay="300">
          <div class="stats-card info">
            <div class="stats-icon info"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="stats-value">${Utils.formatCurrency(netProfit)}</div>
            <div class="stats-label">صافي الربح</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-lg-8" data-aos="fade-up">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-chart-bar me-2"></i>مبيعات الشهر</h5>
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="#" onclick="event.preventDefault(); Components.exportSalesChart('pdf')"><i class="fas fa-file-pdf text-danger me-2"></i> تصدير PDF</a></li>
                  <li><a class="dropdown-item" href="#" onclick="event.preventDefault(); Components.exportSalesChart('excel')"><i class="fas fa-file-excel text-success me-2"></i> تصدير Excel</a></li>
                </ul>
              </div>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <canvas id="salesChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-4" data-aos="fade-up" data-aos-delay="100">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-chart-pie me-2"></i>توزيع المنتجات حسب الفئة</h5>
            </div>
            <div class="card-body">
              <div class="chart-container chart-container-sm">
                <canvas id="salesPieChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-6" data-aos="fade-up">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-history me-2"></i>آخر النشاطات</h5>
              <a href="#logs" class="btn btn-sm btn-link">عرض الكل</a>
            </div>
            <div class="card-body">
              <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>لا توجد نشاطات بعد</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6" data-aos="fade-up" data-aos-delay="100">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-tasks me-2"></i>مهام اليوم</h5>
              <a href="#tasks" class="btn btn-sm btn-link">عرض الكل</a>
            </div>
            <div class="card-body">
              <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>لا توجد مهام بعد</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * تهيئة الرسوم البيانية للوحة التحكم.
   * يجب استدعاؤها من Router بعد إدراج renderDashboard() في الصفحة عبر innerHTML،
   * لأن وسوم <script> المُدرجة عبر innerHTML لا تُنفَّذها المتصفحات إطلاقًا.
   */
  initDashboardCharts() {
    const salesLabels = ['1', '5', '10', '15', '20', '25', '30'];
    const salesData = [0, 0, 0, 0, 0, 0, 0];

    // نحتفظ بنفس البيانات المعروضة في الرسم البياني لاستخدامها عند التصدير
    // ملاحظة: هذه البيانات حاليًا Placeholder (أصفار) لحين ربط تجميع فعلي
    // لمبيعات الشهر من DataStore - التصدير سيعكس نفس الأرقام الحقيقية
    // تلقائيًا بمجرد حساب هذه القيم فعليًا بدل الأصفار الثابتة.
    this._salesChartData = { labels: salesLabels, values: salesData };

    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
      new Chart(salesCtx, {
        type: 'bar',
        data: {
          labels: salesLabels,
          datasets: [{
            label: 'المبيعات',
            data: salesData,
            backgroundColor: 'rgba(31, 95, 91, 0.8)',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    this._renderCategoryChart();
  },

  /**
   * يبني رسم "توزيع المنتجات حسب الفئة" من الفئات الفعلية التي كتبها
   * المستخدم بنفسه (حقل نصي حر في نموذج المنتج)، وليس من قائمة ثابتة.
   * القيمة المعروضة لكل فئة = مجموع (السعر × الكمية) لكل منتجاتها.
   */
  _renderCategoryChart() {
    const pieCtx = document.getElementById('salesPieChart');
    if (!pieCtx) return;

    const products = DataStore.list('products');
    const totalsByCategory = {};

    products.forEach(p => {
      const category = (p.category && String(p.category).trim()) || 'بدون فئة';
      const value = (Number(p.price) || 0) * (Number(p.quantity) || 0);
      totalsByCategory[category] = (totalsByCategory[category] || 0) + value;
    });

    const labels = Object.keys(totalsByCategory);
    const data = Object.values(totalsByCategory);

    // لوحة ألوان تتسع لأي عدد من الفئات التي يضيفها المستخدم (وليست محدودة بـ 4)
    const palette = ['#1F5F5B', '#2E7D5B', '#B7791F', '#6D7A76', '#4A6FA5', '#8B5CF6', '#DB2777', '#D97706'];
    const colors = labels.map((_, i) => palette[i % palette.length]);

    const noData = labels.length === 0 || data.every(v => v === 0);

    if (this._categoryChartInstance) {
      this._categoryChartInstance.destroy();
    }

    this._categoryChartInstance = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: noData ? ['لا توجد بيانات بعد'] : labels,
        datasets: [{
          data: noData ? [1] : data,
          backgroundColor: noData ? ['#E5E7EB'] : colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
          tooltip: { enabled: !noData }
        },
        cutout: '65%'
      }
    });
  },

  // ====================
  // Customers
  // ====================
  renderCustomers() {
    const rows = DataStore.list('customers').map(c => [
      c.id,
      Utils.sanitizeHtml(c.name),
      Utils.sanitizeHtml(c.email) || '-',
      Utils.sanitizeHtml(c.phone) || '-',
      Utils.formatCurrency(c.balance || 0),
      Utils.renderStatusBadge(c.status),
      this.renderTableActions('customers', c.id)
    ]);
    return this.renderDataGridPage({
      title: 'العملاء',
      icon: 'fa-users',
      addButton: 'إضافة عميل جديد',
      entityKey: 'customers',
      columns: ['#', 'الاسم', 'البريد الإلكتروني', 'الهاتف', 'الرصيد', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Suppliers
  // ====================
  renderSuppliers() {
    const rows = DataStore.list('suppliers').map(s => [
      s.id,
      Utils.sanitizeHtml(s.name),
      Utils.sanitizeHtml(s.email) || '-',
      Utils.sanitizeHtml(s.phone) || '-',
      Utils.formatCurrency(s.balance || 0),
      Utils.renderStatusBadge(s.status),
      this.renderTableActions('suppliers', s.id)
    ]);
    return this.renderDataGridPage({
      title: 'الموردين',
      icon: 'fa-truck',
      addButton: 'إضافة مورد جديد',
      entityKey: 'suppliers',
      columns: ['#', 'الاسم', 'البريد الإلكتروني', 'الهاتف', 'الرصيد', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Products
  // ====================
  renderProducts() {
    const rows = DataStore.list('products').map(p => [
      p.id,
      '<div class="avatar avatar-sm avatar-primary"><i class="fas fa-box"></i></div>',
      Utils.sanitizeHtml(p.name),
      Utils.sanitizeHtml(p.sku) || '-',
      Utils.formatCurrency(p.price || 0),
      p.quantity ?? 0,
      Utils.renderStatusBadge(p.quantity > 0 ? CONFIG.STATUS.AVAILABLE : CONFIG.STATUS.OUT_OF_STOCK),
      this.renderTableActions('products', p.id)
    ]);
    return this.renderDataGridPage({
      title: 'المنتجات',
      icon: 'fa-boxes',
      addButton: 'إضافة منتج جديد',
      entityKey: 'products',
      columns: ['#', 'الصورة', 'الاسم', 'الرمز', 'السعر', 'المخزون', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Inventory
  // ====================
  renderInventory() {
    const rows = DataStore.list('products').map(p => [
      p.id,
      Utils.sanitizeHtml(p.name),
      'المستودع الرئيسي',
      p.quantity ?? 0,
      5,
      Utils.renderStatusBadge(p.quantity > 0 ? CONFIG.STATUS.AVAILABLE : CONFIG.STATUS.OUT_OF_STOCK),
      `<button class="btn btn-sm btn-outline-warning" title="تعديل الكمية" onclick="Forms.openEdit('products', '${p.id}')"><i class="fas fa-edit"></i></button>`
    ]);
    return this.renderDataGridPage({
      title: 'المخزون',
      icon: 'fa-warehouse',
      addButton: 'إضافة منتج جديد',
      entityKey: 'products',
      columns: ['#', 'المنتج', 'المستودع', 'الكمية', 'الحد الأدنى', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Sales
  // ====================
  renderSales() {
    const rows = DataStore.list('sales').map(s => [
      s.id,
      Utils.sanitizeHtml(s.invoiceNumber),
      Utils.sanitizeHtml(s.customerName),
      Utils.formatDate(s.date),
      Utils.formatCurrency(s.amount || 0),
      Utils.renderStatusBadge(s.status),
      this.renderTableActions('sales', s.id)
    ]);
    return this.renderDataGridPage({
      title: 'فواتير المبيعات',
      icon: 'fa-shopping-cart',
      addButton: 'فاتورة جديدة',
      entityKey: 'sales',
      columns: ['#', 'رقم الفاتورة', 'العميل', 'التاريخ', 'المبلغ', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Sales Returns
  // ====================
  renderSalesReturns() {
    const rows = DataStore.list('salesReturns').map(r => [
      r.id,
      Utils.sanitizeHtml(r.returnNumber),
      Utils.sanitizeHtml(r.customerName),
      Utils.formatDate(r.date),
      Utils.formatCurrency(r.amount || 0),
      Utils.renderStatusBadge(r.status),
      this.renderTableActions('salesReturns', r.id)
    ]);
    return this.renderDataGridPage({
      title: 'مردودات المبيعات',
      icon: 'fa-undo',
      addButton: 'مردود مبيعات جديد',
      entityKey: 'salesReturns',
      columns: ['#', 'رقم المردود', 'العميل', 'التاريخ', 'المبلغ', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Purchases
  // ====================
  renderPurchases() {
    const rows = DataStore.list('purchases').map(p => [
      p.id,
      Utils.sanitizeHtml(p.invoiceNumber),
      Utils.sanitizeHtml(p.supplierName),
      Utils.formatDate(p.date),
      Utils.formatCurrency(p.amount || 0),
      Utils.renderStatusBadge(p.status),
      this.renderTableActions('purchases', p.id)
    ]);
    return this.renderDataGridPage({
      title: 'فواتير المشتريات',
      icon: 'fa-shopping-basket',
      addButton: 'فاتورة شراء جديدة',
      entityKey: 'purchases',
      columns: ['#', 'رقم الفاتورة', 'المورد', 'التاريخ', 'المبلغ', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Purchase Returns
  // ====================
  renderPurchaseReturns() {
    const rows = DataStore.list('purchaseReturns').map(r => [
      r.id,
      Utils.sanitizeHtml(r.returnNumber),
      Utils.sanitizeHtml(r.supplierName),
      Utils.formatDate(r.date),
      Utils.formatCurrency(r.amount || 0),
      Utils.renderStatusBadge(r.status),
      this.renderTableActions('purchaseReturns', r.id)
    ]);
    return this.renderDataGridPage({
      title: 'مردودات المشتريات',
      icon: 'fa-undo',
      addButton: 'مردود مشتريات جديد',
      entityKey: 'purchaseReturns',
      columns: ['#', 'رقم المردود', 'المورد', 'التاريخ', 'المبلغ', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Expenses
  // ====================
  renderExpenses() {
    const rows = DataStore.list('expenses').map(e => [
      e.id,
      Utils.formatDate(e.date),
      Utils.sanitizeHtml(e.category),
      Utils.sanitizeHtml(e.description),
      Utils.formatCurrency(e.amount || 0),
      this.renderTableActions('expenses', e.id)
    ]);
    return this.renderDataGridPage({
      title: 'المصروفات',
      icon: 'fa-money-bill-wave',
      addButton: 'مصروف جديد',
      entityKey: 'expenses',
      columns: ['#', 'التاريخ', 'الفئة', 'الوصف', 'المبلغ', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Income
  // ====================
  renderIncome() {
    const rows = DataStore.list('income').map(i => [
      i.id,
      Utils.formatDate(i.date),
      Utils.sanitizeHtml(i.category),
      Utils.sanitizeHtml(i.description),
      Utils.formatCurrency(i.amount || 0),
      this.renderTableActions('income', i.id)
    ]);
    return this.renderDataGridPage({
      title: 'الإيرادات',
      icon: 'fa-hand-holding-usd',
      addButton: 'إيراد جديد',
      entityKey: 'income',
      columns: ['#', 'التاريخ', 'الفئة', 'الوصف', 'المبلغ', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Employees
  // ====================
  renderEmployees() {
    const rows = DataStore.list('employees').map(e => [
      e.id,
      Utils.sanitizeHtml(e.name),
      Utils.sanitizeHtml(e.department),
      Utils.formatCurrency(e.salary || 0),
      Utils.formatDate(e.hireDate),
      Utils.renderStatusBadge(e.status),
      this.renderTableActions('employees', e.id)
    ]);
    return this.renderDataGridPage({
      title: 'الموظفين',
      icon: 'fa-user-tie',
      addButton: 'موظف جديد',
      entityKey: 'employees',
      columns: ['#', 'الاسم', 'القسم', 'الراتب', 'تاريخ التعيين', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Attendance
  // ====================
  renderAttendance() {
    const employees = DataStore.list('employees');
    const hasEmployees = employees.length > 0;

    const employeeOptions = employees
      .map(e => `<option value="${e.id}">${Utils.sanitizeHtml(e.name)}</option>`)
      .join('');

    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-clock me-2"></i>الحضور والانصراف</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Components.attendanceCheckIn()" ${hasEmployees ? '' : 'disabled'}>
            <i class="fas fa-sign-in-alt"></i> تسجيل حضور
          </button>
          <button class="btn btn-outline-danger" onclick="Components.attendanceCheckOut()" ${hasEmployees ? '' : 'disabled'}>
            <i class="fas fa-sign-out-alt"></i> تسجيل انصراف
          </button>
        </div>
      </div>

      ${hasEmployees ? `
        <div class="card mb-3" data-aos="fade-up">
          <div class="card-body d-flex align-items-center gap-2 flex-wrap">
            <label class="mb-0 fw-bold" style="min-width:110px">الموظف:</label>
            <select class="form-select" id="attendance-employee-select" style="max-width:280px">
              ${employeeOptions}
            </select>
          </div>
        </div>
      ` : `
        <div class="alert alert-warning" data-aos="fade-up">
          <i class="fas fa-exclamation-triangle"></i>
          لا يوجد موظفين مسجّلين بعد. أضف موظفًا أولًا من صفحة
          <a href="#employees" data-page="employees">الموظفين</a> لتتمكن من تسجيل الحضور.
        </div>
      `}

      <div class="card" data-aos="fade-up">
        <div class="card-header">
          <h5>سجل الحضور</h5>
          <div class="d-flex gap-2">
            <input type="date" class="form-control form-control-sm" id="attendance-date-filter" style="width:150px" onchange="Components.refreshAttendanceTable()">
            <button class="btn btn-sm btn-outline-secondary" onclick="Components.resetAttendanceFilter()" title="إعادة تعيين"><i class="fas fa-rotate-left"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div class="data-grid" id="attendance-table-container">
            ${this.renderAttendanceTable()}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * يبني جدول سجل الحضور بناءً على فلتر التاريخ الحالي
   */
  renderAttendanceTable() {
    const dateInput = document.getElementById('attendance-date-filter');
    const filterDate = dateInput ? dateInput.value : '';

    let records = DataStore.list('attendance');
    if (filterDate) {
      records = records.filter(r => r.date === filterDate);
    }
    records = records.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    const hasRows = records.length > 0;
    const rowsHtml = hasRows
      ? records.map(r => {
          const hours = this._calcWorkHours(r.checkIn, r.checkOut);
          const statusBadge = r.checkOut
            ? '<span class="badge bg-secondary">منصرف</span>'
            : '<span class="badge bg-success">حاضر</span>';
          return `<tr>
            <td data-label="التاريخ"><div class="td-content">${Utils.formatDate(r.date)}</div></td>
            <td data-label="الموظف"><div class="td-content">${Utils.sanitizeHtml(r.employeeName)}</div></td>
            <td data-label="وقت الحضور"><div class="td-content">${r.checkIn ? Utils.formatDate(r.checkIn, 'HH:mm') : '-'}</div></td>
            <td data-label="وقت الانصراف"><div class="td-content">${r.checkOut ? Utils.formatDate(r.checkOut, 'HH:mm') : '-'}</div></td>
            <td data-label="ساعات العمل"><div class="td-content">${hours}</div></td>
            <td data-label="الحالة"><div class="td-content">${statusBadge}</div></td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-clock"></i><p>لا توجد بيانات حضور بعد</p></div></td></tr>`;

    return `
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>التاريخ</th><th>الموظف</th><th>وقت الحضور</th><th>وقت الانصراف</th><th>ساعات العمل</th><th>الحالة</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  },

  refreshAttendanceTable() {
    const container = document.getElementById('attendance-table-container');
    if (container) container.innerHTML = this.renderAttendanceTable();
  },

  resetAttendanceFilter() {
    const dateInput = document.getElementById('attendance-date-filter');
    if (dateInput) dateInput.value = '';
    this.refreshAttendanceTable();
  },

  _calcWorkHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return '-';
    const diffMs = new Date(checkOut) - new Date(checkIn);
    if (isNaN(diffMs) || diffMs <= 0) return '-';
    const hours = diffMs / (1000 * 60 * 60);
    return `${hours.toFixed(1)} ساعة`;
  },

  _selectedEmployee() {
    const select = document.getElementById('attendance-employee-select');
    if (!select || !select.value) return null;
    const employees = DataStore.list('employees');
    return employees.find(e => String(e.id) === String(select.value)) || null;
  },

  _todayISO() {
    return new Date().toISOString().slice(0, 10);
  },

  attendanceCheckIn() {
    const employee = this._selectedEmployee();
    if (!employee) {
      UI.showToast('اختر الموظف أولًا', 'warning');
      return;
    }

    const today = this._todayISO();
    const existing = DataStore.list('attendance').find(
      r => String(r.employeeId) === String(employee.id) && r.date === today
    );

    if (existing) {
      UI.showToast(`${employee.name} مسجّل حضوره بالفعل اليوم`, 'warning');
      return;
    }

    try {
      DataStore.create('attendance', {
        employeeId: employee.id,
        employeeName: employee.name,
        date: today,
        checkIn: new Date().toISOString(),
        checkOut: null
      });
      UI.showToast(`تم تسجيل حضور ${employee.name}`, 'success');
      this.refreshAttendanceTable();
    } catch (error) {
      UI.showToast(error.message || 'حدث خطأ أثناء تسجيل الحضور', 'error');
    }
  },

  attendanceCheckOut() {
    const employee = this._selectedEmployee();
    if (!employee) {
      UI.showToast('اختر الموظف أولًا', 'warning');
      return;
    }

    const today = this._todayISO();
    const existing = DataStore.list('attendance').find(
      r => String(r.employeeId) === String(employee.id) && r.date === today
    );

    if (!existing) {
      UI.showToast(`${employee.name} لم يسجّل حضوره اليوم بعد`, 'warning');
      return;
    }

    if (existing.checkOut) {
      UI.showToast(`${employee.name} مسجّل انصرافه بالفعل اليوم`, 'warning');
      return;
    }

    try {
      DataStore.update('attendance', existing.id, { checkOut: new Date().toISOString() });
      UI.showToast(`تم تسجيل انصراف ${employee.name}`, 'success');
      this.refreshAttendanceTable();
    } catch (error) {
      UI.showToast(error.message || 'حدث خطأ أثناء تسجيل الانصراف', 'error');
    }
  },

  // ====================
  // Tasks
  // ====================
  renderTasks() {
    const tasks = DataStore.list('tasks');

    const renderCard = (t) => `
      <div class="kanban-card">
        <div class="d-flex justify-content-between align-items-start">
          <h6>${Utils.sanitizeHtml(t.title)}</h6>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline-warning" title="تعديل" onclick="Forms.openEdit('tasks', '${t.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-outline-danger" title="حذف" onclick="Forms.remove('tasks', '${t.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        ${t.description ? `<p>${Utils.sanitizeHtml(t.description)}</p>` : ''}
        <div class="kanban-card-footer">
          <div class="kanban-card-tags">
            <span class="kanban-tag" style="${(CONFIG.PRIORITY_META[t.priority] || {}).style || ''}">${(CONFIG.PRIORITY_META[t.priority] || {}).label || t.priority}</span>
          </div>
          <small>${t.dueDate ? Utils.formatDate(t.dueDate) : ''}</small>
        </div>
      </div>`;

    const pending = tasks.filter(t => t.status === CONFIG.STATUS.PENDING);
    const inProgress = tasks.filter(t => t.status === CONFIG.STATUS.IN_PROGRESS);
    const done = tasks.filter(t => t.status === CONFIG.STATUS.DONE);

    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-tasks me-2"></i>المهام</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Forms.openCreate('tasks')">
            <i class="fas fa-plus"></i> مهمة جديدة
          </button>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-4" data-aos="fade-up">
          <div class="kanban-column">
            <div class="kanban-column-header">
              <h6>قيد الانتظار</h6>
              <span class="kanban-count">${pending.length}</span>
            </div>
            ${pending.map(renderCard).join('')}
          </div>
        </div>
        <div class="col-12 col-lg-4" data-aos="fade-up" data-aos-delay="100">
          <div class="kanban-column">
            <div class="kanban-column-header">
              <h6>قيد التنفيذ</h6>
              <span class="kanban-count">${inProgress.length}</span>
            </div>
            ${inProgress.map(renderCard).join('')}
          </div>
        </div>
        <div class="col-12 col-lg-4" data-aos="fade-up" data-aos-delay="200">
          <div class="kanban-column">
            <div class="kanban-column-header">
              <h6>منتهية</h6>
              <span class="kanban-count">${done.length}</span>
            </div>
            ${done.map(renderCard).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ====================
  // Calendar
  // ====================
  renderCalendar() {
    if (!this._calendarState) {
      const now = new Date();
      this._calendarState = { year: now.getFullYear(), month: now.getMonth() };
    }

    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-calendar-alt me-2"></i>التقويم</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Forms.openCreate('calendarEvents', { date: Components._todayISO() })">
            <i class="fas fa-plus"></i> حدث جديد
          </button>
        </div>
      </div>

      <div id="calendar-widget-container">
        ${this.renderCalendarWidget()}
      </div>
    `;
  },

  /**
   * يبني عنصر التقويم فقط (رأس الشهر + الشبكة) بناءً على _calendarState الحالي،
   * لإعادة رسمه جزئيًا عند التنقل بين الشهور بدل إعادة تحميل الصفحة كاملة
   */
  renderCalendarWidget() {
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const { year, month } = this._calendarState;
    const today = new Date();

    const events = DataStore.list('calendarEvents');
    const eventsByDay = {};
    events.forEach(ev => {
      if (!ev.date) return;
      const d = new Date(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        (eventsByDay[day] = eventsByDay[day] || []).push(ev);
      }
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      cells.push(`<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDay[day] || [];

      const tagsHtml = dayEvents.slice(0, 2).map(ev => {
        const typeClass = { meeting: 'primary', reminder: 'warning', deadline: 'danger', other: 'secondary' }[ev.type] || 'secondary';
        return `<div class="calendar-event-tag bg-${typeClass}" title="${Utils.sanitizeHtml(ev.title)}"
                     onclick="event.stopPropagation(); Forms.openEdit('calendarEvents', '${ev.id}')">${Utils.sanitizeHtml(ev.title)}</div>`;
      }).join('');
      const moreHtml = dayEvents.length > 2 ? `<div class="calendar-event-more">+${dayEvents.length - 2}</div>` : '';

      cells.push(`
        <div class="calendar-day${isToday ? ' today' : ''}" onclick="Forms.openCreate('calendarEvents', { date: '${dateStr}' })">
          <span class="calendar-day-number">${day}</span>
          <div class="calendar-day-events">${tagsHtml}${moreHtml}</div>
        </div>
      `);
    }
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      cells.push(`<div class="calendar-day other-month">${day}</div>`);
    }

    return `
      <div class="calendar-widget" data-aos="fade-up">
        <div class="calendar-header">
          <h6>${monthNames[month]} ${year}</h6>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" onclick="Components.navigateCalendarMonth(-1)"><i class="fas fa-chevron-right"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="Components.navigateCalendarMonth(1)"><i class="fas fa-chevron-left"></i></button>
          </div>
        </div>
        <div class="calendar-grid">
          <div class="calendar-day-header">أحد</div>
          <div class="calendar-day-header">إثنين</div>
          <div class="calendar-day-header">ثلاثاء</div>
          <div class="calendar-day-header">أربعاء</div>
          <div class="calendar-day-header">خميس</div>
          <div class="calendar-day-header">جمعة</div>
          <div class="calendar-day-header">سبت</div>
          ${cells.join('')}
        </div>
      </div>
    `;
  },

  navigateCalendarMonth(delta) {
    if (!this._calendarState) {
      const now = new Date();
      this._calendarState = { year: now.getFullYear(), month: now.getMonth() };
    }
    let { year, month } = this._calendarState;
    month += delta;
    if (month > 11) { month = 0; year += 1; }
    if (month < 0) { month = 11; year -= 1; }
    this._calendarState = { year, month };

    const container = document.getElementById('calendar-widget-container');
    if (container) container.innerHTML = this.renderCalendarWidget();
  },

  // ====================
  // Reports
  // ====================
  renderReports() {
    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-file-alt me-2"></i>التقارير</h2>
      </div>

      <div class="row g-3">
        <div class="col-12 col-sm-6 col-lg-4" data-aos="fade-up">
          <div class="card h-100">
            <div class="card-body text-center py-4">
              <div class="stats-icon primary mx-auto mb-3"><i class="fas fa-shopping-cart"></i></div>
              <h5>تقرير المبيعات</h5>
              <p class="text-muted small">تقرير مفصل بجميع عمليات البيع</p>
              <button class="btn btn-primary btn-sm mt-2" onclick="Router.navigate('sales')"><i class="fas fa-eye"></i> عرض</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
          <div class="card h-100">
            <div class="card-body text-center py-4">
              <div class="stats-icon success mx-auto mb-3"><i class="fas fa-shopping-basket"></i></div>
              <h5>تقرير المشتريات</h5>
              <p class="text-muted small">تقرير مفصل بجميع عمليات الشراء</p>
              <button class="btn btn-success btn-sm mt-2" onclick="Router.navigate('purchases')"><i class="fas fa-eye"></i> عرض</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay="200">
          <div class="card h-100">
            <div class="card-body text-center py-4">
              <div class="stats-icon warning mx-auto mb-3"><i class="fas fa-warehouse"></i></div>
              <h5>تقرير المخزون</h5>
              <p class="text-muted small">تقرير بحالة المخزون والمنتجات</p>
              <button class="btn btn-warning btn-sm mt-2" onclick="Router.navigate('inventory')"><i class="fas fa-eye"></i> عرض</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4" data-aos="fade-up">
          <div class="card h-100">
            <div class="card-body text-center py-4">
              <div class="stats-icon info mx-auto mb-3"><i class="fas fa-chart-line"></i></div>
              <h5>التقرير المالي</h5>
              <p class="text-muted small">تقرير بالإيرادات والمصروفات والأرباح</p>
              <button class="btn btn-info btn-sm mt-2" onclick="Router.navigate('financial-report')"><i class="fas fa-eye"></i> عرض</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
          <div class="card h-100">
            <div class="card-body text-center py-4">
              <div class="stats-icon purple mx-auto mb-3"><i class="fas fa-users"></i></div>
              <h5>تقرير العملاء</h5>
              <p class="text-muted small">تقرير بأداء العملاء والمبيعات</p>
              <button class="btn btn-outline-primary btn-sm mt-2" onclick="Router.navigate('customers')"><i class="fas fa-eye"></i> عرض</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay="200">
          <div class="card h-100">
            <div class="card-body text-center py-4">
              <div class="stats-icon danger mx-auto mb-3"><i class="fas fa-user-tie"></i></div>
              <h5>تقرير الموظفين</h5>
              <p class="text-muted small">تقرير بالحضور والأداء الوظيفي</p>
              <button class="btn btn-outline-danger btn-sm mt-2" onclick="Router.navigate('employees')"><i class="fas fa-eye"></i> عرض</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ====================
  // Financial Report (يجمع الإيرادات والمصروفات في عرض واحد)
  // ====================
  renderFinancialReport() {
    const expenses = DataStore.list('expenses');
    const income = DataStore.list('income');

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    const combined = [
      ...income.map(i => ({ ...i, _type: 'income' })),
      ...expenses.map(e => ({ ...e, _type: 'expense' }))
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const rows = combined.map(item => [
      item.id,
      Utils.formatDate(item.date),
      item._type === 'income'
        ? '<span class="badge bg-success">إيراد</span>'
        : '<span class="badge bg-danger">مصروف</span>',
      Utils.sanitizeHtml(item.category || '-'),
      Utils.sanitizeHtml(item.description || '-'),
      Utils.formatCurrency(item.amount || 0)
    ]);

    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-chart-line me-2"></i>التقرير المالي</h2>
        <div class="page-actions">
          <button class="btn btn-outline-secondary" onclick="Router.navigate('reports')">
            <i class="fas fa-arrow-right"></i> رجوع للتقارير
          </button>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-4" data-aos="fade-up">
          <div class="stats-card success">
            <div class="stats-icon success"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="stats-value">${Utils.formatCurrency(totalIncome)}</div>
            <div class="stats-label">إجمالي الإيرادات</div>
          </div>
        </div>
        <div class="col-12 col-sm-4" data-aos="fade-up" data-aos-delay="100">
          <div class="stats-card danger">
            <div class="stats-icon danger"><i class="fas fa-money-bill-wave"></i></div>
            <div class="stats-value">${Utils.formatCurrency(totalExpenses)}</div>
            <div class="stats-label">إجمالي المصروفات</div>
          </div>
        </div>
        <div class="col-12 col-sm-4" data-aos="fade-up" data-aos-delay="200">
          <div class="stats-card info">
            <div class="stats-icon info"><i class="fas fa-balance-scale"></i></div>
            <div class="stats-value">${Utils.formatCurrency(netProfit)}</div>
            <div class="stats-label">صافي الربح</div>
          </div>
        </div>
      </div>

      ${this.renderDataGridPage({
        title: 'التقرير المالي - كل الحركات',
        icon: 'fa-chart-line',
        columns: ['#', 'التاريخ', 'النوع', 'الفئة', 'الوصف', 'المبلغ'],
        rows,
        hideAddButton: true
      })}
    `;
  },

  // ====================
  // Settings
  // ====================
  renderSettings() {
    const settings = this.loadSettings();

    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-cog me-2"></i>الإعدادات</h2>
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-8" data-aos="fade-up">
          <div class="card">
            <div class="card-header"><h5>إعدادات عامة</h5></div>
            <div class="card-body">
              <form id="settings-form" onsubmit="event.preventDefault(); Components.saveSettings();">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">اسم الشركة</label>
                    <input type="text" class="form-control" id="setting-company-name" value="${Utils.sanitizeHtml(settings.companyName)}">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">البريد الإلكتروني</label>
                    <input type="email" class="form-control" id="setting-company-email" value="${Utils.sanitizeHtml(settings.companyEmail)}">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">الهاتف</label>
                    <input type="tel" class="form-control" id="setting-company-phone" value="${Utils.sanitizeHtml(settings.companyPhone)}">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">العنوان</label>
                    <input type="text" class="form-control" id="setting-company-address" value="${Utils.sanitizeHtml(settings.companyAddress)}">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">العملة الافتراضية</label>
                    <select class="form-select" id="setting-currency">
                      <option value="EGP" ${settings.currency === 'EGP' ? 'selected' : ''}>جنيه مصري (L.E)</option>
                      <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>دولار أمريكي ($)</option>
                      <option value="SAR" ${settings.currency === 'SAR' ? 'selected' : ''}>ريال سعودي (SAR)</option>
                      <option value="AED" ${settings.currency === 'AED' ? 'selected' : ''}>درهم إماراتي (AED)</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">تنسيق التاريخ</label>
                    <select class="form-select" id="setting-date-format">
                      <option value="DD/MM/YYYY" ${settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">العناصر في الصفحة</label>
                    <select class="form-select" id="setting-items-per-page">
                      <option value="10" ${settings.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                      <option value="25" ${settings.itemsPerPage === 25 ? 'selected' : ''}>25</option>
                      <option value="50" ${settings.itemsPerPage === 50 ? 'selected' : ''}>50</option>
                      <option value="100" ${settings.itemsPerPage === 100 ? 'selected' : ''}>100</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4">
                  <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ الإعدادات</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-4" data-aos="fade-up" data-aos-delay="100">
          <div class="card">
            <div class="card-header"><h5>إعدادات النسخ الاحتياطي</h5></div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">النسخ الاحتياطي التلقائي</label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="setting-auto-backup-enabled" ${settings.autoBackupEnabled ? 'checked' : ''}>
                  <label class="form-check-label">تفعيل</label>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">تكرار النسخ الاحتياطي</label>
                <select class="form-select" id="setting-backup-frequency">
                  <option value="daily" ${settings.backupFrequency === 'daily' ? 'selected' : ''}>يومي</option>
                  <option value="weekly" ${settings.backupFrequency === 'weekly' ? 'selected' : ''}>أسبوعي</option>
                  <option value="monthly" ${settings.backupFrequency === 'monthly' ? 'selected' : ''}>شهري</option>
                </select>
              </div>
              <div class="mb-3">
                <button class="btn btn-outline-primary w-100" onclick="Components.saveBackupSettings()">
                  <i class="fas fa-save"></i> حفظ إعدادات النسخ
                </button>
              </div>
              <hr>
              <button class="btn btn-primary w-100" onclick="Components.createBackup()">
                <i class="fas fa-cloud-upload-alt"></i> نسخ احتياطي يدوي الآن
              </button>
              ${settings.lastAutoBackup ? `
                <p class="text-muted small mt-2 mb-0 text-center">
                  آخر نسخة تلقائية: ${Utils.formatDate(settings.lastAutoBackup, 'DD/MM/YYYY HH:mm')}
                </p>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * تحميل إعدادات النظام المحفوظة، أو القيم الافتراضية لو أول استخدام
   */
  loadSettings() {
    const defaults = {
      companyName: 'Ahmed Batity ERP',
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      currency: CONFIG.CURRENCY.CODE,
      dateFormat: CONFIG.DATE.DISPLAY_FORMAT,
      itemsPerPage: 25,
      autoBackupEnabled: false,
      backupFrequency: 'weekly',
      lastAutoBackup: null
    };
    const stored = Utils.storage.get('erp_settings', {});
    return Object.assign({}, defaults, stored);
  },

  /**
   * يطبّق الإعدادات المحفوظة فعليًا على سلوك التطبيق (العملة، تنسيق التاريخ)
   * تُستدعى مرة عند بدء تشغيل التطبيق حتى تنعكس الإعدادات فورًا من أول تحميل
   */
  applySettings() {
    const settings = this.loadSettings();
    const currencySymbols = { EGP: 'L.E', USD: '$', SAR: 'SAR', AED: 'AED' };

    CONFIG.CURRENCY.CODE = settings.currency;
    CONFIG.CURRENCY.SYMBOL = currencySymbols[settings.currency] || settings.currency;
    CONFIG.DATE.DISPLAY_FORMAT = settings.dateFormat;
  },

  saveSettings() {
    const email = document.getElementById('setting-company-email').value.trim();
    if (email && !Utils.isValidEmail(email)) {
      UI.showToast('صيغة البريد الإلكتروني غير صحيحة', 'error');
      return;
    }

    const current = this.loadSettings();
    const updated = Object.assign({}, current, {
      companyName: document.getElementById('setting-company-name').value.trim(),
      companyEmail: email,
      companyPhone: document.getElementById('setting-company-phone').value.trim(),
      companyAddress: document.getElementById('setting-company-address').value.trim(),
      currency: document.getElementById('setting-currency').value,
      dateFormat: document.getElementById('setting-date-format').value,
      itemsPerPage: parseInt(document.getElementById('setting-items-per-page').value, 10)
    });

    Utils.storage.set('erp_settings', updated);
    this.applySettings();
    UI.showToast('تم حفظ الإعدادات بنجاح', 'success');
  },

  saveBackupSettings() {
    const current = this.loadSettings();
    const updated = Object.assign({}, current, {
      autoBackupEnabled: document.getElementById('setting-auto-backup-enabled').checked,
      backupFrequency: document.getElementById('setting-backup-frequency').value
    });

    Utils.storage.set('erp_settings', updated);
    UI.showToast('تم حفظ إعدادات النسخ الاحتياطي', 'success');
  },

  /**
   * فحص دوري بسيط (يُستدعى عند بدء تشغيل التطبيق) لتنفيذ نسخة احتياطية
   * تلقائية لو كانت مفعّلة والوقت المحدد بحسب التكرار قد حان
   */
  checkAutoBackup() {
    const settings = this.loadSettings();
    if (!settings.autoBackupEnabled) return;

    const intervalsMs = { daily: 86400000, weekly: 604800000, monthly: 2592000000 };
    const interval = intervalsMs[settings.backupFrequency] || intervalsMs.weekly;
    const last = settings.lastAutoBackup ? new Date(settings.lastAutoBackup).getTime() : 0;

    if (Date.now() - last < interval) return;

    try {
      const payload = this._gatherBackupData();
      const json = JSON.stringify(payload);
      const sizeKB = (new Blob([json]).size / 1024).toFixed(1);

      DataStore.create('backups', { type: 'تلقائي', status: 'مكتمل', sizeKB, payload: json });

      const updated = Object.assign({}, settings, { lastAutoBackup: new Date().toISOString() });
      Utils.storage.set('erp_settings', updated);
    } catch (e) {
      console.error('Auto backup failed:', e);
    }
  },

  // ====================
  // Users
  // ====================
  renderUsers() {
    const rows = DataStore.list('users').map(u => [
      u.id,
      Utils.sanitizeHtml(u.name),
      Utils.sanitizeHtml(u.email),
      Utils.getRoleLabel(u.role),
      u.lastLogin ? Utils.formatDate(u.lastLogin) : '-',
      Utils.renderStatusBadge(u.status),
      this.renderTableActions('users', u.id)
    ]);
    return this.renderDataGridPage({
      title: 'المستخدمين',
      icon: 'fa-user-shield',
      addButton: 'مستخدم جديد',
      entityKey: 'users',
      columns: ['#', 'الاسم', 'البريد الإلكتروني', 'الدور', 'آخر دخول', 'الحالة', 'الإجراءات'],
      rows
    });
  },

  // ====================
  // Backup
  // ====================
  renderBackup() {
    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-cloud-upload-alt me-2"></i>النسخ الاحتياطي</h2>
        <div class="page-actions">
          <button class="btn btn-outline-secondary" onclick="document.getElementById('backup-restore-input').click()">
            <i class="fas fa-upload"></i> استعادة نسخة
          </button>
          <input type="file" id="backup-restore-input" accept="application/json" class="d-none" onchange="Components.restoreBackupFile(this)">
          <button class="btn btn-primary" onclick="Components.createBackup()">
            <i class="fas fa-plus"></i> نسخة احتياطية جديدة
          </button>
        </div>
      </div>

      <div class="alert alert-info" data-aos="fade-up">
        <i class="fas fa-info-circle"></i>
        النسخة الاحتياطية تشمل كل بيانات النظام المخزّنة محليًا في هذا المتصفح
        (العملاء، الموردين، المنتجات، الفواتير، المصروفات، الإيرادات، الموظفين، المهام...)
        وتُحفظ كملف JSON على جهازك، بالإضافة لسجلها هنا حتى تقدر تعيد تنزيلها لاحقًا.
      </div>

      <div class="card" data-aos="fade-up">
        <div class="card-header">
          <h5>سجل النسخ الاحتياطي</h5>
        </div>
        <div class="card-body">
          <div class="data-grid" id="backup-table-container">
            ${this.renderBackupTable()}
          </div>
        </div>
      </div>
    `;
  },

  renderBackupTable() {
    const backups = DataStore.list('backups').slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const hasRows = backups.length > 0;

    const rowsHtml = hasRows
      ? backups.map(b => `
          <tr>
            <td data-label="التاريخ"><div class="td-content">${Utils.formatDate(b.createdAt, 'DD/MM/YYYY HH:mm')}</div></td>
            <td data-label="الحجم"><div class="td-content">${b.sizeKB} كيلوبايت</div></td>
            <td data-label="النوع"><div class="td-content">${Utils.sanitizeHtml(b.type)}</div></td>
            <td data-label="الحالة"><div class="td-content"><span class="badge bg-success">${Utils.sanitizeHtml(b.status)}</span></div></td>
            <td data-label="الإجراءات"><div class="td-content">
              <div class="table-actions">
                <button class="btn btn-sm btn-outline-primary" title="تنزيل" onclick="Components.downloadBackupRecord('${b.id}')"><i class="fas fa-download"></i></button>
                <button class="btn btn-sm btn-outline-danger" title="حذف" onclick="Components.deleteBackupRecord('${b.id}')"><i class="fas fa-trash"></i></button>
              </div>
            </div></td>
          </tr>
        `).join('')
      : `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-cloud-upload-alt"></i><p>لا توجد نسخ احتياطية بعد</p></div></td></tr>`;

    return `
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>التاريخ</th><th>الحجم</th><th>النوع</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  },

  refreshBackupTable() {
    const container = document.getElementById('backup-table-container');
    if (container) container.innerHTML = this.renderBackupTable();
  },

  /**
   * يجمع كل بيانات النظام المخزّنة محليًا (باستثناء النسخ الاحتياطية نفسها
   * وسجل النشاط، تفاديًا لتضخيم النسخة بلا داعٍ)
   */
  _gatherBackupData() {
    const excluded = ['backups', 'activityLogs'];
    const data = {};
    Object.values(DataStore.ENTITIES).forEach(entity => {
      if (excluded.includes(entity)) return;
      data[entity] = DataStore.list(entity);
    });
    return {
      meta: { exportedAt: new Date().toISOString(), app: 'Ahmed Batity ERP' },
      data
    };
  },

  createBackup() {
    try {
      const payload = this._gatherBackupData();
      const json = JSON.stringify(payload);
      const sizeKB = (new Blob([json]).size / 1024).toFixed(1);

      const record = DataStore.create('backups', {
        type: 'يدوي',
        status: 'مكتمل',
        sizeKB,
        payload: json
      });

      this._downloadJson(json, `ahmed-batity-erp-backup-${this._todayISO()}.json`);
      UI.showToast('تم إنشاء نسخة احتياطية جديدة بنجاح', 'success');
      this.refreshBackupTable();
    } catch (error) {
      UI.showToast(error.message || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية', 'error');
    }
  },

  downloadBackupRecord(id) {
    const record = DataStore.get('backups', id);
    if (!record || !record.payload) {
      UI.showToast('تعذّر العثور على محتوى هذه النسخة', 'error');
      return;
    }
    this._downloadJson(record.payload, `ahmed-batity-erp-backup-${record.id}.json`);
  },

  async deleteBackupRecord(id) {
    const confirmed = await UI.confirm('تأكيد الحذف', 'هل أنت متأكد من حذف هذه النسخة الاحتياطية من السجل؟');
    if (!confirmed) return;

    DataStore.delete('backups', id);
    this.refreshBackupTable();
    UI.showToast('تم حذف النسخة الاحتياطية', 'success');
  },

  _downloadJson(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /**
   * استعادة نسخة احتياطية من ملف JSON تم اختياره من الجهاز.
   * عملية استبدال كاملة للبيانات المحلية الحالية، لذلك تتطلب تأكيدًا صريحًا.
   */
  async restoreBackupFile(inputEl) {
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      if (!payload || !payload.data || typeof payload.data !== 'object') {
        UI.showToast('ملف النسخة الاحتياطية غير صالح', 'error');
        inputEl.value = '';
        return;
      }

      const confirmed = await UI.confirm(
        'تأكيد الاستعادة',
        'ستحل هذه النسخة محل كل البيانات الحالية في هذا المتصفح ولا يمكن التراجع عن ذلك. هل تريد المتابعة؟'
      );
      if (!confirmed) { inputEl.value = ''; return; }

      Object.entries(payload.data).forEach(([entity, items]) => {
        Utils.storage.set(CONFIG.STORAGE.ENTITY_DATA_PREFIX + entity, items);
      });

      UI.showToast('تم استعادة النسخة الاحتياطية بنجاح، جاري إعادة التحميل...', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      UI.showToast('تعذّر قراءة ملف النسخة الاحتياطية', 'error');
    } finally {
      inputEl.value = '';
    }
  },

  // ====================
  // Logs
  // ====================
  renderLogs() {
    const canClear = typeof Auth !== 'undefined' && Auth.hasPermission('logs', CONFIG.PERMISSIONS.DELETE);

    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas fa-history me-2"></i>سجل النشاط</h2>
        <div class="page-actions">
          ${canClear ? `
            <button class="btn btn-outline-danger" onclick="Components.clearLogs()">
              <i class="fas fa-trash"></i> مسح السجل
            </button>
          ` : ''}
        </div>
      </div>

      <div class="card" data-aos="fade-up">
        <div class="card-header">
          <h5>السجلات الأخيرة</h5>
          <div class="d-flex gap-2">
            <input type="date" class="form-control form-control-sm" id="logs-date-filter" style="width:150px" onchange="Components.refreshLogsTable()">
            <select class="form-select form-select-sm" id="logs-type-filter" style="width:150px" onchange="Components.refreshLogsTable()">
              <option value="">كل الأنواع</option>
              <option value="create">إنشاء</option>
              <option value="update">تعديل</option>
              <option value="delete">حذف</option>
              <option value="login">تسجيل دخول</option>
              <option value="logout">تسجيل خروج</option>
            </select>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="Components.resetLogsFilter()" title="إعادة تعيين">
              <i class="fas fa-rotate-left"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="data-grid" id="logs-table-container">
            ${this.renderLogsTable()}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * يبني جدول سجل النشاط بناءً على الفلاتر الحالية (يُستخدم للعرض الأول وإعادة التحديث)
   */
  renderLogsTable() {
    const dateInput = document.getElementById('logs-date-filter');
    const typeInput = document.getElementById('logs-type-filter');

    const filters = {};
    if (dateInput && dateInput.value) filters.date = dateInput.value;
    if (typeInput && typeInput.value) filters.action = typeInput.value;

    const logs = (typeof Logger !== 'undefined') ? Logger.list(filters) : [];
    const hasRows = logs.length > 0;

    const rowsHtml = hasRows
      ? logs.map(log => {
          const actionLabel = (Logger.ACTION_LABELS && Logger.ACTION_LABELS[log.action]) || log.action;
          const actionBadgeClass = {
            create: 'bg-success', update: 'bg-warning', delete: 'bg-danger',
            login: 'bg-info', logout: 'bg-secondary'
          }[log.action] || 'bg-secondary';
          const moduleLabel = (CONFIG.MODULE_LABELS && CONFIG.MODULE_LABELS[log.module]) || log.module;
          const roleLabel = Utils.getRoleLabel(log.userRole);

          return `<tr>
            <td data-label="الوقت"><div class="td-content">${Utils.sanitizeHtml(Utils.formatDate(log.timestamp, 'DD/MM/YYYY HH:mm'))}</div></td>
            <td data-label="المستخدم"><div class="td-content">${Utils.sanitizeHtml(log.userName)}<br><small class="text-muted">${Utils.sanitizeHtml(roleLabel)}</small></div></td>
            <td data-label="العملية"><div class="td-content"><span class="badge ${actionBadgeClass}">${Utils.sanitizeHtml(actionLabel)}</span></div></td>
            <td data-label="القسم"><div class="td-content">${Utils.sanitizeHtml(moduleLabel)}</div></td>
            <td data-label="التفاصيل"><div class="td-content">${Utils.sanitizeHtml(log.details || '-')}</div></td>
            <td data-label="الجهاز"><div class="td-content">${Utils.sanitizeHtml(log.device || '-')}</div></td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-history"></i><p>لا توجد سجلات بعد</p></div></td></tr>`;

    return `
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>القسم</th><th>التفاصيل</th><th>الجهاز</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  },

  /**
   * إعادة رسم جدول السجل فقط (بدون إعادة تحميل الصفحة) عند تغيير الفلاتر
   */
  refreshLogsTable() {
    const container = document.getElementById('logs-table-container');
    if (container) container.innerHTML = this.renderLogsTable();
  },

  /**
   * إعادة تعيين الفلاتر وعرض كل السجلات
   */
  resetLogsFilter() {
    const dateInput = document.getElementById('logs-date-filter');
    const typeInput = document.getElementById('logs-type-filter');
    if (dateInput) dateInput.value = '';
    if (typeInput) typeInput.value = '';
    this.refreshLogsTable();
  },

  /**
   * مسح كل سجلات النشاط (لمدير النظام/المدير فقط)
   */
  async clearLogs() {
    const confirmed = await UI.confirm('تأكيد الحذف', 'هل أنت متأكد من حذف جميع سجلات النشاط؟ لا يمكن التراجع عن هذا الإجراء.');
    if (!confirmed) return;

    if (typeof Logger !== 'undefined') Logger.clear();
    this.refreshLogsTable();
    UI.showToast('تم حذف السجلات', 'success');
  },

  // ====================
  // Helper: Data Grid Page
  // ====================
  renderDataGridPage({ title, icon, addButton, columns, rows, entityKey, hideAddButton }) {
    const columnsHtml = columns.map(c => `<th>${c}</th>`).join('');

    // نحتفظ بمرجع لآخر جدول تم رسمه (بيانات كاملة غير مفلترة) ليستخدمه
    // زرّا التصدير والفلاتر. بما إن التطبيق صفحة واحدة (SPA) وجدول واحد
    // ظاهر في كل مرة، هذا آمن وبسيط.
    this._currentGrid = { title, icon, columns, rows: rows || [] };

    // بناء خيارات فلتر الحالة ديناميكيًا من القيم الفعلية الموجودة في عمود
    // "الحالة" (لو موجود) بدل قائمة ثابتة قد لا تناسب كل الصفحات
    const statusColIndex = columns.findIndex(c => c === 'الحالة');
    let statusOptionsHtml = '<option value="">كل الحالات</option>';
    if (statusColIndex >= 0 && rows) {
      const distinctStatuses = [...new Set(rows.map(r => ExportUtil._cellToText(r[statusColIndex])).filter(Boolean))];
      statusOptionsHtml += distinctStatuses.map(s => `<option value="${Utils.sanitizeHtml(s)}">${Utils.sanitizeHtml(s)}</option>`).join('');
    }

    // وجود عمود تاريخ (أي عمود عنوانه يحتوي كلمة "تاريخ") يفعّل فلتر التاريخ
    const dateColIndex = columns.findIndex(c => c.includes('تاريخ'));

    return `
      <div class="page-header" data-aos="fade-down">
        <h2><i class="fas ${icon} me-2"></i>${title}</h2>
        <div class="page-actions">
          ${hideAddButton ? '' : `
            <button class="btn btn-primary" onclick="Forms.openCreate('${entityKey}')">
              <i class="fas fa-plus"></i> ${addButton}
            </button>
          `}
          <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="fas fa-download"></i> تصدير
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" onclick="event.preventDefault(); Components.exportCurrentGrid('excel')"><i class="fas fa-file-excel text-success me-2"></i> تصدير Excel</a></li>
              <li><a class="dropdown-item" href="#" onclick="event.preventDefault(); Components.exportCurrentGrid('pdf')"><i class="fas fa-file-pdf text-danger me-2"></i> تصدير PDF</a></li>
            </ul>
          </div>
        </div>
      </div>

      ${(statusColIndex >= 0 || dateColIndex >= 0) ? `
        <div class="filters-bar" data-aos="fade-up">
          ${statusColIndex >= 0 ? `
            <select class="form-select" id="grid-status-filter" style="width:150px" onchange="Components.refreshGridFilter()">
              ${statusOptionsHtml}
            </select>
          ` : ''}
          ${dateColIndex >= 0 ? `
            <input type="date" class="form-control" id="grid-date-filter" style="width:150px" onchange="Components.refreshGridFilter()">
          ` : ''}
          <button class="btn btn-outline-secondary" onclick="Components.resetGridFilter()"><i class="fas fa-rotate-left"></i> إعادة تعيين</button>
        </div>
      ` : ''}

      <div class="data-grid" data-aos="fade-up" id="grid-table-container">
        ${this.renderGridTable(rows)}
      </div>
    `;
  },

  /**
   * يبني جدول الشبكة فقط من صفوف مُعطاة (تُستخدم عند العرض الأول وعند إعادة التصفية)
   */
  renderGridTable(rows) {
    const { columns, icon } = this._currentGrid;
    const hasRows = rows && rows.length > 0;
    const rowsHtml = hasRows
      ? rows.map(row => `<tr>${row.map((cell, i) => `<td data-label="${columns[i] || ''}"><div class="td-content">${cell}</div></td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${columns.length}"><div class="empty-state"><i class="fas ${icon}"></i><p>لا توجد بيانات بعد</p></div></td></tr>`;

    return `
      <div class="table-wrapper">
        <table class="table">
          <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  },

  /**
   * يطبّق فلاتر الحالة/التاريخ الحاليتين على البيانات الكاملة المخزّنة
   * في _currentGrid ويعيد رسم الجدول فقط (بدون تعديل rows الأصلية)
   */
  refreshGridFilter() {
    if (!this._currentGrid) return;

    const { columns, rows } = this._currentGrid;
    const statusColIndex = columns.findIndex(c => c === 'الحالة');
    const dateColIndex = columns.findIndex(c => c.includes('تاريخ'));

    const statusFilter = document.getElementById('grid-status-filter');
    const dateFilter = document.getElementById('grid-date-filter');
    const statusValue = statusFilter ? statusFilter.value : '';
    const dateValue = dateFilter ? dateFilter.value : '';

    let filtered = rows;

    if (statusValue && statusColIndex >= 0) {
      filtered = filtered.filter(r => ExportUtil._cellToText(r[statusColIndex]) === statusValue);
    }

    if (dateValue && dateColIndex >= 0) {
      filtered = filtered.filter(r => {
        const cellText = ExportUtil._cellToText(r[dateColIndex]);
        const cellDate = new Date(cellText);
        if (isNaN(cellDate.getTime())) return false;
        return cellDate.toISOString().slice(0, 10) === dateValue;
      });
    }

    const container = document.getElementById('grid-table-container');
    if (container) container.innerHTML = this.renderGridTable(filtered);
  },

  resetGridFilter() {
    const statusFilter = document.getElementById('grid-status-filter');
    const dateFilter = document.getElementById('grid-date-filter');
    if (statusFilter) statusFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    this.refreshGridFilter();
  },

  /**
   * ينفّذ تصدير الجدول المعروض حاليًا بالصيغة المطلوبة (excel/pdf)
   */
  exportCurrentGrid(format) {
    if (!this._currentGrid) {
      UI.showToast('لا يوجد جدول لتصديره حاليًا', 'warning');
      return;
    }

    const { title, columns, rows } = this._currentGrid;

    if (format === 'excel') {
      ExportUtil.toExcel({ title, columns, rows, filename: title });
    } else if (format === 'pdf') {
      ExportUtil.toPDF({ title, columns, rows });
    }
  },

  /**
   * تصدير بيانات رسم "مبيعات الشهر" في لوحة التحكم
   */
  exportSalesChart(format) {
    if (!this._salesChartData) {
      UI.showToast('لا توجد بيانات لتصديرها حاليًا', 'warning');
      return;
    }

    const columns = ['اليوم', 'المبيعات'];
    const rows = this._salesChartData.labels.map((label, i) => [
      label,
      Utils.formatCurrency(this._salesChartData.values[i] || 0)
    ]);

    if (format === 'excel') {
      ExportUtil.toExcel({ title: 'مبيعات الشهر', columns, rows, filename: 'مبيعات-الشهر' });
    } else if (format === 'pdf') {
      ExportUtil.toPDF({ title: 'مبيعات الشهر', columns, rows });
    }
  },

  // ====================
  // Helper: Table Actions
  // ====================
  renderTableActions(entityKey, id) {
    const printableEntities = ['sales', 'purchases', 'salesReturns', 'purchaseReturns'];
    const printBtn = printableEntities.includes(entityKey)
      ? `<button class="btn btn-sm btn-outline-secondary" title="طباعة" onclick="Print.invoice('${entityKey}', '${id}')"><i class="fas fa-print"></i></button>`
      : '';

    return `
      <div class="table-actions">
        ${printBtn}
        <button class="btn btn-sm btn-outline-warning" title="تعديل" onclick="Forms.openEdit('${entityKey}', '${id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-outline-danger" title="حذف" onclick="Forms.remove('${entityKey}', '${id}')"><i class="fas fa-trash"></i></button>
      </div>
    `;
  },

  // ====================
  // Error & Not Found
  // ====================
  renderError(message) {
    return `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h5>حدث خطأ</h5>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          <i class="fas fa-redo"></i> إعادة المحاولة
        </button>
      </div>
    `;
  },

  renderNotFound() {
    return `
      <div class="empty-state">
        <i class="fas fa-404"></i>
        <h5>الصفحة غير موجودة</h5>
        <p>الصفحة التي تبحث عنها غير موجودة</p>
        <a href="#dashboard" class="btn btn-primary">
          <i class="fas fa-home"></i> العودة للرئيسية
        </a>
      </div>
    `;
  },

  renderAccessDenied() {
    return `
      <div class="empty-state">
        <i class="fas fa-lock"></i>
        <h5>وصول مرفوض</h5>
        <p>ليس لديك الصلاحية للوصول إلى هذه الصفحة</p>
        <a href="#dashboard" class="btn btn-primary">
          <i class="fas fa-home"></i> العودة للرئيسية
        </a>
      </div>
    `;
  }
};
