(function () {
  'use strict';

  /* ─── CONFIG — pas hier aan ──────────────────────────────────── */
  const C = {
    bedrijf:    'Roel Willemsen Garantiemakelaars',
    primair:    '#1a5c3a',
    accent:     '#f5c800',
    welkomst:   'Goedendag! Ik ben de AI-assistent van Roel Willemsen. Hoe kan ik je helpen? 🏠',
    suggesties: ['Wat kost een taxatie?', 'Hoe verkoop ik mijn huis?', 'Afspraak maken'],

    // ── WhatsApp bedrijfsnummer ────────────────────────────────────
    // Formaat: landcode + nummer, geen +, spaties of streepjes
    // +31 6 12 34 56 78  →  31612345678
    whatsappNummer: '31612345678',   // ← DIT AANPASSEN

    // Groq key staat in Vercel env vars — nooit hier invullen!
    apiUrl: '/api/chat',

    prompt: `Je bent de vriendelijke AI-assistent van Roel Willemsen Garantiemakelaars in Arnhem.

BEDRIJFSINFO:
- Adres: Ella Fitzgeraldstraat 37, 6836 DP Arnhem
- Telefoon: 026-3274455 | info@roelwillemsen.nl
- Openingstijden: maandag t/m vrijdag 09:00-17:00
- NVM Garantiemakelaar met 45+ jaar ervaring in Arnhem
- Klantbeoordeling: 9.2/10 op Funda | KVK: 09084524

TEAM:
- David Franke — Vastgoedadviseur, 06-10904231
- Maurice Freijters — NVM Register Makelaar & Taxateur, 06-53162169
- Marenthe Freijters — Marketeer
- Leny Huisman — Commercieel Medewerker Binnendienst
- Loïs Freijters — Commercieel Medewerker Binnendienst

DIENSTEN & PRIJZEN:
- Huis verkopen: No Cure = No Pay, courtage ~1-1,5%
- Aankoop begeleiding: professionele ondersteuning bij aankoop
- Taxatie: 350-600 euro door erkend taxateur
- Gratis waardebepaling: kosteloos en vrijblijvend
- Bouwtechnische keuring: mogelijk in combinatie met aankoop

VERKOOPPROCES:
1. Onderzoek & afspraken
2. Presentatie & prijs — Funda, foto's
3. Bezichtiging & onderhandelen
4. Overdracht — juridische afhandeling

VEELGESTELDE VRAGEN:
- Verkoopduur: gemiddeld 4-8 weken regio Arnhem
- No Cure = No Pay: courtage alleen bij succesvolle verkoop
- Werkgebied: Arnhem, Velp, Arnhem-Zuid, Elst, Zevenaar en omgeving
- Weekend: nee, alleen ma-vr 09:00-17:00

LEAD GENERATIE — CRUCIAAL:
Zodra een bezoeker interesse toont in afspraak, waardebepaling, taxatie, verkoop of aankoop:
1. Vraag vriendelijk naar hun naam
2. Vraag daarna naar hun telefoonnummer
3. Zodra je BEIDE hebt, zet dit EXACT op de allerlaatste regel:
   [LEAD|naam=NAAM|tel=TEL|interesse=OMSCHRIJVING]
4. Nooit zichtbaar tonen — alleen achteraan je antwoord

GEDRAGSREGELS:
- Vriendelijk, professioneel, kort (max 3-4 zinnen)
- Stuur altijd aan op contact of afspraak
- Antwoord UITSLUITEND in het Nederlands
- Bij twijfel: verwijs naar 026-3274455 of info@roelwillemsen.nl`
  };
  /* ──────────────────────────────────────────────────────────────── */

  const P = C.primair, A = C.accent;
  let busy = false, leadGedaan = false;
  let historie = [];

  const stl = document.createElement('style');
  stl.textContent = `
    #lnch-toggle{position:fixed;bottom:24px;right:24px;width:60px;height:60px;background:${P};border:none;border-radius:50%;cursor:pointer;font-size:26px;box-shadow:0 6px 24px rgba(0,0,0,0.25);z-index:99999;transition:transform .2s;display:flex;align-items:center;justify-content:center;}
    #lnch-toggle:hover{transform:scale(1.1);}
    #lnch-badge{position:absolute;top:-4px;right:-4px;background:${A};color:#0f3d26;font-size:11px;font-weight:700;width:19px;height:19px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    #lnch-window{position:fixed;bottom:98px;right:24px;width:350px;max-height:580px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.18);z-index:99998;display:none;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
    #lnch-window.open{display:flex;animation:lnchUp .25s ease;}
    @keyframes lnchUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .lnch-hd{background:${P};padding:14px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;}
    .lnch-av{width:40px;height:40px;background:${A};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
    .lnch-ht h4{color:#fff;font-size:13px;font-weight:700;margin:0;}
    .lnch-ht p{color:rgba(255,255,255,.55);font-size:11px;margin:2px 0 0;}
    .lnch-on{width:8px;height:8px;background:#22c55e;border-radius:50%;margin-left:auto;flex-shrink:0;animation:lnchP 2s infinite;}
    @keyframes lnchP{0%,100%{opacity:1}50%{opacity:.4}}
    #lnch-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f9f9f9;}
    .lmsg{max-width:83%;padding:9px 13px;border-radius:13px;font-size:13px;line-height:1.5;animation:lnchUp .25s ease;}
    .lmsg.bot{background:#fff;color:#1a1a1a;align-self:flex-start;border:1px solid #e5e7eb;border-bottom-left-radius:3px;}
    .lmsg.user{background:${P};color:#fff;align-self:flex-end;border-bottom-right-radius:3px;}
    .ltyping{display:flex;gap:5px;padding:12px 14px;background:#fff;border:1px solid #e5e7eb;border-radius:13px;border-bottom-left-radius:3px;align-self:flex-start;}
    .ldot{width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:lnchB 1.4s infinite;}
    .ldot:nth-child(2){animation-delay:.2s}.ldot:nth-child(3){animation-delay:.4s}
    @keyframes lnchB{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    .lnch-wa-card{margin:0 12px 10px;background:linear-gradient(135deg,${P},#0f3d26);border-radius:14px;padding:16px;flex-shrink:0;animation:lnchUp .35s ease;}
    .lnch-wa-card strong{color:#fff;font-size:13px;display:block;margin-bottom:6px;}
    .lnch-wa-info{background:rgba(0,0,0,.2);border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:rgba(255,255,255,.85);line-height:1.7;}
    .lnch-wa-card p{color:rgba(255,255,255,.7);font-size:12px;margin-bottom:10px;}
    .lnch-wa-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;border:none;border-radius:9px;padding:11px;width:100%;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;text-decoration:none;transition:background .2s;}
    .lnch-wa-btn:hover{background:#1aab52;}
    #lnch-sugs{padding:8px 12px;display:flex;gap:6px;flex-wrap:wrap;border-top:1px solid #f0f0f0;background:#fff;flex-shrink:0;}
    .lsug{font-size:11.5px;padding:5px 11px;border:1.5px solid ${P};color:${P};border-radius:100px;cursor:pointer;background:none;font-family:inherit;transition:all .2s;white-space:nowrap;}
    .lsug:hover{background:${P};color:#fff;}
    .lnch-ir{padding:10px 12px;display:flex;gap:8px;border-top:1px solid #e5e7eb;background:#fff;flex-shrink:0;}
    #lnch-input{flex:1;border:1.5px solid #e5e7eb;border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;resize:none;background:#fafafa;transition:border-color .2s;}
    #lnch-input:focus{border-color:${P};background:#fff;}
    #lnch-send{width:38px;height:38px;background:${P};border:none;border-radius:9px;cursor:pointer;color:#fff;font-size:15px;flex-shrink:0;display:flex;align-items:center;justify-content:center;align-self:flex-end;}
    #lnch-send:hover{filter:brightness(1.15);}
    #lnch-send:disabled{opacity:.4;cursor:not-allowed;}
    .lnch-ft{text-align:center;padding:6px;font-size:10px;color:#ccc;background:#fff;border-top:1px solid #f5f5f5;flex-shrink:0;}
    .lnch-ft a{color:#ccc;text-decoration:none;}
    @media(max-width:400px){#lnch-window{width:calc(100vw - 32px);right:16px;}}
  `;
  document.head.appendChild(stl);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button id="lnch-toggle" onclick="window.__lnchToggle()">💬<span id="lnch-badge">1</span></button>
    <div id="lnch-window">
      <div class="lnch-hd">
        <div class="lnch-av">🏠</div>
        <div class="lnch-ht"><h4>${C.bedrijf}</h4><p>Altijd bereikbaar · Antwoord in seconden</p></div>
        <div class="lnch-on"></div>
      </div>
      <div id="lnch-msgs"><div class="lmsg bot">${C.welkomst}</div></div>
      <div id="lnch-sugs">${C.suggesties.map(s => `<button class="lsug" onclick="window.__lnchQ('${s}')">${s}</button>`).join('')}</div>
      <div class="lnch-ir">
        <textarea id="lnch-input" placeholder="Stel je vraag..." rows="1"></textarea>
        <button id="lnch-send">&#x27A4;</button>
      </div>
      <div class="lnch-ft">Mogelijk gemaakt door <a href="https://briqk.nl" target="_blank">Briqk.nl</a></div>
    </div>`;
  document.body.appendChild(wrap);

  const win  = document.getElementById('lnch-window');
  const msgs = document.getElementById('lnch-msgs');
  const inp  = document.getElementById('lnch-input');
  const snd  = document.getElementById('lnch-send');
  const sugs = document.getElementById('lnch-sugs');

  window.__lnchToggle = () => {
    win.classList.toggle('open');
    document.getElementById('lnch-badge').style.display = 'none';
    if (win.classList.contains('open')) inp.focus();
  };
  window.__lnchQ = t => { sugs.style.display = 'none'; inp.value = t; __lnchSend(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); __lnchSend(); } });
  snd.addEventListener('click', __lnchSend);

  function voegBerichtToe(tekst, rol) {
    const d = document.createElement('div');
    d.className = `lmsg ${rol}`;
    d.textContent = tekst;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function voegTypingToe() {
    const d = document.createElement('div');
    d.className = 'ltyping';
    d.innerHTML = '<div class="ldot"></div><div class="ldot"></div><div class="ldot"></div>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function detecteerLead(tekst) {
    const m = tekst.match(/\[LEAD\|naam=([^|]+)\|tel=([^|]+)\|interesse=([^\]]+)\]/i);
    return m ? { naam: m[1].trim(), tel: m[2].trim(), interesse: m[3].trim() } : null;
  }

  function verwijderLeadTag(tekst) {
    return tekst.replace(/\[LEAD\|[^\]]+\]/gi, '').trim();
  }

  function toonWhatsAppCard(lead) {
    if (leadGedaan) return;
    leadGedaan = true;

    const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    const tekst = encodeURIComponent(
      `*Nieuwe lead via website!*\n\n` +
      `Naam: ${lead.naam}\n` +
      `Telefoon: ${lead.tel}\n` +
      `Interesse: ${lead.interesse}\n\n` +
      `Datum: ${datum}\n` +
      `Bron: AI-assistent roelwillemsen.nl`
    );

    const card = document.createElement('div');
    card.className = 'lnch-wa-card';
    card.innerHTML = `
      <strong>Gegevens ontvangen!</strong>
      <div class="lnch-wa-info">
        Naam: ${lead.naam}<br>
        Telefoon: ${lead.tel}<br>
        Interesse: ${lead.interesse}
      </div>
      <p>Klik hieronder om jouw gegevens via WhatsApp te bevestigen.</p>
      <a class="lnch-wa-btn"
         href="https://wa.me/${C.whatsappNummer}?text=${tekst}"
         target="_blank" rel="noopener">
        WhatsApp bevestiging sturen
      </a>`;

    win.insertBefore(card, document.querySelector('.lnch-ir'));
    msgs.scrollTop = msgs.scrollHeight;
    window.dispatchEvent(new CustomEvent('briqk-lead', { detail: lead }));
  }

  async function __lnchSend() {
    const msg = inp.value.trim();
    if (!msg || busy) return;

    voegBerichtToe(msg, 'user');
    inp.value = '';
    busy = true;
    snd.disabled = true;
    historie.push({ role: 'user', content: msg });

    const typing = voegTypingToe();

    try {
      const res = await fetch(C.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: C.prompt },
            ...historie
          ]
        })
      });

      const data = await res.json();
      typing.remove();

      const rawAntwoord = res.ok
        ? (data.choices?.[0]?.message?.content || 'Bel ons even op 026-3274455.')
        : 'Er ging iets mis. Bel ons op 026-3274455.';

      const lead = detecteerLead(rawAntwoord);
      const zichtbaar = verwijderLeadTag(rawAntwoord);

      voegBerichtToe(zichtbaar, 'bot');
      historie.push({ role: 'assistant', content: rawAntwoord });

      if (lead) setTimeout(() => toonWhatsAppCard(lead), 500);

    } catch (e) {
      typing.remove();
      voegBerichtToe('Bel ons gerust op 026-3274455.', 'bot');
    }

    busy = false;
    snd.disabled = false;
    inp.focus();
  }

  window.__lnchSend = __lnchSend;

})();
