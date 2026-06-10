import { type ClientSchema, a, defineData } from "@aws-amplify/backend"

const schema = a.schema({
  Lead: a
    .model({
      email: a.string().required(),
      source: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "delete"]),
    ]),
  ContactSubmission: a
    .model({
      name: a.string().required(),
      email: a.string().required(),
      message: a.string().required(),
      type: a.enum(["coaching", "contact"]),
      status: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "update", "delete"]),
    ]),
  Purchase: a
    .model({
      email: a.string().required(),
      name: a.string(),
      stripePaymentIntentId: a.string().required(),
      purchasedAt: a.datetime().required(),
      promoCode: a.string(),
      amountPaidCents: a.integer(),
      discountPct: a.integer(),
      includesTracker: a.boolean(),
      source: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "update", "delete"]),
    ]),
  MediaAsset: a
    .model({
      type: a.enum(["VIDEO", "PHOTO"]),
      title: a.string().required(),
      s3Key: a.string().required(),
      url: a.string(),
      assignedTo: a.string().required(),
      isPublished: a.boolean().required(),
      fileSize: a.integer(),
      mimeType: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.guest().to(["read"]),
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  // ── Masterclass ────────────────────────────────────────────────────────────

  ExerciseVideo: a
    .model({
      slug: a.string().required(),
      name: a.string().required(),
      s3Key: a.string().required(),
      url: a.string().required(),
      durationSeconds: a.integer(),
      muscleGroups: a.string(),
      equipment: a.string(),
      tags: a.string(),
      isPublished: a.boolean().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  WorkoutBlock: a
    .model({
      title: a.string().required(),
      blockNumber: a.integer().required(),
      startDate: a.string().required(),
      days: a.string().required(),
      isPublished: a.boolean().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  QAndAEntry: a
    .model({
      userEmail: a.string().required(),
      question: a.string().required(),
      answer: a.string(),
      status: a.enum(["PENDING", "ANSWERED", "PUBLISHED"]),
      isPublic: a.boolean(),
      answeredAt: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "update", "delete"]),
    ]),

  // ── Coaching Portal ────────────────────────────────────────────────────────

  CoachingClient: a
    .model({
      email: a.string().required(),
      displayName: a.string().required(),
      phone: a.string(),
      status: a.enum(["ACTIVE", "PAUSED", "INACTIVE"]),
      goal: a.string(),
      currentPhase: a.string(),
      startDate: a.string(),
      currentProgramId: a.string(),
      weightUnit: a.enum(["LBS", "KG"]),
      tags: a.string(),
      privateNotes: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Exercise: a
    .model({
      name: a.string().required(),
      videoS3Key: a.string(),
      thumbnailS3Key: a.string(),
      primaryMuscle: a.string(),
      secondaryMuscles: a.string(),
      equipment: a.string(),
      category: a.string(),
      difficulty: a.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
      movementPattern: a.string(),
      coachingCues: a.string(),
      commonMistakes: a.string(),
      setup: a.string(),
      execution: a.string(),
      notes: a.string(),
      substitutions: a.string(),
      status: a.enum(["ACTIVE", "INACTIVE"]),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  CoachingProgram: a
    .model({
      name: a.string().required(),
      clientEmail: a.string(),
      isTemplate: a.boolean(),
      status: a.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]),
      weeks: a.string().required(),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  CoachingWorkoutLog: a
    .model({
      clientEmail: a.string().required(),
      programId: a.string().required(),
      weekNumber: a.integer().required(),
      dayLabel: a.string().required(),
      completedAt: a.string().required(),
      setData: a.string().required(),
      overallRpe: a.integer(),
      energyLevel: a.integer(),
      clientNotes: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  ClientProgressSnapshot: a
    .model({
      clientEmail: a.string().required(),
      snapshotDate: a.string().required(),
      weight: a.float(),
      weightUnit: a.enum(["LBS", "KG"]),
      waist: a.float(),
      hips: a.float(),
      glutes: a.float(),
      chest: a.float(),
      arm: a.float(),
      thigh: a.float(),
      customMeasurements: a.string(),
      photoS3Keys: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  CoachingGoal: a
    .model({
      clientEmail: a.string().required(),
      type: a.string().required(),
      label: a.string(),
      startDate: a.string(),
      targetDate: a.string(),
      startValue: a.float(),
      targetValue: a.float(),
      currentValue: a.float(),
      unit: a.string(),
      notes: a.string(),
      status: a.enum(["ON_TRACK", "NEEDS_ATTENTION", "ACHIEVED"]),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  CoachingCheckIn: a
    .model({
      clientEmail: a.string().required(),
      submittedAt: a.string().required(),
      status: a.enum(["PENDING", "REVIEWED"]),
      weight: a.float(),
      weightUnit: a.enum(["LBS", "KG"]),
      sleepQuality: a.integer(),
      energyLevel: a.integer(),
      hungerLevel: a.integer(),
      stressLevel: a.integer(),
      digestion: a.integer(),
      trainingPerformance: a.integer(),
      nutritionAdherence: a.integer(),
      workoutConsistency: a.integer(),
      wins: a.string(),
      struggles: a.string(),
      questionsForCoach: a.string(),
      additionalNotes: a.string(),
      measurementSnapshot: a.string(),
      photoS3Keys: a.string(),
      coachFeedback: a.string(),
      reviewedAt: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  CoachingMessage: a
    .model({
      threadId: a.string().required(),
      fromEmail: a.string().required(),
      toEmail: a.string().required(),
      body: a.string().required(),
      sentAt: a.string().required(),
      readAt: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  CoachTask: a
    .model({
      title: a.string().required(),
      clientEmail: a.string(),
      dueDate: a.string(),
      completedAt: a.string(),
      priority: a.enum(["HIGH", "MEDIUM", "LOW"]),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "identityPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
})
