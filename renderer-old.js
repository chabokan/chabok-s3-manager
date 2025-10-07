// Page Management
let currentPath = '';
let currentBucket = null;
let connectedConfig = null;

// DOM Elements
const connectionPage = document.getElementById('connection-page');
const bucketPage = document.getElementById('bucket-page');
const managerPage = document.getElementById('manager-page');
const connectionForm = document.getElementById('connection-form');
const connectionError = document.getElementById('connection-error');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const disconnectBtnBuckets = document.getElementById('disconnect-btn-buckets');
const bucketList = document.getElementById('bucket-list');
const bucketLoading = document.getElementById('bucket-loading');
const bucketEmptyState = document.getElementById('bucket-empty-state');
const createBucketBtn = document.getElementById('create-bucket-btn');
const storageEndpoint = document.getElementById('storage-endpoint');
const bucketNameEl = document.getElementById('bucket-name');
const breadcrumb = document.getElementById('breadcrumb');
const fileList = document.getElementById('file-list');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const itemsCount = document.getElementById('items-count');
const uploadFileBtn = document.getElementById('upload-file-btn');
const shareModal = document.getElementById('share-modal');
const shareLinkInput = document.getElementById('share-link-input');
const createBucketModal = document.getElementById('create-bucket-modal');
const createBucketForm = document.getElementById('create-bucket-form');
const uploadModal = document.getElementById('upload-modal');
const uploadForm = document.getElementById('upload-form');

// Connection Form Handler
connectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const config = {
        endpoint: document.getElementById('endpoint').value.trim(),
        accessKey: document.getElementById('accessKey').value.trim(),
        secretKey: document.getElementById('secretKey').value.trim(),
        region: document.getElementById('region').value.trim() || 'us-east-1'
    };
    
    // Disable button and show loading
    connectBtn.disabled = true;
    connectBtn.innerHTML = `
        <div class="spinner" style="width: 20px; height: 20px; border-width: 3px;"></div>
        در حال اتصال...
    `;
    connectionError.style.display = 'none';
    
    try {
        const result = await window.electronAPI.connectS3(config);
        
        if (result.success) {
            connectedConfig = config;
            storageEndpoint.textContent = config.endpoint;
            
            // Switch to bucket page
            connectionPage.classList.remove('active');
            bucketPage.classList.add('active');
            
            // Load buckets
            await loadBuckets();
        } else {
            connectionError.textContent = `خطا در اتصال: ${result.error}`;
            connectionError.style.display = 'block';
        }
    } catch (error) {
        connectionError.textContent = `خطای غیرمنتظره: ${error.message}`;
        connectionError.style.display = 'block';
    } finally {
        connectBtn.disabled = false;
        connectBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            اتصال به Storage
        `;
    }
});

// Load Buckets
async function loadBuckets() {
    bucketLoading.style.display = 'flex';
    bucketList.innerHTML = '';
    bucketEmptyState.style.display = 'none';
    
    try {
        const result = await window.electronAPI.listBuckets();
        
        if (result.success) {
            displayBuckets(result.buckets);
        } else {
            showToast(`خطا در بارگذاری: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`خطا: ${error.message}`, 'error');
    } finally {
        bucketLoading.style.display = 'none';
    }
}

// Display Buckets
function displayBuckets(buckets) {
    bucketList.innerHTML = '';
    
    if (buckets.length === 0) {
        bucketEmptyState.style.display = 'flex';
        return;
    }
    
    buckets.forEach(bucket => {
        const bucketItem = createBucketItem(bucket);
        bucketList.appendChild(bucketItem);
    });
}

function createBucketItem(bucket) {
    const div = document.createElement('div');
    div.className = 'bucket-item';
    
    const date = bucket.creationDate ? formatDate(new Date(bucket.creationDate)) : '';
    
    div.innerHTML = `
        <div class="bucket-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4M14 2l-2 5M10 7l-2 5M18 7l-2 5M6 7l-2 5" stroke="currentColor" stroke-width="2"/>
                <rect x="2" y="9" width="20" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            </svg>
        </div>
        <div class="bucket-info">
            <div class="bucket-name">${escapeHtml(bucket.name)}</div>
            <div class="bucket-meta">ساخته شده: ${date}</div>
        </div>
        <div class="bucket-actions">
            <button class="action-btn" onclick="openBucket('${escapeHtml(bucket.name)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
                </svg>
                باز کردن
            </button>
            <button class="action-btn" onclick="toggleBucketPublic('${escapeHtml(bucket.name)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M2 12h20" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 2a15.3 15.3 15.3 0 0 1 4 10 15.3 15.3 15.3 0 0 1-4 10 15.3 15.3 15.3 0 0 1-4-10 15.3 15.3 15.3 0 0 1 4-10z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Public/Private
            </button>
        </div>
    `;
    
    return div;
}

