/* ARVOX Finance — shared logic. Env-gated. No fake data. No secrets client-side. */
(function(){
  "use strict";
  var DEFAULTS = {
    WALLETCONNECT_PROJECT_ID: "", RPC_URL: "", MARKET_DATA_API_KEY: "",
    MARKET_API_URL: "", WAITLIST_API_URL: "",
    SOCIALS: { X: "", TELEGRAM: "", DOCS: "", PRIVACY: "", TERMS: "" }
  };
  var CONFIG = Object.assign({}, DEFAULTS, window.ARVOX_CONFIG || {});
  function $(s,c){ return (c||document).querySelector(s); }
  function $all(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }

  /* Route families: every clean URL maps to a real page (never a 404). */
  var DEMO_ROUTES = ["demo","assets","activity","send","swap","bridge","ai","settings","automations","payments"];
  var TECH_ROUTES = ["technology","security","permissions"];
  function routeName(){
    var p = (window.location.pathname || "/").replace(/\/+$/,"");
    var seg = p.substring(p.lastIndexOf("/") + 1).replace(/\.html?$/i,"");
    if (!seg || seg === "index") {
      var q = "";
      try { q = new URLSearchParams(window.location.search).get("view") || ""; } catch(e){}
      if (q) seg = q;
      else if (window.location.hash) seg = window.location.hash.replace("#","");
    }
    return seg.toLowerCase();
  }
  function family(seg){
    if (DEMO_ROUTES.indexOf(seg) !== -1) return "demo";
    if (TECH_ROUTES.indexOf(seg) !== -1) return "technology";
    if (seg === "waitlist") return "waitlist";
    if (seg === "" || seg === "index" || seg === "home") return "home";
    return "";
  }

  // page transition in
  requestAnimationFrame(function(){ document.body.classList.add("ready"); });

  // mobile menu: toggle, close on navigate / Escape / resize to desktop
  var mb = $("#menu-btn"), mm = $("#mobile-menu");
  function setMenu(open){
    if (!mm) return;
    mm.classList.toggle("open", !!open);
    if (mb) { mb.setAttribute("aria-expanded", open ? "true" : "false"); mb.textContent = open ? "✕" : "☰"; }
  }
  if (mb && mm) {
    mb.addEventListener("click", function(){ setMenu(!mm.classList.contains("open")); });
    $all("a", mm).forEach(function(a){ a.addEventListener("click", function(){ setMenu(false); }); });
    window.addEventListener("resize", function(){ if (window.innerWidth >= 700) setMenu(false); });
  }

  // smooth page transitions for internal navigations (clean URLs + .html)
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-no-transition")) return;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" || /^[a-z][a-z0-9+.-]*:/i.test(href)) return;
    e.preventDefault();
    setMenu(false);
    if (a.hasAttribute("data-close")) { var wbg0 = $("#wallet-modal"); if (wbg0) wbg0.classList.remove("open"); }
    document.body.classList.add("leaving");
    setTimeout(function(){ window.location.href = href; }, 160);
  });

  var y = $("#yr"); if (y) y.textContent = new Date().getFullYear();

  // active nav (desktop + mobile) from route family
  var fam = family(routeName()) || document.body.getAttribute("data-page") || "";
  var NAV = { home:["./","index","index.html"], demo:["demo","demo.html"], technology:["technology","technology.html"], waitlist:["waitlist","waitlist.html"] };
  $all(".nav-links a, #mobile-menu a").forEach(function(a){
    var h = (a.getAttribute("href") || "").replace(/^\.\//,"").replace(/\.html?$/i,"");
    if (h === "") h = "./";
    Object.keys(NAV).forEach(function(k){
      if (k === fam && NAV[k].indexOf(h) !== -1) a.classList.add("active");
    });
  });

  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold:.12}) : null;
  $all(".reveal").forEach(function(el){ if (io) io.observe(el); else el.classList.add("in"); });

  var wbg = $("#wallet-modal");
  function closeWallet(){ if (wbg) wbg.classList.remove("open"); }
  $all("[data-wallet]").forEach(function(b){ b.addEventListener("click", function(){ if (wbg) wbg.classList.add("open"); }); });
  if (wbg) wbg.addEventListener("click", function(e){ if (e.target === wbg || e.target.closest("[data-close]")) closeWallet(); });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") { closeWallet(); setMenu(false); }
  });

  function hasMarket(){ return !!(CONFIG.MARKET_DATA_API_KEY || CONFIG.MARKET_API_URL); }
  function hasRpc(){ return !!CONFIG.RPC_URL; }
  function hasWc(){ return !!CONFIG.WALLETCONNECT_PROJECT_ID; }

  // Home status panel
  var mBody = $("#market-body");
  function renderMarket(state, msg){
    if (!mBody) return;
    if (state === "loading") {
      mBody.innerHTML = '<div class="skel" style="height:22px"></div><div class="skel" style="height:22px"></div><div class="skel" style="height:60px"></div><p class="muted">Loading live market data…</p>';
    } else if (state === "unavailable") {
      mBody.innerHTML = '<div class="empty"><b>Data unavailable.</b><br><span>' + (msg || "Market-data provider is not configured. Set MARKET_DATA_API_KEY / RPC_URL to enable live data.") + '</span></div>';
    } else if (state === "error") {
      mBody.innerHTML = '<div class="error"><b>Data unavailable.</b><br><span>' + (msg || "Provider unreachable. Try again later.") + '</span><div style="margin-top:10px"><button class="btn btn-sm" id="retry-mkt" type="button">Retry</button></div></div>';
      var r = $("#retry-mkt"); if (r) r.addEventListener("click", loadMarket);
    }
  }
  function loadMarket(){
    if (!mBody) return;
    renderMarket("loading");
    setTimeout(function(){
      if (!hasMarket()) renderMarket("unavailable");
      else renderMarket("error", "Provider key is set but this pre-launch build has no live wallet infrastructure yet. Showing unavailable instead of invented numbers.");
    }, 800);
  }
  $all(".tab").forEach(function(tab){
    tab.addEventListener("click", function(){
      $all(".tab").forEach(function(x){ x.classList.remove("active"); });
      tab.classList.add("active");
      var k = tab.getAttribute("data-state");
      if (k === "loading") { renderMarket("loading"); setTimeout(function(){ renderMarket("unavailable"); }, 1400); }
      else if (k === "empty") renderMarket("unavailable");
      else renderMarket("error", "Example error state. No data was fabricated.");
    });
  });
  loadMarket();

  // Env status chips (home + technology)
  $all("[data-env]").forEach(function(el){
    var k = el.getAttribute("data-env");
    var ok = (k === "market" && hasMarket()) || (k === "rpc" && hasRpc()) || (k === "wc" && hasWc()) || (k === "db" && !!CONFIG.WAITLIST_API_URL);
    el.innerHTML = ok ? "Configured" : "Not configured · shows Data unavailable";
  });

  // Footer socials — only configured links become anchors
  var fl = $("#foot-socials");
  if (fl) {
    var labels = {X:"X", TELEGRAM:"Telegram", DOCS:"Docs", PRIVACY:"Privacy", TERMS:"Terms"};
    var html = "";
    Object.keys(labels).forEach(function(k){
      var v = (CONFIG.SOCIALS||{})[k];
      if (v) html += '<a href="' + String(v).replace(/"/g,"") + '" target="_blank" rel="noopener">' + labels[k] + '</a>';
      else html += '<span class="off" aria-disabled="true" title="Coming soon">' + labels[k] + ' · soon</span>';
    });
    fl.innerHTML = html;
  }

  // Waitlist — real backend endpoint only (DATABASE_URL never leaves server)
  var form = $("#wait-form");
  if (form) form.addEventListener("submit", function(e){
    e.preventDefault();
    var email = (($("#w-email")||{}).value || "").trim();
    var wallet = (($("#w-wallet")||{}).value || "").trim();
    var note = (($("#w-note")||{}).value || "").trim();
    var err = $("#w-err"), ok = $("#w-ok");
    if (err) err.hidden = true; if (ok) ok.hidden = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (err) { err.hidden = false; err.textContent = "Enter a valid email to join the waitlist."; }
      return;
    }
    if (wallet && !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      if (err) { err.hidden = false; err.textContent = "Wallet address looks invalid (0x + 40 hex). Leave blank if unsure."; }
      return;
    }
    var payload = {email:email, wallet:wallet, note:note, at:new Date().toISOString(), src:"arvox-prelaunch"};
    function done(local){
      if (ok) {
        ok.hidden = false;
        ok.innerHTML = local
          ? "<b>You’re on the local preview list.</b><br><span class='muted'>Backend endpoint is not configured, so this browser queued your request only. No wallet action was taken.</span>"
          : "<b>You’re on the waitlist.</b><br><span class='muted'>We’ll email you before launch. No wallet action was taken.</span>";
      }
      form.reset();
    }
    if (!CONFIG.WAITLIST_API_URL) {
      try {
        var q = JSON.parse(localStorage.getItem("arvox_waitlist") || "[]");
        q.push(payload); localStorage.setItem("arvox_waitlist", JSON.stringify(q));
      } catch(ex){}
      setTimeout(function(){ done(true); }, 500);
      return;
    }
    fetch(CONFIG.WAITLIST_API_URL, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)})
      .then(function(r){ if (!r.ok) throw new Error("bad"); done(false); })
      .catch(function(){
        try { var q2 = JSON.parse(localStorage.getItem("arvox_waitlist") || "[]"); q2.push(payload); localStorage.setItem("arvox_waitlist", JSON.stringify(q2)); } catch(ex){}
        done(true);
      });
  });

  // Demo wallet (demo.html + all wallet sub-routes)
  var demoBal = $("#demo-balance"), demoAssets = $("#demo-assets"), demoAct = $("#demo-activity");
  var showConcept = false;
  function paintDemo(){
    if (!demoBal) return;
    if (!hasMarket() && !showConcept) {
      demoBal.innerHTML = '<small>Total balance</small><b>—</b><div class="empty" style="margin-top:10px"><b>Data unavailable.</b><br><span>Set MARKET_DATA_API_KEY and RPC_URL to load live balances. Nothing is invented.</span></div>';
      if (demoAssets) demoAssets.innerHTML = '<div class="empty"><b>Data unavailable.</b><br><span>Asset list needs a configured market-data provider.</span></div>';
      if (demoAct) demoAct.innerHTML = '<div class="empty"><b>No activity.</b><br><span>Wallet is not connected in this DEMO. No transaction hashes exist to show.</span></div>';
    } else if (showConcept) {
      demoBal.innerHTML = '<small>Total balance · <b>DEMO layout</b></small><b>$24,892.32</b><em style="color:var(--muted)">Illustrative only — not a real balance</em>';
      if (demoAssets) demoAssets.innerHTML = '<div class="w-row"><span>◆ Ethereum <small>DEMO</small></span><span>$4,231.12</span></div><div class="w-row"><span>◆ USDT <small>DEMO</small></span><span>$3,120.45</span></div><div class="w-row"><span>◆ USDC <small>DEMO</small></span><span>$2,840.23</span></div>';
      if (demoAct) demoAct.innerHTML = '<div class="empty"><b>DEMO activity.</b><br><span>Layout example only. No real transaction hashes.</span></div>';
    } else {
      demoBal.innerHTML = '<div class="skel" style="height:30px"></div><p class="muted">Loading live balances…</p>';
    }
  }
  var dc = $("#demo-concept-btn");
  if (dc) dc.addEventListener("click", function(){
    showConcept = !showConcept;
    dc.textContent = showConcept ? "Hide DEMO layout" : "Preview DEMO layout";
    paintDemo();
  });
  paintDemo();

  function selectPane(name){
    var tabs = $all(".w-tab"), panes = $all(".w-pane");
    if (!tabs.length) return false;
    var found = false;
    tabs.forEach(function(t){
      var on = t.getAttribute("data-pane") === name;
      t.classList.toggle("active", on);
      if (on) found = true;
    });
    panes.forEach(function(p){ p.hidden = p.getAttribute("data-pane") !== name; });
    return found;
  }
  $all(".w-tab").forEach(function(t){
    t.addEventListener("click", function(){ selectPane(t.getAttribute("data-pane")); });
  });
  $all(".w-nav button").forEach(function(b){
    b.addEventListener("click", function(){
      $all(".w-nav button").forEach(function(x){ x.classList.remove("active"); });
      b.classList.add("active");
    });
  });
  function flash(el){
    if (!el || !el.scrollIntoView) return;
    try { el.scrollIntoView({block:"nearest", behavior:"smooth"}); } catch(e){ try { el.scrollIntoView(); } catch(_){} }
    el.classList.add("flash");
    setTimeout(function(){ el.classList.remove("flash"); }, 2200);
  }
  // Deep links: /assets /activity /send /swap /bridge /ai /settings /automations /payments
  var seg = routeName();
  var note = $("#route-note");
  function say(t){ if (note) { note.hidden = false; note.textContent = t; } }
  if (demoBal) {
    if (seg === "assets") selectPane("assets");
    else if (seg === "activity") selectPane("activity");
    else if (seg === "ai") { selectPane("agent"); say("Agent view (DEMO) — explains before approval. Execution is COMING SOON."); }
    else if (seg === "send" || seg === "swap" || seg === "bridge") {
      selectPane("assets");
      var card = document.getElementById("card-" + seg);
      say("“" + seg.charAt(0).toUpperCase() + seg.slice(1) + "” is COMING SOON — preview disabled in this DEMO.");
      setTimeout(function(){ flash(card); }, 350);
    }
    else if (seg === "settings") {
      var sb = $all(".w-nav button")[3]; if (sb) sb.classList.add("active");
      say("Settings (DEMO) — preferences will live here at launch.");
    }
    else if (seg === "automations" || seg === "payments") {
      selectPane("agent");
      say("“" + seg.charAt(0).toUpperCase() + seg.slice(1) + "” is COMING SOON — on the roadmap, not live in this DEMO.");
    }
  }

  // Deep-link anchors on non-demo pages (/security, /permissions)
  if (!demoBal && (seg === "security" || seg === "permissions")) {
    setTimeout(function(){ flash(document.getElementById("security")); }, 400);
  }

  // Ask ARVOX demo flow — explains, never executes
  var askForm = $("#ask-form"), askOut = $("#ask-out");
  if (askForm) askForm.addEventListener("submit", function(e){
    e.preventDefault();
    var q = (($("#ask-q")||{}).value || "").trim() || "Swap 500 USDC to ETH";
    if (!askOut) return;
    askOut.innerHTML = '<p class="muted">Analyzing “' + q.replace(/</g,"&lt;") + '”…</p><div class="skel"></div><div class="skel"></div>';
    setTimeout(function(){
      askOut.innerHTML = '<ul class="check"><li>Intent parsed (DEMO)</li><li>Liquidity check — <b>COMING SOON</b></li><li>Simulation — <b>COMING SOON</b></li></ul>'
        + '<div class="kv"><small>Network</small><span>Data unavailable</span></div><div class="kv"><small>Est. fee</small><span>Data unavailable</span></div><div class="kv"><small>Risk</small><span>Review required (DEMO)</span></div>'
        + '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-gold btn-sm" data-wallet type="button">Approve · disabled</button><button class="btn btn-sm" type="button" id="ask-reset">Cancel</button></div>'
        + '<p class="muted" style="margin-top:8px">Approval is inert in this DEMO. No signature or transaction is created.</p>';
      var ar = $("#ask-reset"); if (ar) ar.addEventListener("click", function(){ askOut.innerHTML = '<p class="muted">Ask anything to see how the ARVOX agent will explain before approval.</p>'; });
      $all("[data-wallet]", askOut).forEach(function(b){ b.addEventListener("click", function(){ if (wbg) wbg.classList.add("open"); }); });
    }, 900);
  });
})();
