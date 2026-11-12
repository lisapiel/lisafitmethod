// Browser check that no token, payment secret or email address reaches Google
// Analytics, and that public pages are still tracked exactly once.
//
// Only synthetic values are used. Every Google Analytics request is captured and
// blocked before it leaves the machine, and every /api request is blocked, so
// nothing is sent to Google and nothing changes on the server.
//
//   BASE_URL=http://localhost:3100 PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core \
//     node scripts/verify-analytics-privacy.mjs
//
// Exits 1 if any check fails.
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { webkit } = require(process.env.PLAYWRIGHT_CORE || "playwright-core")

const BASE = (process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "")
const HOST = new URL(BASE).host
const TOKEN = "SYNTHTOKEN" + "a".repeat(54)
const EMAIL = "synthetic.check@example.invalid"
const enc = encodeURIComponent
const STRIPE = "payment_intent=pi_SYNTH&payment_intent_client_secret=pi_SYNTH_secret_SYNTH&redirect_status=succeeded"
const GA = /google-analytics\.com|analytics\.google\.com|\/g\/collect|ga-audiences|\/ccm\/collect/

const CAPTURE = `(() => {
  window.__ga = [];
  const isGA = (u) => ${GA}.test(String(u));
  if (navigator.sendBeacon) {
    const ob = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => isGA(url) ? (window.__ga.push({ url: String(url), body: typeof data === "string" ? data : "" }), true) : ob(url, data);
  }
  const of = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const u = typeof input === "string" ? input : (input && input.url) || "";
    if (isGA(u)) { window.__ga.push({ url: u, body: init && typeof init.body === "string" ? init.body : "" }); return Promise.resolve(new Response(null, { status: 204 })); }
    return of(input, init);
  };
  const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    set(v) { if (isGA(v)) { window.__ga.push({ url: String(v), body: "" }); return; } d.set.call(this, v); },
    get() { return d.get.call(this); },
  });
})();`

function leaks(text) {
  const t = String(text || "")
  let decoded = t
  try { decoded = decodeURIComponent(decodeURIComponent(t)) } catch { try { decoded = decodeURIComponent(t) } catch { /* keep */ } }
  return /SYNTH|synthetic\.check|client_secret/.test(t + decoded) || /@/.test(decoded)
}

function events(captured) {
  const out = []
  for (const c of captured) {
    let shared
    try { shared = new URL(c.url).searchParams } catch { continue }
    for (const line of c.body ? c.body.split(/\r?\n/).filter(Boolean) : [""]) {
      const p = new URLSearchParams(shared)
      if (line) for (const [k, v] of new URLSearchParams(line)) p.set(k, v)
      out.push({ en: p.get("en"), dl: p.get("dl") || "", dr: p.get("dr") || "", raw: c.url + " " + c.body })
    }
  }
  return out
}

async function session(browser, run) {
  const context = await browser.newContext()
  const blocked = []
  const thirdParty = []
  const errors = []
  await context.addInitScript(CAPTURE)
  await context.route(GA, async (route) => { blocked.push({ url: route.request().url(), body: route.request().postData() || "" }); await route.abort() })
  await context.route(`${BASE}/api/**`, (route) => route.abort())
  const page = await context.newPage()
  // Cross-origin fetches the media bucket refuses outside lisafitmethod.com
  // (for example on localhost) are environment noise, not script errors.
  page.on("pageerror", (e) => {
    const message = String(e)
    if (!/access control|Fetch API cannot load|Load failed|NetworkError/i.test(message)) errors.push(message.slice(0, 160))
  })
  page.on("request", async (req) => {
    const host = new URL(req.url()).host
    if (host === HOST) return
    thirdParty.push({ host, url: req.url(), referer: await req.headerValue("referer").catch(() => null) })
  })
  const snapshot = async () => events([...(await page.evaluate(() => window.__ga || []).catch(() => [])), ...blocked])
  const result = await run(page, snapshot)
  await context.close()
  return { ...result, thirdParty, errors }
}

const results = []
function check(name, ok, detail = "") {
  results.push({ name, ok, detail })
}

async function go(page, path) {
  await page.goto(BASE + path, { waitUntil: "load", timeout: 60000 })
  await page.waitForTimeout(4000)
}

