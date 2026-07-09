/* =========================================
   Ahmed Batity ERP - Invoice Print
   =========================================
   طباعة فاتورة واحدة بتنسيق A4 مخصص (شعار + بيانات الفاتورة) بدل طباعة
   الصفحة بالكامل بكل عناصر الواجهة (قائمة جانبية، أزرار، إلخ).
   يعتمد على نفس آلية الطباعة عبر iframe الموجودة في ExportUtil لتفادي
   تكرار الكود وتفادي مشاكل النوافذ المنبثقة.
   ========================================= */

const Print = {
  // تسميات عربية لكل نوع مستند (تُستخدم في عنوان الطباعة)
  DOCUMENT_LABELS: {
    sales: 'فاتورة مبيعات',
    purchases: 'فاتورة مشتريات',
    salesReturns: 'إشعار مردود مبيعات',
    purchaseReturns: 'إشعار مردود مشتريات'
  },

  /**
   * يطبع فاتورة واحدة (مبيعات أو مشتريات) بتنسيق A4 منسّق
   */
  invoice(entityKey, id) {
    const record = DataStore.get(entityKey, id);
    if (!record) {
      UI.showToast('تعذّر العثور على الفاتورة', 'error');
      return;
    }

    const docLabel = this.DOCUMENT_LABELS[entityKey] || 'فاتورة';
    const isPurchase = entityKey === 'purchases' || entityKey === 'purchaseReturns';
    const partyLabel = isPurchase ? 'المورد' : 'العميل';
    const partyName = record.customerName || record.supplierName || '-';

    const invoiceNumber = record.invoiceNumber || record.returnNumber || `#${record.id}`;
    const date = Utils.formatDate(record.date || record.createdAt, 'DD/MM/YYYY');
    const amount = Utils.formatCurrency(record.amount || 0);
    const statusLabel = this._statusLabel(record.status);
    const notes = record.notes ? Utils.sanitizeHtml(record.notes) : '';

    const generatedAt = Utils.formatDate(new Date(), 'DD/MM/YYYY HH:mm');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${Utils.sanitizeHtml(docLabel)} ${Utils.sanitizeHtml(invoiceNumber)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            color: #1a1a1a;
            padding: 30px;
          }
          .invoice-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #1F5F5B;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .invoice-header .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .invoice-header img { width: 56px; height: 56px; object-fit: contain; }
          .invoice-header h1 { font-size: 20px; margin: 0; color: #1F5F5B; }
          .invoice-header p { margin: 2px 0 0; font-size: 12px; color: #666; }
          .doc-title { text-align: left; }
          .doc-title h2 { margin: 0; font-size: 22px; color: #333; }
          .doc-title span { font-size: 13px; color: #888; }

          .invoice-meta {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 28px;
          }
          .meta-box {
            flex: 1;
            background: #f7f9f8;
            border: 1px solid #e5e9e8;
            border-radius: 8px;
            padding: 14px 16px;
          }
          .meta-box h4 {
            margin: 0 0 8px;
            font-size: 12px;
            color: #1F5F5B;
            text-transform: uppercase;
            letter-spacing: .5px;
          }
          .meta-box p { margin: 4px 0; font-size: 14px; }
          .meta-box p strong { color: #333; }

          .amount-box { margin-top: 10px; display: flex; justify-content: flex-end; }
          .amount-box table { border-collapse: collapse; min-width: 280px; }
          .amount-box td { padding: 10px 16px; font-size: 15px; border-top: 1px solid #eee; }
          .amount-box tr:last-child td {
            font-size: 18px; font-weight: 700; color: #1F5F5B; border-top: 2px solid #1F5F5B;
          }

          .status-badge {
            display: inline-block; padding: 4px 12px; border-radius: 20px;
            font-size: 12px; font-weight: 600; background: #e8f5e9; color: #2e7d32;
          }

          .notes-box {
            margin-top: 24px; font-size: 13px; color: #555; background: #fafafa;
            border-right: 3px solid #1F5F5B; padding: 10px 14px;
          }

          .invoice-footer {
            margin-top: 40px; font-size: 11px; color: #999; text-align: center;
            border-top: 1px solid #eee; padding-top: 10px;
          }

          @media print {
            body { padding: 0; }
            @page { size: A4; margin: 16mm; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="brand">
            <img src="${location.origin}/assets/images/icon-192.png" alt="">
            <div>
              <h1>Ahmed Batity ERP</h1>
              <p>نظام إدارة الموارد</p>
            </div>
          </div>
          <div class="doc-title">
            <h2>${Utils.sanitizeHtml(docLabel)}</h2>
            <span>رقم: ${Utils.sanitizeHtml(invoiceNumber)}</span>
          </div>
        </div>

        <div class="invoice-meta">
          <div class="meta-box">
            <h4>بيانات ${Utils.sanitizeHtml(partyLabel)}</h4>
            <p><strong>${Utils.sanitizeHtml(partyName)}</strong></p>
          </div>
          <div class="meta-box">
            <h4>تفاصيل المستند</h4>
            <p>التاريخ: <strong>${date}</strong></p>
            <p>الحالة: <span class="status-badge">${statusLabel}</span></p>
          </div>
        </div>

        <div class="amount-box">
          <table><tr><td>الإجمالي المستحق</td><td>${amount}</td></tr></table>
        </div>

        ${notes ? `<div class="notes-box">${notes}</div>` : ''}

        <div class="invoice-footer">
          تم إنشاء هذا المستند إلكترونيًا بواسطة نظام Ahmed Batity ERP بتاريخ ${generatedAt}
        </div>
      </body>
      </html>
    `;

    ExportUtil._printHtml(html);
  },

  _statusLabel(status) {
    const meta = (typeof CONFIG !== 'undefined' && CONFIG.STATUS_META) ? CONFIG.STATUS_META[status] : null;
    return meta ? meta.label : (status || '-');
  }
};

window.Print = Print;
