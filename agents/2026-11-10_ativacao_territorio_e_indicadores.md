# Registro de Ação — 2026-11-10

## Solicitação do Usuário
> "verifique o wegis e deixe ativação apenas do território e centralizado. O indicadores deve ser vistos apenas quando for ativado"
> "Foram feitas alteração e preciso que seja registradas as mudanças para atender ao aprendizado de outras IA . Diante disso, salve 'G:\Meu Drive\CIMATEC\SERVIÇO\Avança Chapada\webgis' para registro de ações como estavamos fazendo na paste agents."

## Causa-Raiz Identificada
1. **Indicadores abrindo selecionados no desktop:** Em `assets/indicadores.js` (linha 188), a função `inicia()` chamava `abre(window.matchMedia("(min-width: 861px)").matches)`. Isso exibia automaticamente o painel lateral direito (`#ind`), deixava o botão `#tInd` marcado e adicionava a camada coroplética de municípios (`camada`) sobre o mapa ao abrir a página no computador.
2. **Descentralização do território:**
   - `fitView()` em `assets/app.js` aplicava `paddingTopLeft: [side, 70]` e `paddingBottomRight: [20, 20]`, deslocando o centro para a direita (para baixo do painel de indicadores) e para baixo.
   - `drawTerritory()` e `drawContext()` rodavam em paralelo sem `await`; quando `drawContext()` terminava depois, `map.setMaxBounds()` alterava o enquadramento.
3. **Estado de ativação da camada do território:**
   - Em `assets/app.js`, todas as camadas iniciavam com `on: false` na lista lateral, inclusive `territorio-de-identidade-chapada-diamantina`, e o contorno verde de `drawTerritory()` não estava associado ao estado do checkbox da camada.
   - Em `data/camadas.json`, `"territorio-de-identidade-chapada-diamantina"` estava com `"visible": false`, enquanto `"municipios-ibge-2023"`, `"rodovias-federais-seinfra"`, `"lixoes-vazadouros-a-ceu-aberto"` e `"unidades-de-conservacao"` estavam com `"visible": true`.

## Arquivos Modificados (Commit `36cb2d4`)
1. `Vetor/webgis-avanca-chapada/assets/app.js`
2. `Vetor/webgis-avanca-chapada/assets/indicadores.js`
3. `Vetor/webgis-avanca-chapada/data/camadas.json`
4. `Vetor/webgis-avanca-chapada/index.html`

## Como Publicar no GitHub Pages
Caso o envio automático pelo agente esteja bloqueado por permissão de rede/credencial do terminal, basta executar o script `publicar_github.bat` na pasta `Vetor/webgis-avanca-chapada` (ou `git push origin main` em um terminal autenticado).

## Lições Aprendidas para Outras IAs
- Nunca abrir painéis secundários (`#ind`) ou camadas temáticas automaticamente na inicialização sem que o usuário ative.
- Sempre aguardar (`await`) a configuração de `maxBounds`/`minZoom` (`drawContext`) antes de executar `fitBounds` (`drawTerritory`).
- Manter sincronizado o estado visual do mapa (`drawTerritory`) com o checkbox correspondente na árvore de camadas (`state.get(manifest.boundary)`).