;(async () => {
  const browser = await webkit.launch({ headless: true })

  // 1. Public pages: tracked once, cleaned.
  for (const [path, expected] of [
    ["/", `${BASE}/`],
    [`/faq?utm_source=chatgpt.com&token=${TOKEN}&email=${enc(EMAIL)}`, `${BASE}/faq?utm_source=chatgpt.com`],
    [`/purchase-success?email=${enc(EMAIL)}&product=training&${STRIPE}`, `${BASE}/purchase-success`],
    [`/tracker-checkout/success?email=${enc(EMAIL)}&${STRIPE}`, `${BASE}/tracker-checkout/success`],
  ]) {
    const r = await session(browser, async (page, snap) => { await go(page, path); return { ev: await snap(), title: await page.title() } })
    const views = r.ev.filter((e) => e.en === "page_view")
    check(`public ${path.split("?")[0]}: exactly one page view`, views.length === 1, `got ${views.length}`)
    check(`public ${path.split("?")[0]}: cleaned address`, views[0]?.dl === expected, views[0]?.dl)
    check(`public ${path.split("?")[0]}: no sensitive value in any request`, !r.ev.some((e) => leaks(e.raw)))
    check(`public ${path.split("?")[0]}: third parties get origin-only referrers`, r.thirdParty.every((t) => !leaks(t.referer) && (!t.referer || new URL(t.referer).pathname === "/")))
    check(`public ${path.split("?")[0]}: page renders without script errors`, r.errors.length === 0 && r.title.length > 0, r.errors.join(" | "))
  }

  // 2. Sensitive pages: Analytics never loads.
  for (const path of [
    `/set-password?token=${TOKEN}&redirect=%2Ftraining-foundations`,
    `/coaching/accept/SYNTHAPPLICATION?t=${TOKEN}`,
    `/coaching/accept-terms/${TOKEN}`,
    `/admin/coaching/clients/${enc(EMAIL)}`,
    "/login",
    "/forgot-password",
    "/my-coaching",
  ]) {
    const r = await session(browser, async (page, snap) => { await go(page, path); return { ev: await snap() } })
    const google = r.thirdParty.filter((t) => /googletagmanager|google-analytics/.test(t.host))
    check(`sensitive ${path.split("?")[0].slice(0, 45)}: no Analytics requests`, r.ev.length === 0 && google.length === 0, `${r.ev.length} hits, ${google.length} Google requests`)
    check(`sensitive ${path.split("?")[0].slice(0, 45)}: no third-party referrer leak`, r.thirdParty.every((t) => !leaks(t.referer)))
  }

  // 3. Leaving the set-password page with a full page load.
  {
    const r = await session(browser, async (page, snap) => {
      await go(page, `/set-password?token=${TOKEN}`)
      await page.evaluate(() => { const a = document.createElement("a"); a.href = "/faq"; document.body.appendChild(a); a.click() })
      await page.waitForLoadState("load").catch(() => {})
      await page.waitForTimeout(4000)
      return { ev: await snap(), referrer: await page.evaluate(() => document.referrer) }
    })
    const views = r.ev.filter((e) => e.en === "page_view")
    check("after set-password: next page tracked once", views.length === 1 && views[0].dl === `${BASE}/faq`, views.map((v) => v.dl).join(", "))
    check("after set-password: Analytics gets the cleaned referrer only", views[0]?.dr === `${BASE}/set-password` && !r.ev.some((e) => leaks(e.raw)), views[0]?.dr)
  }

  // 4. In-app navigation through real links. gtag's own history listener sends
  // the page view for in-app navigation a few seconds after the address
  // changes, so wait long enough to count everything Google would receive.
  {
    const r = await session(browser, async (page, snap) => {
      await go(page, "/")
      await page.locator('a[href="/coaching"]').first().click()
      await page.waitForURL(`${BASE}/coaching`, { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(9000)
      const afterCoaching = await snap()
      await page.locator('a[href^="/login"]').first().click()
      await page.waitForURL(/\/login/, { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(9000)
      const afterLogin = await snap()
      const disabled = await page.evaluate(() => window["ga-disable-G-BZWMNEQ83F"])
      return { afterCoaching, afterLogin, disabled }
    })
    const views = r.afterCoaching.filter((e) => e.en === "page_view")
    check("in-app navigation: home then coaching each counted once", views.length === 2 && views[0].dl === `${BASE}/` && views[1].dl === `${BASE}/coaching`, views.map((v) => v.dl).join(", "))
    check("in-app navigation: coaching view carries the home page as referrer", views[1]?.dr === `${BASE}/`, views[1]?.dr)
    const later = r.afterLogin.filter((e) => e.en === "page_view")
    check("in-app navigation into /login: no new page view, Analytics switched off", later.length === views.length && r.disabled === true, `${later.length} views, disabled=${r.disabled}`)
  }

  // 5. Referrer-Policy headers.
  for (const [path, expected] of [["/faq", "strict-origin-when-cross-origin"], [`/set-password?token=${TOKEN}`, "same-origin"], [`/coaching/accept-terms/${TOKEN}`, "same-origin"], ["/admin", "same-origin"]]) {
    const res = await fetch(BASE + path, { redirect: "manual" })
    check(`Referrer-Policy on ${path.split("?")[0].slice(0, 30)}`, res.headers.get("referrer-policy") === expected, res.headers.get("referrer-policy"))
  }

  // 6. Navigation matrix, with gtag.js already loaded where it applies. Every
  // Analytics request is reported to this runner the moment it is made, tagged
  // with the page the browser was on, so nothing is lost across page loads.
  // Each scenario scrolls and types to provoke enhanced-measurement events, and
  // waits long enough for gtag's delayed history-based page views.
  const SENSITIVE = /^\/(set-password|login|forgot-password|account|admin|coaching\/accept|coaching\/accept-terms|coaching\/welcome|my-coaching|my-plan|my-tracker|training-foundations|nutrition-foundations|masterclass)(\/|$)/
  const REPORT = `(() => {
    const isGA = (u) => ${GA}.test(String(u));
    const report = (url, body) => { try { window.__lfmReport({ url: String(url), body: body || "", at: location.pathname + location.search }) } catch (e) {} };
    if (navigator.sendBeacon) { const ob = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = (u, d) => isGA(u) ? (report(u, typeof d === "string" ? d : ""), true) : ob(u, d); }
    const of = window.fetch.bind(window);
    window.fetch = (input, init) => { const u = typeof input === "string" ? input : (input && input.url) || ""; if (isGA(u)) { report(u, init && typeof init.body === "string" ? init.body : ""); return Promise.resolve(new Response(null, { status: 204 })); } return of(input, init); };
    const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
    Object.defineProperty(HTMLImageElement.prototype, "src", { set(v) { if (isGA(v)) { report(v, ""); return; } d.set.call(this, v); }, get() { return d.get.call(this); } });
  })();`
  const pathOf = (u) => { try { return new URL(u).pathname } catch { return "" } }
  const provoke = async (page) => {
    await page.mouse.wheel(0, 20000).catch(() => {})
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {})
    const input = page.locator('input[type="email"], input[type="password"], input[type="text"]').first()
    if (await input.count()) await input.fill("synthetic.check@example.invalid").catch(() => {})
    await page.waitForTimeout(1500)
  }
  const clickLink = async (page, selector) => {
    await page.locator(selector).first().click()
    await page.waitForLoadState("load").catch(() => {})
    await page.waitForTimeout(9000)
  }
  async function matrix(name, expectedViews, steps) {
    const context = await browser.newContext()
    const hits = []
    await context.exposeBinding("__lfmReport", (_source, hit) => { hits.push(hit) })
    await context.addInitScript(REPORT)
    await context.route(GA, async (route) => { hits.push({ url: route.request().url(), body: route.request().postData() || "", at: "(network)" }); await route.abort() })
    await context.route(`${BASE}/api/**`, (route) => route.abort())
    const page = await context.newPage()
    await steps(page)
    await page.waitForTimeout(9000)
    await context.close()
    const ev = []
    for (const h of hits) for (const e of events([h])) ev.push({ ...e, at: h.at })
    const views = ev.filter((e) => e.en === "page_view").map((e) => pathOf(e.dl))
    const leaked = ev.filter((e) => leaks(e.raw))
    check(`${name}: no sensitive value in any of ${ev.length} Analytics requests`, leaked.length === 0, leaked.map((e) => `${e.en} dl=${e.dl} dr=${e.dr} at=${e.at}`).join(" | ").split(TOKEN).join("[SYNTH_TOKEN]").slice(0, 400))
    check(`${name}: no request reports a sensitive page address`, !ev.some((e) => SENSITIVE.test(pathOf(e.dl))), ev.map((e) => pathOf(e.dl)).join(", "))
    check(`${name}: nothing sent while on a sensitive page`, !ev.some((e) => SENSITIVE.test(e.at.split("?")[0])), ev.filter((e) => SENSITIVE.test(e.at.split("?")[0])).map((e) => `${e.en}@${e.at.split("?")[0]}`).join(", "))
    check(`${name}: page views exactly ${expectedViews.join(" → ") || "none"}`, JSON.stringify(views) === JSON.stringify(expectedViews), views.join(" → ") || "none")
  }

  await matrix("public → login (link)", ["/faq"], async (page) => {
    await go(page, "/faq")
    await clickLink(page, 'a[href^="/login"]')
    await provoke(page)
  })
  await matrix("login (direct) → public (link)", ["/coaching"], async (page) => {
    await go(page, "/login")
    await provoke(page)
    await clickLink(page, 'a[href="/coaching"]')
  })
  await matrix("public → set-password with token (in-app)", ["/faq"], async (page) => {
    await go(page, "/faq")
    await page.evaluate((t) => history.pushState(null, "", `/set-password?token=${t}`), TOKEN)
    await page.waitForTimeout(9000)
    await provoke(page)
  })
  await matrix("public → set-password with token (full load)", ["/faq"], async (page) => {
    await go(page, "/faq")
    await page.evaluate((t) => { const a = document.createElement("a"); a.href = `/set-password?token=${t}`; document.body.appendChild(a); a.click() }, TOKEN)
    await page.waitForLoadState("load").catch(() => {})
    await page.waitForTimeout(9000)
    await provoke(page)
  })
  await matrix("public → purchase-success with Stripe secret (in-app)", ["/faq", "/purchase-success"], async (page) => {
    await go(page, "/faq")
    await page.evaluate((s) => history.pushState(null, "", `/purchase-success?email=synthetic.check%40example.invalid&product=training&${s}`), STRIPE)
    await page.waitForTimeout(9000)
  })
  await matrix("public → tracker success with Stripe secret (full load)", ["/faq", "/tracker-checkout/success"], async (page) => {
    await go(page, "/faq")
    await page.evaluate((s) => { const a = document.createElement("a"); a.href = `/tracker-checkout/success?email=synthetic.check%40example.invalid&${s}`; document.body.appendChild(a); a.click() }, STRIPE)
    await page.waitForLoadState("load").catch(() => {})
    await page.waitForTimeout(9000)
  })
  await matrix("set-password with token (direct load)", [], async (page) => {
    await go(page, `/set-password?token=${TOKEN}`)
    await provoke(page)
  })
  await matrix("back and forward between public and sensitive (in-app)", ["/faq", "/faq"], async (page) => {
    await go(page, "/faq")
    await page.evaluate((t) => history.pushState(null, "", `/set-password?token=${t}`), TOKEN)
    await page.waitForTimeout(9000)
    await page.goBack()
    await page.waitForTimeout(9000)
    await page.goForward()
    await page.waitForTimeout(9000)
    await provoke(page)
  })
  await matrix("back and forward between public and login (links)", ["/faq", "/faq"], async (page) => {
    await go(page, "/faq")
    await clickLink(page, 'a[href^="/login"]')
    await page.goBack()
    await page.waitForTimeout(9000)
    await page.goForward()
    await page.waitForTimeout(9000)
    await provoke(page)
  })
  await matrix("utm tags carrying a token and an email", ["/faq"], async (page) => {
    await go(page, `/faq?utm_source=${TOKEN}&utm_content=${enc(EMAIL)}&utm_medium=newsletter`)
  })

  await browser.close()
  const failed = results.filter((r) => !r.ok)
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  (${String(r.detail).replace(TOKEN, "[SYNTH_TOKEN]")})`}`)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed against ${BASE}`)
  process.exit(failed.length ? 1 : 0)
})().catch((e) => { console.error("FAILED TO RUN:", String(e).slice(0, 300)); process.exit(1) })
