import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main site — warm, editorial
        "lfm-black": "#0a0a0a",
        "lfm-off-white": "#f5f2ee",
        "lfm-warm-white": "#faf8f5",
        "lfm-accent": "#c8a97e",
        "lfm-accent-dark": "#a8895e",
        "lfm-text": "#1a1a1a",
        "lfm-muted": "#6b6560",
        // Training Foundations — dark, luxury
        "tf-dark": "#111111",
        "tf-card": "#161616",
        "tf-border": "#2a2a2a",
        "tf-cream": "#f0e6d3",
        "tf-gold": "#c9a96e",
        "tf-gold-light": "#e8c98a",
        "tf-muted": "#888888",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        dm: ["var(--font-dm-sans)", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "serif"],
        montserrat: ["var(--font-montserrat)", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config
