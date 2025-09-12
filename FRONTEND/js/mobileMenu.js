const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMobileMenu = document.getElementById('closeMobileMenu');
let nextMobileMenuToggleAt = 0;

function openMobileMenu() {
    mobileMenu.classList.remove('hidden');
    mobileMenu.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Animate hamburger to X
    const spans = mobileMenuBtn.querySelectorAll('span');
    spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
}

function closeMobileMenuFunc() {
    mobileMenu.classList.add('hidden');
    mobileMenu.classList.remove('flex');
    document.body.style.overflow = '';

    // Reset hamburger animation
    const spans = mobileMenuBtn.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
}

function closeMobileMenuAndNavigate(route) {
    closeMobileMenuFunc();
    if (typeof window.router !== 'undefined') {
        window.router.navigateTo(route);
    }
}

function handleMobileMenu() {
    const now = Date.now();
    if (now < nextMobileMenuToggleAt) return;
    nextMobileMenuToggleAt = now + 350;
    if (mobileMenu.classList.contains('hidden')) {
        openMobileMenu();
    } else {
        closeMobileMenuFunc();
    }
}

// Event listeners
mobileMenuBtn.addEventListener('click', handleMobileMenu);
closeMobileMenu.addEventListener('click', closeMobileMenuFunc);

// Make closeMobileMenuAndNavigate globally available
window.closeMobileMenuAndNavigate = closeMobileMenuAndNavigate;