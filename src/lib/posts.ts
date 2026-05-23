export type Post = {
  slug: string
  title: string
  date: string
  excerpt: string
  readingTime: number
  sections: { heading?: string; body: string }[]
}

export const posts: Post[] = [
  {
    slug: "strength-training-for-women-beginners",
    title: "The Best Strength Training Program for Women Beginners",
    date: "2025-04-10",
    excerpt:
      "Most beginner programs give you a list of exercises and call it a day. Here's what a real strength training program for women actually looks like — and why the foundation you build now matters more than any exercise you'll ever do.",
    readingTime: 7,
    sections: [
      {
        body: "I get this question constantly: what's the best strength training program for women who are just starting out? Or for people who have been working out for a while but still are not seeing real results?\n\nAnd every time I answer it, I have to fight the urge to just name a program and move on. Because the honest answer is this: the best program is the one built on the right foundation and the one you can stick to consistently, even when it stops feeling exciting.\n\nNot the trendiest one.\nNot the one your friend is doing.\nThe one that teaches you how to move properly before it asks you to move heavy.",
      },
      {
        heading: "Why most beginner programs fail women",
        body: "The majority of beginner programs are built around the assumption that your goal is just to lose weight. So they give you high-rep circuits, random cardio, and low-weight workouts with very little actual instruction on how to perform the movements correctly. You burn calories. You sweat. You feel like you worked hard. And months later, you still are not much stronger and your body barely changes.\n\nThe real problem usually is not the exercises themselves. It's that nobody teaches the movement patterns underneath them.\n\nYou can do a hundred squats and still have terrible squat mechanics. You can deadlift every week and still not understand how to hinge properly. And when your foundation is shaky, eventually things start catching up to you.",
      },
      {
        heading: "The five movement patterns every woman needs to learn first",
        body: "Before following any strength training program, you need to understand these five movement patterns:\n\n1. Hip hinge: bending at the hips while keeping your spine stable. This is the foundation of deadlifts, Romanian deadlifts, kettlebell swings, and most glute-focused training.\n\n2. Squat pattern: knees tracking properly, hips descending with control, core engaged, spine stable. This becomes the base for goblet squats, front squats, split squats, and eventually barbell squats.\n\n3. Push pattern: pressing weight away from your body safely and efficiently. Think push-ups, bench press, and overhead press.\n\n4. Pull pattern: drawing weight toward your body. Rows, lat pulldowns, and pull-ups all build the back strength and stability most people are missing.\n\n5. Brace and carry: learning how to stabilize your spine while moving. Carries, Pallof presses, dead bugs, and anti-rotation work matter far more than endless crunches when it comes to real core strength.",
      },
      {
        heading: "What a real beginner program looks like",
        body: "A solid beginner strength training program should:\n\n• Train three days per week with rest days between sessions. Recovery is where adaptation happens. Training every day when you are starting out is not dedication, it usually just interferes with recovery.\n\n• Include proper warm-ups and mobility work. Ten minutes of targeted prep work can completely change the quality of your training and the way your body moves under load.\n\n• Progress systematically. More reps one week, slightly more weight the next. Beginners can progress quickly when the program is built properly.\n\n• Include cool-down and recovery work. Staying healthy and pain-free matters just as much as getting stronger.\n\n• Give you a way to actually track your progress. If you are not tracking your weights, reps, and progression over time, it becomes very hard to know whether you are improving or just repeating workouts without direction.",
      },
      {
        heading: "The mistake I made that cost me a year",
        body: "I skipped all of this.\n\nI went straight into programs that looked impressive. Heavy compounds, lots of volume, more weight, more intensity. But I had never actually built the foundation underneath them. Eventually my back gave out. Not from one dramatic injury, but from months of poor movement under load.\n\nThat experience completely changed the way I look at fitness. I became a certified personal trainer partly because I needed to understand what I had done wrong. And what I realized was that every mistake traced back to the same thing: I had never learned how to move properly before trying to train hard.",
      },
      {
        heading: "How Training Foundations is different",
        body: "Training Foundations is the program I built specifically to solve this problem.\n\nIt's a 4-week system built for beginners, returners, and anyone who wants to rebuild their strength the right way. Every session includes warm-ups, structured workouts, progressive overload, cool-down work, and built-in workout tracking so you can actually see your progress over time.\n\nThe first module teaches the movement patterns before asking you to jump into harder training. The program then builds progressively across four weeks, adding load and complexity only after you demonstrate control at the previous level.\n\nThe goal is not just to finish four weeks. The goal is to finally understand how to train properly so you can continue progressing long after the program ends. It's not the flashiest program. But it's the one that will actually build the foundation your body needs.",
      },
    ],
  },
  {
    slug: "back-pain-and-the-gym",
    title: "Back Pain and the Gym: What You're Doing Wrong and How to Fix It",
    date: "2025-04-17",
    excerpt:
      "Back pain doesn't mean you need to stop training. Usually it means you need to start training differently. Here's what most people are doing wrong — and what to do instead.",
    readingTime: 6,
    sections: [
      {
        body: "If you've ever dealt with back pain at the gym, or been told to stop training because of it, this is for you.\n\nI lived with serious lower back pain for almost a year. I understand the frustration of not being able to train the way you used to, and the fear that every movement might make things worse. But what I learned is that, in most cases, the answer is not to stop training completely. The answer is to learn how to move properly.",
      },
      {
        heading: "Why your back hurts (it's probably not what you think)",
        body: "Most lower back pain in people who train is not caused by one dramatic injury. It usually comes from repetitive poor movement under load over time.\n\nSome of the most common issues I see are:\n\nLumbar flexion under load: rounding your lower back during deadlifts, squats, rows, or hinging movements. When this happens repeatedly under load, your lower back starts taking stress it was never meant to handle.\n\nNo proper hip hinge pattern: if you do not know how to hinge through the hips properly, your lower back starts compensating for movements your glutes and hamstrings should be handling.\n\nWeak glutes and poor posterior chain strength: your glutes, hamstrings, and spinal stabilizers help protect your lower back. If they are weak or undertrained, your body will compensate somewhere else.\n\nNo warm-up or mobility work: going from sitting all day straight into loaded training without preparing your hips, core, and thoracic spine is one of the fastest ways to irritate your back.",
      },
      {
        heading: "The movements that help (not hurt)",
        body: "When rebuilding from back pain, these are some of the movements that helped me the most and that I now use constantly with clients:\n\nDead bug: teaches core stability and anti-extension strength without loading the spine.\n\nBird dog: helps build spinal stability while teaching your body to resist rotation and maintain control.\n\nGlute bridge and hip thrust: some of the best exercises for rebuilding glute strength without compressing the spine heavily.\n\nPallof press: incredible for anti-rotation core stability and teaching your core to resist movement instead of constantly creating it.\n\nFarmer's carry: one of the most underrated exercises for full-body stability, posture, grip strength, and core control.",
      },
      {
        heading: "What to avoid (temporarily, not forever)",
        body: "When your back is flared up or irritated, this usually is not the time to ego lift. Some things that often need to be reduced temporarily:\n\nHeavy spinal loading: heavy barbell squats and deadlifts are not always the best choice when movement quality is poor and your back is irritated. That does not mean you stop training completely. It just means you find smarter variations temporarily.\n\nExercises where you feel your lower back more than the target muscle: if every glute exercise turns into a lower back exercise, your body is compensating somewhere.\n\nHigh-volume explosive training: very high-rep, ballistic, or explosive movements can create even more irritation when your back is already inflamed.",
      },
      {
        heading: "My experience",
        body: "I spent almost a year unable to train the way I wanted. Not because my injury was catastrophic, but because I did not understand what was actually causing the pain. My hip hinge was poor, my glutes were weak, I had almost no stability work in my programming, and I kept trying to push harder instead of fixing the foundation first.\n\nOnce I rebuilt my movement properly, everything changed.\n\nI have trained consistently without back pain since, and honestly, that experience completely changed the way I look at fitness and programming.\n\nIt is also a huge part of why Training Foundations is built the way it is. Every module focuses on movement quality, stability, proper progression, and building the kind of strength that actually supports your body long term.",
      },
    ],
  },
  {
    slug: "how-to-hip-hinge",
    title: "How to Hip Hinge Correctly (The Foundation of Every Major Lift)",
    date: "2025-04-24",
    excerpt:
      "The hip hinge is the most important movement pattern in strength training. And most people never actually learn it. Here's exactly how to do it, and why getting it right changes everything.",
    readingTime: 5,
    sections: [
      {
        body: "If I could teach every beginning lifter one thing before they ever touched a barbell, it would be the hip hinge. Not a squat. Not a deadlift. Not a bench press. The hip hinge. Because the hip hinge is the foundation underneath all of them. And most people have never been shown how to actually do it.",
      },
      {
        heading: "What is the hip hinge?",
        body: "The hip hinge is a movement pattern where you bend forward by pushing your hips back while keeping your spine neutral. It sounds simple. It's not. Most people, when told to bend forward, bend their lower back instead of their hips. This distinction matters enormously. When you load a lumbar flexion pattern (lower back rounding forward), you're compressing your discs and taking the work away from the muscles that are supposed to be doing it: your glutes and hamstrings. When you load a proper hip hinge (hips push back, spine stays long), you activate the posterior chain and protect your spine.",
      },
      {
        heading: "How to practice the hip hinge",
        body: "Here's the simplest drill:\n\nStand about a foot away from a wall. Push your hips back until they touch the wall. Notice what happened: your hips went back, your chest tipped slightly forward, but your lower back stayed neutral. That's the hip hinge.\n\nStep 2: Move farther from the wall. Two feet, three feet. The more distance, the deeper the hinge. Each time, you're training your body to find the movement from the hip joint, not the lower back.\n\nStep 3: Add a dowel rod or broomstick along your spine. Hold it in contact with three points: the back of your head, between your shoulder blades, and your tailbone. Now hinge. If the rod loses contact at any point, you've lost your neutral spine.",
      },
      {
        heading: "Common hip hinge mistakes",
        body: "Rounding the lower back: the most common and most harmful. Usually happens when the hamstrings are tight or when someone is moving too fast.\n\nHyperextending the lower back at the top: locking out by pushing your hips too far forward and arching aggressively. This compresses your lumbar vertebrae from the opposite direction.\n\nBending the knees too much: this turns a hip hinge into a squat. The hip hinge keeps a soft knee bend (not straight, not heavily bent). If your hips are dropping and your knees are bending significantly, you're squatting.\n\nShifting forward onto the toes: in a hip hinge, your weight should stay in your mid-foot to heel. If you're going up onto your toes, your hips aren't going back far enough.",
      },
      {
        heading: "Where the hip hinge shows up",
        body: "Once you have a solid hip hinge, you'll recognize it in:\n\nDeadlift: the entire setup and pull is a hip hinge pattern.\nRomanian deadlift: this is the hip hinge with load, with a focus on the eccentric (lowering) phase.\nKettlebell swing: a dynamic, explosive hip hinge.\nGood mornings: a loaded hip hinge without pulling anything from the floor.\nSingle-leg Romanian deadlift: a unilateral hip hinge that challenges balance and reveals left/right asymmetry.",
      },
      {
        heading: "Why this matters more than any single exercise",
        body: "You can go your entire fitness career doing exercises that involve a hip hinge without ever actually learning the pattern correctly. You'll get some results. You'll also accumulate wear on your lower back that will eventually catch up with you. Learning the hip hinge properly, not just understanding it conceptually but training it until it's automatic, is one of the best investments you can make in your long-term health and training.",
      },
    ],
  },
  {
    slug: "online-personal-trainer-for-women",
    title: "What to Look for in an Online Personal Trainer for Women",
    date: "2025-05-01",
    excerpt:
      "The online fitness space is full of people calling themselves coaches. Here's what actually separates a trainer who will get you real results from one who will waste your time and money.",
    readingTime: 6,
    sections: [
      {
        body: "Finding a good online personal trainer is harder than it should be. Everyone has a certification. Everyone has transformation photos. Everyone is promising the same results in slightly different packaging. So how do you actually find someone who's going to help you, and not just hand you a generic plan with your name on it? Here's what I'd look for, based on my experience both as a certified trainer and as someone who spent years trying different approaches before figuring out what actually works.",
      },
      {
        heading: "They can explain the why, not just the what",
        body: "Any trainer can hand you a list of exercises. A good online strength coach can tell you exactly why those exercises are in your program: what they're targeting, how they relate to your goals, what they're building toward. If you ask a trainer why they've programmed Romanian deadlifts in week one and they can't get past 'it's great for your glutes,' that's a sign. A good coach understands programming design. They know how movements fit together. They can explain how a warm-up connects to the working sets, and why the cool-down matters beyond just stretching.\n\nGood coaching should make training feel clearer and more structured over time. You should understand why you're progressing, not just follow workouts without any real direction.",
      },
      {
        heading: "Their approach is specific to you, not generic",
        body: "The most common problem with online coaching programs is that the plans aren't actually personalized. They're templates with your name swapped in. Most custom workout plans are the same PDF sold to hundreds of people with minor adjustments. Ask any trainer you're considering: how do you adjust programming for someone with a specific injury history? How do you modify for someone who only has access to dumbbells? What happens if I miss a week? The answers will tell you quickly whether they have a real process for individual programming or whether they're running the same plan for everyone.",
      },
      {
        heading: "They have real credentials and experience",
        body: "A certification from a recognized organization (NASM, ACE, NSCA, ISSA, ACSM) matters. It tells you that someone has, at minimum, been tested on the fundamentals of anatomy, programming, and exercise science. Credentials alone aren't enough, but they're a reasonable baseline. Beyond the cert: look at their own training history. Do they practice what they teach? Have they dealt with real challenges in their own training: injury, plateaus, rebuilding? A trainer who has been through those things understands what their clients are going through in a way that someone who hasn't can't fully grasp.",
      },
      {
        heading: "Red flags to watch for",
        body: "Before-and-after photos as the primary selling point: transformation photos are often cherry-picked, staged, or outright misleading. They don't tell you anything about programming quality or coaching depth.\n\nPromises of fast results: any trainer promising significant body composition changes in 30 days or less is either not being honest with you or setting you up for a crash-and-burn.\n\nNo discovery call or intake process: a trainer who sells you an online coaching program without learning anything about your history, goals, limitations, or schedule isn't personalizing anything.\n\nVague about their methods: if they can't explain their approach clearly in plain language, they don't have one.\n\nIf you're wondering whether online personal training is worth it, these questions are a good place to start.",
      },
      {
        heading: "What I offer",
        body: "I'm a certified personal trainer and the creator of Training Foundations, a structured strength program built for beginners, returners, and anyone who wants to rebuild their foundation the right way.\n\nI created it because the programs I followed before getting injured taught me how to push harder, but not how to move properly.\n\nI also offer 1:1 online coaching for people who want a more personalized approach. Custom programming, form feedback, progress tracking, and real communication throughout the process.\n\nIf you're tired of random workouts, feeling stuck, or constantly dealing with pain and setbacks, I'd love to help you build strength in a way that actually lasts.",
      },
    ],
  },
  {
    slug: "how-to-build-a-workout-routine",
    title: "How to Build a Workout Routine from Scratch",
    date: "2025-05-08",
    excerpt:
      "Building a workout routine isn't about finding the perfect program. It's about understanding a few principles that make any program work. Here's what actually matters and what to do with it.",
    readingTime: 7,
    sections: [
      {
        body: "When most people say they want to build a workout routine, what they actually want is a list of exercises they can follow without having to think too much. That's understandable. But it's also why most people keep hopping between programs and never making real progress. Understanding the principles underneath a solid strength training routine means you can troubleshoot what's not working, adapt when life gets in the way, and stop guessing. Here's what actually matters.",
      },
      {
        heading: "Start with frequency: how many days per week",
        body: "For most beginners, three days per week is the right number. It's enough to make real progress, with enough recovery time between sessions for your body to actually adapt. People massively overcomplicate this. Training five or six days a week as a beginner usually just means accumulating fatigue faster than you can adapt.\n\nIf you're building a three-day gym routine, space the sessions out. Monday, Wednesday, Friday works. So does Tuesday, Thursday, Saturday. The specific days matter less than the rest days between them.",
      },
      {
        heading: "Choose a structure: full body vs. splits",
        body: "For beginners, a full body workout routine is almost always the right choice over a training split. When you're new to lifting, your ability to recover is high relative to the demands you're placing on your body. You can train legs, push muscles, and pull muscles in the same session, recover overnight, and come back two days later ready to go again. Each muscle group gets trained three times per week, which is more effective than any workout split at this stage.\n\nSplits (chest day, leg day, back day) make sense eventually, when training volume is high enough that a muscle group needs a full day to recover. As a beginner, you're nowhere near that volume. Most beginners who follow a workout split end up doing too little per session and too little per muscle group. Full body training solves both.",
      },
      {
        heading: "Select compound movements as your foundation",
        body: "A compound movement is any exercise that involves multiple joints and muscle groups simultaneously. Squat, deadlift, bench press, row, overhead press, pull-up. If you want to understand the pattern underneath most of these, start with the [hip hinge](/blog/how-to-hip-hinge). These movements should form the core of every beginner strength training routine because:\n\n- They train more muscle in less time.\n- They develop coordination across multiple muscle groups.\n- They allow for easy progression week over week.\n- They have direct carryover to real-world movement.\n\nAccessory exercises (bicep curls, tricep extensions, lateral raises) have their place. But they should be supporting your compound lifts, not replacing them. If you're spending most of your session on isolation work, your program needs restructuring.",
      },
      {
        heading: "Build in progressive overload",
        body: "Progressive overload is the single most important principle in strength training. Your body needs to be consistently challenged slightly beyond what it has already adapted to in order to keep improving. In practice, for beginners this usually means:\n\n- Adding weight when you can complete all reps with good form.\n- Adding reps within a range before adding weight.\n- Reducing rest time as your conditioning improves.\n\nIf you are doing the same weights, same reps, same rest periods week after week, your body has adapted. You are maintaining, not progressing. This is exactly why tracking your workouts matters. You cannot chase progressive overload if you don't know what you lifted last session.",
      },
      {
        heading: "Don't skip the warm-up",
        body: "A warm-up is not five minutes on the treadmill and a few arm circles. A proper warm-up for strength training has a specific purpose: to activate the muscles you're about to use, increase range of motion in the joints those muscles cross, and prime your nervous system for coordinated movement under load. At minimum, ten minutes of targeted mobility and activation work before every session.\n\nFor lower body days: hip circles, hip flexor stretches, glute bridges, lateral band walks. For upper body days: thoracic rotation, band pull-aparts, scapular push-ups, arm circles.\n\nThis is not optional. It's the difference between training well and training through increasing levels of dysfunction. Most people who end up with [back pain from the gym](/blog/back-pain-and-the-gym) skipped this step consistently for months before it caught up with them.",
      },
      {
        heading: "The simplest structure that works",
        body: "If you want a starting point:\n\n- Three days per week, full body.\n- Each session: 10-minute warm-up, 4 to 5 compound movements (1 squat pattern, 1 hip hinge, 1 push, 1 pull, 1 carry or core), 5-minute cool-down.\n- 3 sets of 8 to 12 reps on each movement.\n- Add weight or reps each session as long as form holds.\n\nThis structure has been working for beginning lifters for decades. You don't need anything more complex until you've fully mastered this. And mastering this will take longer than most people expect.\n\nMost people don't need a more complicated program. They need more consistency with the fundamentals. If you want somewhere structured to start, that's exactly what [Training Foundations](/courses) is built around.",
      },
    ],
  },
]

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}