// Open Bucket
async function openBucket(bucketName) {
    currentBucket = bucketName;
    currentPath = '';
    bucketNameEl.textContent = `Bucket: ${bucketName}`;
    
    // Switch to manager page
    bucketPage.classList.remove('active');
    managerPage.classList.add('active');
    
    // Load root directory
    await loadDirectory('');
}

// Toggle Bucket Public
async function toggleBucketPublic(bucketName) {
    const isPublic = confirm(`آیا می‌خواهید bucket "${bucketName}" را Public کنید؟`);
    
    showToast('در حال تنظیم دسترسی...');
    
    try {
        const result = await window.electronAPI.setBucketPublic(bucketName, isPublic);
        
        if (result.success) {
            showToast(`Bucket با موفقیت ${isPublic ? 'Public' : 'Private'} شد`);
        } else {
            showToast(`خطا: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`خطا: ${error.message}`, 'error');
    }
}

// Create Bucket
createBucketBtn.addEventListener('click', () => {
    createBucketModal.classList.add('active');
});

createBucketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bucketName = document.getElementById('new-bucket-name').value.trim();
    const isPublic = document.getElementById('bucket-public').checked;
    
    showToast('در حال ساخت bucket...');
    
    try {
        const result = await window.electronAPI.createBucket(bucketName, isPublic);
        
        if (result.success) {
            showToast('Bucket با موفقیت ساخته شد!');
            closeCreateBucketModal();
            loadBuckets();
        } else {
            showToast(`خطا: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`خطا: ${error.message}`, 'error');
    }
});

function closeCreateBucketModal() {
    createBucketModal.classList.remove('active');
    createBucketForm.reset();
}

// Disconnect Handlers
disconnectBtn.addEventListener('click', disconnect);
disconnectBtnBuckets.addEventListener('click', disconnect);

async function disconnect() {
    await window.electronAPI.disconnectS3();
    connectedConfig = null;
    currentPath = '';
    currentBucket = null;
    
    // Clear form
    connectionForm.reset();
    
    // Switch back to connection page
    managerPage.classList.remove('active');
    bucketPage.classList.remove('active');
    connectionPage.classList.add('active');
    
    showToast('اتصال قطع شد');
}

// Load Directory
async function loadDirectory(path) {
    currentPath = path;
    
    // Show loading
    loading.style.display = 'flex';
    fileList.innerHTML = '';
    emptyState.style.display = 'none';
    
    try {
        const result = await window.electronAPI.listObjects(currentBucket, path);
        
        if (result.success) {
            updateBreadcrumb(path);
            displayFiles(result.items);
            
            // Update count
            const count = result.items.length;
            itemsCount.textContent = count === 0 ? 'خالی' : `${count} مورد`;
        } else {
            showToast(`خطا در بارگذاری: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`خطا: ${error.message}`, 'error');
    } finally {
        loading.style.display = 'none';
    }
}

// Update Breadcrumb
function updateBreadcrumb(path) {
    breadcrumb.innerHTML = '';
    
    // Home
    const homeItem = createBreadcrumbItem('', 'Home', true);
    breadcrumb.appendChild(homeItem);
    
    if (path) {
        const parts = path.split('/').filter(p => p);
        let currentPath = '';
        
        parts.forEach((part, index) => {
            currentPath += part + '/';
            const isLast = index === parts.length - 1;
            const item = createBreadcrumbItem(currentPath, part, false, isLast);
            breadcrumb.appendChild(item);
        });
    }
}

function createBreadcrumbItem(path, name, isHome, isActive = false) {
    const item = document.createElement('span');
    item.className = `breadcrumb-item ${isActive ? 'active' : ''}`;
    item.dataset.path = path;
    
    if (isHome) {
        item.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/>
            </svg>
            ${name}
        `;
    } else {
        item.textContent = name;
    }
    
    item.addEventListener('click', () => {
        if (!isActive) {
            loadDirectory(path);
        }
    });
    
    return item;
}

// Display Files
function displayFiles(items) {
    fileList.innerHTML = '';
    
    if (items.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }
    
    // Sort: folders first, then files
    items.sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name, 'fa');
        }
        return a.type === 'folder' ? -1 : 1;
    });
    
    items.forEach(item => {
        const fileItem = createFileItem(item);
        fileList.appendChild(fileItem);
    });
}

