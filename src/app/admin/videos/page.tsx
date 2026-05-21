"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import SlotCard from "@/components/admin/SlotCard"
import type { Schema } from "@/lib/amplifyConfig"
import { VIDEO_SLOTS, VIDEO_SLOT_LABELS } from "@/lib/videoSlots"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Asset = { assignedTo: string; url?: string | null; isPublished: boolean; title: string }

const GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "Landing Page",
    keys: ["lp_trailer"],
  },
  {
    label: "Module 1 — Foundation Movements",
    keys: ["m1_hip_hinge", "m1_goblet_squat", "m1_db_bench_press", "m1_db_row", "m1_lat_pulldown"],
  },
  {
    label: "Module 2 — Core & Glute Priority",
    keys: ["m2_dead_bug", "m2_bird_dog", "m2_glute_bridge", "m2_band_monster_walk", "m2_lateral_band_walk", "m2_hip_abduction", "m2_hip_thrust", "m2_hip_thrust_var", "m2_rdl", "m2_pallof_press", "m2_farmers_carry"],
  },
  {
    label: "Module 3 — Day A Warm-Up",
    keys: ["m3a_wu_9090_hip", "m3a_wu_worlds_stretch", "m3a_wu_cat_cow", "m3a_wu_thoracic_rot", "m3a_wu_glute_bridge", "m3a_wu_lat_band_walk", "m3a_wu_leg_swing_fb", "m3a_wu_leg_swing_ss", "m3a_wu_lateral_lunge"],
  },
  {
    label: "Module 3 — Day A Working Sets",
    keys: ["m3a_goblet_squat", "m3a_rdl", "m3a_hip_thrust", "m3a_hip_thrust_var", "m3a_seated_band_abd", "m3a_dead_bug", "m3a_farmers_carry"],
  },
  {
    label: "Module 3 — Day A Cool-Down",
    keys: ["m3a_cd_hip_flexor", "m3a_cd_hamstring", "m3a_cd_figure4", "m3a_cd_childs_pose"],
  },
  {
    label: "Module 3 — Day B Warm-Up",
    keys: ["m3b_wu_cat_cow", "m3b_wu_thoracic_rot", "m3b_wu_worlds_stretch", "m3b_wu_arm_circles", "m3b_wu_band_pull_apart", "m3b_wu_ytw_raise", "m3b_wu_bird_dog", "m3b_wu_pushup"],
  },
  {
    label: "Module 3 — Day B Working Sets",
    keys: ["m3b_db_bench", "m3b_pushup", "m3b_ohp", "m3b_chest_row", "m3b_band_pullup", "m3b_db_curl", "m3b_tri_extension", "m3b_bird_dog", "m3b_pallof_press"],
  },
  {
    label: "Module 3 — Day B Cool-Down",
    keys: ["m3b_cd_open_book", "m3b_cd_band_lat", "m3b_cd_thread_needle", "m3b_cd_triceps"],
  },
  {
    label: "Module 3 — Day C Warm-Up",
    keys: ["m3c_wu_9090_hip", "m3c_wu_cat_cow", "m3c_wu_thoracic_rot", "m3c_wu_worlds_stretch", "m3c_wu_glute_bridge", "m3c_wu_bird_dog", "m3c_wu_scap_pushup", "m3c_wu_stand_band_abd", "m3c_wu_leg_swing_fb", "m3c_wu_leg_swing_ss", "m3c_wu_lateral_lunge"],
  },
  {
    label: "Module 3 — Day C Working Sets",
    keys: ["m3c_sl_glute_bridge", "m3c_rev_lunge", "m3c_band_monster_walk", "m3c_lateral_band_walk", "m3c_hip_abduction", "m3c_pushup", "m3c_inv_row", "m3c_dead_bug", "m3c_copenhagen", "m3c_stir_pot"],
  },
  {
    label: "Module 3 — Day C Cool-Down",
    keys: ["m3c_cd_hip_flexor", "m3c_cd_figure4", "m3c_cd_spinal_twist", "m3c_cd_childs_pose"],
  },
]

export default function AdminVideosPage() {
  const [assetMap, setAssetMap] = useState<Record<string, Asset>>({})

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.MediaAsset.list({
      filter: { type: { eq: "VIDEO" } },
      authMode: "userPool",
    }).then(({ data }) => {
      const map: Record<string, Asset> = {}
      for (const a of data) {
        map[a.assignedTo] = { assignedTo: a.assignedTo, url: a.url, isPublished: a.isPublished, title: a.title }
      }
      setAssetMap(map)
    }).catch(() => {})
  }, [])

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Videos
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2.5rem" }}>
        Upload videos for each exercise slot. Once published, the site shows your video instead of YouTube.
      </p>

      {GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: gold,
              marginBottom: "1rem",
              paddingBottom: "0.5rem",
              borderBottom: `1px solid #2a2a2a`,
            }}
          >
            {group.label}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {group.keys.map((key) => (
              <SlotCard
                key={key}
                slotKey={key}
                label={VIDEO_SLOT_LABELS[key] ?? key}
                type="VIDEO"
                asset={assetMap[key] ?? null}
              />
            ))}
          </div>
        </div>
      ))}

      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", borderTop: `1px solid ${border}`, paddingTop: "1.5rem" }}>
        {Object.keys(VIDEO_SLOTS).length} total video slots · {Object.keys(assetMap).length} uploaded
      </p>
    </div>
  )
}
