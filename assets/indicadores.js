/* Painel de indicadores à direita do mapa (estilo MapBiomas): linha do tempo, indicador, totais do território,
 * mapa coroplético dos municípios e tabela ordenável ligada ao mapa.
 * Dados: indicadores/residuos_biogas.json, gerado por scripts/indicadores_residuos_biogas.py a partir da planilha
 * de projeção. CSV só aparece com "download_publico": true no JSON (padrão: oculto, fica com a administração).
 * A pasta indicadores/ não é tocada pela sincronização do QGIS. Sem o arquivo, o painel não aparece. */
(() => {
  "use strict";
  const ARQ = "indicadores/residuos_biogas.json";
  const CORES = ["#fff3d6", "#fdd49e", "#fc8d59", "#d7301f", "#7f0000"];   // sequencial 5 classes
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtN = (v, casas) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const chave = s => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  let D = null, A = null, ano, ind, ordem = { col: "valor", desc: true }, sel = null, colorir = true;
  let camada = null, porChave = new Map();

  const painel = document.createElement("aside");
  painel.className = "ind"; painel.id = "ind"; painel.hidden = true;
  painel.setAttribute("aria-label", "Indicadores");

  function idx(id) { return D.indicadores.findIndex(i => i.id === id); }
  function valor(m, id = ind) { return m.valores[String(ano)][idx(id)]; }
  function total(id = ind) { return D.ti[String(ano)][idx(id)]; }
  function def(id = ind) { return D.indicadores[idx(id)]; }
  function somavel(id = ind) { return def(id).soma !== false; }

  // ---------------------------------------------------------------- classes (quebras naturais simples: quantis)
  function quebras() {
    const v = D.municipios.map(m => valor(m)).sort((a, b) => a - b);
    const q = [0.2, 0.4, 0.6, 0.8].map(p => v[Math.min(v.length - 1, Math.floor(p * v.length))]);
    return [...new Set(q)];
  }
  function cor(v, br) { let i = 0; while (i < br.length && v >= br[i]) i++; return CORES[Math.min(i, CORES.length - 1)]; }

  // ---------------------------------------------------------------- render
  function render() {
    const d = def(), br = quebras(), lista = [...D.municipios];
    const maxV = Math.max(...lista.map(m => valor(m)));
    const t = total();
    lista.sort((a, b) => {
      const va = ordem.col === "nome" ? a.nome : valor(a), vb = ordem.col === "nome" ? b.nome : valor(b);
      const r = ordem.col === "nome" ? va.localeCompare(vb, "pt-BR") : va - vb;
      return ordem.desc ? -r : r;
    });
    const kpi = (id, rot) => { const k = def(id); return `<div class="ind-kpi${id === ind ? " on" : ""}" data-ind="${k.id}"><span>${esc(rot)}</span><strong>${fmtN(total(id), Math.min(k.casas, 1))}</strong><small>${esc(k.unidade)}</small></div>`; };
    const grupos = [...new Set(D.indicadores.map(i => i.grupo))];
    const seta = c => ordem.col === c ? (ordem.desc ? " ▾" : " ▴") : "";

    $(".ind-body", painel).innerHTML = `
      <div class="ind-ctrl">
        <label class="ind-lbl" for="indAno">Ano <b id="indAnoTxt">${ano}</b></label>
        <input type="range" id="indAno" min="${D.anos[0]}" max="${D.anos[D.anos.length - 1]}" step="1" value="${ano}">
        <div class="ind-anos">${D.anos_destaque.map(a => `<button type="button" data-ano="${a}" class="${a === ano ? "on" : ""}">${a}</button>`).join("")}</div>
        <label class="ind-lbl" for="indSel">Indicador</label>
        <select id="indSel">${grupos.map(g => `<optgroup label="${esc(g)}">${D.indicadores.filter(i => i.grupo === g).map(i => `<option value="${i.id}"${i.id === ind ? " selected" : ""}>${esc(i.nome)} (${esc(i.unidade)})</option>`).join("")}</optgroup>`).join("")}</select>
        ${d.nota ? `<p class="ind-nota">${esc(d.nota)}</p>` : ""}
      </div>
      <div class="ind-kpis">${kpi("rsd", "RSD")}${kpi("forsu", "Orgânico")}${kpi("biogas", "Biogás")}${kpi("energia", "Energia")}</div>
      <div class="ind-map">
        <label class="ind-chk"><input type="checkbox" id="indColorir"${colorir ? " checked" : ""}> Colorir municípios no mapa</label>
        <div class="ind-leg">${CORES.map((c, i) => `<span><i style="background:${c}"></i>${i === 0 ? "&lt; " + fmtN(br[0] ?? 0, d.casas) : i >= br.length ? "≥ " + fmtN(br[br.length - 1], d.casas) : fmtN(br[i - 1], d.casas) + " – " + fmtN(br[i], d.casas)}</span>`).slice(0, br.length + 1).join("")}</div>
      </div>
      <div class="ind-tab-wrap">
        <table class="ind-tab">
          <thead><tr><th class="n">#</th><th data-ord="nome">Município${seta("nome")}</th><th data-ord="valor" class="v">${esc(d.unidade)}${seta("valor")}</th>${somavel() ? `<th class="p">% TI</th>` : ""}</tr></thead>
          <tbody>${lista.map((m, i) => {
            const v = valor(m);
            return `<tr data-k="${esc(m.chave)}" class="${sel === m.chave ? "sel" : ""}"><td class="n">${i + 1}</td><td>${esc(m.nome)}</td>
              <td class="v"><span class="bar" style="width:${maxV ? (100 * v / maxV).toFixed(1) : 0}%;background:${cor(v, br)}"></span><b>${fmtN(v, d.casas)}</b></td>
              ${somavel() ? `<td class="p">${t ? fmtN(100 * v / t, 1) : "–"}</td>` : ""}</tr>`;
          }).join("")}</tbody>
          <tfoot><tr><td></td><td>Território (${D.municipios.length})</td><td class="v"><b>${fmtN(t, d.casas)}</b></td>${somavel() ? "<td class=\"p\">100</td>" : ""}</tr></tfoot>
        </table>
      </div>
      <details class="ind-met"><summary>Premissas, fontes e ressalvas</summary>
        <table>${D.premissas.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>
        <ul>${D.fontes.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
        <ul class="ress">${D.ressalvas.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
      </details>
      ${D.download_publico === true ? `<button type="button" class="ind-csv" id="indCsv">Baixar tabela de ${ano} (CSV)</button>` : ""}`;
    pinta(br);
  }

  // ---------------------------------------------------------------- mapa
  function pinta(br = quebras()) {
    if (!camada) return;
    camada.eachLayer(l => {
      const m = porChave.get(l._k);
      if (!m) return;
      const s = sel === l._k;
      l.setStyle(colorir
        ? { fillColor: cor(valor(m), br), fillOpacity: .78, color: s ? "#1d2733" : "#ffffff", weight: s ? 3 : 1, opacity: 1 }
        : { fillOpacity: 0, color: s ? "#1d2733" : "transparent", weight: s ? 3 : 0 });
      if (s) l.bringToFront();
    });
    if (!map.hasLayer(camada) && !painel.hidden) camada.addTo(map);
  }
  function popup(m) {
    const linhas = D.indicadores.map(i => `<tr><th>${esc(i.nome)}</th><td>${fmtN(valor(m, i.id), i.casas)} ${esc(i.unidade)}</td></tr>`).join("");
    return `<div class="pop"><h3>${esc(m.nome)} · ${ano}</h3><div class="scroll"><table>${linhas}</table></div>
      <p class="more">${esc(D.situacao)}. Gravimetria: ${esc(m.fonte_gravimetria)}.</p></div>`;
  }
  function seleciona(k, zoom) {
    sel = sel === k && !zoom ? null : k;
    render();
    const tr = painel.querySelector(`tr[data-k="${CSS.escape(k)}"]`);
    if (tr) tr.scrollIntoView({ block: "nearest" });
    if (zoom && camada) camada.eachLayer(l => { if (l._k === k) { map.fitBounds(l.getBounds(), { padding: [40, 40], maxZoom: 11 }); l.openPopup(); } });
  }
  async function carregaMunicipios() {
    const r = await fetch(`${D.camada_municipios}?v=${encodeURIComponent(A.manifest.generated || "")}`);
    const gj = await r.json();
    if (!map.getPane("indicadores")) map.createPane("indicadores").style.zIndex = 405;
    camada = L.geoJSON(gj, {
      pane: "indicadores", renderer: L.canvas({ pane: "indicadores", tolerance: 2 }),
      style: { weight: 1, color: "#fff", fillOpacity: 0 },
      onEachFeature: (f, l) => {
        l._k = chave(f.properties[D.campo_nome]);
        l.bindPopup(() => { const m = porChave.get(l._k); return m ? popup(m) : esc(f.properties[D.campo_nome]); }, { maxWidth: 380 });
        l.on("click", () => { sel = l._k; render(); const tr = painel.querySelector(`tr[data-k="${CSS.escape(l._k)}"]`); if (tr) tr.scrollIntoView({ block: "nearest" }); });
      },
    });
    const semDado = [];
    camada.eachLayer(l => { if (!porChave.has(l._k)) semDado.push(l._k); });
    if (semDado.length) console.warn("Municípios sem indicador:", semDado);
  }

  function csv() {
    const cab = ["municipio", "ano", ...D.indicadores.map(i => `${i.id} (${i.unidade})`)];
    const lin = D.municipios.map(m => [m.nome, ano, ...m.valores[String(ano)].map(v => String(v).replace(".", ","))]);
    const txt = "﻿" + [cab, ...lin].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
    a.download = `indicadores_residuos_biogas_${ano}.csv`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function abre(on) {
    painel.hidden = !on;
    document.body.classList.toggle("ind-aberto", on);
    $("#tInd")?.classList.toggle("on", on);
    if (camada) { if (on) { camada.addTo(map); pinta(); } else map.removeLayer(camada); }
    setTimeout(() => {
      map.invalidateSize({ pan: false });
      const b = A?.getTerritoryBounds?.();
      if (b && b.isValid() && !sel) A.fitView(b);
    }, 0);
  }

  // ---------------------------------------------------------------- eventos
  painel.addEventListener("input", e => {
    if (e.target.id === "indAno") { ano = +e.target.value; render(); }
  });
  painel.addEventListener("change", e => {
    if (e.target.id === "indSel") { ind = e.target.value; render(); }
    if (e.target.id === "indColorir") { colorir = e.target.checked; pinta(); }
  });
  painel.addEventListener("click", e => {
    const b = e.target.closest("[data-ano]"); if (b) { ano = +b.dataset.ano; render(); return; }
    const k = e.target.closest(".ind-kpi"); if (k) { ind = k.dataset.ind; render(); return; }
    const th = e.target.closest("th[data-ord]");
    if (th) { const c = th.dataset.ord; ordem = { col: c, desc: ordem.col === c ? !ordem.desc : c !== "nome" }; render(); return; }
    const tr = e.target.closest("tbody tr[data-k]"); if (tr) { seleciona(tr.dataset.k, true); return; }
    if (e.target.closest("#indCsv")) csv();
    if (e.target.closest(".ind-x")) abre(false);
  });

  let map;
  async function inicia() {
    A = window.AVANCA; map = A.map;
    try {
      const r = await fetch(`${ARQ}?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) return;              // sem indicadores publicados: nada aparece
      D = await r.json();
    } catch { return; }
    ano = D.ano_padrao || D.anos[0]; ind = D.indicador_padrao || D.indicadores[0].id;
    D.municipios.forEach(m => porChave.set(m.chave, m));
    painel.innerHTML = `<header class="ind-head"><div><small>Indicadores · ${esc(D.situacao)}</small><h2>${esc(D.titulo)}</h2><p>${esc(D.subtitulo)}</p></div>
      <button type="button" class="ind-x" title="Fechar indicadores" aria-label="Fechar indicadores">×</button></header><div class="ind-body"></div>`;
    $(".stage").appendChild(painel);
    const tb = $("#toolbar");
    if (tb && !$("#tInd")) {
      const b = document.createElement("button");
      b.id = "tInd"; b.title = "Indicadores (tabela à direita)"; b.setAttribute("aria-label", "Indicadores");
      b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
      b.addEventListener("click", () => abre(painel.hidden));
      tb.appendChild(b);
    }
    try { await carregaMunicipios(); } catch (e) { console.error(e); }
    render();
    abre(false);   // indicadores visíveis apenas quando ativados pelo usuário
    $("#topics")?.addEventListener("change", e => {
      if (e.target.dataset.id === "potencial-de-biogas-residuos-solidos-urbanos-2025") abre(e.target.checked);
    });
    $("#clearAll")?.addEventListener("click", () => abre(false));
  }
  if (window.AVANCA) inicia(); else document.addEventListener("avanca:pronto", inicia, { once: true });
})();
