// Render quiz questions with immediate feedback
function renderQuiz(quizData, container, resultsContainer) {
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let confidenceLevels = [];
    let questionFeedbacks = [];
    
    function showQuestion(index) {
        const question = quizData[index];
        if (!question) return;

        container.innerHTML = `
            <div class="quiz-question">
                <div class="question-header">
                    <h4>Question ${index + 1} of ${quizData.length}</h4>
                    <span class="question-type ${question.type}">${question.type === 'multiple_choice' ? 'Multiple Choice' : 'Open Answer'}</span>
                </div>
                <p class="question-text">${question.question}</p>
                
                ${question.type === 'multiple_choice' ? `
                    <div class="quiz-options">
                        ${question.options.map((option, i) => `
                            <div class="quiz-option" data-option="${i}">
                                <input type="radio" id="option${i}" name="question${index}" value="${i}">
                                <label for="option${i}">${option}</label>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="open-answer-section">
                        <textarea class="open-answer-input" id="openAnswer${index}" 
                                  placeholder="Type your detailed answer here..." rows="6"></textarea>
                        ${question.sampleAnswer ? `
                            <div class="sample-answer" style="display: none;">
                                <h5>Sample Answer:</h5>
                                <p>${question.sampleAnswer}</p>
                            </div>
                            <button type="button" class="show-sample-btn" onclick="toggleSampleAnswer(${index})">
                                <i class="fas fa-lightbulb"></i> Show Sample Answer
                            </button>
                        ` : ''}
                    </div>
                `}
                
                <!-- Confidence Level Selection -->
                <div class="confidence-section">
                    <h5><i class="fas fa-chart-line"></i> How confident are you in your answer?</h5>
                    <div class="confidence-levels">
                        <label class="confidence-option" data-level="1">
                            <input type="radio" name="confidence${index}" value="1">
                            <span class="confidence-label">
                                <i class="fas fa-frown"></i>
                                <span>Not confident</span>
                            </span>
                        </label>
                        <label class="confidence-option" data-level="2">
                            <input type="radio" name="confidence${index}" value="2">
                            <span class="confidence-label">
                                <i class="fas fa-meh"></i>
                                <span>Somewhat confident</span>
                            </span>
                        </label>
                        <label class="confidence-option" data-level="3">
                            <input type="radio" name="confidence${index}" value="3">
                            <span class="confidence-label">
                                <i class="fas fa-smile"></i>
                                <span>Confident</span>
                            </span>
                        </label>
                        <label class="confidence-option" data-level="4">
                            <input type="radio" name="confidence${index}" value="4">
                            <span class="confidence-label">
                                <i class="fas fa-grin-stars"></i>
                                <span>Very confident</span>
                            </span>
                        </label>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="question-submit-section">
                    <button class="submit-answer-btn" onclick="submitCurrentAnswer(${index})" disabled>
                        <i class="fas fa-paper-plane"></i>
                        Submit Answer
                    </button>
                </div>

                <!-- Feedback Section (initially hidden) -->
                <div class="answer-feedback" id="feedback${index}" style="display: none;">
                    <!-- Feedback will be populated after submission -->
                </div>

                <!-- Navigation -->
                <div class="quiz-navigation">
                    ${index > 0 ? `<button class="quiz-prev" onclick="showPreviousQuestion()"><i class="fas fa-arrow-left"></i> Previous</button>` : ''}
                    ${index < quizData.length - 1 ? 
                        `<button class="quiz-next" onclick="showNextQuestion()" disabled><i class="fas fa-arrow-right"></i> Next</button>` : 
                        `<button class="quiz-finish" onclick="finishQuiz()" disabled><i class="fas fa-flag-checkered"></i> Finish Quiz</button>`
                    }
                </div>
            </div>
        `;

        // Add event listeners
        setupQuestionEventListeners(index, question);
        
        // Restore previous answers if they exist
        restorePreviousAnswers(index, question);
    }

    function setupQuestionEventListeners(index, question) {
        // Answer selection listeners
        if (question.type === 'multiple_choice') {
            const options = container.querySelectorAll('.quiz-option');
            options.forEach(option => {
                option.addEventListener('click', function() {
                    // Remove selected class from all options
                    options.forEach(opt => opt.classList.remove('selected'));
                    // Add selected class to clicked option
                    this.classList.add('selected');
                    // Check the radio button
                    this.querySelector('input').checked = true;
                    checkSubmitReady(index);
                });
            });
        } else {
            const textarea = container.querySelector('.open-answer-input');
            textarea.addEventListener('input', () => checkSubmitReady(index));
        }

        // Confidence selection listeners
        const confidenceOptions = container.querySelectorAll('.confidence-option');
        confidenceOptions.forEach(option => {
            option.addEventListener('click', function() {
                confidenceOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                this.querySelector('input').checked = true;
                checkSubmitReady(index);
            });
        });
    }

    function checkSubmitReady(index) {
        const question = quizData[index];
        const hasAnswer = question.type === 'multiple_choice' 
            ? container.querySelector('input[type="radio"][name^="question"]:checked')
            : container.querySelector('.open-answer-input').value.trim().length > 0;
        
        const hasConfidence = container.querySelector('input[type="radio"][name^="confidence"]:checked');
        const submitBtn = container.querySelector('.submit-answer-btn');
        
        submitBtn.disabled = !(hasAnswer && hasConfidence);
        
        if (hasAnswer && hasConfidence) {
            submitBtn.classList.add('ready');
        } else {
            submitBtn.classList.remove('ready');
        }
    }

    // Global functions
    window.submitCurrentAnswer = async function(index) {
        const question = quizData[index];
        const submitBtn = container.querySelector('.submit-answer-btn');
        const feedbackDiv = container.querySelector(`#feedback${index}`);
        
        // Save current answer
        saveCurrentAnswer(index);
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Grading...';
        submitBtn.disabled = true;
        
        try {
            // Simulate AI grading (replace with actual API call)
            const feedback = await getMockAIFeedback(question, userAnswers[index], confidenceLevels[index]);
            questionFeedbacks[index] = feedback;
            
            // Show feedback
            displayAnswerFeedback(feedbackDiv, feedback, question, userAnswers[index]);
            
            // Update submit button
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Submitted';
            submitBtn.classList.add('submitted');
            submitBtn.disabled = true;
            
            // Enable navigation
            const nextBtn = container.querySelector('.quiz-next');
            const finishBtn = container.querySelector('.quiz-finish');
            if (nextBtn) nextBtn.disabled = false;
            if (finishBtn) finishBtn.disabled = false;
            
        } catch (error) {
            console.error('Error grading answer:', error);
            submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error - Try Again';
            submitBtn.disabled = false;
            submitBtn.classList.add('error');
        }
    };

    window.showNextQuestion = function() {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    };

    window.showPreviousQuestion = function() {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    };

    window.finishQuiz = function() {
        showFinalResults();
    };

    window.toggleSampleAnswer = function(index) {
        const sampleDiv = container.querySelector('.sample-answer');
        const button = container.querySelector('.show-sample-btn');
        
        if (sampleDiv.style.display === 'none') {
            sampleDiv.style.display = 'block';
            button.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Sample Answer';
        } else {
            sampleDiv.style.display = 'none';
            button.innerHTML = '<i class="fas fa-lightbulb"></i> Show Sample Answer';
        }
    };

    function saveCurrentAnswer(index) {
        const question = quizData[index];
        
        if (question.type === 'multiple_choice') {
            const selectedOption = container.querySelector('input[type="radio"][name^="question"]:checked');
            if (selectedOption) {
                userAnswers[index] = parseInt(selectedOption.value);
            }
        } else {
            const textarea = container.querySelector('.open-answer-input');
            if (textarea) {
                userAnswers[index] = textarea.value.trim();
            }
        }

        // Save confidence level
        const selectedConfidence = container.querySelector('input[type="radio"][name^="confidence"]:checked');
        if (selectedConfidence) {
            confidenceLevels[index] = parseInt(selectedConfidence.value);
        }
    }

    function restorePreviousAnswers(index, question) {
        if (userAnswers[index] !== undefined) {
            if (question.type === 'multiple_choice') {
                const option = container.querySelector(`[data-option="${userAnswers[index]}"]`);
                if (option) {
                    option.classList.add('selected');
                    option.querySelector('input').checked = true;
                }
            } else {
                const textarea = container.querySelector('.open-answer-input');
                if (textarea) {
                    textarea.value = userAnswers[index];
                }
            }
        }

        if (confidenceLevels[index] !== undefined) {
            const confidenceOption = container.querySelector(`[data-level="${confidenceLevels[index]}"]`);
            if (confidenceOption) {
                confidenceOption.classList.add('selected');
                confidenceOption.querySelector('input').checked = true;
            }
        }

        // Show previous feedback if exists
        if (questionFeedbacks[index]) {
            const feedbackDiv = container.querySelector(`#feedback${index}`);
            displayAnswerFeedback(feedbackDiv, questionFeedbacks[index], question, userAnswers[index]);
            
            const submitBtn = container.querySelector('.submit-answer-btn');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Submitted';
            submitBtn.classList.add('submitted');
            submitBtn.disabled = true;
            
            const nextBtn = container.querySelector('.quiz-next');
            const finishBtn = container.querySelector('.quiz-finish');
            if (nextBtn) nextBtn.disabled = false;
            if (finishBtn) finishBtn.disabled = false;
        }

        checkSubmitReady(index);
    }

    function displayAnswerFeedback(feedbackDiv, feedback, question, userAnswer) {
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = `
            <div class="feedback-content ${feedback.isCorrect ? 'correct' : 'incorrect'}">
                <div class="feedback-header">
                    <div class="feedback-status">
                        <i class="fas ${feedback.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <span>${feedback.isCorrect ? 'Correct!' : feedback.type === 'multiple_choice' ? 'Incorrect' : `AI Score: ${Math.round(feedback.score * 100)}%`}</span>
                    </div>
                    <div class="feedback-confidence">
                        Confidence: ${confidenceLevels[currentQuestionIndex]}/4
                    </div>
                </div>
                
                <div class="feedback-details">
                    <div class="your-answer">
                        <strong>Your Answer:</strong> 
                        ${question.type === 'multiple_choice' ? question.options[userAnswer] : userAnswer}
                    </div>
                    
                    ${question.type === 'multiple_choice' && !feedback.isCorrect ? `
                        <div class="correct-answer">
                            <strong>Correct Answer:</strong> ${question.options[question.correctAnswer]}
                        </div>
                    ` : ''}
                    
                    <div class="ai-feedback">
                        <strong>AI Feedback:</strong> ${feedback.feedback}
                    </div>
                    
                    ${feedback.suggestions ? `
                        <div class="ai-suggestions">
                            <strong>💡 Suggestions:</strong> ${feedback.suggestions}
                        </div>
                    ` : ''}
                </div>

                <!-- Difficulty Rating -->
                <div class="difficulty-rating">
                    <span>Rate after answer:</span>
                    <div class="rating-buttons">
                        <button class="rating-btn" data-rating="again">Again</button>
                        <button class="rating-btn" data-rating="hard">Hard</button>
                        <button class="rating-btn" data-rating="good">Good</button>
                        <button class="rating-btn" data-rating="easy">Easy</button>
                    </div>
                </div>
            </div>
        `;

        // Add rating button listeners
        const ratingButtons = feedbackDiv.querySelectorAll('.rating-btn');
        ratingButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                ratingButtons.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                
                // Store rating (for spaced repetition system)
                const rating = this.dataset.rating;
                console.log(`Question ${currentQuestionIndex + 1} rated as: ${rating}`);
            });
        });
    }

    async function getMockAIFeedback(question, userAnswer, confidence) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (question.type === 'multiple_choice') {
            const isCorrect = userAnswer === question.correctAnswer;
            
            // Enhanced feedback based on confidence and correctness
            const feedbackVariations = {
                correct: {
                    high: [
                        "Outstanding! Your high confidence was well-placed. You clearly understand this concept.",
                        "Excellent work! Your confidence reflects your solid grasp of the material.",
                        "Perfect! You demonstrated both knowledge and confidence - a winning combination."
                    ],
                    low: [
                        "Great job! Even though you weren't confident, you got it right. Trust your instincts more.",
                        "You're on the right track, but your confidence is lower than expected. Reflect on your thought process.",
                        "Well done! You knew more than you realized. Work on trusting your understanding."
                    ]
                },
                incorrect: {
                    high: [
                        "This was incorrect, but your confidence shows you're thinking actively. Let's clarify this concept.",
                        "Not quite right. Your confidence is good - now let's channel it toward the correct understanding.",
                        "Incorrect, but I appreciate your confidence. This is a common misconception worth addressing."
                    ],
                    low: [
                        "This wasn't correct, and your low confidence suggests you sensed something was off. Good intuition!",
                        "Incorrect, but your hesitation shows good self-awareness. Let's build your understanding.",
                        "You've identified some key ideas, but the explanation needs much more elaboration."
                    ]
                }
            };
            
            const confidenceLevel = confidence >= 3 ? 'high' : 'low';
            const feedbackType = isCorrect ? 'correct' : 'incorrect';
            const feedbacks = feedbackVariations[feedbackType][confidenceLevel];
            const selectedFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
            
            const suggestions = !isCorrect ? [
                "Review the key differences between the options and focus on the specific terminology.",
                "Try creating a concept map to visualize the relationships between these ideas.",
                "Practice with similar questions to reinforce your understanding of this topic.",
                "Consider the context clues in the question that point to the correct answer."
            ] : null;
            
            return {
                type: 'multiple_choice',
                isCorrect,
                score: isCorrect ? 1 : 0,
                feedback: selectedFeedback,
                suggestions: suggestions ? suggestions[Math.floor(Math.random() * suggestions.length)] : null
            };
        } else {
            // Enhanced open-ended question grading
            const keywords = question.expectedKeywords || [];
            const userAnswerLower = userAnswer.toLowerCase();
            const matchedKeywords = keywords.filter(keyword => 
                userAnswerLower.includes(keyword.toLowerCase())
            );
            
            // More sophisticated scoring
            let baseScore = Math.min(1, (matchedKeywords.length / Math.max(keywords.length, 1)));
            
            // Bonus for answer length and structure
            const wordCount = userAnswer.trim().split(/\s+/).length;
            const lengthBonus = Math.min(0.2, wordCount / 50);
            
            // Penalty for very short answers
            const lengthPenalty = wordCount < 10 ? 0.3 : 0;
            
            const finalScore = Math.max(0, Math.min(1, baseScore + lengthBonus - lengthPenalty));
            
            // Confidence-aware feedback
            const feedbackTemplates = {
                excellent: [
                    "Outstanding response! You've demonstrated comprehensive understanding with detailed explanations.",
                    "Exceptional work! Your answer shows deep insight and covers all key aspects thoroughly.",
                    "Brilliant! You've not only answered correctly but provided excellent supporting details."
                ],
                good: [
                    "Good answer! You've covered the main points well with solid understanding.",
                    "Well done! Your response shows good grasp of the concepts with clear explanations.",
                    "Nice work! You've addressed the key elements with appropriate detail."
                ],
                fair: [
                    "Your answer shows understanding but could be more comprehensive and detailed.",
                    "You're on the right track, but your response would benefit from more specific examples.",
                    "Good start! Try to expand your answer with more supporting details and explanations."
                ],
                poor: [
                    "This answer lacks clarity and detail. Focus on providing more specific information.",
                    "Your response is incomplete. Make sure to address all parts of the question.",
                    "You've identified some key ideas, but the explanation needs much more elaboration."
                ]
            };
            
            const suggestionTemplates = {
                keywords: [
                    `Try to include key terms like: ${keywords.slice(0, 3).join(', ')}`,
                    `Your answer would be stronger with specific terminology from the course material.`,
                    `Consider incorporating the technical vocabulary we've studied.`
                ],
                detail: [
                    "Provide more specific examples to support your main points.",
                    "Expand your explanation with additional details and reasoning.",
                    "Include more comprehensive analysis of the topic."
                ],
                structure: [
                    "Organize your response with clear introduction, body, and conclusion.",
                    "Use paragraph structure to separate different aspects of your answer.",
                    "Consider using bullet points or numbered lists for clarity."
                ]
            };
            
            let feedbackCategory, suggestions = [];
            
            if (finalScore >= 0.85) {
                feedbackCategory = 'excellent';
            } else if (finalScore >= 0.7) {
                feedbackCategory = 'good';
            } else if (finalScore >= 0.5) {
                feedbackCategory = 'fair';
                if (matchedKeywords.length < keywords.length * 0.7) {
                    suggestions.push(suggestionTemplates.keywords[Math.floor(Math.random() * suggestionTemplates.keywords.length)]);
                }
                if (wordCount < 30) {
                    suggestions.push(suggestionTemplates.detail[Math.floor(Math.random() * suggestionTemplates.detail.length)]);
                }
            } else {
                feedbackCategory = 'poor';
                suggestions.push(suggestionTemplates.keywords[Math.floor(Math.random() * suggestionTemplates.keywords.length)]);
                suggestions.push(suggestionTemplates.detail[Math.floor(Math.random() * suggestionTemplates.detail.length)]);
                if (wordCount < 20) {
                    suggestions.push(suggestionTemplates.structure[Math.floor(Math.random() * suggestionTemplates.structure.length)]);
                }
            }
            
            const selectedFeedback = feedbackTemplates[feedbackCategory][Math.floor(Math.random() * feedbackTemplates[feedbackCategory].length)];
            
            return {
                type: 'open_ended',
                isCorrect: finalScore >= 0.7,
                score: finalScore,
                feedback: selectedFeedback,
                suggestions: suggestions.length > 0 ? suggestions.join(' ') : null
            };
        }
    }

    function showFinalResults() {
        const totalQuestions = quizData.length;
        const correctAnswers = questionFeedbacks.filter(f => f && f.isCorrect).length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        const avgConfidence = confidenceLevels.reduce((a, b) => a + b, 0) / confidenceLevels.length;

        container.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        resultsContainer.innerHTML = `
            <div class="final-results">
                <div class="results-header">
                    <h3><i class="fas fa-trophy"></i> Quiz Complete!</h3>
                    <div class="overall-score">
                        <div class="score-circle">
                            <span class="score-number">${percentage}%</span>
                            <span class="score-text">${correctAnswers}/${totalQuestions}</span>
                        </div>
                    </div>
                </div>
                
                <div class="results-summary">
                    <div class="summary-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Average Confidence: ${avgConfidence.toFixed(1)}/4</span>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-clock"></i>
                        <span>Completed: ${new Date().toLocaleTimeString()}</span>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="retake-btn" onclick="retakeQuiz()">
                        <i class="fas fa-redo"></i> Retake Quiz
                    </button>
                    <button class="continue-btn" onclick="backToCourse()">
                        <i class="fas fa-book-open"></i> Continue Learning
                    </button>
                </div>
            </div>
        `;
    }

    window.retakeQuiz = function() {
        currentQuestionIndex = 0;
        userAnswers = [];
        confidenceLevels = [];
        questionFeedbacks = [];
        container.style.display = 'block';
        resultsContainer.style.display = 'none';
        showQuestion(0);
    };

    window.backToCourse = function() {
        const courseContent = document.querySelector('.course-content-section');
        if (courseContent) {
            courseContent.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Start quiz
    showQuestion(0);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('App starting...');
    
    // Initialize course data
    window.coursesData = [
        {
            title: "Accessible Auth Forms",
            description: "Build responsive login, Registration, and Forgot Password forms. Use proper labels, aria for errors, and keyboard navigation.",
            tags: ["Front-end", "Auth", "A11y"]
        },
        {
            title: "PDF Upload UX",
            description: "Drag-and-drop area with progress indicator; validate size/type; show file name and cancel option.",
            tags: ["Front-end", "Upload", "UX"]
        },
        {
            title: "JWT Basics",
            description: "Issue short-lived access tokens and refresh tokens. Store securely and validate on each protected endpoint.",
            tags: ["Back-end", "Auth", "JWT"]
        },
        {
            title: "Job Queues",
            description: "Offload heavy PDF parsing and AI generation to background workers to keep APIs responsive.",
            tags: ["Back-end", "Queues", "Scaling"]
        },
        {
            title: "RAG Chunking",
            description: "Split document text into semantic chunks; retrieve relevant pieces to reduce hallucination before generating answers.",
            tags: ["AI", "RAG", "Context"]
        },
        {
            title: "AI Grading Schema",
            description: "Design prompts that return JSON with grade, feedback, suggested improvements, and ideal answer for open-ended responses.",
            tags: ["AI", "Grading", "JSON"]
        }
    ];
    
    // Initialize components
    initializeNavigation();
    initializeNewCourseButton();
    initializeOverviewUpload();
    
    // Show the Learn page by default
    showLearnPage();
    
    // Set up the course grid
    const courseGrid = document.querySelector('.course-grid');
    if (courseGrid) {
        window.coursesData.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <div class="course-tags">
                    ${course.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            `;
            courseCard.addEventListener('click', () => openCourse(course.title, course.description, course.tags));
            courseGrid.appendChild(courseCard);
        });
    }
    
    // Set up back button
    setupBackButton();
    
    // Set up search functionality
    setupSearchFunctionality();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav links
            navLinks.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            const linkText = this.textContent.trim();
            
            // Hide all sections first
            hideAllSections();
            
            if (linkText === 'Overview') {
                showOverviewPage();
            } else if (linkText === 'Learn') {
                showLearnPage();
            } else if (linkText.includes('Review')) {
                showReviewPage();
            }
        });
    });
    
    // Back to Learn button functionality - Initialize immediately
    setupBackButton();
}

function setupBackButton() {
    const backToLearnBtn = document.getElementById('backToLearn');
    console.log('Looking for back button:', backToLearnBtn);
    
    if (backToLearnBtn) {
        // Remove all existing event listeners
        const newBtn = backToLearnBtn.cloneNode(true);
        backToLearnBtn.parentNode.replaceChild(newBtn, backToLearnBtn);
        
        // Add click handler
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button clicked!');
            
            // Hide course detail page
            document.getElementById('courseDetailPage').style.display = 'none';
            
            // Show learn page
            document.getElementById('learnPage').style.display = 'block';
            
            // Hide other pages
            const hero = document.querySelector('.hero');
            const overview = document.getElementById('overviewPage');
            if (hero) hero.style.display = 'none';
            if (overview) overview.style.display = 'none';
            
            // Update navigation
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.textContent.trim() === 'Learn') {
                    link.classList.add('active');
                }
            });
            
            // Reinitialize course functionality
            setTimeout(setupCourseCards, 100);
        });
        
        // Also add onclick as backup
        newBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button onclick triggered!');
            
            // Hide course detail page
            document.getElementById('courseDetailPage').style.display = 'none';
            
            // Show learn page
            document.getElementById('learnPage').style.display = 'block';
            
            // Hide other pages
            const hero = document.querySelector('.hero');
            const overview = document.getElementById('overviewPage');
            if (hero) hero.style.display = 'none';
            if (overview) overview.style.display = 'none';
            
            // Update navigation
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.textContent.trim() === 'Learn') {
                    link.classList.add('active');
                }
            });
            
            // Reinitialize course functionality
            setTimeout(setupCourseCards, 100);
        };
        
        console.log('Back button setup complete');
    } else {
        console.log('Back button not found');
    }
}

function hideAllSections() {
    const sections = [
        document.querySelector('.hero'),
        document.getElementById('learnPage'),
        document.getElementById('courseDetailPage'),
        document.getElementById('overviewPage')
    ];
    
    sections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

function showOverviewPage() {
    const overviewPage = document.getElementById('overviewPage');
    if (overviewPage) overviewPage.style.display = 'block';
}

function showReviewPage() {
    const learnPage = document.getElementById('learnPage');
    if (learnPage) {
        learnPage.style.display = 'block';
        
        // Create review content
        createReviewContent();
    }
}

function createReviewContent() {
    const learnPage = document.getElementById('learnPage');
    if (!learnPage) return;
    
    // Hide course grid and search
    const courseGrid = learnPage.querySelector('.course-grid');
    const searchContainer = learnPage.querySelector('.learn-search-container');
    const learnHeader = learnPage.querySelector('.learn-header');
    
    if (courseGrid) courseGrid.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    
    // Update header
    if (learnHeader) {
        const title = learnHeader.querySelector('.learn-title');
        const subtitle = learnHeader.querySelector('.learn-subtitle');
        const newCourseBtn = learnHeader.querySelector('.new-course-btn');
        
        if (title) title.textContent = 'Review (SRS)';
        if (subtitle) subtitle.textContent = 'Spaced repetition system for optimal learning retention.';
        if (newCourseBtn) newCourseBtn.style.display = 'none';
    }
    
    // Remove existing review content
    const existingReview = learnPage.querySelector('.review-content');
    if (existingReview) existingReview.remove();
    
    // Create review content
    const reviewContent = document.createElement('div');
    reviewContent.className = 'review-content';
    reviewContent.innerHTML = `
        <div class="review-stats">
            <div class="stat-card">
                <div class="stat-number">0</div>
                <div class="stat-label">Cards Due Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">0</div>
                <div class="stat-label">Cards Reviewed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">0</div>
                <div class="stat-label">Total Cards</div>
            </div>
        </div>
        
        <div class="review-main">
            <div class="review-card">
                <div class="review-card-content">
                    <h2>No cards due for review</h2>
                    <p>Complete some quizzes to generate review cards based on your performance.</p>
                    <div class="review-actions">
                        <button class="btn-primary" onclick="goToLearn()">
                            <i class="fas fa-book"></i>
                            Go to Learn
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="review-info">
            <h3>How Spaced Repetition Works</h3>
            <div class="info-grid">
                <div class="info-item">
                    <i class="fas fa-brain"></i>
                    <h4>Smart Scheduling</h4>
                    <p>Cards appear based on your performance and memory strength.</p>
                </div>
                <div class="info-item">
                    <i class="fas fa-chart-line"></i>
                    <h4>Adaptive Learning</h4>
                    <p>Difficult cards appear more frequently until mastered.</p>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <h4>Optimal Timing</h4>
                    <p>Review intervals increase as you demonstrate mastery.</p>
                </div>
            </div>
        </div>
    `;
    
    learnPage.appendChild(reviewContent);
}

function goToLearn() {
    // Reset learn page to normal state
    const learnPage = document.getElementById('learnPage');
    if (!learnPage) return;
    
    const courseGrid = learnPage.querySelector('.course-grid');
    const searchContainer = learnPage.querySelector('.learn-search-container');
    const learnHeader = learnPage.querySelector('.learn-header');
    const reviewContent = learnPage.querySelector('.review-content');
    
    // Show normal learn content
    if (courseGrid) courseGrid.style.display = 'grid';
    if (searchContainer) searchContainer.style.display = 'block';
    
    // Reset header
    if (learnHeader) {
        const title = learnHeader.querySelector('.learn-title');
        const subtitle = learnHeader.querySelector('.learn-subtitle');
        const newCourseBtn = learnHeader.querySelector('.new-course-btn');
        
        if (title) title.textContent = 'Learn';
        if (subtitle) subtitle.textContent = 'Mark lessons as done; filter with the search box above.';
        if (newCourseBtn) newCourseBtn.style.display = 'flex';
    }
    
    // Remove review content
    if (reviewContent) reviewContent.remove();
    
    // Update navigation
    updateNavigation('Learn');
    
    // Reinitialize course functionality
    setTimeout(() => {
        setupCourseCards();
        setupSearchFunctionality();
        renderDynamicCourses();
    }, 100);
}

function showLearnPage() {
    // Hide all sections first
    hideAllSections();
    
    const learnPage = document.getElementById('learnPage');
    if (learnPage) {
        // Show the learn page
        learnPage.style.display = 'block';
        
        // Update navigation
        updateNavigation('Learn');
        
        // Make sure the course grid is visible
        const courseGrid = learnPage.querySelector('.course-grid');
        if (courseGrid) {
            courseGrid.style.display = 'grid';
            
            // Clear existing cards to prevent duplicates
            courseGrid.innerHTML = '';
            
            // Add all courses to the grid
            if (window.coursesData && window.coursesData.length > 0) {
                window.coursesData.forEach(course => {
                    const courseCard = document.createElement('div');
                    courseCard.className = 'course-card';
                    courseCard.innerHTML = `
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description}</p>
                        <div class="course-tags">
                            ${course.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    `;
                    courseCard.addEventListener('click', () => openCourse(course.title, course.description, course.tags));
                    courseGrid.appendChild(courseCard);
                });
            } else {
                // Show message if no courses
                courseGrid.innerHTML = `
                    <div class="no-courses">
                        <i class="fas fa-book-open"></i>
                        <h3>No courses available</h3>
                        <p>Create a new course to get started</p>
                        <button class="new-course-btn">
                            <i class="fas fa-plus"></i> New Course
                        </button>
                    </div>
                `;
            }
        }
    }
}

function updateNavigation(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.textContent.trim() === activeSection || 
            (activeSection === 'Review' && link.textContent.includes('Review'))) {
            link.classList.add('active');
        }
    });
}

function setupCourseCards() {
    const courseCards = document.querySelectorAll('.course-card');
    console.log('Setting up', courseCards.length, 'course cards');
    
    courseCards.forEach((card, index) => {
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s ease';
        
        // Remove old listeners
        card.onclick = null;
        
        // Add new click handler
        card.onclick = function() {
            const title = this.querySelector('.course-title').textContent;
            const description = this.querySelector('.course-description').textContent;
            const tags = Array.from(this.querySelectorAll('.tag')).map(t => t.textContent);
            
            console.log('Clicked:', title);
            openCourse(title, description, tags);
        };
        
        // Hover effects
        card.onmouseenter = function() {
            this.style.transform = 'translateY(-3px)';
        };
        card.onmouseleave = function() {
            this.style.transform = 'translateY(0)';
        };
    });
}

function openCourse(title, description, tags) {
    console.log('Opening course:', title);
    
    // Hide all pages
    document.querySelector('.hero')?.setAttribute('style', 'display: none');
    document.getElementById('learnPage')?.setAttribute('style', 'display: none');
    document.getElementById('overviewPage')?.setAttribute('style', 'display: none');
    
    // Show course detail page
    const detailPage = document.getElementById('courseDetailPage');
    detailPage.style.display = 'block';
    
    // Set title
    const titleElement = document.getElementById('courseDetailTitle');
    if (titleElement) titleElement.textContent = title;
    
    // Set tags
    const tagsContainer = document.getElementById('courseDetailTags');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
    }
    
    // Set content
    const contentElement = document.getElementById('courseContent');
    if (contentElement) {
        contentElement.innerHTML = getCourseContent(title, description);
    }
    
    // Set quiz
    const quizContainer = document.getElementById('quizContainer');
    const quizResults = document.getElementById('quizResults');
    if (quizContainer && quizResults) {
        const quiz = getCourseQuiz(title);
        renderQuiz(quiz, quizContainer, quizResults);
    }
    
    // Setup back button immediately
    setupBackButton();
}

function getCourseContent(title, description) {
    return `
        <h1>${title}</h1>
        <p>${description}</p>
        
        <h2>Course Overview</h2>
        <p>This comprehensive course covers essential concepts and practical implementations.</p>
        
        <h2>Learning Objectives</h2>
        <ul>
            <li>Understand fundamental principles</li>
            <li>Learn industry best practices</li>
            <li>Gain hands-on experience</li>
            <li>Master real-world applications</li>
        </ul>
        
        <h2>Course Structure</h2>
        <h3>Module 1: Foundations</h3>
        <p>Introduction to core concepts and basic principles.</p>
        
        <h3>Module 2: Implementation</h3>
        <p>Hands-on practice with real-world examples.</p>
        
        <h3>Module 3: Advanced Topics</h3>
        <p>Deep dive into advanced concepts and optimization.</p>
        
        <h2>Prerequisites</h2>
        <p>Basic understanding of web development is recommended.</p>
    `;
}

function getCourseQuiz(title) {
    const quizzes = {
        "Accessible Auth Forms": [
            {
                question: "What is the most important attribute for form accessibility?",
                type: "multiple_choice",
                options: ["id attribute", "label attribute", "name attribute", "class attribute"],
                correctAnswer: 1
            },
            {
                question: "Explain how ARIA attributes improve form accessibility.",
                type: "open_ended",
                sampleAnswer: "ARIA attributes provide semantic information to assistive technologies like screen readers.",
                expectedKeywords: ["aria", "accessibility", "screen reader", "semantic"]
            }
        ],
        "PDF Upload UX": [
            {
                question: "What are key components of good file upload UX?",
                type: "multiple_choice",
                options: ["Only drag and drop", "Progress indicator, validation, and feedback", "Just file input", "Only validation"],
                correctAnswer: 1
            }
        ],
        "JWT Basics": [
            {
                question: "What does JWT stand for?",
                type: "multiple_choice",
                options: ["Java Web Token", "JSON Web Token", "JavaScript Web Token", "Just Web Token"],
                correctAnswer: 1
            }
        ],
        "Job Queues": [
            {
                question: "Why are job queues important?",
                type: "multiple_choice",
                options: ["Make apps slower", "Handle long tasks asynchronously", "Only for databases", "Replace databases"],
                correctAnswer: 1
            }
        ],
        "RAG Chunking": [
            {
                question: "What is chunking in RAG systems?",
                type: "multiple_choice",
                options: ["Make files smaller", "Break documents for better retrieval", "Compress files", "Encrypt data"],
                correctAnswer: 1
            }
        ],
        "AI Grading Schema": [
            {
                question: "What format should AI grading use?",
                type: "multiple_choice",
                options: ["Plain text", "JSON with grade and feedback", "XML format", "CSV format"],
                correctAnswer: 1
            }
        ]
    };
    
    return quizzes[title] || [
        {
            question: "What is the main focus of this course?",
            type: "multiple_choice",
            options: ["Basic concepts", "Advanced implementation", "Theory only", "Simple examples"],
            correctAnswer: 1
        }
    ];
}

function renderDynamicCourses() {
    if (!window.coursesData || window.coursesData.length === 0) return;
    
    const coursesContainer = document.querySelector('.course-grid');
    if (!coursesContainer) return;

    // Remove existing dynamic courses
    const existingDynamicCourses = coursesContainer.querySelectorAll('.course-card[data-dynamic="true"]');
    existingDynamicCourses.forEach(card => card.remove());

    // Add new dynamic courses
    window.coursesData.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.setAttribute('data-dynamic', 'true');
        courseCard.style.cursor = 'pointer';
        courseCard.style.transition = 'transform 0.2s ease';

        const courseHeader = document.createElement('div');
        courseHeader.className = 'course-header';

        const courseTitle = document.createElement('h3');
        courseTitle.className = 'course-title';
        courseTitle.textContent = course.title;

        const courseTags = document.createElement('div');
        courseTags.className = 'course-tags';

        course.tags.forEach(tag => {
            const courseTag = document.createElement('span');
            courseTag.className = 'tag';
            courseTag.textContent = tag;
            courseTags.appendChild(courseTag);
        });

        courseHeader.appendChild(courseTitle);
        courseHeader.appendChild(courseTags);

        const courseDescription = document.createElement('p');
        courseDescription.className = 'course-description';
        courseDescription.textContent = course.description;

        courseCard.appendChild(courseHeader);
        courseCard.appendChild(courseDescription);

        // Add click handler
        courseCard.onclick = function() {
            openCourse(course.title, course.description, course.tags);
        };

        // Add hover effects
        courseCard.onmouseenter = function() {
            this.style.transform = 'translateY(-3px)';
        };
        courseCard.onmouseleave = function() {
            this.style.transform = 'translateY(0)';
        };

        // Add dynamic courses at the beginning
        coursesContainer.insertBefore(courseCard, coursesContainer.firstChild);
    });
}

function setupSearchFunctionality() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    // Clear any existing event listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const courseCards = document.querySelectorAll('.course-card');
        let hasResults = false;
        
        courseCards.forEach(card => {
            const title = card.querySelector('.course-title')?.textContent?.toLowerCase() || '';
            const description = card.querySelector('.course-description')?.textContent?.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
            
            const matchesSearch = title.includes(searchTerm) || 
                                description.includes(searchTerm) || 
                                tags.some(tag => tag.includes(searchTerm));
            
            card.style.display = matchesSearch ? 'block' : 'none';
            if (matchesSearch) hasResults = true;
        });
        
        // Show/hide no results message
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.style.display = hasResults || !searchTerm ? 'none' : 'block';
        }
    });
    
    // Add clear button functionality if it exists
    const clearButton = document.querySelector('.search-clear');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            newSearchInput.value = '';
            newSearchInput.dispatchEvent(new Event('input'));
            newSearchInput.focus();
        });
    }
}

// New Course functionality
function initializeNewCourseButton() {
    const newCourseButton = document.querySelector('.new-course-btn');
    if (!newCourseButton) return;

    newCourseButton.addEventListener('click', function() {
        console.log('New Course button clicked');
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                console.log('PDF file selected:', file.name);
                uploadPDFAndGenerateCourse(file);
            } else {
                showNotification('Please select a PDF file', 'error');
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });
}

async function uploadPDFAndGenerateCourse(file) {
    try {
        showLoadingModal('Uploading PDF and generating course content...');
        console.log('Starting PDF upload for:', file.name);
        
        // Simulate API call - replace with actual backend integration
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newCourse = {
            id: Date.now(),
            title: file.name.replace('.pdf', ''),
            description: 'AI-generated course content from uploaded PDF',
            tags: ['AI-Generated', 'PDF'],
            content: `
# ${file.name.replace('.pdf', '')}

This course was automatically generated from your uploaded PDF document.

## Course Overview
The AI has analyzed your document and created this interactive learning experience.

## Key Learning Objectives
- Understand the fundamental principles from your document
- Learn best practices and industry standards
- Gain hands-on experience through practical examples
- Master the tools and techniques used in real-world scenarios

## Course Structure
This course is designed to take you from beginner to advanced level through structured learning modules.

### Module 1: Foundations
Introduction to core concepts and basic principles from your PDF.

### Module 2: Implementation
Hands-on practice with real-world examples based on your document.

### Module 3: Advanced Techniques
Deep dive into advanced topics and optimization strategies.

### Module 4: Best Practices
Industry standards and professional development practices.

## Prerequisites
Basic understanding of the subject matter is recommended but not required.

## What You'll Build
By the end of this course, you'll have mastered the concepts from your uploaded document.
            `,
            quiz: [
                {
                    question: "What is the main topic covered in this course?",
                    type: "multiple_choice",
                    options: [
                        "General knowledge",
                        "Content from the uploaded PDF",
                        "Random information",
                        "Basic concepts"
                    ],
                    correctAnswer: 1
                },
                {
                    question: "How was this course content generated?",
                    type: "multiple_choice",
                    options: [
                        "Manual creation",
                        "AI analysis of uploaded PDF",
                        "Template-based",
                        "Random generation"
                    ],
                    correctAnswer: 1
                }
            ],
            createdAt: new Date().toISOString()
        };
        
        // Add to courses data (create if doesn't exist)
        if (!window.coursesData) {
            window.coursesData = [];
        }
        window.coursesData.unshift(newCourse);
        
        hideLoadingModal();
        showNotification('Course created successfully!', 'success');
        
        // Show learn page and render new course
        showLearnPage();
        updateNavigation('Learn');
        
        // Open the new course after a short delay
        setTimeout(() => {
            openCourse(newCourse.title, newCourse.description, newCourse.tags);
        }, 1000);
        
    } catch (error) {
        console.error('Error generating course:', error);
        hideLoadingModal();
        showNotification('Failed to generate course. Please try again.', 'error');
    }
}

// UI Helper functions
function showLoadingModal(message) {
    let modal = document.getElementById('loadingModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loadingModal';
        modal.className = 'loading-modal';
        modal.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.loading-message').textContent = message;
    }
    modal.style.display = 'flex';
}

function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
