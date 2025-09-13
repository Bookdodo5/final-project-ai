window.renderQuestion = (q) => {
    const optionItem = (text, idx) => `
        <button type="button" data-action="select" data-index="${idx}" class="cursor-glow magnetic w-full text-left flex items-center gap-2 p-2 mx-1 rounded-lg border transition-all duration-300 ease-in-out hover:shadow-sm border-line/50 hover:border-c1/30 bg-panel/50 hover:bg-c1/5}">
            <span class="w-3 h-3 rounded-full border transition-all duration-300 ease-in-out border-line flex items-center justify-center flex-shrink-0"></span>
            <span class="text-sm transition-colors duration-200">${text}</span>
        </button>
    `;

    const tfOptions = ['True', 'False'];

    const rateStyles = {
        Again: 'bg-c4/25 border-c4/50 text-c4 hover:bg-c4/40 hover:shadow-md transition-all duration-300',
        Hard: 'bg-c2/25 border-c2/50 text-c2 hover:bg-c2/40 hover:shadow-md transition-all duration-300',
        Good: 'bg-c5/25 border-c5/50 text-c5 hover:bg-c5/40 hover:shadow-md transition-all duration-300',
        Easy: 'bg-c1/25 border-c1/50 text-c1 hover:bg-c1/40 hover:shadow-md transition-all duration-300',
        Known: 'bg-bg border-line/40 text-text hover:bg-bg/80 hover:shadow-md transition-all duration-300',
    };

    const inputArea = (() => {
        if (q.type === 'mcq') {
            return `
            <div data-role="options" class="mt-3 space-y-2 px-2 animate-fadeIn">
                ${Array.isArray(q.options) ? q.options.map((o, i) => optionItem(o, i)).join('') : '<p class="text-muted text-sm">No options</p>'}
            </div>
        `;
        }
        if (q.type === 'true-false') {
            return `
            <div data-role="options" class="mt-3 space-y-2 px-2 animate-fadeIn">
                ${tfOptions.map((o, i) => optionItem(o, i)).join('')}
            </div>
        `;
        }
        return `
        <div class="mt-3 px-2 animate-fadeIn">
            <textarea data-role="open" class="w-full bg-bg border border-line/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:border-c1/50 min-h-24 resize-none transition-all duration-300 ease-in-out hover:border-c1/30 hover:shadow-sm focus:shadow-md magnetic focus:bg-bg/80 placeholder-muted/50" placeholder="Type your answer here..."></textarea>
            <div data-role="error" class="hidden mt-2 text-c4 text-sm">Please enter your answer</div>
        </div>
    `;
    })();

    return `
            <div class="flex-1 gap-3 animate-slideUp particle-container px-2">
                <div class="flex flex-col gap-2 md:flex-row items-center justify-between">
                    <p class="font-medium text-text w-full transition-colors duration-200">${q.questionText || q.question || 'Question'}</p>
                    <div class="flex items-center gap-1">${Array.from({ length: 5 }, (_, i) => `<i class="${(Number(q.star) || 0) > i ? 'fas text-yellow-400' : 'far text-muted'} fa-star text-xs mr-1 transition-all duration-200"></i>`).join('')}</div>
                </div>
                ${inputArea}
                <button type="button" data-action="submit" class="px-4 py-2 mt-4 mx-2 bg-c1 hover:bg-c1/90 text-white rounded-lg font-medium transition-all duration-300 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-c1/50 ripple-effect magnetic">Submit</button>
                <div data-role="feedback" class="hidden mt-4 mx-2 rounded-lg border border-line/50 p-3 bg-panel/50 transition-all duration-500 ease-in-out animate-fadeIn"></div>
                <div data-role="rating" class="hidden mt-4 grid-cols-5 gap-2 px-2 animate-slideUp">
                    ${['Again', 'Hard', 'Good', 'Easy', 'Known'].map(r => `
                        <button type="button" data-action="rate" data-rating="${r}" class="px-3 py-2 rounded-lg border ${rateStyles[r]} text-sm cursor-glow magnetic ripple-effect">${r}</button>
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

    // Cursor tracking for glow effects
    const handleMouseMove = (e) => {
        const glowElements = containerEl.querySelectorAll('.cursor-glow');
        glowElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            console.log(element.innerHTML, x, y);
            
            element.style.setProperty('--mouse-x', `${x}%`);
            element.style.setProperty('--mouse-y', `${y}%`);
        });
    };

    // Add mouse tracking to container
    containerEl.addEventListener('mousemove', handleMouseMove);

    const setSelected = (idx) => {
        selectedIndex = idx;
        const options = containerEl.querySelectorAll('[data-role="options"] [data-action="select"]');
        options.forEach((btn, i) => {
            const active = i === selectedIndex;
            btn.classList.toggle('border-c1/50', active);
            btn.classList.toggle('bg-c1/5', active);
            btn.classList.toggle('border-line/50', !active);
            
            const dot = btn.children[0];
            dot.classList.toggle('border-c1', active);
            dot.classList.toggle('bg-c1', active);
            dot.classList.toggle('shadow-sm', active);
            dot.classList.toggle('border-line', !active);
            
            if (active && !btn.querySelector('span > span')) {
                dot.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white block animate-pulse"></span>';
            } else if (!active) {
                dot.innerHTML = '';
            }
        });
    };

    const showFeedback = (ok, text, correct) => {
        const box = containerEl.querySelector('[data-role="feedback"]');
        box.classList.remove('hidden');
        box.innerHTML = `
        <div class="flex items-start gap-3 p-4">
            <div class="w-5 h-5 rounded-full ${ok ? 'bg-c1' : 'bg-c4'} flex-shrink-0 mt-0.5 transition-all duration-300"></div>
            <div class="flex-1">
                <p class="${ok ? 'text-c1' : 'text-c4'} font-medium transition-colors duration-200">${ok ? 'Correct' : 'Incorrect'}</p>
                <p class="text-sm text-text/80 mt-1 transition-colors duration-200">${text || ''}</p>
                ${correct !== undefined ? `<p class="text-sm text-muted mt-2 transition-colors duration-200">Answer: <span class="text-text">${Array.isArray(correct) ? correct.join(', ') : correct}</span></p>` : ''}
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
        
        // Validation for open answer questions
        if (q.type === "open-ended") {
            const textarea = containerEl.querySelector('[data-role="open"]');
            const errorDiv = containerEl.querySelector('[data-role="error"]');
            
            if (!answer || answer.length === 0) {
                // Show red border and error message
                textarea.classList.add('border-c4', 'focus:border-c4', 'focus:ring-c4', 'hover:border-c4');
                textarea.classList.remove('border-line/50', 'focus:border-c1/50', 'focus:ring-c1');
                errorDiv.classList.remove('hidden');
                return;
            } else {
                // Remove error styling if answer is provided
                textarea.classList.remove('border-c4', 'focus:border-c4', 'focus:ring-c4', 'hover:border-c4');
                textarea.classList.add('border-line/50', 'focus:border-c1/50', 'focus:ring-c1', 'hover:border-c1');
                errorDiv.classList.add('hidden');
            }
        }
        
        // Original validation for MCQ and True/False
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