/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./FRONTEND/**/*.{html,js}"],
    theme: {
        extend: {
            colors: {
                bg: '#1c1d1f',
                panel: '#2a2b2f',
                text: '#f4f4f5',
                muted: '#a1a1aa',
                line: '#3a3b3f',
                c1: '#1BB88D',
                c2: '#FAC38D',
                c3: '#F1E3A4',
                c4: '#CE7C66',
                c5: '#8EBE73',
            }
        }
    },
    plugins: [],
}
