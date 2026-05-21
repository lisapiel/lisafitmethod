// Maps every video slot key to its YouTube fallback ID.
// Module pages use these keys to look up S3-hosted videos; if none is uploaded yet,
// the YouTube embed is shown instead.

export const VIDEO_SLOTS: Record<string, string> = {
  // ── Module 1 — Foundation Movements ──────────────────────────────────────
  m1_hip_hinge:          "AyY0C8s5scU",
  m1_goblet_squat:       "NYf82VuzrQM",
  m1_db_bench_press:     "vZTUnLTRkOg",
  m1_db_row:             "eKT-r-SV4x0",
  m1_lat_pulldown:       "O6lwJdTd_K4",

  // ── Module 2 — Core & Glute Priority ─────────────────────────────────────
  m2_dead_bug:           "tDG5Ln8XUo8",
  m2_bird_dog:           "Mr73_KR-fS8",
  m2_glute_bridge:       "0mn6xjwzCvs",
  m2_band_monster_walk:  "cR8WIVDloo4",
  m2_lateral_band_walk:  "4yr4bFNYX9w",
  m2_hip_abduction:      "efiJbMV-ZaE",
  m2_hip_thrust:         "Rxxd0gmzwFU",
  m2_hip_thrust_var:     "8bSvHhnWVnE",
  m2_rdl:                "AyY0C8s5scU",
  m2_pallof_press:       "lae10X6yOII",
  m2_farmers_carry:      "vJIu3hgUYlg",

  // ── Module 3 — Day A Warm-Up ──────────────────────────────────────────────
  m3a_wu_9090_hip:       "VbjfMt1C_y8",
  m3a_wu_worlds_stretch: "FYWN63ij0bE",
  m3a_wu_cat_cow:        "SboCzGvi8RE",
  m3a_wu_thoracic_rot:   "VYMF16KVAw8",
  m3a_wu_glute_bridge:   "0mn6xjwzCvs",
  m3a_wu_lat_band_walk:  "4yr4bFNYX9w",
  m3a_wu_leg_swing_fb:   "8BgLrTI2SO4",
  m3a_wu_leg_swing_ss:   "o0oRKIM1cTo",
  m3a_wu_lateral_lunge:  "EVKyneKe5w8",

  // ── Module 3 — Day A Working Sets ─────────────────────────────────────────
  m3a_goblet_squat:      "NYf82VuzrQM",
  m3a_rdl:               "AyY0C8s5scU",
  m3a_hip_thrust:        "Rxxd0gmzwFU",
  m3a_hip_thrust_var:    "8bSvHhnWVnE",
  m3a_seated_band_abd:   "qVEzTP09HC0",
  m3a_dead_bug:          "tDG5Ln8XUo8",
  m3a_farmers_carry:     "vJIu3hgUYlg",

  // ── Module 3 — Day A Cool-Down ────────────────────────────────────────────
  m3a_cd_hip_flexor:     "cfqgjN8b2vg",
  m3a_cd_hamstring:      "4vIoROvmLQM",
  m3a_cd_figure4:        "5QdSahBkG20",
  m3a_cd_childs_pose:    "NWUojZcToTE",

  // ── Module 3 — Day B Warm-Up ──────────────────────────────────────────────
  m3b_wu_cat_cow:        "SboCzGvi8RE",
  m3b_wu_thoracic_rot:   "VYMF16KVAw8",
  m3b_wu_worlds_stretch: "FYWN63ij0bE",
  m3b_wu_arm_circles:    "S1uYL7_nL00",
  m3b_wu_band_pull_apart:"H-RxZVrZH2I",
  m3b_wu_ytw_raise:      "JYsBIb4R4xo",
  m3b_wu_bird_dog:       "Mr73_KR-fS8",
  m3b_wu_pushup:         "oZmBz-BN7ZY",

  // ── Module 3 — Day B Working Sets ─────────────────────────────────────────
  m3b_db_bench:          "vZTUnLTRkOg",
  m3b_pushup:            "oZmBz-BN7ZY",
  m3b_ohp:               "H8-O20oL3yc",
  m3b_chest_row:         "eKT-r-SV4x0",
  m3b_band_pullup:       "H-RxZVrZH2I",
  m3b_db_curl:           "rPcp_rfWLRU",
  m3b_tri_extension:     "uht9IRmLvcQ",
  m3b_bird_dog:          "Mr73_KR-fS8",
  m3b_pallof_press:      "lae10X6yOII",

  // ── Module 3 — Day B Cool-Down ────────────────────────────────────────────
  m3b_cd_open_book:      "YJ92IS_RuRY",
  m3b_cd_band_lat:       "lQuimKNJRWU",
  m3b_cd_thread_needle:  "GJGSah1mNWw",
  m3b_cd_triceps:        "44rhonVBVRU",

  // ── Module 3 — Day C Warm-Up ──────────────────────────────────────────────
  m3c_wu_9090_hip:       "VbjfMt1C_y8",
  m3c_wu_cat_cow:        "SboCzGvi8RE",
  m3c_wu_thoracic_rot:   "VYMF16KVAw8",
  m3c_wu_worlds_stretch: "FYWN63ij0bE",
  m3c_wu_glute_bridge:   "0mn6xjwzCvs",
  m3c_wu_bird_dog:       "Mr73_KR-fS8",
  m3c_wu_scap_pushup:    "R5JZAA4tueY",
  m3c_wu_stand_band_abd: "bJ_Wanodamo",
  m3c_wu_leg_swing_fb:   "8BgLrTI2SO4",
  m3c_wu_leg_swing_ss:   "o0oRKIM1cTo",
  m3c_wu_lateral_lunge:  "EVKyneKe5w8",

  // ── Module 3 — Day C Working Sets ─────────────────────────────────────────
  m3c_sl_glute_bridge:   "95b9yp9kfEg",
  m3c_rev_lunge:         "ysR2LxObJbo",
  m3c_band_monster_walk: "cR8WIVDloo4",
  m3c_lateral_band_walk: "4yr4bFNYX9w",
  m3c_hip_abduction:     "efiJbMV-ZaE",
  m3c_pushup:            "oZmBz-BN7ZY",
  m3c_inv_row:           "BKEfa9ixLuc",
  m3c_dead_bug:          "tDG5Ln8XUo8",
  m3c_copenhagen:        "i1Ll-EnhYhQ",
  m3c_stir_pot:          "WaOewOUic3c",

  // ── Module 3 — Day C Cool-Down ────────────────────────────────────────────
  m3c_cd_hip_flexor:     "cfqgjN8b2vg",
  m3c_cd_figure4:        "5QdSahBkG20",
  m3c_cd_spinal_twist:   "3miActosoI8",
  m3c_cd_childs_pose:    "NWUojZcToTE",

  // ── Landing Page ─────────────────────────────────────────────────────────
  lp_trailer:            "",
}

