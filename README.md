# Plataforma Avança Chapada Bahia

Mapa interativo com as bases georreferenciadas do Território de Identidade Chapada Diamantina (BA), organizadas por tópico.

🔗 https://geotecama.github.io/webgis_avanca_chapada/

## Tópicos

| Tópico | Camadas |
|---|---|
| Divisão político-administrativa | Território de Identidade, municípios (IBGE 2023), setores censitários (IBGE 2022) |
| Infraestrutura logística | Rodovias federais (SEINFRA), aeródromos públicos e privados, helipontos (ANAC) |
| Recursos hídricos | Hidrografia (ANA/SNIRH BHO 2017), microrregiões e bacias hidrográficas |
| Geologia e hidrogeologia | Domínios hidrogeológicos |

## Como atualizar

Tudo sai do projeto `AvançaChapada.qgz`:

- **Tópicos** = grupos do painel de camadas do QGIS. Arraste uma camada para um grupo para mudá-la de tópico; crie um grupo para criar um tópico.
- **Nome, estilo, visibilidade inicial e ordem** das camadas vêm do QGIS (símbolo único, categorizado ou graduado).
- **Apelidos de campos** (Propriedades da camada > Campos > Alias) aparecem nos popups.
- **Textos** (glossário, perguntas, contato, rodapé) ficam em `conteudo.js`, que a sincronização não sobrescreve.

Depois, no QGIS: **Web > Sincronizar WebGIS GitHub > Sincronizar WebGIS → GitHub** (ou o botão na barra de ferramentas).

## Estrutura

```
index.html          página (gerada pelo plugin)
assets/             app.js, style.css, logo.svg (gerados pelo plugin)
conteudo.js         textos editáveis
data/camadas.json   tópicos, camadas e estilos
data/*.geojson      dados (WGS 84, 6 casas decimais), também usados no botão de download
```
