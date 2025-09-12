window.loading = (() => {
    let overlay;
    let bar;
    let stepTimeout;

    const get = () => {
        overlay = overlay || document.getElementById('appLoader');
        bar = bar || document.getElementById('appLoaderBar');
        return overlay && bar;
    };

    const clearTimers = () => {
        if (stepTimeout) {
            clearTimeout(stepTimeout);
            stepTimeout = null;
        }
    };

    const show = () => {
        if (!get()) return;
        clearTimers();
        overlay.classList.remove('hidden');
        bar.style.width = '40%';
        stepTimeout = setTimeout(() => {
            bar.style.width = '70%';
        }, 300);
    };

    const hide = () => {
        if (!get()) return;
        clearTimers();
        bar.style.width = '100%';
        setTimeout(() => {
            overlay.classList.add('hidden');
            bar.style.width = '0%';
        }, 300);
    };

    return { show, hide };
})();
