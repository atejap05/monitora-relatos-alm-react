// Mesma regra do STORE.validar_numero_alm: só dígitos, faixa 1..2147483647 (int32 do Jazz).
export const ID_ALM_MIN = 1;
export const ID_ALM_MAX = 2147483647;
export const MAX_TEXTO_ANOTACAO = 2000;

/** Validador do campo Anotações (cadastro e edição): devolve a mensagem ou `undefined`. */
export function validarAnotacao(valor: string): string | undefined {
  return valor.trim().length > MAX_TEXTO_ANOTACAO ? `Máximo de ${MAX_TEXTO_ANOTACAO} caracteres.` : undefined;
}

export type Validacao = { ok: true; numero: string } | { ok: false; mensagem: string };

export function validarNumeroAlm(bruto: string): Validacao {
  const texto = bruto.trim();
  if (!/^\d+$/.test(texto)) {
    return { ok: false, mensagem: "Número ALM deve conter apenas dígitos" };
  }
  const valor = Number(texto);
  if (valor < ID_ALM_MIN || valor > ID_ALM_MAX) {
    return { ok: false, mensagem: `Número ALM deve estar entre ${ID_ALM_MIN} e ${ID_ALM_MAX}` };
  }
  return { ok: true, numero: String(valor) };
}

/** Aceita um por linha, ou separados por vírgula, ponto e vírgula ou espaço. Remove repetidos. */
export function separarNumeros(texto: string): string[] {
  const partes = texto
    .split(/[\s,;]+/)
    .map((parte) => parte.trim())
    .filter(Boolean);
  return [...new Set(partes)];
}

export interface AnaliseLote {
  validos: string[];
  invalidos: { bruto: string; mensagem: string }[];
}

export function analisarLote(texto: string): AnaliseLote {
  const validos: string[] = [];
  const invalidos: AnaliseLote["invalidos"] = [];
  for (const bruto of separarNumeros(texto)) {
    const v = validarNumeroAlm(bruto);
    if (v.ok) {
      if (!validos.includes(v.numero)) validos.push(v.numero);
    } else {
      invalidos.push({ bruto, mensagem: v.mensagem });
    }
  }
  return { validos, invalidos };
}

/** Mesmo slug do STORE.normalizar_id_demanda (NFKD): 'Homologação NFSe' -> 'homologacao-nfse'. */
export function normalizarIdDemanda(nome: string): string {
  const semAcento = nome.normalize("NFKD").replace(/\p{M}/gu, "");
  let saida = "";
  for (const c of semAcento.trim().toLowerCase()) {
    if ((c >= "a" && c <= "z") || (c >= "0" && c <= "9")) saida += c;
    else if (saida && !saida.endsWith("-")) saida += "-";
  }
  return saida.replace(/^-+|-+$/g, "");
}
