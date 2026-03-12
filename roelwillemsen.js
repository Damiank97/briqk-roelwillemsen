(function () {
  const CONFIG = {
    groqKey: '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',
    bedrijfsnaam: 'Roel Willemsen Garantiemakelaars',
    kleurPrimair: '#1a5c3a',
    kleurAccent: '#f5c800',
    welkomst: 'Goedendag! Ik ben de AI-assistent van Roel Willemsen. Hoe kan ik je helpen? 🏠',
    suggesties: ['Wat kost een taxatie?', 'Hoe verkoop ik mijn huis?', 'Afspraak maken'],
    prompt: `Je bent de vriendelijke AI-assistent van Roel Willemsen Garantiemakelaars in Arnhem.

BEDRIJFSINFO:
- Adres: Ella Fitzgeraldstraat 37, 6836 DP Arnhem
- Telefoon: 026-3274455 | info@roelwillemsen.nl
- Openingstijden: maandag t/m vrijdag 09:00-17:00
- NVM Garantiemakelaar met 45+ jaar ervaring in Arnhem
- Gemiddelde klantbeoordeling: 9.2/10 op Funda
- KVK: 09084524

TEAM:
- David Franke — Vastgoedadviseur, 06-10904231
- Maurice Freijters — NVM Register Makelaar & Taxateur, 06-53162169
- Marenthe Freijters — Marketeer
- Leny Huisman — Commercieel Medewerker Binnendienst
- Loïs Freijters — Commercieel Medewerker Binnendienst

DIENSTEN & PRIJZEN:
- Huis verkopen: No Cure = No Pay, courtage bespreekbaar (~1-1,5% van verkoopprijs)
- Aankoop begeleiding: professionele begeleiding bij aankoop van een woning
- Taxatie: €350 - €600 afhankelijk van de woning, erkend taxateur
- Gratis waardebepaling: kosteloos, vrijblijvend, snel geregeld
- Bouwtechnische keuring: mogelijk in combinatie met aankoop
- Woning verduurzamen: advies over energiebesparing

VERKOOPPROCES (4 stappen):
1. Onderzoek & afspraken — wensen inventariseren, heldere afspraken, kadastrale check
2. Presentatie & prijs — professionele foto's, Funda, social media, vraagprijsbepaling
3. Bezichtiging & onderhandelen — serieuze kopers, rationele onderhandeling, digitaal klantdossier
4. Overdracht — correcte juridische afhandeling, jij blijft op de hoogte tot het einde

VEELGESTELDE VRAGEN:
- Hoe lang duurt een verkoop? Gemiddeld 4-8 weken in de regio Arnhem
- Wat is No Cure = No Pay? Je betaalt de courtage pas als de woning daadwerkelijk verkocht is
- Wat is een Garantiemakelaar? Een NVM-makelaar met gegarandeerde dienstverlening en kwaliteitsstandaarden
- Kan ik een afspraak maken? Ja, bel 026-3274455 of mail info@roelwillemsen.nl
- Werken jullie ook buiten Arnhem? Ja, ook in Velp, Arnhem-Zuid, Elst, Zevenaar en omgeving
- Wat kost een gratis waardebepaling? Niets — volledig gratis en vrijblijvend
- Hoe snel kan ik een afspraak krijgen? Meestal binnen 1-2 werkdagen
- Zijn jullie ook in het weekend bereikbaar? Nee, alleen ma-vr 09:00-17:00
- Wat is het verschil tussen taxatie en waardebepaling? Waardebepaling is gratis en indicatief. Een taxatie is officieel, door een erkend taxateur, en vereist voor hypotheek.
- Verkopen jullie ook nieuwbouw? Ja, wij begeleiden ook nieuwbouwprojecten in de regio

GEDRAGSREGELS:
- Altijd vriendelijk, professioneel en kort (max 3-4 zinnen)
- Stimuleer altijd om contact op te nemen of een afspraak te maken
- Antwoord ALLEEN in het Nederlands
- Bij twijfel: verwijs naar 026-3274455 of mail info@roelwillemsen.nl
- Nooit prijzen garanderen buiten de genoemde ranges`
  };

  // ── Styles ──────────────────────────────────────────────────────
  const P = CONFIG.kleurPrimair, A = CONFIG.kleurAccent;
  const style = document.createElement('style');
  style.textContent = `
    #lnch-toggle{position:fixed;bottom:24px;right:24px;width:60px;height:60px;background:${P};border:none;border-radius:50%;cursor:pointer;font-size:26px;box-shadow:0 6px 24px rgba(0,0,0,0.25);z-index:99999;transition:transform .2s,background .2s;display:flex;align-items:center;justify-content:center;}
    #lnch-toggle:hover{transform:scale(1.1);}
    #lnch-badge{position:absolute;top:-4px;right:-4px;background:${A};color:#0f3d26;font-size:11px;font-weight:700;width:19px;height:19px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:sans-serif;}
    #lnch-window{position:fixed;bottom:98px;right:24px;width:350px;height:500px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.18);z-index:99998;display:none;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;animation:lnchUp .25s ease;}
    @keyframes lnchUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    #lnch-window.open{display:flex;}
    .lnch-hd{background:${P};padding:14px 18px;display:flex;align-items:center;gap:12px;}
    .lnch-av{width:40px;height:40px;background:${A};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
    .lnch-ht h4{color:#fff;font-size:13px;font-weight:700;margin:0;}
    .lnch-ht p{color:rgba(255,255,255,.55);font-size:11px;margin:2px 0 0;}
    .lnch-on{width:8px;height:8px;background:#22c55e;border-radius:50%;margin-left:auto;animation:lnchP 2s infinite;}
    @keyframes lnchP{0%,100%{opacity:1}50%{opacity:.4}}
    #lnch-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f9f9f9;}
    .lmsg{max-width:83%;padding:9px 13px;border-radius:13px;font-size:13px;line-height:1.5;animation:lnchUp .25s ease;}
    .lmsg.bot{background:#fff;color:#1a1a1a;align-self:flex-start;border:1px solid #e5e7eb;border-bottom-left-radius:3px;}
    .lmsg.user{background:${P};color:#fff;align-self:flex-end;border-bottom-right-radius:3px;}
    .ltyping{display:flex;gap:5px;padding:12px 14px;background:#fff;border:1px solid #e5e7eb;border-radius:13px;border-bottom-left-radius:3px;align-self:flex-start;width:fit-content;}
    .ldot{width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:lnchB 1.4s infinite;}
    .ldot:nth-child(2){animation-delay:.2s}.ldot:nth-child(3){animation-delay:.4s}
    @keyframes lnchB{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    #lnch-sugs{padding:8px 12px;display:flex;gap:6px;flex-wrap:wrap;border-top:1px solid #f0f0f0;background:#fff;}
    .lsug{font-size:11.5px;padding:5px 11px;border:1.5px solid ${P};color:${P};border-radius:100px;cursor:pointer;background:none;font-family:inherit;transition:all .2s;white-space:nowrap;}
    .lsug:hover{background:${P};color:#fff;}
    .lnch-ir{padding:10px 12px;display:flex;gap:8px;border-top:1px solid #e5e7eb;background:#fff;}
    #lnch-input{flex:1;border:1.5px solid #e5e7eb;border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;resize:none;background:#fafafa;transition:border-color .2s;}
    #lnch-input:focus{border-color:${P};background:#fff;}
    #lnch-send{width:38px;height:38px;background:${P};border:none;border-radius:9px;cursor:pointer;color:#fff;font-size:15px;flex-shrink:0;display:flex;align-items:center;justify-content:center;align-self:flex-end;transition:background .2s;}
    #lnch-send:hover{filter:brightness(1.15);}
    #lnch-send:disabled{opacity:.4;cursor:not-allowed;}
    .lnch-ft{text-align:center;padding:6px;font-size:10px;color:#ccc;background:#fff;border-top:1px solid #f5f5f5;}
    .lnch-ft a{color:#ccc;text-decoration:none;}
    @media(max-width:400px){#lnch-window{width:calc(100vw - 32px);right:16px;}}
  `;
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button id="lnch-toggle" onclick="window.__lnchToggle()">💬<span id="lnch-badge">1</span></button>
    <div id="lnch-window">
      <div class="lnch-hd">
        <div class="lnch-av">🏠</div>
        <div class="lnch-ht"><h4>${CONFIG.bedrijfsnaam}</h4><p>Altijd bereikbaar · Antwoord in seconden</p></div>
        <div class="lnch-on"></div>
      </div>
      <div id="lnch-msgs"><div class="lmsg bot">${CONFIG.welkomst}</div></div>
      <div id="lnch-sugs">${CONFIG.suggesties.map(s => `<button class="lsug" onclick="window.__lnchQ('${s}')">${s}</button>`).join('')}</div>
      <div class="lnch-ir">
        <textarea id="lnch-input" placeholder="Stel je vraag..." rows="1"></textarea>
        <button id="lnch-send">➤</button>
      </div>
      <div class="lnch-ft">Mogelijk gemaakt door <a href="https://launchly.nl" target="_blank">Launchly.nl</a></div>
    </div>`;
  document.body.appendChild(wrap);

  // ── Logica ────────────────────────────────────────────────────
  const win = document.getElementById('lnch-window');
  const msgs = document.getElementById('lnch-msgs');
  const input = document.getElementById('lnch-input');
  const send = document.getElementById('lnch-send');
  const sugs = document.getElementById('lnch-sugs');
  let busy = false;

  window.__lnchToggle = () => {
    win.classList.toggle('open');
    document.getElementById('lnch-badge').style.display = 'none';
    if (win.classList.contains('open')) input.focus();
  };
  window.__lnchQ = (t) => { sugs.style.display = 'none'; input.value = t; __lnchSend(); };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); __lnchSend(); } });
  send.addEventListener('click', __lnchSend);

  function addMsg(t, r) {
    const d = document.createElement('div');
    d.className = 'lmsg ' + r;
    d.textContent = t;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addTyping() {
    const d = document.createElement('div');
    d.className = 'ltyping';
    d.innerHTML = '<div class="ldot"></div><div class="ldot"></div><div class="ldot"></div>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  async function __lnchSend() {
    const msg = input.value.trim();
    if (!msg || busy) return;
    addMsg(msg, 'user'); input.value = '';
    busy = true; send.disabled = true;
    const t = addTyping();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.groqKey },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', max_tokens: 250, temperature: 0.7,
          messages: [{ role: 'system', content: CONFIG.prompt }, { role: 'user', content: msg }]
        })
      });
      const data = await res.json();
      t.remove();
      addMsg(res.ok ? (data.choices?.[0]?.message?.content || 'Bel ons: 026-3274455') : 'Bel ons op 026-3274455', 'bot');
    } catch (e) { t.remove(); addMsg('Bel ons gerust op 026-3274455', 'bot'); }
    busy = false; send.disabled = false; input.focus();
  }

  window.__lnchSend = __lnchSend;
})();
