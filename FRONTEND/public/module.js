window.loadQuestions = async (moduleId) => {
    try {
        window.questionsData = await window.apiService.getQuestions(window.userId, moduleId);
        window.questionsData.sort((a, b) => a.questionOrder - b.questionOrder);
    } catch (error) {
        console.error('Error loading questions:', error);
        window.questionsData = [];
    }
};

window.updateQuestionProgress = (root) => {
    const total = Array.isArray(window.questionsData) ? window.questionsData.length : 0;
    const current = Math.min((window.currentQuestionIndex || 0), total);
    const pct = total ? Math.round((current / total) * 100) : 0;
    const textEl = root.querySelector('#questionProgressText');
    const pctEl = root.querySelector('#questionProgressPercent');
    const barEl = root.querySelector('#questionProgressBar');
    if (textEl) textEl.textContent = `${Math.min(current + 1, total)}/${total}`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;
};

const renderCurrent = (moduleView, courseId, moduleId, container, emptyMsg) => {
    if (!Array.isArray(window.questionsData) || window.questionsData.length === 0) {
        emptyMsg.classList.remove('hidden');
        return;
    }
    window.updateQuestionProgress(moduleView);
    if(window.currentQuestionIndex >= window.questionsData.length) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <h2 class="text-2xl font-semibold text-text mb-2">Module Completed</h2>
                    <p class="text-muted">You have completed all the questions in this module.</p>
                </div>
            </div>
        `;
        return;
    }
    const q = window.questionsData[window.currentQuestionIndex];
    window.mountQuestion(container, q, async () => {
        if (window.currentQuestionIndex < window.questionsData.length) {
            await window.apiService.markQuestionAsLearned(window.userId, q.id)
            window.currentQuestionIndex += 1;
        }
        if (window.currentQuestionIndex == window.questionsData.length) {
            await window.apiService.markModuleAsCompleted(window.userId, courseId, moduleId)
            window.currentQuestionIndex += 1;
        }
        renderCurrent(moduleView, courseId, moduleId, container, emptyMsg);
    });
};

window.openModule = async (moduleId, courseId) => {

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp._seconds * 1000);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const moduleView = document.getElementById('moduleView');
    if (!moduleView) return false;

    try {
        if (window.loading) window.loading.show();
        const module = window.modulesData?.find(c => c.id === moduleId || c._id === moduleId);
        if (!module) return false;

        window.history.pushState({}, '', `#module/${moduleId}/${courseId}`);
        moduleView.innerHTML = '';

        await window.loadQuestions(moduleId);

        moduleView.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col md:flex-row justify-between items-center md:items-start md:py-8 md:pt-16 py-4 pt-8">
                    <div class="text-center md:text-left">
                        <h1 class="text-3xl font-bold text-white">Modules</h1>
                        <p class="text-muted">Study the module you created.</p>
                    </div>
                    <button onclick="window.router.showCourse('${courseId}')" class="flex items-center text-c1 hover:text-c1/80 mb-8 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i> Back to Course
                    </button>
                </div>
                <div class="bg-panel/60 border border-line/50 backdrop-blur-sm rounded-2xl overflow-hidden mb-8">
                    <div class="p-6 md:p-8 border-b border-line/50 flex flex-col lg:flex-row gap-8">
                        <div class="flex-1">
                            <h2 class="text-2xl md:text-3xl font-bold text-text mb-4">${module.moduleName || 'Module Title'}</h2>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-muted mb-6">
                                <span class="bg-muted/20 text-muted px-3 py-1.5 rounded inline-flex items-center">
                                    <i class="far fa-calendar mr-1.5"></i> Created: ${formatDate(module.createdAt)}
                                </span>
                                <span class="bg-muted/20 text-muted px-3 py-1.5 rounded inline-flex items-center">
                                    <i class="far fa-calendar mr-1.5"></i> Last updated: ${formatDate(module.updatedAt)}
                                </span>
                                <span class="${module.isCompleted ? 'bg-c1/20 text-c1' : 'bg-c4/20 text-c4'} px-3 py-1.5 rounded inline-flex items-center">
                                    <i class="fa ${module.isCompleted ? 'fa-check' : 'fa-times'} mr-1.5"></i> ${module.isCompleted ? 'Completed' : 'Not Completed'}
                                </span>
                            </div>

                            <div class="prose prose-invert max-w-none">
                                <h3 class="text-xl font-semibold text-text mb-2">Module Description</h3>
                                <p class="text-text/80">${module.description || 'No description available'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 px-2 sm:p-8 sm:px-8">
                        <h3 class="text-xl px-2 sm:px-0 font-semibold text-text mb-6">Module Content</h3>
                        <article class="prose prose-invert w-full min-w-full bg-bg/60 p-6 md:p-8 rounded-xl border border-line/50 shadow-sm leading-relaxed prose-headings:text-text prose-h1:text-3xl md:prose-h1:text-4xl prose-h2:text-2xl md:prose-h2:text-3xl prose-p:text-text/90 prose-a:text-c1 hover:prose-a:underline prose-strong:text-white prose-code:bg-panel/60 prose-code:text-text prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-ul:marker:text-c1 prose-ol:marker:text-c1 prose-img:rounded-lg whitespace-pre-line">
                            ${module.contentText ? module.contentText.replace(/\n/g, '\n') : '<p class="text-muted italic">No content available for this module.</p>'}
                        </article>
                        
                        <div class="mt-8">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-xl px-2 sm:px-0 font-semibold text-text">Quiz</h3>
                                <span class="text-sm bg-c1/20 text-c1 px-3 py-1 rounded-full">
                                    ${window.questionsData?.length || 0} ${window.questionsData?.length === 1 ? 'Question' : 'Questions'}
                                </span>
                            </div>
                            
                            <div class="bg-bg/60 p-6 rounded-lg border border-line/50">
                                <div class="mb-6">
                                    <div class="flex items-center justify-between text-sm text-muted mb-2">
                                        <span id="questionProgressText">0/0</span>
                                        <span id="questionProgressPercent">0%</span>
                                    </div>
                                    <div class="w-full h-2 bg-line/50 rounded">
                                        <div id="questionProgressBar" class="h-2 bg-c1 rounded" style="width: 0%"></div>
                                    </div>
                                </div>
                                <div id="singleQuestionContainer"></div>
                                <div id="singleQuestionEmpty" class="hidden text-muted text-center py-8">No quiz questions available for this module yet.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        window.currentQuestionIndex = 0;
        const container = moduleView.querySelector('#singleQuestionContainer');
        const emptyMsg = moduleView.querySelector('#singleQuestionEmpty');
        
        renderCurrent(moduleView, courseId, moduleId, container, emptyMsg);

        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 30);

    } catch (error) {
        console.error('Error opening module:', error);
        moduleView.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-3xl text-yellow-500 mb-2"></i>
                    <p class="text-muted">Failed to load module. Please try again.</p>
                    <button onclick="window.location.reload()" class="mt-4 text-c1 hover:underline">
                        <i class="fas fa-sync-alt mr-2"></i> Retry
                    </button>
                </div>
            </div>
        `;
        return false;
    } finally {
        if (window.loading) window.loading.hide();
    }
};