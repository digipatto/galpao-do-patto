import { z } from 'zod';
import dados from '../data/quizzes.json';
import { esquemaQuiz, type LetraQuiz, type QuizBruto } from './schema';
import { listarOfertas } from './ofertas';

/**
 * Carrega e valida src/data/quizzes.json. Mesma regra das ofertas: dado
 * inválido derruba o build, e quiz que aponta pra oferta inexistente também.
 */

export const LETRAS: LetraQuiz[] = ['A', 'B', 'C', 'D'];

function validar(): QuizBruto[] {
  const r = z.array(esquemaQuiz).safeParse(dados);
  if (!r.success) {
    const linhas = r.error.issues.map((p) => `  • ${p.path.join('.') || '(raiz)'}: ${p.message}`);
    throw new Error(['src/data/quizzes.json tem dado inválido:', ...linhas].join('\n'));
  }
  const ids = new Set(listarOfertas().map((o) => o.id));
  const vistos = new Set<string>();
  for (const q of r.data) {
    if (vistos.has(q.id)) throw new Error(`src/data/quizzes.json tem id repetido: ${q.id}`);
    vistos.add(q.id);
    if (!ids.has(q.ofertaId)) {
      throw new Error(`quiz "${q.id}" aponta pra oferta "${q.ofertaId}", que não existe em ofertas.json`);
    }
  }
  return r.data;
}

export function listarQuizzes(): QuizBruto[] {
  return validar().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export function acharQuiz(id: string): QuizBruto | undefined {
  return listarQuizzes().find((q) => q.id === id);
}

/** Aceita "b", "B " etc. e devolve a letra válida pra esse quiz, ou undefined. */
export function lerLetra(valor: string | null, quiz: QuizBruto): LetraQuiz | undefined {
  const l = (valor ?? '').trim().toUpperCase();
  return LETRAS.slice(0, quiz.opcoes.length).find((x) => x === l);
}
