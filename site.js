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
var COUNTER_BASE = 10000;

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
  "The Straight Scoop on NYC Playgrounds",
  "The King of the Monkey Bars Types Again!"
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

  /* Contact buttons: the address is only assembled when a person clicks,
     so spam bots scanning the page code never see it. */
  var parts = ["dadsrepmujpmutseht", "moc.liamg"];
  var rev = function (x) { return x.split("").reverse().join(""); };
  Array.prototype.forEach.call(document.querySelectorAll(".contactBtn"), function (btn) {
    btn.addEventListener("click", function () {
      var addr = rev(parts[0]) + "\u0040" + rev(parts[1]);
      var subject = encodeURIComponent(btn.getAttribute("data-topic") || "Hello");
      var href = "mai" + "lto:" + addr + "?subject=" + subject;
      var out = btn.parentNode.querySelector(".contactReveal");
      if (out) out.innerHTML = '<a href="' + href + '">' + addr + '</a>';
      window.location.href = href;
    });
  });

  /* Shared Firebase loader (hit counter + poll) */
  var fsPromise = null;
  function getFS() {
    if (fsPromise) return fsPromise;
    var load = function (src) { return new Promise(function (ok, fail) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); }); };
    var V = "10.12.2";
    fsPromise = !FIREBASE_CONFIG.apiKey ? Promise.reject(new Error("no config")) :
      load("https://www.gstatic.com/firebasejs/" + V + "/firebase-app-compat.js")
        .then(function () { return load("https://www.gstatic.com/firebasejs/" + V + "/firebase-firestore-compat.js"); })
        .then(function () {
          var fb = window.firebase;
          var app = fb.apps.length ? fb.app() : fb.initializeApp(FIREBASE_CONFIG);
          return {fb: fb, db: app.firestore()};
        });
    return fsPromise;
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
    getFS().then(function (F) {
      var ref = F.db.doc("stats/hits");
      ref.onSnapshot(function (s) {
        var c = s.exists && typeof s.data().count === "number" ? s.data().count : 0;
        show(COUNTER_BASE + c);
      }, function () {});
      if (!sess("sj_counted")) {
        sess("sj_counted", "1");
        ref.set({count: F.fb.firestore.FieldValue.increment(1)}, {merge: true}).catch(function () {});
      }
    }).catch(function () { if (label) label.textContent = "Counter is napping. Check back soon!"; });
  }

  /* Site poll (home page only) */
  var pollBox = document.getElementById("pollBox");
  if (pollBox) {
    var CHOICES = [
      ["heckscher", "Heckscher"], ["pier6", "Pier 6 Brooklyn"], ["battery", "Battery Playscape"],
      ["domino", "Domino Park"], ["pier26", "Pier 26 (Sturgeon)"], ["yard", "The Yard"], ["other", "Other"]
    ];
    var LINKS = window.SJ_POLL_LINKS || {};
    var form = document.getElementById("pollForm"), results = document.getElementById("pollResults");
    var msg = document.getElementById("pollMsg"), voteBtn = document.getElementById("voteBtn");
    var myVote = store("sj_poll_fav");
    var latest = null;
    var render = function (t) {
      latest = t;
      var total = 0; CHOICES.forEach(function (c) { total += t[c[0]] || 0; });
      var html = CHOICES.map(function (c) {
        var n = t[c[0]] || 0, pct = total ? Math.round(100 * n / total) : 0;
        var name = LINKS[c[0]] ? '<a href="' + LINKS[c[0]] + '">' + c[1] + '</a>' : c[1];
        return '<div class="pollRow"><span class="' + (myVote === c[0] ? "mine" : "") + '">' + name + (myVote === c[0] ? " &#9733;" : "") +
          '</span><span>' + n + '</span></div><div class="pollBarWrap"><div class="pollBar" style="width:' + pct + '%"></div></div>';
      }).join("");
      results.innerHTML = html + '<div class="pollTotal">' + total + " vote" + (total === 1 ? "" : "s") + " so far!</div>";
    };
    var showResults = function () { form.hidden = true; results.hidden = false; };
    if (myVote) { showResults(); msg.textContent = "Thanks for voting!"; }
    var unsub = null;
    getFS().then(function (F) {
      F.db.doc("poll/favorite").onSnapshot(function (s) { render(s.exists ? s.data() : {}); }, function () {});
      voteBtn.addEventListener("click", function () {
        var picked = form.querySelector('input[name="fav"]:checked');
        if (!picked) { msg.textContent = "Pick one first, partner!"; return; }
        voteBtn.disabled = true; msg.textContent = "Counting your vote...";
        var upd = {}; upd[picked.value] = F.fb.firestore.FieldValue.increment(1);
        F.db.doc("poll/favorite").set(upd, {merge: true}).then(function () {
          myVote = picked.value; store("sj_poll_fav", myVote);
          if (latest) render(latest);
          showResults(); msg.textContent = "Thanks for voting!";
        }).catch(function () { voteBtn.disabled = false; msg.textContent = "Your vote didn't go through. Please try again."; });
      });
    }).catch(function () {
      voteBtn.addEventListener("click", function () { msg.textContent = "The poll is napping. Please try again later."; });
    });
    document.getElementById("pollPeek").addEventListener("click", function (e) {
      e.preventDefault();
      if (!latest) { msg.textContent = "No votes yet!"; return; }
      showResults(); msg.innerHTML = '<a href="#" id="pollBack">&laquo; Back to voting</a>';
      document.getElementById("pollBack").addEventListener("click", function (ev) { ev.preventDefault(); form.hidden = false; results.hidden = true; msg.textContent = ""; });
    });
  }
})();

