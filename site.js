/* The Stumpjumpers: shared page script */

/* ====== FIREBASE SETTINGS (for the hit counter) ====== */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyA5VBA6j4vQtzAOr8uFhifTmmIcL_UKfFk",
  authDomain: "stumpjumpershitcounter.firebaseapp.com",
  projectId: "stumpjumpershitcounter",
  storageBucket: "stumpjumpershitcounter.firebasestorage.app",
  messagingSenderId: "804440607834",
  appId: "1:804440607834:web:b2b51b328a30a5443fdc63"
};
var COUNTER_BASE = 0;

var TAGLINES = [
  "Honest NYC Playground Reviews from a Dad Who Actually Goes Down the Slide",
  "NYC Playground Reviews, Tested Firsthand by One Dad and One Daughter",
  "Real NYC Playground Reviews. No Copy-Pasta, Just Dad-Tested.",
  "Modern NYC Playground Reviews from the '90s",
  "A '90s Kid on a '90s Bike, Reviewing NYC Playgrounds in 2026",
  "NYC Playgrounds, Reviewed by a Dad Who's Been Climbing Them Since 1994",
  "Biking to Every NYC Playground So You Know Which Ones Are Worth It",
  "One Dad, One Kid, One Old Bike: Honest Reviews of NYC Playgrounds",
  "Honest NYC Playground Reviews, Dad-Tested and Kid-Approved",
  "The Straight Scoop on NYC Playgrounds"
];

(function () {
  "use strict";

  /* Old single-page links (#/p/slug, #/map) -> new pages */
  var LEGACY = window.SJ_LEGACY || null;
  if (LEGACY && location.hash) {
    var m = location.hash.match(/^#\/p\/([\w-]+)/);
    if (m && LEGACY[m[1]]) { location.replace(LEGACY[m[1]]); return; }
    if (location.hash === "#/map") { location.replace("map.html"); return; }
  }

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sess(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* Rotating tagline: next one on each visit */
  var tag = document.getElementById("tagline");
  if (tag) {
    var last = parseInt(store("sj_tagline"), 10), i;
    i = isNaN(last) ? Math.floor(Math.random() * TAGLINES.length) : (last + 1) % TAGLINES.length;
    store("sj_tagline", String(i));
    tag.textContent = TAGLINES[i].replace(/'/g, "\u2019");
  }

  /* Mobile menu */
  var mt = document.getElementById("menuToggle"), nb = document.getElementById("navBody");
  if (mt && nb) {
    mt.addEventListener("click", function () {
      var open = nb.classList.toggle("open");
      mt.setAttribute("aria-expanded", open);
      mt.firstChild.textContent = open ? "\u2715 CLOSE MENU " : "\u2630 MENU ";
    });
  }

  /* Lightbox */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = document.getElementById("lbImg"), lbCap = document.getElementById("lbCap");
    document.addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest("[data-full]") : null;
      if (!el) return;
      lbImg.src = el.getAttribute("data-full");
      lbImg.alt = el.getAttribute("data-alt") || "";
      lbCap.innerHTML = el.getAttribute("data-cap") || "";
      lb.classList.add("open");
    });
    lb.addEventListener("click", function () { lb.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("open"); });
  }

  /* Back to top (mobile) */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    toTop.addEventListener("click", function () { window.scrollTo({top: 0, behavior: reduce ? "auto" : "smooth"}); });
    var upd = function () { toTop.classList.toggle("show", window.scrollY > 700); };
    window.addEventListener("scroll", upd, {passive: true});
    upd();
  }

  /* Hit counter (home page only) */
  var digits = document.getElementById("hitDigits");
  if (digits) {
    var show = function (n) {
      var s = n == null ? "------" : String(n);
      while (s.length < 6) s = "0" + s;
      digits.innerHTML = s.split("").map(function (d) { return "<span>" + d + "</span>"; }).join("");
    };
    show(COUNTER_BASE);
    var label = document.getElementById("hitLabel");
    var load = function (src) { return new Promise(function (ok, fail) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); }); };
    if (FIREBASE_CONFIG.apiKey) {
      var V = "10.12.2";
      load("https://www.gstatic.com/firebasejs/" + V + "/firebase-app-compat.js")
        .then(function () { return load("https://www.gstatic.com/firebasejs/" + V + "/firebase-firestore-compat.js"); })
        .then(function () {
          var fb = window.firebase;
          var app = fb.apps.length ? fb.app() : fb.initializeApp(FIREBASE_CONFIG);
          var ref = app.firestore().doc("stats/hits");
          ref.onSnapshot(function (s) {
            var c = s.exists && typeof s.data().count === "number" ? s.data().count : 0;
            show(COUNTER_BASE + c);
          }, function () {});
          if (!sess("sj_counted")) {
            sess("sj_counted", "1");
            ref.set({count: fb.firestore.FieldValue.increment(1)}, {merge: true}).catch(function () {});
          }
        })
        .catch(function () { if (label) label.textContent = "Counter is napping. Check back soon!"; });
    }
  }
})();
