/* AC review widget v3 — streamed-markup hydration.
 * Same UI and behavior as v2; the input changed from a JSON __DATA__ blob to
 * semantic markup streamed into the page (<ac-review>/<ac-flow>/<ac-scenario>/<ac-oq>),
 * which is human-readable while it streams and is harvested here on load.
 *
 * Exposes:
 *   window.ACR_HYDRATE()            — harvest the <ac-review> markup in the page, replace it with the interactive widget.
 *   window.ACR_INIT(data, mountSel) — v2-compatible entry point (JSON data + mount selector), kept for the inline fallback path.
 *
 * Publish minified as review.v3.min.js under a new tag (pin skills to a commit hash, not a floating tag).
 */
(function () {
  "use strict";

  var CSS = '#acr-root{max-width:680px;font-size:13.5px}.acr-flow{margin:0 0 1.5rem}.acr-flowhead{display:flex;align-items:center;gap:10px;margin:0 0 4px;cursor:pointer}.acr-chev{background:none;border:none;padding:0;width:20px;height:20px;color:var(--text-secondary);cursor:pointer;font-size:16px;flex:none;display:inline-flex;align-items:center;justify-content:center}.acr-flownum{flex:none;font-size:12px;font-weight:500;padding:3px 10px;border-radius:12px;background:var(--bg-accent);color:var(--text-accent)}.acr-flowtitle{font-size:15px;font-weight:500;color:var(--text-primary);flex:1}.acr-scope{font-size:12px;color:var(--text-muted);margin:0 0 2px;padding-left:30px}.acr-ind{font-size:12px;font-weight:500;color:var(--text-secondary);margin:0 0 10px;padding-left:30px}.acr-ind.done{color:var(--text-success)}.acr-content{padding-left:30px}.acr-card{background:var(--surface-2);border:0.5px solid var(--border);border-left-width:3px;border-left-color:var(--border-strong);border-radius:0 12px 12px 0;padding:12px 16px;margin:0 0 10px;transition:border-color .15s}.acr-card.is-confirmed{border-left-color:#639922}.acr-card.is-edited{border-left-color:#EF9F27}.acr-card.is-removed{border-left-color:#E24B4A}.acr-card.is-adopt{border-left-color:#639922}.acr-card.is-answer{border-left-color:#378ADD}.acr-card.is-discard{border-left-color:#E24B4A}.is-removed .acr-name,.is-removed .acr-gwt,.is-removed .acr-ta,.is-removed .acr-note,.is-removed .acr-dim{opacity:0.45}.is-removed .acr-name{text-decoration:line-through}.is-discard .acr-qtext{text-decoration:line-through;color:var(--text-muted);opacity:0.6}.acr-head{display:flex;align-items:center;gap:8px;margin:0 0 8px}.acr-name{font-size:14px;font-weight:500;flex:1;color:var(--text-primary)}.acr-badge{flex:none;font-size:11px;font-weight:500;padding:2px 8px;border-radius:10px}.acr-badge.confirmed{background:var(--bg-success);color:var(--text-success)}.acr-badge.edited{background:var(--bg-warning);color:var(--text-warning)}.acr-badge.removed{background:var(--bg-danger);color:var(--text-danger)}.acr-chip{flex:none;font-size:11px;font-weight:500;padding:2px 10px;border-radius:10px;border:1px solid currentColor;background:transparent}.acr-gwt{line-height:1.7;color:var(--text-primary)}.acr-gwt b{color:var(--text-accent);font-weight:500}.acr-ta{width:100%;box-sizing:border-box;font-size:13px;line-height:1.6}.acr-note{width:100%;box-sizing:border-box;margin-top:8px;font-size:12.5px}.acr-btn{padding:4px 12px;font-size:12px;flex:none;border-radius:14px}.acr-btn[aria-pressed="true"]{background:var(--bg-accent);color:var(--text-accent);border-color:var(--border-accent);font-weight:500}.acr-btn.good[aria-pressed="true"]{background:var(--bg-success);color:var(--text-success);border-color:var(--border-success)}.acr-btn.danger[aria-pressed="true"]{background:var(--bg-danger);color:var(--text-danger);border-color:var(--border-danger)}.acr-btn:disabled{opacity:0.45;cursor:default}.acr-qtext{font-size:13.5px;font-weight:500;flex:1;line-height:1.5;color:var(--text-primary)}.acr-sugg{font-size:12.5px;line-height:1.55;color:var(--text-secondary);background:var(--surface-1);border-radius:var(--radius);padding:8px 12px;margin:8px 0}.acr-sugg b{font-weight:500;color:var(--text-primary)}.acr-opts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.acr-status{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;margin-top:10px}.acr-status.muted{color:var(--text-muted)}.acr-status.good{color:var(--text-success)}.acr-status.info{color:var(--text-accent)}.acr-status.bad{color:var(--text-danger)}.acr-secthead{font-size:12px;font-weight:500;letter-spacing:0.04em;color:var(--text-muted);margin:14px 0 8px;text-transform:uppercase}.acr-src{font-size:11px;color:var(--text-muted);margin-top:7px}.acr-src a{color:var(--text-accent);text-decoration:none;font-weight:500}.acr-src a:hover{text-decoration:underline}.is-removed .acr-src{opacity:0.45}';

  function ensureCss() {
    if (document.getElementById("acr-style")) return;
    var s = document.createElement("style");
    s.id = "acr-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function shell(container) {
    container.innerHTML = "";
    var root = document.createElement("div");
    root.id = "acr-root";
    var bar = document.createElement("div");
    bar.id = "acr-bar";
    bar.style.cssText = "display:flex;justify-content:flex-end;align-items:center;max-width:680px;padding:4px 0 1rem";
    var prog = document.createElement("span");
    prog.id = "acr-prog";
    prog.style.cssText = "margin-right:auto;font-size:12px;font-weight:500;color:var(--text-secondary)";
    var submit = document.createElement("button");
    submit.type = "button";
    submit.id = "acr-submit";
    submit.style.cssText = "background:var(--fill-accent);color:var(--on-accent);border:none;padding:9px 22px;font-weight:500";
    submit.innerHTML = "Apply decisions &amp; finalize ↗";
    bar.appendChild(prog);
    bar.appendChild(submit);
    container.appendChild(root);
    container.appendChild(bar);
  }

  /* Harvest the streamed <ac-review> markup into the v2 data shape.
   * Supported markup:
   *   <ac-review ticket="AIR-1234" collapsed>
   *     <ac-srcdefs hidden><a id="F" href="...">Figma · Flight selection</a>...</ac-srcdefs>
   *     <ac-flow name="Flow 1 - Title">
   *       <ac-scope>POS(s): ... | Platform: ...</ac-scope>
   *       <ac-scenario name="Title">
   *         <ac-gwt>Given ...</ac-gwt><ac-gwt>When ...</ac-gwt><ac-gwt>Then ...</ac-gwt>
   *         <ac-srcs><ac-src ref="F">Figma · Flight selection</ac-src></ac-srcs>   (or inline <a href="...">label</a>)
   *       </ac-scenario>
   *       <ac-oq stakeholder="Backend"><ac-qtext>...?</ac-qtext><ac-sugg>...</ac-sugg></ac-oq>
   *     </ac-flow>
   *   </ac-review>
   */
  function harvest(w) {
    var defs = {};
    w.querySelectorAll("ac-srcdefs a").forEach(function (a) {
      if (a.id) defs[a.id] = { label: a.textContent, url: a.getAttribute("href") };
    });
    var e = {
      ticket: w.getAttribute("ticket") || "",
      startCollapsed: w.hasAttribute("collapsed"),
      flows: []
    };
    w.querySelectorAll("ac-flow").forEach(function (f) {
      var fl = { title: f.getAttribute("name") || "", scenarios: [], openQuestions: [] };
      var sc = f.querySelector("ac-scope");
      if (sc) fl.scope = sc.textContent;
      f.querySelectorAll("ac-scenario").forEach(function (s) {
        var o = { title: s.getAttribute("name") || "", gwt: [], sources: [] };
        s.querySelectorAll("ac-gwt").forEach(function (g) { o.gwt.push(g.textContent); });
        s.querySelectorAll("ac-srcs ac-src, ac-srcs a").forEach(function (x) {
          if (x.tagName === "A") {
            o.sources.push({ label: x.textContent, url: x.getAttribute("href") });
          } else {
            var d = defs[x.getAttribute("ref")];
            if (d) o.sources.push({ label: x.textContent || d.label, url: d.url });
          }
        });
        fl.scenarios.push(o);
      });
      f.querySelectorAll("ac-oq").forEach(function (q) {
        var t = q.querySelector("ac-qtext");
        var o = { text: t ? t.textContent : "", stakeholder: q.getAttribute("stakeholder") || "" };
        var sg = q.querySelector("ac-sugg");
        if (sg) o.suggestion = sg.textContent;
        fl.openQuestions.push(o);
      });
      e.flows.push(fl);
    });
    return e;
  }

  /* Renderer — v2 logic verbatim (chip palette extended with Data and QA). */
  function render(e) {
    var t = { Product: "#BA7517", Frontend: "#378ADD", Backend: "#1D9E75", UX: "#D4537E", Data: "#8B7EC8", QA: "#888780" },
      n = /^(Given|When|Then|And)\b/, a = [],
      r = "acr:" + (e.ticket || e.flows.map(function (e) { return e.title }).join("|")).slice(0, 180), i = !1;
    function o() { if (i) try { localStorage.setItem(r, JSON.stringify({ f: a.map(function (e) { return { c: e.collapsed, s: e.scenarios.map(function (e) { return { t: e.ta.value, n: e.note.value, cf: !!e.confirmed, rm: !!e.removed } }), q: e.oqs.map(function (e) { return { m: e.mode, a: e.ans.value } }) } }) })) } catch (e) { } }
    function d(e, t, n) { var a = document.createElement(e); return t && (a.className = t), void 0 !== n && (a.textContent = n), a }
    function s(e) { var t = document.createElement("div"); return t.textContent = e, t.innerHTML }
    function c(e) { return e.split("\n").map(function (e) { var t = e.match(n); return t ? "<b>" + t[1] + "</b>" + s(e.slice(t[1].length)) : s(e) }).join("<br>") }
    var l = document.getElementById("acr-root");
    e.flows.forEach(function (n, r) {
      var i = { scenarios: [], oqs: [], collapsed: !1 }; a.push(i);
      var p = d("div", "acr-flow"), u = d("div", "acr-flowhead"), m = d("button", "acr-chev");
      m.type = "button", m.setAttribute("aria-label", "Collapse flow"), m.innerHTML = '<i class="ti ti-chevron-down" aria-hidden="true"></i>';
      var f = d("span", "acr-flownum", 0 === n.title.indexOf("Analytics") ? "Analytics" : "Flow " + (r + 1)),
        v = d("span", "acr-flowtitle", n.title.replace(/^Flow \d+ - /, "").replace(/^Analytics$/, "Events & tracking"));
      u.appendChild(m), u.appendChild(f), u.appendChild(v), p.appendChild(u), n.scope && p.appendChild(d("div", "acr-scope", n.scope));
      var h = d("div", "acr-ind"); p.appendChild(h);
      var g = d("div", "acr-content");
      function b() {
        var e = 0, t = 0, n = 0;
        i.scenarios.forEach(function (n) { n.removed ? t++ : n.confirmed && e++ }), i.oqs.forEach(function (e) { "open" !== e.mode && n++ });
        var r = [];
        i.scenarios.length && (r.push(e + "/" + i.scenarios.length + " scenarios confirmed"), t && r.push(t + " removed")), i.oqs.length && r.push(n + "/" + i.oqs.length + " questions resolved"), h.textContent = r.join(" · ") || "";
        var d = i.scenarios.every(function (e) { return e.removed || e.confirmed }) && i.oqs.every(function (e) { return "open" !== e.mode });
        h.classList.toggle("done", d && i.scenarios.length + i.oqs.length > 0), function () {
          var e = 0, t = 0, n = 0, r = 0;
          a.forEach(function (a) { a.scenarios.forEach(function (n) { t++, n.confirmed && !n.removed && e++ }), a.oqs.forEach(function (e) { r++, "open" !== e.mode && n++ }) });
          var i = [];
          t && i.push(e + "/" + t + " scenarios confirmed"), r && i.push(n + "/" + r + " questions addressed"), document.getElementById("acr-prog").textContent = i.join(" · ")
        }(), o()
      }
      function C() { i.collapsed = !i.collapsed, g.hidden = i.collapsed, m.innerHTML = '<i class="ti ti-chevron-' + (i.collapsed ? "right" : "down") + '" aria-hidden="true"></i>', m.setAttribute("aria-label", i.collapsed ? "Expand flow" : "Collapse flow"), o() }
      p.appendChild(g), i.setCollapsed = function (e) { !!e !== i.collapsed && C() }, u.addEventListener("click", C),
        (n.scenarios || []).forEach(function (t, n) {
          var a = { removed: !1, editing: !1, confirmed: !1 }; i.scenarios.push(a);
          var r = d("div", "acr-card"), s = d("div", "acr-head"), l = d("span", "acr-name", n + 1 + ". " + t.title), p = d("span", "acr-badge"); p.hidden = !0;
          var u = d("button", "acr-btn good", "Confirm"); u.type = "button", u.setAttribute("aria-pressed", "false");
          var m = d("button", "acr-btn", "Edit"); m.type = "button", m.setAttribute("aria-pressed", "false");
          var f = d("button", "acr-btn danger", "Remove"); f.type = "button", f.setAttribute("aria-pressed", "false"),
            s.appendChild(l), s.appendChild(p), s.appendChild(u), s.appendChild(m), s.appendChild(f), r.appendChild(s);
          var v = d("div", "acr-gwt"); v.innerHTML = c(t.gwt.join("\n"));
          var h = document.createElement("textarea");
          h.className = "acr-ta", h.rows = Math.max(3, t.gwt.length), h.value = t.gwt.join("\n"), h.hidden = !0, a.original = h.value, r.appendChild(v), r.appendChild(h);
          var C = t.sources || (t.src || []).map(function (t) { return (e.srcmap || {})[t] }).filter(Boolean);
          if (C.length) {
            var E = d("div", "acr-src");
            E.appendChild(document.createTextNode("Sources: ")), C.forEach(function (e, t) {
              t > 0 && E.appendChild(document.createTextNode(" · "));
              var n = document.createElement("a");
              n.href = e.url, n.textContent = e.label, n.title = e.url, E.appendChild(n)
            }), r.appendChild(E)
          }
          var w = document.createElement("input");
          function y() {
            var e = h.value !== a.original;
            a.edited = e, p.hidden = !(e || a.removed || a.confirmed), a.removed ? (p.className = "acr-badge removed", p.textContent = "will be removed") : a.confirmed ? (p.className = "acr-badge confirmed", p.textContent = "confirmed") : e && (p.className = "acr-badge edited", p.textContent = "edited"),
              r.classList.toggle("is-confirmed", a.confirmed && !a.removed), r.classList.toggle("is-edited", e && !a.removed && !a.confirmed), r.classList.toggle("is-removed", a.removed), b()
          }
          w.type = "text", w.className = "acr-note", w.placeholder = "Suggest a change (optional) — I'll rework this scenario accordingly", r.appendChild(w),
            u.addEventListener("click", function (e) { e.stopPropagation(), a.confirmed = !a.confirmed, u.setAttribute("aria-pressed", String(a.confirmed)), y() }),
            m.addEventListener("click", function (e) { e.stopPropagation(), a.editing = !a.editing, m.setAttribute("aria-pressed", String(a.editing)), m.textContent = a.editing ? "Done" : "Edit", h.hidden = !a.editing, v.hidden = a.editing, a.editing || (v.innerHTML = c(h.value), y()) }),
            h.addEventListener("input", function () { a.confirmed && (a.confirmed = !1, u.setAttribute("aria-pressed", "false")), y() }),
            f.addEventListener("click", function (e) { e.stopPropagation(), a.removed = !a.removed, f.setAttribute("aria-pressed", String(a.removed)), f.textContent = a.removed ? "Restore" : "Remove", a.removed && (a.confirmed = !1, u.setAttribute("aria-pressed", "false"), a.editing && (a.editing = !1, m.setAttribute("aria-pressed", "false"), m.textContent = "Edit", h.hidden = !0, v.hidden = !1, v.innerHTML = c(h.value))), h.disabled = a.removed, w.disabled = a.removed, m.disabled = a.removed, u.disabled = a.removed, y() }),
            w.addEventListener("input", o),
            a.restore = function (e) { h.value = "string" == typeof e.t ? e.t : a.original, w.value = e.n || "", a.confirmed = !!e.cf, u.setAttribute("aria-pressed", String(a.confirmed)), e.rm && (a.removed = !0, f.setAttribute("aria-pressed", "true"), f.textContent = "Restore", h.disabled = !0, w.disabled = !0, m.disabled = !0, u.disabled = !0), v.innerHTML = c(h.value), y() },
            a.ta = h, a.note = w, a.title = t.title, g.appendChild(r)
        }),
        (n.openQuestions || []).length && g.appendChild(d("div", "acr-secthead", "Open questions")),
        (n.openQuestions || []).forEach(function (e, n) {
          var a = { mode: "open" }; i.oqs.push(a);
          var r = d("div", "acr-card"), c = d("div", "acr-head"), l = d("span", "acr-qtext", e.text), p = d("span", "acr-chip", e.stakeholder);
          if (p.style.color = t[e.stakeholder] || "var(--text-secondary)", c.appendChild(l), c.appendChild(p), r.appendChild(c), e.suggestion) { var u = d("div", "acr-sugg"); u.innerHTML = "<b>Suggested default:</b> " + s(e.suggestion), r.appendChild(u) }
          var m = d("div", "acr-opts"), f = document.createElement("textarea");
          f.className = "acr-ta", f.rows = 2, f.placeholder = "Type your answer — it becomes a requirement", f.hidden = !0, f.style.marginTop = "8px";
          var v = d("div", "acr-status muted"),
            h = { open: ["muted", "○", "Stays in the open questions list"], adopt: ["good", "✓", "Default adopted — it will be written into the AC as confirmed"], answer: ["info", "✎", "Your answer will be folded into the AC as a requirement"], discard: ["bad", "✕", "This question will be removed from the AC"] };
          function C() { var e = h[a.mode]; v.className = "acr-status " + e[0], v.textContent = e[1] + "  " + e[2], r.classList.toggle("is-adopt", "adopt" === a.mode), r.classList.toggle("is-answer", "answer" === a.mode), r.classList.toggle("is-discard", "discard" === a.mode), b() }
          var E = [["open", "Leave open", ""]].concat(e.suggestion ? [["adopt", "Adopt suggestion", "good"]] : []).concat([["answer", "Answer", ""], ["discard", "Discard", "danger"]]), w = {};
          E.forEach(function (e) {
            var t = d("button", ("acr-btn " + e[2]).trim(), e[1]);
            t.type = "button", t.setAttribute("aria-pressed", String("open" === e[0])), w[e[0]] = t,
              t.addEventListener("click", function (t) { t.stopPropagation(), a.mode = e[0], Object.keys(w).forEach(function (t) { w[t].setAttribute("aria-pressed", String(t === e[0])) }), f.hidden = "answer" !== e[0], "answer" === e[0] && f.focus(), C() }), m.appendChild(t)
          }), r.appendChild(m), r.appendChild(f), r.appendChild(v), C(), f.addEventListener("input", o),
            a.restore = function (e) { f.value = e.a || "", e.m && "open" !== e.m && w[e.m] && (a.mode = e.m, Object.keys(w).forEach(function (t) { w[t].setAttribute("aria-pressed", String(t === e.m)) }), f.hidden = "answer" !== e.m, C()) },
            a.ans = f, a.text = e.text, a.stakeholder = e.stakeholder, a.suggestion = e.suggestion || "", g.appendChild(r)
        }), b(), l.appendChild(p)
    }),
      e.startCollapsed && a.forEach(function (e) { e.setCollapsed(!0) });
    try {
      var p = JSON.parse(localStorage.getItem(r) || "null");
      p && p.f && p.f.length === a.length && p.f.forEach(function (e, t) {
        var n = a[t];
        (e.s || []).forEach(function (e, t) { n.scenarios[t] && n.scenarios[t].restore(e) }), (e.q || []).forEach(function (e, t) { n.oqs[t] && n.oqs[t].restore(e) }), n.setCollapsed(!!e.c)
      })
    } catch (e) { }
    i = !0,
      document.getElementById("acr-submit").addEventListener("click", function () {
        var t = ["AC review decisions (from acceptance-criteria review widget):"];
        e.flows.forEach(function (e, n) {
          t.push(e.title + ":"),
            a[n].scenarios.forEach(function (e, n) {
              var a, r = e.ta.value !== e.original;
              a = e.removed ? "removed" : e.confirmed && r ? "confirmed with edits:\n" + e.ta.value : e.confirmed ? "confirmed" : r ? "edited to:\n" + e.ta.value : "kept",
                t.push("- Scenario " + (n + 1) + " (" + e.title + "): " + a), !e.removed && e.note.value.trim() && t.push("  Suggestion: " + e.note.value.trim())
            }),
            a[n].oqs.forEach(function (e, n) {
              var a;
              a = "answer" === e.mode ? "answered: " + (e.ans.value.trim() || "(empty answer — treat as left open)") : "adopt" === e.mode ? "adopted suggested default: " + e.suggestion : "discard" === e.mode ? "discarded" : "left open",
                t.push("- OQ " + (n + 1) + " [" + e.stakeholder + "] " + e.text + " → " + a)
            })
        }),
          t.push(""), t.push("Apply these decisions per the acceptance-criteria skill and produce the final acceptance criteria (markdown only).");
        var n = document.getElementById("acr-submit");
        n.disabled = !0, n.textContent = "Submitted ✓";
        try { localStorage.removeItem(r) } catch (e) { }
        sendPrompt(t.join("\n"))
      })
  }

  window.ACR_INIT = function (data, sel) {
    ensureCss();
    var m = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!m) return;
    shell(m);
    render(data);
  };

  window.ACR_HYDRATE = function () {
    ensureCss();
    var w = document.querySelector("ac-review");
    if (!w) return;
    var e = harvest(w);
    var holder = document.createElement("div");
    w.parentNode.insertBefore(holder, w);
    w.remove();
    var n = document.getElementById("wc-note");
    if (n) n.remove();
    shell(holder);
    render(e);
  };
})();
