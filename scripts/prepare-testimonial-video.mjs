// Turn a testimonial video export into the square web asset the preview uses.
//
//   node scripts/prepare-testimonial-video.mjs "/path/to/your-export.mov"
//
// Why this exists: a CapCut 1:1 crop exported onto a 9:16 canvas arrives as a
// square picture with black bars baked above and below it. The square is
// already correctly framed — the bars are padding, not content — so this
// detects them and removes exactly that padding. It never reframes, zooms or
// stretches: if the source is already a true square it is passed through
// untouched.
//
// It also transcodes HEVC to H.264. That part is not cosmetic: HEVC does not
// play in Chrome or Firefox on most platforms, so an HEVC testimonial is
// invisible to a large share of visitors.
//
// Outputs (git-ignored, see public/preview/.gitignore):
//   public/preview/gino-testimonial.mp4   H.264 square, faststart
//   public/preview/gino-testimonial.jpg   matching square poster
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg"
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe"
const OUT_DIR = path.join(process.cwd(), "public", "preview")
const OUT_VIDEO = path.join(OUT_DIR, "gino-testimonial.mp4")
const OUT_POSTER = path.join(OUT_DIR, "gino-testimonial.jpg")
const POSTER_AT = "20"

function run(bin, args) {
  return execFileSync(bin, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 })
}

// Raw bytes, not text. Reading a rawvideo pipe as UTF-8 corrupts every byte
// above 0x7f, which silently destroys the brightness readings below.
function runBinary(bin, args) {
  return execFileSync(bin, args, { maxBuffer: 1024 * 1024 * 256 })
}

function probe(file) {
  const out = run(FFPROBE, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height,codec_name,duration",
    "-of", "json",
    file,
  ])
  const stream = JSON.parse(out).streams?.[0]
  if (!stream) throw new Error("No video stream found in " + file)
  return { width: Number(stream.width), height: Number(stream.height), codec: stream.codec_name }
}

// Find the picture inside a padded frame by reading one greyscale frame and
// locating the first and last row that are not essentially black. More
// reliable than ffmpeg's cropdetect here, because a dark-clothed subject on a
// dim background keeps cropdetect's threshold from tripping.
function detectContentBox(file, width, height) {
  const bytes = runBinary(FFMPEG, [
    "-v", "error", "-ss", POSTER_AT, "-i", file,
    "-frames:v", "1", "-pix_fmt", "gray", "-f", "rawvideo", "-",
  ])
  if (bytes.length < width * height) return null

  const rowMean = (y) => {
    let sum = 0
    for (let x = 0; x < width; x++) sum += bytes[y * width + x]
    return sum / width
  }

  const THRESHOLD = 12
  let top = 0
  let bottom = height - 1
  while (top < height && rowMean(top) <= THRESHOLD) top++
  while (bottom > top && rowMean(bottom) <= THRESHOLD) bottom--
  const contentHeight = bottom - top + 1
  if (contentHeight <= 0 || contentHeight === height) return null
  return { top, height: contentHeight }
}

const source = process.argv[2]
if (!source) {
  console.error('usage: node scripts/prepare-testimonial-video.mjs "/path/to/export.mov"')
  process.exit(2)
}
if (!fs.existsSync(source)) {
  console.error("No such file: " + source)
  process.exit(2)
}

const { width, height, codec } = probe(source)
console.log(`source      : ${width}x${height} ${codec}`)

let filter = null
if (width === height) {
  console.log("square      : yes — passing the frame through untouched")
} else {
  const box = detectContentBox(source, width, height)
  if (box && box.height === width) {
    // The picture inside the padding is exactly as wide as it is tall: this is
    // a true square export sitting on a taller canvas. Drop the padding only.
    filter = `crop=${width}:${width}:0:${box.top}`
    console.log(`letterboxed : yes — square picture at y=${box.top}, removing ${height - width}px of padding`)
  } else if (box) {
    console.error(
      `\nREFUSING TO GUESS: the picture inside this file is ${width}x${box.height}, which is not square.\n` +
      `Re-export from CapCut with the CANVAS set to 1:1 (not just the clip cropped inside a 9:16 canvas),\n` +
      `then run this again. Nothing was written.`
    )
    process.exit(1)
  } else {
    console.error(
      `\nREFUSING TO GUESS: this file is ${width}x${height} with no detectable padding, so making it square\n` +
      `would mean cropping your framing. Re-export from CapCut with the CANVAS set to 1:1.\n` +
      `Nothing was written.`
    )
    process.exit(1)
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const videoArgs = ["-v", "error", "-stats", "-i", source]
if (filter) videoArgs.push("-vf", filter)
videoArgs.push(
  "-c:v", "libx264",
  "-profile:v", "high",
  "-crf", "20",
  "-preset", "slow",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "128k",
  "-movflags", "+faststart",
  OUT_VIDEO, "-y"
)
console.log("encoding    : H.264 + AAC, faststart")
run(FFMPEG, videoArgs)

const posterArgs = ["-v", "error", "-ss", POSTER_AT, "-i", source]
if (filter) posterArgs.push("-vf", filter)
posterArgs.push("-frames:v", "1", "-q:v", "3", OUT_POSTER, "-y")
run(FFMPEG, posterArgs)

const final = probe(OUT_VIDEO)
const size = (fs.statSync(OUT_VIDEO).size / 1024 / 1024).toFixed(1)
console.log(`\nwrote ${path.relative(process.cwd(), OUT_VIDEO)}  ${final.width}x${final.height} ${final.codec}  ${size} MB`)
console.log(`wrote ${path.relative(process.cwd(), OUT_POSTER)}`)
if (final.width !== final.height) {
  console.log("\nWARNING: output is not square. The preview will flag this on the page.")
  process.exit(1)
}
console.log("square confirmed: the preview will show it 1:1 with no bars.")
