(function () {
  document.documentElement.classList.add("js");

  var NAMES = { kaminzimmer: "Kaminzimmer", swingolf: "Swin Golf", soccergolf: "Soccer Golf", festhalle: "Festhalle", uebernachten: "Übernachtung" };
  function golf(n) { return ["Nur spielen", n + " mit Grill", n + " Turnier", n + " mit Kaffee und Kuchen", n + " mit Schnitzel to go", "Klassenausflug mit " + n]; }

  // Felder in Schritt 2 je Angebot
  var CONF = {
    kaminzimmer: { legend: "Wann wollt ihr kommen?", paket: { label: "Dauer", def: 1, opts: ["1 Stunde", "2 Stunden", "3 Stunden", "4 Stunden oder länger"] }, date: "Wunschtermin", time: true, count: { label: "Personen", min: 2, max: 40, val: 10, hint: function (n) { return n > 20 ? "Das Kaminzimmer ist für Gruppen bis 20 Personen. Für größere Gruppen sprechen Sie uns gern an." : ""; } } },
    swingolf: { legend: "Termin und Gruppe", paket: { label: "Paket", opts: golf("Swin Golf") }, date: "Wunschtermin", time: true, count: { label: "Personen", min: 1, max: 200, val: 8 } },
    soccergolf: { legend: "Termin und Gruppe", paket: { label: "Paket", opts: golf("Soccer Golf").concat(["Soccer Golf Kindergeburtstagsturnier"]) }, date: "Wunschtermin", time: true, count: { label: "Personen", min: 1, max: 200, val: 8 } },
    festhalle: { legend: "Was möchten Sie feiern?", paket: { label: "Anlass", opts: ["Hochzeit", "Betriebsfeier", "Geburtstag", "Motto-Party", "Anderer Anlass"] }, date: "Datum der Feier", count: { label: "Gäste", min: 10, max: 200, val: 100, hint: function (n) { return n < 80 ? "Die Festhalle ist für 80 bis 130 Gäste gedacht. Fragen Sie trotzdem gern." : n > 130 ? "Die Festhalle bietet Platz für höchstens 130 Gäste." : ""; } }, checks: ["Fachkraft gewünscht"] },
    uebernachten: { legend: "Wann möchten Sie kommen?", paket: { label: "Unterkunft", opts: ["Blockhäuschen", "Ferienwohnung „Alter Ponystall“", "Ferienwohnung „Haarkotten“", "Egal, was frei ist"] }, date: "Anreise", date2: "Abreise", count: { label: "Personen", min: 1, max: 6, val: 2 }, checks: ["Ein kleiner Hund kommt mit"] }
  };

  var form = document.getElementById("wiz");
  if (!form) return;
  var steps = form.querySelectorAll(".step");
  var dots = form.querySelectorAll(".steps li");
  var next = document.getElementById("next");
  var back = document.getElementById("back");
  var detail = document.getElementById("detail");
  var cur = 1, angebot = null;

  function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function today() { var d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }

  function buildDetail(a, paket) {
    var c = CONF[a]; angebot = a;
    document.getElementById("l2").textContent = c.legend;
    var h = '<label class="f"><span>' + c.paket.label + '</span><select name="paket">' +
      c.paket.opts.map(function (o, i) { return "<option" + (o === paket || (!paket && i === c.paket.def) ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select></label>";
    h += '<div class="row2"><label class="f"><span>' + c.date + '</span><input type="date" name="datum" min="' + today() + '" required></label>';
    if (c.date2) h += '<label class="f"><span>' + c.date2 + '</span><input type="date" name="datum2" min="' + today() + '"></label>';
    else if (c.time) h += '<label class="f"><span>Uhrzeit <i>(ungefähr)</i></span><input type="time" name="zeit" step="1800"></label>';
    h += "</div>";
    h += '<label class="f"><span>' + c.count.label + '</span><span class="count"><button type="button" data-d="-1" aria-label="weniger">−</button><input type="number" name="anzahl" inputmode="numeric" min="' + c.count.min + '" max="' + c.count.max + '" value="' + c.count.val + '"><button type="button" data-d="1" aria-label="mehr">+</button></span></label><p class="hint" id="hint" hidden></p>';
    (c.checks || []).forEach(function (t) { h += '<label class="check"><input type="checkbox" name="extra" value="' + esc(t) + '">' + esc(t) + "</label>"; });
    detail.innerHTML = h;
    var inp = detail.querySelector('[name="anzahl"]');
    detail.querySelectorAll(".count button").forEach(function (b) {
      b.addEventListener("click", function () { inp.value = Math.max(c.count.min, Math.min(c.count.max, (+inp.value || 0) + +b.dataset.d)); hint(); });
    });
    inp.addEventListener("input", hint);
    function hint() { var p = document.getElementById("hint"), t = c.count.hint ? c.count.hint(+inp.value) : ""; p.textContent = t; p.hidden = !t; }
    hint();
  }

  function show(n) {
    cur = n;
    steps.forEach(function (s) { s.hidden = +s.dataset.step !== n; });
    dots.forEach(function (d, i) { d.classList.toggle("on", i < Math.min(n, 3)); });
    back.hidden = n === 1 || n === 4;
    next.hidden = n === 4;
    next.textContent = n === 3 ? "Anfrage senden" : "Weiter";
    form.querySelectorAll(".err").forEach(function (e) { e.hidden = true; });
  }

  function fmtDate(v) { if (!v) return ""; var p = v.split("-"); var d = new Date(+p[0], p[1] - 1, +p[2]); return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }); }

  function preview() {
    var f = new FormData(form), c = CONF[angebot], L = [];
    L.push("Neue Anfrage über die Website: " + NAMES[angebot]);
    L.push("");
    L.push(c.paket.label + ": " + f.get("paket"));
    L.push(c.date + ": " + fmtDate(f.get("datum")) + (f.get("zeit") ? ", ca. " + f.get("zeit") + " Uhr" : ""));
    if (f.get("datum2")) L.push(c.date2 + ": " + fmtDate(f.get("datum2")));
    L.push(c.count.label + ": " + f.get("anzahl"));
    f.getAll("extra").forEach(function (x) { L.push("Zusatz: " + x); });
    L.push("");
    L.push("Ansprechpartner: " + f.get("name"));
    L.push("Telefon: " + f.get("telefon"));
    if (f.get("email")) L.push("E-Mail: " + f.get("email"));
    if (f.get("nachricht")) { L.push(""); L.push("Nachricht: " + f.get("nachricht")); }
    document.getElementById("prev").textContent = L.join("\n");
  }

  next.addEventListener("click", function () {
    if (cur === 1) {
      var r = form.querySelector('[name="angebot"]:checked');
      if (!r) { document.getElementById("err1").hidden = false; return; }
      if (r.value !== angebot || !detail.firstChild) buildDetail(r.value);
      show(2);
    } else if (cur === 2) {
      if (!form.querySelector('[name="datum"]').value) { document.getElementById("err2").hidden = false; return; }
      show(3);
    } else if (cur === 3) {
      if (!form.name.value.trim() || !form.telefon.value.trim()) { document.getElementById("err3").hidden = false; return; }
      preview(); show(4);
    }
    form.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  back.addEventListener("click", function () { show(cur - 1); });
  document.getElementById("again").addEventListener("click", function () { form.reset(); angebot = null; detail.innerHTML = ""; show(1); });

  // Angebot direkt aus der Seite vorwählen
  document.querySelectorAll("[data-angebot]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var a = b.dataset.angebot, p = b.dataset.paket;
      var r = form.querySelector('[name="angebot"][value="' + a + '"]');
      r.checked = true;
      var opts = CONF[a].paket.opts;
      buildDetail(a, opts.indexOf(p) > -1 ? p : undefined);
      show(2);
      document.getElementById("anfrage").scrollIntoView({ behavior: "smooth" });
    });
  });
})();
