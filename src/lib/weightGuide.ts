// Which weight-logging convention to explain for an exercise, from the
// library's category and equipment tags. Anything that doesn't clearly fit
// one convention gets the general guide instead of a guessed rule. This is
// guidance for future logging only; logged values are never reinterpreted.

export type WeightGuideKind = "db-upper" | "db-lower" | "barbell" | "kb-upper" | "kb-lower" | "kettlebell" | "machine" | "bodyweight" | "general"

const LOWER = ["leg", "glute", "posterior chain", "lower", "lower body", "calves", "adductors", "hips"]
const UPPER = ["upper", "upper body", "back", "push", "pull", "grip"]

const BODYWEIGHT_GEAR = new Set([
  "mat", "none", "bench", "ab bench", "abs bench", "box", "wall", "pull up bar", "trx", "stability ball", "bosu",
  "dip bars", "roman chair", "sliders", "foam roller", "ham roller", "ab roller",
])
const BARBELLS = new Set(["barbell", "ez bar", "trap bar", "bar"])
// Machines with a pin-selected stack. Plate-loaded machines (leg press, hack
// squat, plate-loaded press) and the Smith machine have no single number to
// read off, so they fall through to the general guide.
const STACK_MACHINES = new Set([
  "cable machine", "cable lat pulldown", "cable row", "rope", "chest fly machine", "chest press machine",
  "glute kickack machine", "hip thrust machine", "incline chest press machine", "lat pulldown machine",
  "leg extension machine", "lying leg curl", "machine hip abduction", "machine hip adduction", "preacher curl machine",
  "rear delt fly machine", "seated calf raise machine", "seated leg curl machine", "seated torso rotation machine",
])

function region(category: string): "upper" | "lower" | null {
  const tokens = category.toLowerCase().split(",").map((t) => t.trim()).filter(Boolean)
  if (tokens.includes("full body")) return null
  const lower = tokens.some((t) => LOWER.includes(t))
  const upper = tokens.some((t) => UPPER.includes(t) || t.startsWith("upper"))
  if (lower && !upper) return "lower"
  if (upper && !lower) return "upper"
  return null
}

export function weightGuideKind(category: string | null | undefined, equipment: string[] | null | undefined): WeightGuideKind {
  const eq = (equipment ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean)
  if (eq.length === 0) return "general"
  const loads = new Set<string>()
  for (const e of eq) {
    if (BODYWEIGHT_GEAR.has(e)) continue
    if (e === "dumbbell") loads.add("dumbbell")
    else if (e === "kettlebell") loads.add("kettlebell")
    else if (BARBELLS.has(e)) loads.add("barbell")
    else if (STACK_MACHINES.has(e)) loads.add("machine")
    else return "general"
  }
  if (loads.size === 0) return "bodyweight"
  if (loads.size > 1) return "general"
  const load = [...loads][0]
  if (load === "barbell") return "barbell"
  if (load === "machine") return "machine"
  const r = region(category ?? "")
  if (load === "dumbbell") return r === "upper" ? "db-upper" : r === "lower" ? "db-lower" : "general"
  return r === "upper" ? "kb-upper" : r === "lower" ? "kb-lower" : "kettlebell"
}

export type WeightGuide = { eyebrow: string; title: string; body: string[]; examples: string[] }

export function weightGuide(kind: WeightGuideKind, unit: "lb" | "kg"): WeightGuide {
  const kg = unit === "kg"
  switch (kind) {
    case "db-upper":
      return {
        eyebrow: "Weight · dumbbells", title: "Log the weight of one dumbbell",
        body: ["For upper-body dumbbell exercises, enter the weight of a single dumbbell."],
        examples: kg ? ["Two 12 kg dumbbells → log 12", "One-arm row with a 14 kg dumbbell → log 14"] : ["Two 25 lb dumbbells → log 25", "One-arm row with a 30 lb dumbbell → log 30"],
      }
    case "db-lower":
      return {
        eyebrow: "Weight · dumbbells", title: "Log the total weight you're holding",
        body: ["For leg exercises I track total load, so your numbers compare fairly whether you hold one dumbbell or two."],
        examples: kg ? ["Two 16 kg dumbbells → log 32", "One 16 kg dumbbell → log 16"] : ["Two 40 lb dumbbells → log 80", "One 40 lb dumbbell → log 40"],
      }
    case "barbell":
      return {
        eyebrow: "Weight · barbell", title: "Log the bar plus all the plates",
        body: ["Most standard barbells weigh 45 lb (20 kg). If you're not sure what yours weighs, check the bar or ask at your gym."],
        examples: kg ? ["20 kg bar + two 10 kg plates → log 40"] : ["45 lb bar + two 25 lb plates → log 95"],
      }
    case "kb-upper":
      return {
        eyebrow: "Weight · kettlebell", title: "Log the kettlebell's weight",
        body: ["Enter the weight of the kettlebell. Using two at once? Log the weight of one, the same as with dumbbells."],
        examples: kg ? ["Two 12 kg kettlebells → log 12"] : ["Two 25 lb kettlebells → log 25"],
      }
    case "kb-lower":
      return {
        eyebrow: "Weight · kettlebell", title: "Log the total weight you're holding",
        body: ["Enter the kettlebell's weight. Using two at once? Add them together, the same as with dumbbells for leg exercises."],
        examples: kg ? ["One 16 kg kettlebell → log 16", "Two 16 kg kettlebells → log 32"] : ["One 35 lb kettlebell → log 35", "Two 35 lb kettlebells → log 70"],
      }
    case "kettlebell":
      return {
        eyebrow: "Weight · kettlebell", title: "Log the kettlebell's weight",
        body: ["Enter the weight marked on the kettlebell. If you use two, message me and I'll tell you how to log it for this exercise."],
        examples: [],
      }
    case "machine":
      return {
        eyebrow: "Weight · cable or machine", title: "Log the number on the machine",
        body: ["Enter the weight shown on the stack or pin. Machines differ between gyms, so compare against your own logs on the same machine."],
        examples: [],
      }
    case "bodyweight":
      return {
        eyebrow: "Weight · bodyweight", title: "Only log weight you add",
        body: ["Leave this blank if you're using just your bodyweight.", "Holding a dumbbell or wearing a vest? Enter only that added weight, never your bodyweight."],
        examples: kg ? ["Glute bridge with a 10 kg plate → log 10"] : ["Glute bridge with a 25 lb plate → log 25"],
      }
    default:
      return {
        eyebrow: "Weight", title: "How to log weight",
        body: [
          "Dumbbells, upper body: the weight of one dumbbell.",
          "Dumbbells, leg exercises: the total of both.",
          "Barbell: the bar plus all the plates.",
          "Kettlebell: the kettlebell's weight.",
          "Cable or machine: the number on the stack.",
          "Bodyweight: leave it blank, or enter only the weight you add.",
          "Not sure for this exercise? Message me and I'll tell you.",
        ],
        examples: [],
      }
  }
}
