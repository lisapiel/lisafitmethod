// Module outlines for /courses. Lifted out of page.tsx unchanged so the
// Direction D page can render the same wording from one source: a Next.js
// route file may not export arbitrary values.

export const TRAINING_MODULES = [
  { num: "01", tag: "Module 1", title: "Foundation Movements", items: ["Hip hinge: protect your back under load", "Squat pattern: hips, knees, and core working together", "Push pattern: press safely without destroying your shoulders", "Pull pattern: build posture, stability, and upper body strength", "Brace & carry: how your core actually works"] },
  { num: "02", tag: "Module 2", title: "Core & Glute Priority", items: ["Core stability fundamentals", "Glute strength and lower body stability", "Load the posterior chain safely", "Build a stronger core that supports heavier lifting"] },
  { num: "03", tag: "Module 3", title: "The Training Program", items: ["3 structured training days per week", "Built-in warm-ups and cool-downs", "Progressive overload system included", "Step-by-step exercise guidance", "Workout and progress tracking built in", "Designed to be repeated and progressed"] },
  { num: "04", tag: "Module 4", title: "Nutrition Essentials", items: ["Protein first", "Fuel your training properly", "Consistency over perfection", "Hydration affects everything", "Stop overcomplicating nutrition"] },
]

export const NUTRITION_MODULES = [
  { num: "01", title: "Understanding Your Body", desc: "BMR, TDEE, and your personalised calorie target" },
  { num: "02", title: "Your Nutrition Blueprint", desc: "Protein, carbs, fats, hydration, and plate building" },
  { num: "03", title: "4-Week Meal Plan", desc: "Real recipes and grocery lists, scaled to your target" },
  { num: "04", title: "Making It Stick", desc: "Eating out, troubleshooting, supplements, and recovery" },
]
