import { test } from "node:test"
import assert from "node:assert/strict"
import vm from "node:vm"
import { ANALYTICS_EXCLUDED_PREFIXES, GA_MEASUREMENT_ID, gaBootstrapScript, type LfmAnalytics } from "./analyticsPrivacy"
import nextConfig from "../../next.config"

const ORIGIN = "https://lisafitmethod.com"
const TOKEN = "SYNTHTOKEN" + "a".repeat(54)
const EMAIL = "synthetic.check@example.invalid"
const STRIPE = "payment_intent=pi_SYNTH&payment_intent_client_secret=pi_SYNTH_secret_SYNTH&redirect_status=succeeded"

type Command = unknown[]

// Runs the exact inline script the layout ships, against a fake browser window.
function boot(href: string, referrer = "") {
  const loadedScripts: string[] = []
  const listeners: Record<string, () => void> = {}
  const win: Record<string, unknown> = { location: new URL(href) }
  const move = (url: string) => { win.location = new URL(url, (win.location as URL).href) }
  win.history = {
    pushState: (_state: unknown, _title: string, url: string) => move(url),
    replaceState: (_state: unknown, _title: string, url: string) => move(url),
  }
  win.addEventListener = (type: string, fn: () => void) => { listeners[type] = fn }
  const doc = {
    referrer,
    head: { appendChild: (el: { src: string }) => loadedScripts.push(el.src) },
    createElement: () => ({ async: false, src: "" }),
  }
  vm.runInNewContext(gaBootstrapScript(), { window: win, document: doc, URL, URLSearchParams })
  // Objects made inside the sandbox belong to another realm, so copy them out
  // as plain data before comparing.
  const commands = () => JSON.parse(JSON.stringify((win.dataLayer as ArrayLike<unknown>[]).map((a) => Array.from(a)))) as Command[]
  const pageViews = () => commands().filter((c) => c[0] === "event" && c[1] === "page_view").map((c) => c[2] as Record<string, string>)
  const analytics = win.__lfmAnalytics as LfmAnalytics
  const history = win.history as { pushState: (s: unknown, t: string, u: string) => void; replaceState: (s: unknown, t: string, u: string) => void }
  const back = (url: string) => { move(url); listeners.popstate?.() }
  return { win, loadedScripts, commands, pageViews, analytics, history, back }
}

function assertNoSensitive(commands: Command[]) {
  const text = JSON.stringify(commands)
  assert.ok(!text.includes("SYNTH"), `synthetic token or Stripe value leaked: ${text}`)
  assert.ok(!text.includes("synthetic.check"), `synthetic email leaked: ${text}`)
  assert.ok(!/%40|@/.test(text), `email-like value leaked: ${text}`)
}

test("a public page is tracked once, with only utm tags kept", () => {
  const env = boot(`${ORIGIN}/faq?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}&utm_source=chatgpt.com&utm_medium=referral`)
  assert.deepEqual(env.loadedScripts, [`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`])
  const config = env.commands().find((c) => c[0] === "config")
  assert.equal((config?.[2] as Record<string, unknown>).send_page_view, false)
  assert.deepEqual(env.pageViews(), [{ page_location: `${ORIGIN}/faq?utm_source=chatgpt.com&utm_medium=referral`, page_referrer: "" }])
  assertNoSensitive(env.commands())
})

test("purchase confirmation pages drop the email and Stripe's payment secret", () => {
  const env = boot(`${ORIGIN}/purchase-success?email=${encodeURIComponent(EMAIL)}&product=training&${STRIPE}`)
  assert.equal(env.pageViews()[0].page_location, `${ORIGIN}/purchase-success`)
  const tracker = boot(`${ORIGIN}/tracker-checkout/success?email=${encodeURIComponent(EMAIL)}&${STRIPE}`)
  assert.equal(tracker.pageViews()[0].page_location, `${ORIGIN}/tracker-checkout/success`)
  assertNoSensitive([...env.commands(), ...tracker.commands()])
})

