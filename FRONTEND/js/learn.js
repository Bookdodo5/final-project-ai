const initLearnPage = () => {
    document.getElementById('newCourseBtn')?.addEventListener('click', window.showNewCourseModal);

    const searchInput = document.getElementById('courseSearch');
    searchInput?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('#courseGrid > div').forEach(card => {
            const text = card.querySelector('h3')?.textContent?.toLowerCase();
            card.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    });

    window.loadCourses();
};

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', initLearnPage)
    : initLearnPage();

window.loadCourses = async () => {
    try {
        if (window.loading) window.loading.show('Loading courses...');
        window.coursesData = await window.apiService.getCourses(window.userId);
        renderCourseGrid();
    } catch (error) {
        console.error('Error loading courses:', error);
        window.coursesData = [];
        renderCourseGrid();
    } finally {
        if (window.loading) window.loading.hide();
    }
};

const deleteCourse = async (courseId) => {
    try {
        await window.apiService.deleteCourse(window.userId, courseId);
        window.loadCourses();
    } catch (error) {
        console.error('Error deleting course:', error);
    }
};

const regenerateCourse = async (courseId) => {
    try {
        await window.apiService.regenerateCourse(window.userId, courseId);
        window.loadCourses();
    } catch (error) {
        console.error('Error regenerating course:', error);
    }
};

const renderCourseGrid = () => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp._seconds * 1000);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const courseGrid = document.getElementById('courseGrid');
    if (!courseGrid) return;

    courseGrid.innerHTML = window.coursesData.map(course => `
        <li class="bg-panel border border-line rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-c1/50 p-5 flex flex-col h-full gap-4 ${course.status === 'generating' ? 'animate-pulse' : ''}">
            <h2 class="text-lg font-bold text-text line-clamp-4" title="${course.courseName || 'Untitled Course'}">
                ${course.courseName || 'Untitled Course'}
            </h2>
            
            <p class="text-muted text-sm line-clamp-4 h-20" title="${course.description || 'No description available'}">
                ${course.description || 'No description available'}
            </p>
            
            <div class="inline-flex flex-wrap gap-2 text-xs">
                <span class="bg-c3/20 text-c3 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                    <i class="fas fa-clock text-xs mr-1 text-c3"></i>
                    ${course.lengthOption || 'N/A'}
                </span>
                <span class="bg-c2/20 text-c2 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                    <i class="fas fa-language text-xs mr-1 text-c2"></i>
                    ${course.languageOption || 'N/A'}
                </span>
                <span class="px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${course.status === 'active' ? 'bg-c1/20 text-c1' : course.status === 'error' ? 'bg-c4/20 text-c4' : 'bg-muted/20 text-muted'}">
                    ${course.status === 'generating' ? '<i class="fas fa-spinner fa-spin text-xs mr-1"></i>' : '<i class="fas fa-info-circle text-xs mr-1"></i>'}
                    ${course.status || 'N/A'}
                </span>
            </div>
            <div class="flex justify-between gap-2 text-xs text-muted">
                <span class="truncate">
                    <i class="far fa-calendar-alt mr-1"></i>
                    Last accessed: ${formatDate(course.lastAccessed) || 'Never'}
                </span>
            </div>
            
            ${course.error && course.status === 'error' ? `
                <div class="bg-red-900/20 border border-red-500/30 text-red-300 text-xs p-2 rounded flex items-start">
                    <i class="fas fa-exclamation-circle mt-0.5 mr-1.5"></i>
                    <span class="flex-1">${course.error}</span>
                </div>
                <div class="mt-auto pt-4 border-t border-line/50">
                    <div class="flex justify-between">
                        <button
                            class="text-c1 hover:text-white font-medium text-sm px-4 py-2 bg-c1/10 hover:bg-c1/20 rounded-lg transition-colors duration-200"
                            onclick="regenerateCourse('${course.id || ''}')"
                        >
                            <i class="fas fa-sync-alt mr-1"></i> Regenerate
                        </button>
                        <button
                            class="text-c4 hover:text-white font-medium text-sm px-4 py-2 bg-c4/10 hover:bg-c4/20 rounded-lg transition-colors duration-200"
                            onclick="deleteCourse('${course.id || ''}')"
                        >
                            <i class="fas fa-trash mr-1"></i> Delete
                        </button>
                    </div>
                </div>
            ` : ''}
            
            ${course.status === 'generating' ? `
                <div class="mt-auto pt-4 border-t border-line/50">
                    <div class="flex items-center justify-center gap-2 text-muted text-sm">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Generating course content...</span>
                    </div>
                </div>
            ` : course.status === 'active' ? `
            <div class="mt-auto pt-4 border-t border-line/50">
                <div class="flex items-center w-full px-2 pb-4">
                    <div class="w-full bg-line/50 rounded-full h-1.5 mr-2">
                        <div class="bg-c1 h-full rounded-full transition-all duration-500" style="width: ${course.progress || 0}%"></div>
                    </div>
                    <span class="text-xs font-medium text-white">${course.progress || 0}%</span>
                </div>
                <div class="flex justify-between">
                    <button
                        class="text-c1 hover:text-white font-medium text-sm px-4 py-2 bg-c1/10 hover:bg-c1/20 rounded-lg transition-colors duration-200"
                        onclick="window.router.showCourse('${course.id || ''}')"
                        >
                        Study Now
                        <i class="fas fa-arrow-right ml-1 text-xs"></i>
                    </button>
                    <button
                        class="text-c4 hover:text-white font-medium text-sm px-4 py-2 bg-c4/10 hover:bg-c4/20 rounded-lg transition-colors duration-200"
                        onclick="deleteCourse('${course.id || ''}')"
                        >
                        Delete
                        <i class="fas fa-trash ml-1 text-xs"></i>
                    </button>
                </div>
            </div>` : ''}
        </li>
    `).join('');
};