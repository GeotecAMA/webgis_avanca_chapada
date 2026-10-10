/*
 * Textos da Plataforma Avança Chapada Bahia.
 * Este arquivo é seu: edite à vontade. A sincronização do QGIS NÃO o sobrescreve
 * (só cria se não existir). Camadas, tópicos e estilos vêm do projeto QGIS.
 */
window.CONTEUDO = {
  titulo: "Plataforma Avança Chapada Bahia",
  descricao: "Dados georreferenciados do Território de Identidade Chapada Diamantina, Bahia, reunidos por tema para apoiar o diagnóstico e o planejamento do território.",

  // Rodapé. "logo" é opcional: caminho de imagem dentro da pasta do site (ex.: "assets/abdi.png").
  realizacao: [
    { nome: "Sistema FIEB", url: "https://www.fieb.org.br", logo: "" },
    { nome: "IEL", url: "", logo: "" },
    { nome: "ABDI", url: "https://www.abdi.com.br", logo: "" }
  ],
  execucao: [
    { nome: "SENAI CIMATEC", url: "https://www.senaicimatec.com.br", logo: "" }
  ],

  contato: {
    texto: "Dúvidas, sugestões ou correções nos dados? Fale com a área de Meio Ambiente do SENAI CIMATEC.",
    area: "Meio Ambiente",
    instituicao: "SENAI CIMATEC",
    url: "https://senaicimatec.com.br/fale-conosco/",
    email: "",          // opcional, ex.: "contato@exemplo.org" — em branco, o campo não aparece
    responsavel: "Equipe técnica Avança Chapada"
  },

  glossario: [
    { termo: "Território de Identidade", definicao: "Unidade de planejamento de políticas públicas do Governo da Bahia que agrupa municípios com características sociais, culturais, econômicas e geográficas em comum. O estado é dividido em 27 Territórios de Identidade." },
    { termo: "Chapada Diamantina", definicao: "Território de Identidade formado por 24 municípios no centro da Bahia, marcado por serras, chapadas e nascentes de importantes rios do estado." },
    { termo: "Setor censitário", definicao: "Menor unidade territorial usada pelo IBGE para a coleta do Censo Demográfico, com limites identificáveis em campo e classificação como urbana ou rural." },
    { termo: "Rodovia federal", definicao: "Rodovia sob jurisdição da União, identificada pelo prefixo BR seguido de um número." },
    { termo: "Aeródromo", definicao: "Área destinada a pouso, decolagem e movimentação de aeronaves. Os públicos são abertos ao uso público; os privados têm uso restrito ao proprietário ou a quem ele autorizar, sem exploração comercial." },
    { termo: "Heliponto", definicao: "Aeródromo destinado exclusivamente a helicópteros." },
    { termo: "Bacia hidrográfica", definicao: "Área em que a água da chuva escoa para um mesmo rio principal e seus afluentes, delimitada pelos divisores de água." },
    { termo: "Microrregião hidrográfica", definicao: "Subdivisão de uma região hidrográfica usada no planejamento de recursos hídricos." },
    { termo: "BHO (Base Hidrográfica Ottocodificada)", definicao: "Base da Agência Nacional de Águas (ANA) com a rede de drenagem e as bacias codificadas pelo método de Otto Pfafstetter, o que permite saber o que está a montante e a jusante de cada trecho." },
    { termo: "Domínio hidrogeológico", definicao: "Agrupamento de unidades geológicas com comportamento semelhante quanto ao armazenamento e à circulação de água subterrânea, como cristalino, carbonatos ou formações porosas (classificação do Serviço Geológico do Brasil)." },
    { termo: "GeoJSON", definicao: "Formato aberto de dados geográficos. É o formato de download das camadas da plataforma e abre diretamente no QGIS e em outros SIGs." },
    { termo: "Sistema de referência", definicao: "Os dados são publicados em coordenadas geográficas (latitude e longitude) WGS 84, EPSG:4326." },
    { termo: "Unidade de conservação (UC)", definicao: "Área protegida instituída pelo poder público, com limites definidos e regras de uso, regida pelo SNUC (Lei nº 9.985/2000). Divide-se em Proteção Integral e Uso Sustentável." },
    { termo: "Proteção Integral", definicao: "Grupo de unidades de conservação em que só se admite o uso indireto dos recursos naturais, como Parques, Monumentos Naturais e Refúgios de Vida Silvestre." },
    { termo: "Uso Sustentável", definicao: "Grupo de unidades de conservação que concilia a conservação com o uso sustentável de parte dos recursos, como Áreas de Proteção Ambiental (APA), Áreas de Relevante Interesse Ecológico (ARIE) e RPPN." },
    { termo: "APA (Área de Proteção Ambiental)", definicao: "Unidade de conservação de uso sustentável, em geral extensa, com ocupação humana, criada para proteger a biodiversidade e disciplinar a ocupação do território." },
    { termo: "RPPN (Reserva Particular do Patrimônio Natural)", definicao: "Unidade de conservação criada em área privada, por iniciativa do proprietário, com caráter perpétuo." },
    { termo: "CNUC", definicao: "Cadastro Nacional de Unidades de Conservação, mantido pelo Ministério do Meio Ambiente, com as UCs federais, estaduais e municipais do país." },
    { termo: "Cobertura vegetal", definicao: "Mapeamento dos tipos de vegetação e das áreas antropizadas de uma região. Na plataforma há duas versões: INEMA 2019 (1:50.000) e IBGE (1:250.000)." },
    { termo: "Bioma", definicao: "Conjunto de vegetação, clima e relevo semelhantes em escala regional. Pelo mapa do IBGE (1:250.000), todo o Território Chapada Diamantina está no bioma Caatinga." },
    { termo: "Caatinga", definicao: "Vegetação típica do semiárido nordestino, adaptada à seca, com plantas que perdem as folhas no período seco. Na nomenclatura do IBGE corresponde à Savana-Estépica." },
    { termo: "Cerrado", definicao: "Vegetação de savana do Brasil central, com árvores tortuosas e estrato herbáceo. Na nomenclatura do IBGE corresponde à Savana." },
    { termo: "Savana-Estépica", definicao: "Termo do IBGE para a vegetação de Caatinga, subdividida em Florestada, Arborizada, Arbustiva (ou Parque) e Gramíneo-Lenhosa." },
    { termo: "Campo rupestre", definicao: "Vegetação de altitude sobre afloramentos rochosos, em geral quartzíticos, rica em espécies que só ocorrem ali. É marcante nas serras da Chapada Diamantina." },
    { termo: "Refúgio vegetacional", definicao: "Termo do IBGE para vegetação que difere do contexto ao redor, em geral em altitudes elevadas, como os campos rupestres das serras." },
    { termo: "Contato (ecótono)", definicao: "Área de transição entre duas ou mais regiões fitoecológicas, onde as floras se misturam, como Savana/Floresta Estacional." },
    { termo: "Semiárido", definicao: "Região delimitada pela SUDENE com base em três critérios: precipitação média anual de até 800 mm, índice de aridez de até 0,50 e déficit hídrico diário em pelo menos 60% dos dias. A delimitação de 2021 cobre todo o território." },
    { termo: "Áreas Suscetíveis à Desertificação (ASD)", definicao: "Regiões de clima semiárido e subúmido seco, e seu entorno, sujeitas à degradação das terras por fatores climáticos e atividades humanas, conforme o Programa de Ação Nacional de Combate à Desertificação (PAN-Brasil)." },
    { termo: "Desertificação", definicao: "Degradação das terras em zonas áridas, semiáridas e subúmidas secas, resultante de variações climáticas e de atividades humanas." },
    { termo: "Isoieta", definicao: "Linha que une pontos com o mesmo valor de precipitação, como as curvas de nível ligam pontos de mesma altitude. Na plataforma, de 500 a 1.000 mm por ano." },
    { termo: "Precipitação média anual", definicao: "Volume médio de chuva acumulado em um ano, em milímetros, calculado sobre uma série longa. As isoietas da plataforma usam a série 1977 a 2006 do Atlas Pluviométrico do SGB." },
    { termo: "Temperatura máxima média anual", definicao: "Média, ao longo do ano, das temperaturas máximas diárias. Na plataforma vem do WorldClim 2.1 (1970 a 2000), em faixas de 1 °C." },
    { termo: "WorldClim", definicao: "Base global de dados climáticos interpolados a partir de estações meteorológicas, muito usada em estudos ambientais. Não é dado oficial brasileiro; a referência oficial são as normais climatológicas do INMET." },
    { termo: "Setor de risco", definicao: "Área delimitada em campo pelo Serviço Geológico do Brasil onde há possibilidade de dano a moradias e pessoas por processos como inundação, enxurrada ou deslizamento, classificada em risco médio, alto ou muito alto." },
    { termo: "Suscetibilidade a inundação", definicao: "Predisposição do terreno a ser atingido por inundações, avaliada pelo relevo e pela posição em relação aos rios. O SGB ainda não publicou cartas para os municípios do território." },
    { termo: "Inundação", definicao: "Transbordamento das águas de um rio para as áreas marginais, normalmente planas, de forma gradual." },
    { termo: "Enxurrada", definicao: "Escoamento superficial rápido e com grande energia, provocado por chuvas intensas, capaz de arrastar materiais e causar danos." },
    { termo: "Terreno sujeito a inundação", definicao: "Área plana junto a rios e lagoas que fica periodicamente alagada, mapeada pela SEI-BA na escala 1:100.000." },
    { termo: "Lixão (vazadouro a céu aberto)", definicao: "Local de disposição de resíduos sobre o solo sem nenhum controle ambiental. A Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010) proíbe essa forma de disposição." },
    { termo: "Resíduos sólidos urbanos", definicao: "Resíduos domiciliares e de limpeza urbana, como varrição e limpeza de ruas, sob responsabilidade do município." },
    { termo: "Curso d'água", definicao: "Rio, riacho ou córrego. Na plataforma vem da Base Cartográfica 1:250.000 do IBGE (2025), com nome e regime (permanente ou temporário) de cada trecho." },
    { termo: "SIN (Sistema Interligado Nacional)", definicao: "Sistema de produção e transmissão de energia elétrica que interliga quase todo o Brasil, permitindo transferir energia entre regiões. É coordenado pelo ONS." },
    { termo: "ONS (Operador Nacional do Sistema Elétrico)", definicao: "Entidade responsável por coordenar e controlar a operação da geração e da transmissão de energia no SIN. A base SINDAT/SINMaps do ONS é a fonte da rede de energia da plataforma." },
    { termo: "Linha de transmissão", definicao: "Linha de alta tensão que transporta energia das usinas às subestações e aos centros de consumo. Nas linhas do ONS, o traçado é esquemático (trechos retos entre subestações) e a cor indica a tensão: 500 kV em vermelho e 230 kV em verde; tracejada quando planejada." },
    { termo: "Subestação", definicao: "Instalação que eleva ou rebaixa a tensão e conecta linhas, usinas e redes de distribuição. As subestações coletoras reúnem a energia de parques eólicos e solares para injetá-la no SIN." },
    { termo: "Tensão (kV)", definicao: "Diferença de potencial elétrico de uma linha, em quilovolts. Quanto maior a tensão, maior a capacidade de transportar energia a longas distâncias." },
    { termo: "Rede Básica", definicao: "Conjunto das instalações de transmissão do SIN com tensão igual ou superior a 230 kV." },
    { termo: "Instalação planejada", definicao: "Linha ou subestação ainda sem data de entrada em operação na base do ONS; aparece tracejada (linhas) ou com círculo branco (subestações)." },
    { termo: "ANEEL (Agência Nacional de Energia Elétrica)", definicao: "Agência que regula e fiscaliza a geração, a transmissão e a distribuição de energia no Brasil. O sistema SIGEL/SIGA da ANEEL é a fonte das usinas, aerogeradores e parques eólicos da plataforma." },
    { termo: "Central geradora eólica (EOL)", definicao: "Usina que gera energia a partir do vento, formada por um conjunto de aerogeradores. Na plataforma, cada ponto é uma central outorgada pela ANEEL, com potência e fase." },
    { termo: "Aerogerador", definicao: "Turbina eólica: torre com rotor de pás que converte a força do vento em energia elétrica. A plataforma mostra a posição de cada um, com altura da torre e diâmetro do rotor." },
    { termo: "Parque eólico", definicao: "Área ocupada por uma central eólica, delimitada no projeto apresentado à ANEEL. Um complexo eólico reúne vários parques vizinhos." },
    { termo: "Central geradora solar fotovoltaica (UFV)", definicao: "Usina que converte a luz do sol diretamente em eletricidade por meio de painéis fotovoltaicos." },
    { termo: "CGH e PCH", definicao: "Centrais hidrelétricas de pequeno porte: a Central Geradora Hidrelétrica (CGH) tem até 5 MW e a Pequena Central Hidrelétrica (PCH), de 5 a 30 MW." },
    { termo: "Potência outorgada (MW)", definicao: "Potência máxima que a usina está autorizada a instalar, em megawatts, conforme o ato de outorga da ANEEL." },
    { termo: "Outorga", definicao: "Ato da ANEEL que autoriza a implantação e a exploração de uma usina. Outorgas revogadas não aparecem na plataforma." },
    { termo: "DRO (Despacho de Requerimento de Outorga)", definicao: "Registro, pela ANEEL, do pedido de outorga de uma usina. Indica intenção de construir, não garantia: muitas usinas com DRO nunca saem do papel. Na plataforma aparecem como planejadas." },
    { termo: "Eixo inventariado", definicao: "Local de um rio identificado em estudo de inventário como aproveitável para geração hidrelétrica, ainda sem usina." },
    { termo: "Linha de conexão", definicao: "Linha que liga uma usina ou parque eólico à subestação do sistema de transmissão. As da plataforma vêm dos projetos básicos enviados à ANEEL e têm o traçado real." },
    { termo: "Arranjo Produtivo Local (APL)", definicao: "Conjunto de produtores, empresas e instituições de um mesmo território que atuam em uma cadeia produtiva e mantêm vínculos de cooperação. Na plataforma, indica a vocação produtiva de cada município." },
    { termo: "Vocação do município", definicao: "Conjunto de características que orientam o potencial de desenvolvimento de um município: atividades produtivas, recursos naturais, infraestrutura e restrições. O relatório em PDF da plataforma resume esse retrato a partir das camadas disponíveis." },
    { termo: "Biogás", definicao: "Gás combustível, rico em metano, produzido pela decomposição de matéria orgânica na ausência de oxigênio (resíduos agrícolas, dejetos animais, fração orgânica do lixo, esgoto)." },
    { termo: "Biometano", definicao: "Biogás purificado, com teor de metano semelhante ao do gás natural, que pode ser usado como combustível veicular ou injetado em gasodutos." },
    { termo: "FORSU", definicao: "Fração Orgânica dos Resíduos Sólidos Urbanos: restos de alimentos e outros materiais orgânicos do lixo domiciliar, aproveitáveis para a produção de biogás." },
    { termo: "Nm³ (normal metro cúbico)", definicao: "Volume de gás medido em condições padrão de temperatura e pressão. É a unidade usada para expressar o potencial de biogás e de biometano." },
    { termo: "Relatório de vocação", definicao: "Documento em PDF gerado pela plataforma para um município ou conjunto de municípios. Traz o retrato do recorte por tema (o que a plataforma registra, o que não registra e a situação do dado), as oportunidades que os dados sustentam, a síntese de prioridades e os dados pendentes. É um diagnóstico para priorizar ações, não um estudo de viabilidade." },
    { termo: "Oportunidade (no relatório de vocação)", definicao: "Possibilidade de ação indicada pelos dados do recorte, descrita em ficha com evidência, beneficiários, condições, riscos, próximo passo e indicador. Divide-se em potencial local e investimento externo. A existência de uma camada, sozinha, não confirma uma oportunidade." },
    { termo: "Potencial local", definicao: "Oportunidade que se apoia em recursos, atividades, organizações ou competências já presentes no recorte e gera benefício local." },
    { termo: "Investimento externo", definicao: "Oportunidade que depende de capital, tecnologia, infraestrutura, mercado ou parceiros de fora do recorte." },
    { termo: "Nível de evidência", definicao: "Grau de sustentação de uma oportunidade no relatório de vocação. A validar: há apenas indício geográfico ou de contexto. Preliminar: há dado quantitativo oficial ou do projeto ligado ao tema, ainda não validado. Confirmado: dado validado e registrado pela equipe, com fonte e data." },
    { termo: "IVS (Índice de Vulnerabilidade Social)", definicao: "Índice do Ipea que varia de 0 a 1; quanto maior, maior a vulnerabilidade social. É a média de três dimensões: infraestrutura urbana, capital humano, e renda e trabalho. Faixas: muito baixa (até 0,200), baixa (até 0,300), média (até 0,400), alta (até 0,500) e muito alta (acima de 0,500). Os valores municipais disponíveis são do Censo 2010; o Ipea prepara a atualização com o Censo 2022." },
    { termo: "Conjunto elétrico", definicao: "Conjunto de unidades consumidoras: subdivisão da área de uma distribuidora de energia, definida pela ANEEL, para a qual se apuram os indicadores de continuidade. Um conjunto pode cobrir vários municípios ou apenas parte de um." },
    { termo: "DEC (Duração Equivalente de Interrupção por Unidade Consumidora)", definicao: "Número médio de horas em que cada consumidor de um conjunto elétrico ficou sem energia no período. Na plataforma, é a soma dos valores mensais de 2025 publicados pela ANEEL." },
    { termo: "FEC (Frequência Equivalente de Interrupção por Unidade Consumidora)", definicao: "Número médio de interrupções de energia sofridas por cada consumidor de um conjunto elétrico no período." },
    { termo: "Limite de DEC e FEC", definicao: "Valor máximo anual de DEC e de FEC que a ANEEL estabelece para cada conjunto elétrico. Acima dele, a distribuidora descumpre o padrão de continuidade do fornecimento." },
    { termo: "BDGD (Base de Dados Geográfica da Distribuidora)", definicao: "Base que cada distribuidora de energia envia anualmente à ANEEL com a representação geográfica da sua rede e dos seus conjuntos elétricos. A plataforma usa os conjuntos da Neoenergia Coelba com data-base de 31/12/2025." },
    { termo: "Nova Indústria Brasil (NIB)", definicao: "Política industrial do Governo Federal organizada em missões, como cadeias agroindustriais (Missão 1), infraestrutura, saneamento, moradia e mobilidade (Missão 3) e bioeconomia, descarbonização e transição energética (Missão 5). No relatório de vocação, é citada como exemplo de política pública com aderência temática a uma oportunidade, sem representar garantia de apoio." },
  ],

  perguntas: [
    { pergunta: "O que é a Plataforma Avança Chapada Bahia?", resposta: "Um mapa interativo que reúne, por tema, as bases geográficas usadas no diagnóstico do Território de Identidade Chapada Diamantina." },
    { pergunta: "Como ligo e desligo as camadas?", resposta: "No painel à esquerda, abra um tópico pela seta e marque as camadas que quer ver. A caixa ao lado do nome do tópico liga ou desliga todas as camadas dele de uma vez." },
    { pergunta: "Como vejo as informações de um elemento do mapa?", resposta: "Clique sobre ele com a camada ligada. Uma janela mostra os atributos." },
    { pergunta: "Posso baixar os dados?", resposta: "Sim. Passe o mouse sobre uma camada e clique no ícone de download para baixar o arquivo GeoJSON." },
    { pergunta: "De onde vêm os dados?", resposta: "Cada camada indica a fonte no nome (IBGE, ANAC, ANA/SNIRH, SEINFRA, Serviço Geológico do Brasil, entre outras)." },
    { pergunta: "Como busco uma coordenada?", resposta: "Digite latitude e longitude em graus decimais, separadas por vírgula, na caixa de busca. Exemplo: -12.56, -41.39." },
    { pergunta: "Com que frequência a plataforma é atualizada?", resposta: "Sempre que o projeto-base é atualizado. A data da última atualização aparece no rodapé." },
    { pergunta: "Os limites mostrados têm valor legal?", resposta: "Não. A plataforma tem caráter informativo. Para fins legais, consulte o órgão responsável por cada base." }
  ]
};
