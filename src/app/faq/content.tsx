import Link from "next/link"
import { GOLD_LINK } from "./linkStyle"

// The FAQ content for /faq. Lifted out of page.tsx unchanged so the
// Direction D page renders the same questions and answers from one source:
// a Next.js route file may not export arbitrary values. Answers carry JSX
// links, which is why this module is .tsx.

const linkStyle = GOLD_LINK

export type FaqItem = {
  q: string
  a: React.ReactNode
  schemaA: string
}

export type FaqCategory = {
  label: string
  items: FaqItem[]
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    label: "Getting Started",
    items: [
      {
        q: "What is The Lisa Fit Method?",
        a: "The Lisa Fit Method is built around a simple belief: lasting results come from understanding the fundamentals. After a serious back injury forced me to rebuild my own training from the ground up, I became obsessed with learning what actually works and why. Today, The Lisa Fit Method combines evidence-based training, practical nutrition, and sustainable habits to help people build strength, improve their body composition, and feel confident in the gym. Through courses and coaching, the goal is not just to help you get results, but to understand how to keep creating them for years to come.",
        schemaA:
          "The Lisa Fit Method is built around a simple belief: lasting results come from understanding the fundamentals. After a serious back injury forced me to rebuild my own training from the ground up, I became obsessed with learning what actually works and why. Today, The Lisa Fit Method combines evidence-based training, practical nutrition, and sustainable habits to help people build strength, improve their body composition, and feel confident in the gym. Through courses and coaching, the goal is not just to help you get results, but to understand how to keep creating them for years to come.",
      },
      {
        q: "Who is The Lisa Fit Method for?",
        a: "I created The Lisa Fit Method for people who want to build strength, improve their body composition, and finally understand how training and nutrition actually work. Most people I work with are either completely new to the gym, returning after time away, or frustrated because they've spent years trying random workouts without seeing consistent results. If you've ever felt overwhelmed by fitness advice, intimidated by the gym, or unsure whether you're doing the right things, this is exactly who I built it for.",
        schemaA:
          "I created The Lisa Fit Method for people who want to build strength, improve their body composition, and finally understand how training and nutrition actually work. Most people I work with are either completely new to the gym, returning after time away, or frustrated because they've spent years trying random workouts without seeing consistent results. If you've ever felt overwhelmed by fitness advice, intimidated by the gym, or unsure whether you're doing the right things, this is exactly who I built it for.",
      },
      {
        q: "Which course should I start with?",
        a: (
          <>
            If your goal is to learn how to strength train properly, build confidence in the gym, and understand the fundamentals that drive results, start with{" "}
            <Link href="/courses" style={linkStyle}>Training Foundations</Link>
            . If your main focus is improving your eating habits, understanding calories and macros, or learning how nutrition supports fat loss and muscle building, start with{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            . Both courses work independently, but together they provide the complete framework I use to help people build sustainable results.
          </>
        ),
        schemaA:
          "If your goal is to learn how to strength train properly, build confidence in the gym, and understand the fundamentals that drive results, start with Training Foundations. If your main focus is improving your eating habits, understanding calories and macros, or learning how nutrition supports fat loss and muscle building, start with Nutrition Foundations. Both courses work independently, but together they provide the complete framework I use to help people build sustainable results.",
      },
      {
        q: "Do I need gym experience to start?",
        a: (
          <>
            Not at all. In fact, many people who join have never followed a structured strength training program before.{" "}
            <Link href="/courses" style={linkStyle}>Training Foundations</Link>
            {" "}was designed to teach you the fundamentals from the ground up, including movement mechanics, exercise form, and how to progress safely over time. You don&apos;t need experience, you just need a willingness to learn.
          </>
        ),
        schemaA:
          "Not at all. In fact, many people who join have never followed a structured strength training program before. Training Foundations was designed to teach you the fundamentals from the ground up, including movement mechanics, exercise form, and how to progress safely over time. You don't need experience, you just need a willingness to learn.",
      },
      {
        q: "What makes The Lisa Fit Method different from other fitness programs?",
        a: "Most fitness programs tell you what to do. I want you to understand why you're doing it. After a serious back injury forced me to rebuild my own training from scratch, I became obsessed with learning what actually drives results and what is mostly noise. That experience shaped everything I teach. Instead of relying on quick fixes or random workouts, you'll learn the principles behind strength training, nutrition, movement quality, and progressive overload so you can continue making progress long after a program ends.",
        schemaA:
          "Most fitness programs tell you what to do. I want you to understand why you're doing it. After a serious back injury forced me to rebuild my own training from scratch, I became obsessed with learning what actually drives results and what is mostly noise. That experience shaped everything I teach. Instead of relying on quick fixes or random workouts, you'll learn the principles behind strength training, nutrition, movement quality, and progressive overload so you can continue making progress long after a program ends.",
      },
    ],
  },
  {
    label: "Training & Results",
    items: [
      {
        q: "Will I build muscle?",
        a: "Yes, if you train consistently, challenge yourself over time, and support your training with proper nutrition. Building muscle doesn't require complicated workouts. It requires a structured plan, progressive overload, adequate recovery, and enough protein. The Lisa Fit Method is designed around those fundamentals because they're the things that actually produce results.",
        schemaA:
          "Yes, if you train consistently, challenge yourself over time, and support your training with proper nutrition. Building muscle doesn't require complicated workouts. It requires a structured plan, progressive overload, adequate recovery, and enough protein. The Lisa Fit Method is designed around those fundamentals because they're the things that actually produce results.",
      },
      {
        q: "Is this good for weight loss and fat loss?",
        a: "Yes, but my focus is body composition rather than simply making the number on the scale go down. Most people don't just want to lose weight. They want to lose fat, build lean muscle, feel stronger, and look better. Strength training plays a huge role in that process, and when combined with sound nutrition habits, it creates results that are far easier to maintain long term than extreme diets or endless cardio.",
        schemaA:
          "Yes, but my focus is body composition rather than simply making the number on the scale go down. Most people don't just want to lose weight. They want to lose fat, build lean muscle, feel stronger, and look better. Strength training plays a huge role in that process, and when combined with sound nutrition habits, it creates results that are far easier to maintain long term than extreme diets or endless cardio.",
      },
      {
        q: "What is progressive overload and why does it matter?",
        a: "Progressive overload is the principle that your body adapts to the demands you place on it. If you continue asking your muscles to do the exact same thing every week, eventually they stop changing. Real progress happens when you gradually increase the challenge through more weight, more reps, improved technique, or greater training volume. It's one of the most important concepts in fitness and the foundation of every effective strength training program.",
        schemaA:
          "Progressive overload is the principle that your body adapts to the demands you place on it. If you continue asking your muscles to do the exact same thing every week, eventually they stop changing. Real progress happens when you gradually increase the challenge through more weight, more reps, improved technique, or greater training volume. It's one of the most important concepts in fitness and the foundation of every effective strength training program.",
      },
      {
        q: "What age group is this designed for?",
        a: "The Lisa Fit Method is designed for adults of all ages who want to get stronger, move better, and build sustainable habits.",
        schemaA:
          "The Lisa Fit Method is designed for adults of all ages who want to get stronger, move better, and build sustainable habits.",
      },
      {
        q: "What if I am intimidated by the gym?",
        a: "You're not alone. Most people feel that way at some point. In my experience, gym anxiety usually comes from not knowing what to do or worrying about doing it wrong. That's why education is such a big part of what I teach. When you walk into a gym with a clear plan, understand the exercises, and know what you're trying to accomplish, confidence tends to follow naturally.",
        schemaA:
          "You're not alone. Most people feel that way at some point. In my experience, gym anxiety usually comes from not knowing what to do or worrying about doing it wrong. That's why education is such a big part of what I teach. When you walk into a gym with a clear plan, understand the exercises, and know what you're trying to accomplish, confidence tends to follow naturally.",
      },
      {
        q: "Can I combine training with cardio?",
        a: "Absolutely. Strength training and cardio complement each other very well when programmed intelligently. Walking, cycling, swimming, hiking, or any form of cardio you enjoy can be a great addition to your routine. I generally recommend treating strength training as the priority and using cardio to support your overall health, fitness, and recovery.",
        schemaA:
          "Absolutely. Strength training and cardio complement each other very well when programmed intelligently. Walking, cycling, swimming, hiking, or any form of cardio you enjoy can be a great addition to your routine. I generally recommend treating strength training as the priority and using cardio to support your overall health, fitness, and recovery.",
      },
    ],
  },
  {
    label: "Nutrition",
    items: [
      {
        q: "Can I start with nutrition before training?",
        a: (
          <>
            Yes.{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            {" "}is designed to stand on its own, so you can start there even if you&apos;re not currently following a training program. Many people choose to improve their nutrition habits first before focusing on strength training, while others work on both at the same time. There&apos;s no right answer. The best place to start is wherever you feel ready.
          </>
        ),
        schemaA:
          "Yes. Nutrition Foundations is designed to stand on its own, so you can start there even if you're not currently following a training program. Many people choose to improve their nutrition habits first before focusing on strength training, while others work on both at the same time. There's no right answer. The best place to start is wherever you feel ready.",
      },
      {
        q: "Do I need both Training Foundations and Nutrition Foundations?",
        a: (
          <>
            No. Each course provides value on its own and can help you make meaningful progress. That said, training and nutrition work best together. If your goal is to improve body composition, build muscle, lose fat, and create lasting habits, combining both gives you a more complete understanding of how the pieces fit together. The{" "}
            <Link href="/checkout?product=bundle" style={linkStyle}>Foundations Bundle</Link>
            {" "}is the most cost-effective way to get both.
          </>
        ),
        schemaA:
          "No. Each course provides value on its own and can help you make meaningful progress. That said, training and nutrition work best together. If your goal is to improve body composition, build muscle, lose fat, and create lasting habits, combining both gives you a more complete understanding of how the pieces fit together.",
      },
    ],
  },
  {
    label: "Programs & Access",
    items: [
      {
        q: "What equipment do I need?",
        a: "You don't need a fully equipped commercial gym to get started. Most exercises can be performed with a set of dumbbells and resistance bands, and alternatives are provided whenever possible. Whether you train at home or in a gym, the focus is on learning movement patterns and applying progressive overload, not chasing fancy equipment.",
        schemaA:
          "You don't need a fully equipped commercial gym to get started. Most exercises can be performed with a set of dumbbells and resistance bands, and alternatives are provided whenever possible. Whether you train at home or in a gym, the focus is on learning movement patterns and applying progressive overload, not chasing fancy equipment.",
      },
      {
        q: "Can I do this at home?",
        a: "Yes. Many people begin at home and get great results. The fundamental movement patterns don't change just because you're training outside a gym. As long as you have access to a few basic pieces of equipment, you can build strength, improve your technique, and develop confidence before ever stepping foot into a commercial gym.",
        schemaA:
          "Yes. Many people begin at home and get great results. The fundamental movement patterns don't change just because you're training outside a gym. As long as you have access to a few basic pieces of equipment, you can build strength, improve your technique, and develop confidence before ever stepping foot into a commercial gym.",
      },
      {
        q: "How long do I have access?",
        a: "Once you purchase a course, it's yours. There are no subscriptions, recurring fees, or expiration dates. You can revisit the lessons, exercise videos, and materials whenever you need them, whether that's next week or several years from now.",
        schemaA:
          "Once you purchase a course, it's yours. There are no subscriptions, recurring fees, or expiration dates. You can revisit the lessons, exercise videos, and materials whenever you need them, whether that's next week or several years from now.",
      },
      {
        q: "What happens after I finish the program?",
        a: "Run it again. Most people are surprised by how much stronger, more skilled, and more confident they feel the second time through. The goal was never to complete a short challenge and move on. The goal is to learn principles and habits you can continue applying for years. Many people repeat Training Foundations multiple times before they ever need something more advanced.",
        schemaA:
          "Run it again. Most people are surprised by how much stronger, more skilled, and more confident they feel the second time through. The goal was never to complete a short challenge and move on. The goal is to learn principles and habits you can continue applying for years. Many people repeat Training Foundations multiple times before they ever need something more advanced.",
      },
    ],
  },
  {
    label: "Coaching",
    items: [
      {
        q: "What is the difference between courses and coaching?",
        a: "The courses are designed to teach you the principles, systems, and habits that drive results so you can apply them independently. Coaching is much more personalized. I create a custom plan based on your goals, training history, lifestyle, and individual needs, then provide ongoing guidance, feedback, and accountability along the way.",
        schemaA:
          "The courses are designed to teach you the principles, systems, and habits that drive results so you can apply them independently. Coaching is much more personalized. I create a custom plan based on your goals, training history, lifestyle, and individual needs, then provide ongoing guidance, feedback, and accountability along the way.",
      },
      {
        q: "How do I know if 1:1 coaching is right for me?",
        a: (
          <>
            Choose coaching if you want a plan built completely around your goals, training history, schedule, equipment, and any injuries or limitations, plus weekly check-ins and direct support along the way. Choose the courses if you prefer a self-guided approach at your own pace. Both are real ways to work together.{" "}
            <Link href="/coaching" style={linkStyle}>Learn more about coaching.</Link>
          </>
        ),
        schemaA:
          "Choose coaching if you want a plan built completely around your goals, training history, schedule, equipment, and any injuries or limitations, plus weekly check-ins and direct support along the way. Choose the courses if you prefer a self-guided approach at your own pace. Both are real ways to work together.",
      },
    ],
  },
]
