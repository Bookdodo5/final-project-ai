// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const searchInput = document.querySelector('.search-input');
const navLinks = document.querySelectorAll('.nav-link');
const progressBars = document.querySelectorAll('.progress-fill');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeUploadArea();
    initializeSearch();
    initializeNavigation();
    animateProgressBars();
    initializeKeyboardShortcuts();
});

// Upload Area Functionality
function initializeUploadArea() {
    if (!uploadArea) return;

    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', handleUploadClick);

    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
        uploadArea.style.borderColor = 'var(--c1)';
        uploadArea.style.backgroundColor = 'rgba(27, 184, 141, 0.1)';
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        uploadArea.style.borderColor = 'var(--line)';
        uploadArea.style.backgroundColor = 'transparent';
    }

    function handleDrop(e) {
        e.preventDefault();
        handleDragLeave(e);
        
        const files = Array.from(e.dataTransfer.files);
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length > 0) {
            handleFileUpload(pdfFiles);
        } else {
            showNotification('Please upload PDF files only', 'error');
        }
    }

    function handleUploadClick() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.multiple = true;
        input.style.display = 'none';
        
        input.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                handleFileUpload(files);
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
}

// File Upload Handler
function handleFileUpload(files) {
    const uploadIcon = uploadArea.querySelector('.upload-icon');
    const uploadText = uploadArea.querySelector('p');
    
    // Show loading state
    uploadIcon.className = 'fas fa-spinner fa-spin upload-icon';
    uploadText.textContent = 'Processing...';
    
    // Simulate file processing
    setTimeout(() => {
        uploadIcon.className = 'fas fa-check upload-icon';
        uploadIcon.style.color = 'var(--c1)';
        uploadText.textContent = `${files.length} file(s) uploaded successfully!`;
        
        showNotification(`Successfully uploaded ${files.length} PDF file(s)`, 'success');
        
        // Reset after 3 seconds
        setTimeout(() => {
            uploadIcon.className = 'fas fa-cloud-upload-alt upload-icon';
            uploadIcon.style.color = 'var(--muted)';
            uploadText.textContent = 'Drag & drop';
        }, 3000);
    }, 2000);
}

// Search Functionality
function initializeSearch() {
    if (!searchInput) return;

    let searchTimeout;
    
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length > 0) {
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        }
    });

    searchInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });

    searchInput.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
}

function performSearch(query) {
    // Simulate search functionality
    console.log('Searching for:', query);
    showNotification(`Searching for: "${query}"`, 'info');
}

// Navigation
function initializeNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Simulate page navigation
            const page = this.textContent.trim();
            showNotification(`Navigating to ${page}`, 'info');
        });
    });
}

// Progress Bar Animation
function animateProgressBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressFill = entry.target;
                const width = progressFill.style.width;
                progressFill.style.width = '0%';
                
                setTimeout(() => {
                    progressFill.style.width = width;
                }, 100);
            }
        });
    }, { threshold: 0.5 });

    progressBars.forEach(bar => {
        observer.observe(bar);
    });
}

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape to clear search
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
            searchInput.value = '';
        }
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles for notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'var(--text)',
        fontWeight: '500',
        fontSize: '14px',
        zIndex: '1000',
        transform: 'translateX(400px)',
        transition: 'all 0.3s ease',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    });
    
    // Set background color based on type
    const colors = {
        success: 'var(--c1)',
        error: 'var(--c4)',
        info: 'var(--c2)',
        warning: 'var(--c3)'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Smooth scroll for internal links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add loading states for interactive elements
function addLoadingState(element, duration = 2000) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.style.pointerEvents = 'none';
    element.style.opacity = '0.7';
    
    setTimeout(() => {
        element.innerHTML = originalContent;
        element.style.pointerEvents = 'auto';
        element.style.opacity = '1';
    }, duration);
}

// Initialize tooltips for better UX
function initializeTooltips() {
    const elementsWithTooltips = document.querySelectorAll('[data-tooltip]');
    
    elementsWithTooltips.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    
    Object.assign(tooltip.style, {
        position: 'absolute',
        background: 'var(--panel)',
        color: 'var(--text)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        border: '1px solid var(--line)',
        zIndex: '1001',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
    });
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Performance optimization: Debounce resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize
window.addEventListener('resize', debounce(() => {
    // Recalculate any layout-dependent features
    console.log('Window resized, recalculating layout...');
}, 250));

// Add focus management for accessibility
document.addEventListener('keydown', function(e) {
    // Tab navigation enhancement
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// Export functions for potential external use
window.MasteryPath = {
    showNotification,
    addLoadingState,
    performSearch
};
