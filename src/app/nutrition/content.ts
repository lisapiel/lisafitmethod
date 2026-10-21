// Module outlines and FAQ for /nutrition. Lifted out of page.tsx unchanged so
// the Direction D page renders the same wording from one source: a Next.js
// route file may not export arbitrary values.

export const MODULES = [
  {
    num: "01",
    tag: "Module 1",
    title: "Understanding Your Body",
    desc: "Learn what BMR and TDEE actually mean, use the interactive calculator to get your personalized calorie target, and understand how your goal changes everything.",
    items: [
      "Interactive TDEE calculator — Mifflin-St Jeor formula",
      "Personalized daily calorie target based on your stats and goal",
      "Training day vs. rest day calorie strategy",
      "Macro targets: protein, fat, and carbs in grams",
      "Save your profile — your meal plan adapts to your numbers",
    ],
  },
  {
    num: "02",
    tag: "Module 2",
    title: "Your Nutrition Blueprint",
    desc: "Protein first, carbs timed around training, fats from the right sources. Learn how to actually build a plate — and stop guessing.",
    items: [
      "Protein targets and the best food sources ranked",
      "Carbohydrate timing for training and recovery",
      "Essential fats and omega-3 for muscle and health",
      "The plate-building method: simple and repeatable",
      "Hydration targets and practical tracking guidance",
    ],
  },
  {
    num: "03",
    tag: "Module 3",
    title: "Your 4-Week Meal Plan",
    desc: "A full four-week plan with real recipes from verified sources. Portions adapt to your saved calorie target. Grocery lists and meal prep included.",
    items: [
      "Week 1–2: habit-building rotation with 9 core recipes",
      "Week 3–4: introduces variety while keeping things simple",
      "Every recipe attributed with source links and verified macros",
      "Grocery list by week — organized for efficient shopping",
      "Sunday and Wednesday meal prep guides",
    ],
  },
  {
    num: "04",
    tag: "Module 4",
    title: "Making It Stick",
    desc: "The strategies that keep nutrition working outside controlled conditions — restaurants, social situations, plateaus, and what to do when the scale isn't moving.",
    items: [
      "Ordering guide for Mexican, Italian, sushi, and fast food",
      "Social situations, alcohol strategy, and morning-after reset",
      "Troubleshooting: plateau, losing too fast, constant hunger",
      "Evidence-based supplements: creatine, protein powder, D3",
      "Pre and post-workout nutrition for training performance",
    ],
  },
]

export const FAQS = [
  {
    q: "Do I need to be already training to take this course?",
    a: "No — but it's designed for people who are training or planning to. The meal plan and calorie targets are built around activity levels, so they work best when you have a training routine in place (or are building one).",
  },
  {
    q: "Is the meal plan personalized to my specific numbers?",
    a: "Yes. Module 1 has an interactive TDEE calculator that generates your personal calorie and macro targets. When you save your profile, the Module 3 meal plan automatically scales all portions and daily totals to your target — not a generic number.",
  },
  {
    q: "Are the recipes invented or sourced?",
    a: "Every recipe is sourced from established food and nutrition creators, with full attribution and clickable links to the original. Macros are calculated from actual ingredients — nothing is made up or approximated loosely.",
  },
  {
    q: "I'm not a nutritionist — is this too advanced?",
    a: "It's written for someone with no nutrition background. Every concept is explained simply, with the science cited so you can go deeper if you want. The goal is practical and usable, not academic.",
  },
  {
    q: "Does this replace seeing a dietitian?",
    a: "No. Lisa is a Certified Personal Trainer, not a Registered Dietitian. This course provides general nutrition education for fitness and performance goals. If you have a medical condition, medications, or history of eating disorders, work with a licensed healthcare provider.",
  },
  {
    q: "Can I use this alongside Training Foundations?",
    a: "Absolutely — that's the intent. The two courses are designed to complement each other. Module 4 covers how to time your nutrition around your training sessions.",
  },
]
