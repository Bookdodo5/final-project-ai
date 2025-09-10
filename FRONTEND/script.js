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
                        "Perfect! You've not only answered correctly but provided excellent supporting details."
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
    
    // Initialize course data with modules
    window.coursesData = [
        {
            id: "course-1",
            title: "Accessible Auth Forms",
            description: "Build responsive login, Registration, and Forgot Password forms. Use proper labels, aria for errors, and keyboard navigation.",
            tags: ["Front-end", "Auth", "A11y"],
            modules: [
                {
                    id: "module-1-1",
                    title: "Form Structure & Semantics",
                    description: "Learn proper HTML structure and semantic elements for accessible forms.",
                    lessons: ["HTML5 form elements", "Semantic markup", "Form validation"],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: 'Which HTML5 input type is best for email addresses?',
                            options: ['text', 'email', 'string', 'mail'],
                            correctAnswer: 1
                        },
                        {
                            type: 'open_ended',
                            question: 'Explain the importance of using proper labels in forms for accessibility.',
                            expectedKeywords: ['screen readers', 'accessibility', 'labels', 'assistive technology']
                        }
                    ]
                },
                {
                    id: "module-1-2",
                    title: "ARIA & Screen Readers",
                    description: "Implement ARIA attributes and ensure compatibility with screen readers.",
                    lessons: ["ARIA labels", "Screen reader testing", "Error announcements"],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: 'Which ARIA attribute is used to describe form errors?',
                            options: ['aria-label', 'aria-describedby', 'aria-error', 'aria-invalid'],
                            correctAnswer: 3
                        }
                    ]
                }
            ]
        },
        {
            id: "course-2",
            title: "PDF Upload UX",
            description: "Drag-and-drop area with progress indicator; validate size/type; show file name and cancel option.",
            tags: ["Front-end", "Upload", "UX"],
            modules: [
                {
                    id: "module-2-1",
                    title: "Drag & Drop Implementation",
                    description: "Create intuitive drag-and-drop interfaces for file uploads.",
                    lessons: ["HTML5 drag API", "Visual feedback", "File validation"],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: 'Which event is triggered when a file is dropped on a drop zone?',
                            options: ['dragenter', 'dragover', 'drop', 'dragleave'],
                            correctAnswer: 2
                        }
                    ]
                },
                {
                    id: "module-2-2",
                    title: "Progress Indicators",
                    description: "Implement upload progress tracking and user feedback.",
                    lessons: ["Progress bars", "Upload status", "Error handling"],
                    quizData: [
                        {
                            type: 'open_ended',
                            question: 'Describe best practices for showing upload progress to users.',
                            expectedKeywords: ['progress bar', 'percentage', 'feedback', 'cancellation']
                        }
                    ]
                }
            ]
        },
        {
            id: "course-3",
            title: "JWT Basics",
            description: "Issue short-lived access tokens and refresh tokens. Store securely and validate on each protected endpoint.",
            tags: ["Back-end", "Auth", "JWT"],
            modules: [
                {
                    id: "module-3-1",
                    title: "JWT Structure & Creation",
                    description: "Understand JWT components and how to create secure tokens.",
                    lessons: ["Header, Payload, Signature", "Token creation", "Signing algorithms"],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: 'How many parts does a JWT token have?',
                            options: ['2', '3', '4', '5'],
                            correctAnswer: 1
                        }
                    ]
                },
                {
                    id: "module-3-2",
                    title: "Token Security & Storage",
                    description: "Learn secure storage and validation practices for JWT tokens.",
                    lessons: ["Secure storage", "Token validation", "Refresh strategies"],
                    quizData: [
                        {
                            type: 'open_ended',
                            question: 'What are the security considerations when storing JWT tokens in the browser?',
                            expectedKeywords: ['XSS', 'localStorage', 'httpOnly', 'cookies', 'security']
                        }
                    ]
                }
            ]
        },
        {
            id: "course-4",
            title: "Job Queues",
            description: "Offload heavy PDF parsing and AI generation to background workers to keep APIs responsive.",
            tags: ["Back-end", "Queues", "Scaling"],
            modules: [
                {
                    id: "module-4-1",
                    title: "Queue Architecture",
                    description: "Design and implement job queue systems for background processing.",
                    lessons: ["Queue patterns", "Worker processes", "Job scheduling"],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: 'What is the main benefit of using job queues?',
                            options: ['Faster processing', 'Non-blocking operations', 'Better security', 'Smaller memory usage'],
                            correctAnswer: 1
                        }
                    ]
                }
            ]
        },
        {
            id: "course-5",
            title: "RAG Chunking",
            description: "Split document text into semantic chunks; retrieve relevant pieces to reduce hallucination before generating answers.",
            tags: ["AI", "RAG", "Context"],
            modules: [
                {
                    id: "module-5-1",
                    title: "Text Chunking Strategies",
                    description: "Learn different approaches to splitting documents into meaningful chunks.",
                    lessons: ["Semantic chunking", "Overlap strategies", "Chunk size optimization"],
                    quizData: [
                        {
                            type: 'open_ended',
                            question: 'Explain the trade-offs between different text chunking strategies in RAG systems.',
                            expectedKeywords: ['semantic', 'overlap', 'context', 'retrieval', 'accuracy']
                        }
                    ]
                }
            ]
        },
        {
            id: "course-6",
            title: "AI Grading Schema",
            description: "Design prompts that return JSON with grade, feedback, suggested improvements, and ideal answer for open-ended responses.",
            tags: ["AI", "Grading", "JSON"],
            modules: [
                {
                    id: "module-6-1",
                    title: "Prompt Engineering for Grading",
                    description: "Create effective prompts for AI-powered assessment systems.",
                    lessons: ["Structured prompts", "JSON schemas", "Grading criteria"],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: 'What format is best for structured AI responses?',
                            options: ['Plain text', 'JSON', 'XML', 'CSV'],
                            correctAnswer: 1
                        }
                    ]
                }
            ]
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
            
            // Restore Learn content sections
            const learnPageEl = document.getElementById('learnPage');
            if (learnPageEl) {
                const grid = learnPageEl.querySelector('.course-grid');
                const search = learnPageEl.querySelector('.learn-search-container');
                if (grid) {
                    grid.style.display = 'grid';
                    // Restore original course cards
                    grid.innerHTML = '';
                    // Recreate all course cards with proper click handlers
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
                        courseCard.onclick = function() {
                            console.log('Course card clicked:', course.title);
                            openCourse(course.title, course.description, course.tags);
                        };
                        courseCard.style.cursor = 'pointer';
                        courseCard.onmouseenter = function() {
                            this.style.transform = 'translateY(-3px)';
                        };
                        courseCard.onmouseleave = function() {
                            this.style.transform = 'translateY(0)';
                        };
                        grid.appendChild(courseCard);
                    });
                }
                if (search) search.style.display = 'block';
                // Scroll to the Learn header
                const learnHeader = learnPageEl.querySelector('.learn-header');
                if (learnHeader) learnHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

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
            
            // Remove the setTimeout delay that might cause issues
            console.log('Back button: course cards recreated, should be clickable now');
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
            
            // Restore Learn content sections
            const learnPageEl2 = document.getElementById('learnPage');
            if (learnPageEl2) {
                const grid2 = learnPageEl2.querySelector('.course-grid');
                const search2 = learnPageEl2.querySelector('.learn-search-container');
                if (grid2) {
                    grid2.style.display = 'grid';
                    // Restore original course cards
                    grid2.innerHTML = '';
                    // Recreate all course cards with proper click handlers
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
                        courseCard.onclick = function() {
                            console.log('Course card clicked (backup):', course.title);
                            openCourse(course.title, course.description, course.tags);
                        };
                        courseCard.style.cursor = 'pointer';
                        courseCard.onmouseenter = function() {
                            this.style.transform = 'translateY(-3px)';
                        };
                        courseCard.onmouseleave = function() {
                            this.style.transform = 'translateY(0)';
                        };
                        grid2.appendChild(courseCard);
                    });
                }
                if (search2) search2.style.display = 'block';
                const learnHeader2 = learnPageEl2.querySelector('.learn-header');
                if (learnHeader2) learnHeader2.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

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
            
            // Remove the setTimeout delay that might cause issues
            console.log('Back button (backup): course cards recreated, should be clickable now');
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
    // Hide all sections first
    hideAllSections();
    
    // Show both hero section and overview page
    const heroSection = document.querySelector('.hero');
    const overviewPage = document.getElementById('overviewPage');
    
    if (heroSection) heroSection.style.display = 'block';
    if (overviewPage) overviewPage.style.display = 'block';
    
    // Update navigation
    updateNavigation('Overview');
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
    
    const title = learnHeader.querySelector('.learn-title');
    const subtitle = learnHeader.querySelector('.learn-subtitle');
    const newCourseBtn = learnHeader.querySelector('.new-course-btn');
    
    if (title) title.textContent = 'Learn';
    if (subtitle) subtitle.textContent = 'Mark lessons as done; filter with the search box above.';
    if (newCourseBtn) newCourseBtn.style.display = 'flex';
    
    // Remove review content
    if (reviewContent) reviewContent.remove();
    
    // Clear and rebuild course grid to prevent duplicates
    if (courseGrid) {
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
        }
    }
    
    // Update navigation
    updateNavigation('Learn');
    
    // Reinitialize course functionality
    setTimeout(() => {
        setupCourseCards();
        setupSearchFunctionality();
    }, 100);
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
    
    // Find the course data
    const courseData = window.coursesData.find(course => course.title === title);
    
    // Show Learn page with header; hide hero and overview
    document.querySelector('.hero')?.setAttribute('style', 'display: none');
    document.getElementById('overviewPage')?.setAttribute('style', 'display: none');
    const learn = document.getElementById('learnPage');
    if (learn) {
        learn.style.display = 'block';
        // Keep search visible, don't hide the grid yet
    }
    
    // Create course detail content directly in the grid
    const learnPageSection = document.getElementById('learnPage');
    const courseGridEl = learnPageSection?.querySelector('.course-grid');
    
    if (courseGridEl) {
        console.log('Found grid, creating course detail content...');
        // Clear the grid and create course detail content
        courseGridEl.innerHTML = `
            <div class="course-detail-page" style="display: block;">
                <div class="course-detail-header">
                    <button class="back-btn" id="backToLearn">
                        <i class="fas fa-arrow-left"></i>
                        Back to Learn
                    </button>
                    <div class="course-detail-title-section">
                        <h2 class="course-detail-title">${title}</h2>
                        <div class="course-detail-tags">
                            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Course Overview Section -->
                <div class="course-overview-section">
                    <div class="course-description">${description}</div>
                    <div class="learning-objectives">
                        <h4><i class="fas fa-target"></i> Learning Objectives</h4>
                        <ul>
                            <li>Understand fundamental principles</li>
                            <li>Learn industry best practices</li>
                            <li>Gain hands-on experience</li>
                            <li>Master real-world applications</li>
                        </ul>
                    </div>
                </div>

                <!-- Modules Section -->
                <div class="modules-section">
                    <div class="modules-header">
                        <h3><i class="fas fa-layer-group"></i> Course Modules</h3>
                        <span class="modules-count">${courseData?.modules?.length || 3} modules</span>
                    </div>
                    <div class="modules-grid" id="modulesGrid">
                        ${generateModulesHTML(courseData)}
                    </div>
                </div>
            </div>
        `;
        
        courseGridEl.style.display = 'block';
        console.log('Course detail content created in grid');
        
        // Scroll to the course grid area
        courseGridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Setup module click handlers
        setupModuleClickHandlers(courseData);
        
        // Setup back button for the new content
        setupBackButton();
    } else {
        console.log('Could not find course grid');
    }
    
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

