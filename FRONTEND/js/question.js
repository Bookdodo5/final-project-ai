window.renderQuestion = (q) => {
    const optionItem = (text, idx, active) => `
        <button type="button" data-action="select" data-index="${idx}" class="w-full text-left flex items-center gap-3 p-3 rounded-lg border ${active ? 'border-c1/50 bg-c1/5' : 'border-line/50 hover:border-c1/30'}">
            <span class="w-4 h-4 rounded-full border ${active ? 'border-c1 bg-c1' : 'border-line'} flex items-center justify-center">
                ${active ? '<span class="w-2 h-2 rounded-full bg-white block"></span>' : ''}
            </span>
            <span class="text-sm">${text}</span>
        </button>
    `;

    const tfOptions = ['True', 'False'];

    const rateStyles = {
        Again: 'bg-c4/25 border-c4/50 text-c4 hover:bg-c4/40',
        Hard: 'bg-c2/25 border-c2/50 text-c2 hover:bg-c2/40',
        Good: 'bg-c5/25 border-c5/50 text-c5 hover:bg-c5/40',
        Easy: 'bg-c1/25 border-c1/50 text-c1 hover:bg-c1/40',
        Known: 'bg-bg border-line/40 text-text hover:bg-bg/80',
    };

    const inputArea = (() => {
        if (q.type === 'mcq') {
            return `
            <div data-role="options" class="mt-3 space-y-2">
                ${Array.isArray(q.options) ? q.options.map((o, i) => optionItem(o, i, false)).join('') : '<p class="text-muted text-sm">No options</p>'}
            </div>
        `;
        }
        if (q.type === 'true-false') {
            return `
            <div data-role="options" class="mt-3 space-y-2">
                ${tfOptions.map((o, i) => optionItem(o, i, false)).join('')}
            </div>
        `;
        }
        return `
        <div class="mt-3">
            <textarea data-role="open" class="w-full bg-panel border border-line/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-c1 focus:border-c1/50 min-h-24 resize-none"></textarea>
        </div>
    `;
    })();

    return `
            <div class="flex-1 gap-3">
                <div class="flex flex-col gap-2 md:flex-row items-center justify-between">
                    <p class="font-medium text-text w-full">${q.questionText || q.question || 'Question'}</p>
                    <div class="flex items-center gap-1">${Array.from({ length: 5 }, (_, i) => `<i class="${(Number(q.star) || 0) > i ? 'fas text-yellow-400' : 'far text-muted'} fa-star text-xs mr-1"></i>`).join('')}</div>
                </div>
                ${inputArea}
                <button type="button" data-action="submit" class="px-4 py-2 mt-4 bg-c1 hover:bg-c1/90 text-white rounded-lg font-medium transition-colors">Submit</button>
                <div data-role="feedback" class="hidden mt-4 rounded-lg border border-line/50 p-3bg-panel/50"></div>
                <div data-role="rating" class="hidden mt-4 grid-cols-5 gap-2">
                    ${['Again', 'Hard', 'Good', 'Easy', 'Known'].map(r => `
                        <button type="button" data-action="rate" data-rating="${r}" class="px-3 py-2 rounded-lg border ${rateStyles[r]} text-sm">${r}</button>
                    `).join('')}
                </div>
            </div>
    `;
};

