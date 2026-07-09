/* =========================================
   Ahmed Batity ERP - Export Utilities
   =========================================
   تصدير حقيقي للبيانات المعروضة في أي جدول:
   - Excel: ملف .xlsx حقيقي عبر مكتبة SheetJS.
   - PDF: عبر نافذة طباعة مخصصة (Print Preview) بتصميم عربي منسّق،
     والمستخدم يختار "حفظ كـ PDF" من نافذة الطباعة نفسها.
     هذا الأسلوب مقصود وليس نقصًا: أي مكتبة PDF تُنشئ الملف مباشرة
     في المتصفح (مثل jsPDF) لا تدعم العربية والـ RTL بشكل سليم بدون
     تحميل خط عربي كامل يدويًا، بينما طباعة المتصفح تدعمها فورًا
     وبجودة أعلى لأنها تستخدم نفس محرك عرض الصفحة.
   ========================================= */

const ExportUtil = {
  /**
   * يحوّل أي محتوى خلية (قد يحتوي HTML مثل badge أو أزرار) إلى نص عادي فقط
   */
  _cellToText(html) {
    if (html === null || html === undefined) return '';
    const div = document.createElement('div');
    div.innerHTML = String(html);
    return div.textContent.trim();
  },

  /**
   * يستخرج بيانات نصية بحتة من columns/rows، مع استبعاد عمود "الإجراءات"
   * (أزرار تعديل/حذف لا معنى لتصديرها)
   */
  _extractData(columns, rows) {
    const actionsIndex = columns.findIndex(c => c === 'الإجراءات');
    const keepIndexes = columns.map((_, i) => i).filter(i => i !== actionsIndex);

    const headers = keepIndexes.map(i => columns[i]);
    const data = rows.map(row => keepIndexes.map(i => this._cellToText(row[i])));

    return { headers, data };
  },

  /**
   * تصدير الجدول الحالي كملف Excel (.xlsx) حقيقي
   */
  toExcel({ title, columns, rows, filename }) {
    if (typeof XLSX === 'undefined') {
      UI.showToast('تعذّر تحميل مكتبة تصدير Excel، تحقق من اتصال الإنترنت', 'error');
      return;
    }

    const { headers, data } = this._extractData(columns, rows);

    if (data.length === 0) {
      UI.showToast('لا توجد بيانات لتصديرها', 'warning');
      return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // عرض أعمدة تلقائي بسيط بناءً على أطول محتوى بكل عمود
    worksheet['!cols'] = headers.map((h, i) => {
      const maxLen = Math.max(h.length, ...data.map(r => (r[i] || '').length));
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, (title || 'بيانات').slice(0, 31));

    const safeName = (filename || title || 'export').replace(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(workbook, `${safeName}.xlsx`);

    UI.showToast('تم تصدير الملف بصيغة Excel بنجاح', 'success');
  },

  /**
   * تصدير الجدول الحالي كـ PDF عبر نافذة طباعة منسّقة (المستخدم يختار
   * "حفظ كـ PDF" كوجهة طباعة من نافذة الطباعة نفسها)
   */
  toPDF({ title, columns, rows }) {
    const { headers, data } = this._extractData(columns, rows);

    if (data.length === 0) {
      UI.showToast('لا توجد بيانات لتصديرها', 'warning');
      return;
    }

    const rowsHtml = data.map(row =>
      `<tr>${row.map(cell => `<td>${Utils.sanitizeHtml(cell)}</td>`).join('')}</tr>`
    ).join('');

    const headHtml = headers.map(h => `<th>${Utils.sanitizeHtml(h)}</th>`).join('');

    const generatedAt = Utils.formatDate(new Date(), 'DD/MM/YYYY HH:mm');
    const userName = (typeof Auth !== 'undefined' && Auth.user) ? Auth.user.name : '';

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${Utils.sanitizeHtml(title || 'تقرير')}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            padding: 24px;
            color: #1a1a1a;
          }
          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #1F5F5B;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .print-header .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .print-header img { width: 42px; height: 42px; object-fit: contain; }
          .print-header h1 { font-size: 18px; margin: 0; color: #1F5F5B; }
          .print-meta { font-size: 12px; color: #666; text-align: left; }
          h2.report-title { font-size: 16px; margin: 0 0 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
          th { background: #f0f4f3; font-weight: 700; }
          tbody tr:nth-child(even) { background: #fafafa; }
          .print-footer {
            margin-top: 24px;
            font-size: 11px;
            color: #999;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
            @page { size: A4; margin: 14mm; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="brand">
            <img src="${location.origin}/assets/images/icon-192.png" alt="">
            <h1>Ahmed Batity ERP</h1>
          </div>
          <div class="print-meta">
            تاريخ الإنشاء: ${generatedAt}<br>
            ${userName ? `بواسطة: ${Utils.sanitizeHtml(userName)}` : ''}
          </div>
        </div>
        <h2 class="report-title">${Utils.sanitizeHtml(title || 'تقرير')}</h2>
        <table>
          <thead><tr>${headHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="print-footer">تم إنشاؤه بواسطة نظام Ahmed Batity ERP</div>
      </body>
      </html>
    `;

    this._printHtml(html);
  },

  /**
   * ينشئ iframe مخفي، يكتب فيه HTML جاهز للطباعة، ثم يفتح نافذة الطباعة.
   * استخدام iframe بدل window.open() يتفادى مشاكل حاجب النوافذ المنبثقة
   * ولا يبعد المستخدم عن التطبيق (SPA) أثناء الطباعة.
   */
  _printHtml(html) {
    const existing = document.getElementById('print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '-10000px';
    iframe.style.bottom = '-10000px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => setTimeout(() => iframe.remove(), 500);

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Print error:', e);
        UI.showToast('تعذّر فتح نافذة الطباعة', 'error');
      }
    };

    // بعض المتصفحات تطلق afterprint على النافذة الفرعية، وأخرى لا تطلقها إطلاقًا
    iframe.contentWindow.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 8000); // شبكة أمان لإزالة الـ iframe حتى لو لم يُطلق afterprint
  }
};

window.ExportUtil = ExportUtil;
