/* AlienWeb shared client-side behavior: theme toggle, mobile nav, tool search, copy helper */
(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var THEME_KEY = "alienweb-theme";

  function applyTheme(theme) {
    if (theme === "dark" || theme === "light") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(savedTheme);

  function currentEffectiveTheme() {
    var attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = currentEffectiveTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    }

    /* ---------- Mobile nav ---------- */
    var menuBtn = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        nav.classList.toggle("open");
        var expanded = nav.classList.contains("open");
        menuBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      });
      nav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("open"); });
      });
    }

    /* ---------- Global header search -> redirect to homepage with query ---------- */
    var headerSearchForm = document.querySelector("[data-header-search]");
    if (headerSearchForm) {
      headerSearchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = headerSearchForm.querySelector("input");
        var q = input.value.trim();
        var base = headerSearchForm.getAttribute("data-home") || "/";
        window.location.href = base + (q ? ("?q=" + encodeURIComponent(q)) : "");
      });
    }

    /* ---------- Homepage live tool filter ---------- */
    var filterInput = document.querySelector("[data-tool-filter]");
    var cards = document.querySelectorAll("[data-tool-card]");
    var noResults = document.querySelector("[data-no-results]");
    var sections = document.querySelectorAll("[data-tool-section]");

    function runFilter(term) {
      term = term.toLowerCase().trim();
      var visibleCount = 0;
      cards.forEach(function (card) {
        var haystack = (card.getAttribute("data-keywords") || "") + " " + card.textContent;
        var match = haystack.toLowerCase().indexOf(term) !== -1;
        card.style.display = match ? "" : "none";
        if (match) visibleCount++;
      });
      sections.forEach(function (section) {
        var visible = section.querySelectorAll('[data-tool-card]:not([style*="display: none"])').length;
        section.style.display = visible ? "" : "none";
      });
      if (noResults) noResults.style.display = (term && visibleCount === 0) ? "block" : "none";
    }

    if (filterInput) {
      var params = new URLSearchParams(window.location.search);
      var initialQ = params.get("q") || "";
      if (initialQ) {
        filterInput.value = initialQ;
        runFilter(initialQ);
      }
      filterInput.addEventListener("input", function () { runFilter(filterInput.value); });
    }

    /* ---------- Popular tag quick-filter chips on homepage ---------- */
    document.querySelectorAll("[data-tag-filter]").forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        if (!filterInput) return;
        e.preventDefault();
        var term = chip.getAttribute("data-tag-filter");
        filterInput.value = term;
        runFilter(term);
        filterInput.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    /* ---------- Generic copy-to-clipboard ---------- */
    document.querySelectorAll("[data-copy-target]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetSel = btn.getAttribute("data-copy-target");
        var target = document.querySelector(targetSel);
        if (!target) return;
        var text = "value" in target ? target.value : target.textContent;
        navigator.clipboard.writeText(text).then(function () {
          var feedback = btn.parentElement.querySelector(".copy-feedback");
          if (feedback) {
            feedback.classList.add("show");
            setTimeout(function () { feedback.classList.remove("show"); }, 1500);
          }
        }).catch(function () {});
      });
    });
  });
})();
