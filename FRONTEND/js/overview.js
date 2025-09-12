// Easing function for smooth animation
function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

// Linear interpolation function
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

function animateStat(barId, valueId, targetValue) {
    const bar = document.getElementById(barId);
    const valueElement = document.getElementById(valueId);
    let startTime = null;
    const duration = 1500; // 1.5 seconds
    const startValue = 0;
    
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing to the progress
        const easedProgress = easeOutQuart(progress);
        
        // Calculate current value with easing
        const currentValue = lerp(startValue, targetValue, easedProgress);
        
        // Update the UI
        bar.style.width = `${currentValue}%`;
        valueElement.textContent = `${Math.round(currentValue)}%`;
        
        // Continue the animation until duration is reached
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    
    // Start the animation
    window.requestAnimationFrame(step);
}

// Initialize stats animation when overview page is shown
async function initStatsAnimation() {
    const userData = await window.apiService.getUser(window.userId);
    const rawCourse = (userData.moduleCount ? (userData.moduleCompleted / userData.moduleCount) * 100 : 0);
    const rawQuiz = (userData.quizAnswered ? (userData.quizCorrect / userData.quizAnswered) * 100 : 0);
    const rawSrs = (userData.srsAnswered ? (userData.srsCorrect / userData.srsAnswered) * 100 : 0);
    const clamp = v => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));
    window.courseCompletion = clamp(rawCourse);
    window.quizAccuracy = clamp(rawQuiz);
    window.retentionRate = clamp(rawSrs);
    const bars = document.querySelectorAll('[id$="Bar"]');
    if (bars.length === 0) return false;
    
    bars.forEach(bar => {
        bar.style.width = '0%';
    });

    animateStat('courseCompletionBar', 'courseCompletionValue', window.courseCompletion || 0);
    animateStat('quizAccuracyBar', 'quizAccuracyValue', window.quizAccuracy || 0);
    animateStat('retentionRateBar', 'retentionRateValue', window.retentionRate || 0);
    return true;
}

// Make initStatsAnimation globally available
window.initStatsAnimation = initStatsAnimation;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // If we're already on the overview page, initialize animations
    const overviewView = document.getElementById('homeView');
    if (overviewView && !overviewView.classList.contains('hidden')) {
        initStatsAnimation();
    }
    
    // Also initialize when the router shows the home view
    if (window.router) {
        const originalShowHome = window.router.showHome;
        window.router.showHome = function() {
            originalShowHome.apply(this, arguments);
            // Small delay to ensure DOM is updated
            setTimeout(initStatsAnimation, 50);
        };
    }
});