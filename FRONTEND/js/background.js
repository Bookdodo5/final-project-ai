document.addEventListener('DOMContentLoaded', () => {
    const gradientBg = document.getElementById('gradientBg');
    if (!gradientBg) return;

    const colors = [
        { color: '#83d2b2', shade: '#5db394' }, // c1
        { color: '#FAC38D', shade: '#f7b06b' }, // c2
        { color: '#F1E3A4', shade: '#e9d47a' }, // c3
        { color: '#CE7C66', shade: '#c05d4a' }, // c4
        { color: '#8EBE73', shade: '#6d9a57' }  // c5
    ];

    function createSpaceElement(type, size, x, y) {
        const element = document.createElement('div');
        element.className = `space-element particle ${type}`;
        
        if (type === 'star') {
            element.style.width = `${size}px`;
            element.style.height = `${size}px`;
            element.style.left = `${x}%`;
            element.style.top = `${y}%`;
            element.style.animationDelay = `-${Math.random() * 10}s`;
            element.style.opacity = Math.random() * 0.5 + 0.3;
            element.style.animation = `floatUp ${Math.random() * 15 + 5}s linear infinite, twinkle ${Math.random() * 2.5 + 1}s ease-in-out infinite`;
        } 
        else if (type === 'planet') {
            const color = colors[Math.floor(Math.random() * colors.length)];
            element.style.setProperty('--planet-color', color.color);
            element.style.setProperty('--planet-shade', color.shade);
            element.style.width = `${size}px`;
            element.style.height = `${size}px`;
            element.style.left = `${x}%`;
            element.style.top = `${y}%`;
            element.style.animationDelay = `-${Math.random() * 15 + 5}s`;
            element.style.animation = `floatUp ${Math.random() * 25 + 20}s linear infinite`;
        } 

        return element;
    }

    function initSpace() {
        // Add stars
        for (let i = 0; i < 100; i++) {
            const size = Math.random() * 2 + 1;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            gradientBg.appendChild(createSpaceElement('star', size, x, y));
        }

        // Add planets
        for (let i = 0; i < 10; i++) {
            const size = Math.random() * 8 + 3;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            gradientBg.appendChild(createSpaceElement('planet', size, x, y));
        }
    }

    initSpace();
});