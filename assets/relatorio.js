/* Relatório de vocação em PDF — Plataforma Avança Chapada Bahia.
 * Lê data/perfil_municipios.json (gerado pelo plugin do QGIS: quanto de cada camada existe em cada município)
 * e monta, para um município ou conjunto de municípios, o retrato da vocação: síntese + indicadores por tópico.
 * Bibliotecas (carregadas só ao gerar): jsPDF e jsPDF-AutoTable, via cdnjs. */
(() => {
  "use strict";

  const LIBS = [
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
  ];
  const SOMA_ROTULO = { pot_mw: "Potência outorgada (MW)" };
  const VERDE = [29, 94, 39], VERDE2 = [45, 122, 49], CINZA = [93, 106, 120], TINTA = [29, 39, 51];
  const FAIXA = [[246, 196, 49], [242, 154, 31], [45, 122, 49], [140, 198, 63], [29, 94, 39]];

  const $ = (s, el = document) => el.querySelector(s);
  const N = (v, d = 0) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: d });
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dataBR = iso => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");

  let perfil = null;

  function loadScript(src) {
    return new Promise((ok, err) => {
      if ([...document.scripts].some(s => s.src === src)) return ok();
      const el = document.createElement("script");
      el.src = src; el.onload = ok; el.onerror = () => err(new Error("Falha ao carregar " + src));
      document.head.appendChild(el);
    });
  }

  async function getPerfil() {
    if (!perfil) {
      const r = await fetch(`data/perfil_municipios.json?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("perfil_municipios.json: " + r.status);
      perfil = await r.json();
    }
    return perfil;
  }

  // ------------------------------------------------------------------ agregação
  function agregar(P, cods) {
    const out = { area: 0, camadas: {} };
    const set = new Set(cods);
    for (const m of P.municipios) if (set.has(m.cod)) out.area += m.area_km2;
    for (const cod of cods) {
      for (const [id, rec] of Object.entries(P.stats[cod] || {})) {
        const a = (out.camadas[id] ||= { v: 0, classes: {}, somas: {} });
        a.v += rec.v;
        for (const [k, v] of Object.entries(rec.classes || {})) a.classes[k] = (a.classes[k] || 0) + v;
        for (const [campo, d] of Object.entries(rec.somas || {})) {
          const s = (a.somas[campo] ||= {});
          for (const [k, v] of Object.entries(d)) s[k] = (s[k] || 0) + v;
        }
      }
    }
    return out;
  }

  const valor = (geom, v) => geom === "point" ? N(v) : geom === "line" ? `${N(v, 1)} km` : `${N(v, 1)} km²`;
  const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);

  // ------------------------------------------------------------------ síntese ("reflexo da vocação")
  function sintese(P, sel, tudo, cods) {
    const linhas = [];
    const parcial = cods.length < P.municipios.length;
    const partArea = pct(sel.area, tudo.area);
    linhas.push(parcial
      ? `Área de ${N(sel.area)} km², ${N(partArea, 1)}% do território (${N(tudo.area)} km²).`
      : `Território completo: ${N(tudo.area)} km² em ${P.municipios.length} municípios.`);

    // 1. arranjos produtivos / biogás (quando houver dado lançado)
    const apl = aplResumo(P, cods);
    linhas.push(apl.temDado ? apl.frase : "Arranjos produtivos e potencial de biogás: dados em modelagem. Esta parte do retrato será preenchida quando os valores forem lançados na plataforma.");

    // 2. destaques: o que o recorte concentra acima da sua participação em área
    if (parcial) {
      const cand = [];
      for (const c of P.camadas) {
        const s = sel.camadas[c.id], t = tudo.camadas[c.id];
        if (!s || !t || !(t.v > 0)) continue;
        const cheio = c.geom === "polygon" && pct(t.v, tudo.area) > 90;      // cobre quase tudo: não é destaque
        if (!cheio) cand.push({ nome: c.name, geom: c.geom, s: s.v, t: t.v });
        for (const [k, v] of Object.entries(s.classes)) {
          if (!/opera/i.test(k) || !(t.classes[k] > 0)) continue;
          cand.push({ nome: `${c.name} – ${k.toLowerCase()}`, geom: c.geom, s: v, t: t.classes[k], forte: true });
        }
      }
      cand.forEach(x => { x.part = pct(x.s, x.t); x.lq = x.part / Math.max(partArea, 0.01); });
      const vistos = new Set();
      const top = cand.filter(x => x.lq >= 1.25 && x.s > 0 && (x.geom !== "point" || x.t >= 3))   // ponto único no território não é destaque
        .sort((a, b) => (b.forte ? 1 : 0) - (a.forte ? 1 : 0) || b.lq - a.lq)
        .filter(x => { const k = x.nome.split(" – ")[0]; if (vistos.has(k)) return false; vistos.add(k); return true; })
        .slice(0, 6);
      if (top.length) {
        linhas.push("Concentra, acima da sua participação em área:");
        top.forEach(x => linhas.push(`   • ${x.nome}: ${valor(x.geom, x.s)} de ${valor(x.geom, x.t)} no território (${N(x.part)}%).`));
      }
    }

    // 3. predominâncias e coberturas (camadas de área)
    const pred = [], cob = [];
    for (const c of P.camadas) {
      if (c.geom !== "polygon") continue;
      const s = sel.camadas[c.id];
      if (!s) continue;
      const cobertura = pct(s.v, sel.area);
      const classes = Object.entries(s.classes).sort((a, b) => b[1] - a[1]);
      if (classes.length && cobertura >= 60) {
        const [k, v] = classes[0];
        pred.push(`   • ${c.name}: ${classes.length > 1 ? "predomina " : ""}${k} (${N(pct(v, s.v))}% da área mapeada).`);
      } else if (cobertura >= 0.5 && cobertura < 60) {
        cob.push(`   • ${c.name}: ${N(s.v, 1)} km² (${N(cobertura, 1)}% da área).`);
      }
    }
    if (pred.length) { linhas.push("Características predominantes:"); linhas.push(...pred); }
    if (cob.length) { linhas.push("Áreas especiais:"); linhas.push(...cob); }
    return linhas;
  }

  function aplResumo(P, cods) {
    const A = P.apl;
    const res = { temDado: false, frase: "", linhas: [] };
    if (!A) return res;
    const itens = cods.map(c => A.dados[c] || {});
    for (const campo of A.campos) {
      const vals = itens.map(d => d[campo.k]).filter(v => v !== undefined && v !== null && v !== "");
      if (!vals.length) continue;
      const nums = vals.map(v => Number(String(v).replace(",", "."))).filter(v => Number.isFinite(v));
      if (campo.k === "status") {
        const cont = {}; vals.forEach(v => (cont[v] = (cont[v] || 0) + 1));
        res.linhas.push([campo.label, Object.entries(cont).map(([k, n]) => `${k} (${n})`).join("; ")]);
        if (vals.some(v => !/aguardando/i.test(v))) res.temDado = true;
      } else if (nums.length === vals.length) {
        res.linhas.push([campo.label, N(nums.reduce((a, b) => a + b, 0), 1)]); res.temDado = true;
      } else {
        const uni = [...new Set(vals.map(String))];
        res.linhas.push([campo.label, uni.slice(0, 5).join("; ") + (uni.length > 5 ? "…" : "")]); res.temDado = true;
      }
    }
    if (res.temDado) {
      const pick = k => (res.linhas.find(l => l[0] === (A.campos.find(c => c.k === k) || {}).label) || [])[1];
      const partes = [];
      if (pick("apl_principal")) partes.push(`arranjo produtivo principal: ${pick("apl_principal")}`);
      if (pick("residuo_principal")) partes.push(`principal resíduo para biogás: ${pick("residuo_principal")}`);
      if (pick("biogas_total")) partes.push(`potencial de biogás de ${pick("biogas_total")} Nm³/ano`);
      if (pick("energia_mwh_ano")) partes.push(`equivalente a ${pick("energia_mwh_ano")} MWh/ano`);
      res.frase = "Vocação produtiva: " + (partes.join("; ") || "ver tabela de arranjos produtivos") + ".";
    }
    return res;
  }

  // ------------------------------------------------------------------ mapa de localização (canvas -> imagem)
  async function mapaLocalizacao(P, cods) {
    const M = window.AVANCA.manifest;
    const def = M.topics.flatMap(t => t.layers).find(l => l.id === P.layerMunicipios);
    if (!def) return null;
    const gj = await (await fetch(`${def.file}?v=${encodeURIComponent(M.generated || "")}`)).json();
    let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
    const aneis = f => { const g = f.geometry; return !g ? [] : g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates.flat() : []; };
    gj.features.forEach(f => aneis(f).forEach(r => r.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); })));
    const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
    const H = 760, pad = 18, esc_ = (H - 2 * pad) / (y1 - y0), Wd = Math.round((x1 - x0) * k * esc_ + 2 * pad);
    const cv = document.createElement("canvas"); cv.width = Wd; cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, Wd, H);
    const px = ([x, y]) => [pad + (x - x0) * k * esc_, pad + (y1 - y) * esc_];
    const set = new Set(cods);
    const desenha = (f, fill, stroke, lw) => {
      g.beginPath();
      aneis(f).forEach(r => { r.forEach((c, i) => { const [a, b] = px(c); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.closePath(); });
      g.fillStyle = fill; g.fill("evenodd"); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke();
    };
    const sel = gj.features.filter(f => set.has(String(f.properties[P.campoCodigo])));
    gj.features.filter(f => !sel.includes(f)).forEach(f => desenha(f, "#eef1f4", "#aab3bd", 1.5));
    sel.forEach(f => desenha(f, "rgba(45,122,49,.75)", "#1d5e27", 3));
    if (sel.length <= 8) {
      g.font = "600 22px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 6; g.strokeStyle = "#ffffff"; g.fillStyle = "#12331a";
      sel.forEach(f => {
        let a = 0, b = 0, n = 0; aneis(f)[0].forEach(c => { const [u, v] = px(c); a += u; b += v; n++; });
        const nome = String(f.properties[P.campoNome]); g.strokeText(nome, a / n, b / n); g.fillText(nome, a / n, b / n);
      });
    }
    return { url: cv.toDataURL("image/jpeg", 0.9), w: Wd, h: H };   // JPEG: PDF de ~100 KB em vez de 3 MB
  }

  // ------------------------------------------------------------------ PDF
  async function gerar(cods) {
    const A = window.AVANCA;
    A.showStatus("Gerando relatório…");
    try {
      const P = await getPerfil();
      for (const u of LIBS) await loadScript(u);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210, Hp = 297, M = 14, L = W - 2 * M;
      const nomes = P.municipios.filter(m => cods.includes(m.cod)).map(m => m.nome);
      const todos = cods.length === P.municipios.length;
      const sel = agregar(P, cods), tudo = agregar(P, P.municipios.map(m => m.cod));
      const titulo = (A.conteudo && A.conteudo.titulo) || P.title || "Plataforma";
      const recorte = todos ? "Território completo" : nomes.length === 1 ? nomes[0] : `Conjunto de ${nomes.length} municípios`;

      // cabeçalho
      doc.setFillColor(...VERDE); doc.rect(0, 0, W, 22, "F");
      FAIXA.forEach((c, i) => { doc.setFillColor(...c); doc.rect((W / 5) * i, 22, W / 5, 1.6, "F"); });
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(titulo, M, 10);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("Retrato da vocação territorial", M, 16.5);
      doc.setFontSize(8.5); doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, W - M, 16.5, { align: "right" });

      let y = 34;
      doc.setTextColor(...VERDE); doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text(recorte, M, y); y += 6;
      if (!todos && nomes.length > 1) {
        doc.setTextColor(...CINZA); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const t = doc.splitTextToSize(nomes.join(", "), L); doc.text(t, M, y); y += t.length * 4 + 1;
      }
      y += 2;

      // mapa + quadro de fatos
      const topo = y;
      const mapa = await mapaLocalizacao(P, cods).catch(() => null);
      let hMapa = 0;
      if (mapa) {
        const wm = 62; hMapa = wm * mapa.h / mapa.w;
        if (hMapa > 84) { hMapa = 84; }
        const wReal = hMapa * mapa.w / mapa.h;
        doc.addImage(mapa.url, "JPEG", M, y, wReal, hMapa);
        doc.setDrawColor(226, 230, 235); doc.rect(M, y, wReal, hMapa);
      }
      const xf = M + 72;
      const fatos = [
        ["Municípios no recorte", `${N(cods.length)} de ${N(P.municipios.length)}`],
        ["Área", `${N(sel.area)} km²`],
        ["Participação no território", `${N(pct(sel.area, tudo.area), 1)}%`],
        ["Dados da plataforma", dataBR(P.generated)],
      ];
      fatos.forEach(([k, v], i) => {
        const yy = topo + 5 + i * 14;
        doc.setTextColor(...CINZA); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(k.toUpperCase(), xf, yy);
        doc.setTextColor(...TINTA); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(v, xf, yy + 5.8);
      });
      y = topo + Math.max(hMapa, fatos.length * 14 + 2) + 8;

      const quebra = h => { if (y + h > Hp - 18) { doc.addPage(); y = 18; } };
      const secao = t => {
        quebra(14); doc.setTextColor(...VERDE); doc.setFont("helvetica", "bold"); doc.setFontSize(12.5); doc.text(t, M, y);
        doc.setDrawColor(...VERDE); doc.setLineWidth(0.4); doc.line(M, y + 1.6, W - M, y + 1.6); y += 7;
      };

      // síntese
      secao("Síntese da vocação");
      doc.setFontSize(9.5);
      for (const linha of sintese(P, sel, tudo, cods)) {
        const sub = linha.startsWith("   ");
        const t = doc.splitTextToSize(linha.trim(), L - (sub ? 6 : 0));
        quebra(t.length * 4.4 + 1);
        doc.setTextColor(...TINTA); doc.setFont("helvetica", sub ? "normal" : "bold");
        if (!sub && !/:$/.test(linha)) doc.setFont("helvetica", "normal");
        doc.text(t, M + (sub ? 6 : 0), y); y += t.length * 4.4 + 1.2;
      }
      y += 3;

      // arranjos produtivos (tabela), se houver dado
      const apl = aplResumo(P, cods);
      if (P.apl) {
        secao("Arranjos produtivos e potencial de biogás");
        doc.autoTable({
          startY: y, margin: { left: M, right: M }, theme: "grid",
          head: [["Indicador", "No recorte"]], body: apl.linhas.length ? apl.linhas : [["Situação do dado", "Aguardando modelagem"]],
          styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.6, textColor: TINTA, lineColor: [226, 230, 235] },
          headStyles: { fillColor: VERDE2, textColor: 255 }, columnStyles: { 0: { cellWidth: 78 } },
        });
        y = doc.lastAutoTable.finalY + 7;
      }

      // indicadores por tópico
      secao("Indicadores por tema");
      const topicos = [...new Set(P.camadas.map(c => c.topic))];
      for (const topico of topicos) {
        const body = [], subs = new Set();
        for (const c of P.camadas.filter(x => x.topic === topico)) {
          const s = sel.camadas[c.id], t = tudo.camadas[c.id];
          if (!s || !(s.v > 0)) continue;
          const extra = c.geom === "polygon" ? ` (${N(pct(s.v, sel.area), 1)}% da área)` : "";
          body.push([(c.sub ? c.sub + " · " : "") + c.name, valor(c.geom, s.v) + extra, todos ? "—" : `${N(pct(s.v, t.v))}%`]);
          const ordem = Object.entries(s.classes).sort((a, b) => b[1] - a[1]).slice(0, 8);
          if (ordem.length > 1 || (ordem.length === 1 && c.classes.length > 1)) {
            for (const [k, v] of ordem) { subs.add(body.length); body.push([`      ${k}`, valor(c.geom, v), todos ? "—" : `${N(pct(v, t.classes[k] || 0))}%`]); }
          }
          for (const [campo, d] of Object.entries(s.somas)) {
            const rot = SOMA_ROTULO[campo] || campo;
            for (const [k, v] of Object.entries(d)) {
              if (!(v > 0)) continue;
              const tt = ((t.somas[campo] || {})[k]) || 0;
              subs.add(body.length);
              body.push([`      ${rot}${k === "_total" ? " – total" : " – " + k.toLowerCase()}`, N(v, 1), todos ? "—" : `${N(pct(v, tt))}%`]);
            }
          }
        }
        if (!body.length) continue;
        quebra(22);
        doc.autoTable({
          startY: y, margin: { left: M, right: M, bottom: 18 }, theme: "grid",
          head: [[topico, "No recorte", "% do território"]], body,
          styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5, textColor: TINTA, lineColor: [226, 230, 235], overflow: "linebreak" },
          headStyles: { fillColor: VERDE, textColor: 255 },
          columnStyles: { 1: { halign: "right", cellWidth: 56 }, 2: { halign: "right", cellWidth: 26 } },
          didParseCell: d => { if (d.section === "body" && subs.has(d.row.index)) { d.cell.styles.textColor = CINZA; d.cell.styles.fontSize = 8; } },
        });
        y = doc.lastAutoTable.finalY + 6;
      }

      // nota metodológica
      quebra(26);
      doc.setTextColor(...CINZA); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      const nota = "Como ler: os valores são a quantidade (pontos), a extensão (linhas, km) ou a área (polígonos, km²) de cada camada da plataforma dentro dos limites municipais do recorte. " +
        "“% do território” compara o recorte com o total dos " + N(P.municipios.length) + " municípios. Camadas de área podem se sobrepor (por exemplo, unidades de conservação), e a soma pode superar a área do município. " +
        "Usinas “planejadas” incluem pedidos de outorga sem garantia de implantação. Relatório informativo, gerado automaticamente a partir das bases oficiais reunidas na plataforma; consulte a fonte de cada camada para fins legais.";
      const tn = doc.splitTextToSize(nota, L); doc.text(tn, M, y);

      // rodapé em todas as páginas
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i); doc.setDrawColor(226, 230, 235); doc.setLineWidth(0.2); doc.line(M, Hp - 12, W - M, Hp - 12);
        doc.setTextColor(...CINZA); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
        doc.text(`${titulo} · ${location.origin}${location.pathname}`, M, Hp - 8);
        doc.text(`${i} / ${total}`, W - M, Hp - 8, { align: "right" });
      }
      doc.save(`vocacao_${slug(todos ? "territorio-completo" : nomes.length === 1 ? nomes[0] : nomes.length + "-municipios")}.pdf`);
      A.showStatus("Relatório gerado.", 3000);
    } catch (e) {
      console.error(e);
      A.showStatus("Não foi possível gerar o relatório.", 5000);
    }
  }

  // ------------------------------------------------------------------ janela de seleção
  async function abrir() {
    const A = window.AVANCA;
    if (!A) return;
    let P;
    try { P = await getPerfil(); } catch (e) { console.error(e); return A.showStatus("Relatório indisponível: perfil municipal não publicado.", 5000); }
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rvTit">
        <header>
          <h2 id="rvTit">Relatório de vocação (PDF)</h2>
          <p>Escolha um município ou um conjunto de municípios. O relatório resume o que a plataforma registra nesse recorte: energia, logística, água, ambiente, resíduos, clima e arranjos produtivos.</p>
        </header>
        <div class="body">
          <div class="tools">
            <input type="search" id="rvBusca" placeholder="Filtrar municípios…" aria-label="Filtrar municípios">
            <button type="button" id="rvTodos">Selecionar todos</button>
            <button type="button" id="rvLimpar">Limpar</button>
          </div>
          <div class="mun-grid" id="rvLista">
            ${P.municipios.map(m => `<label data-n="${esc(m.nome.toLowerCase())}"><span class="chk"><input type="checkbox" value="${esc(m.cod)}"><span class="box"></span></span>${esc(m.nome)}<small>${N(m.area_km2)} km²</small></label>`).join("")}
          </div>
        </div>
        <footer>
          <span class="count" id="rvCont">Nenhum município selecionado</span>
          <button type="button" id="rvFechar">Cancelar</button>
          <button type="button" class="go" id="rvGerar" disabled>Gerar PDF</button>
        </footer>
      </div>`;
    document.body.appendChild(back);
    const boxes = () => [...back.querySelectorAll("#rvLista input")];
    const marcados = () => boxes().filter(b => b.checked).map(b => b.value);
    const sync = () => {
      const n = marcados().length;
      $("#rvCont", back).textContent = n === 0 ? "Nenhum município selecionado" : n === 1 ? "1 município selecionado" : `${n} municípios selecionados`;
      $("#rvGerar", back).disabled = n === 0;
    };
    const fechar = () => { back.remove(); document.removeEventListener("keydown", tecla); };
    const tecla = e => { if (e.key === "Escape") fechar(); };
    document.addEventListener("keydown", tecla);
    back.addEventListener("click", e => { if (e.target === back) fechar(); });
    $("#rvFechar", back).addEventListener("click", fechar);
    $("#rvLista", back).addEventListener("change", sync);
    $("#rvTodos", back).addEventListener("click", () => { back.querySelectorAll("#rvLista label:not([hidden]) input").forEach(b => (b.checked = true)); sync(); });
    $("#rvLimpar", back).addEventListener("click", () => { boxes().forEach(b => (b.checked = false)); sync(); });
    $("#rvBusca", back).addEventListener("input", e => {
      const v = e.target.value.toLowerCase();
      back.querySelectorAll("#rvLista label").forEach(l => (l.hidden = !l.dataset.n.includes(v)));
    });
    $("#rvGerar", back).addEventListener("click", () => { const c = marcados(); fechar(); gerar(c); });
    $("#rvBusca", back).focus();
  }

  document.addEventListener("click", e => { if (e.target.closest("#btnReport, #tReport")) abrir(); });
  window.AVANCA_RELATORIO = { abrir, gerar };   // para testes
})();
