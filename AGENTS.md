# AGENTS.md — Diretrizes e Registro de Ações (WebGIS Avança Chapada)

Este documento registra a arquitetura, regras de negócio e histórico de alterações do **WebGIS Avança Chapada Bahia** para orientar e manter a consistência entre diferentes agentes de IA (Antigravity/Gemini, Claude Code, Cursor, Codex).

> **Espelho de Registro:**
> - Google Drive: `G:\Meu Drive\CIMATEC\SERVIÇO\Avança Chapada\webgis\` (`AGENTS.md` e `agents/2026-11-10_ativacao_territorio_e_indicadores.md`)
> - Repositório do WebGIS: `Vetor/webgis-avanca-chapada/AGENTS.md` e `Vetor/webgis-avanca-chapada/agents/`

---

## 1. Localização dos Arquivos do Projeto

- **Diretório Principal do WebGIS:**
  `c:\Users\fabiano.sandes\OneDrive - Sistema FIEB\SERVIÇOS\[ABDI] Avança Chapada - Documentos\General\04. Documentação Técnica\MACROENTREGA 02 - Diagnóstico\00. ENTREGÁVEL\Banco de Dados Georreferenciado\Vetor\webgis-avanca-chapada`
- **URL Pública (GitHub Pages):**
  `https://geotecama.github.io/webgis_avanca_chapada/`
- **Repositório Git:**
  `https://github.com/GeotecAMA/webgis_avanca_chapada.git` (branch `main`)
- **Script de Publicação:**
  `publicar_github.bat` (na raiz de `webgis-avanca-chapada`)
- **Servidor Local de Desenvolvimento (`.claude/launch.json`):**
  `http://127.0.0.1:8765`

> **Atenção Técnica (Windows / OneDrive):**
> O caminho no OneDrive contém colchetes (`[ABDI]`) e ultrapassa 260 caracteres (`MAX_PATH`).
> - No PowerShell, comandos como `Get-ChildItem -Path` interpretam `[ABDI]` como wildcard e `InitializeDefaultDrives` falha no diretório inicial. Utilize `cmd /c` ou `-LiteralPath`.
> - No Git, mantenha sempre `git config core.longpaths true`.

---

## 2. Arquitetura do WebGIS

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura HTML principal, barra superior, painel lateral esquerdo (`#panel`), barra de ferramentas (`#toolbar`) e importação dos scripts com cache-busting (`?v=YYYYMMDDHHMMSS`). |
| `assets/app.js` | Inicialização do mapa Leaflet, criação dos panes (`mask`, `context`, `polygon`, `line`, `outline`, `point`), leitura de `data/camadas.json`, controle de camadas, busca Nominatim e enquadramento (`fitView`). |
| `assets/indicadores.js` | Painel lateral direito (`#ind`) e camada coroplética municipal (`pane: "indicadores"`) alimentados por `indicadores/residuos_biogas.json` (projeções 2025–2055). |
| `assets/relatorio.js` | Geração sob demanda do Relatório de Vocação Territorial em PDF (`jsPDF` + `autoTable`) a partir de `data/perfil_municipios.json`. |
| `assets/style.css` | Estilos da plataforma, responsividade (`@media (max-width: 860px)`) e posicionamento dos painéis laterais. |
| `conteudo.js` | Textos institucionais, glossário e contatos (preservado nas sincronizações do QGIS). |
| `data/camadas.json` | Manifesto de tópicos, camadas, simbologia e visibilidade exportado do projeto `AvançaChapada.qgz`. |

---

## 3. Regras Invariantes de Comportamento (Obrigatórias para IAs)

1. **Ativação Inicial Apenas do Território (Como na Foto de Referência):**
   - Ao abrir o WebGIS, o contorno verde e a máscara externa do *Território de Identidade Chapada Diamantina* (`drawTerritory`) e o limite estadual da Bahia (`drawContext`) aparecem fixos sobre o mapa base *Google Satélite*, centralizados na área útil do mapa.
   - No painel esquerdo (**Camadas**), **todos os tópicos e camadas devem iniciar desmarcados (`on: false`) e recolhidos**, sem selos (`1/3`) nem traço indeterminado (`[-]`), e todas as camadas de `data/camadas.json` permanecem com `"visible": false`.

