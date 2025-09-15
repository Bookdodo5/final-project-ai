// Simple Router
const router = {
    currentView: 'home',
    pageTitles: {
        'home': 'Home - MasteryPath',
        'learn': 'Learn - MasteryPath',
        'course': 'Course - MasteryPath',
        'module': 'Module - MasteryPath',
        'review': 'Review - MasteryPath',
        'createCourse': 'Create Course - MasteryPath'
    },
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

    colorDeg: 0,
    changeBg() {
        const imageBg = document.getElementById('imageBg');
        const gradientBg = document.getElementById('gradientBg');
        let randomDeg = Math.random() * 20;
        this.colorDeg += randomDeg;
        imageBg.style.filter = `hue-rotate(${this.colorDeg}deg)`;
        gradientBg.style.filter = `hue-rotate(${this.colorDeg}deg)`;
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

    // Update page title
    updatePageTitle(viewName, additionalInfo = '') {
        let title = this.pageTitles[viewName] || 'MasteryPath';
        if (additionalInfo) {
            title = `${additionalInfo} | ${title}`;
        }
        document.title = title;
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
            this.updatePageTitle(viewName);
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
        window.setStat('courseCompletionBar', 'courseCompletionValue', 0);
        window.setStat('quizAccuracyBar', 'quizAccuracyValue', 0);
        window.setStat('retentionRateBar', 'retentionRateValue', 0);
        this.changeBg();
        this.showView('home');
        if (window.initStatsAnimation) window.initStatsAnimation();
    },

    showLearn() {
        this.changeBg();
        this.showView('learn');
        if (window.loadCourses) window.loadCourses();
    },

    showCourse(courseId) {
        this.changeBg();
        this.showView('course');
        if (window.openCourse) {
            window.openCourse(courseId, true);
            // Update title with course name if available
            const course = window.coursesData?.find(c => c.id === courseId || c._id === courseId);
            if (course?.courseName) {
                this.updatePageTitle('course', course.courseName);
            }
        }
    },

    showModule(moduleId, courseId) {
        this.changeBg();
        this.showView('module');
        if (window.openModule) {
            window.openModule(moduleId, courseId);
            // Update title with module name if available
            const module = window.modulesData?.find(m => m.id === moduleId || m._id === moduleId);
            if (module?.moduleName) {
                this.updatePageTitle('module', module.moduleName);
            }
        }
    },

    showReview() {
        this.changeBg();
        this.showView('review');
        if (window.loadDueQuestions) window.loadDueQuestions();
    },

    showCreateCourse() {
        this.changeBg();
        this.showView('createCourse');
        // Create course initialization would go here
    }
};

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => router.init());

// Make router globally available
window.router = router;