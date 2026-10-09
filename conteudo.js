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
    { nome: "ABDI", url: "https://www.abdi.com.br", logo: "" }
  ],
  execucao: [
    { nome: "SENAI CIMATEC", url: "https://www.senaicimatec.com.br", logo: "" }
  ],

  contato: {
    texto: "Dúvidas, sugestões ou correções nos dados? Fale com a equipe do projeto.",
    email: "",          // ex.: "contato@exemplo.org" — em branco, o campo não aparece
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
    { termo: "Sistema de referência", definicao: "Os dados são publicados em coordenadas geográficas (latitude e longitude) WGS 84, EPSG:4326." }
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