function generateModulesHTML(courseData) {
    if (courseData && courseData.modules) {
        return courseData.modules.map((module, index) => `
            <div class="module-card" data-module-id="${module.id}" data-course-title="${courseData.title}">
                <div class="module-header">
                    <div class="module-number">Module ${index + 1}</div>
                    <div class="module-status">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
                <h4 class="module-title">${module.title}</h4>
                <p class="module-description">${module.description}</p>
                <div class="module-lessons">
                    <i class="fas fa-list"></i>
                    <span>${module.lessons.length} lessons</span>
                </div>
                <div class="module-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">Not started</span>
                </div>
            </div>
        `).join('');
    } else {
        // Default modules if no course data
        return `
            <div class="module-card" data-module-id="default-1" data-course-title="${title}">
                <div class="module-header">
                    <div class="module-number">Module 1</div>
                    <div class="module-status">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
                <h4 class="module-title">Foundations</h4>
                <p class="module-description">Introduction to core concepts and basic principles.</p>
                <div class="module-lessons">
                    <i class="fas fa-list"></i>
                    <span>3 lessons</span>
                </div>
                <div class="module-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">Not started</span>
                </div>
            </div>
            <div class="module-card" data-module-id="default-2" data-course-title="${title}">
                <div class="module-header">
                    <div class="module-number">Module 2</div>
                    <div class="module-status">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
                <h4 class="module-title">Implementation</h4>
                <p class="module-description">Hands-on practice with real-world examples.</p>
                <div class="module-lessons">
                    <i class="fas fa-list"></i>
                    <span>4 lessons</span>
                </div>
                <div class="module-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">Not started</span>
                </div>
            </div>
            <div class="module-card" data-module-id="default-3" data-course-title="${title}">
                <div class="module-header">
                    <div class="module-number">Module 3</div>
                    <div class="module-status">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
                <h4 class="module-title">Advanced Topics</h4>
                <p class="module-description">Deep dive into advanced concepts and optimization.</p>
                <div class="module-lessons">
                    <i class="fas fa-list"></i>
                    <span>5 lessons</span>
                </div>
                <div class="module-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">Not started</span>
                </div>
            </div>
        `;
    }
}

