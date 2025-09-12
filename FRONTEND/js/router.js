// Simple Router
const router = {
    currentView: 'home',
    navPages: {
        'home': 'home',
        'learn': 'learn',
        'review': 'review',
        'create-course': 'learn',
        'course': 'learn',
        'module': 'learn'
    },

    // Initialize router
    init() {
        // Set up navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-route') || 'home';
                this.navigateTo(target);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.currentHash = null; // Force route update
            this.route();
        });

        // Initial route with debounce
        setTimeout(() => this.route(), 0);
    },

    // Navigate to a route
    navigateTo(route) {
        if (window.location.hash.substring(1) !== route) {
            window.history.pushState({}, '', `#${route}`);
            this.route();
        } else {
            // Force a re-route even if the hash is the same
            this.currentHash = null;
            this.route();
        }
    },

    // Handle routing
    route() {
        const hash = window.location.hash.substring(1);

        // Prevent re-rendering the same view
        if (this.currentHash === hash) return;
        this.currentHash = hash;

        // Handle different routes
        if (hash.startsWith('course/')) {
            const courseId = hash.split('/')[1];
            this.showCourse(courseId);
        } else if (hash.startsWith('module/')) {
            const [_, moduleId, courseId] = hash.split('/');
            this.showModule(moduleId, courseId);
        } else {
            switch (hash) {
                case '':
                case 'home': this.showHome(); break;
                case 'learn': this.showLearn(); break;
                case 'review': this.showReview(); break;
                case 'create-course': this.showCreateCourse(); break;
                default: this.navigateTo('home');
            }
        }
    },

    // Show a view
    showView(viewName) {
        // Hide all views
        document.querySelectorAll('[id$="View"]').forEach(view => {
            view.classList.add('hidden');
        });

        // Show the requested view
        const view = document.getElementById(`${viewName}View`);
        if (view) {
            view.classList.remove('hidden');
            this.currentView = viewName;
            this.updateNav();
        }
    },

    // Update navigation state
    updateNav() {
        document.querySelectorAll('nav a').forEach(link => {
            const route = link.getAttribute('data-route') || 'home';
            if (route === this.navPages[this.currentView]) {
                link.classList.add('bg-c1/80');
                link.classList.add('hover:bg-c1/60');
                link.classList.add('rounded-lg');
                link.classList.remove('bg-bg');
                link.classList.remove('hover:bg-line/30');
                link.classList.remove('rounded-sm');
            } else {
                link.classList.remove('bg-c1/80');
                link.classList.remove('hover:bg-c1/60');
                link.classList.remove('rounded-lg');
                link.classList.add('bg-bg');
                link.classList.add('hover:bg-line/30');
                link.classList.add('rounded-sm');
            }
        });
    },

    // View handlers
    showHome() {
        this.showView('home');
        if (window.initStatsAnimation) window.initStatsAnimation();
    },

    showLearn() {
        this.showView('learn');
        if (window.loadCourses) window.loadCourses();
    },

    showCourse(courseId) {
        this.showView('course');
        if (window.openCourse) window.openCourse(courseId, true);
    },

    showModule(moduleId, courseId) {
        this.showView('module');
        if (window.openModule) window.openModule(moduleId, courseId);
    },

    showReview() {
        this.showView('review');
        if (window.loadDueQuestions) window.loadDueQuestions();
    },

    showCreateCourse() {
        this.showView('createCourse');
        // Create course initialization would go here
    }
};

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => router.init());

// Make router globally available
window.router = router;