for (const path of [
  `/set-password?token=${TOKEN}&redirect=%2Ftraining-foundations`,
  `/coaching/accept/SYNTHAPPLICATION?t=${TOKEN}`,
  `/coaching/accept-terms/${TOKEN}`,
  `/admin/coaching/clients/${encodeURIComponent(EMAIL)}`,
  "/login",
  "/my-coaching/check-in",
  "/training-foundations/module1",
]) {
  test(`sensitive page ${path.split("?")[0].slice(0, 40)} never loads or configures Analytics`, () => {
    const env = boot(ORIGIN + path)
    assert.deepEqual(env.loadedScripts, [])
    assert.equal(env.commands().length, 0)
    assert.equal(env.win[`ga-disable-${GA_MEASUREMENT_ID}`], true)
  })
}

test("referrers are cleaned: query strings dropped, sensitive paths cut to their prefix, other sites reduced to origin", () => {
  assert.equal(boot(`${ORIGIN}/faq`, `${ORIGIN}/set-password?token=${TOKEN}`).pageViews()[0].page_referrer, `${ORIGIN}/set-password`)
  assert.equal(boot(`${ORIGIN}/faq`, `${ORIGIN}/coaching/accept-terms/${TOKEN}`).pageViews()[0].page_referrer, `${ORIGIN}/coaching/accept-terms`)
  assert.equal(boot(`${ORIGIN}/faq`, `${ORIGIN}/purchase-success?email=${encodeURIComponent(EMAIL)}&${STRIPE}`).pageViews()[0].page_referrer, `${ORIGIN}/purchase-success`)
  assert.equal(boot(`${ORIGIN}/faq`, "https://www.google.com/search?q=lisa+fit+method").pageViews()[0].page_referrer, "https://www.google.com/")
})

test("email-like values are redacted from paths and utm tags", () => {
  const env = boot(`${ORIGIN}/blog/${encodeURIComponent(EMAIL)}?utm_content=${encodeURIComponent(EMAIL)}`)
  assert.equal(env.pageViews()[0].page_location, `${ORIGIN}/blog/(redacted)?utm_content=(redacted)`)
  assertNoSensitive(env.commands())
})

test("utm tags can't smuggle tokens, Stripe values or very long data, while normal campaign names pass", () => {
  const stripeLike = "pi_3Tb5r70dFyAciXFk1u6vFWZX_secret_Abc123Def456Ghi789Jkl012"
  const env = boot(`${ORIGIN}/faq?utm_source=${TOKEN}&utm_medium=${encodeURIComponent(stripeLike)}&utm_campaign=${"x".repeat(101)}&utm_content=guide-series-training&utm_term=chatgpt.com`)
  assert.equal(
    env.pageViews()[0].page_location,
    `${ORIGIN}/faq?utm_source=(redacted)&utm_medium=(redacted)&utm_campaign=(redacted)&utm_content=guide-series-training&utm_term=chatgpt.com`,
  )
  assertNoSensitive(env.commands())
})

test("token-like path segments on public pages are redacted, readable slugs are kept", () => {
  const env = boot(`${ORIGIN}/blog/strength-training-for-women-beginners`)
  assert.equal(env.pageViews()[0].page_location, `${ORIGIN}/blog/strength-training-for-women-beginners`)
  assert.equal(boot(`${ORIGIN}/somewhere/${TOKEN}`).pageViews()[0].page_location, `${ORIGIN}/somewhere/(redacted)`)
})

test("in-app navigation reports each new page once and never double-counts", () => {
  const env = boot(`${ORIGIN}/`)
  env.analytics.page(`${ORIGIN}/coaching`, `${ORIGIN}/`)
  env.analytics.page(`${ORIGIN}/coaching`, `${ORIGIN}/`)
  env.analytics.page(`${ORIGIN}/coaching#apply`, `${ORIGIN}/coaching`)
  assert.deepEqual(env.pageViews().map((p) => p.page_location), [`${ORIGIN}/`, `${ORIGIN}/coaching`])
  assert.equal(env.commands().filter((c) => c[0] === "config").length, 1)
  assert.equal(env.loadedScripts.length, 1)
})

const sets = (env: ReturnType<typeof boot>) => env.commands().filter((c) => c[0] === "set").map((c) => c[1] as Record<string, string>)

test("in-app navigation hands gtag the cleaned address once and leaves the page view to gtag's history listener", () => {
  const env = boot(`${ORIGIN}/`)
  env.history.replaceState(null, "", `${ORIGIN}/`)
  env.history.pushState(null, "", `/coaching?email=${encodeURIComponent(EMAIL)}`)
  env.history.replaceState(null, "", `/coaching?email=${encodeURIComponent(EMAIL)}`)
  env.history.pushState(null, "", "/coaching#apply")
  assert.deepEqual(env.pageViews(), [{ page_location: `${ORIGIN}/`, page_referrer: "" }])
  assert.deepEqual(sets(env), [{ page_location: `${ORIGIN}/coaching`, page_referrer: `${ORIGIN}/` }])
  assertNoSensitive(env.commands())
})

