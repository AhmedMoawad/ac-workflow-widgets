/* AC review widget v3.1 — streamed-markup hydration + interactive review.
   Exposes window.ACR_HYDRATE() (harvest <ac-review> markup) and
   window.ACR_INIT(data, mountSelector) (v2-compatible JSON rendering).
   v3.1 adds: editable scenario titles (fixed index), add-scenario / add-flow,
   flow-level suggestion notes, a mid-review "Note for Claude" box, and
   title-keyed saved-progress restore (survives re-renders that change structure). */
(function () {
  "use strict";
  var STAKE = { Product: "#BA7517", Frontend: "#378ADD", Backend: "#1D9E75", UX: "#D4537E", QA: "#639922", Data: "#7F77DD" };
  var GWT = /^(Given|When|Then|And)\b/;
  var CSS = ".acr-root{max-width:680px;font-size:13.5px}.acr-flow{margin:0 0 1.5rem}.acr-flowhead{display:flex;align-items:center;gap:10px;margin:0 0 4px;cursor:pointer}.acr-chev{background:none;border:none;padding:0;width:20px;height:20px;color:var(--text-secondary);cursor:pointer;font-size:16px;flex:none;display:inline-flex;align-items:center;justify-content:center}.acr-flownum{flex:none;font-size:12px;font-weight:500;padding:3px 10px;border-radius:12px;background:var(--bg-accent);color:var(--text-accent)}.acr-flowtitle{font-size:15px;font-weight:500;color:var(--text-primary);flex:1}.acr-scope{font-size:12px;color:var(--text-muted);margin:0 0 2px;padding-left:30px}.acr-ind{font-size:12px;font-weight:500;color:var(--text-secondary);margin:0 0 10px;padding-left:30px}.acr-ind.done{color:var(--text-success)}.acr-content{padding-left:30px}.acr-card{background:var(--surface-2);border:0.5px solid var(--border);border-left-width:3px;border-left-color:var(--border-strong);border-radius:0 12px 12px 0;padding:12px 16px;margin:0 0 10px;transition:border-color .15s}.acr-card.is-confirmed{border-left-color:#639922}.acr-card.is-edited,.acr-card.is-added{border-left-color:#EF9F27}.acr-card.is-removed{border-left-color:#E24B4A}.acr-card.is-adopt{border-left-color:#639922}.acr-card.is-answer{border-left-color:#378ADD}.acr-card.is-discard{border-left-color:#E24B4A}.is-removed .acr-name,.is-removed .acr-idx,.is-removed .acr-gwt,.is-removed .acr-ta,.is-removed .acr-note,.is-removed .acr-src{opacity:0.45}.is-removed .acr-name{text-decoration:line-through}.is-discard .acr-qtext{text-decoration:line-through;color:var(--text-muted);opacity:0.6}.acr-head{display:flex;align-items:center;gap:8px;margin:0 0 8px}.acr-idx{font-size:14px;font-weight:500;flex:none;color:var(--text-primary)}.acr-name{font-size:14px;font-weight:500;flex:1;color:var(--text-primary)}.acr-ti{flex:1;font-size:14px;font-weight:500;height:32px;box-sizing:border-box}.acr-badge{flex:none;font-size:11px;font-weight:500;padding:2px 8px;border-radius:10px}.acr-badge.confirmed{background:var(--bg-success);color:var(--text-success)}.acr-badge.edited{background:var(--bg-warning);color:var(--text-warning)}.acr-badge.removed{background:var(--bg-danger);color:var(--text-danger)}.acr-badge.added{background:var(--bg-accent);color:var(--text-accent)}.acr-chip{flex:none;font-size:11px;font-weight:500;padding:2px 10px;border-radius:10px;border:1px solid currentColor;background:transparent}.acr-gwt{line-height:1.7;color:var(--text-primary)}.acr-gwt b{color:var(--text-accent);font-weight:500}.acr-ta{width:100%;box-sizing:border-box;font-size:13px;line-height:1.6}.acr-note{width:100%;box-sizing:border-box;margin-top:8px;font-size:12.5px}.acr-fnote{width:100%;box-sizing:border-box;margin-top:2px;font-size:12.5px}.acr-btn{padding:4px 12px;font-size:12px;flex:none;border-radius:14px}.acr-btn[aria-pressed=\"true\"]{background:var(--bg-accent);color:var(--text-accent);border-color:var(--border-accent);font-weight:500}.acr-btn.good[aria-pressed=\"true\"]{background:var(--bg-success);color:var(--text-success);border-color:var(--border-success)}.acr-btn.danger[aria-pressed=\"true\"]{background:var(--bg-danger);color:var(--text-danger);border-color:var(--border-danger)}.acr-btn:disabled{opacity:0.45;cursor:default}.acr-qtext{font-size:13.5px;font-weight:500;flex:1;line-height:1.5;color:var(--text-primary)}.acr-sugg{font-size:12.5px;line-height:1.55;color:var(--text-secondary);background:var(--surface-1);border-radius:var(--radius,8px);padding:8px 12px;margin:8px 0}.acr-sugg b{font-weight:500;color:var(--text-primary)}.acr-opts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.acr-status{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;margin-top:10px}.acr-status.muted{color:var(--text-muted)}.acr-status.good{color:var(--text-success)}.acr-status.info{color:var(--text-accent)}.acr-status.bad{color:var(--text-danger)}.acr-secthead{font-size:12px;font-weight:500;letter-spacing:0.04em;color:var(--text-muted);margin:14px 0 8px;text-transform:uppercase}.acr-src{font-size:11px;color:var(--text-muted);margin-top:7px}.acr-src a{color:var(--text-accent);text-decoration:none;font-weight:500}.acr-src a:hover{text-decoration:underline}.acr-ta,.acr-note,.acr-fnote,.acr-ti{font-family:inherit}.acr-ta::placeholder,.acr-note::placeholder,.acr-fnote::placeholder,.acr-ti::placeholder{font-family:inherit;font-weight:400;color:var(--text-muted)}.acr-add{width:100%;border:1px dashed var(--border-strong);background:transparent;color:var(--text-secondary);border-radius:12px;padding:8px;font-size:12.5px;cursor:pointer;margin:0 0 10px}.acr-notebox{background:var(--surface-1);border-radius:12px;padding:12px 16px;margin:0 0 1rem}.acr-notebox p{font-size:13px;font-weight:500;margin:0 0 6px;color:var(--text-primary)}.acr-notemsg{font-size:12px;color:var(--text-success);margin:8px 0 0}.acr-foot{display:flex;justify-content:flex-end;align-items:center;max-width:680px;padding:4px 0 1rem}.acr-prog{margin-right:auto;font-size:12px;font-weight:500;color:var(--text-secondary)}.acr-submit{background:var(--fill-accent);color:var(--on-accent);border:none;padding:9px 22px;font-weight:500;border-radius:var(--radius,8px)}";

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n; }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function fmtGwt(s) {
    return s.split("\n").map(function (l) {
      var m = l.match(GWT);
      return m ? "<b>" + m[1] + "</b>" + esc(l.slice(m[1].length)) : esc(l);
    }).join("<br>");
  }
  function injectCss() {
    if (document.getElementById("acr-css")) return;
    var st = document.createElement("style"); st.id = "acr-css"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function build(mount, data) {
    injectCss();
    var KEY = "acr2:" + (data.ticket || data.flows.map(function (f) { return f.title; }).join("|")).slice(0, 180);
    var flows = [];        /* state per flow: {title,collapsed,scenarios[],oqs[],added[],fnote,indicator} */
    var addedFlows = [];   /* {ti,scope,body,flowState} */
    var live = false;
    var root = el("div", "acr-root");
    mount.appendChild(root);
    var prog = el("span", "acr-prog", "");
    var noteTa = document.createElement("textarea");

    function save() {
      if (!live) return;
      try {
        var out = { v: 2, note: noteTa.value, f: {}, af: [] };
        flows.forEach(function (f) {
          if (f._isAddedFlow) return;
          var fo = { c: f.collapsed, fn: f.fnote.value, s: {}, q: {}, add: [] };
          f.scenarios.forEach(function (s) {
            if (s.isNew) { fo.add.push({ t: s.ti.value, g: s.ta.value }); }
            else fo.s[s.orig] = { t: s.ti.value, g: s.ta.value, n: s.note.value, cf: !!s.confirmed, rm: !!s.removed };
          });
          f.oqs.forEach(function (q) { fo.q[q.text] = { m: q.mode, a: q.ans.value }; });
          out.f[f.title] = fo;
        });
        addedFlows.forEach(function (af) {
          out.af.push({
            t: af.ti.value, sc: af.scope.value, fn: af.flowState.fnote.value,
            add: af.flowState.scenarios.map(function (s) { return { t: s.ti.value, g: s.ta.value }; })
          });
        });
        localStorage.setItem(KEY, JSON.stringify(out));
      } catch (e) { }
    }

    function globalProgress() {
      var c = 0, t = 0, qa = 0, qt = 0, add = 0;
      flows.forEach(function (f) {
        f.scenarios.forEach(function (s) { if (s.isNew) { add++; return; } t++; if (s.confirmed && !s.removed) c++; });
        f.oqs.forEach(function (q) { qt++; if (q.mode !== "open") qa++; });
      });
      var parts = [];
      if (t) parts.push(c + "/" + t + " scenarios confirmed");
      if (add) parts.push(add + " added");
      if (qt) parts.push(qa + "/" + qt + " questions addressed");
      prog.textContent = parts.join(" · ");
    }

    /* ---- scenario card (existing or added) ---- */
    function scenarioCard(f, spec, isNew, saved) {
      var st = { orig: spec.title || "", isNew: !!isNew, confirmed: false, removed: false, editing: !!isNew };
      f.scenarios.push(st);
      var card = el("div", "acr-card" + (isNew ? " is-added" : ""));
      var head = el("div", "acr-head");
      var idx = el("span", "acr-idx", "");
      var name = el("span", "acr-name", st.orig);
      var ti = document.createElement("input"); ti.type = "text"; ti.className = "acr-ti";
      ti.value = st.orig; ti.placeholder = "Scenario name"; ti.hidden = !isNew; name.hidden = !!isNew;
      var badge = el("span", "acr-badge"); badge.hidden = true;
      var bC = el("button", "acr-btn good", "Confirm"), bE = el("button", "acr-btn", isNew ? "Done" : "Edit"),
        bR = el("button", "acr-btn danger", isNew ? "Discard" : "Remove");
      [bC, bE, bR].forEach(function (b) { b.type = "button"; b.setAttribute("aria-pressed", "false"); });
      if (isNew) { bC.hidden = true; bE.setAttribute("aria-pressed", "true"); }
      head.appendChild(idx); head.appendChild(name); head.appendChild(ti); head.appendChild(badge);
      head.appendChild(bC); head.appendChild(bE); head.appendChild(bR); card.appendChild(head);

      var origG = (spec.gwt || []).join("\n");
      var view = el("div", "acr-gwt"); view.innerHTML = fmtGwt(origG); view.hidden = !!isNew;
      var ta = document.createElement("textarea"); ta.className = "acr-ta";
      ta.rows = Math.max(3, (spec.gwt || []).length); ta.value = origG;
      ta.placeholder = "Given …\nWhen …\nThen …"; ta.hidden = !isNew;
      card.appendChild(view); card.appendChild(ta);

      var srcs = spec.sources || [];
      if (srcs.length) {
        var sw = el("div", "acr-src"); sw.appendChild(document.createTextNode("Sources: "));
        srcs.forEach(function (s, i) {
          if (i > 0) sw.appendChild(document.createTextNode(" · "));
          var a = document.createElement("a"); a.href = s.url; a.textContent = s.label; a.title = s.url; sw.appendChild(a);
        });
        card.appendChild(sw);
      }
      var note = document.createElement("input"); note.type = "text"; note.className = "acr-note";
      note.placeholder = "Suggest a change (optional) — I'll rework this scenario accordingly";
      if (!isNew) card.appendChild(note);

      function paint() {
        var ed = !st.isNew && (ta.value !== origG || ti.value.trim() !== st.orig);
        st.edited = ed;
        badge.hidden = !(ed || st.removed || st.confirmed || st.isNew);
        if (st.removed) { badge.className = "acr-badge removed"; badge.textContent = st.isNew ? "discarded" : "will be removed"; }
        else if (st.confirmed) { badge.className = "acr-badge confirmed"; badge.textContent = "confirmed"; }
        else if (st.isNew) { badge.className = "acr-badge added"; badge.textContent = "added"; }
        else if (ed) { badge.className = "acr-badge edited"; badge.textContent = "edited"; }
        card.classList.toggle("is-confirmed", st.confirmed && !st.removed);
        card.classList.toggle("is-edited", ed && !st.removed && !st.confirmed);
        card.classList.toggle("is-added", st.isNew && !st.removed);
        card.classList.toggle("is-removed", st.removed);
        f.indicator(); globalProgress(); save();
      }
      bC.addEventListener("click", function (e) {
        e.stopPropagation(); st.confirmed = !st.confirmed;
        bC.setAttribute("aria-pressed", String(st.confirmed)); paint();
      });
      bE.addEventListener("click", function (e) {
        e.stopPropagation(); st.editing = !st.editing;
        bE.setAttribute("aria-pressed", String(st.editing)); bE.textContent = st.editing ? "Done" : "Edit";
        ta.hidden = !st.editing; view.hidden = st.editing; ti.hidden = !st.editing; name.hidden = st.editing;
        if (!st.editing) { view.innerHTML = fmtGwt(ta.value); name.textContent = ti.value; paint(); }
      });
      ta.addEventListener("input", function () {
        if (st.confirmed) { st.confirmed = false; bC.setAttribute("aria-pressed", "false"); }
        paint();
      });
      ti.addEventListener("input", function () {
        if (st.confirmed) { st.confirmed = false; bC.setAttribute("aria-pressed", "false"); }
        paint();
      });
      bR.addEventListener("click", function (e) {
        e.stopPropagation();
        if (st.isNew) { /* discard an added card entirely */
          var i = f.scenarios.indexOf(st); if (i >= 0) f.scenarios.splice(i, 1);
          card.remove(); f.renumber(); f.indicator(); globalProgress(); save(); return;
        }
        st.removed = !st.removed;
        bR.setAttribute("aria-pressed", String(st.removed)); bR.textContent = st.removed ? "Restore" : "Remove";
        if (st.removed) {
          st.confirmed = false; bC.setAttribute("aria-pressed", "false");
          if (st.editing) {
            st.editing = false; bE.setAttribute("aria-pressed", "false"); bE.textContent = "Edit";
            ta.hidden = true; view.hidden = false; ti.hidden = true; name.hidden = false;
            view.innerHTML = fmtGwt(ta.value); name.textContent = ti.value;
          }
        }
        ta.disabled = ti.disabled = note.disabled = bE.disabled = bC.disabled = st.removed;
        paint();
      });
      note.addEventListener("input", save);
      st.ti = ti; st.ta = ta; st.note = note; st.origG = origG; st.idxEl = idx; st.card = card;
      if (saved) {
        if (typeof saved.t === "string") { ti.value = saved.t; name.textContent = saved.t; }
        if (typeof saved.g === "string") { ta.value = saved.g; view.innerHTML = fmtGwt(saved.g); }
        note.value = saved.n || "";
        if (saved.cf) { st.confirmed = true; bC.setAttribute("aria-pressed", "true"); }
        if (saved.rm) {
          st.removed = true; st.confirmed = false; bC.setAttribute("aria-pressed", "false");
          bR.setAttribute("aria-pressed", "true"); bR.textContent = "Restore";
          ta.disabled = ti.disabled = note.disabled = bE.disabled = bC.disabled = true;
        }
        paint();
      } else paint();
      return card;
    }

    /* ---- open question card ---- */
    function oqCard(f, q, saved) {
      var st = { mode: "open", text: q.text, stakeholder: q.stakeholder, suggestion: q.suggestion || "" };
      f.oqs.push(st);
      var card = el("div", "acr-card"), head = el("div", "acr-head");
      head.appendChild(el("span", "acr-qtext", q.text));
      var chip = el("span", "acr-chip", q.stakeholder);
      chip.style.color = STAKE[q.stakeholder] || "var(--text-secondary)";
      head.appendChild(chip); card.appendChild(head);
      if (q.suggestion) {
        var sg = el("div", "acr-sugg");
        sg.innerHTML = "<b>Suggested default:</b> " + esc(q.suggestion);
        card.appendChild(sg);
      }
      var opts = el("div", "acr-opts");
      var ans = document.createElement("textarea"); ans.className = "acr-ta"; ans.rows = 2;
      ans.placeholder = "Type your answer — it becomes a requirement"; ans.hidden = true; ans.style.marginTop = "8px";
      var status = el("div", "acr-status muted");
      var MAP = {
        open: ["muted", "○", "Stays in the open questions list"],
        adopt: ["good", "✓", "Default adopted — it will be written into the AC as confirmed"],
        answer: ["info", "✎", "Your answer will be folded into the AC as a requirement"],
        discard: ["bad", "✕", "This question will be removed from the AC"]
      };
      function paint() {
        var m = MAP[st.mode];
        status.className = "acr-status " + m[0]; status.textContent = m[1] + "  " + m[2];
        card.classList.toggle("is-adopt", st.mode === "adopt");
        card.classList.toggle("is-answer", st.mode === "answer");
        card.classList.toggle("is-discard", st.mode === "discard");
        f.indicator(); globalProgress(); save();
      }
      var defs = [["open", "Leave open", ""]]
        .concat(q.suggestion ? [["adopt", "Adopt suggestion", "good"]] : [])
        .concat([["answer", "Answer", ""], ["discard", "Discard", "danger"]]);
      var btns = {};
      defs.forEach(function (d) {
        var b = el("button", ("acr-btn " + d[2]).trim(), d[1]); b.type = "button";
        b.setAttribute("aria-pressed", String(d[0] === "open")); btns[d[0]] = b;
        b.addEventListener("click", function (e) {
          e.stopPropagation(); st.mode = d[0];
          Object.keys(btns).forEach(function (k) { btns[k].setAttribute("aria-pressed", String(k === d[0])); });
          ans.hidden = d[0] !== "answer"; if (d[0] === "answer") ans.focus();
          paint();
        });
        opts.appendChild(b);
      });
      card.appendChild(opts); card.appendChild(ans); card.appendChild(status);
      ans.addEventListener("input", save);
      st.ans = ans;
      if (saved && saved.m && saved.m !== "open" && btns[saved.m]) {
        st.mode = saved.m; ans.value = saved.a || "";
        Object.keys(btns).forEach(function (k) { btns[k].setAttribute("aria-pressed", String(k === saved.m)); });
        ans.hidden = saved.m !== "answer";
      } else if (saved) ans.value = saved.a || "";
      paint();
      return card;
    }

    /* ---- flow block ---- */
    function flowBlock(spec, savedFlow, addedFlow) {
      var f = { title: spec.title || "", scenarios: [], oqs: [], collapsed: false, _isAddedFlow: !!addedFlow };
      flows.push(f);
      var wrap = el("div", "acr-flow"), head = el("div", "acr-flowhead");
      var chev = el("button", "acr-chev"); chev.type = "button"; chev.setAttribute("aria-label", "Collapse flow");
      chev.innerHTML = '<i class="ti ti-chevron-down" aria-hidden="true"></i>';
      var flowNo = root.querySelectorAll(".acr-flow").length + 1;
      var isAnalytics = f.title.indexOf("Analytics") === 0;
      var pill = el("span", "acr-flownum", isAnalytics ? "Analytics" : "Flow " + flowNo);
      head.appendChild(chev); head.appendChild(pill);
      var titleEl, scopeIn = null;
      if (addedFlow) {
        titleEl = document.createElement("input"); titleEl.type = "text"; titleEl.className = "acr-ti";
        titleEl.placeholder = "Flow title"; head.appendChild(titleEl);
        var nb = el("span", "acr-badge added", "added"); nb.hidden = false; head.appendChild(nb);
        var bDF = el("button", "acr-btn danger", "Discard flow"); bDF.type = "button";
        head.appendChild(bDF);
        bDF.addEventListener("click", function (e) {
          e.stopPropagation();
          var i = flows.indexOf(f); if (i >= 0) flows.splice(i, 1);
          for (var j = addedFlows.length - 1; j >= 0; j--) if (addedFlows[j].flowState === f) addedFlows.splice(j, 1);
          wrap.remove(); globalProgress(); save();
        });
      } else {
        titleEl = el("span", "acr-flowtitle", f.title.replace(/^Flow \d+ - /, "").replace(/^Analytics$/, "Events & tracking"));
        head.appendChild(titleEl);
      }
      wrap.appendChild(head);
      if (addedFlow) {
        scopeIn = document.createElement("input"); scopeIn.type = "text"; scopeIn.className = "acr-fnote";
        scopeIn.placeholder = "Scope — User type | POS(s) | Platform";
        scopeIn.style.margin = "0 0 10px 30px"; scopeIn.style.width = "calc(100% - 30px)";
        wrap.appendChild(scopeIn);
      } else if (spec.scope) wrap.appendChild(el("p", "acr-scope", spec.scope));
      var ind = el("div", "acr-ind"); wrap.appendChild(ind);
      var body = el("div", "acr-content"); wrap.appendChild(body);

      f.renumber = function () {
        var n = 0;
        f.scenarios.forEach(function (s) { n++; s.idxEl.textContent = n + "."; });
      };
      f.indicator = function () {
        var c = 0, rm = 0, add = 0, q = 0;
        f.scenarios.forEach(function (s) {
          if (s.isNew) { add++; return; }
          if (s.removed) rm++; else if (s.confirmed) c++;
        });
        f.oqs.forEach(function (o) { if (o.mode !== "open") q++; });
        var total = f.scenarios.filter(function (s) { return !s.isNew; }).length;
        var parts = [];
        if (total) { parts.push(c + "/" + total + " scenarios confirmed"); if (rm) parts.push(rm + " removed"); }
        if (add) parts.push(add + " added");
        if (f.oqs.length) parts.push(q + "/" + f.oqs.length + " questions resolved");
        ind.textContent = parts.join(" · ") || "";
        var done = total + f.oqs.length > 0 &&
          f.scenarios.every(function (s) { return s.isNew || s.removed || s.confirmed; }) &&
          f.oqs.every(function (o) { return o.mode !== "open"; });
        ind.classList.toggle("done", done);
      };
      function setCollapsed(v) {
        f.collapsed = !!v; body.hidden = f.collapsed;
        chev.innerHTML = '<i class="ti ti-chevron-' + (f.collapsed ? "right" : "down") + '" aria-hidden="true"></i>';
        chev.setAttribute("aria-label", f.collapsed ? "Expand flow" : "Collapse flow");
        save();
      }
      f.setCollapsed = setCollapsed;
      head.addEventListener("click", function () { setCollapsed(!f.collapsed); });
      if (addedFlow) { titleEl.addEventListener("click", function (e) { e.stopPropagation(); }); titleEl.addEventListener("input", save); if (scopeIn) scopeIn.addEventListener("input", save); }

      (spec.scenarios || []).forEach(function (s) {
        var saved = savedFlow && savedFlow.s ? savedFlow.s[s.title] : null;
        body.appendChild(scenarioCard(f, s, false, saved));
      });

      var addBtn = el("button", "acr-add"); addBtn.type = "button";
      addBtn.innerHTML = '<i class="ti ti-plus" aria-hidden="true"></i> Add scenario to this flow';
      addBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        body.insertBefore(scenarioCard(f, { title: "", gwt: [] }, true, null), addBtn);
        f.renumber(); f.indicator(); globalProgress(); save();
      });
      body.appendChild(addBtn);

      var fnote = document.createElement("input"); fnote.type = "text"; fnote.className = "acr-fnote";
      fnote.placeholder = "Feedback on this flow (optional) — split it, fix the scope, missing coverage…";
      fnote.addEventListener("input", save); fnote.addEventListener("click", function (e) { e.stopPropagation(); });
      body.appendChild(fnote);
      f.fnote = fnote;

      var oqList = spec.openQuestions || [];
      if (oqList.length) body.appendChild(el("div", "acr-secthead", "Open questions"));
      oqList.forEach(function (q) {
        var saved = savedFlow && savedFlow.q ? savedFlow.q[q.text] : null;
        body.appendChild(oqCard(f, q, saved));
      });

      /* restore saved additions + note + collapse */
      if (savedFlow) {
        (savedFlow.add || []).forEach(function (a) {
          body.insertBefore(scenarioCard(f, { title: a.t || "", gwt: (a.g || "").split("\n").filter(Boolean) }, true, null), addBtn);
        });
        fnote.value = savedFlow.fn || "";
        if (savedFlow.c) setCollapsed(true);
      }
      f.renumber(); f.indicator();
      if (addedFlow) { f._titleIn = titleEl; f._scopeIn = scopeIn; }
      return { wrap: wrap, flowState: f, ti: titleEl, scope: scopeIn, body: body };
    }

    /* ---- render existing flows ---- */
    var savedAll = null;
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && raw.v === 2) savedAll = raw;
    } catch (e) { }
    data.flows.forEach(function (fl) {
      root.appendChild(flowBlock(fl, savedAll && savedAll.f ? savedAll.f[fl.title] : null, false).wrap);
    });

    /* ---- add-flow button ---- */
    var addFlowBtn = el("button", "acr-add"); addFlowBtn.type = "button";
    addFlowBtn.style.margin = "0 0 1.5rem";
    addFlowBtn.innerHTML = '<i class="ti ti-plus" aria-hidden="true"></i> Add a new flow';
    function addFlow(saved) {
      var blk = flowBlock({ title: "", scenarios: [], openQuestions: [] }, null, true);
      root.insertBefore(blk.wrap, addFlowBtn);
      addedFlows.push({ ti: blk.ti, scope: blk.scope, flowState: blk.flowState, body: blk.body });
      if (saved) {
        blk.ti.value = saved.t || ""; blk.scope.value = saved.sc || ""; blk.flowState.fnote.value = saved.fn || "";
        (saved.add || []).forEach(function (a) {
          blk.body.insertBefore(scenarioCard(blk.flowState, { title: a.t || "", gwt: (a.g || "").split("\n").filter(Boolean) }, true, null), blk.body.querySelector(".acr-add"));
        });
        blk.flowState.renumber();
      } else {
        blk.body.insertBefore(scenarioCard(blk.flowState, { title: "", gwt: [] }, true, null), blk.body.querySelector(".acr-add"));
        blk.flowState.renumber();
      }
      globalProgress(); save();
    }
    addFlowBtn.addEventListener("click", function () { addFlow(null); });
    root.appendChild(addFlowBtn);
    if (savedAll) (savedAll.af || []).forEach(addFlow);

    /* ---- note for Claude ---- */
    var noteBox = el("div", "acr-notebox");
    var nh = el("p"); nh.innerHTML = '<i class="ti ti-message-plus" aria-hidden="true"></i> Note for Claude';
    noteBox.appendChild(nh);
    noteTa.className = "acr-ta"; noteTa.rows = 2;
    noteTa.placeholder = "Remembered a missing requirement? Type it here — the review re-renders with it applied and every decision above is kept.";
    noteBox.appendChild(noteTa);
    var noteRow = el("div"); noteRow.style.cssText = "display:flex;justify-content:flex-end;margin-top:8px";
    var noteBtn = el("button", "acr-btn", "Update the review with this note ↗"); noteBtn.type = "button";
    noteRow.appendChild(noteBtn); noteBox.appendChild(noteRow);
    var noteMsg = el("p", "acr-notemsg"); noteMsg.hidden = true;
    noteMsg.textContent = "✓ Sent — the review will re-render with your note applied; your decisions are saved and will be restored.";
    noteBox.appendChild(noteMsg);
    noteTa.addEventListener("input", save);
    noteBtn.addEventListener("click", function () {
      var v = noteTa.value.trim(); if (!v) { noteTa.focus(); return; }
      save();
      noteBtn.disabled = true; noteBtn.textContent = "Sent ✓"; noteMsg.hidden = false;
      sendPrompt("Mid-review note (from the acceptance-criteria review widget) for " + (data.ticket || "the story under review") + ":\n" + v +
        "\n\nApply the live review guard: fold this note into the in-flight draft and re-render the review widget with the affected items marked. Do NOT write to the ticket and do NOT start a new run — my current review decisions are saved in the widget and must be restored on re-render.");
    });
    if (savedAll && savedAll.note) noteTa.value = savedAll.note;
    root.appendChild(noteBox);

    /* ---- footer ---- */
    var foot = el("div", "acr-foot");
    var submit = el("button", "acr-submit", "Apply decisions & finalize ↗"); submit.type = "button";
    foot.appendChild(prog); foot.appendChild(submit); root.appendChild(foot);

    if (data.startCollapsed) flows.forEach(function (f) { if (!f._isAddedFlow) f.setCollapsed(true); });
    live = true; globalProgress();

    submit.addEventListener("click", function () {
      var t = ["AC review decisions (from acceptance-criteria review widget):"];
      var fi = 0;
      data.flows.forEach(function (fl) {
        var f = flows[fi++];
        t.push(fl.title + ":");
        var n = 0;
        f.scenarios.forEach(function (s) {
          if (s.isNew) {
            n++;
            t.push("- Added scenario (" + (s.ti.value.trim() || "untitled") + "):");
            if (s.ta.value.trim()) t.push("  " + s.ta.value.trim().split("\n").join("\n  "));
            return;
          }
          n++;
          var renamed = s.ti.value.trim() !== s.orig && s.ti.value.trim();
          var edited = s.ta.value !== s.origG;
          var verdict = s.removed ? "removed"
            : s.confirmed && edited ? "confirmed with edits:\n" + s.ta.value
              : s.confirmed ? "confirmed"
                : edited ? "edited to:\n" + s.ta.value
                  : "kept";
          t.push("- Scenario " + n + " (" + s.orig + "): " + verdict);
          if (renamed && !s.removed) t.push("  Renamed to: " + s.ti.value.trim());
          if (!s.removed && s.note.value.trim()) t.push("  Suggestion: " + s.note.value.trim());
        });
        if (f.fnote.value.trim()) t.push("- Flow suggestion: " + f.fnote.value.trim());
        var qn = 0;
        f.oqs.forEach(function (q) {
          qn++;
          var verdict = q.mode === "answer" ? "answered: " + (q.ans.value.trim() || "(empty answer — treat as left open)")
            : q.mode === "adopt" ? "adopted suggested default: " + q.suggestion
              : q.mode === "discard" ? "discarded" : "left open";
          t.push("- OQ " + qn + " [" + q.stakeholder + "] " + q.text + " → " + verdict);
        });
      });
      addedFlows.forEach(function (af) {
        t.push("New flow (" + (af.ti.value.trim() || "untitled") + ")" + (af.scope && af.scope.value.trim() ? " — scope: " + af.scope.value.trim() : "") + ":");
        af.flowState.scenarios.forEach(function (s) {
          t.push("- Added scenario (" + (s.ti.value.trim() || "untitled") + "):");
          if (s.ta.value.trim()) t.push("  " + s.ta.value.trim().split("\n").join("\n  "));
        });
        if (af.flowState.fnote.value.trim()) t.push("- Flow suggestion: " + af.flowState.fnote.value.trim());
      });
      if (noteTa.value.trim() && !noteBtn.disabled) t.push("Additional note: " + noteTa.value.trim());
      t.push("");
      t.push("Apply these decisions per the acceptance-criteria skill and produce the final acceptance criteria (markdown only). Added scenarios and flows are new requirements: tidy them into Given/When/Then, integrate them at the marked position, and run them through self-review.");
      submit.disabled = true; submit.textContent = "Submitted ✓";
      try { localStorage.removeItem(KEY); } catch (e) { }
      sendPrompt(t.join("\n"));
    });
  }

  /* ---- v3 markup harvesting ---- */
  function harvest() {
    var rv = document.querySelector("ac-review");
    if (!rv) return null;
    var data = { ticket: rv.getAttribute("ticket") || "", startCollapsed: rv.hasAttribute("collapsed"), srcmap: {}, flows: [] };
    var defs = rv.querySelector("ac-srcdefs");
    if (defs) defs.querySelectorAll("a").forEach(function (a) {
      data.srcmap[a.id] = { label: a.textContent.trim(), url: a.getAttribute("href") };
    });
    rv.querySelectorAll("ac-flow").forEach(function (fl) {
      var f = { title: fl.getAttribute("name") || "", scope: "", scenarios: [], openQuestions: [] };
      var sc = fl.querySelector("ac-scope"); if (sc) f.scope = sc.textContent.trim();
      fl.querySelectorAll("ac-scenario").forEach(function (s) {
        var o = { title: s.getAttribute("name") || "", gwt: [], sources: [] };
        s.querySelectorAll("ac-gwt").forEach(function (g) { o.gwt.push(g.textContent.trim()); });
        var sw = s.querySelector("ac-srcs");
        if (sw) {
          sw.querySelectorAll("ac-src").forEach(function (x) {
            var m = data.srcmap[x.getAttribute("ref")]; if (m) o.sources.push(m);
          });
          sw.querySelectorAll("a").forEach(function (a) {
            o.sources.push({ label: a.textContent.trim(), url: a.getAttribute("href") });
          });
        }
        f.scenarios.push(o);
      });
      fl.querySelectorAll("ac-oq").forEach(function (q) {
        var o = { stakeholder: q.getAttribute("stakeholder") || "Product", text: "", suggestion: "" };
        var qt = q.querySelector("ac-qtext"); if (qt) o.text = qt.textContent.trim();
        var sg = q.querySelector("ac-sugg"); if (sg) o.suggestion = sg.textContent.trim();
        f.openQuestions.push(o);
      });
      data.flows.push(f);
    });
    return { data: data, node: rv };
  }

  window.ACR_HYDRATE = function () {
    var h = harvest(); if (!h) return;
    var note = document.getElementById("wc-note"); if (note) note.remove();
    var mount = document.createElement("div");
    h.node.parentNode.replaceChild(mount, h.node);
    build(mount, h.data);
  };
  window.ACR_INIT = function (data, sel) {
    var mount = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!mount) return;
    mount.innerHTML = "";
    build(mount, data);
  };
})();
