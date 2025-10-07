// Fixed file item creation with proper event handling

function createFileItem(item) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const isFolder = item.isFolder;
    let icon = '';
    let meta = '';
    
    if (isFolder) {
        icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
        </svg>`;
        meta = 'Folder';
    } else {
        icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" stroke-width="2"/>
            <polyline points="13 2 13 9 20 9" stroke="currentColor" stroke-width="2"/>
        </svg>`;
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
                <button class="action-btn download-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Download
                </button>
                <button class="action-btn share-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
                        <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Share
                </button>
                <button class="action-btn make-public-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 12h20" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Make Public
                </button>
                ${item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? `
                <button class="action-btn crop-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" stroke="currentColor" stroke-width="2"/>
                        <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Crop
                </button>
                ` : ''}
            ` : ''}
            <button class="action-btn rename-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Rename
            </button>
            <button class="action-btn delete-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Delete
            </button>
        </div>
    `;
    
    // Event listeners with proper stopPropagation
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
    if (!isFolder) {
        div.querySelector('.download-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadFile(item.fullPath);
        });
        
        div.querySelector('.share-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            shareFile(item.fullPath);
        });
        
        div.querySelector('.make-public-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            makeFilePublic(item.fullPath);
        });
        
        div.querySelector('.crop-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            cropImage(item.fullPath);
        });
    }
    
    div.querySelector('.rename-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        renameItem(item.fullPath, isFolder);
    });
    
    div.querySelector('.delete-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteItem(item.fullPath, isFolder);
    });
    
    // Click handler for folders
    if (isFolder) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', (e) => {
            // Only navigate if not clicking on checkbox or actions
            if (e.target.closest('.file-checkbox-wrapper') || 
                e.target.closest('.file-actions') || 
                e.target.type === 'checkbox') {
                return;
            }
            navigateToFolder(item.fullPath);
        });
    }
    
    return div;
}

