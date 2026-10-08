# WebGIS Avança Chapada

Mapa interativo do território do projeto Avança Chapada (ABDI / SENAI CIMATEC), exportado do QGIS (`AvançaChapada.qgz`) com o qgis2web/Leaflet.

🔗 https://geotecama.github.io/webgis_avanca_chapada/

## Camadas

| Camada | Tipo | Visível ao abrir |
|---|---|---|
| Setores censitários 2022 | polígono | sim |
| Rodovias federais (SEINFRA) | linha | sim |
| Regiões / áreas de uso e cobertura | polígono | não |
| Hidrografia SNIRH BHO 2017 | linha | não |
| Helipontos privados (ANAC) | ponto | não |
| Aeródromos privados (ANAC) | ponto | não |
| Aeródromos públicos (ANAC) | ponto | não |
| Bacias hidrográficas (micro) | polígono | não |
| Municípios BA 2023 | polígono | não |
| Limite do território | polígono | não |
| Domínios | polígono | não |
| Mapas de fundo: OSM e Google Satellite | raster | OSM |

As duas camadas "Curso d'água 1:100.000 (SEI)" estão vazias no projeto e ficaram de fora.

## Ferramentas

Lista de camadas expandida, medição métrica, busca de endereço (Nominatim), geolocalização e popups com atributos.

## Atualizar

1. Edite o projeto no QGIS e reexporte para esta pasta (qgis2web, Leaflet, sobrescrevendo `index.html`, `data/`, etc.).
2. Execute `publicar_github.bat`.