window.mountQuestion = (containerEl, q, onComplete) => {
    let selectedIndex = null;
    let submitted = false;
    let isSubmitting = false;
    let hasRated = false;
    let isRating = false;

    const render = () => {
        containerEl.innerHTML = window.renderQuestion(q);
    };

    const setSelected = (idx) => {
        selectedIndex = idx;
        const options = containerEl.querySelectorAll('[data-role="options"] [data-action="select"]');
        options.forEach((btn, i) => {
            const active = i === selectedIndex;
            btn.className = `w-full text-left flex items-center gap-3 p-3 rounded-lg border ${active ? 'border-c1/50 bg-c1/5' : 'border-line/50 hover:border-c1/30'}`;
            const dot = btn.querySelector('span > span');
            if (active) {
                btn.children[0].className = 'w-4 h-4 rounded-full border border-c1 bg-c1 flex items-center justify-center';
                if (!dot) btn.children[0].innerHTML = '<span class="w-2 h-2 rounded-full bg-white block"></span>';
            } else {
                btn.children[0].className = 'w-4 h-4 rounded-full border border-line flex items-center justify-center';
                btn.children[0].innerHTML = '';
            }
        });
    };

    const showFeedback = (ok, text, correct) => {
        const box = containerEl.querySelector('[data-role="feedback"]');
        box.classList.remove('hidden');
        box.innerHTML = `
        <div class="flex items-start gap-3 p-4">
            <div class="w-5 h-5 rounded-full ${ok ? 'bg-c1' : 'bg-c4'} flex-shrink-0 mt-0.5"></div>
            <div class="flex-1">
                <p class="${ok ? 'text-c1' : 'text-c4'} font-medium">${ok ? 'Correct' : 'Incorrect'}</p>
                <p class="text-sm text-text/80 mt-1">${text || ''}</p>
                ${correct !== undefined ? `<p class="text-sm text-muted mt-2">Answer: <span class="text-text">${Array.isArray(correct) ? correct.join(', ') : correct}</span></p>` : ''}
            </div>
        </div>`;
    };

    const enableRating = () => {
        const rating = containerEl.querySelector('[data-role="rating"]');
        rating.classList.remove('hidden');
        rating.classList.add('grid');
        const rateBtns = containerEl.querySelectorAll('[data-action="rate"]');
        rateBtns.forEach(b => {
            b.disabled = false;
            b.classList.remove('opacity-50', 'pointer-events-none');
        });
    };

    const getAnswerPayload = () => {
        if (q.type === 'mcq') {
            if (selectedIndex == null) return null;
            return Array.isArray(q.options) ? String(q.options[selectedIndex]) : null;
        }
        if (q.type === 'true-false') {
            if (selectedIndex == null) return null;
            return selectedIndex === 0 ? 'True' : 'False';
        }
        const ta = containerEl.querySelector('[data-role="open"]');
        return ta ? ta.value.trim() : '';
    };

    const onSubmit = async () => {
        if (submitted || isSubmitting) return;
        const answer = getAnswerPayload();
        if (!answer) return;
        const submitBtn = containerEl.querySelector('[data-action="submit"]');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'pointer-events-none');
        isSubmitting = true;

        try {
            const res = await window.apiService.submitAnswer(window.userId, q.id, answer);
            await window.apiService.updateQuestionStat(
                window.userId,
                res.isCorrect,
                window.location.hash.substring(1).startsWith('review')
            );
            submitted = true;
            showFeedback(Boolean(res?.isCorrect), res?.feedback, res?.correctAnswer);
            enableRating();
        } catch (e) {
            submitted = false;
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'pointer-events-none');
        } finally {
            isSubmitting = false;
        }
    };

    const onRate = async (rating) => {
        if (!submitted || hasRated || isRating) return;
        isRating = true;
        const rateBtns = containerEl.querySelectorAll('[data-action="rate"]');
        rateBtns.forEach(b => {
            b.disabled = true;
            b.classList.add('opacity-50', 'pointer-events-none');
        });
        try {
            await window.apiService.rateQuestion(window.userId, q.id, rating);
            hasRated = true;
            if (typeof onComplete === 'function') await onComplete();
        } catch (e) {
            isRating = false;
            rateBtns.forEach(b => {
                b.disabled = false;
                b.classList.remove('opacity-50', 'pointer-events-none');
            });
        }
    };

    render();

    containerEl.addEventListener('click', (ev) => {
        const t = ev.target.closest('[data-action]');
        if (!t) return;
        const action = t.getAttribute('data-action');
        if (action === 'select') {
            const idx = Number(t.getAttribute('data-index'));
            setSelected(idx);
        } else if (action === 'submit') {
            onSubmit();
        } else if (action === 'rate') {
            const rating = t.getAttribute('data-rating');
            onRate(rating);
        }
    });
};