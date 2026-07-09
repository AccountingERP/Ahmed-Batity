/* =========================================
   Ahmed Batity ERP - Main Application
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 600,
      once: true,
      offset: 50
    });
  }

  // Initialize Auth
  Auth.init();

  // تطبيق الإعدادات المحفوظة (العملة، تنسيق التاريخ) فور بدء التشغيل
  if (typeof Components !== 'undefined' && Components.applySettings) {
    Components.applySettings();
  }

  // Initialize UI
  UI.init();

  // Initialize Global Search
  if (typeof GlobalSearch !== 'undefined') GlobalSearch.init();

  // Initialize Router
  Router.init();

  // اكتشاف رابط إعادة تعيين كلمة المرور القادم من البريد الإلكتروني
  // (الصيغة: #reset-password?token=xxx) ويُعرض قبل أي شيء آخر، حتى لو
  // كان هناك مستخدم مسجّل دخوله بالفعل في هذا المتصفح
  const rawHash = window.location.hash.replace('#', '');
  if (rawHash.startsWith('reset-password')) {
    const tokenMatch = rawHash.match(/token=([^&]+)/);
    if (tokenMatch) {
      UI._currentResetToken = decodeURIComponent(tokenMatch[1]);
      Router.showResetPassword();
      UI.hideLoading();
      return;
    }
  }

  // Check authentication
  if (Auth.isAuthenticated()) {
    Router.hideLogin();
    UI.applySidebarPermissions();

    // Load initial page
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    Router.navigate(hash);

    // تحميل الإشعارات فورًا حتى يظهر العدد الصحيح على الجرس من أول لحظة
    if (typeof UI !== 'undefined' && UI.loadNotifications) {
      UI.loadNotifications();
    }

    // فحص النسخ الاحتياطي التلقائي (لو مفعّل ووقته حان) بعد تحميل الصفحة
    if (typeof Components !== 'undefined' && Components.checkAutoBackup) {
      setTimeout(() => Components.checkAutoBackup(), 2000);
    }
  } else {
    Router.showLogin();
  }

  // Hide initial loading
  setTimeout(() => {
    UI.hideLoading();
  }, 500);

  // Register keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape to close modals/sidebar
    if (e.key === 'Escape') {
      document.getElementById('sidebar')?.classList.remove('show');
      document.getElementById('notifications-panel')?.classList.remove('show');
    }
  });

  // Handle online/offline
  window.addEventListener('online', () => {
    UI.showToast('تم استعادة الاتصال بالإنترنت', 'success');
  });

  window.addEventListener('offline', () => {
    UI.showToast('أنت غير متصل بالإنترنت. بعض الميزات قد لا تعمل.', 'warning');
  });

  console.log('%c Ahmed batity - ERP ', 'background: #1F5F5B; color: white; font-size: 24px; padding: 10px; border-radius: 8px;');
  console.log('%c الإصدار 1.0.0 - نظام تخطيط موارد المؤسسات ', 'color: #1F5F5B; font-size: 14px;');
});