export const PHOTO_SLOTS: Record<string, string> = {
  hero:          "Landing page hero image",
  banner:        "Landing page banner (wide/horizontal)",
  testimonials:  "Testimonials screenshot",
  module1_cover: "Module 1 cover photo",
  module2_cover: "Module 2 cover photo",
  module3_cover: "Module 3 cover photo",
  module4_cover: "Module 4 cover photo",
  about_bio:     "About / bio photo",
}

export type VideoSlotKey = keyof typeof VIDEO_SLOTS
export type PhotoSlotKey = keyof typeof PHOTO_SLOTS

// Human-readable labels for the admin UI
export const VIDEO_SLOT_LABELS: Record<string, string> = {
  m1_hip_hinge:          "Hip Hinge",
  m1_goblet_squat:       "Goblet Squat",
  m1_db_bench_press:     "Dumbbell Bench Press",
  m1_db_row:             "Dumbbell Row",
  m1_lat_pulldown:       "Lat Pulldown",

  m2_dead_bug:           "Dead Bug",
  m2_bird_dog:           "Bird Dog",
  m2_glute_bridge:       "Glute Bridge",
  m2_band_monster_walk:  "Band Monster Walk",
  m2_lateral_band_walk:  "Lateral Band Walk",
  m2_hip_abduction:      "Side Lying Hip Abduction",
  m2_hip_thrust:         "Hip Thrust",
  m2_hip_thrust_var:     "Hip Thrust (variation)",
  m2_rdl:                "Romanian Deadlift",
  m2_pallof_press:       "Pallof Press",
  m2_farmers_carry:      "Farmer's Carry",

  m3a_wu_9090_hip:       "90/90 Hip Stretch",
  m3a_wu_worlds_stretch: "World's Greatest Stretch",
  m3a_wu_cat_cow:        "Cat-Cow",
  m3a_wu_thoracic_rot:   "Thoracic Rotation",
  m3a_wu_glute_bridge:   "Glute Bridge (activation)",
  m3a_wu_lat_band_walk:  "Lateral Band Walk (activation)",
  m3a_wu_leg_swing_fb:   "Leg Swing Front to Back",
  m3a_wu_leg_swing_ss:   "Leg Swing Side to Side",
  m3a_wu_lateral_lunge:  "Lateral Lunge",
  m3a_goblet_squat:      "Goblet Squat",
  m3a_rdl:               "Romanian Deadlift",
  m3a_hip_thrust:        "Hip Thrust",
  m3a_hip_thrust_var:    "Hip Thrust (variation)",
  m3a_seated_band_abd:   "Seated Band Abduction",
  m3a_dead_bug:          "Dead Bug",
  m3a_farmers_carry:     "Farmer's Carry",
  m3a_cd_hip_flexor:     "Kneeling Hip Flexor Stretch",
  m3a_cd_hamstring:      "90/90 Hamstring Stretch",
  m3a_cd_figure4:        "Figure 4 Stretch",
  m3a_cd_childs_pose:    "Child's Pose",

  m3b_wu_cat_cow:        "Cat-Cow",
  m3b_wu_thoracic_rot:   "Thoracic Rotation",
  m3b_wu_worlds_stretch: "World's Greatest Stretch",
  m3b_wu_arm_circles:    "Arm Circles",
  m3b_wu_band_pull_apart:"Band Pull-Apart",
  m3b_wu_ytw_raise:      "YTW Raise",
  m3b_wu_bird_dog:       "Bird Dog (activation)",
  m3b_wu_pushup:         "Push-Up (prep)",
  m3b_db_bench:          "Dumbbell Bench Press",
  m3b_pushup:            "Push-Up",
  m3b_ohp:               "Overhead Press",
  m3b_chest_row:         "Chest Supported Row",
  m3b_band_pullup:       "Band Assisted Pull-Up",
  m3b_db_curl:           "Dumbbell Curl",
  m3b_tri_extension:     "Overhead Tricep Extension",
  m3b_bird_dog:          "Bird Dog",
  m3b_pallof_press:      "Pallof Press",
  m3b_cd_open_book:      "Open Book Stretch",
  m3b_cd_band_lat:       "Band Lat Stretch",
  m3b_cd_thread_needle:  "Thread the Needle Stretch",
  m3b_cd_triceps:        "Triceps Stretch",

  m3c_wu_9090_hip:       "90/90 Hip Stretch",
  m3c_wu_cat_cow:        "Cat-Cow",
  m3c_wu_thoracic_rot:   "Thoracic Rotation",
  m3c_wu_worlds_stretch: "World's Greatest Stretch",
  m3c_wu_glute_bridge:   "Glute Bridge (activation)",
  m3c_wu_bird_dog:       "Bird Dog (activation)",
  m3c_wu_scap_pushup:    "Scapular Push-Up",
  m3c_wu_stand_band_abd: "Standing Band Abduction",
  m3c_wu_leg_swing_fb:   "Leg Swing Front to Back",
  m3c_wu_leg_swing_ss:   "Leg Swing Side to Side",
  m3c_wu_lateral_lunge:  "Lateral Lunge",
  m3c_sl_glute_bridge:   "Single Leg Glute Bridge",
  m3c_rev_lunge:         "Reverse Lunge",
  m3c_band_monster_walk: "Band Monster Walk",
  m3c_lateral_band_walk: "Lateral Band Walk",
  m3c_hip_abduction:     "Side Lying Hip Abduction",
  m3c_pushup:            "Push-Up",
  m3c_inv_row:           "Inverted Row Overhand",
  m3c_dead_bug:          "Dead Bug",
  m3c_copenhagen:        "Copenhagen Plank",
  m3c_stir_pot:          "Stability Ball Stir-the-Pot",
  m3c_cd_hip_flexor:     "Kneeling Hip Flexor Stretch",
  m3c_cd_figure4:        "Figure 4 Stretch",
  m3c_cd_spinal_twist:   "Lying Spinal Twist",
  m3c_cd_childs_pose:    "Child's Pose",

  lp_trailer:            "Landing Page Trailer Video",
}
