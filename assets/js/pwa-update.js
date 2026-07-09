/* =========================================
   Ahmed Batity ERP - PWA Update & Pull-to-Refresh
   =========================================
   يتولى هذا الملف مهمتين:
   1) اكتشاف وجود نسخة جديدة من التطبيق (Service Worker) وإظهار
      شريط إشعار للمستخدم بدل التحديث الصامت.
   2) خاصية "اسحب للتحديث" (Pull-to-Refresh) من أعلى الشاشة على الهاتف،
      تتحقق من وجود تحديث وتقوم بتحديث الصفحة.
   ========================================= */

const PWAUpdate = {
  registration: null,
  refreshing: false,
  checkIntervalMs: 5 * 60 * 1000, // فحص تلقائي كل 5 دقائق

  /**
   * يبدأ مراقبة الـ Service Worker المُسجَّل
   */
  watch(registration) {
    this.registration = registration;

    // لو في نسخة جديدة متوقفة بالفعل وبتنتظر التفعيل
    if (registration.waiting) {
      this._showUpdateBanner();
    }

    // لو نسخة جديدة بدأت التثبيت أثناء الجلسة الحالية
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this._showUpdateBanner();
        }
      });
    });

    // إعادة تحميل الصفحة مرة واحدة فقط بعد تفعيل النسخة الجديدة
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return;
      this.refreshing = true;
      window.location.reload();
    });

    // فحص دوري تلقائي عن وجود تحديثات
    setInterval(() => this._checkForUpdate(), this.checkIntervalMs);

    // فحص فوري كذلك عند رجوع التطبيق للـ foreground
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this._checkForUpdate();
    });

    this._initPullToRefresh();
  },

  _checkForUpdate() {
    if (!this.registration) return;
    this.registration.update().catch(() => {});
  },

  /**
   * إظهار شريط "يوجد تحديث جديد"
   */
  _showUpdateBanner() {
    if (document.getElementById('update-banner')) return; // معروض بالفعل

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'update-banner';
    banner.innerHTML = `
      <div class="update-banner-content">
        <i class="fas fa-rotate"></i>
        <span>يتوفر تحديث جديد للتطبيق</span>
      </div>
      <div class="update-banner-actions">
        <button type="button" class="btn btn-sm btn-light" id="update-banner-btn">
          <i class="fas fa-download"></i> تحديث الآن
        </button>
        <button type="button" class="update-banner-dismiss" id="update-banner-dismiss" aria-label="إغلاق">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.prepend(banner);
    requestAnimationFrame(() => banner.classList.add('show'));

    document.getElementById('update-banner-btn').addEventListener('click', () => {
      this._applyUpdate();
    });
    document.getElementById('update-banner-dismiss').addEventListener('click', () => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 250);
    });
  },

  /**
   * تفعيل النسخة الجديدة المنتظرة (Skip Waiting) ثم إعادة التحميل
   */
  _applyUpdate() {
    if (!this.registration || !this.registration.waiting) {
      window.location.reload();
      return;
    }
    this.registration.waiting.postMessage('skipWaiting');
  },

  /**
   * ميزة "اسحب للتحديث" من أعلى الشاشة (للأجهزة اللمسية)
   */
  _initPullToRefresh() {
    const THRESHOLD = 70; // المسافة المطلوبة بالبكسل لتفعيل التحديث
    let startY = 0;
    let pulling = false;
    let currentPull = 0;

    const indicator = document.createElement('div');
    indicator.id = 'pull-refresh-indicator';
    indicator.className = 'pull-refresh-indicator';
    indicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
    document.body.prepend(indicator);

    const resetIndicator = () => {
      indicator.style.transform = '';
      indicator.classList.remove('visible', 'ready', 'loading');
      pulling = false;
      currentPull = 0;
    };

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY > 0) return;
      startY = e.touches[0].clientY;
      pulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) {
        resetIndicator();
        return;
      }
      currentPull = Math.min(delta, THRESHOLD * 1.6);
      indicator.classList.add('visible');
      indicator.classList.toggle('ready', currentPull >= THRESHOLD);
      indicator.style.transform = `translateY(${currentPull}px) rotate(${Math.min(currentPull * 3, 200)}deg)`;
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (!pulling) return;
      if (currentPull >= THRESHOLD) {
        indicator.classList.add('loading');
        indicator.classList.remove('ready');
        indicator.style.transform = `translateY(${THRESHOLD}px)`;
        this._pullToRefreshTriggered();
      } else {
        resetIndicator();
      }
      pulling = false;
    });
  },

  /**
   * ينفذ عند سحب المستخدم للشاشة للأسفل بما يكفي:
   * يتحقق من وجود تحديث، ولو موجود يفعّله، وإلا يعيد تحميل الصفحة عادي.
   */
  _pullToRefreshTriggered() {
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast('جاري التحقق من وجود تحديثات...', 'info', 2000);
    }

    if (!this.registration) {
      setTimeout(() => window.location.reload(), 400);
      return;
    }

    this.registration.update().finally(() => {
      setTimeout(() => {
        if (this.registration.waiting) {
          this._applyUpdate();
        } else {
          window.location.reload();
        }
      }, 600);
    });
  }
};

window.PWAUpdate = PWAUpdate;
