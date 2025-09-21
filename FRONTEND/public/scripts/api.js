// Use the EC2 instance IP for production
const BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3222' 
    : 'https://sapiens-backend-tau.vercel.app/';

const apiService = {
    async createUser(userId) {
        const response = await fetch(`${BACKEND_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) throw new Error('Failed to create user');
        localStorage.setItem('userId', userId);
        return response.json();
    },

    async getUser(userId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}`);
        if (!response.ok) throw new Error('Failed to load user');
        const data = await response.json();
        return data;
    },

    async deleteCourse(userId, courseId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to delete course');
        return response.json();
    },

    async getCourses(userId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/courses`);
        if (!response.ok) throw new Error('Failed to load courses');
        const data = await response.json();
        localStorage.setItem('coursesData', JSON.stringify(data));
        return data;
    },

    async getModules(userId, courseId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/courses/${courseId}/modules`);
        if (!response.ok) throw new Error('Failed to load modules');
        const data = await response.json();
        localStorage.setItem('modulesData', JSON.stringify(data));
        return data;
    },

    async regenerateCourse(userId, courseId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/courses/${courseId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to regenerate course');
        return response.json();
    },

    async createCourse(userId, courseData) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(courseData)
        });
        if (!response.ok) throw new Error('Failed to create course');
        return response.json();
    },

    async getQuestions(userId, moduleId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/questions/module/${moduleId}`);
        if (!response.ok) throw new Error('Failed to load questions');
        const data = await response.json();
        localStorage.setItem('questionsData', JSON.stringify(data));
        return data;
    },

    async getQuestionById(userId, questionId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/questions/${questionId}`);
        if (!response.ok) throw new Error('Failed to load question');
        return response.json();
    },

    async submitAnswer(userId, questionId, answer) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/questions/${questionId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answer })
        });
        if (!response.ok) throw new Error('Failed to submit answer');
        return response.json();
    },

    async rateQuestion(userId, questionId, srsRating) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/questions/${questionId}/rate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ srsRating })
        });
        if (!response.ok) throw new Error('Failed to rate question');
        return response.json();
    },

    async markQuestionAsLearned(userId, questionId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/questions/${questionId}/learn`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to mark question as learned');
        return response.json();
    },

    async getDueQuestions(userId) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/questions/due-questions`);
        if (!response.ok) throw new Error('Failed to load due questions');
        return response.json();
    },

    async markModuleAsCompleted(userId, courseId, moduleId) {

        const moduleRes = await fetch(`${BACKEND_URL}/users/${userId}/courses/${courseId}/modules/${moduleId}`);
        if (!moduleRes.ok) throw new Error('Failed to fetch module');
        const moduleData = await moduleRes.json();

        // If already completed, just return without incrementing
        if (moduleData.isCompleted) {
            return;
        }

        const response = await fetch(`${BACKEND_URL}/users/${userId}/courses/${courseId}/modules/${moduleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isCompleted: true })
        });
        if (!response.ok) throw new Error('Failed to mark module as completed');

        const modulesRes = await fetch(`${BACKEND_URL}/users/${userId}/courses/${courseId}/modules`);
        if (!modulesRes.ok) throw new Error('Failed to load modules for progress');
        const modules = await modulesRes.json();

        const total = modules.length || 1;
        const completed = modules.filter(m => m.isCompleted).length;
        const progress = Math.round((completed / total) * 100);

        await this.updateCourse(userId, courseId, { progress });
        
        const user = await this.getUser(userId);
        await this.updateUser(userId, { moduleCompleted: (user.moduleCompleted || 0) + 1 });
    },

    async updateUser(userId, userData) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to update user');
        return response.json();
    },

    async updateQuestionStat(userId, isCorrect, isSrs) {
        const user = await this.getUser(userId);
        const updates = {
            quizAnswered: (user.quizAnswered || 0) + (isSrs ? 0 : 1),
            quizCorrect: (user.quizCorrect || 0) + (isSrs ? 0 : (isCorrect ? 1 : 0)),
            srsAnswered: (user.srsAnswered || 0) + (isSrs ? 1 : 0),
            srsCorrect: (user.srsCorrect || 0) + (isSrs ? (isCorrect ? 1 : 0) : 0),
        };
        await this.updateUser(userId, updates);
    },

    async updateCourse(userId, courseId, courseData) {
        const response = await fetch(`${BACKEND_URL}/users/${userId}/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(courseData)
        });
        if (!response.ok) throw new Error('Failed to update course');
        return response.json();
    },

    async extractTextFromPdf(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const base64Data = event.target.result;
                    
                    const response = await fetch(`${BACKEND_URL}/pdf/extract-text`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            file: base64Data
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (!result || typeof result.fullText !== 'string') {
                        throw new Error('Invalid response from server');
                    }
                    
                    resolve(result);
                } catch (error) {
                    console.error('PDF Extraction Error:', error);
                    reject(new Error(error.message || 'Failed to process PDF. Please make sure the file is not encrypted or image-based.'));
                }
            };
            
            reader.onerror = (error) => {
                console.error('File reading error:', error);
                reject(new Error('Failed to read the PDF file.'));
            };
            
            // Read the file as a data URL (base64)
            reader.readAsDataURL(file);
        });
    },
};

window.apiService = apiService;