// Textos para os códigos de erro da ponte (frontend-integration.md §4.5).
const MENSAGENS: Record<string, string> = {
  "ocupado-autenticando": "Aguarde: autenticação em andamento.",
  "ocupado-aquecendo-ccm": "Aguarde: preparando a sessão do ALM.",
  "falha-interna": "O script encontrou um erro nesta ação. Veja o log do ContÁgil.",
  "ocupado-varredura": "Aguarde: a varredura ainda está em andamento.",
  "nao-autenticado": "Autentique-se no ALM antes de consultar relatos.",
  "demanda-desconhecida": "Demanda não encontrada.",
  "demanda-invalida": "Informe um nome para a demanda, com letras ou números.",
  "demanda-duplicada": "Já existe uma demanda com esse nome.",
  "exportacao-falhou": "Não foi possível gravar a exportação na pasta Downloads. Nada foi gravado pela metade.",
  "relato-desconhecido": "Esse relato não está mais na lista.",
  "relato-ausente": "Esse relato não está mais na lista.",
  "texto-longo":
    "Texto acima do limite: anotações até 2000 caracteres, tester até 120, nome da demanda até 80 e descrição até 500.",
  "id-invalido": "Número ALM inválido.",
  "nao-encontrado": "Relato não encontrado no ALM. Ele não entrou na lista.",
  "sessao-caiu": "A sessão do ALM expirou. Autentique-se de novo.",
  "json-falhou": "Não foi possível gravar o arquivo JSON local.",
  "acao-desconhecida": "Ação não reconhecida pelo script.",
  "navegador-indisponivel": "Não foi possível abrir o navegador do sistema.",
  "atalho-sem-launcher": "Não foi possível achar o ContÁgil instalado nesta máquina.",
  "atalho-falhou": "Não foi possível criar o atalho na área de trabalho.",
  "erro-rede": "Falha de rede ao consultar o ALM.",
  "erro-http": "O ALM respondeu com erro.",
  "formato-inesperado": "Resposta inesperada do ALM.",
  "sem-estado": "O ALM não informou o estado do relato.",
};

export function mensagemErro(codigo: string | null | undefined, detalhe?: string | null): string {
  if (!codigo) return detalhe || "Erro desconhecido.";
  return MENSAGENS[codigo] ?? detalhe ?? `Erro: ${codigo}`;
}
