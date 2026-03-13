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
    apiUrl:  '/api/chat',
    leadUrl: '/api/lead',

    prompt: `Je bent de AI-assistent van Roel Willemsen Garantiemakelaars in Arnhem.

BEDRIJFSINFO:
- Adres: Ella Fitzgeraldstraat 37, 6836 DP Arnhem | Tel: 026-3274455 | info@roelwillemsen.nl
- Openingstijden: ma-vr 09:00-17:00 | NVM Garantiemakelaar | 45+ jaar | 9.2/10 op Funda

DIENSTEN:
- Huis verkopen: No Cure = No Pay, courtage ~1-1,5%
- Gratis waardebepaling: kosteloos en vrijblijvend
- Taxatie: 350-600 euro, erkend taxateur
- Aankoop begeleiding, bouwtechnische keuring
- Werkgebied: Arnhem, Velp, Arnhem-Zuid, Elst, Zevenaar

OPMAAKREGELS — VERPLICHT:
1. Maximaal 2 zinnen per antwoord. Nooit langer.
2. Geen opsommingen of bulletpoints.
3. Altijd slechts 1 vraag per bericht — nooit meerdere vragen tegelijk.
4. Buiten de lead flow: eindig met [OPTIES:] tag (zie onder).

OPTIES TAG (buiten lead flow):
Formaat: [OPTIES: Knop 1 | Knop 2 | Knop 3] — altijd op de allerlaatste regel.
Voorbeelden:
- Algemeen: [OPTIES: Huis verkopen | Huis kopen | Gratis waardebepaling]
- Na uitleg verkopen: [OPTIES: Afspraak inplannen | Wat kost het? | Hoe lang duurt het?]
- Na uitleg taxatie: [OPTIES: Taxatie aanvragen | Gratis waardebepaling | Meer info]

LEAD FLOW — verplicht na 2-3 beantwoorde vragen van de bezoeker:
Tel het aantal vragen dat de bezoeker heeft gesteld. Na 2 à 3 vragen ga je over naar de lead flow, ook als de bezoeker niet zelf om contact vraagt.

Stap 1 — vraag naam:
"Om je nog beter te kunnen helpen, mag ik je naam weten?"

Stap 2 — zodra je de naam hebt, vraag telefoonnummer:
"Fijn, [naam]! Wat is je telefoonnummer zodat we je persoonlijk kunnen terugbellen?"

Stap 3a — als bezoeker geen nummer wil geven, vraag e-mailadres:
"Geen probleem! Mag ik dan je e-mailadres, zodat we je via de mail kunnen bereiken?"

Stap 3b — als bezoeker ook geen e-mail wil geven:
"Dat begrijp ik. U kunt ons zelf bereiken via 026-3274455 of info@roelwillemsen.nl — we helpen u graag!"
Zet daarna GEEN lead tag.

Stap 4 — zodra je naam + telefoon OF naam + e-mail hebt, sluit af:
"Top [naam], ik heb alles voor je klaarstaan! Klik op de knop hieronder om ons te bereiken. 😊"
Zet dan EXACT op de allerlaatste regel:
[LEAD|naam=ECHTENAAM|tel=ECHTETEL|interesse=KORTE_OMSCHRIJVING]
(als geen telefoon maar wel email: vul tel in met het e-mailadres)

REGELS LEAD FLOW:
- Nooit naam/tel/email als placeholder invullen — alleen echte waarden
- Altijd 1 vraag per bericht
- Tijdens lead flow: geen [OPTIES:] tag

TAAL: Altijd Nederlands. Vriendelijk en warm.`
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
    .lnch-ir{padding:10px 12px;display:flex;gap:8px;border-top:1px solid #e5e7eb;background:#fff;flex-shrink:0;}
    #lnch-input{flex:1;border:1.5px solid #e5e7eb;border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;resize:none;background:#fafafa;transition:border-color .2s;}
    #lnch-input:focus{border-color:${P};background:#fff;}
    #lnch-send{width:38px;height:38px;background:${P};border:none;border-radius:9px;cursor:pointer;color:#fff;font-size:15px;flex-shrink:0;display:flex;align-items:center;justify-content:center;align-self:flex-end;}
    #lnch-send:hover{filter:brightness(1.15);}
    #lnch-send:disabled{opacity:.4;cursor:not-allowed;}
    .lnch-ft{text-align:center;padding:6px;font-size:10px;color:#ccc;background:#fff;border-top:1px solid #f5f5f5;flex-shrink:0;}
    .lnch-ft a{color:#ccc;text-decoration:none;}
    @media(max-width:400px){#lnch-window{width:calc(100vw - 32px);right:16px;}}
    .lnch-opties{display:flex;flex-direction:column;gap:6px;align-self:stretch;animation:lnchUp .25s ease;margin-top:2px;}
    .lnch-optie-btn{background:#fff;border:1.5px solid ${P};color:${P};border-radius:10px;padding:10px 14px;text-align:left;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;transition:all .18s;line-height:1.3;}
    .lnch-optie-btn:hover{background:${P};color:#fff;transform:translateX(3px);}
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

  let welkomstOptiesGetoond = false;
  window.__lnchToggle = () => {
    win.classList.toggle('open');
    document.getElementById('lnch-badge').style.display = 'none';
    if (win.classList.contains('open')) {
      inp.focus();
      if (!welkomstOptiesGetoond) {
        welkomstOptiesGetoond = true;
        setTimeout(() => toonOpties(['Huis verkopen', 'Huis kopen', 'Gratis waardebepaling']), 500);
      }
    }
  };
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

  function verwijderOptiesTag(tekst) {
    return tekst.replace(/\[OPTIES:[^\]]+\]/gi, '').trim();
  }

  // Kies slimme opties op basis van context (niet afhankelijk van LLM)
  function kiesOpties(userBericht, botAntwoord) {
    const u = (userBericht || '').toLowerCase();
    const b = (botAntwoord  || '').toLowerCase();

    // Tijdens lead flow: geen opties
    if (b.includes('mag ik je naam') || b.includes('telefoonnummer')) return null;

    // Optie-sets per context
    if (u.includes('verkoop') || u.includes('verkopen') || b.includes('verkop'))
      return ['Afspraak inplannen', 'Wat kost het?', 'Hoe lang duurt het?'];

    if (u.includes('taxatie') || b.includes('taxatie'))
      return ['Taxatie aanvragen', 'Wat kost een taxatie?', 'Gratis waardebepaling'];

    if (u.includes('koop') || u.includes('kopen') || u.includes('aankoop'))
      return ['Aankoopbegeleiding', 'Werkgebied bekijken', 'Afspraak inplannen'];

    if (u.includes('waardebepaling') || b.includes('waardebepaling'))
      return ['Waardebepaling aanvragen', 'Verschil met taxatie?', 'Afspraak inplannen'];

    if (u.includes('courtage') || u.includes('kost') || b.includes('courtage'))
      return ['Afspraak inplannen', 'Gratis waardebepaling', 'Hoe lang duurt verkoop?'];

    if (u.includes('werkgebied') || u.includes('arnhem') || u.includes('velp'))
      return ['Afspraak inplannen', 'Huis verkopen', 'Gratis waardebepaling'];

    // Default na elk bot-bericht
    return ['Huis verkopen', 'Huis kopen', 'Gratis waardebepaling'];
  }

  function toonOpties(opties) {
    const oud = msgs.querySelector('.lnch-opties');
    if (oud) oud.remove();
    if (!opties || leadGedaan) return;

    const wrap = document.createElement('div');
    wrap.className = 'lnch-opties';
    opties.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'lnch-optie-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        wrap.remove();
        inp.value = opt;
        __lnchSend();
      };
      wrap.appendChild(btn);
    });
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function toonLeadCard(lead) {
    if (leadGedaan) return;
    leadGedaan = true;

    const datum = new Date().toLocaleDateString('nl-NL', { day:'numeric', month:'long', year:'numeric' });

    // ── 1. Stuur lead automatisch naar Roel via Formspree (e-mail) ──
    let emailVerstuurd = false;
    try {
      const r = await fetch(C.leadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam:      lead.naam,
          telefoon:  lead.tel,
          interesse: lead.interesse,
          datum:     datum
        })
      });
      emailVerstuurd = r.ok;
    } catch(e) { emailVerstuurd = false; }

    // ── 2. WhatsApp deep link — bezoeker opent gesprek met Roel ────
    const waTekst = encodeURIComponent(
      `Hoi Roel! Ik ben ${lead.naam} en ik heb interesse in: ${lead.interesse}. ` +
      `Jullie AI-assistent gaf aan dat jullie contact zouden opnemen. ` +
      `Mijn telefoonnummer is ${lead.tel}. Kunnen we een afspraak maken?`
    );
    const waUrl = `https://wa.me/${C.whatsappNummer}?text=${waTekst}`;

    // ── 3. Toon card ───────────────────────────────────────────────
    const card = document.createElement('div');
    card.className = 'lnch-wa-card';
    card.innerHTML = `
      <div class="wa-card-header">
        <span class="wa-card-icon">✅</span>
        <div>
          <div class="wa-card-title">Gegevens ontvangen, ${lead.naam}!</div>
          <div class="wa-card-sub">${emailVerstuurd ? 'We nemen zo snel mogelijk contact op' : 'Stuur ons een berichtje via WhatsApp'}</div>
        </div>
        <button class="wa-card-close" onclick="this.closest('.lnch-wa-card').remove()" title="Sluiten">✕</button>
      </div>
      <div class="lnch-wa-info">
        📞 ${lead.tel} &nbsp;·&nbsp; 🏠 ${lead.interesse}
      </div>
      <a class="lnch-wa-btn" href="${waUrl}" target="_blank" rel="noopener">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Direct WhatsApp-gesprek starten met Roel
      </a>
      <div class="wa-card-footer">${emailVerstuurd ? '📧 Bevestiging verstuurd · Reactie binnen 1 werkdag' : '💬 Of bel ons op 026-3274455'}</div>`;

    win.insertBefore(card, document.querySelector('.lnch-ir'));
    msgs.scrollTop = msgs.scrollHeight;

    // Stuur event naar pagina voor badge update
    window.dispatchEvent(new CustomEvent('briqk-lead', { detail: { ...lead, emailVerstuurd } }));
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
      let zichtbaar = verwijderLeadTag(rawAntwoord);
      zichtbaar = verwijderOptiesTag(zichtbaar);

      voegBerichtToe(zichtbaar, 'bot');
      historie.push({ role: 'assistant', content: rawAntwoord });

      if (lead) {
        setTimeout(() => toonWhatsAppCard(lead), 500);
      } else {
        const opties = kiesOpties(msg, zichtbaar);
        setTimeout(() => toonOpties(opties), 400);
      }

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