2. **Mapa Centralizado no Território:**
   - A função `fitView(bounds, maxZoom)` desconta os painéis laterais abertos no desktop (`#panel` à esquerda e `#ind` à direita, caso esteja aberto) e usa padding vertical simétrico (`24px` no topo e `24px` na base, pois `.topbar` fica fora de `.stage`).
   - Na inicialização (`init()`), `drawContext` é aguardado (`await`) **antes** de `drawTerritory` e do `fitView(territoryBounds)` final, garantindo que `map.setMaxBounds` e `map.setMinZoom` não desloquem o centro após o enquadramento.

3. **Quadro de Indicadores Visível No Momento em que Clicar na Camada:**
   - O painel de indicadores (`#ind`) e sua camada coroplética municipal (`camada`) em `assets/indicadores.js` **devem iniciar ocultos** (`abre(false, false)` ao final de `inicia()`).
   - Eles abrem imediatamente quando o usuário:
     - Clica/marca a camada `potencial-de-biogas-residuos-solidos-urbanos-2025` (*Potencial de biogás – resíduos sólidos urbanos (2025)*) ou `arranjos-produtivos-e-potencial-de-biogas` (*Arranjos produtivos e potencial de biogás*) no painel de camadas (via evento `avanca:camada` disparado em `setLayer`); ou
     - Clica no botão **Indicadores** (`#tInd`) na barra de ferramentas.
   - Ao fechar no botão `×` (`.ind-x`), desmarcar a camada, clicar novamente em `#tInd` ou clicar em **Desligar todas** (`#clearAll`), tanto o painel `#ind` quanto a camada coroplética são ocultados (`abre(false)`) e o checkbox da camada é sincronizado.

---

## 4. Registro de Ações

### [2026-11-10] Ativação exclusiva do território, centralização e ocultação inicial dos indicadores
- **Diagnóstico:**
  1. `assets/indicadores.js` executava `abre(window.matchMedia("(min-width: 861px)").matches)` na inicialização, abrindo automaticamente o painel direito (`390px`) no computador, marcando o botão `#tInd` e pintando os 24 municípios sobre o mapa logo na abertura.
  2. `fitView()` em `assets/app.js` usava `paddingTopLeft: [side, 70]` e `paddingBottomRight: [20, 20]`, ignorando o painel `#ind` à direita e aplicando deslocamento vertical assimétrico (`70px` vs `20px`), além de executar concorrentemente com `drawContext()` sem `await`.
  3. A camada `territorio-de-identidade-chapada-diamantina` aparecia desmarcada (`on: false`) na árvore de camadas mesmo com o contorno desenhado no mapa, enquanto outras camadas estavam com `"visible": true` em `data/camadas.json`.
- **Alterações realizadas (Commit `36cb2d4`):**
  - `assets/app.js`:
    - Atualizado `fitView()` para considerar `#panel` (esquerda) e `#ind` (direita, quando visível) com margem vertical simétrica (`24px`).
    - Vinculado o `L.layerGroup([mask, outline])` de `drawTerritory()` ao item `territorio-de-identidade-chapada-diamantina` no `state` com `st.on = true` e `syncRow(st)`.
    - Ordenado `init()` com `await drawContext(...)` seguido de `await drawTerritory(...)` e `fitView(territoryBounds)`, exportando `fitView` e `getTerritoryBounds` em `window.AVANCA`.
  - `assets/indicadores.js`:
    - Alterado `inicia()` para chamar `abre(false)` (painel e camada coroplética iniciam fechados/desmarcados).
    - Adicionados listeners para abrir/fechar ao alternar a camada `potencial-de-biogas-residuos-solidos-urbanos-2025` em `#topics` e para fechar ao clicar em `#clearAll`.
    - Ajustado `abre(on)` para usar `map.invalidateSize({ pan: false })` e reenquadrar `territoryBounds` quando nenhuma feição específica estiver selecionada.
  - `data/camadas.json`:
    - Definido `"visible": true` apenas em `territorio-de-identidade-chapada-diamantina` e `"visible": false` nas demais camadas.
  - `index.html`:
    - Atualizado parâmetro de versão `?v=20261110095200` para invalidação de cache.

