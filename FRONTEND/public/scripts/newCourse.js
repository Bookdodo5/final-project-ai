// DOM Elements
let newCourseModal, courseModalInitial, courseTopicInput;
let typeTopicBtn, uploadPdfBtn, backToInitialBtn, generateCourseBtn;
let courseTopicInputField, courseLevelSelect, courseLengthSelect, courseLanguageInputField;
let pdfFileInput, pdfUploadStatus;

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
    pdfUploadStatus = document.getElementById('pdfUploadStatus');
    
    // Create hidden file input
    pdfFileInput = document.createElement('input');
    pdfFileInput.type = 'file';
    pdfFileInput.accept = 'application/pdf';
    pdfFileInput.style.display = 'none';
    document.body.appendChild(pdfFileInput);
    
    pdfFileInput.addEventListener('change', handlePdfUpload);
    
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
    if (pdfFileInput) {
        pdfFileInput.click();
    }
}

// Handle PDF file upload and extraction
async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show upload status
    if (pdfUploadStatus) {
        pdfUploadStatus.textContent = 'Extracting text from PDF...';
        pdfUploadStatus.classList.remove('hidden');
        pdfUploadStatus.classList.remove('text-red-600');
    }

    try {
        const result = await apiService.extractTextFromPdf(file);
        
        if (!result || !result.fullText) {
            throw new Error('No text was extracted from the PDF');
        }
        
        if (pdfUploadStatus) {
            pdfUploadStatus.textContent = 'PDF processed successfully!';
            pdfUploadStatus.classList.add('text-green-600');
        }

        // Generate course with the extracted text
        generateCourse({
            topicInput: result.fullText,
            lengthOption: 'Unspecified',
            languageOption: 'Unspecified',
            levelOption: 'Unspecified',
        });

    } catch (error) {
        console.error('Error processing PDF:', error);
        if (pdfUploadStatus) {
            pdfUploadStatus.textContent = 'Error processing PDF: ' + (error.message || 'Please try again.');
            pdfUploadStatus.classList.add('text-red-600');
        }
    }
}

async function generateCourse(courseSettings) {
    try {
        // Show loading state
        if (generateCourseBtn) {
            const originalText = generateCourseBtn.innerHTML;
            generateCourseBtn.disabled = true;
            generateCourseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Create course
            await window.apiService.createCourse(window.userId, courseSettings);
            
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

    generateCourse({
        topicInput: topic,
        lengthOption: length,
        languageOption: language,
        levelOption: level,
    });
}

async function generateCourseFromPdf() {
    
}

// Export functions to global scope
window.showNewCourseModal = showNewCourseModal;
window.closeNewCourseModal = closeNewCourseModal;
