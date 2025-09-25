/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                paper: "#FAF7EC",
                ink: "#1F1A17",
            },
        },
    },
    plugins: [],
};
