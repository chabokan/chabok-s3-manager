// Translation System
const translations = {
  en: {
    // Connection Page
    appTitle: 'Chabokan S3 Manager',
    appSubtitle: 'Professional S3 Storage Management',
    endpointLabel: 'Endpoint URL',
    endpointPlaceholder: 's3.example.com or https://s3.example.com',
    endpointHelp: 'Enter your S3-compatible service endpoint',
    accessKeyLabel: 'Access Key',
    accessKeyPlaceholder: 'Access Key ID',
    secretKeyLabel: 'Secret Key',
    secretKeyPlaceholder: 'Secret Access Key',
    regionLabel: 'Region (Optional)',
    regionPlaceholder: 'us-east-1',
    connectButton: 'Connect to Storage',
    connecting: 'Connecting...',
    recentConnections: 'Recent Connections',
    lastUsed: 'Last used',
    
    // Bucket Page
    buckets: 'Buckets',
    createBucket: 'Create Bucket',
    loadingBuckets: 'Loading buckets...',
    noBucketsFound: 'No Buckets Found',
    noBucketsMessage: 'Create a new bucket to get started',
    disconnect: 'Disconnect',
    created: 'Created',
    open: 'Open',
    public: 'Public',
    private: 'Private',
    delete: 'Delete',
    
    // File Manager
    filesAndFolders: 'Files & Folders',
    uploadFile: 'Upload File',
    createFolder: 'Create Folder',
    backToBuckets: 'Back to Buckets',
    loading: 'Loading...',
    empty: 'Empty',
    items: 'items',
    folderEmpty: 'Folder is Empty',
    noFilesMessage: 'No files or folders here',
    folder: 'Folder',
    download: 'Download',
    share: 'Share',
    rename: 'Rename',
    deleteSelected: 'Delete Selected',
    
    // Modals
    shareLink: 'Share Link',
    shareLinkValid: 'This link is valid for',
    linkExpiry: 'Link Expiry',
    searchBuckets: 'Search buckets...',
    searchFiles: 'Search files and folders...',
    copy: 'Copy',
    linkCopied: 'Link copied',
    createNewBucket: 'Create New Bucket',
    bucketName: 'Bucket Name',
    bucketNamePlaceholder: 'my-new-bucket',
    bucketNameHelp: 'Only lowercase letters, numbers, and hyphens (-) allowed',
    publicAccess: 'Public Access',
    publicAccessHelp: 'Files will be accessible without authentication',
    cancel: 'Cancel',
    uploadFileTitle: 'Upload File',
    selectFile: 'Select File',
    selectFileHelp: 'Choose a file to upload',
    upload: 'Upload',
    
    // Actions & Messages
    downloading: 'Downloading...',
    fileDownloaded: 'File downloaded successfully',
    generating: 'Generating link...',
    deleting: 'Deleting',
    deleted: 'deleted successfully',
    settingAccess: 'Setting access...',
    bucketPublic: 'Bucket is now Public',
    bucketPrivate: 'Bucket is now Private',
    creating: 'Creating bucket...',
    bucketCreated: 'Bucket created successfully!',
    uploading: 'Uploading...',
    fileUploaded: 'File uploaded successfully!',
    disconnected: 'Disconnected',
    historyRemoved: 'Connection removed from history',
    
    // Confirmations
    confirmDeleteBucket: 'Are you sure you want to delete bucket',
    confirmDeleteBucketWarning: 'This will delete all files in it!',
    confirmDelete: 'Are you sure you want to delete this',
    confirmMakePublic: 'Do you want to make bucket',
    publicQuestion: 'public?',
    
    // Search
    searchBuckets: 'Search buckets...',
    searchFiles: 'Search files and folders...',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    
    // Errors
    errorConnection: 'Connection error',
    errorLoading: 'Error loading',
    errorUpload: 'Upload error',
    errorDownload: 'Download error',
    errorUnexpected: 'Unexpected error',
    error: 'Error'
  },
  
  fa: {
    // صفحه اتصال
    appTitle: 'مدیریت S3 چابکان',
    appSubtitle: 'مدیریت حرفه‌ای فضای ذخیره‌سازی S3',
    endpointLabel: 'آدرس Endpoint',
    endpointPlaceholder: 's3.example.com یا https://s3.example.com',
    endpointHelp: 'آدرس سرویس S3 سازگار خود را وارد کنید',
    accessKeyLabel: 'کلید دسترسی',
    accessKeyPlaceholder: 'شناسه کلید دسترسی',
    secretKeyLabel: 'کلید مخفی',
    secretKeyPlaceholder: 'کلید مخفی دسترسی',
    regionLabel: 'منطقه (اختیاری)',
    regionPlaceholder: 'us-east-1',
    connectButton: 'اتصال به Storage',
    connecting: 'در حال اتصال...',
    recentConnections: 'اتصالات اخیر',
    lastUsed: 'آخرین استفاده',
    
    // صفحه باکت‌ها
    buckets: 'لیست باکت‌ها',
    createBucket: 'ساخت باکت جدید',
    loadingBuckets: 'در حال بارگذاری باکت‌ها...',
    noBucketsFound: 'هیچ باکتی یافت نشد',
    noBucketsMessage: 'برای شروع، یک باکت جدید بسازید',
    disconnect: 'قطع اتصال',
    created: 'ساخته شده',
    open: 'باز کردن',
    public: 'عمومی',
    private: 'خصوصی',
    delete: 'حذف',
    
    // مدیریت فایل
    filesAndFolders: 'فایل‌ها و پوشه‌ها',
    uploadFile: 'آپلود فایل',
    backToBuckets: 'بازگشت به لیست باکت‌ها',
    loading: 'در حال بارگذاری...',
    empty: 'خالی',
    items: 'مورد',
    folderEmpty: 'پوشه خالی است',
    noFilesMessage: 'هیچ فایل یا پوشه‌ای در اینجا وجود ندارد',
    folder: 'پوشه',
    download: 'دانلود',
    share: 'اشتراک‌گذاری',
    rename: 'تغییر نام',
    
    // پنجره‌های محاوره
    shareLink: 'لینک اشتراک‌گذاری',
    shareLinkValid: 'این لینک تا',
    days: 'روز معتبر است',
    copy: 'کپی',
    linkCopied: 'لینک کپی شد',
    createNewBucket: 'ساخت باکت جدید',
    bucketName: 'نام باکت',
    bucketNamePlaceholder: 'my-new-bucket',
    bucketNameHelp: 'فقط حروف کوچک، اعداد و خط تیره (-) مجاز است',
    publicAccess: 'دسترسی عمومی',
    publicAccessHelp: 'فایل‌ها بدون احراز هویت قابل دسترسی خواهند بود',
    cancel: 'لغو',
    uploadFileTitle: 'آپلود فایل',
    selectFile: 'انتخاب فایل',
    selectFileHelp: 'فایل خود را برای آپلود انتخاب کنید',
    upload: 'آپلود',
    
    // اعمال و پیام‌ها
    downloading: 'در حال دانلود...',
    fileDownloaded: 'فایل با موفقیت دانلود شد',
    generating: 'در حال ایجاد لینک...',
    deleting: 'در حال حذف',
    deleted: 'با موفقیت حذف شد',
    settingAccess: 'در حال تنظیم دسترسی...',
    bucketPublic: 'باکت اکنون عمومی است',
    bucketPrivate: 'باکت اکنون خصوصی است',
    creating: 'در حال ساخت باکت...',
    bucketCreated: 'باکت با موفقیت ساخته شد!',
    uploading: 'در حال آپلود...',
    fileUploaded: 'فایل با موفقیت آپلود شد!',
    disconnected: 'اتصال قطع شد',
    historyRemoved: 'اتصال از تاریخچه حذف شد',
    
    // تاییدیه‌ها
    confirmDeleteBucket: 'آیا مطمئن هستید که می‌خواهید باکت',
    confirmDeleteBucketWarning: 'را حذف کنید؟ تمام فایل‌های داخل آن حذف خواهند شد!',
    confirmDelete: 'آیا مطمئن هستید که می‌خواهید این',
    confirmMakePublic: 'آیا می‌خواهید باکت',
    publicQuestion: 'را عمومی کنید؟',
    
    // جستجو
    searchBuckets: 'جستجوی باکت‌ها...',
    searchFiles: 'جستجوی فایل‌ها و پوشه‌ها...',
    
    // تنظیمات
    settings: 'تنظیمات',
    language: 'زبان',
    theme: 'تم',
    lightMode: 'حالت روشن',
    darkMode: 'حالت تیره',
    
    // خطاها
    errorConnection: 'خطا در اتصال',
    errorLoading: 'خطا در بارگذاری',
    errorUpload: 'خطا در آپلود',
    errorDownload: 'خطا در دانلود',
    errorUnexpected: 'خطای غیرمنتظره',
    error: 'خطا'
  }
};

// Current language
let currentLang = localStorage.getItem('app_language') || 'en';

// Translation function
function t(key) {
  return translations[currentLang][key] || key;
}

// Set language
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('app_language', lang);
  
  // Update HTML attributes
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  
  // Update all translatable elements
  updateTranslations();
}

// Update all translations in the DOM
function updateTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.hasAttribute('placeholder')) {
        el.placeholder = translation;
      } else {
        el.value = translation;
      }
    } else {
      el.textContent = translation;
    }
  });
  
  // Update placeholders separately
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
});

