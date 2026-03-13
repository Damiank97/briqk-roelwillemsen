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
- Openingstijden: ma-vr 09:00-17:00
- NVM Garantiemakelaar, 45+ jaar ervaring, 9.2/10 op Funda

TEAM:
- David Franke — Vastgoedadviseur, 06-10904231
- Maurice Freijters — NVM Register Makelaar & Taxateur, 06-53162169

DIENSTEN:
- Huis verkopen: No Cure = No Pay, courtage ~1-1,5%
- Gratis waardebepaling: kosteloos en vrijblijvend
- Taxatie: 350-600 euro, erkend taxateur
- Aankoop begeleiding, bouwtechnische keuring

VEELGESTELDE VRAGEN:
- Verkoopduur: gemiddeld 4-8 weken
- Werkgebied: Arnhem, Velp, Arnhem-Zuid, Elst, Zevenaar
- Waardebepaling vs taxatie: waardebepaling gratis/indicatief, taxatie officieel/betaald
- Weekend: nee, alleen ma-vr 09:00-17:00

WANNEER GEEN LEAD FLOW:
Bij informatieve vragen zoals "wat kost...", "hoe werkt...", "wat is...", "hoe lang duurt..." → gewoon vriendelijk beantwoorden, GEEN naam of telefoonnummer vragen.

WANNEER WEL LEAD FLOW:
Alleen als iemand ZELF aangeeft dat ze iets willen doen. Signaalwoorden: "ik wil", "ik zou graag", "kunnen jullie mij helpen", "ik ben geïnteresseerd", "afspraak maken", "mijn huis verkopen", "waardebepaling aanvragen".

LEAD FLOW (3 stappen, nooit overslaan):
Stap 1 — beantwoord kort en vraag naam:
"[korte reactie]. Zal ik een berichtje voor je klaarzetten zodat we contact kunnen opnemen? Mag ik je naam?"

Stap 2 — zodra je de echte naam hebt, vraag telefoonnummer:
"Fijn [naam]! En je telefoonnummer zodat we je kunnen terugbellen?"

Stap 3 — zodra je het echte telefoonnummer hebt, sluit af:
"Top [naam], ik heb alles voor je klaarstaan! Klik op de knop hieronder om ons een berichtje te sturen — dan nemen wij zo snel mogelijk contact op. 😊"
Zet dan EXACT dit op de ALLERLAATSTE REGEL (onzichtbaar voor bezoeker):
[LEAD|naam=ECHTENAAM|tel=ECHTETEL|interesse=KORTE_OMSCHRIJVING]

BELANGRIJK:
- Vul bij naam en tel ALTIJD de echte waarden in die de bezoeker heeft gegeven
- Nooit "naam", "tel" of placeholders invullen — alleen echte antwoorden
- Stel één vraag tegelijk
- Antwoord UITSLUITEND in het Nederlands
- Max 3 zinnen per bericht`
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
    .lnch-wa-card{margin:0 12px 10px;background:linear-gradient(135deg,${P},#0a2e1a);border-radius:16px;padding:16px;flex-shrink:0;animation:lnchUp .4s ease;border:1px solid rgba(255,255,255,0.08);}
    .wa-card-header{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
    .wa-card-icon{width:38px;height:38px;background:rgba(255,255,255,0.12);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
    .wa-card-title{color:#fff;font-size:13px;font-weight:700;line-height:1.3;}
    .wa-card-sub{color:rgba(255,255,255,.5);font-size:11px;margin-top:2px;}
    .lnch-wa-info{background:rgba(0,0,0,.2);border-radius:10px;padding:10px 13px;margin-bottom:12px;font-size:13px;color:rgba(255,255,255,.9);line-height:1.7;}
    .wa-card-footer{text-align:center;color:rgba(255,255,255,.45);font-size:11px;margin-top:10px;}
    .wa-card-close{margin-left:auto;background:rgba(255,255,255,.12);border:none;color:rgba(255,255,255,.6);width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s;}
    .wa-card-close:hover{background:rgba(255,255,255,.25);color:#fff;}
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
      <div class="wa-card-header">
        <span class="wa-card-icon">✉️</span>
        <div>
          <div class="wa-card-title">Jouw berichtje staat klaar!</div>
          <div class="wa-card-sub">Één klik en wij nemen contact op</div>
        </div>
        <button class="wa-card-close" onclick="this.closest('.lnch-wa-card').remove()" title="Sluiten">✕</button>
      </div>
      <div class="lnch-wa-info">
        👤 ${lead.naam} &nbsp;·&nbsp; 📞 ${lead.tel}<br>
        <span style="opacity:.75;font-size:11px">${lead.interesse}</span>
      </div>
      <a class="lnch-wa-btn"
         href="https://wa.me/${C.whatsappNummer}?text=${tekst}"
         target="_blank" rel="noopener">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Stuur berichtje naar Roel Willemsen
      </a>
      <div class="wa-card-footer">We nemen binnen 1 werkdag contact op 🏠</div>`;

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
