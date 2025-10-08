// Page Management
let currentPath = '';
let currentBucket = null;
let connectedConfig = null;
let selectedExpiry = 604800; // 7 days default
let selectedFiles = new Set();

// Local Storage Keys
const HISTORY_KEY = 's3_connection_history';
const THEME_KEY = 'app_theme';
const LANG_KEY = 'app_language';

// DOM Elements
const connectionPage = document.getElementById('connection-page');
const bucketPage = document.getElementById('bucket-page');
const managerPage = document.getElementById('manager-page');
const connectionForm = document.getElementById('connection-form');
const connectionError = document.getElementById('connection-error');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const disconnectBtnBuckets = document.getElementById('disconnect-btn-buckets');
const backToBucketsBtn = document.getElementById('back-to-buckets-btn');
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
const connectionHistory = document.getElementById('connection-history');
const historyList = document.getElementById('history-list');

// Initialize - wait for DOM and translations to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for translations to be loaded
    setTimeout(() => {
        loadConnectionHistory();
        initTheme();
        initLanguage();
        setupEventListeners();
    }, 100);
});

// Connection Form Handler
connectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let endpoint = document.getElementById('endpoint').value.trim();
    
    // Auto-detect and add https:// if missing
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
        endpoint = 'https://' + endpoint;
    }
    
    const config = {
        endpoint: endpoint,
        accessKey: document.getElementById('accessKey').value.trim(),
        secretKey: document.getElementById('secretKey').value.trim(),
        region: document.getElementById('region').value.trim() || 'us-east-1'
    };
    
    // Disable button and show loading
    connectBtn.disabled = true;
    connectBtn.innerHTML = `
        <div class="spinner" style="width: 20px; height: 20px; border-width: 3px;"></div>
        Connecting...
    `;
    connectionError.style.display = 'none';
    
    try {
        const result = await window.electronAPI.connectS3(config);
        
        if (result.success) {
            connectedConfig = config;
            storageEndpoint.textContent = config.endpoint;
            
            // Save to history
            saveToHistory(config);
            
            // Switch to bucket page
            connectionPage.classList.remove('active');
            bucketPage.classList.add('active');
            
            // Load buckets
            await loadBuckets();
        } else {
            connectionError.textContent = `Connection error: ${result.error}`;
            connectionError.style.display = 'block';
        }
    } catch (error) {
        connectionError.textContent = `Unexpected error: ${error.message}`;
        connectionError.style.display = 'block';
    } finally {
        connectBtn.disabled = false;
        connectBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            Connect to Storage
        `;
    }
});

// History Management
function saveToHistory(config) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    // Remove duplicates (same endpoint + accessKey)
    history = history.filter(item => 
        !(item.endpoint === config.endpoint && item.accessKey === config.accessKey)
    );
    
    // Add to beginning
    history.unshift({
        endpoint: config.endpoint,
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        region: config.region,
        timestamp: Date.now()
    });
    
    // Keep only last 5
    history = history.slice(0, 5);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadConnectionHistory();
}

function loadConnectionHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    if (history.length === 0) {
        connectionHistory.style.display = 'none';
        return;
    }
    
    connectionHistory.style.display = 'block';
    historyList.innerHTML = '';
    
    history.forEach((item, index) => {
        const historyItem = createHistoryItem(item, index);
        historyList.appendChild(historyItem);
    });
}

function createHistoryItem(config, index) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const date = new Date(config.timestamp);
    const dateStr = formatDate(date);
    
    div.innerHTML = `
        <div class="history-item-info">
            <div class="history-item-endpoint">${escapeHtml(config.endpoint)}</div>
            <div class="history-item-date">Last used: ${dateStr}</div>
        </div>
        <div class="history-item-actions">
            <button class="history-delete-btn" onclick="deleteHistory(${index})" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
        </div>
    `;
    
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.history-delete-btn')) {
            connectWithHistory(config);
        }
    });
    
    return div;
}

async function connectWithHistory(config) {
    document.getElementById('endpoint').value = config.endpoint;
    document.getElementById('accessKey').value = config.accessKey;
    document.getElementById('secretKey').value = config.secretKey;
    document.getElementById('region').value = config.region || 'us-east-1';
    
    connectionForm.dispatchEvent(new Event('submit'));
}

function deleteHistory(index) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.splice(index, 1);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadConnectionHistory();
    showToast('Connection removed from history');
}

// Load Buckets
async function loadBuckets() {
    console.log('Loading buckets...');
    bucketLoading.style.display = 'flex';
    bucketList.innerHTML = '';
    bucketEmptyState.style.display = 'none';
    
    try {
        const result = await window.electronAPI.listBuckets();
        console.log('List buckets result:', result);
        
        if (result.success) {
            console.log('Buckets received:', result.buckets);
            await displayBuckets(result.buckets);
        } else {
            console.error('Error from listBuckets:', result.error);
            showToast(`Error loading buckets: ${result.error}`, 'error');
            bucketEmptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Exception loading buckets:', error);
        showToast(`Error loading buckets: ${error.message}`, 'error');
        bucketEmptyState.style.display = 'flex';
    } finally {
        bucketLoading.style.display = 'none';
    }
}

// Display Buckets
async function displayBuckets(buckets) {
    console.log('Displaying buckets:', buckets);
    bucketList.innerHTML = '';
    
    if (!buckets || buckets.length === 0) {
        console.log('No buckets to display');
        bucketEmptyState.style.display = 'flex';
        return;
    }
    
    bucketEmptyState.style.display = 'none';
    
    for (const bucket of buckets) {
        try {
            console.log('Creating bucket item for:', bucket.name);
            const bucketItem = await createBucketItem(bucket);
            bucketList.appendChild(bucketItem);
        } catch (error) {
            console.error('Error creating bucket item:', bucket.name, error);
            // Create a simple fallback item
            const div = document.createElement('div');
            div.className = 'bucket-item';
            div.innerHTML = `
                <div class="bucket-card-header">
                    <div class="bucket-icon-large">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M20 7H4M14 2l-2 5M10 7l-2 5M18 7l-2 5M6 7l-2 5" stroke="currentColor" stroke-width="2"/>
                            <rect x="2" y="9" width="20" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="bucket-header-info">
                        <div class="bucket-name-large">${escapeHtml(bucket.name)}</div>
                        <div class="bucket-created">Created: ${bucket.creationDate ? formatRelativeTime(new Date(bucket.creationDate)) : 'Unknown'}</div>
                    </div>
                </div>
                <div class="bucket-actions-row">
                    <button class="btn-bucket-action primary" onclick="openBucket('${escapeHtml(bucket.name)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Open
                    </button>
                    <button class="btn-bucket-action" onclick="toggleBucketPublic('${escapeHtml(bucket.name)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M2 12h20" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Public
                    </button>
                    <button class="btn-bucket-action danger" onclick="deleteBucket('${escapeHtml(bucket.name)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Delete
                    </button>
                </div>
            `;
            bucketList.appendChild(div);
        }
    }
    console.log('Finished displaying buckets');
}

async function createBucketItem(bucket) {
    const div = document.createElement('div');
    div.className = 'bucket-item';
    
    const relativeDate = bucket.creationDate ? formatRelativeTime(new Date(bucket.creationDate)) : 'Unknown';
    
    // Try to get file count (with timeout to prevent hanging)
    let fileCount = 0;
    let totalSize = 0;
    try {
        console.log('Getting file count for bucket:', bucket.name);
        const result = await Promise.race([
            window.electronAPI.listObjects(bucket.name, ''),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (result.success && result.items) {
            fileCount = result.items.filter(item => !item.isFolder).length;
            totalSize = result.items.reduce((sum, item) => sum + (item.size || 0), 0);
            console.log(`Bucket ${bucket.name}: ${fileCount} files, ${totalSize} bytes`);
        }
    } catch (err) {
        console.log('Could not get file count for bucket:', bucket.name, err.message);
        // Continue without file count
    }
    
    div.innerHTML = `
        <div class="bucket-card-header">
            <div class="bucket-icon-large">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7H4M14 2l-2 5M10 7l-2 5M18 7l-2 5M6 7l-2 5" stroke="currentColor" stroke-width="2"/>
                    <rect x="2" y="9" width="20" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <div class="bucket-header-info">
                <div class="bucket-name-large">${escapeHtml(bucket.name)}</div>
                <div class="bucket-created">${relativeDate}</div>
            </div>
        </div>
        <div class="bucket-stats">
            <div class="bucket-stat">
                <div class="stat-icon">📄</div>
                <div class="stat-info">
                    <div class="stat-value">${fileCount}</div>
                    <div class="stat-label">Files</div>
                </div>
            </div>
            <div class="bucket-stat">
                <div class="stat-icon">💾</div>
                <div class="stat-info">
                    <div class="stat-value">${formatFileSize(totalSize)}</div>
                    <div class="stat-label">Total Size</div>
                </div>
            </div>
        </div>
        <div class="bucket-actions-row">
            <button class="btn-bucket-action primary" onclick="openBucket('${escapeHtml(bucket.name)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Open
            </button>
            <button class="btn-bucket-action" onclick="toggleBucketPublic('${escapeHtml(bucket.name)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M2 12h20" stroke="currentColor" stroke-width="2"/>
                </svg>
                Public
            </button>
            <button class="btn-bucket-action danger" onclick="deleteBucket('${escapeHtml(bucket.name)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Delete
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
    const isPublic = confirm(`Do you want to make bucket "${bucketName}" public?`);
    
    showToast('Setting access...');
    
    try {
        const result = await window.electronAPI.setBucketPublic(bucketName, isPublic);
        
        if (result.success) {
            showToast(`Bucket is now ${isPublic ? 'Public' : 'Private'}`);
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Delete Bucket
async function deleteBucket(bucketName) {
    if (!confirm(`Are you sure you want to delete bucket "${bucketName}"? This will delete all files in it!`)) {
        return;
    }
    
    showToast('Deleting bucket...');
    
    try {
        const result = await window.electronAPI.deleteBucket(bucketName);
        
        if (result.success) {
            showToast('Bucket deleted successfully');
            loadBuckets();
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
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
    
    showToast('Creating bucket...');
    
    try {
        const result = await window.electronAPI.createBucket(bucketName, isPublic);
        
        if (result.success) {
            showToast('Bucket created successfully!');
            closeCreateBucketModal();
            loadBuckets();
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
});

function closeCreateBucketModal() {
    createBucketModal.classList.remove('active');
    createBucketForm.reset();
}

// Back to Buckets
backToBucketsBtn.addEventListener('click', () => {
    managerPage.classList.remove('active');
    bucketPage.classList.add('active');
    currentBucket = null;
    currentPath = '';
});

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
    
    showToast('Disconnected');
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
            itemsCount.textContent = count === 0 ? 'Empty' : `${count} items`;
        } else {
            showToast(`Error loading: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
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
            return a.name.localeCompare(b.name);
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
        meta = 'Folder';
    } else {
        const size = formatFileSize(item.size);
        const date = item.lastModified ? formatRelativeTime(new Date(item.lastModified)) : '';
        meta = `${size}${date ? ' • ' + date : ''}`;
    }
    
    div.innerHTML = `
        <div class="file-checkbox-wrapper">
            <input type="checkbox" class="file-checkbox" data-key="${escapeHtml(item.fullPath)}">
        </div>
        <div class="file-icon ${isFolder ? 'folder' : 'file'}">
            ${icon}
        </div>
        <div class="file-info">
            <div class="file-name">${escapeHtml(item.name)}</div>
            <div class="file-meta">${meta}</div>
        </div>
        <div class="file-actions">
            ${!isFolder ? `
                <button class="action-btn download-btn" data-action="download" data-path="${escapeHtml(item.fullPath)}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Download
                </button>
                <button class="action-btn share-btn" data-action="share" data-path="${escapeHtml(item.fullPath)}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
                        <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Share
                </button>
                <button class="action-btn" data-action="make-public" data-path="${escapeHtml(item.fullPath)}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 12h20" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Public
                </button>
                ${item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? `
                ` : ''}
            ` : ''}
            <button class="action-btn delete-btn" data-action="delete" data-path="${escapeHtml(item.fullPath)}" data-is-folder="${isFolder}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Delete
            </button>
        </div>
    `;
    
    // Event listeners
    const checkbox = div.querySelector('.file-checkbox');
    const checkboxWrapper = div.querySelector('.file-checkbox-wrapper');
    
    checkboxWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleFileSelection(checkbox, item.fullPath);
    });
    
    // Action button listeners
    div.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const path = btn.dataset.path;
            const isFolder = btn.dataset.isFolder === 'true';
            
            switch(action) {
                case 'download': 
                    downloadFile(path); 
                    break;
                case 'share': 
                    shareFile(path); 
                    break;
                case 'make-public': 
                    makeFilePublic(path); 
                    break;
                case 'delete': 
                    deleteItem(path, isFolder); 
                    break;
            }
        });
    });
    
    // Click handler for folders
    if (isFolder) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', (e) => {
            // Don't navigate if clicking on checkbox, wrapper, or actions
            if (e.target.closest('.file-checkbox-wrapper') || 
                e.target.closest('.file-actions') || 
                e.target.type === 'checkbox') {
                return;
            }
            loadDirectory(item.fullPath);
        });
    }
    
    return div;
}

// Delete Item
async function deleteItem(key, isFolder) {
    const itemType = isFolder ? 'folder' : 'file';
    if (!confirm(`Are you sure you want to delete this ${itemType}?`)) {
        return;
    }
    
    showToast(`Deleting ${itemType}...`);
    
    try {
        const result = await window.electronAPI.deleteObject(currentBucket, key);
        
        if (result.success) {
            showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);
            loadDirectory(currentPath);
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
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
        showToast('Please select a file', 'error');
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
            
            showToast('File uploaded successfully!');
            closeUploadModal();
            loadDirectory(currentPath);
        } else {
            showToast(`Upload error: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
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
    showToast('Downloading...');
    
    try {
        const result = await window.electronAPI.downloadFile(currentBucket, key);
        
        if (result.success) {
            showToast('File downloaded successfully');
        } else {
            if (!result.error.includes('cancelled')) {
                showToast(`Download error: ${result.error}`, 'error');
            }
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Share File
let currentShareKey = null;

async function shareFile(key) {
    console.log('Generating share link for:', key, 'Expiry:', selectedExpiry);
    currentShareKey = key;
    showToast('Generating link...');
    
    try {
        const result = await window.electronAPI.getShareLink(currentBucket, key, selectedExpiry);
        console.log('Share link result:', result);
        
        if (result.success) {
            shareLinkInput.value = result.url;
            shareModal.classList.add('active');
            const copySuccess = document.getElementById('copy-success');
            if (copySuccess) {
                copySuccess.style.display = 'none';
            }
        } else {
            console.error('Share link error:', result.error);
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Share link exception:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Regenerate link when expiry changes
async function regenerateShareLink() {
    console.log('Regenerating share link...');
    if (currentShareKey && currentBucket) {
        console.log('Regenerating link with new expiry:', selectedExpiry, 'for key:', currentShareKey);
        try {
            const result = await window.electronAPI.getShareLink(currentBucket, currentShareKey, selectedExpiry);
            console.log('Regenerate result:', result);
            if (result.success) {
                shareLinkInput.value = result.url;
                const copySuccess = document.getElementById('copy-success');
                if (copySuccess) {
                    copySuccess.style.display = 'none';
                }
                console.log('Link updated successfully');
            } else {
                console.error('Failed to regenerate link:', result.error);
                showToast(`Error updating link: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Exception regenerating link:', error);
            showToast(`Error updating link: ${error.message}`, 'error');
        }
    } else {
        console.log('No current share key or bucket available');
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
    const copySuccess = document.getElementById('copy-success');
    if (copySuccess) {
        copySuccess.style.display = 'block';
    }
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
        return 'Today';
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function formatRelativeTime(date) {
    if (!date) return 'Unknown';
    
    try {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);
        
        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
        return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    } catch (e) {
        console.error('Error formatting relative time:', e);
        return 'Unknown';
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
    toast.className = 'toast';
    if (type === 'error') {
        toast.classList.add('error');
    }
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}

// Language Management
function initLanguage() {
    const savedLang = localStorage.getItem(LANG_KEY) || 'en';
    console.log('Initializing language:', savedLang);
    changeLanguage(savedLang);
    
    // Set all language selectors
    document.querySelectorAll('[id^="language-select"]').forEach(select => {
        select.value = savedLang;
    });
}

function changeLanguage(lang) {
    console.log('Changing language to:', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    
    // Apply Persian font class
    if (lang === 'fa') {
        document.body.classList.add('persian-font');
        console.log('Applied Persian font class');
    } else {
        document.body.classList.remove('persian-font');
        console.log('Removed Persian font class');
    }
    
    // Update all text content
    updateTextContent(lang);
    
    if (window.setLanguage) {
        window.setLanguage(lang);
    }
    localStorage.setItem(LANG_KEY, lang);
}

// Update Text Content
function updateTextContent(lang) {
    console.log('Updating text content for language:', lang);
    
    // Check if translations object exists
    if (typeof translations === 'undefined') {
        console.warn('Translations object not available yet, retrying...');
        setTimeout(() => updateTextContent(lang), 100);
        return;
    }
    
    // Get all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    console.log('Found', elements.length, 'elements to translate');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang] && translations[lang][key];
        
        if (translation) {
            element.textContent = translation;
            console.log(`Updated ${key}: ${translation}`);
        } else {
            console.warn(`No translation found for key: ${key} in language: ${lang}`);
        }
    });
    
    // Update placeholder texts
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = translations[lang] && translations[lang][key];
        
        if (translation) {
            element.placeholder = translation;
            console.log(`Updated placeholder ${key}: ${translation}`);
        }
    });
}

// Search Functions
function setupSearchListeners() {
    // Search buckets
    const bucketSearch = document.getElementById('bucket-search');
    if (bucketSearch) {
        bucketSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.bucket-item').forEach(item => {
                const bucketName = item.querySelector('.bucket-name')?.textContent.toLowerCase() || '';
                item.style.display = bucketName.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Search files
    const fileSearch = document.getElementById('file-search');
    if (fileSearch) {
        fileSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.file-item').forEach(item => {
                const fileName = item.querySelector('.file-name')?.textContent.toLowerCase() || '';
                item.style.display = fileName.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// Expiry Selection
function setExpiry(seconds) {
    console.log('Setting expiry to:', seconds, 'seconds');
    selectedExpiry = seconds;
    
    // Update button states
    document.querySelectorAll('.btn-expiry').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.expiry) === seconds) {
            btn.classList.add('active');
            console.log('Activated button for:', seconds);
        }
    });
    
    const expiryText = seconds === 86400 ? '1 day' : seconds === 172800 ? '2 days' : '7 days';
    showToast(`Link expiry set to ${expiryText}`);
    
    // Regenerate the link with new expiry if modal is open
    if (shareModal && shareModal.classList.contains('active')) {
        console.log('Share modal is active, regenerating link...');
        regenerateShareLink();
    } else {
        console.log('Share modal is not active');
    }
}

// Multi-Select Functions
function toggleFileSelection(checkbox, key) {
    if (checkbox.checked) {
        selectedFiles.add(key);
    } else {
        selectedFiles.delete(key);
    }
    updateDeleteButton();
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('delete-selected-btn');
    if (deleteBtn) {
        deleteBtn.style.display = selectedFiles.size > 0 ? 'block' : 'none';
    }
}

async function deleteSelected() {
    if (selectedFiles.size === 0) {
        showToast('No files selected');
        return;
    }
    
    const count = selectedFiles.size;
    if (!confirm(`Delete ${count} item(s)?`)) return;
    
    showToast(`Deleting ${count} items...`);
    
    for (const key of selectedFiles) {
        await window.electronAPI.deleteObject(currentBucket, key);
    }
    
    selectedFiles.clear();
    showToast('Items deleted successfully');
    loadDirectory(currentPath);
}

// Event Listeners Setup
function setupEventListeners() {
    // Theme toggle - all instances
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-buckets')?.addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-manager')?.addEventListener('click', toggleTheme);
    
    // Language select - all instances
    const syncLanguage = (value) => {
        changeLanguage(value);
        // Sync all selectors
        document.querySelectorAll('[id^="language-select"]').forEach(sel => {
            sel.value = value;
        });
    };
    
    document.getElementById('language-select')?.addEventListener('change', (e) => syncLanguage(e.target.value));
    document.getElementById('language-select-buckets')?.addEventListener('change', (e) => syncLanguage(e.target.value));
    document.getElementById('language-select-manager')?.addEventListener('change', (e) => syncLanguage(e.target.value));
    
    // Create folder button
    document.getElementById('create-folder-btn')?.addEventListener('click', createFolder);
    
    // Delete selected button
    document.getElementById('delete-selected-btn')?.addEventListener('click', deleteSelected);
    
    // Setup search
    setupSearchListeners();
}

// Create Folder
async function createFolder() {
    console.log('Create folder button clicked!');
    
    // Get current language
    const currentLang = localStorage.getItem(LANG_KEY) || 'en';
    
    // Create modal for folder name input
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${translations[currentLang]?.createNewFolder || 'Create New Folder'}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="folder-name-input">${translations[currentLang]?.folderName || 'Folder Name'}</label>
                    <input type="text" id="folder-name-input" placeholder="${translations[currentLang]?.folderNamePlaceholder || 'Enter folder name'}" class="form-input">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">${translations[currentLang]?.cancel || 'Cancel'}</button>
                <button class="btn-primary" onclick="createFolderConfirm()">${translations[currentLang]?.create || 'Create'}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => {
        const input = document.getElementById('folder-name-input');
        if (input) {
            input.focus();
        }
    }, 100);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Create Folder Confirm
async function createFolderConfirm() {
    const folderNameInput = document.getElementById('folder-name-input');
    const folderName = folderNameInput.value.trim();
    
    if (!folderName) {
        showToast('pleaseEnterFolderName', 'error');
        return;
    }
    
    const key = currentPath ? `${currentPath}${folderName}/` : `${folderName}/`;
    
    console.log('Creating folder with key:', key, 'in bucket:', currentBucket);
    showToast('creatingFolder');
    
    // Close modal
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
    
    try {
        // S3 doesn't have folders, we create an empty object with trailing slash
        const result = await window.electronAPI.uploadFile(currentBucket, key, null);
        console.log('Create folder result:', result);
        
        if (result.success) {
            showToast('folderCreatedSuccess', 'success');
            loadDirectory(currentPath);
        } else {
            console.error('Create folder error:', result.error);
            showToast('folderCreateError', 'error');
        }
    } catch (error) {
        console.error('Create folder exception:', error);
        showToast('folderCreateError', 'error');
    }
}

// Make File Public
async function makeFilePublic(key) {
    console.log('Making file public:', key);
    
    if (!confirm(`Make "${key}" publicly accessible?`)) {
        return;
    }
    
    showToast('Setting file as public...');
    
    try {
        const result = await window.electronAPI.setObjectPublic(currentBucket, key, true);
        console.log('Set object public result:', result);
        
        if (result.success) {
            showToast('File is now public! Anyone with the link can access it.');
        } else {
            console.error('Set object public error:', result.error);
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Set object public exception:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Make functions global for onclick handlers
// Global functions for onclick handlers
window.openBucket = openBucket;
window.toggleBucketPublic = toggleBucketPublic;
window.deleteBucket = deleteBucket;
window.deleteHistory = deleteHistory;
window.downloadFile = downloadFile;
window.shareFile = shareFile;
window.deleteItem = deleteItem;
window.setExpiry = setExpiry;
window.toggleFileSelection = toggleFileSelection;
window.makeFilePublic = makeFilePublic;
window.closeShareModal = closeShareModal;
window.copyShareLink = copyShareLink;
window.closeCreateBucketModal = closeCreateBucketModal;
window.closeUploadModal = closeUploadModal;
window.createFolderConfirm = createFolderConfirm;

