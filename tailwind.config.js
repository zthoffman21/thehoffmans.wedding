/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: "#1D2021",
                paper: "#FBF1C7",
                ink: "#3C3836",
                accent: "#D79921",
                rose: "#EA6962",
                sage: "#A7C080",
            },
            fontFamily: {
                serif: ['"Playfair Display"', "serif"],
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.08)" },
        },
    },
    plugins: [],
};