function setupModuleClickHandlers(courseData) {
    const moduleCards = document.querySelectorAll('.module-card');
    
    moduleCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const moduleId = this.dataset.moduleId;
            const courseTitle = this.dataset.courseTitle;
            
            console.log('Module clicked:', moduleId, 'from course:', courseTitle);
            openModule(moduleId, courseTitle, courseData);
        });
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function openModule(moduleId, courseTitle, courseData) {
    console.log('Opening module:', moduleId);
    
    // Find the module data
    let moduleData = null;
    if (courseData && courseData.modules) {
        moduleData = courseData.modules.find(module => module.id === moduleId);
    }
    
    // If no specific module data, create default content
    if (!moduleData) {
        const moduleNumber = moduleId.includes('1') ? '1' : moduleId.includes('2') ? '2' : '3';
        const titles = { '1': 'Foundations', '2': 'Implementation', '3': 'Advanced Topics' };
        const descriptions = {
            '1': 'Introduction to core concepts and basic principles.',
            '2': 'Hands-on practice with real-world examples.',
            '3': 'Deep dive into advanced concepts and optimization.'
        };
        
        moduleData = {
            id: moduleId,
            title: titles[moduleNumber] || 'Module Content',
            description: descriptions[moduleNumber] || 'Learn essential concepts and skills.',
            lessons: ['Lesson 1', 'Lesson 2', 'Lesson 3'],
            quizData: [
                {
                    type: 'multiple_choice',
                    question: 'What is the main focus of this module?',
                    options: ['Basic concepts', 'Advanced implementation', 'Theory only', 'Simple examples'],
                    correctAnswer: 1
                }
            ]
        };
    }
    
    // Get the course grid and replace content with module detail
    const courseGridEl = document.querySelector('.course-grid');
    if (courseGridEl) {
        courseGridEl.innerHTML = `
            <div class="module-detail-page" style="display: block;">
                <div class="module-detail-header">
                    <button class="back-btn" id="backToCourse" data-course-title="${courseTitle}">
                        <i class="fas fa-arrow-left"></i>
                        Back to Course
                    </button>
                    <div class="module-detail-title-section">
                        <h2 class="module-detail-title">${moduleData.title}</h2>
                        <div class="module-detail-meta">
                            <span class="module-duration">~30 min</span>
                        </div>
                    </div>
                </div>

                <!-- Module Content Section -->
                <div class="module-content-section">
                    <div class="content-header">
                        <h3><i class="fas fa-book-open"></i> Module Content</h3>
                        <span class="content-status">AI Generated</span>
                    </div>
                    
                    <div class="module-theory">
                        <h4>Theory & Concepts</h4>
                        <div class="theory-content">
                            <p>${moduleData.description}</p>
                            <p>This module covers essential concepts that form the foundation of understanding. You'll learn through interactive content, practical examples, and hands-on exercises.</p>
                            
                            <h5>Key Topics Covered:</h5>
                            <ul>
                                ${moduleData.lessons.map(lesson => `<li>${lesson}</li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <div class="module-examples">
                        <h4><i class="fas fa-lightbulb"></i> Examples</h4>
                        <div class="examples-list">
                            <div class="example-item">
                                <h5>Practical Example 1</h5>
                                <p>Real-world application demonstrating the concepts in action.</p>
                            </div>
                            <div class="example-item">
                                <h5>Practical Example 2</h5>
                                <p>Step-by-step walkthrough of implementation details.</p>
                            </div>
                        </div>
                    </div>

                    <div class="module-key-points">
                        <h4><i class="fas fa-key"></i> Key Points</h4>
                        <div class="key-points-list">
                            <div class="key-point">
                                <i class="fas fa-check-circle"></i>
                                <span>Understanding fundamental principles is crucial for success</span>
                            </div>
                            <div class="key-point">
                                <i class="fas fa-check-circle"></i>
                                <span>Practical application reinforces theoretical knowledge</span>
                            </div>
                            <div class="key-point">
                                <i class="fas fa-check-circle"></i>
                                <span>Regular practice leads to mastery</span>
                            </div>
                        </div>
                    </div>

                    <div class="module-lessons">
                        <h4><i class="fas fa-list"></i> Lessons Covered</h4>
                        <div class="lessons-list">
                            ${moduleData.lessons.map((lesson, index) => `
                                <div class="lesson-item">
                                    <div class="lesson-number">${index + 1}</div>
                                    <div class="lesson-content">
                                        <h5>${lesson}</h5>
                                        <p>Comprehensive coverage of ${lesson.toLowerCase()} with practical examples.</p>
                                    </div>
                                    <div class="lesson-status">
                                        <i class="fas fa-play-circle"></i>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Quiz Section -->
                <div class="quiz-section">
                    <div class="quiz-header">
                        <h3><i class="fas fa-question-circle"></i> Module Quiz</h3>
                        <span class="quiz-status">Test your knowledge</span>
                    </div>
                    <div class="quiz-container" id="moduleQuizContainer">
                        <div class="loading-quiz">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading quiz questions...</p>
                        </div>
                    </div>
                    <div class="quiz-results" id="moduleQuizResults" style="display: none;">
                        <h4>Quiz Results</h4>
                        <div class="score-display">
                            <span class="score" id="moduleQuizScore">0/0</span>
                            <span class="percentage" id="moduleQuizPercentage">0%</span>
                        </div>
                        <button class="retake-quiz-btn" id="retakeModuleQuiz">Retake Quiz</button>
                    </div>
                </div>
            </div>
        `;
        
        // Scroll to top of module content
        courseGridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Setup quiz for the module
        const quizContainer = document.getElementById('moduleQuizContainer');
        const quizResults = document.getElementById('moduleQuizResults');
        if (quizContainer && quizResults && moduleData.quizData) {
            renderQuiz(moduleData.quizData, quizContainer, quizResults);
        }
        
        // Setup back to course button
        setupBackToCourseButton();
    }
}

function setupBackToCourseButton() {
    const backToCourseBtn = document.getElementById('backToCourse');
    
    if (backToCourseBtn) {
        backToCourseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const courseTitle = this.dataset.courseTitle;
            console.log('Back to course clicked:', courseTitle);
            
            // Find the course data
            const courseData = window.coursesData.find(course => course.title === courseTitle);
            if (courseData) {
                openCourse(courseData.title, courseData.description, courseData.tags);
            } else {
                // Fallback - go back to learn page
                showLearnPage();
            }
        });
    }
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
                question: "Explain the importance of using proper labels in forms for accessibility.",
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
            type: 'multiple_choice',
            question: 'What is the main focus of this course?',
            options: ['Basic concepts', 'Advanced implementation', 'Theory only', 'Simple examples'],
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
        showNewCourseModal();
    });
}