test("history navigation into a sensitive page disables Analytics at once, before gtag's own listener runs", () => {
  const env = boot(`${ORIGIN}/courses`)
  env.history.pushState(null, "", `/set-password?token=${TOKEN}`)
  assert.equal(env.win[`ga-disable-${GA_MEASUREMENT_ID}`], true)
  env.history.pushState(null, "", "/my-coaching/check-in")
  assert.equal(sets(env).length, 0)
  env.back(`${ORIGIN}/courses`)
  assert.equal(env.win[`ga-disable-${GA_MEASUREMENT_ID}`], false)
  assert.deepEqual(sets(env), [{ page_location: `${ORIGIN}/courses`, page_referrer: `${ORIGIN}/my-coaching` }])
  assert.equal(env.pageViews().length, 1)
  assertNoSensitive(env.commands())
})

test("a visit that starts on a sensitive page sends the first public page view itself, since gtag wasn't watching", () => {
  const env = boot(`${ORIGIN}/login`)
  env.history.pushState(null, "", "/faq")
  assert.equal(env.loadedScripts.length, 1)
  assert.deepEqual(env.pageViews(), [{ page_location: `${ORIGIN}/faq`, page_referrer: `${ORIGIN}/login` }])
})

test("navigating into a sensitive page turns Analytics off, and back out turns it on", () => {
  const env = boot(`${ORIGIN}/courses`)
  env.analytics.page(`${ORIGIN}/set-password?token=${TOKEN}`, `${ORIGIN}/courses`)
  assert.equal(env.win[`ga-disable-${GA_MEASUREMENT_ID}`], true)
  assert.equal(env.pageViews().length, 1)
  env.analytics.page(`${ORIGIN}/training-foundations`, `${ORIGIN}/set-password?token=${TOKEN}`)
  assert.equal(env.pageViews().length, 1)
  env.analytics.page(`${ORIGIN}/courses`, `${ORIGIN}/training-foundations`)
  assert.equal(env.win[`ga-disable-${GA_MEASUREMENT_ID}`], false)
  assert.deepEqual(env.pageViews().map((p) => p.page_location), [`${ORIGIN}/courses`, `${ORIGIN}/courses`])
  assertNoSensitive(env.commands())
})

test("a visit that starts on a sensitive page loads Analytics only once a public page is reached", () => {
  const env = boot(`${ORIGIN}/set-password?token=${TOKEN}`)
  assert.equal(env.loadedScripts.length, 0)
  env.analytics.page(`${ORIGIN}/faq`, `${ORIGIN}/set-password?token=${TOKEN}`)
  assert.equal(env.loadedScripts.length, 1)
  assert.deepEqual(env.pageViews(), [{ page_location: `${ORIGIN}/faq`, page_referrer: `${ORIGIN}/set-password` }])
  assertNoSensitive(env.commands())
})

// The send-time guard: fake browser with fetch and sendBeacon that record what
// actually leaves the page.
function bootWithTransport(href: string) {
  const sent: { via: string; url: string; body?: unknown }[] = []
  const win: Record<string, unknown> = { location: new URL(href) }
  win.fetch = (url: string, init?: { body?: unknown }) => { sent.push({ via: "fetch", url, body: init?.body }); return Promise.resolve("network") }
  win.navigator = { sendBeacon: (url: string, data?: unknown) => { sent.push({ via: "beacon", url, body: data }); return true } }
  win.history = { pushState: (_s: unknown, _t: string, url: string) => { win.location = new URL(url, (win.location as URL).href) }, replaceState: () => {} }
  win.addEventListener = () => {}
  class FakeResponse { constructor(public body: unknown, public init: unknown) {} }
  const doc = { referrer: "", head: { appendChild: () => {} }, createElement: () => ({}) }
  vm.runInNewContext(gaBootstrapScript(), { window: win, document: doc, URL, URLSearchParams, Response: FakeResponse, Promise })
  const fetchGa = (url: string, body?: string) => (win.fetch as (u: string, i?: { body?: string }) => unknown)(url, body === undefined ? undefined : { body })
  const beaconGa = (url: string, body?: string) => (win.navigator as { sendBeacon: (u: string, d?: string) => boolean }).sendBeacon(url, body)
  const go = (path: string) => (win.history as { pushState: (s: unknown, t: string, u: string) => void }).pushState(null, "", path)
  return { sent, fetchGa, beaconGa, go }
}

