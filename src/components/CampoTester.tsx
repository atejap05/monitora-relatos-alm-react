import { TextField } from "nfse-ds";
import { useId } from "react";
import { MAX_TEXTO_TESTER, normalizarTester } from "@/lib/tester";

interface Props {
  value: string;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  /** Nomes já usados (sugestoesTester). O campo aceita nome novo. */
  sugestoes: string[];
  erro?: string;
  /** Texto de apoio quando não há erro; o contador de caracteres vem depois dele. */
  dica?: string;
}

/**
 * Tester responsável (RF-22): texto livre com sugestões. O Combobox do nfse-ds só aceita valores da
 * lista, então as sugestões vêm de um <datalist> nativo (H-datalist-cef).
 */
export function CampoTester({ value, onChange, onBlur, sugestoes, erro, dica }: Props) {
  const idLista = useId();
  const contador = `${normalizarTester(value).length}/${MAX_TEXTO_TESTER} caracteres`;
  return (
    <>
      <TextField
        label="Tester responsável"
        list={idLista}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        error={Boolean(erro)}
        hint={erro ?? (dica ? `${dica} ${contador}` : contador)}
      />
      <datalist id={idLista} data-testid="sugestoes-tester">
        {sugestoes.map((nome) => (
          <option key={nome} value={nome} />
        ))}
      </datalist>
    </>
  );
}
