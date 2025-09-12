window.courseCompletion = 100;
window.quizAccuracy = 100;
window.retentionRate = 100;

window.coursesData = (() => {
    const data = localStorage.getItem('coursesData');
    return data ? JSON.parse(data) : [];
})();

window.modulesData = (() => {
    const data = localStorage.getItem('modulesData');
    return data ? JSON.parse(data) : [];
})();

window.questionsData = (() => {
    const data = localStorage.getItem('questionsData');
    return data ? JSON.parse(data) : [];
})();

window.userId = (() => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = generateId('user');
        window.apiService.createUser(userId);
    }
    
    return userId;
})();