const COLLECT = "https://region1.google-analytics.com/g/collect?v=2&tid=G-BZWMNEQ83F&en=page_view"
const q = (s: string) => encodeURIComponent(s)

test("send-time guard cleans gtag's own page views, which read the real browser address", () => {
  const env = bootWithTransport(`${ORIGIN}/faq`)
  env.go(`/purchase-success?email=${q(EMAIL)}&product=training&${STRIPE}`)
  env.fetchGa(`${COLLECT}&dl=${q(`${ORIGIN}/purchase-success?email=${EMAIL}&${STRIPE}`)}&dr=${q(`${ORIGIN}/set-password?token=${TOKEN}`)}`)
  assert.equal(env.sent.length, 1)
  const params = new URL(env.sent[0].url).searchParams
  assert.equal(params.get("dl"), `${ORIGIN}/purchase-success`)
  assert.equal(params.get("dr"), `${ORIGIN}/set-password`)
  assert.ok(!/SYNTH|synthetic|%40|@/.test(env.sent[0].url))
})

test("send-time guard drops every request while the browser is on a sensitive page", () => {
  const env = bootWithTransport(`${ORIGIN}/faq`)
  env.go(`/set-password?token=${TOKEN}`)
  env.fetchGa(`${COLLECT}&dl=${q(`${ORIGIN}/faq`)}`)
  env.beaconGa(`${COLLECT}&dl=${q(`${ORIGIN}/faq`)}`, "en=scroll")
  assert.equal(env.sent.length, 0)
})

test("send-time guard drops batched events that report a sensitive page and cleans the rest", () => {
  const env = bootWithTransport(`${ORIGIN}/faq`)
  const body = [`en=page_view&dl=${q(`${ORIGIN}/login?redirect=${q(`/coaching/accept/X?t=${TOKEN}`)}`)}`, `en=scroll&dl=${q(`${ORIGIN}/faq?token=${TOKEN}`)}&ep.link_url=${q(`https://example.com/out?email=${EMAIL}`)}`].join("\r\n")
  env.beaconGa(COLLECT, body)
  assert.equal(env.sent.length, 1)
  const lines = String(env.sent[0].body).split("\r\n")
  assert.equal(lines.length, 1)
  const event = new URLSearchParams(lines[0])
  assert.equal(event.get("en"), "scroll")
  assert.equal(event.get("dl"), `${ORIGIN}/faq`)
  assert.equal(event.get("ep.link_url"), "https://example.com/")
})

test("send-time guard redacts email-like values in any other field and leaves non-Google requests untouched", () => {
  const env = bootWithTransport(`${ORIGIN}/faq`)
  env.fetchGa(`${COLLECT}&dl=${q(`${ORIGIN}/faq`)}&ep.search_term=${q(EMAIL)}`)
  assert.equal(new URL(env.sent[0].url).searchParams.get("ep.search_term"), "(redacted)")
  env.fetchGa(`${ORIGIN}/api/member/access?email=${q(EMAIL)}`)
  assert.equal(env.sent[1].url, `${ORIGIN}/api/member/access?email=${q(EMAIL)}`)
})

test("next.config gives other sites no referrer from any excluded route, and a strict default elsewhere", async () => {
  const rules = (await nextConfig.headers?.()) ?? []
  const policy = (source: string) => rules.find((r) => r.source === source)?.headers.find((h) => h.key === "Referrer-Policy")?.value
  assert.equal(policy("/:path*"), "strict-origin-when-cross-origin")
  for (const prefix of ANALYTICS_EXCLUDED_PREFIXES) assert.equal(policy(`${prefix}/:path*`), "same-origin", prefix)
  const firstStrict = rules.findIndex((r) => r.source === "/:path*")
  const firstOverride = rules.findIndex((r) => r.headers.some((h) => h.value === "same-origin"))
  assert.ok(firstStrict < firstOverride, "the strict default must come before the overrides")
})
