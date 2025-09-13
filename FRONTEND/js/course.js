window.openCourse = async (courseId, forceReload = false) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp._seconds * 1000);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    if ((window.loadingCourse === courseId && !forceReload) || !courseId) return false;
    
    window.loadingCourse = courseId;
    const courseView = document.getElementById('courseView');
    if (!courseView) return (window.loadingCourse = null, false);
    
    try {
        if (window.loading) window.loading.show('Loading course...');
        courseView.innerHTML = '';
        
        const course = window.coursesData?.find(c => c.id === courseId || c._id === courseId);
        if (!course) throw new Error('Course not found');
        
        window.history.pushState({}, '', `#course/${courseId}`);
        await window.loadModules(courseId);

        // Render course content after modules are loaded
        courseView.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col md:flex-row justify-between items-center md:items-start md:py-8 md:pt-16 py-4 pt-8">
                    <div class="text-center md:text-left">
                        <h1 class="text-3xl font-bold text-white">Course</h1>
                        <p class="text-muted">View the course you created.</p>
                    </div>
                    <button onclick="window.backToCourseGrid()" class="flex items-center text-c1 hover:text-c1/80 mb-8 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i> Back to Courses
                    </button>
                </div>
                <div class="bg-panel/60 border border-line/50 backdrop-blur-sm rounded-2xl overflow-hidden mb-8">
                    <div class="p-6 md:p-8 border-b border-line/50 flex flex-col lg:flex-row gap-8">
                        <div class="flex-1">
                            <h2 class="text-2xl md:text-3xl font-bold text-text mb-4">${course.courseName || 'Course Title'}</h2>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-muted mb-6">
                                <span class="bg-c3/20 text-c3 px-3 py-1.5 rounded inline-flex items-center">
                                    <i class="fa fa-clock text-xs mr-1 text-c3"></i>
                                    ${course.lengthOption || 'N/A'}
                                </span>
                                <span class="bg-c3/20 text-c3 px-3 py-1.5 rounded inline-flex items-center">
                                    <i class="fa fa-book text-xs mr-1 text-c3"></i>
                                    ${course.levelOption || 'N/A'}
                                </span>
                                <span class="bg-c2/20 text-c2 px-3 py-1.5 rounded inline-flex items-center">
                                    <i class="fa fa-language text-xs mr-1 text-c2"></i>
                                    ${course.languageOption || 'N/A'}
                                </span>
                                <span class="bg-muted/20 text-muted px-3 py-1.5 rounded inline-flex items-center">
                                    <i class="far fa-calendar mr-1.5"></i> Created: ${formatDate(course.createdAt)}
                                </span>
                            </div>

                            <div class="prose prose-invert max-w-none mb-8">
                                <h3 class="text-xl font-semibold text-text mb-2">Course Description</h3>
                                <p class="text-text/80">${course.description || 'No description available'}</p>
                            </div>

                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-300">Progress</span>
                                    <span class="text-white font-medium">${Math.round(course.progress)}%</span>
                                </div>
                                <div class="w-full bg-line/50 h-2.5 rounded-full">
                                    <div class="h-full bg-c1 rounded-full" style="width: ${course.progress}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 md:p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-semibold text-text">Course Modules</h3>
                            <span class="text-sm text-muted">${window.modulesData?.length || 0} modules</span>
                        </div>
                        
                        <ol id="modulesContainer" class="grid gap-4 sm:grid-cols-1 list-none p-0 m-0">
                            ${window.modulesData?.length > 0 
                                ? window.modulesData.map((module, index) => `
                                    <li class="group ${module.isCompleted ? 'bg-c5/10' : 'bg-muted/5'} border border-line/50 rounded-xl p-5 transition-all ${module.isCompleted ? 'hover:border-c5/50' : 'hover:border-c1/50'} hover:shadow-sm flex items-start gap-5">
                                        <div class="flex-shrink-0 w-12 h-12 rounded-xl ${module.isCompleted ? 'bg-c5/5 text-c5' : 'bg-c1/5 text-c1'} flex items-center justify-center text-xl font-semibold">
                                            ${module.isCompleted ? '<i class="fas fa-check"></i>' : index + 1}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center justify-start gap-4">
                                                <h4 class="font-semibold text-text">${module.moduleName || 'Untitled Module'}</h4>
                                                <span class="text-xs text-muted whitespace-nowrap">
                                                    <i class="far fa-clock mr-1"></i>${Math.ceil(module.contentText?.length / 1000) || 5} min
                                                </span>
                                            </div>
                                            ${module.description ? `
                                                <p class="text-sm text-text/70 leading-relaxed">
                                                    ${module.description}
                                                </p>
                                            ` : ''}
                                            <div class="pt-2">
                                                <button onclick="window.router.showModule('${module.id}', '${courseId}')" class="inline-flex items-center text-sm font-medium ${module.isCompleted ? 'text-c5 hover:text-c5/80' : 'text-c1 hover:text-c1/80'} transition-colors duration-200">
                                                    ${module.isCompleted ? 'Review' : 'Continue'}
                                                    <i class="fas fa-${module.isCompleted ? 'redo' : 'arrow-right'} ml-2 text-sm"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                `).join('')
                                : `
                                    <li class="text-center py-12 border-2 border-dashed border-line/50 rounded-xl">
                                        <i class="fas fa-book-open text-4xl text-muted mb-3"></i>
                                        <p class="text-muted max-w-md mx-auto">This course doesn't have any modules yet.</p>
                                    </li>
                                `
                            }
                        </ol>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 30);
        
        return true;
    } catch (error) {
        console.error('Error in openCourse:', error);
        courseView.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-3xl text-yellow-500 mb-2"></i>
                    <p class="text-muted">Failed to load course. Please try again.</p>
                    <button onclick="window.location.reload()" class="mt-4 text-c1 hover:underline">
                        <i class="fas fa-sync-alt mr-2"></i> Retry
                    </button>
                </div>
            </div>
        `;
        return false;
    } finally {
        window.loadingCourse = null;
        if (window.loading) window.loading.hide();
    }
};

window.loadModules = async (courseId) => {
    try {
        window.modulesData = await window.apiService.getModules(window.userId, courseId);
    } catch (error) {
        console.error('Error loading modules:', error);
        window.modulesData = [];
    }
};

window.backToCourseGrid = () => {
    if (window.router?.isLoading) return;
    
    // Reset loading state
    window.loadingCourse = null;
    
    // Navigate back to learn view
    window.history.pushState({}, '', '#');
    window.router?.showLearn?.();
    
    // Scroll to top for better UX
    window.scrollTo(0, 0);
};