/* Fill empty space on home-page posts with the start of the review:
   beside the photo when the photo is taller, or under the photo when the text side is taller. */
(function () {
  function fillExcerpts() {
    var list = document.querySelectorAll(".visitSummary");
    for (var i = 0; i < list.length; i++) {
      var vs = list[i], img = vs.querySelector(".thumbLeft"), mt = vs.querySelector(".moreText");
      if (!img || !mt) continue;
      var left = vs.querySelector(".moreLeft");
      mt.style.display = "none"; mt.style.height = "";
      if (left) left.style.display = "none";
      if (window.getComputedStyle(img).cssFloat === "none") continue; /* stacked mobile layout */
      var vsTop = vs.getBoundingClientRect().top;
      var imgBottom = img.getBoundingClientRect().bottom - vsTop;
      /* bottom of the text column (snippet + Stump Report) */
      var rb = vs.querySelector(".ratingsBlock");
      var textBottom = (rb ? rb.getBoundingClientRect().bottom : vs.getBoundingClientRect().top) - vsTop;
      if (imgBottom - textBottom >= 70) {
        /* photo is taller: fill beside it */
        mt.style.display = "flow-root"; mt.style.height = "0px";
        var top = mt.getBoundingClientRect().top - vsTop;
        var room = Math.floor(imgBottom - top - 4);
        if (room < 60) { mt.style.display = "none"; continue; }
        mt.style.height = room + "px";
      } else if (textBottom - imgBottom >= 80) {
        /* text side is taller: fill under the photo */
        if (!left) {
          left = document.createElement("div");
          left.className = "moreText moreLeft";
          left.setAttribute("aria-hidden", "true");
          left.innerHTML = mt.innerHTML;
          img.parentNode.insertBefore(left, img.nextSibling);
        }
        var cs = window.getComputedStyle(img);
        left.style.width = img.offsetWidth + "px";
        left.style.marginRight = cs.marginRight;
        left.style.display = "block"; left.style.height = "0px";
        var ltop = left.getBoundingClientRect().top - vsTop;
        var lroom = Math.floor(textBottom - ltop);
        if (lroom < 70) { left.style.display = "none"; continue; }
        left.style.height = lroom + "px";
      }
    }
  }
  var timer;
  function later() { clearTimeout(timer); timer = setTimeout(fillExcerpts, 120); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fillExcerpts); else fillExcerpts();
  window.addEventListener("load", fillExcerpts);
  window.addEventListener("resize", later);
  window.addEventListener("orientationchange", later);
})();

/* Make sure looping "GIF" videos start, even where autoplay is fussy. */
(function () {
  var vids = document.querySelectorAll("video[autoplay]");
  for (var i = 0; i < vids.length; i++) {
    var v = vids[i]; v.muted = true;
    try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
})();
