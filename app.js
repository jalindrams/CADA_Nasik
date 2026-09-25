/* ------------------------------------------------------------------
   Smart Card & QR Verification Platform - prototype application
   Pure client-side: no server, no build step, no database.
   Data lives in localStorage and is seeded from data.js.
------------------------------------------------------------------- */
(function () {
  "use strict";

  /* =============================== utils =============================== */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    if (!iso) return "-";
    var p = String(iso).split("-");
    if (p.length !== 3) return iso;
    return p[2] + " " + MONTHS[parseInt(p[1], 10) - 1] + " " + p[0];
  }
  function fmtShort(iso) {
    if (!iso) return "--/--";
    var p = String(iso).split("-");
    return p[1] + "/" + p[0];
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function daysUntil(iso) {
    if (!iso) return 0;
    return Math.round((new Date(iso + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000);
  }
  function stamp() {
    var d = new Date();
    return fmtDate(todayISO()) + ", " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
  }
  function rand(n, pool) {
    pool = pool || "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var out = "";
    for (var i = 0; i < n; i++) out += pool.charAt(Math.floor(Math.random() * pool.length));
    return out;
  }

  /* generated placeholder portrait (no external images required) */
  var PALETTE = [["#2e78c7", "#123b6b"], ["#0f9b8e", "#0b5f57"], ["#e8871e", "#a75c0c"],
                 ["#7d5ba6", "#4b3266"], ["#c0553f", "#7d3325"], ["#3f7d5a", "#255139"]];
  function avatar(name, seed) {
    var parts = String(name || "?").trim().split(/\s+/);
    var initials = (parts[0] || "?").charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "");
    var h = 0, s = String(seed || name || "x");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var c = PALETTE[h % PALETTE.length];
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      '<rect width="160" height="200" fill="url(#g)"/>' +
      '<circle cx="80" cy="78" r="33" fill="rgba(255,255,255,.88)"/>' +
      '<path d="M18 200c0-36 28-60 62-60s62 24 62 60z" fill="rgba(255,255,255,.88)"/>' +
      '<text x="80" y="188" font-family="Segoe UI,Arial" font-size="26" font-weight="700" ' +
      'fill="' + c[1] + '" text-anchor="middle">' + esc(initials.toUpperCase()) + '</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function emblem(size, colour) {
    colour = colour || "#ffffff";
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" class="emblem" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="29" fill="none" stroke="' + colour + '" stroke-width="2.4" opacity=".85"/>' +
      '<circle cx="32" cy="32" r="23" fill="none" stroke="' + colour + '" stroke-width="1" opacity=".5"/>' +
      '<path d="M18 40h28l-3-11a6 6 0 0 0-5.7-4.3H26.7A6 6 0 0 0 21 29z" fill="' + colour + '" opacity=".92"/>' +
      '<circle cx="24" cy="43" r="3.6" fill="' + colour + '"/><circle cx="40" cy="43" r="3.6" fill="' + colour + '"/>' +
      '<path d="M32 9v7M32 48v7M9 32h7M48 32h7" stroke="' + colour + '" stroke-width="2" stroke-linecap="round" opacity=".7"/>' +
      '</svg>';
  }

  function guilloche() {
    var p = "";
    for (var i = 0; i < 9; i++) p += '<circle cx="' + (40 + i * 42) + '" cy="126" r="' + (92 - i * 3) + '" fill="none" stroke="#fff" stroke-width=".6"/>';
    return '<svg class="guilloche" viewBox="0 0 400 252" preserveAspectRatio="none">' + p + '</svg>';
  }

  /* ------------------------------- QR --------------------------------- */
  function baseUrl() { return location.href.split("#")[0].split("?")[0]; }
  /* The QR opens the standalone scan landing page (msrtc.html), which links back to #/verify. */
  function verifyUrl(token) { return baseUrl().replace(/[^\/]*$/, "") + "index.html?t=" + token; }

  function qrSvg(text, cssClass) {
    if (typeof qrcode === "undefined") {
      return '<div class="' + (cssClass || "") + '" style="font:11px monospace;color:#333;padding:6px;text-align:center">QR library offline<br>' + esc(text) + "</div>";
    }
    var q = qrcode(0, "M");
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  function downloadQr(token, name) {
    var svg = qrSvg(verifyUrl(token));
    var img = new Image();
    var blobUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg", '<svg width="600" height="600"'));
    img.onload = function () {
      var c = document.createElement("canvas");
      c.width = c.height = 640;
      var g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, 640, 640);
      g.drawImage(img, 20, 20, 600, 600);
      var a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "QR-" + (name || token).replace(/\s+/g, "-") + ".png";
      a.click();
    };
    img.src = blobUrl;
  }

  /* ============================== storage ============================== */
  var KEY = "mpvdwb_proto_v1";
  var DB;

  function seed() {
    return {
      holders: JSON.parse(JSON.stringify(SEED_HOLDERS)),
      log: [
        { token: "MPV5TJ9P1LK", name: "Sandhya Anil Deshmukh", result: "valid", at: "Yesterday, 18:42", by: "RTO Thane - checkpost" },
        { token: "MPV6KM1V5RB", name: "Vilas Manohar Kale", result: "expired", at: "Yesterday, 11:05", by: "Traffic post, Dadar" },
        { token: "MPVZZZZZZZZ", name: "-", result: "notfound", at: "2 days ago, 09:18", by: "Public scan" }
      ],
      impressions: { "C-101": 1248, "C-102": 903, "C-103": 1576, "C-104": 642 }
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var d = JSON.parse(raw); if (d && d.holders) return d; }
    } catch (e) { /* private mode - fall through to in-memory */ }
    var s = seed(); save(s); return s;
  }
  function save(d) {
    DB = d || DB;
    try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* ignore */ }
  }
  function resetDemo() {
    if (!confirm("Reset the prototype back to the original 8 demo records?\nAny cards you registered in this session will be removed.")) return;
    DB = seed(); save(); location.hash = "#/admin"; render();
  }

  function byId(id) { return DB.holders.filter(function (h) { return h.id === id; })[0]; }
  function byToken(t) {
    t = String(t || "").trim().toUpperCase();
    return DB.holders.filter(function (h) { return h.token.toUpperCase() === t; })[0];
  }

  /* =========================== status helpers ========================== */
  function statusOf(h) {
    if (!h) return "notfound";
    if (h.status === "suspended") return "suspended";
    if (h.status === "revoked") return "revoked";
    return daysUntil(h.validTo) < 0 ? "expired" : "active";
  }
  var LABEL = { active: "Valid / Active", expired: "Expired", suspended: "Suspended", revoked: "Revoked", notfound: "Not found" };
  function badge(st) {
    var cls = st === "active" ? "active" : st === "expired" || st === "revoked" ? "expired" : st === "suspended" ? "suspended" : "notfound";
    return '<span class="badge ' + cls + '"><i class="dot"></i>' + LABEL[st] + "</span>";
  }
  function campaignOf(h) {
    var id = h && h.campaign;
    return AD_CAMPAIGNS.filter(function (c) { return c.id === id; })[0] || AD_CAMPAIGNS[0];
  }
  function logVerification(token, holder, result, source) {
    DB.log.unshift({
      token: token, name: holder ? holder.name : "-", result: result,
      at: stamp(), by: source || "Prototype scan"
    });
    DB.log = DB.log.slice(0, 40);
    save();
  }

  /* ============================ card markup ============================ */
  function cardFront(h) {
    var st = statusOf(h);
    return '<div class="idcard" id="cardFront">' + guilloche() +
      '<div class="idc-head">' + emblem(30) +
        '<div><b>' + esc(ORG.name.toUpperCase()) + "</b>" +
        '<span>' + esc(ORG.parent) + "</span></div></div>" +
      '<div class="idc-body">' +
        '<img class="idc-photo" src="' + (h.photo || avatar(h.name, h.id)) + '" alt="">' +
        '<div class="idc-fields">' +
          '<div class="idc-name">' + esc(h.name) + "</div>" +
          '<div class="idc-role">' + esc(h.vehicleType) + " &middot; " + esc(h.rto) + "</div>" +
          '<dl class="idc-grid">' +
            "<dt>Reg. No</dt><dd>" + esc(h.regNo) + "</dd>" +
            "<dt>Badge</dt><dd>" + esc(h.badgeNo) + "</dd>" +
            "<dt>Licence</dt><dd>" + esc(h.licenceNo) + "</dd>" +
            "<dt>Vehicle</dt><dd>" + esc(h.vehicleNo) + "</dd>" +
            "<dt>Blood</dt><dd>" + esc(h.bloodGroup) + "</dd>" +
          "</dl></div>" +
        '<div class="idc-qr">' + qrSvg(verifyUrl(h.token)) + "</div>" +
      "</div>" +
      '<div class="holo"></div>' +
      '<div class="idc-foot"><span>VALID ' + fmtShort(h.issuedOn) + " &ndash; " + fmtShort(h.validTo) + "</span>" +
        "<span>" + esc(ORG.cardSeries) + "</span>" +
        "<span>" + (st === "active" ? "ACTIVE" : LABEL[st].toUpperCase()) + "</span></div>" +
      "</div>";
  }

  function cardBack(h) {
    return '<div class="idcard back" id="cardBack">' + guilloche() +
      '<div class="magstripe"></div>' +
      '<div class="idc-back-body">' +
        '<div class="idc-terms">' +
          "<b>Conditions of use</b>" +
          "This card remains the property of the " + esc(ORG.name) + ". It certifies welfare-board registration of the holder and must be produced on demand by an authorised officer.<br><br>" +
          "<b>Holder details</b>" +
          "Permit: " + esc(h.permitNo) + "<br>Union: " + esc(h.union) + "<br>" +
          "Emergency: " + esc(h.emergencyName) + " &middot; " + esc(h.emergencyPhone) + "<br><br>" +
          "If found, return to any RTO office or call " + esc(ORG.helpline) + "." +
        "</div>" +
        '<div class="idc-backqr"><div class="box">' + qrSvg(verifyUrl(h.token)) + "</div>" +
          "<small>SCAN TO VERIFY</small><small>" + esc(h.token) + "</small></div>" +
      "</div>" +
      '<div class="idc-foot"><span>' + esc(ORG.verifyHost) + "</span><span>" + esc(h.regNo) + "</span></div>" +
      "</div>";
  }

  /* ================================ views ============================== */
  var V = {};

  V.home = function () {
    var steps = [
      ["1", "Registration", "Capture driver details and photograph", "#/register"],
      ["2", "Card generation", "Smart ID card front and back", "#/card/H001"],
      ["3", "QR generation", "Unique QR bound to the record", "#/card/H001"],
      ["4", "QR scan", "Camera or simulated scan", "#/scan"],
      ["5", "Verification", "Valid / Expired / Suspended / Not found", "#/verify/MPV8FQ2M4XD"],
      ["6", "Digital profile", "Full cardholder record", "#/profile/H001"],
      ["7", "AR / MR experience", "Advertising layer over the card", "#/ar/H001"]
    ].map(function (s) {
      return '<a class="step" href="' + s[3] + '"><i>' + s[0] + "</i><b>" + s[1] + "</b><span>" + s[2] + "</span></a>";
    }).join("");

    var counts = { active: 0, expired: 0, suspended: 0 };
    DB.holders.forEach(function (h) { var s = statusOf(h); counts[s] = (counts[s] || 0) + 1; });

    return '<div class="panel">' +
        '<div class="panel-head"><div><h1>Smart Card, QR Verification &amp; AR Advertising Platform</h1>' +
        '<p class="muted" style="margin:0">Working prototype prepared for <b>' + esc(ORG.rfpRef) + "</b> &mdash; " +
        esc(ORG.board) + " " + esc(ORG.name) + ".</p></div>" +
        '<a class="btn" href="#/register">Start the demo journey</a></div>' +
        '<div class="journey">' + steps + "</div>" +
      "</div>" +
      '<div class="grid g4" style="margin-bottom:20px">' +
        '<div class="stat"><b>' + DB.holders.length + "</b><span>Demo cardholders</span></div>" +
        '<div class="stat"><b style="color:var(--green)">' + (counts.active || 0) + "</b><span>Active cards</span></div>" +
        '<div class="stat"><b style="color:var(--red)">' + (counts.expired || 0) + "</b><span>Expired</span></div>" +
        '<div class="stat"><b style="color:var(--amber)">' + (counts.suspended || 0) + "</b><span>Suspended</span></div>" +
      "</div>" +
      '<div class="split">' +
        '<div class="panel"><h2>What this prototype demonstrates</h2>' +
          "<ul style=\"margin:0 0 14px 18px;padding:0\">" +
          "<li>Digital registration and data capture, including photograph</li>" +
          "<li>Smart ID card generation - front and back, print-ready</li>" +
          "<li>A unique QR code per card, bound to the digital record</li>" +
          "<li>QR scan to a public verification page with a clear status result</li>" +
          "<li>Digital cardholder profile as the online representation of the card</li>" +
          "<li>Administrative dashboard: search, view, issue, suspend, renew</li>" +
          "<li>Conceptual AR / MR advertising experience launched from the card</li>" +
          "</ul>" +
          '<div class="note">The prototype is a demonstration of the proposed user experience and final output. ' +
          "It uses sample data only - no government system, RTO database or Aadhaar service is connected.</div>" +
        "</div>" +
        '<div class="panel"><h2>Try it in 60 seconds</h2>' +
          '<ol style="margin:0 0 14px 18px;padding:0;line-height:1.9">' +
          '<li>Open <a href="#/card/H001">a generated smart card</a></li>' +
          "<li>Scan its QR with any phone camera (when hosted) or use <a href=\"#/scan\">Scan &amp; verify</a></li>" +
          '<li>See the <a href="#/verify/MPV8FQ2M4XD">verification result</a> and <a href="#/profile/H001">digital profile</a></li>' +
          '<li>Launch the <a href="#/ar/H001">AR / MR advertising experience</a></li>' +
          '<li>Review the <a href="#/admin">admin dashboard</a></li></ol>' +
          '<div class="note warn">Demo statuses to show the evaluator: <b>H001</b> active, <b>H003</b> expiring soon, ' +
          "<b>H004</b> expired, <b>H005</b> suspended, and any unknown code returns <i>Not found</i>.</div>" +
        "</div>" +
      "</div>";
  };

  /* ------------------------------ register ---------------------------- */
  V.register = function () {
    var opts = function (arr, sel) {
      return arr.map(function (v) { return '<option' + (v === sel ? " selected" : "") + ">" + esc(v) + "</option>"; }).join("");
    };
    return '<div class="panel"><div class="panel-head"><div><h1>Driver registration</h1>' +
        '<p class="muted" style="margin:0">Step 1 of the journey - capture the data required to issue a smart ID card.</p></div>' +
        '<span class="badge active"><i class="dot"></i>Step 1 of 7</span></div>' +
      '<form id="regForm" class="split" style="align-items:start">' +
        "<div>" +
          "<h3>Personal details</h3>" +
          '<div class="field-row">' +
            '<label class="f"><span>Full name *</span><input name="name" required placeholder="e.g. Ramesh Gopal Pawar"></label>' +
            '<label class="f"><span>Mobile number *</span><input name="mobile" required placeholder="+91 ..........."></label>' +
          "</div>" +
          '<div class="field-row three">' +
            '<label class="f"><span>Date of birth</span><input type="date" name="dob" value="1988-01-01"></label>' +
            '<label class="f"><span>Gender</span><select name="gender"><option>Male</option><option>Female</option><option>Other</option></select></label>' +
            '<label class="f"><span>Blood group</span><select name="bloodGroup">' + opts(["B+", "O+", "A+", "AB+", "B-", "O-", "A-", "AB-"]) + "</select></label>" +
          "</div>" +
          '<label class="f"><span>Residential address *</span><textarea name="address" required placeholder="House / street / area / city / PIN"></textarea></label>' +
          '<div class="hr"></div>' +
          "<h3>Driving &amp; vehicle details</h3>" +
          '<div class="field-row">' +
            '<label class="f"><span>Driving licence number *</span><input name="licenceNo" required placeholder="MH04 20190004411"></label>' +
            '<label class="f"><span>Licence class</span><select name="licenceClass">' + opts(LICENCE_CLASSES) + "</select></label>" +
          "</div>" +
          '<div class="field-row three">' +
            '<label class="f"><span>Licence valid up to</span><input type="date" name="licenceValidTo" value="2030-12-31"></label>' +
            '<label class="f"><span>Vehicle type</span><select name="vehicleType">' + opts(VEHICLE_TYPES) + "</select></label>" +
            '<label class="f"><span>Vehicle number</span><input name="vehicleNo" placeholder="MH-04 CT 7741"></label>' +
          "</div>" +
          '<div class="field-row three">' +
            '<label class="f"><span>RTO office</span><select name="rto">' + opts(RTO_OFFICES) + "</select></label>" +
            '<label class="f"><span>Permit number</span><input name="permitNo" placeholder="TH/PER/2026/0001"></label>' +
            '<label class="f"><span>Stand / route</span><input name="stand" placeholder="Thane Station East Stand"></label>' +
          "</div>" +
          '<label class="f"><span>Union / association</span><input name="union" placeholder="धर्मवीर आनंद दिघे साहेब महाराष्ट्र प्रवासी वाहतूक चालक कल्याणकारी मंडळ"></label>' +
          '<div class="hr"></div>' +
          "<h3>Card &amp; welfare</h3>" +
          '<div class="field-row three">' +
            '<label class="f"><span>Issue date</span><input type="date" name="issuedOn" value="' + todayISO() + '"></label>' +
            '<label class="f"><span>Valid up to</span><input type="date" name="validTo" value="' + (parseInt(todayISO().slice(0, 4), 10) + 5) + todayISO().slice(4) + '"></label>' +
            '<label class="f"><span>Member since</span><input type="date" name="memberSince" value="' + todayISO() + '"></label>' +
          "</div>" +
          '<div class="field-row">' +
            '<label class="f"><span>Emergency contact name</span><input name="emergencyName" placeholder="Spouse / relative"></label>' +
            '<label class="f"><span>Emergency contact number</span><input name="emergencyPhone" placeholder="+91 ..........."></label>' +
          "</div>" +
          '<label class="f"><span>Welfare schemes enrolled</span><select name="schemes" multiple size="5" style="height:auto">' +
            WELFARE_SCHEMES.map(function (s, i) { return "<option" + (i < 2 ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") +
          "</select></label>" +
          '<div class="row" style="margin-top:6px"><button class="btn" type="submit">Generate smart ID card</button>' +
          '<button class="btn ghost" type="button" id="fillDemo">Fill with sample data</button></div>' +
        "</div>" +
        "<div>" +
          '<div class="panel" style="margin:0 0 16px">' +
            "<h3>Photograph</h3>" +
            '<div class="upload"><img class="preview" id="photoPreview" src="' + avatar("New Applicant", "new") + '" alt="">' +
              '<div><input type="file" id="photoInput" accept="image/*" style="border:0;padding:0">' +
              '<p class="muted" style="margin:8px 0 0;font-size:12.5px">JPG or PNG. In production this would be a live capture with quality checks. ' +
              "If no photo is supplied, a placeholder portrait is generated.</p></div></div>" +
          "</div>" +
          '<div class="panel" style="margin:0">' +
            "<h3>Live card preview</h3>" +
            '<div id="livePreview" style="transform:scale(.86);transform-origin:top left;height:225px"></div>' +
            '<p class="muted" style="font-size:12.5px;margin:0">The registration number, card number and QR code are generated automatically on submission.</p>' +
          "</div>" +
        "</div>" +
      "</form></div>";
  };

  function bindRegister() {
    var form = $("#regForm");
    if (!form) return;
    var photo = null;

    function draft() {
      var f = new FormData(form);
      return {
        id: "NEW", regNo: "MPVDWB/TH/" + new Date().getFullYear() + "/XXXXXX", badgeNo: "BDG/TH/XXXXX",
        name: f.get("name") || "New Applicant", vehicleType: f.get("vehicleType") || VEHICLE_TYPES[0],
        vehicleNo: f.get("vehicleNo") || "MH-04 __ ____", rto: f.get("rto") || RTO_OFFICES[0],
        licenceNo: f.get("licenceNo") || "----", bloodGroup: f.get("bloodGroup") || "B+",
        issuedOn: f.get("issuedOn") || todayISO(), validTo: f.get("validTo") || todayISO(),
        token: "PREVIEW0000", status: "active", photo: photo
      };
    }
    function paint() { $("#livePreview").innerHTML = cardFront(draft()); }
    paint();
    form.addEventListener("input", paint);
    form.addEventListener("change", paint);

    $("#photoInput").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var r = new FileReader();
      r.onload = function () { photo = r.result; $("#photoPreview").src = photo; paint(); };
      r.readAsDataURL(file);
    });

    $("#fillDemo").addEventListener("click", function () {
      var demo = {
        name: "Mahesh Shivram Bhoir", mobile: "+91 98195 44120", address: "Room 5, Kolshet Road, Thane (W) 400607",
        licenceNo: "MH04 20200556712", vehicleNo: "MH-04 DR 3390", permitNo: "TH/PER/2026/0455",
        stand: "Thane Station West Stand", union: "Dharmaveer Anand Dighe Saheb Maharashtra Pravasi Vahatuk Chalak Kalyankari Mandal",
        emergencyName: "Vaishali Bhoir", emergencyPhone: "+91 98195 44008", dob: "1991-03-24"
      };
      Object.keys(demo).forEach(function (k) { if (form.elements[k]) form.elements[k].value = demo[k]; });
      paint();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var n = DB.holders.length + 1;
      var h = {
        id: "H" + String(Date.now()).slice(-6),
        regNo: "MPVDWB/TH/" + new Date().getFullYear() + "/" + String(1120 + n).padStart(6, "0"),
        badgeNo: "BDG/TH/" + (64410 + n),
        name: f.get("name"), vehicleType: f.get("vehicleType"), vehicleNo: f.get("vehicleNo") || "-",
        rto: f.get("rto"), union: f.get("union") || "-", dob: f.get("dob"), gender: f.get("gender"),
        bloodGroup: f.get("bloodGroup"), mobile: f.get("mobile"), address: f.get("address"),
        licenceNo: f.get("licenceNo"), licenceClass: f.get("licenceClass"), licenceValidTo: f.get("licenceValidTo"),
        permitNo: f.get("permitNo") || "-", stand: f.get("stand") || "-",
        memberSince: f.get("memberSince"), issuedOn: f.get("issuedOn"), validTo: f.get("validTo"),
        schemes: f.getAll("schemes"), status: "active",
        emergencyName: f.get("emergencyName") || "-", emergencyPhone: f.get("emergencyPhone") || "-",
        token: "MPV" + rand(8), campaign: AD_CAMPAIGNS[n % AD_CAMPAIGNS.length].id,
        photo: photo, createdInDemo: true
      };
      DB.holders.unshift(h); save();
      location.hash = "#/card/" + h.id + "?new=1";
    });
  }

  /* -------------------------------- card ------------------------------ */
  V.card = function (id, query) {
    var h = byId(id);
    if (!h) return notFoundPanel("cardholder", id);
    var st = statusOf(h);
    var fresh = query.indexOf("new=1") > -1;

    return (fresh ? '<div class="note" style="margin-bottom:18px">Card issued. Registration number <b class="mono">' + esc(h.regNo) +
        '</b> and verification code <b class="mono">' + esc(h.token) + "</b> were generated automatically.</div>" : "") +
      '<div class="panel">' +
        '<div class="panel-head no-print"><div><h1>Smart ID card</h1>' +
          '<p class="muted" style="margin:0">' + esc(h.name) + " &middot; " + esc(h.regNo) + "</p></div>" +
          '<div class="row">' + badge(st) +
          '<button class="btn ghost sm" id="btnPrint">Print card</button>' +
          '<button class="btn ghost sm" id="btnQr">Download QR</button>' +
          '<a class="btn accent sm" href="#/verify/' + esc(h.token) + '">Open verification page</a></div></div>' +
        '<div class="card-stage">' +
          "<div>" + cardFront(h) + '<div class="card-label">Front</div></div>' +
          "<div>" + cardBack(h) + '<div class="card-label">Reverse</div></div>' +
        "</div>" +
      "</div>" +
      '<div class="split no-print">' +
        '<div class="panel"><h2>What the QR code carries</h2>' +
          '<dl class="kv">' +
            "<dt>Encoded value</dt><dd class=\"mono\" style=\"font-size:12.5px;word-break:break-all\">" + esc(verifyUrl(h.token)) + "</dd>" +
            "<dt>Verification code</dt><dd class=\"mono\">" + esc(h.token) + "</dd>" +
            "<dt>Error correction</dt><dd>Level M (restores up to 15% damage)</dd>" +
            "<dt>Binding</dt><dd>One code per card, tied to the cardholder record</dd>" +
          "</dl>" +
          '<div class="note" style="margin-top:14px">Scanning with any phone camera opens the public verification page. ' +
          "In production the code would be signed and the printed card would carry the security features described in the RFP.</div>" +
        "</div>" +
        '<div class="panel"><h2>Next in the journey</h2>' +
          '<div class="row"><a class="btn" href="#/scan">Scan the QR</a>' +
          '<a class="btn ghost" href="#/profile/' + esc(h.id) + '">Digital profile</a>' +
          '<a class="btn ghost" href="#/ar/' + esc(h.id) + '">AR / MR experience</a></div>' +
          '<div class="hr"></div>' +
          '<dl class="kv"><dt>Issued on</dt><dd>' + fmtDate(h.issuedOn) + "</dd>" +
          "<dt>Valid up to</dt><dd>" + fmtDate(h.validTo) + validityNote(h) + "</dd>" +
          "<dt>Card series</dt><dd>" + esc(ORG.cardSeries) + "</dd></dl>" +
        "</div>" +
      "</div>";
  };

  function validityNote(h) {
    var d = daysUntil(h.validTo);
    if (d < 0) return ' <span class="badge expired">Expired ' + Math.abs(d) + " days ago</span>";
    if (d < 120) return ' <span class="badge soon">Renewal due in ' + d + " days</span>";
    return "";
  }

  function bindCard(id) {
    var h = byId(id);
    if (!h) return;
    var p = $("#btnPrint"); if (p) p.addEventListener("click", function () { window.print(); });
    var q = $("#btnQr"); if (q) q.addEventListener("click", function () { downloadQr(h.token, h.name); });
  }

  /* -------------------------------- scan ------------------------------ */
  V.scan = function () {
    var samples = DB.holders.slice(0, 6).map(function (h) {
      return '<tr><td><div class="cellname"><img class="avatar-sm" src="' + (h.photo || avatar(h.name, h.id)) + '" alt="">' +
        "<div><b>" + esc(h.name) + '</b><br><small class="muted mono">' + esc(h.token) + "</small></div></div></td>" +
        "<td>" + esc(h.vehicleType) + "</td><td>" + badge(statusOf(h)) + "</td>" +
        '<td><a class="btn sm ghost" href="index.html?t=' + esc(h.token) + '">Simulate scan</a></td></tr>';
    }).join("");

    return '<div class="panel"><div class="panel-head"><div><h1>Scan &amp; verify</h1>' +
        '<p class="muted" style="margin:0">Step 4 - a QR scan resolves to the public verification page.</p></div>' +
        '<span class="badge active"><i class="dot"></i>Step 4 of 7</span></div>' +
      '<div class="split">' +
        "<div>" +
          '<div class="scanbox" id="scanbox"><video id="cam" playsinline muted></video><div class="reticle"></div>' +
            '<div class="scan-hint" id="scanHint">Camera is off - press <b>Start camera</b> or use a sample below</div></div>' +
          '<div class="row" style="margin-top:14px"><button class="btn" id="btnCam">Start camera</button>' +
            '<button class="btn ghost" id="btnStop" disabled>Stop</button></div>' +
          '<div class="note" style="margin-top:14px">On a phone, the fastest demo is to open the card on a laptop screen and scan its QR with the phone camera - ' +
          "it opens this same verification page. In-page camera decoding uses the browser BarcodeDetector API where available (Chrome / Android / Edge).</div>" +
        "</div>" +
        "<div>" +
          "<h3>Enter a verification code manually</h3>" +
          '<form id="codeForm" class="row" style="margin-bottom:8px">' +
            '<input name="code" placeholder="e.g. MPV8FQ2M4XD" style="flex:1;min-width:190px" class="mono">' +
            '<button class="btn" type="submit">Verify</button></form>' +
          '<p class="muted" style="font-size:12.5px">Try <b class="mono">MPV8FQ2M4XD</b> (valid), <b class="mono">MPV6KM1V5RB</b> (expired), ' +
          '<b class="mono">MPV2NH4C7YT</b> (suspended) or <b class="mono">XYZ123</b> (not found).</p>' +
          '<div class="hr"></div><h3>Sample cards</h3>' +
          '<div class="tbl-wrap"><table><thead><tr><th>Cardholder</th><th>Vehicle</th><th>Status</th><th></th></tr></thead><tbody>' +
          samples + "</tbody></table></div>" +
        "</div>" +
      "</div></div>";
  };

  var camStream = null;
  function stopCam() {
    if (camStream) { camStream.getTracks().forEach(function (t) { t.stop(); }); camStream = null; }
  }
  function bindScan() {
    var form = $("#codeForm");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = new FormData(form).get("code");
      location.hash = "#/verify/" + encodeURIComponent(String(code || "").trim() || "EMPTY");
    });

    var btn = $("#btnCam"), stop = $("#btnStop"), hint = $("#scanHint"), video = $("#cam");
    if (!btn) return;

    btn.addEventListener("click", function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        hint.innerHTML = "Camera is not available in this browser - use a sample card or enter a code.";
        return;
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (s) {
        camStream = s; video.srcObject = s; video.play();
        btn.disabled = true; stop.disabled = false;
        if (!("BarcodeDetector" in window)) {
          hint.innerHTML = "Camera on. This browser cannot decode QR in-page - point a phone camera at the card instead, or use a sample.";
          return;
        }
        hint.innerHTML = "Point the camera at a card QR code...";
        var det = new window.BarcodeDetector({ formats: ["qr_code"] });
        (function tick() {
          if (!camStream) return;
          det.detect(video).then(function (codes) {
            if (codes && codes.length) {
              var val = codes[0].rawValue || "";
              var m = val.match(/[?&]t=([A-Za-z0-9]+)/);
              var token = m ? m[1] : val.indexOf("#/verify/") > -1 ? val.split("#/verify/")[1] : val;
              stopCam();
              location.href = "index.html?t=" + encodeURIComponent(token);
              return;
            }
            requestAnimationFrame(tick);
          }).catch(function () { requestAnimationFrame(tick); });
        })();
      }).catch(function () {
        hint.innerHTML = "Camera permission was declined - use a sample card or enter a code manually.";
      });
    });

    stop.addEventListener("click", function () {
      stopCam(); btn.disabled = false; stop.disabled = true;
      hint.innerHTML = "Camera stopped.";
    });
  }

  /* ------------------------------- verify ----------------------------- */
  V.verify = function (token) {
    token = decodeURIComponent(token || "");
    var h = byToken(token);
    var st = statusOf(h);
    logVerification(token.toUpperCase(), h, st, "Prototype verification page");

    var tone = st === "active" ? "ok" : st === "suspended" ? "warn" : "bad";
    var mark = st === "active" ? "&#10003;" : st === "suspended" ? "!" : "&#10007;";
    var msg = {
      active: "This card is genuine, active and within its validity period.",
      expired: "This card was issued by the Board but its validity period has ended.",
      suspended: "This card is currently suspended and must not be accepted as valid.",
      revoked: "This card has been revoked and is no longer valid.",
      notfound: "No card matching this code exists in the register."
    }[st];

    var hero = '<div class="verify-hero ' + tone + '">' +
      '<div class="mark">' + mark + "</div>" +
      "<div><h2>" + LABEL[st] + "</h2><p>" + msg + "</p></div>" +
      '<div class="stamp">Verified ' + stamp() + "<br>Ref. VRF-" + rand(6) + "<br>" + esc(ORG.verifyHost) + "</div></div>";

    if (!h) {
      return '<div class="panel">' + hero +
        '<div class="hr"></div><dl class="kv"><dt>Code scanned</dt><dd class="mono">' + esc(token.toUpperCase()) + "</dd>" +
        "<dt>Result</dt><dd>Not present in the cardholder register</dd>" +
        "<dt>Advice</dt><dd>Do not accept this card. Report the code to " + esc(ORG.helpline) + ".</dd></dl>" +
        '<div class="row" style="margin-top:16px"><a class="btn ghost" href="#/scan">Scan another code</a></div></div>';
    }

    var c = campaignOf(h);
    return '<div class="panel">' + hero +
        '<div class="hr"></div>' +
        '<div class="split" style="gap:26px">' +
          '<div class="row" style="align-items:flex-start;gap:20px;flex-wrap:nowrap">' +
            '<img class="vphoto" src="' + (h.photo || avatar(h.name, h.id)) + '" alt="">' +
            "<div style=\"flex:1;min-width:0\">" +
              '<h2 style="margin-bottom:2px">' + esc(h.name) + "</h2>" +
              '<p class="muted" style="margin:0 0 12px">' + esc(h.vehicleType) + " &middot; " + esc(h.rto) + "</p>" +
              '<dl class="kv">' +
                "<dt>Registration no.</dt><dd class=\"mono\">" + esc(h.regNo) + "</dd>" +
                "<dt>Badge no.</dt><dd class=\"mono\">" + esc(h.badgeNo) + "</dd>" +
                "<dt>Driving licence</dt><dd class=\"mono\">" + esc(h.licenceNo) + "</dd>" +
                "<dt>Vehicle</dt><dd>" + esc(h.vehicleNo) + "</dd>" +
                "<dt>Card status</dt><dd>" + badge(st) + "</dd>" +
                "<dt>Valid up to</dt><dd>" + fmtDate(h.validTo) + validityNote(h) + "</dd>" +
              "</dl>" +
              (h.status === "suspended" && h.suspendReason ? '<div class="note warn" style="margin-top:14px">' + esc(h.suspendReason) + "</div>" : "") +
            "</div>" +
          "</div>" +
          "<div>" +
            '<div class="note">Only the fields the Board permits for public verification are shown here. ' +
            "Address, mobile number and welfare details stay on the authenticated profile.</div>" +
            '<div class="row" style="margin-top:14px"><a class="btn" href="#/profile/' + esc(h.id) + '">View digital profile</a>' +
            '<a class="btn accent" href="#/ar/' + esc(h.id) + '">Open AR experience</a>' +
            '<a class="btn ghost" href="#/scan">Scan another</a></div>' +
            '<div class="hr"></div>' +
            '<h3 style="margin-bottom:6px">Sponsored</h3>' +
            '<div style="border:1px solid var(--line);border-left:4px solid ' + c.colour + ';border-radius:10px;padding:12px 14px">' +
              '<small class="muted" style="letter-spacing:.08em;text-transform:uppercase">' + esc(c.brand) + "</small>" +
              "<div style=\"font-weight:650;margin:2px 0 4px\">" + esc(c.headline) + "</div>" +
              '<div class="muted" style="font-size:13px">' + esc(c.body) + "</div></div>" +
          "</div>" +
        "</div>" +
      "</div>";
  };

  /* ------------------------------- profile ---------------------------- */
  V.profile = function (id) {
    var h = byId(id);
    if (!h) return notFoundPanel("cardholder", id);
    var st = statusOf(h);
    var mine = DB.log.filter(function (l) { return l.token === h.token.toUpperCase(); }).slice(0, 6);

    return '<div class="panel">' +
        '<div class="panel-head"><div class="row" style="gap:16px;flex-wrap:nowrap">' +
          '<img class="vphoto" style="width:92px;height:114px" src="' + (h.photo || avatar(h.name, h.id)) + '" alt="">' +
          "<div><h1 style=\"margin-bottom:2px\">" + esc(h.name) + "</h1>" +
          '<p class="muted" style="margin:0 0 8px">' + esc(h.vehicleType) + " &middot; " + esc(h.union) + "</p>" +
          '<div class="row">' + badge(st) + '<span class="mono muted">' + esc(h.regNo) + "</span></div></div></div>" +
          '<div class="row"><a class="btn ghost sm" href="#/card/' + esc(h.id) + '">View smart card</a>' +
          '<a class="btn ghost sm" href="#/verify/' + esc(h.token) + '">Verification page</a>' +
          '<a class="btn accent sm" href="#/ar/' + esc(h.id) + '">AR experience</a></div></div>' +
        '<div class="grid g2">' +
          "<div><h3>Identity</h3><dl class=\"kv\">" +
            "<dt>Date of birth</dt><dd>" + fmtDate(h.dob) + "</dd>" +
            "<dt>Gender</dt><dd>" + esc(h.gender || "-") + "</dd>" +
            "<dt>Blood group</dt><dd>" + esc(h.bloodGroup) + "</dd>" +
            "<dt>Mobile</dt><dd>" + esc(h.mobile) + "</dd>" +
            "<dt>Address</dt><dd>" + esc(h.address) + "</dd>" +
            "<dt>Emergency</dt><dd>" + esc(h.emergencyName) + " &middot; " + esc(h.emergencyPhone) + "</dd>" +
          "</dl></div>" +
          "<div><h3>Driving, vehicle &amp; permit</h3><dl class=\"kv\">" +
            "<dt>Licence no.</dt><dd class=\"mono\">" + esc(h.licenceNo) + "</dd>" +
            "<dt>Licence class</dt><dd>" + esc(h.licenceClass) + "</dd>" +
            "<dt>Licence valid to</dt><dd>" + fmtDate(h.licenceValidTo) + "</dd>" +
            "<dt>Badge no.</dt><dd class=\"mono\">" + esc(h.badgeNo) + "</dd>" +
            "<dt>Vehicle</dt><dd>" + esc(h.vehicleNo) + " (" + esc(h.vehicleType) + ")</dd>" +
            "<dt>Permit no.</dt><dd class=\"mono\">" + esc(h.permitNo) + "</dd>" +
            "<dt>RTO</dt><dd>" + esc(h.rto) + "</dd>" +
            "<dt>Stand / route</dt><dd>" + esc(h.stand) + "</dd>" +
          "</dl></div>" +
        "</div></div>" +
      '<div class="split">' +
        '<div class="panel"><h2>Welfare Board membership</h2>' +
          '<dl class="kv"><dt>Member since</dt><dd>' + fmtDate(h.memberSince) + "</dd>" +
          "<dt>Card issued</dt><dd>" + fmtDate(h.issuedOn) + "</dd>" +
          "<dt>Card valid to</dt><dd>" + fmtDate(h.validTo) + validityNote(h) + "</dd></dl>" +
          '<div class="hr"></div><h3>Schemes enrolled</h3>' +
          '<div class="chips">' + (h.schemes || []).map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join("") + "</div>" +
          '<div class="hr"></div><h3>Documents on record</h3>' +
          '<ul class="doclist">' + DEMO_DOCUMENTS.map(function (d) {
            return '<li><span class="ico">' + esc(d.icon) + "</span><div><b>" + esc(d.label) + '</b><br><small class="muted">' + esc(d.meta) + "</small></div></li>";
          }).join("") + "</ul>" +
        "</div>" +
        "<div>" +
          '<div class="panel"><h2>QR verification reference</h2>' +
            '<div class="row" style="align-items:flex-start;gap:16px;flex-wrap:nowrap">' +
              '<div style="width:118px;flex:0 0 118px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px">' + qrSvg(verifyUrl(h.token)) + "</div>" +
              '<div style="min-width:0"><dl class="kv" style="grid-template-columns:1fr">' +
                "<dt>Verification code</dt><dd class=\"mono\">" + esc(h.token) + "</dd>" +
                "<dt>Verification link</dt><dd class=\"mono\" style=\"font-size:12px;word-break:break-all\">" + esc(verifyUrl(h.token)) + "</dd>" +
              "</dl></div></div>" +
          "</div>" +
          '<div class="panel"><h2>Recent verifications of this card</h2>' +
            (mine.length ? '<ul class="timeline">' + mine.map(function (l) {
              return "<li><b>" + LABEL[l.result] + "</b><br><span class=\"muted\">" + esc(l.at) + " &middot; " + esc(l.by) + "</span></li>";
            }).join("") + "</ul>" : '<p class="muted">No verification recorded yet in this session.</p>') +
          "</div>" +
          '<div class="panel"><h2>Issuing authority</h2>' +
            '<dl class="kv"><dt>Board</dt><dd>' + esc(ORG.board) + " " + esc(ORG.name) + "</dd>" +
            "<dt>Under</dt><dd>" + esc(ORG.parent) + "</dd>" +
            "<dt>Helpline</dt><dd>" + esc(ORG.helpline) + "</dd>" +
            "<dt>Verification host</dt><dd>" + esc(ORG.verifyHost) + "</dd></dl>" +
          "</div>" +
        "</div>" +
      "</div>";
  };

  /* --------------------------------- AR ------------------------------- */
  V.ar = function (id, query) {
    var h = byId(id) || DB.holders[0];
    if (!h) return notFoundPanel("cardholder", id);
    var cid = (query.match(/c=([A-Za-z0-9-]+)/) || [])[1];
    var c = AD_CAMPAIGNS.filter(function (x) { return x.id === cid; })[0] || campaignOf(h);
    DB.impressions[c.id] = (DB.impressions[c.id] || 0) + 1; save();

    var panels = AR_PANELS.map(function (p, i) {
      var body = p.body;
      if (i === 0) body = h.name + " &middot; " + h.regNo + " &middot; " + LABEL[statusOf(h)];
      if (i === 1) body = (h.schemes || []).slice(0, 2).join(", ") || "Welfare schemes";
      if (i === 2) body = h.vehicleNo + " &middot; permit " + h.permitNo;
      if (i === 3) body = c.brand + ": " + c.headline;
      return '<div class="ar-panel ar-p' + (i + 1) + '"><b>' + esc(p.title) + "</b><p>" + body + "</p></div>";
    }).join("");

    var switcher = AD_CAMPAIGNS.map(function (x) {
      return '<a class="chip' + (x.id === c.id ? " on" : "") + '" href="#/ar/' + esc(h.id) + "?c=" + esc(x.id) + '">' + esc(x.brand) + "</a>";
    }).join("");

    return '<div class="panel"><div class="panel-head"><div><h1>AR / MR experience (conceptual)</h1>' +
        '<p class="muted" style="margin:0">Step 7 - scanning the card launches an augmented layer over the physical card. ' +
        "Shown here as a simulation using sample content.</p></div>" +
        '<span class="badge active"><i class="dot"></i>Step 7 of 7</span></div>' +
      '<div class="ar-stage"><div class="ar-grid"></div>' +
        '<div class="ar-card"><div style="font-size:9px;letter-spacing:.14em;opacity:.8">' + esc(ORG.shortName) + " SMART ID</div>" +
          '<div style="font-weight:700;margin-top:6px">' + esc(h.name) + "</div>" +
          '<div class="mono" style="font-size:10px;opacity:.85">' + esc(h.regNo) + "</div>" +
          '<div style="position:absolute;right:12px;bottom:12px;width:52px;height:52px;background:#fff;border-radius:6px;padding:3px">' + qrSvg(verifyUrl(h.token)) + "</div></div>" +
        panels +
      "</div>" +
      '<div class="row" style="margin-top:16px;justify-content:space-between">' +
        '<div class="row"><span class="muted" style="font-size:13px">Campaign served:</span>' + switcher + "</div>" +
        '<a class="btn ghost sm" href="#/verify/' + esc(h.token) + '">Back to verification</a></div>' +
      "</div>" +
      '<div class="panel" style="margin-top:16px"><div class="panel-head"><div>' +
          '<h2 style="margin:0">Department videos &amp; schemes</h2>' +
          '<p class="muted" style="margin:2px 0 0">Played to the passenger/citizen on scan. Content is supplied and approved by the Board before going live (RFP B).</p>' +
        '</div><span class="badge active"><i class="dot"></i>Dynamic content</span></div>' +
        '<div class="grid g2" style="margin-top:14px">' +
          '<figure style="margin:0"><video controls preload="none" poster="msrtc-assets/mandal-banner.png" style="width:100%;border-radius:10px;background:#000;display:block"><source src="msrtc-assets/Video2.mp4" type="video/mp4"></video>' +
            '<figcaption class="muted" style="font-size:12.5px;margin-top:6px">Welfare schemes &amp; benefits — awareness film</figcaption></figure>' +
          '<figure style="margin:0"><video controls preload="none" poster="msrtc-assets/mandal-banner.png" style="width:100%;border-radius:10px;background:#000;display:block"><source src="msrtc-assets/Vidoe3.mp4" type="video/mp4"></video>' +
            '<figcaption class="muted" style="font-size:12.5px;margin-top:6px">Board / department introduction film</figcaption></figure>' +
        '</div>' +
        '<div class="note" style="margin-top:12px">Dynamic QR: this playlist can be swapped by the Board at any time without re-issuing cards — the code resolves to a server-controlled content set.</div>' +
      '</div>' +
      '<div class="split">' +
        '<div class="panel"><h2>Proposed AR / MR flow</h2>' +
          '<ul class="timeline">' +
            "<li><b>Scan</b><br><span class=\"muted\">Driver or passenger scans the card QR, or points the app at the card as an image target.</span></li>" +
            "<li><b>Resolve</b><br><span class=\"muted\">The code resolves to the cardholder record and the campaign assigned to that card series.</span></li>" +
            "<li><b>Overlay</b><br><span class=\"muted\">Identity, welfare and vehicle panels are anchored around the card in 3D space.</span></li>" +
            "<li><b>Sponsored layer</b><br><span class=\"muted\">A brand panel is served alongside - the monetisable inventory described in the RFP.</span></li>" +
            "<li><b>Action &amp; measurement</b><br><span class=\"muted\">Taps are logged per campaign, per district and per card series.</span></li>" +
          "</ul>" +
          '<div class="note warn">This screen is a conceptual demonstration built with web animation, not a production AR runtime. ' +
          "A production build would use WebXR or a native SDK with image-target tracking.</div>" +
        "</div>" +
        '<div class="panel"><h2>Campaign inventory (demo figures)</h2>' +
          '<div class="tbl-wrap"><table style="min-width:auto"><thead><tr><th>Campaign</th><th>Brand</th><th>Impressions</th></tr></thead><tbody>' +
          AD_CAMPAIGNS.map(function (x) {
            return "<tr><td class=\"mono\">" + esc(x.id) + "</td><td>" + esc(x.brand) + "</td><td><b>" + (DB.impressions[x.id] || 0) + "</b></td></tr>";
          }).join("") + "</tbody></table></div>" +
          '<p class="muted" style="font-size:12.5px;margin-top:12px">Impressions increase as you open this screen - it illustrates how ' +
          "advertising exposure would be measured against issued cards.</p></div>" +
      "</div>";
  };

  /* -------------------------------- admin ----------------------------- */
  var adminState = { q: "", filter: "all" };

  V.admin = function () {
    var counts = { all: DB.holders.length, active: 0, expired: 0, suspended: 0 };
    DB.holders.forEach(function (h) { var s = statusOf(h); counts[s] = (counts[s] || 0) + 1; });
    var soon = DB.holders.filter(function (h) { var d = daysUntil(h.validTo); return d >= 0 && d < 120; }).length;

    var q = adminState.q.toLowerCase();
    var rows = DB.holders.filter(function (h) {
      if (adminState.filter !== "all" && statusOf(h) !== adminState.filter) return false;
      if (!q) return true;
      return [h.name, h.regNo, h.badgeNo, h.licenceNo, h.vehicleNo, h.mobile, h.token, h.vehicleType, h.rto]
        .join(" ").toLowerCase().indexOf(q) > -1;
    }).map(function (h) {
      var st = statusOf(h);
      return "<tr>" +
        '<td><div class="cellname"><img class="avatar-sm" src="' + (h.photo || avatar(h.name, h.id)) + '" alt="">' +
          "<div><b>" + esc(h.name) + "</b>" + (h.createdInDemo ? ' <span class="badge active" style="font-size:10px">new</span>' : "") +
          '<br><small class="muted mono">' + esc(h.regNo) + "</small></div></div></td>" +
        "<td>" + esc(h.vehicleType) + '<br><small class="muted">' + esc(h.vehicleNo) + "</small></td>" +
        "<td>" + esc(h.rto) + "</td>" +
        "<td>" + fmtDate(h.validTo) + "</td>" +
        "<td>" + badge(st) + "</td>" +
        '<td class="mono">' + esc(h.token) + "</td>" +
        '<td><div class="row" style="gap:6px;flex-wrap:nowrap">' +
          '<a class="btn sm ghost" href="#/card/' + esc(h.id) + '">Card</a>' +
          '<a class="btn sm ghost" href="#/profile/' + esc(h.id) + '">Profile</a>' +
          (h.status === "suspended"
            ? '<button class="btn sm ghost" data-act="reactivate" data-id="' + esc(h.id) + '">Reactivate</button>'
            : '<button class="btn sm danger" data-act="suspend" data-id="' + esc(h.id) + '">Suspend</button>') +
          (st === "expired" ? '<button class="btn sm" data-act="renew" data-id="' + esc(h.id) + '">Renew</button>' : "") +
        "</div></td></tr>";
    }).join("");

    var chip = function (key, label) {
      return '<button class="chip' + (adminState.filter === key ? " on" : "") + '" data-filter="' + key + '">' + label + "</button>";
    };

    return '<div class="panel"><div class="panel-head"><div><h1>Administration dashboard</h1>' +
        '<p class="muted" style="margin:0">' + esc(ORG.name) + " &middot; card issuance and verification control</p></div>" +
        '<div class="row"><a class="btn" href="#/register">Issue new card</a>' +
        '<button class="btn ghost" id="btnReset">Reset demo data</button></div></div>' +
      '<div class="grid g4">' +
        '<div class="stat"><b>' + counts.all + "</b><span>Cards issued</span></div>" +
        '<div class="stat"><b style="color:var(--green)">' + (counts.active || 0) + "</b><span>Active</span></div>" +
        '<div class="stat"><b style="color:var(--red)">' + (counts.expired || 0) + "</b><span>Expired</span></div>" +
        '<div class="stat"><b style="color:var(--amber)">' + soon + "</b><span>Renewal due &lt; 120 days</span></div>" +
      "</div></div>" +
      '<div class="panel"><div class="panel-head">' +
        '<div class="chips">' + chip("all", "All") + chip("active", "Active") + chip("expired", "Expired") + chip("suspended", "Suspended") + "</div>" +
        '<input id="adminSearch" placeholder="Search name, registration, licence, vehicle, code..." value="' + esc(adminState.q) + '" style="max-width:340px">' +
      "</div>" +
      '<div class="tbl-wrap"><table><thead><tr><th>Cardholder</th><th>Vehicle</th><th>RTO</th><th>Valid to</th><th>Status</th><th>Code</th><th>Actions</th></tr></thead>' +
      "<tbody>" + (rows || '<tr><td colspan="7" class="empty">No records match this search.</td></tr>') + "</tbody></table></div></div>" +
      '<div class="split">' +
        '<div class="panel"><h2>Recent verification activity</h2>' +
          '<div class="tbl-wrap"><table style="min-width:auto"><thead><tr><th>When</th><th>Cardholder</th><th>Code</th><th>Result</th><th>Source</th></tr></thead><tbody>' +
          DB.log.slice(0, 10).map(function (l) {
            return "<tr><td>" + esc(l.at) + "</td><td>" + esc(l.name) + '</td><td class="mono">' + esc(l.token) + "</td><td>" + badge(l.result) + "</td><td>" + esc(l.by) + "</td></tr>";
          }).join("") + "</tbody></table></div></div>" +
        '<div class="panel"><h2>Advertising campaigns</h2>' +
          '<div class="tbl-wrap"><table style="min-width:auto"><thead><tr><th>Brand</th><th>Cards</th><th>Impressions</th></tr></thead><tbody>' +
          AD_CAMPAIGNS.map(function (c) {
            var n = DB.holders.filter(function (h) { return h.campaign === c.id; }).length;
            return "<tr><td>" + esc(c.brand) + "</td><td>" + n + "</td><td><b>" + (DB.impressions[c.id] || 0) + "</b></td></tr>";
          }).join("") + "</tbody></table></div>" +
          '<p class="muted" style="font-size:12.5px;margin-top:12px">Campaigns are assigned per card and served through the AR / MR layer.</p></div>' +
      "</div>";
  };

  function bindAdmin() {
    var s = $("#adminSearch");
    if (s) s.addEventListener("input", function () {
      adminState.q = s.value;
      render();
      var n = $("#adminSearch");
      if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
    });
    $$("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { adminState.filter = b.getAttribute("data-filter"); render(); });
    });
    $$("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        var h = byId(b.getAttribute("data-id"));
        if (!h) return;
        var act = b.getAttribute("data-act");
        if (act === "suspend") {
          var why = prompt("Reason for suspension (demo):", "Card reported lost");
          if (why === null) return;
          h.status = "suspended"; h.suspendReason = why + " - recorded " + fmtDate(todayISO());
        } else if (act === "reactivate") {
          h.status = "active"; delete h.suspendReason;
        } else if (act === "renew") {
          var y = new Date().getFullYear() + 5;
          h.issuedOn = todayISO(); h.validTo = y + todayISO().slice(4); h.status = "active";
        }
        save(); render();
      });
    });
    var r = $("#btnReset");
    if (r) r.addEventListener("click", resetDemo);
  }

  function notFoundPanel(what, id) {
    return '<div class="panel"><h1>Record not found</h1>' +
      '<p class="muted">No ' + esc(what) + ' matches <b class="mono">' + esc(id) + "</b> in the demo register.</p>" +
      '<div class="row"><a class="btn" href="#/admin">Back to dashboard</a><a class="btn ghost" href="#/">Home</a></div></div>';
  }

  /* =============================== router ============================== */
  function parseHash() {
    var raw = location.hash.replace(/^#\/?/, "") || "";
    var qi = raw.indexOf("?");
    var query = qi > -1 ? raw.slice(qi + 1) : "";
    var parts = (qi > -1 ? raw.slice(0, qi) : raw).split("/").filter(Boolean);
    return { name: parts[0] || "home", arg: parts[1] || "", query: query };
  }

  function render() {
    stopCam();
    var r = parseHash();
    var html;
    switch (r.name) {
      case "register": html = V.register(); break;
      case "card": html = V.card(r.arg, r.query); break;
      case "scan": html = V.scan(); break;
      case "verify": html = V.verify(r.arg); break;
      case "profile": html = V.profile(r.arg); break;
      case "ar": html = V.ar(r.arg, r.query); break;
      case "admin": html = V.admin(); break;
      default: html = V.home();
    }
    var app = $("#app");
    app.innerHTML = html;
    window.scrollTo(0, 0);

    if (r.name === "register") bindRegister();
    if (r.name === "card") bindCard(r.arg);
    if (r.name === "scan") bindScan();
    if (r.name === "admin") bindAdmin();

    $$("nav.main a").forEach(function (a) {
      var target = a.getAttribute("href").replace(/^#\/?/, "").split("/")[0] || "home";
      a.classList.toggle("on", target === r.name);
    });
    document.title = ORG.shortName + " Smart Card Prototype - " + (r.name.charAt(0).toUpperCase() + r.name.slice(1));
  }

  /* ================================ boot =============================== */
  function boot() {
    DB = load();
    $("#brandSlot").innerHTML = emblem(38) +
      '<div class="brand-txt">' + esc(ORG.shortName) + " Smart Card Platform<small>" + esc(ORG.name) + "</small></div>";
    $("#footSlot").innerHTML =
      "<div><b>" + esc(ORG.board) + " " + esc(ORG.name) + "</b><br>" + esc(ORG.parent) + "</div>" +
      "<div>Prototype for " + esc(ORG.rfpRef) + "<br>Demonstration build - sample data only, not connected to any live system.</div>";
    window.addEventListener("hashchange", render);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
