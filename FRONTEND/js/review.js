window.loadDueQuestions = async () => {
    try {
        const userData = await window.apiService.getUser(window.userId);
        console.log(userData, userData.questionsLearned)
        window.questionsLearned = userData.questionsLearned || 0;
        window.questionsData = await window.apiService.getDueQuestions(window.userId);
        renderSrs();
    } catch (error) {
        console.error('Error loading questions:', error);
        window.questionsData = [];
        renderSrs();
    }
};

const updateSrsProgress = async (root) => {
    const total = Array.isArray(window.questionsData) ? window.questionsData.length : 0;
    const current = Math.min((window.currentQuestionIndex || 0), total);
    const pct = total ? Math.round((current / total) * 100) : 0;
    const textEl = root.querySelector('#srsProgressText');
    const pctEl = root.querySelector('#srsProgressPercent');
    const barEl = root.querySelector('#srsProgressBar');
    const dueEl = root.querySelector('#srsDueCount');
    const reviewedEl = root.querySelector('#srsReviewedCount');
    const totalEl = root.querySelector('#srsTotalCount');
    if (textEl) textEl.textContent = `${Math.min(current + 1, total)}/${total}`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;
    if (dueEl) dueEl.textContent = String(total);
    if (reviewedEl) reviewedEl.textContent = String(current);
    if (totalEl) totalEl.textContent = String(window.questionsLearned ?? 0);
};

const renderSrsCurrent = (root, container, emptyMsg) => {
    if (!Array.isArray(window.questionsData) || window.questionsData.length === 0) {
        emptyMsg.classList.remove('hidden');
        emptyMsg.classList.add('flex');
        return;
    }
    updateSrsProgress(root);
    if (window.currentQuestionIndex >= window.questionsData.length) {
        emptyMsg.classList.remove('hidden');
        emptyMsg.classList.add('flex');
        return;
    }
    const q = window.questionsData[window.currentQuestionIndex];
    window.mountQuestion(container, q, async () => {
        window.currentQuestionIndex += 1;
        renderSrsCurrent(root, container, emptyMsg);
    });
};

const renderSrs = () => {
    const questionContainer = document.getElementById('questionContainer');
    if (!questionContainer) return;

    questionContainer.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div class="bg-panel/60 border border-line/50 rounded-lg p-6 flex flex-col items-center justify-center gap-1">
                <h2 class="text-2xl font-bold text-text" id="srsDueCount">0</h2>
                <p class="text-sm text-muted">Cards Due</p>
            </div>
            <div class="bg-panel/60 border border-line/50 rounded-lg p-6 flex flex-col items-center justify-center gap-1">
                <h2 class="text-2xl font-bold text-text" id="srsReviewedCount">0</h2>
                <p class="text-sm text-muted">Cards Reviewed</p>
            </div>
            <div class="bg-panel/60 border border-line/50 rounded-lg p-6 flex flex-col items-center justify-center gap-1">
                <h2 class="text-2xl font-bold text-text" id="srsTotalCount">0</h2>
                <p class="text-sm text-muted">Total Cards</p>
            </div>
        </div>
        <div class="bg-panel/50 p-6 rounded-lg border border-line/50">
            <div class="mb-6">
                <div class="flex items-center justify-between text-sm text-muted mb-2">
                    <span id="srsProgressText">0/0</span>
                    <span id="srsProgressPercent">0%</span>
                </div>
                <div class="w-full h-2 bg-line/50 rounded">
                    <div id="srsProgressBar" class="h-2 bg-c1 rounded" style="width: 0%"></div>
                </div>
            </div>
            <div id="srsQuestionContainer"></div>
            <div id="srsEmpty" class="hidden items-center justify-center h-64">
                <div class="text-center">
                    <h2 class="text-2xl font-semibold text-text mb-2">All Reviews Completed</h2>
                    <p class="text-muted mb-4">You're up to date. Come back later for more reviews.</p>
                    <button onclick="router.navigateTo('learn')" class="px-4 py-2 bg-c1 hover:bg-c1/90 text-white rounded-lg font-medium transition-colors">Go to Learn</button>
                </div>
            </div>
        </div>
    `;

    window.currentQuestionIndex = 0;
    const container = questionContainer.querySelector('#srsQuestionContainer');
    const emptyMsg = questionContainer.querySelector('#srsEmpty');
    renderSrsCurrent(questionContainer, container, emptyMsg);
    // Initialize stats display
    updateSrsProgress(questionContainer);
};