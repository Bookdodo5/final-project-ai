// DOM Elements
let newCourseModal, courseModalInitial, courseTopicInput;
let typeTopicBtn, uploadPdfBtn, backToInitialBtn, generateCourseBtn;
let courseTopicInputField, courseLevelSelect, courseLengthSelect, courseLanguageInputField;

// Initialize modal elements
document.addEventListener('DOMContentLoaded', () => {
    // Get modal elements
    newCourseModal = document.getElementById('newCourseModal');
    courseModalInitial = document.getElementById('courseModalInitial');
    courseTopicInput = document.getElementById('courseTopicInput');
    
    // Get buttons
    typeTopicBtn = document.getElementById('typeTopicBtn');
    uploadPdfBtn = document.getElementById('uploadPdfBtn');
    backToInitialBtn = document.getElementById('backToInitialBtn');
    generateCourseBtn = document.getElementById('generateCourseBtn');
    
    // Get form elements
    courseTopicInputField = document.getElementById('courseTopic');
    courseLevelSelect = document.getElementById('courseLevel');
    courseLengthSelect = document.getElementById('courseLength');
    courseLanguageInputField = document.getElementById('courseLanguage');
    
    // Add event listeners
    if (typeTopicBtn) typeTopicBtn.addEventListener('click', showTopicInput);
    if (uploadPdfBtn) uploadPdfBtn.addEventListener('click', selectFileUpload);
    if (backToInitialBtn) backToInitialBtn.addEventListener('click', showInitialView);
    if (generateCourseBtn) generateCourseBtn.addEventListener('click', generateCourseFromTopic);
    
    // Close modal when clicking outside
    if (newCourseModal) {
        newCourseModal.addEventListener('click', (e) => {
            if (e.target === newCourseModal) {
                closeNewCourseModal();
            }
        });
    }
});

function showNewCourseModal() {
    if (!newCourseModal) return;
    
    // Reset to initial view
    showInitialView();
    
    // Show the modal
    newCourseModal.classList.remove('hidden');
    newCourseModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

// Close the new course modal
function closeNewCourseModal() {
    if (newCourseModal) {
        newCourseModal.classList.add('hidden');
        newCourseModal.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

// Show initial view of the modal
function showInitialView() {
    if (courseModalInitial && courseTopicInput) {
        courseModalInitial.classList.remove('hidden');
        courseTopicInput.classList.add('hidden');
    }
}

// Show topic input form
function showTopicInput() {
    if (!courseModalInitial || !courseTopicInput) return;
    
    // Reset form
    if (courseTopicInputField) courseTopicInputField.value = '';
    if (courseLevelSelect) courseLevelSelect.value = 'foundation';
    if (courseLengthSelect) courseLengthSelect.value = 'medium';
    if (courseLanguageInputField) courseLanguageInputField.value = '';
    
    // Switch views
    courseModalInitial.classList.add('hidden');
    courseTopicInput.classList.remove('hidden');
    
    // Focus on the input field
    if (courseTopicInputField) courseTopicInputField.focus();
}

// Handle file upload selection
function selectFileUpload() {
    alert('PDF upload functionality will be implemented in a future update');
}

// Generate course from topic
async function generateCourseFromTopic() {
    if (!courseTopicInputField || !courseLevelSelect) return;
    
    const topic = courseTopicInputField.value.trim();
    const level = courseLevelSelect.value || 'foundation';
    const length = courseLengthSelect.value || 'medium';
    const language = courseLanguageInputField.value.trim();
    
    if (!topic) {
        alert('Please enter a topic');
        return;
    }

    try {
        // Show loading state
        if (generateCourseBtn) {
            const originalText = generateCourseBtn.innerHTML;
            generateCourseBtn.disabled = true;
            generateCourseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Create course
            await window.apiService.createCourse(window.userId, {
                topicInput: `${topic} (Difficulty / Scope : ${level})`,
                lengthOption: length,
                languageOption: language,
            });
            
            // Reset button state
            generateCourseBtn.disabled = false;
            generateCourseBtn.innerHTML = originalText;
            
            // Close modal and refresh course list
            closeNewCourseModal();
            if (typeof window.loadCourses === 'function') {
                window.loadCourses();
            }
        }
    } catch (error) {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
        
        // Reset button state on error
        if (generateCourseBtn) {
            generateCourseBtn.disabled = false;
            generateCourseBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Course';
        }
    }
}

// Export functions to global scope
window.showNewCourseModal = showNewCourseModal;
window.closeNewCourseModal = closeNewCourseModal;
