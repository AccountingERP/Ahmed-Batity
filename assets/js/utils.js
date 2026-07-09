/* =========================================
   Ahmed Batity ERP - Utilities
   ========================================= */

const Utils = {
  /**
   * Format currency
   */
  formatCurrency(amount, currency = CONFIG.CURRENCY.SYMBOL) {
    if (amount === null || amount === undefined) return '-';
    const num = parseFloat(amount);
    if (isNaN(num)) return '-';
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  },

  /**
   * إنشاء شارة حالة (badge) موحّدة من قيمة status خام،
   * بالاعتماد على CONFIG.STATUS_META كمصدر حقيقة واحد.
   * يمنع تكرار تعريف statusBadges في كل صفحة على حدة.
   */
  renderStatusBadge(status) {
    const meta = CONFIG.STATUS_META[status];
    const label = meta ? meta.label : (status || '-');
    const badgeClass = meta ? meta.badgeClass : 'bg-secondary';
    return `<span class="badge ${badgeClass}">${this.sanitizeHtml(label)}</span>`;
  },

  /**
   * ترجمة اسم دور المستخدم التقني إلى تسمية عربية معروضة
   */
  getRoleLabel(role) {
    return CONFIG.ROLE_LABELS[role] || role || '-';
  },

  /**
   * Format number
   */
  formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '-';
    const n = parseFloat(num);
    if (isNaN(n)) return '-';
    return n.toLocaleString('ar-SA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },

  /**
   * Format date
   */
  formatDate(date, format = (CONFIG.DATE && CONFIG.DATE.DISPLAY_FORMAT) || 'DD/MM/YYYY') {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('HH', hours)
      .replace('mm', minutes);
  },

  /**
   * Format relative time
   */
  timeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now - then) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  },

  /**
   * Generate unique ID
   */
  generateId(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Generate invoice number
   */
  generateInvoiceNumber(prefix = 'INV') {
    const date = new Date();
    const year = date.getFullYear().toString().substr(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}${day}-${random}`;
  },

  /**
   * Deep clone object
   */
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Sanitize HTML
   */
  sanitizeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Validate phone
   */
  isValidPhone(phone) {
    return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone);
  },

  /**
   * Calculate percentage
   */
  calculatePercentage(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  },

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  },

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Copy to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  },

  /**
   * Download file
   */
  downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Parse CSV
   */
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });
  },

  /**
   * Export to CSV
   */
  exportToCSV(data, filename) {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Get initials from name
   */
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);
  },

  /**
   * Random color from string
   */
  stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  },

  /**
   * Local Storage helpers
   */
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    remove(key) {
      localStorage.removeItem(key);
    },
    clear() {
      localStorage.clear();
    }
  },

  /**
   * Session Storage helpers
   */
  session: {
    set(key, value) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    get(key, defaultValue = null) {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    remove(key) {
      sessionStorage.removeItem(key);
    }
  }
};
