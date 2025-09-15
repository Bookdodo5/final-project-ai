// Easing function for smooth animation
function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

// Linear interpolation function
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

window.setStat = (barId, valueId, targetValue) => {
    const bar = document.getElementById(barId);
    const valueElement = document.getElementById(valueId);
    bar.style.width = `${targetValue}%`;
    valueElement.textContent = `${Math.round(targetValue)}%`;
}

function animateStat(barId, valueId, targetValue) {
    const bar = document.getElementById(barId);
    const startValue = parseFloat(bar.style.width) || 0;
    let startTime = null;
    const duration = 1000; // 1 second
    
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easedProgress = easeOutQuart(progress);
        const currentValue = lerp(startValue, targetValue, easedProgress);
        
        setStat(barId, valueId, currentValue);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    
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

window.initStatsAnimation = initStatsAnimation;