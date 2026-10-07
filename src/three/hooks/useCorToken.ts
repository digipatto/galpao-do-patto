import { useMemo } from 'react';

/**
 * Lê uma cor de src/styles/tokens.css e devolve pra cena 3D.
 *
 * Existe por causa da regra 9: token de cor só mora no tokens.css. O WebGL não
 * entende `var(--fundo)`, então a ponte é ler o valor já computado do
 * documento. Como a ilha 3D é `client:only`, o CSS sempre existe aqui.
 *
 * @param nome    nome da custom property, com os dois hífens (ex.: '--fundo')
 * @param reserva cor usada se o token não existir (nunca deve acontecer)
 */
export function lerCorToken(nome: string, reserva: string): string {
  if (typeof document === 'undefined') return reserva;
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(nome)
    .trim();
  return valor || reserva;
}

/** Versão memoizada, pra usar dentro de componente. */
export function useCorToken(nome: string, reserva: string): string {
  return useMemo(() => lerCorToken(nome, reserva), [nome, reserva]);
}
