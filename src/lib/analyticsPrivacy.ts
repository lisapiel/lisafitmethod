export const GA_MEASUREMENT_ID = "G-BZWMNEQ83F"

// Pages that carry credentials (set-password tokens, invitation and waiver
// tokens), personal data in their addresses (admin client pages), or belong to
// signed-in areas. Google Analytics never loads on them, and browsers are told
// not to pass their addresses on as a referrer (see next.config.ts).
export const ANALYTICS_EXCLUDED_PREFIXES = [
  "/set-password",
  "/login",
  "/forgot-password",
  "/account",
  "/admin",
  "/coaching/accept",
  "/coaching/accept-terms",
  "/coaching/welcome",
  "/my-coaching",
  "/my-plan",
  "/my-tracker",
  "/training-foundations",
  "/nutrition-foundations",
  "/masterclass",
]

export interface LfmAnalytics {
  page: (href: string, referrer: string, fromHistory?: boolean) => void
  clean: (href: string) => string
}

// The inline script the layout ships, kept as plain JavaScript text so that the
// tests run exactly what the browser runs. Converting a TypeScript function to a
// string is not safe: compilers inject helpers that don't exist in the page.
// It removes every query parameter except utm_* tags, redacts anything that
// looks like an email, reduces other sites' referrers to their origin, and
// never loads Google Analytics on the excluded routes.
const GA_BOOTSTRAP_SOURCE = String.raw`function (measurementId, excludedPrefixes) {
  var w = window;
  var d = document;
  var origin = w.location.origin;
  var KEEP_PARAMS = /^utm_(source|medium|campaign|term|content)$/;
  var EMAIL_LIKE = /@|%40/i;

  function excludedPrefix(path) {
    for (var i = 0; i < excludedPrefixes.length; i++) {
      var p = excludedPrefixes[i];
      if (path === p || path.indexOf(p + "/") === 0) return p;
    }
    return null;
  }

  // Emails, anything over 100 characters, and token-like runs with no
  // separator: 32 or more letters or digits, or 24 or more that mix both
  // (set-password tokens, Stripe payment IDs and secrets). Readable campaign
  // names and blog slugs use hyphens and pass.
  function looksSensitive(value) {
    if (EMAIL_LIKE.test(value) || value.length > 100) return true;
    var runs = value.match(/[A-Za-z0-9]{24,}/g) || [];
    for (var i = 0; i < runs.length; i++) {
      if (runs[i].length >= 32) return true;
      if (/[0-9]/.test(runs[i]) && /[A-Za-z]/.test(runs[i])) return true;
    }
    return false;
  }

  function clean(href) {
    if (!href) return "";
    var u;
    try { u = new URL(href, origin); } catch (e) { return ""; }
    if (u.origin !== origin) return u.origin + "/";
    var prefix = excludedPrefix(u.pathname);
    if (prefix) return origin + prefix;
    var segments = u.pathname.split("/");
    for (var i = 0; i < segments.length; i++) {
      if (looksSensitive(segments[i])) segments[i] = "(redacted)";
    }
    var kept = [];
    u.searchParams.forEach(function (value, key) {
      if (KEEP_PARAMS.test(key)) {
        kept.push(encodeURIComponent(key) + "=" + (looksSensitive(value) ? "(redacted)" : encodeURIComponent(value)));
      }
    });
    return origin + segments.join("/") + (kept.length ? "?" + kept.join("&") : "");
  }

  var dataLayer = w.dataLayer || [];
  w.dataLayer = dataLayer;
  function gtag() { dataLayer.push(arguments); }
  w.gtag = gtag;

  // Final guard on every request gtag.js sends. gtag's own features (history
  // page views, enhanced measurement) read the real browser address, so the
  // values set through gtag("set") are not enough on their own. Every Google
  // measurement request passes through here before it leaves the browser:
  // address fields are cleaned, email-like values redacted, and the request is
  // dropped while the browser is on an excluded page or when it reports one.
  var GOOGLE_HIT = /^https:\/\/([a-z0-9-]+\.)*(google-analytics\.com|analytics\.google\.com|doubleclick\.net|google\.com|googletagmanager\.com)\/.*(collect|ga-audiences)/i;
  var URL_KEYS = /^(dl|dr|ep\.page_location|ep\.page_referrer|ep\.page_path|ep\.link_url|ep\.form_destination|ep\.video_url)$/;

  function cleanParams(params) {
    var out = new URLSearchParams();
    var drop = false;
    params.forEach(function (value, key) {
      if (key === "dl") {
        try { if (excludedPrefix(new URL(value, origin).pathname)) drop = true; } catch (e) { drop = true; }
      }
      if (URL_KEYS.test(key)) value = clean(value);
      else if (EMAIL_LIKE.test(value)) value = "(redacted)";
      out.append(key, value);
    });
    return drop ? null : out;
  }

  function sanitizeHit(url, body) {
    if (excludedPrefix(w.location.pathname)) return null;
    var u;
    try { u = new URL(url); } catch (e) { return null; }
    var shared = cleanParams(u.searchParams);
    if (!shared) return null;
    u.search = shared.toString();
    if (body === undefined || body === null || body === "") return { url: u.toString(), body: body };
    if (typeof body !== "string") return null;
    var kept = [];
    var lines = body.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      if (!lines[i]) continue;
      var event = cleanParams(new URLSearchParams(lines[i]));
      if (event) kept.push(event.toString());
    }
    if (!kept.length) return null;
    return { url: u.toString(), body: kept.join("\r\n") };
  }

  var nativeFetch = w.fetch;
  if (nativeFetch) {
    w.fetch = function (input, init) {
      var target = typeof input === "string" ? input : (input && input.url) || "";
      if (!GOOGLE_HIT.test(target)) return nativeFetch.apply(this, arguments);
      var hit = typeof input === "string" ? sanitizeHit(target, init && init.body) : null;
      if (!hit) return Promise.resolve(new Response(null, { status: 204 }));
      var options = {};
      for (var k in init) options[k] = init[k];
      if (init && init.body !== undefined) options.body = hit.body;
      return nativeFetch.call(this, hit.url, options);
    };
  }
  var nav = w.navigator;
  if (nav && nav.sendBeacon) {
    var nativeBeacon = nav.sendBeacon;
    nav.sendBeacon = function (url, data) {
      if (!GOOGLE_HIT.test(String(url))) return nativeBeacon.apply(nav, arguments);
      var hit = sanitizeHit(String(url), data);
      if (!hit) return true;
      return hit.body === undefined || hit.body === null ? nativeBeacon.call(nav, hit.url) : nativeBeacon.call(nav, hit.url, hit.body);
    };
  }
  var XHR = w.XMLHttpRequest;
  if (XHR && XHR.prototype) {
    var nativeOpen = XHR.prototype.open;
    var nativeSend = XHR.prototype.send;
    XHR.prototype.open = function (method, url) {
      var args = Array.prototype.slice.call(arguments);
      this.__lfmGoogle = null;
      if (GOOGLE_HIT.test(String(url))) {
        var hit = sanitizeHit(String(url));
        // Blocked requests open a harmless placeholder so later setRequestHeader
        // calls still work; send() then does nothing.
        this.__lfmGoogle = { url: hit ? hit.url : "", blocked: !hit };
        args[1] = hit ? hit.url : "data:,";
      }
      return nativeOpen.apply(this, args);
    };
    XHR.prototype.send = function (body) {
      var pending = this.__lfmGoogle;
      if (!pending) return nativeSend.apply(this, arguments);
      if (pending.blocked) return;
      var hit = sanitizeHit(pending.url, body);
      if (!hit) return;
      return nativeSend.call(this, hit.body);
    };
  }
  var Img = w.HTMLImageElement;
  var srcDescriptor = Img && Img.prototype && Object.getOwnPropertyDescriptor(Img.prototype, "src");
  if (srcDescriptor && srcDescriptor.set) {
    Object.defineProperty(Img.prototype, "src", {
      configurable: true,
      enumerable: srcDescriptor.enumerable,
      get: function () { return srcDescriptor.get.call(this); },
      set: function (value) {
        if (!GOOGLE_HIT.test(String(value))) return srcDescriptor.set.call(this, value);
        var hit = sanitizeHit(String(value));
        if (hit) srcDescriptor.set.call(this, hit.url);
      },
    });
  }

  var disableKey = "ga-disable-" + measurementId;
  var loaded = false;
  var configured = false;
  var lastLocation = "";

  function load() {
    if (loaded) return;
    loaded = true;
    var s = d.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    d.head.appendChild(s);
  }

  // fromHistory: the address changed in-app. Once gtag is configured, the
  // property's "page changes based on browser history events" setting sends that
  // page view a few seconds later (cleaned by the guard above), so sending
  // another one would double-count.
  function page(href, referrer, fromHistory) {
    var path;
    try { path = new URL(href, origin).pathname; } catch (e) { return; }
    if (excludedPrefix(path)) {
      w[disableKey] = true;
      lastLocation = "";
      return;
    }
    w[disableKey] = false;
    var pageLocation = clean(href);
    var ref = clean(referrer);
    if (pageLocation === lastLocation) return;
    lastLocation = pageLocation;
    load();
    if (!configured) {
      configured = true;
      gtag("js", new Date());
      gtag("config", measurementId, { send_page_view: false, page_location: pageLocation, page_referrer: ref });
      gtag("event", "page_view", { page_location: pageLocation, page_referrer: ref });
      return;
    }
    gtag("set", { page_location: pageLocation, page_referrer: ref });
    if (!fromHistory) gtag("event", "page_view", { page_location: pageLocation, page_referrer: ref });
  }

  w.__lfmAnalytics = { page: page, clean: clean };
  page(w.location.href, d.referrer);

  // In-app navigation changes the address through the History API without a
  // page load. This wrapper is installed before gtag.js loads, so the disable
  // flag and cleaned values are in place before gtag's own history listener runs.
  var currentHref = w.location.href;
  function onAddressChange() {
    var href = w.location.href;
    if (href === currentHref) return;
    var previous = currentHref;
    currentHref = href;
    page(href, previous, true);
  }
  var hist = w.history;
  if (hist && hist.pushState && hist.replaceState) {
    ["pushState", "replaceState"].forEach(function (method) {
      var original = hist[method];
      hist[method] = function () {
        var result = original.apply(this, arguments);
        onAddressChange();
        return result;
      };
    });
    w.addEventListener("popstate", onAddressChange);
  }
}`

export function gaBootstrapScript(): string {
  return `(${GA_BOOTSTRAP_SOURCE})(${JSON.stringify(GA_MEASUREMENT_ID)}, ${JSON.stringify(ANALYTICS_EXCLUDED_PREFIXES)});`
}
