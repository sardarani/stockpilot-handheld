/* StockPilot handheld prototype (rugged Android, 360 × 740).
   StockPilot.mount(el, {preset, interactive, keys, dim, toasts, onChange, onSignal}) */
(function () {
  'use strict';
  var P = {
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10.5 8v8M14 8v8M17 8v8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    eyeoff: '<path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20"/>',
    minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    del: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/>',
    recount: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  };
  function ic(n, s, w) { s = s || 22; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; }
  var SB = '<svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 12 0 3.2A11.5 11.5 0 0 1 7.5.5 11.5 11.5 0 0 1 15 3.2z"/></svg>' +
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M12 0v12H0z"/></svg>' +
    '<svg width="8" height="13" viewBox="0 0 8 13" fill="currentColor"><rect x="2.5" y="0" width="3" height="1.5" rx=".5"/><rect x=".5" y="1.5" width="7" height="11" rx="1.2" fill="none" stroke="currentColor"/><rect x="1.8" y="5" width="4.4" height="6.3" rx=".5"/></svg><span style="margin-left:1px">64%</span>';
  var NAV = '<button data-a="nav-back" aria-label="Back"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 2.5v13L3 9z"/></svg></button>' +
    '<button data-a="nav-home" aria-label="Home"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="7"/></svg></button>' +
    '<button data-a="nav-recent" aria-label="Recent apps"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="12" height="12" rx="2"/></svg></button>';

  var BINS = [
    { code: '14-C-03', chk: '47', where: 'Rack C, level 03, left side', dir: 'Walk 4 bays ahead.', sku: 'SG-L-440', name: 'Nitrile safety gloves, L', unit: 'units', pack: 12, packs: 'cartons', exp: 120, pick: { order: 'SO-88213', qty: 24, at: '13:47' } },
    { code: '14-C-04', chk: '82', where: 'Rack C, level 04, left side', dir: 'Same bay, one shelf up.', sku: 'HV-V-210', name: 'Hi-vis vest, XL', unit: 'vests', pack: 10, packs: 'bags', exp: 60 },
    { code: '14-C-05', chk: '19', where: 'Rack C, level 05, left side', dir: 'Same bay, top shelf.', sku: 'EG-C-102', name: 'Safety goggles, clear', unit: 'units', pack: 20, packs: 'boxes', exp: 200 },
    { code: '14-D-01', chk: '63', where: 'Rack D, level 01, left side', dir: 'Next rack, bottom shelf.', sku: 'SG-M-440', name: 'Nitrile safety gloves, M', unit: 'units', pack: 12, packs: 'cartons', exp: 144 }
  ];
  var SUP = { name: 'Ravi Kumar', first: 'Ravi', ini: 'RK', where: 'Supervisor · Aisle 9', eta: 'Replies in ~4 min' };
  var SHORT = [
    { id: 'pick', t: 'Picked, not confirmed yet', s: 'Stock went to an order before the system caught up.' },
    { id: 'dmg', t: 'Damaged or unusable', s: 'Torn, wet or expired, and set aside.' },
    { id: 'moved', t: 'Probably in another bin', s: 'Misplaced, or in the wrong slot.' },
    { id: 'unk', t: 'Not sure', s: 'Ravi will look into it.' }
  ];
  var OVER = [
    { id: 'recv', t: 'Received, not booked in yet', s: 'A delivery landed here before it was recorded.' },
    { id: 'moved', t: 'Belongs in another bin', s: 'Put away in the wrong slot.' },
    { id: 'unk', t: 'Not sure', s: 'Ravi will look into it.' }
  ];

  function fresh() { return { scr: 'route', bi: 0, done: 11, total: 52, mode: 'u', entry: '', counts: [], reason: null, pend: [], sheet: null, pin: '', fmode: null, code: '', ravi: 'pending', scan: null }; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function m(s, ink) { return '<span class="mono"' + (ink ? ' style="color:var(--ink)"' : '') + '>' + s + '</span>'; }
  function rw(k, v, cls) { return '<div class="rw"><span>' + k + '</span><b' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</b></div>'; }
  function person(ini, name, line, right, online) {
    return '<div class="rq-h"><div class="av"><div class="face">' + ini + '</div>' + (online ? '<div class="dot"></div>' : '') + '</div><div class="who"><b>' + name + '</b><span>' + line + '</span></div><div class="when">' + right + '</div></div>';
  }
  function req(o) {
    return '<div class="req">' + o.head + '<div class="hero-n"><div class="code down">' + o.gap + '</div><span>' + o.label + '</span></div><p class="sub" style="font-size:14px">' + o.sub + '</p><div class="rows">' + o.rows + '</div></div>';
  }

  /* Success burst as Lottie data, built at runtime so it picks up the current theme colours */
  function rgb(hex) { hex = (hex || '').trim().replace('#', ''); if (hex.length === 3) hex = hex.replace(/./g, '$&$&'); var n = parseInt(hex, 16); return isNaN(n) ? [0, .65, .24, 1] : [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, 1]; }
  function kf(t, v, e) { var d = v.length, o = { t: t, s: v }; if (e !== false) { o.i = { x: fill(d, .25), y: fill(d, 1) }; o.o = { x: fill(d, .55), y: fill(d, 0) }; } return o; }
  function fill(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }
  function stat(v) { return { a: 0, k: v }; }
  function anim(k) { return { a: 1, k: k }; }
  function tr(p, s, o) { return { ty: 'tr', p: p || stat([0, 0]), a: stat([0, 0]), s: s || stat([100, 100]), r: stat(0), o: o || stat(100) }; }
  function layer(ind, nm, shapes, ks) {
    ks = ks || {};
    return { ddd: 0, ind: ind, ty: 4, nm: nm, sr: 1, ao: 0, ip: 0, op: 90, st: 0, bm: 0, shapes: shapes,
      ks: { o: ks.o || stat(100), r: stat(0), p: stat([100, 100, 0]), a: stat([100, 100, 0]), s: ks.s || stat([100, 100, 100]) } };
  }
  function successLottie(c) {
    var ok = rgb(c.ok), on = rgb(c.on), pr = rgb(c.pr), dots = [];
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2 - Math.PI / 2, r0 = 62, r1 = 94 + (i % 2) * 6;
      dots.push({ ty: 'gr', it: [
        { ty: 'el', d: 1, p: stat([0, 0]), s: stat(i % 2 ? [8, 8] : [11, 11]) },
        { ty: 'fl', c: stat(i % 2 ? pr : ok), o: stat(100), r: 1 },
        tr(anim([kf(10, [100 + Math.cos(a) * r0, 100 + Math.sin(a) * r0]), kf(40, [100 + Math.cos(a) * r1, 100 + Math.sin(a) * r1])]),
          anim([kf(10, [0, 0]), kf(16, [100, 100]), kf(44, [0, 0])]))
      ] });
    }
    return { v: '5.7.4', fr: 60, ip: 0, op: 90, w: 200, h: 200, nm: 'scan-success', ddd: 0, assets: [], layers: [
      layer(1, 'check', [{ ty: 'gr', it: [
        { ty: 'sh', ks: stat({ i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[70, 101], [91, 122], [132, 80]], c: false }) },
        { ty: 'tm', s: stat(0), e: anim([kf(14, [0]), kf(34, [100])]), o: stat(0), m: 1 },
        { ty: 'st', c: stat(on), o: stat(100), w: stat(11), lc: 2, lj: 2 },
        tr()
      ] }]),
      layer(2, 'disc', [{ ty: 'gr', it: [{ ty: 'el', d: 1, p: stat([100, 100]), s: stat([112, 112]) }, { ty: 'fl', c: stat(ok), o: stat(100), r: 1 }, tr()] }],
        { s: anim([kf(0, [0, 0, 100]), kf(12, [114, 114, 100]), kf(22, [100, 100, 100])]) }),
      layer(3, 'pulse', [{ ty: 'gr', it: [{ ty: 'el', d: 1, p: stat([100, 100]), s: stat([112, 112]) }, { ty: 'st', c: stat(ok), o: stat(100), w: stat(5), lc: 2, lj: 2 }, tr()] }],
        { s: anim([kf(8, [100, 100, 100]), kf(46, [168, 168, 100])]), o: anim([kf(0, [0]), kf(8, [0]), kf(10, [70]), kf(46, [0])]) }),
      layer(4, 'burst', dots)
    ] };
  }

  function mount(root, o) {
    o = o || {};
    var st = fresh(), live = o.interactive !== false, timers = [], failNext = false, snap = null, holdT = null, lots = [];
    if (o.preset) for (var k in o.preset) st[k] = JSON.parse(JSON.stringify(o.preset[k]));
    root.innerHTML = '';
    var el = document.createElement('div');
    el.className = 'sp' + (o.dim ? ' dim' : '') + (live ? '' : ' static');
    el.innerHTML = '<div class="sb"><span>15:12</span><div class="ic">' + SB + '</div></div><div class="hd"></div><div class="bd"><div class="toasts"></div></div><div class="ft"></div><nav class="navb">' + NAV + '</nav>';
    root.appendChild(el);
    var hd = el.querySelector('.hd'), bd = el.querySelector('.bd'), ft = el.querySelector('.ft'), toastsEl = el.querySelector('.toasts');

    function later(fn, ms) { if (!live) return; var t = setTimeout(fn, ms); timers.push(t); return t; }
    function bin() { return BINS[st.bi % BINS.length]; }
    function val() { var n = parseInt(st.entry || '0', 10); return st.mode === 'p' ? n * bin().pack : n; }
    function diff() { var b = bin(), c = st.counts[st.counts.length - 1]; return { c: c, a: Math.abs(c - b.exp), pct: Math.round(Math.abs(c - b.exp) / b.exp * 100), short: c < b.exp, tol: Math.round(b.exp * .1) }; }
    function twice() { return st.counts.length > 1 && st.counts[0] === st.counts[1]; }
    function buzz(p) { if (live && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }
    function signal(t) { if (live && o.onSignal) o.onSignal(t); }
    function toast(t) {
      var d = document.createElement('div');
      d.className = 'toast'; d.setAttribute('role', 'status');
      d.innerHTML = '<div class="tx">' + t.text + (t.sub ? '<small>' + t.sub + '</small>' : '') + '</div>' + (t.undo ? '<button class="un" data-t>Undo</button>' : '');
      toastsEl.appendChild(d);
      while (toastsEl.children.length > 2) toastsEl.removeChild(toastsEl.firstChild);
      var kill = function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 200); };
      if (t.undo) d.querySelector('.un').onclick = function () { kill(); t.undo(); };
      if (live) later(kill, t.ms || 5000);
    }

    /* ---------- app bar ---------- */
    function appbar(title, menu) {
      return (menu ? '<button class="nb" data-t data-a="menu" aria-label="Menu">' + ic('menu', 24) + '</button>' : '<button class="nb" data-t data-a="back" aria-label="Back">' + ic('back', 24, 2.2) + '</button>') + '<div class="ttl">' + title + '</div>';
    }
    function header() {
      var t = { route: 'Aisle 14', count: st.counts.length ? 'Recount' : 'Count', variance: 'Check count', reason: 'Reason', approve: 'Approval', fail: 'Scan bin', ravi: 'Approvals' }[st.scr];
      hd.innerHTML = appbar(t, st.scr === 'route' || st.scr === 'ravi');
    }

    /* ---------- screens ---------- */
    var screens = {
      route: function () {
        var b = bin();
        var pend = st.pend.length ? '<p class="sh">Waiting for ' + SUP.first + '</p><div class="tcard" style="margin-top:8px">' + st.pend.slice().reverse().map(function (p) {
          return '<div class="rw"><span>' + m(p.code, 1) + ' · ' + p.a + ' ' + p.unit + ' ' + (p.short ? 'short' : 'over') + '</span><b>' + (p.status === 'ok' ? 'Approved' : '<span class="dot"></span>Waiting') + '</b></div>';
        }).join('') + '</div>' : '';
        return {
          body: '<p class="lbl" style="margin-top:4px">Next bin</p><div class="code big-bin">' + b.code + '</div><p class="sub">' + b.where + '.<br>' + b.dir + '</p>' +
            '<div class="tcard">' + rw('Item', b.name) + rw('SKU', b.sku, 'mono') + rw('Pack size', b.pack + ' ' + b.unit + ' per ' + b.packs.slice(0, -1)) + '</div>' +
            '<div class="card prog"><div class="ph"><b>' + st.done + ' of ' + st.total + ' counted</b><span>On pace for 17:40</span></div><div class="pb"><i style="width:' + (st.done / st.total * 100).toFixed(1) + '%"></i></div></div>' + pend,
          foot: '<button class="btn p" data-t data-a="scan">' + ic('scan', 22) + 'Scan bin label</button><button class="btn t" data-t data-a="nolabel">Can’t scan the label?</button>'
        };
      },
      count: function () {
        var b = bin(), re = st.counts.length > 0;
        return {
          body: '<div class="bin-h" style="margin-top:4px"><div class="code">' + b.code + '</div><span class="chip ok">' + ic('check', 16, 2.6) + 'Scanned</span></div>' +
            '<p class="sub" style="margin-top:6px;font-size:14px">' + b.name + ' · ' + b.pack + ' ' + b.unit + ' per ' + b.packs.slice(0, -1) + '</p>' +
            '<p class="hint">' + ic(re ? 'recount' : 'eyeoff', 18) + (re ? 'Start from zero. Your first count is hidden.' : 'Count what’s on the shelf. We’ll compare after.') + '</p>' +
            '<div class="seg' + (st.mode === 'p' ? ' r' : '') + '" role="tablist"><div class="pill"></div><button role="tab" data-t data-a="mode-u" class="' + (st.mode === 'u' ? 'on' : '') + '">' + cap(b.unit) + '</button><button role="tab" data-t data-a="mode-p" class="' + (st.mode === 'p' ? 'on' : '') + '">' + cap(b.packs) + ' of ' + b.pack + '</button></div>' +
            '<div class="num"><button class="step" data-t data-a="dec" aria-label="Remove one">' + ic('minus', 22, 2.4) + '</button><div class="val" aria-live="polite"><div class="n"></div><div class="u"></div></div><button class="step" data-t data-a="inc" aria-label="Add one">' + ic('plus', 22, 2.4) + '</button></div>' +
            pad('k'),
          foot: '<button class="btn p" data-t data-a="submit"></button>',
          after: updCount
        };
      },
      variance: function () {
        var b = bin(), x = diff(), two = st.counts.length > 1, same = twice();
        var you = m(x.c) + (same ? ' <small>twice</small>' : two ? ' <small>first: ' + st.counts[0] + '</small>' : '');
        var cause = (x.short && b.pick) ? '<div class="soft"><b>' + (b.pick.qty === x.a ? 'Likely cause' : 'Might explain part of it') + '</b><p>' + b.pick.qty + ' ' + b.unit + ' were picked for order ' + m(b.pick.order, 1) + ' at ' + b.pick.at + ', and that pick isn’t confirmed yet.</p></div>' : '';
        var msg = same ? 'Same count twice. Add a reason and send it to ' + SUP.first + '.'
          : two ? 'Your two counts differ. We’ll use the latest, or count again.'
          : 'Over the allowed gap. Most big gaps are miscounts, so try one recount first.';
        return {
          body: '<p class="sub" style="font-size:14px;margin-top:4px">' + m(b.code, 1) + ' · ' + b.name + '</p>' +
            '<div class="hero-n"><div class="code down">' + (x.short ? '−' : '+') + x.a + '</div><span>' + b.unit + ' ' + (x.short ? 'short' : 'over') + '</span></div>' +
            '<div class="tcard" style="margin-top:12px">' + rw('You counted', you, 'mono') + rw('System expects', b.exp, 'mono') + rw('Allowed gap', '±' + x.tol + ' <small>(10%)</small>', 'mono') + '</div>' +
            '<p class="sub" style="margin-top:12px;font-size:14px;line-height:20px">' + msg + '</p>' + cause,
          foot: same || two
            ? '<button class="btn p" data-t data-a="toreason">Add a reason</button><button class="btn t" data-t data-a="recount">Recount again</button>'
            : '<button class="btn p" data-t data-a="recount">' + ic('recount', 20) + 'Recount</button><button class="btn s" data-t data-a="toreason">Keep ' + x.c + ' and add a reason</button>'
        };
      },
      reason: function () {
        var b = bin(), x = diff(), list = x.short ? SHORT : OVER;
        return {
          body: '<h1 style="margin-top:4px">' + (x.short ? 'Why is it short?' : 'Why is there extra?') + '</h1><p class="sub" style="margin-top:2px">' + SUP.first + ' sees this with your count.</p><div class="radios" role="radiogroup">' + list.map(function (r) {
            var sug = r.id === 'pick' && b.pick && x.short;
            var s = sug ? (b.pick.qty === x.a ? '<span class="up">Matches the gap.</span> ' : '') + 'Order ' + m(b.pick.order) + ' took ' + b.pick.qty + ' ' + b.unit + ' at ' + b.pick.at + '.' : r.s;
            return '<button class="radio' + (st.reason === r.id ? ' on' : '') + '" role="radio" aria-checked="' + (st.reason === r.id) + '" data-t data-a="r-' + r.id + '"><span class="rad"></span><span class="rt"><b>' + r.t + '</b><span class="rs">' + s + '</span></span></button>';
          }).join('') + '</div>',
          foot: '<button class="btn p" data-t data-a="toapprove"' + (st.reason ? '' : ' disabled') + '>' + (st.reason ? 'Continue' : 'Choose a reason') + '</button>'
        };
      },
      approve: function () {
        var b = bin(), x = diff(), r = (x.short ? SHORT : OVER).filter(function (q) { return q.id === st.reason; })[0] || SHORT[0];
        return {
          body: '<h1 style="margin-top:4px">Send to ' + SUP.first + '</h1><p class="sub" style="margin-top:2px">You don’t need to wait for him.</p>' +
            req({
              head: person(SUP.ini, SUP.name, SUP.where, SUP.eta.replace('in ', 'in<br>'), true),
              gap: (x.short ? '−' : '+') + x.a, label: b.unit + ' ' + (x.short ? 'short' : 'over'), sub: m(b.code, 1) + ' · ' + b.name,
              rows: rw('You counted', m(x.c) + (twice() ? ' <small>twice</small>' : '')) + rw('System expects', b.exp, 'mono') + rw('Reason', r.t)
            }),
          foot: '<button class="btn hold" data-t data-a="hold"><span class="fill"></span><span class="lbl2">Hold to send</span></button><button class="btn t" data-t data-a="pinsheet">' + SUP.first + '’s here? Approve with his PIN</button>',
          after: bindHold
        };
      },
      fail: function () {
        var b = bin();
        if (st.fmode === 'code') return {
          body: '<h1 style="margin-top:4px">Type the check digits</h1><p class="sub" style="margin-top:2px">The 2 large digits on the label at ' + m(b.code, 1) + '.</p>' +
            '<div class="otp"></div><div class="otp-msg" aria-live="polite"></div>' +
            '<div class="label lsm" aria-hidden="true"><div class="bc"></div><div class="cd">??</div><div class="lb">' + b.code + '</div></div>' + pad('c'),
          foot: '<button class="btn t" data-t data-a="rescan">Try scanning again</button>',
          after: updCode
        };
        return {
          body: '<div class="fail-ico" style="margin-top:8px">' + ic('scan', 24, 2) + '</div><h1>Can’t read this label</h1><p class="sub" style="margin-top:6px">Usually glare or a scratch. Tilt the scanner slightly and hold it 10–30 cm away.</p>' +
            '<div class="label glare" aria-hidden="true"><div class="bc"></div><div class="cd">' + b.chk + '</div><div class="lb">' + b.code + '</div></div><div class="label-cap">Check digits</div>' +
            '<p class="sub" style="margin-top:12px;font-size:14px;line-height:20px">Still not working? Type the check digits instead. They confirm you’re at the right bin.</p>',
          foot: '<button class="btn p" data-t data-a="scan">' + ic('scan', 22) + 'Try scanning again</button><button class="btn s" data-t data-a="typecode">Type check digits</button>'
        };
      },
      ravi: function () {
        if (st.ravi === 'ok') return {
          body: '<div class="okflash" style="position:static;opacity:1;animation:none;background:none;flex:1;padding-bottom:40px"><div class="ring">' + ic('check', 32, 3) + '</div><b>Approved</b><span style="max-width:290px">' + m('14-C-03', 1) + ' is now 96 units. Meena’s been notified, and order ' + m('SO-88213', 1) + ' is flagged so its pick gets confirmed.</span></div>',
          foot: '<button class="btn s" data-t data-a="ravi-reset">Next approval</button><div style="height:48px"></div>'
        };
        return {
          body: '<div class="sec-h"><h2>Needs your OK</h2><span>3 waiting</span></div>' +
            req({
              head: person('MS', 'Meena S.', 'Cycle count · Aisle 14', '2 min ago'),
              gap: '−24', label: 'units short', sub: m('14-C-03', 1) + ' · Nitrile safety gloves, L',
              rows: rw('Counted', m('96') + ' <small>twice</small>') + rw('System expects', '120', 'mono') +
                '<div class="rw"><span>Reason</span><b class="two">Picked, not confirmed<small>' + m('SO-88213') + ' took 24 units at 13:47. Matches the gap.</small></b></div>'
            }),
          foot: '<button class="btn hold" data-t data-a="hold"><span class="fill"></span><span class="lbl2">Hold to approve</span></button><button class="btn t" data-t data-a="ravi-recount">Ask Meena to recount</button>',
          after: bindHold
        };
      }
    };
    function pad(kind) {
      var k = '';
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) { k += '<button data-t data-' + kind + '="' + n + '">' + n + '</button>'; });
      return '<div class="pad">' + k + '<button class="fn" data-t data-' + kind + '="clr">Clear</button><button data-t data-' + kind + '="0">0</button><button class="fn" data-t data-' + kind + '="del" aria-label="Delete">' + ic('del', 24, 1.8) + '</button></div>';
    }

    /* ---------- render ---------- */
    function render(dir) {
      header();
      var s = screens[st.scr](), old = bd.querySelector('.scr');
      var n = document.createElement('div');
      n.className = 'scr' + (dir ? ' ' + (dir === 'back' ? 'back-in' : 'in') : '');
      n.innerHTML = s.body;
      if (old) old.remove();
      bd.insertBefore(n, toastsEl);
      ft.innerHTML = s.foot;
      sheet(); scanov();
      if (s.after) s.after();
      if (o.onChange) o.onChange(st.scr, st);
    }
    function go(scr, dir) { st.scr = scr; render(dir || 'in'); }

    function updCount() {
      var n = bd.querySelector('.val .n'), u = bd.querySelector('.val .u'), b = bin(), sb = ft.querySelector('[data-a="submit"]');
      if (!n) return;
      var e = st.entry, prev = n.getAttribute('data-v') || '';
      if (!e) n.innerHTML = '<span class="ph">0</span><span class="car"></span>';
      else n.innerHTML = e.split('').map(function (d, i) { return '<i' + (i < prev.length && prev[i] === d && e.length >= prev.length ? ' class="st"' : '') + '>' + d + '</i>'; }).join('');
      n.setAttribute('data-v', e);
      u.innerHTML = !e ? (st.mode === 'p' ? 'full ' + b.packs : b.unit) : st.mode === 'p' ? b.packs + ' = <b>' + val() + ' ' + b.unit + '</b>' : b.unit;
      if (sb) { sb.disabled = !e; sb.textContent = e ? 'Confirm ' + val() + ' ' + b.unit : 'Enter a count'; }
    }
    function slots(wrap, len, v) {
      var h = '';
      for (var i = 0; i < len; i++) h += '<div class="sl' + (i === v.length ? ' cur' : '') + '">' + (v[i] ? '<span class="dg">' + v[i] + '</span>' : '') + '</div>';
      wrap.innerHTML = h;
    }
    function updCode() { var w = bd.querySelector('.otp'); if (w) slots(w, 2, st.code); }

    /* Sheet: the PIN sheet is the app's own */
    function sheet() {
      el.querySelectorAll('.scrim,.sheet').forEach(function (x) { x.remove(); });
      if (!st.sheet) return;
      var b = bin(), sc = document.createElement('div'); sc.className = 'scrim'; sc.setAttribute('data-a', 'closesheet');
      var sh = document.createElement('div'); sh.setAttribute('role', 'dialog');
        var x = diff();
        sh.className = 'sheet'; sh.setAttribute('aria-label', SUP.first + '’s approval PIN');
        sh.innerHTML = '<div class="hdl"></div><div class="sh-h"><div style="flex:1"><h2>' + SUP.first + ', enter your PIN</h2><p class="sub" style="font-size:14px;margin-top:2px">This approves ' + m((x.short ? '−' : '+') + x.a, 1) + ' ' + b.unit + ' at ' + m(b.code, 1) + '.</p></div><button class="x" data-t data-a="closesheet" aria-label="Close">' + ic('x', 20) + '</button></div><div class="otp"></div><div class="otp-msg" aria-live="polite">Prototype: any 4 digits</div>' + pad('n');
      el.appendChild(sc); el.appendChild(sh);
      if (st.sheet === 'pin') slots(sh.querySelector('.otp'), 4, st.pin);
    }

    /* Scanner aim screen */
    function scanov() {
      el.querySelectorAll('.scanov').forEach(function (x) { x.remove(); });
      lots.forEach(function (a) { a.destroy(); }); lots = [];
      if (!st.scan) return;
      var b = bin(), ok = st.scan === 'ok', d = document.createElement('div');
      d.className = 'scanov' + (ok ? ' ok' : '');
      d.innerHTML = '<div class="hd">' + appbar('Scan bin') + '</div><div class="aim"><div class="tgt"><div class="label"><div class="bc"></div><div class="cd">' + b.chk + '</div><div class="lb">' + b.code + '</div><div class="okmark"><i>' + ic('check', 28, 3) + '</i></div></div><div class="laser"></div></div>' +
        '<h1>' + (ok ? b.code + ' scanned' : 'Aim at the label') + '</h1><p class="sub">' + (ok ? 'Opening the count.' : 'Point the top of the scanner at ' + m(b.code, 1) + ' and press a <span class="key">yellow</span> button.') + '</p></div>' +
        (ok ? '' : '<button class="btn s" data-t data-a="scan-cancel">Cancel</button>');
      el.appendChild(d);
      if (ok) playOk(d.querySelector('.okmark i'));
    }

    /* Plays the Lottie success burst into host; falls back to the CSS check when Lottie or motion isn't available */
    function playOk(host) {
      var still = !live || !window.lottie || matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (still) return;
      var cs = getComputedStyle(el);
      host.innerHTML = ''; host.classList.add('lot');
      var a = window.lottie.loadAnimation({ container: host, renderer: 'svg', loop: false, autoplay: true,
        animationData: successLottie({ ok: cs.getPropertyValue('--success'), on: cs.getPropertyValue('--on-success'), pr: cs.getPropertyValue('--primary') }) });
      a.addEventListener('complete', function () { a.goToAndStop(a.totalFrames - 1, true); });
      lots.push(a);
    }

    function flashOk(title, sub, then) {
      var f = document.createElement('div'); f.className = 'okflash';
      f.innerHTML = '<div class="ring">' + ic('check', 32, 3) + '</div><b>' + title + '</b><span>' + sub + '</span>';
      bd.appendChild(f);
      playOk(f.querySelector('.ring'));
      setTimeout(function () { f.remove(); then(); }, live ? 1300 : 0);
    }

    /* ---------- actions ---------- */
    function scan() {
      if (!live || st.scan === 'ok') return;
      if (st.scr !== 'route' && st.scr !== 'fail') return;
      st.scan = 'aim'; st.fmode = null; scanov(); signal('aim');
      later(function () {
        signal('stop');
        if (failNext) { failNext = false; st.scan = null; scanov(); buzz([60, 80, 60]); signal('err'); go('fail'); return; }
        st.scan = 'ok'; scanov(); buzz(40); signal('ok');
        later(function () { st.scan = null; st.entry = ''; st.mode = 'u'; st.counts = []; go('count'); }, 1300);
      }, failNext ? 1500 : 1100);
    }
    function submit() {
      if (!st.entry) return;
      var b = bin(), v = val();
      st.counts.push(v);
      var pct = Math.abs(v - b.exp) / b.exp;
      if (v === b.exp) { buzz(40); signal('ok'); flashOk('Matches', m(b.code, 1) + ' · ' + v + ' ' + b.unit, function () { finish(); }); return; }
      if (pct <= 0.10) { buzz(40); signal('ok'); flashOk('Saved', v + ' ' + b.unit + ', within the allowed gap', function () { finish(); }); return; }
      buzz([40, 60, 40, 60, 40]); signal('warn');
      st.entry = ''; go('variance');
    }
    function finish() {
      st.done = Math.min(st.done + 1, st.total); st.bi++;
      st.entry = ''; st.mode = 'u'; st.counts = []; st.reason = null; st.sheet = null; st.pin = '';
      go('route');
    }
    function send() {
      var b = bin(), x = diff();
      snap = JSON.parse(JSON.stringify(st));
      var item = { code: b.code, a: x.a, short: x.short, c: x.c, unit: b.unit, status: 'wait' };
      st.pend.push(item);
      finish();
      var t = later(function () {
        item.status = 'ok';
        buzz([40, 40, 40]); signal('ok');
        toast({ text: SUP.first + ' approved ' + item.code, sub: 'Stock updated to ' + item.c + ' ' + item.unit, ms: 6000 });
        if (st.scr === 'route') render();
      }, 9000);
      toast({ text: 'Sent to ' + SUP.first, sub: 'We’ll buzz you when he decides', undo: function () { clearTimeout(t); st = snap; snap = null; render('back'); } });
    }
    function bindHold() {
      var btn = ft.querySelector('.hold');
      if (!btn) return;
      var lbl = btn.querySelector('.lbl2'), idle = lbl.textContent, rt;
      var start = function (e) {
        if (btn.classList.contains('done')) return;
        if (e && e.preventDefault) e.preventDefault();
        clearTimeout(rt); btn.classList.add('go'); lbl.textContent = 'Keep holding…'; buzz(15);
        holdT = setTimeout(function () {
          btn.classList.remove('go'); btn.classList.add('done');
          lbl.innerHTML = ic('check', 20, 3) + (st.scr === 'ravi' ? 'Approved' : 'Sent');
          buzz(40); signal('ok');
          setTimeout(function () { if (st.scr === 'ravi') { st.ravi = 'ok'; render(); } else send(); }, 380);
        }, 850);
      };
      var end = function () {
        if (btn.classList.contains('done')) return;
        clearTimeout(holdT);
        if (btn.classList.contains('go')) { btn.classList.remove('go'); lbl.textContent = 'Hold until the bar fills'; rt = setTimeout(function () { lbl.textContent = idle; }, 1600); }
      };
      btn._start = start; btn._end = end;
      btn.addEventListener('pointerdown', start);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, end); });
      btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
    function key(kind, k) {
      if (kind === 'k') {
        if (k === 'del') st.entry = st.entry.slice(0, -1);
        else if (k === 'clr') st.entry = '';
        else if (st.entry.length < 4) st.entry = (st.entry === '0' ? '' : st.entry) + k;
        updCount();
      } else if (kind === 'n') {
        var w = el.querySelector('.sheet .otp'), mg = el.querySelector('.sheet .otp-msg');
        if (!w || (st.pin.length >= 4 && k !== 'del' && k !== 'clr')) return;
        if (k === 'del') st.pin = st.pin.slice(0, -1); else if (k === 'clr') st.pin = ''; else st.pin += k;
        w.className = 'otp'; slots(w, 4, st.pin);
        if (st.pin.length === 4) {
          w.className = 'otp good'; mg.className = 'otp-msg ok'; mg.textContent = 'Approved'; buzz([40, 40, 40]); signal('ok');
          setTimeout(function () {
            var b = bin(), x = diff();
            st.pend.push({ code: b.code, a: x.a, short: x.short, c: x.c, unit: b.unit, status: 'ok' });
            finish();
            toast({ text: SUP.first + ' approved ' + b.code, sub: 'Stock updated to ' + x.c + ' ' + b.unit });
          }, live ? 800 : 0);
        }
      } else if (kind === 'c') {
        var wc = bd.querySelector('.otp'), mc = bd.querySelector('.otp-msg'), b2 = bin();
        if (!wc || (st.code.length >= 2 && k !== 'del' && k !== 'clr')) return;
        if (k === 'del') st.code = st.code.slice(0, -1); else if (k === 'clr') st.code = ''; else st.code += k;
        wc.className = 'otp'; mc.className = 'otp-msg'; mc.textContent = '';
        updCode();
        if (st.code.length === 2) {
          if (st.code === b2.chk) {
            wc.className = 'otp good'; mc.className = 'otp-msg ok'; mc.textContent = 'Location confirmed'; buzz(40); signal('ok');
            setTimeout(function () { st.code = ''; st.fmode = null; st.entry = ''; st.counts = []; go('count'); toast({ text: 'Label reported for reprint', sub: 'Facilities will replace it today' }); }, live ? 800 : 0);
          } else {
            wc.className = 'otp bad'; mc.className = 'otp-msg err'; mc.textContent = 'Those don’t match ' + b2.code + '. Check the bin.'; buzz([60, 80, 60]); signal('err');
            setTimeout(function () { st.code = ''; updCode(); }, 1100);
          }
        }
      }
    }
    function goBack() {
      if (st.sheet) return acts.closesheet();
      if (st.scan) return acts['scan-cancel']();
      acts.back();
    }
    var acts = {
      back: function () {
        var map = { count: 'route', variance: 'count', reason: 'variance', approve: 'reason', fail: 'route' };
        if (st.scan) return acts['scan-cancel']();
        if (st.scr === 'fail' && st.fmode) { st.fmode = null; st.code = ''; return render('back'); }
        if (st.scr === 'variance') st.entry = String(st.counts.pop());
        if (map[st.scr]) go(map[st.scr], 'back');
      },
      'nav-back': goBack, 'nav-home': function () {}, 'nav-recent': function () {},
      scan: scan, submit: submit,
      'scan-cancel': function () { st.scan = null; timers.forEach(clearTimeout); timers = []; signal('stop'); scanov(); },
      'mode-u': function () { if (st.mode !== 'u') { st.mode = 'u'; st.entry = ''; render(); } },
      'mode-p': function () { if (st.mode !== 'p') { st.mode = 'p'; st.entry = ''; render(); } },
      inc: function () { st.entry = String(Math.min(9999, (parseInt(st.entry || '0', 10) + 1))); updCount(); },
      dec: function () { var v = parseInt(st.entry || '0', 10) - 1; st.entry = v > 0 ? String(v) : ''; updCount(); },
      recount: function () { st.entry = ''; st.mode = 'u'; go('count'); },
      toreason: function () { go('reason'); },
      toapprove: function () { if (st.reason) go('approve'); },
      pinsheet: function () { st.sheet = 'pin'; st.pin = ''; sheet(); },
      closesheet: function () { st.sheet = null; sheet(); },
      nolabel: function () { st.fmode = null; go('fail'); },
      typecode: function () { st.fmode = 'code'; st.code = ''; render(); },
      rescan: function () { st.fmode = null; render('back'); },
      menu: function () {},
      'ravi-reset': function () { st.ravi = 'pending'; render('back'); },
      'ravi-recount': function () { toast({ text: 'Recount requested', sub: '14-C-03 is back on Meena’s route' }); }
    };
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-a],[data-k],[data-n],[data-c]');
      if (!t || !el.contains(t)) return;
      if (t.dataset.k) return key('k', t.dataset.k);
      if (t.dataset.n) return key('n', t.dataset.n);
      if (t.dataset.c) return key('c', t.dataset.c);
      var a = t.dataset.a;
      if (a.indexOf('r-') === 0) {
        st.reason = a.slice(2);
        bd.querySelectorAll('.radio').forEach(function (b) { var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
        var c = ft.querySelector('[data-a="toapprove"]'); if (c) { c.disabled = false; c.textContent = 'Continue'; }
        return;
      }
      if (acts[a]) acts[a](t);
    });

    /* Desktop keyboard stands in for the scanner's hardware keys */
    var heldEnter = false;
    function onKey(e) {
      if (!o.keys || !o.keys()) return;
      var k = e.key, kind = st.sheet === 'pin' ? 'n' : st.scr === 'count' && !st.sheet ? 'k' : st.scr === 'fail' && st.fmode === 'code' ? 'c' : null;
      if (/^[0-9]$/.test(k) && kind) { e.preventDefault(); flash(kind, k); return key(kind, k); }
      if (k === 'Backspace' && kind) { e.preventDefault(); flash(kind, 'del'); return key(kind, 'del'); }
      if (k === 'Escape') { e.preventDefault(); return goBack(); }
      if (k === ' ') { e.preventDefault(); return scan(); }
      if (k === 'Enter') {
        e.preventDefault();
        var h = ft.querySelector('.hold');
        if (h && !st.sheet) { if (!heldEnter) { heldEnter = true; h._start(); } return; }
        var p = ft.querySelector('.btn.p:not([disabled])'); if (p && !st.sheet && !st.scan) p.click();
      }
    }
    function onKeyUp(e) { if (e.key === 'Enter' && heldEnter) { heldEnter = false; var h = ft.querySelector('.hold'); if (h && h._end) h._end(); } }
    function flash(kind, k) { var b = el.querySelector('[data-' + kind + '="' + k + '"]'); if (b) { b.classList.add('hit'); setTimeout(function () { b.classList.remove('hit'); }, 110); } }
    if (live) { document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKeyUp); }

    render();
    if (o.toasts) o.toasts.forEach(toast);
    function clear() { timers.forEach(clearTimeout); timers = []; toastsEl.innerHTML = ''; el.querySelectorAll('.okflash').forEach(function (f) { f.remove(); }); signal('stop'); }
    return {
      el: el,
      jump: function (scr, preset) { clear(); st = fresh(); if (preset) for (var k in preset) st[k] = JSON.parse(JSON.stringify(preset[k])); st.scr = scr; render('in'); },
      reset: function () { clear(); st = fresh(); render('back'); },
      trigger: scan,
      failNext: function () { failNext = true; },
      dim: function (on) { el.classList.toggle('dim', on); },
      gloves: function (on) { el.classList.toggle('gl', on); },
      state: function () { return st; }
    };
  }
  window.StockPilot = { mount: mount, BINS: BINS };
})();