// Show modal with course creation options
function showNewCourseModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('newCourseModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'newCourseModal';
    modal.className = 'course-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeNewCourseModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-plus-circle"></i> Create New Course</h3>
                <button class="modal-close" onclick="closeNewCourseModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p class="modal-description">Choose how you'd like to create your new course:</p>
                
                <div class="course-options">
                    <div class="course-option" onclick="showTopicInput()">
                        <div class="option-icon">
                            <i class="fas fa-keyboard"></i>
                        </div>
                        <div class="option-content">
                            <h4>Type a Topic</h4>
                            <p>Enter a topic and let AI generate a comprehensive course for you</p>
                        </div>
                        <div class="option-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                    
                    <div class="course-option" onclick="selectFileUpload()">
                        <div class="option-icon">
                            <i class="fas fa-file-upload"></i>
                        </div>
                        <div class="option-content">
                            <h4>Upload PDF File</h4>
                            <p>Upload a PDF document to generate a course from its content</p>
                        </div>
                        <div class="option-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Close the new course modal
function closeNewCourseModal() {
    const modal = document.getElementById('newCourseModal');
    if (modal) {
        modal.remove();
    }
}

// Show topic input form
function showTopicInput() {
    const modalBody = document.querySelector('#newCourseModal .modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div class="topic-input-form">
            <div class="form-header">
                <button class="back-btn" onclick="showNewCourseModal()">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h4><i class="fas fa-keyboard"></i> Create Course from Topic</h4>
            </div>
            
            <div class="form-content">
                <div class="input-group">
                    <label for="courseTopic">Course Topic</label>
                    <input type="text" id="courseTopic" placeholder="e.g., Machine Learning Basics, Web Development, Data Structures..." maxlength="100">
                    <small>Enter a topic you'd like to learn about</small>
                </div>
                
                <div class="input-group">
                    <label for="courseLevel">Difficulty Level</label>
                    <select id="courseLevel">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate" selected>Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeNewCourseModal()">Cancel</button>
                    <button class="btn-primary" onclick="generateCourseFromTopic()">
                        <i class="fas fa-magic"></i> Generate Course
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Generate course from topic
async function generateCourseFromTopic() {
    const topicInput = document.getElementById('courseTopic');
    const levelSelect = document.getElementById('courseLevel');
    
    if (!topicInput || !levelSelect) return;
    
    const topic = topicInput.value.trim();
    const level = levelSelect.value;
    
    if (!topic) {
        showNotification('Please enter a course topic', 'error');
        return;
    }
    
    try {
        closeNewCourseModal();
        showLoadingModal('Generating course content from your topic...');
        console.log('Generating course for topic:', topic, 'Level:', level);
        
        // Simulate AI course generation - replace with actual backend integration
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Create course with proper structure
        const courseTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
        const newCourse = {
            id: `course-${Date.now()}`,
            title: courseTitle,
            description: `A comprehensive ${level} course covering ${topic.toLowerCase()}. Learn fundamental concepts, practical applications, and best practices.`,
            tags: [level.charAt(0).toUpperCase() + level.slice(1), "AI Generated", getTopicCategory(topic)],
            modules: [
                {
                    id: `module-${Date.now()}-1`,
                    title: "Foundations & Overview",
                    description: `Introduction to ${topic.toLowerCase()} fundamentals and core concepts.`,
                    lessons: [
                        "What is " + topic + "?",
                        "Key terminology and concepts", 
                        "Historical context and evolution",
                        "Current applications and use cases"
                    ],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: `What is the primary focus of ${topic.toLowerCase()}?`,
                            options: [
                                'Theoretical understanding only',
                                'Practical application and implementation',
                                'Memorization',
                                'Following tutorials blindly'
                            ],
                            correctAnswer: 1
                        },
                        {
                            type: 'open_ended',
                            question: `Explain why ${topic.toLowerCase()} is important in today's context.`,
                            expectedKeywords: ['practical', 'application', 'modern', 'relevant', 'useful']
                        }
                    ]
                },
                {
                    id: `module-${Date.now()}-2`,
                    title: "Core Concepts & Techniques",
                    description: `Deep dive into essential ${topic.toLowerCase()} methods and approaches.`,
                    lessons: [
                        "Essential techniques and methods",
                        "Step-by-step implementation",
                        "Common patterns and practices",
                        "Tools and resources"
                    ],
                    quizData: [
                        {
                            type: 'multiple_choice',
                            question: `Which approach is most effective for learning ${topic.toLowerCase()}?`,
                            options: [
                                'Theory first, then practice',
                                'Practice with guided theory',
                                'Pure memorization',
                                'Skipping fundamentals'
                            ],
                            correctAnswer: 1
                        }
                    ]
                },
                {
                    id: `module-${Date.now()}-3`,
                    title: "Advanced Applications",
                    description: `Advanced ${topic.toLowerCase()} concepts and real-world applications.`,
                    lessons: [
                        "Advanced techniques and optimization",
                        "Real-world case studies",
                        "Best practices and pitfalls",
                        "Future trends and developments"
                    ],
                    quizData: [
                        {
                            type: 'open_ended',
                            question: `Describe an advanced application of ${topic.toLowerCase()} and its benefits.`,
                            expectedKeywords: ['advanced', 'application', 'benefits', 'implementation', 'optimization']
                        }
                    ]
                }
            ]
        };
        
        // Add to courses data
        window.coursesData.unshift(newCourse);
        
        hideLoadingModal();
        showNotification(`Course "${courseTitle}" created successfully!`, 'success');
        
        // Refresh the course grid
        showLearnPage();
        
    } catch (error) {
        hideLoadingModal();
        console.error('Error generating course:', error);
        showNotification('Error generating course. Please try again.', 'error');
    }
}

// Get topic category for tagging
function getTopicCategory(topic) {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('web') || topicLower.includes('html') || topicLower.includes('css') || topicLower.includes('javascript')) {
        return 'Web Dev';
    } else if (topicLower.includes('machine learning') || topicLower.includes('ai') || topicLower.includes('data')) {
        return 'AI/ML';
    } else if (topicLower.includes('programming') || topicLower.includes('code') || topicLower.includes('software')) {
        return 'Programming';
    } else if (topicLower.includes('design') || topicLower.includes('ui') || topicLower.includes('ux')) {
        return 'Design';
    } else if (topicLower.includes('business') || topicLower.includes('management') || topicLower.includes('marketing')) {
        return 'Business';
    } else {
        return 'General';
    }
}

