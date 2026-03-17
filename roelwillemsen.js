(function () {
  'use strict';

  /* ─── CONFIG — pas hier aan ──────────────────────────────────── */
  const C = {
    bedrijf:    'Roel Willemsen Garantiemakelaars',
    primair:    '#1a5c3a',
    accent:     '#f5c800',
    welkomst:   'Goedendag! Ik ben de AI-assistent van Roel Willemsen. Hoe kan ik je helpen? 🏠',
    whatsappNummer: '31612345678',   // ← DIT AANPASSEN
    apiUrl:  '/api/chat',
    leadNa: 2,  // na hoeveel gebruikersberichten start de lead flow

    prompt: `Je bent de AI-assistent van Roel Willemsen Garantiemakelaars in Arnhem.

BEDRIJFSINFO:
- Adres: Ella Fitzgeraldstraat 37, 6836 DP Arnhem | Tel: 026-3274455 | info@roelwillemsen.nl
- Openingstijden: ma-vr 09:00-17:00 | NVM Garantiemakelaar | 45+ jaar | 9.2/10 op Funda

DIENSTEN:
- Huis verkopen: No Cure = No Pay, courtage ~1-1,5%, gemiddeld 4-8 weken
- Gratis waardebepaling: kosteloos en vrijblijvend
- Taxatie: 350-600 euro, erkend taxateur
- Aankoop begeleiding, bouwtechnische keuring
- Werkgebied: Arnhem, Velp, Arnhem-Zuid, Elst, Zevenaar

ABSOLUTE REGELS — NOOIT OVERTREDEN:
1. Maximaal 2 zinnen. Punt.
2. NOOIT een vraag stellen. Geen vraagteken gebruiken. Nooit.
3. Geen opsommingen of bulletpoints.
4. Eindig altijd met een feit of voordeel, nooit met een vraag.

VOORBEELDEN VAN GOEDE ANTWOORDEN:
- "Huis kopen" → "Wij begeleiden u bij de aankoop in de regio Arnhem, van bezichtiging tot overdracht. Onze makelaars kennen de lokale markt als geen ander."
- "Huis verkopen" → "Met onze No Cure = No Pay garantie betaalt u alleen als uw huis verkocht is. Gemiddeld verkopen wij binnen 4 tot 8 weken."
- "Taxatie" → "Een officiële taxatie kost tussen de 350 en 600 euro en wordt uitgevoerd door een erkend taxateur. Het rapport is geldig voor hypotheekaanvragen."

TAAL: Altijd Nederlands. Vriendelijk en direct.`
  };

  const P = C.primair, A = C.accent;
  let busy = false, leadGedaan = false;
  let userTeller = 0;
  let leadFase = null;  // null | 'naam' | 'tel' | 'email' | 'klaar' | 'afgesloten'
  let leadData = { naam: '', tel: '', interesse: 'Informatie' };
  let historie = [];

  /* STYLES */
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
    .lnch-invoer-card{background:#fff;border:1.5px solid #e5e7eb;border-radius:13px;padding:14px;align-self:stretch;animation:lnchUp .25s ease;margin-top:2px;}
    .lnch-invoer-label{font-size:12px;color:#6b7280;margin-bottom:8px;font-weight:500;}
    .lnch-invoer-field{width:100%;border:1.5px solid #e5e7eb;border-radius:8px;padding:9px 12px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color .2s;}
    .lnch-invoer-field:focus{border-color:${P};}
    .lnch-invoer-btn{margin-top:8px;width:100%;background:${P};color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:filter .2s;}
    .lnch-invoer-btn:hover{filter:brightness(1.1);}
    .lnch-invoer-skip{display:block;text-align:center;margin-top:6px;font-size:11px;color:#9ca3af;cursor:pointer;background:none;border:none;font-family:inherit;width:100%;}
    .lnch-invoer-skip:hover{color:#6b7280;}
  `;
  document.head.appendChild(stl);

  /* HTML */
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
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
  document.body.appendChild(wrapper);

  const win  = document.getElementById('lnch-window');
  const msgs = document.getElementById('lnch-msgs');
  const inp  = document.getElementById('lnch-input');
  const snd  = document.getElementById('lnch-send');

  /* TOGGLE */
  let welkomstKnoppen = false;
  window.__lnchToggle = () => {
    win.classList.toggle('open');
    document.getElementById('lnch-badge').style.display = 'none';
    if (win.classList.contains('open')) {
      inp.focus();
      if (!welkomstKnoppen) {
        welkomstKnoppen = true;
        setTimeout(() => toonOpties(['Huis verkopen', 'Huis kopen', 'Gratis waardebepaling']), 500);
      }
    }
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); __lnchSend(); } });
  snd.addEventListener('click', __lnchSend);

  /* HELPERS */
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

  function botZegt(tekst) {
    return new Promise(resolve => {
      const typing = voegTypingToe();
      setTimeout(() => {
        typing.remove();
        voegBerichtToe(tekst, 'bot');
        resolve();
      }, 900);
    });
  }

  /* OPTIES */
  function kiesOpties(userMsg) {
    const huidig = userMsg.toLowerCase().trim();
    const gesproken = (historie.map(h => h.content).join(' ') + ' ' + huidig).toLowerCase();

    const heeftVerkopen  = gesproken.includes('verkoop') || gesproken.includes('courtage') || huidig.includes('verkopen');
    const heeftKopen     = gesproken.includes('huis kopen') || gesproken.includes('aankoop') || huidig === 'huis kopen' || huidig.includes('kopen');
    const heeftWaardebep = gesproken.includes('waardebepaling') || huidig.includes('waardebepaling');
    const heeftTaxatie   = gesproken.includes('taxatie') || huidig.includes('taxatie');
    const heeftAfspraak  = gesproken.includes('afspraak') || huidig.includes('afspraak');

    const beschikbaar = [];
    if (!heeftVerkopen)  beschikbaar.push('Huis verkopen');
    if (!heeftKopen)     beschikbaar.push('Huis kopen');
    if (!heeftWaardebep) beschikbaar.push('Gratis waardebepaling');
    if (!heeftTaxatie)   beschikbaar.push('Taxatie aanvragen');
    if (!heeftAfspraak)  beschikbaar.push('Afspraak inplannen');
    if (beschikbaar.length === 0) return null;

    const alle = ['Huis verkopen','Huis kopen','Gratis waardebepaling','Taxatie aanvragen','Afspraak inplannen'];
    while (beschikbaar.length < 3) {
      const extra = alle.find(o => !beschikbaar.includes(o));
      if (!extra) break;
      beschikbaar.push(extra);
    }
    return beschikbaar.slice(0, 3);
  }

  function toonOpties(opties) {
    const oud = msgs.querySelector('.lnch-opties');
    if (oud) oud.remove();
    if (!opties || leadFase || leadGedaan) return;

    const cont = document.createElement('div');
    cont.className = 'lnch-opties';
    opties.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'lnch-optie-btn';
      btn.textContent = opt;
      btn.onclick = () => { cont.remove(); inp.value = opt; __lnchSend(); };
      cont.appendChild(btn);
    });
    msgs.appendChild(cont);
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* LEAD CARD */
  async function toonLeadCard() {
    if (leadGedaan) return;
    leadGedaan = true;
    const datum = new Date().toLocaleDateString('nl-NL', { day:'numeric', month:'long', year:'numeric' });

    let emailVerstuurd = false;
    try {
      const r = await fetch('https://formspree.io/f/xpqylryk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam,
          telefoon:  leadData.tel,
          interesse: leadData.interesse,
          datum,
          _subject:  `Nieuwe lead: ${naam}`
        })
      });
      emailVerstuurd = r.ok;
    } catch(e) {}

    const waTekst = encodeURIComponent(`Hoi! Ik ben ${leadData.naam} en heb interesse in: ${leadData.interesse}. Contactgegeven: ${leadData.tel}.`);
    const waUrl = `https://wa.me/${C.whatsappNummer}?text=${waTekst}`;

    const card = document.createElement('div');
    card.className = 'lnch-wa-card';
    card.innerHTML = `
      <div class="wa-card-header">
        <span class="wa-card-icon">✅</span>
        <div>
          <div class="wa-card-title">Gegevens ontvangen, ${leadData.naam}!</div>
          <div class="wa-card-sub">${emailVerstuurd ? 'We nemen zo snel mogelijk contact op' : 'Stuur ons een berichtje via WhatsApp'}</div>
        </div>
        <button class="wa-card-close" onclick="this.closest('.lnch-wa-card').remove()">✕</button>
      </div>
      <div class="lnch-wa-info">📞 ${leadData.tel} &nbsp;·&nbsp; 🏠 ${leadData.interesse}</div>
      <a class="lnch-wa-btn" href="${waUrl}" target="_blank" rel="noopener">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Direct WhatsApp-gesprek starten met Roel
      </a>
      <div class="wa-card-footer">${emailVerstuurd ? '📧 Bevestiging verstuurd · Reactie binnen 1 werkdag' : '💬 Of bel ons op 026-3274455'}</div>`;

    const invoegPunt = msgs.parentElement.querySelector('.lnch-ir') || msgs.nextElementSibling;
    if (invoegPunt) {
      invoegPunt.parentElement.insertBefore(card, invoegPunt);
    } else {
      msgs.appendChild(card);
    }
    setTimeout(() => { card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
    window.dispatchEvent(new CustomEvent('briqk-lead', { detail: { ...leadData, emailVerstuurd } }));
  }

  /* INPUT CARD — toont een invulveld in de chat */
  function toonInvoerCard({ label, placeholder, type = 'text', onSubmit, onSkip = null }) {
    // Verwijder eventuele vorige kaart
    const oud = msgs.querySelector('.lnch-invoer-card');
    if (oud) oud.remove();

    const card = document.createElement('div');
    card.className = 'lnch-invoer-card';

    const lbl = document.createElement('div');
    lbl.className = 'lnch-invoer-label';
    lbl.textContent = label;

    const field = document.createElement('input');
    field.type = type;
    field.className = 'lnch-invoer-field';
    field.placeholder = placeholder;

    const btn = document.createElement('button');
    btn.className = 'lnch-invoer-btn';
    btn.textContent = 'Bevestigen →';

    const submit = () => {
      const val = field.value.trim();
      if (!val) { field.focus(); return; }
      card.remove();
      voegBerichtToe(val, 'user');
      onSubmit(val);
    };

    btn.addEventListener('click', submit);
    field.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    card.appendChild(lbl);
    card.appendChild(field);
    card.appendChild(btn);

    if (onSkip) {
      const skip = document.createElement('button');
      skip.className = 'lnch-invoer-skip';
      skip.textContent = 'Liever niet →';
      skip.addEventListener('click', () => { card.remove(); onSkip(); });
      card.appendChild(skip);
    }

    msgs.appendChild(card);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => field.focus(), 100);
  }

  /* LEAD FLOW */
  function startLeadFlow() {
    toonInvoerCard({
      label: 'Hoe mag ik je aanspreken?',
      placeholder: 'Jouw naam',
      onSubmit: (naam) => {
        leadData.naam = naam;
        leadFase = 'tel';
        voegBerichtToe(`Fijn, ${naam}! Wat is je telefoonnummer zodat we je persoonlijk kunnen terugbellen?`, 'bot');
        setTimeout(() => {
          toonInvoerCard({
            label: 'Jouw telefoonnummer',
            placeholder: '06 12 34 56 78',
            type: 'tel',
            onSubmit: (tel) => {
              leadData.tel = tel;
              leadFase = 'klaar';
              voegBerichtToe(`Top ${naam}, ik heb alles voor je klaarstaan! 😊`, 'bot');
              setTimeout(() => toonLeadCard(), 400);
            },
            onSkip: () => {
              leadFase = 'email';
              voegBerichtToe('Geen probleem! Mag ik dan je e-mailadres?', 'bot');
              setTimeout(() => {
                toonInvoerCard({
                  label: 'Jouw e-mailadres',
                  placeholder: 'naam@email.nl',
                  type: 'email',
                  onSubmit: (email) => {
                    leadData.tel = email;
                    leadFase = 'klaar';
                    voegBerichtToe(`Top ${naam}, ik heb alles voor je klaarstaan! 😊`, 'bot');
                    setTimeout(() => toonLeadCard(), 400);
                  },
                  onSkip: () => {
                    leadFase = 'afgesloten';
                    voegBerichtToe('Dat begrijp ik. Bel ons gerust via 026-3274455 of mail naar info@roelwillemsen.nl.', 'bot');
                  }
                });
              }, 300);
            }
          });
        }, 300);
      }
    });
  }

  /* HOOFDFUNCTIE */
  async function __lnchSend() {
    const msg = inp.value.trim();
    if (!msg || busy) return;

    const oudOpties = msgs.querySelector('.lnch-opties');
    if (oudOpties) oudOpties.remove();

    voegBerichtToe(msg, 'user');
    inp.value = '';
    busy = true;
    snd.disabled = true;

    /* In lead flow: invoerkaart toont al — negeer chat input */
    if (leadFase && leadFase !== 'klaar' && leadFase !== 'afgesloten') {
      voegBerichtToe('Vul het veld hierboven in om verder te gaan.', 'bot');
      busy = false;
      snd.disabled = false;
      inp.focus();
      return;
    }

    /* Na lead flow: geen API meer */
    if (leadFase === 'klaar' || leadFase === 'afgesloten' || leadGedaan) {
      voegBerichtToe('Je kunt ons ook bereiken via 026-3274455 of info@roelwillemsen.nl.', 'bot');
      busy = false;
      snd.disabled = false;
      inp.focus();
      return;
    }

    /* Normaal: API call */
    userTeller++;
    historie.push({ role: 'user', content: msg });

    // Onthoud interesse
    const u = msg.toLowerCase();
    if (u.includes('verkoop') || u.includes('verkopen')) leadData.interesse = 'Huis verkopen';
    else if (u.includes('koop') || u.includes('aankoop')) leadData.interesse = 'Huis kopen';
    else if (u.includes('waardebepaling')) leadData.interesse = 'Gratis waardebepaling';
    else if (u.includes('taxatie')) leadData.interesse = 'Taxatie';
    else if (u.includes('afspraak')) leadData.interesse = 'Afspraak maken';

    const typing = voegTypingToe();

    try {
      const res = await fetch(C.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'system', content: C.prompt }, ...historie],
          max_tokens: 80
        })
      });

      const data = await res.json();
      typing.remove();

      let antwoord = res.ok
        ? (data.choices?.[0]?.message?.content || 'Bel ons even op 026-3274455.')
        : 'Er ging iets mis. Bel ons op 026-3274455.';

      // Verwijder eventuele tags die LLM toch meestuurt
      antwoord = antwoord.replace(/\[LEAD\|[^\]]+\]/gi, '').replace(/\[OPTIES:[^\]]+\]/gi, '').trim();

      voegBerichtToe(antwoord, 'bot');
      historie.push({ role: 'assistant', content: antwoord });

      // Na leadNa berichten → start lead flow
      if (userTeller >= C.leadNa && !leadFase && !leadGedaan) {
        leadFase = 'naam';
        setTimeout(() => {
          voegBerichtToe('Om je nog beter te helpen, mag ik je naam weten?', 'bot');
          setTimeout(() => startLeadFlow(), 400);
        }, 700);
      } else {
        setTimeout(() => toonOpties(kiesOpties(msg)), 400);
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