function createFileItem(item) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const isFolder = item.type === 'folder';
    const icon = isFolder ? `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    ` : `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" stroke-width="2"/>
            <polyline points="13 2 13 9 20 9" stroke="currentColor" stroke-width="2"/>
        </svg>
    `;
    
    let meta = '';
    if (isFolder) {
        meta = 'پوشه';
    } else {
        const size = formatFileSize(item.size);
        const date = item.lastModified ? formatDate(new Date(item.lastModified)) : '';
        meta = `${size}${date ? ' • ' + date : ''}`;
    }
    
    div.innerHTML = `
        <div class="file-icon ${isFolder ? 'folder' : 'file'}">
            ${icon}
        </div>
        <div class="file-info">
            <div class="file-name">${escapeHtml(item.name)}</div>
            <div class="file-meta">${meta}</div>
        </div>
        <div class="file-actions">
            ${!isFolder ? `
                <button class="action-btn download-btn" onclick="downloadFile('${escapeHtml(item.fullPath)}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    دانلود
                </button>
                <button class="action-btn share-btn" onclick="shareFile('${escapeHtml(item.fullPath)}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
                        <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    اشتراک
                </button>
            ` : ''}
        </div>
    `;
    
    // Click handler for folders
    if (isFolder) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', (e) => {
            // Don't navigate if clicking on action buttons
            if (!e.target.closest('.file-actions')) {
                loadDirectory(item.fullPath);
            }
        });
    }
    
    return div;
}

// Upload File
uploadFileBtn.addEventListener('click', () => {
    uploadModal.classList.add('active');
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('لطفاً یک فایل انتخاب کنید', 'error');
        return;
    }
    
    const key = currentPath + file.name;
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const uploadSubmitBtn = document.getElementById('upload-submit-btn');
    
    uploadSubmitBtn.disabled = true;
    uploadProgress.style.display = 'block';
    
    try {
        // Simulated progress (real progress requires stream handling)
        progressFill.style.width = '50%';
        progressText.textContent = '50%';
        
        const result = await window.electronAPI.uploadFile(currentBucket, key, file.path);
        
        if (result.success) {
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
            
            showToast('فایل با موفقیت آپلود شد!');
            closeUploadModal();
            loadDirectory(currentPath);
        } else {
            showToast(`خطا در آپلود: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`خطا: ${error.message}`, 'error');
    } finally {
        uploadSubmitBtn.disabled = false;
        setTimeout(() => {
            uploadProgress.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        }, 1000);
    }
});

function closeUploadModal() {
    uploadModal.classList.remove('active');
    uploadForm.reset();
}

// Download File
async function downloadFile(key) {
    showToast('در حال دانلود...');
    
    try {
        const result = await window.electronAPI.downloadFile(currentBucket, key);
        
        if (result.success) {
            showToast('فایل با موفقیت دانلود شد');
        } else {
            if (!result.error.includes('cancelled')) {
                showToast(`خطا در دانلود: ${result.error}`, 'error');
            }
        }
    } catch (error) {
        showToast(`خطا: ${error.message}`, 'error');
    }
}

// Share File
async function shareFile(key) {
    showToast('در حال ایجاد لینک...');
    
    try {
        const result = await window.electronAPI.getShareLink(currentBucket, key);
        
        if (result.success) {
            shareLinkInput.value = result.url;
            shareModal.classList.add('active');
            document.getElementById('copy-success').style.display = 'none';
        } else {
            showToast(`خطا: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`خطا: ${error.message}`, 'error');
    }
}

// Close Share Modal
function closeShareModal() {
    shareModal.classList.remove('active');
}

// Copy Share Link
function copyShareLink() {
    shareLinkInput.select();
    document.execCommand('copy');
    document.getElementById('copy-success').style.display = 'block';
}

// Close modal when clicking outside
shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) {
        closeShareModal();
    }
});

createBucketModal.addEventListener('click', (e) => {
    if (e.target === createBucketModal) {
        closeCreateBucketModal();
    }
});

uploadModal.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
        closeUploadModal();
    }
});

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return 'امروز';
    } else if (days === 1) {
        return 'دیروز';
    } else if (days < 7) {
        return `${days} روز پیش`;
    } else {
        return date.toLocaleDateString('fa-IR');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make functions global for onclick handlers
window.openBucket = openBucket;
window.toggleBucketPublic = toggleBucketPublic;
window.downloadFile = downloadFile;
window.shareFile = shareFile;
window.closeShareModal = closeShareModal;
window.copyShareLink = copyShareLink;
window.closeCreateBucketModal = closeCreateBucketModal;
window.closeUploadModal = closeUploadModal;