// Handle file upload option
function selectFileUpload() {
    closeNewCourseModal();
    
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
}

function showLearnPage() {
    // Hide all sections first
    hideAllSections();
    
    const learnPage = document.getElementById('learnPage');
    if (learnPage) {
        // Show the learn page
        learnPage.style.display = 'block';
        
        // Reset Learn page header to normal state (in case coming from Review page)
        const learnHeader = learnPage.querySelector('.learn-header');
        const reviewContent = learnPage.querySelector('.review-content');
        
        if (learnHeader) {
            const title = learnHeader.querySelector('.learn-title');
            const subtitle = learnHeader.querySelector('.learn-subtitle');
            const newCourseBtn = learnHeader.querySelector('.new-course-btn');
            
            // Reset header text to Learn page defaults
            if (title) title.textContent = 'Learn';
            if (subtitle) subtitle.textContent = 'Mark lessons as done; filter with the search box above.';
            if (newCourseBtn) newCourseBtn.style.display = 'flex';
        }
        
        // Remove any existing review content
        if (reviewContent) reviewContent.remove();
        
        // Make sure search container is visible
        const searchContainer = learnPage.querySelector('.learn-search-container');
        if (searchContainer) searchContainer.style.display = 'block';
        
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

function showOverviewPage() {
    // Hide all sections first
    hideAllSections();
    
    const heroSection = document.querySelector('.hero');
    const overviewPage = document.getElementById('overviewPage');
    
    if (heroSection) heroSection.style.display = 'block';
    if (overviewPage) overviewPage.style.display = 'block';
    
    // Update navigation
    updateNavigation('Overview');
}
