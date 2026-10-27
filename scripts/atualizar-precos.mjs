#!/usr/bin/env node
/**
 * Atualiza o preço de cada oferta lendo a vitrine do ML, sem a API.
 *
 * Como funciona: o link de afiliado (meli.la/...) redireciona pra uma página de
 * perfil (/social/<perfil>) renderizada no servidor, com um card por produto
 * (título, "Antes", "Agora"). É a mesma tela que o visitante vê ao clicar no
 * botão, então o preço lido aqui é o preço que ele encontra.
 *
 * Regras de segurança (preço errado é pior que preço nenhum):
 *   - só atualiza se o card for do MESMO anúncio (o id MLB é aprendido na
 *     primeira leitura, cruzando o título, e conferido nas seguintes);
 *   - se a leitura falhar ou o ML bloquear, não mexe em nada. O preço antigo
 *     envelhece e o site esconde o preço sozinho no navegador (ver
 *     VALIDADE_PRECO_DIAS em src/lib/ofertas.ts);
 *   - o preço lido é o de vitrine: sai `condicaoPreco` e `precoAlternativo`,
 *     que eram digitados à mão e não dá pra conferir daqui.
 *
 * Uso: node scripts/atualizar-precos.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ARQ = fileURLToPath(new URL('../src/data/ofertas.json', import.meta.url));
const SECO = process.argv.includes('--dry');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** AAAA-MM-DD no fuso do Brasil. */
const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

const semAcento = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const palavras = (s) =>
  semAcento(s)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 2);

/** "Agora: 1.949 reais com 5 centavos" -> 1949.05 */
function lerValor(rotulo) {
  const m = rotulo.match(/:\s*([\d.]+)\s*reais?(?:\s*com\s*(\d+)\s*centavos?)?/i);
  if (!m) return undefined;
  const reais = Number(m[1].replace(/\./g, ''));
  const centavos = m[2] ? Number(m[2]) : 0;
  if (!Number.isFinite(reais)) return undefined;
  return Math.round((reais + centavos / 100) * 100) / 100;
}

function lerCards(html) {
  const partes = html.split(/<div[^>]*class="poly-card /).slice(1);
  return partes.map((p) => {
    const titulo = p.match(/class="poly-component__title"[^>]*>([^<]+)</)?.[1]?.trim();
    const mlb = p.match(/item_id%3A(MLB\d+)/)?.[1] ?? p.match(/[?&]wid=(MLB\d+)/)?.[1];
    const antes = p.match(/aria-label="(Antes:[^"]+)"/)?.[1];
    const agora = p.match(/aria-label="(Agora:[^"]+)"/)?.[1];
    return {
      titulo,
      mlb,
      precoDe: antes ? lerValor(antes) : undefined,
      preco: agora ? lerValor(agora) : undefined,
    };
  });
}

function mesmoProduto(tituloOferta, tituloCard) {
  const a = new Set(palavras(tituloOferta));
  const b = new Set(palavras(tituloCard));
  if (a.size === 0) return false;
  let comuns = 0;
  for (const p of a) if (b.has(p)) comuns++;
  return comuns / a.size >= 0.6;
}

async function lerVitrine(link) {
  const r = await fetch(link, { headers: { 'user-agent': UA, 'accept-language': 'pt-BR,pt;q=0.9' }, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (!new URL(r.url).pathname.startsWith('/social/')) {
    throw new Error(`o link não cai numa vitrine /social/ (caiu em ${new URL(r.url).pathname})`);
  }
  const html = await r.text();
  const ogTitulo = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  const cards = lerCards(html).filter((c) => c.mlb && c.preco !== undefined);
  if (cards.length === 0) throw new Error('nenhum card com preço (página mudou ou foi bloqueada)');
  return { ogTitulo, cards };
}

const ofertas = JSON.parse(readFileSync(ARQ, 'utf8'));
let mudou = false;
let falhas = 0;

for (const o of ofertas) {
  const tag = `[${o.id}]`;
  try {
    const { ogTitulo, cards } = await lerVitrine(o.linkAfiliado);

    let card;
    if (o.mlb) {
      card = cards.find((c) => c.mlb === o.mlb);
      if (!card) throw new Error(`o anúncio ${o.mlb} não está mais na vitrine`);
    } else {
      // Primeira leitura: aprende o id cruzando o título da oferta com o do card.
      const candidatos = cards.filter((c) => c.titulo && mesmoProduto(o.titulo, c.titulo));
      card =
        candidatos.find((c) => ogTitulo && c.titulo === ogTitulo) ??
        (candidatos.length === 1 ? candidatos[0] : undefined);
      if (!card) throw new Error('não achei um card que bata com o título (confira o título ou preencha "mlb")');
      console.log(`${tag} anúncio identificado: ${card.mlb} ("${card.titulo}")`);
    }

    const novo = { ...o, mlb: card.mlb, preco: card.preco, conferidoEm: hoje };
    if (card.precoDe !== undefined && card.precoDe > card.preco) novo.precoDe = card.precoDe;
    else delete novo.precoDe;
    delete novo.condicaoPreco;
    delete novo.precoAlternativo;

    const antes = `${o.preco}${o.precoDe ? ` (de ${o.precoDe})` : ''}`;
    const depois = `${novo.preco}${novo.precoDe ? ` (de ${novo.precoDe})` : ''}`;
    console.log(`${tag} ${antes} -> ${depois}${antes === depois ? ' (igual)' : ''}`);

    if (JSON.stringify(novo) !== JSON.stringify(o)) mudou = true;
    Object.assign(o, novo);
    for (const k of Object.keys(o)) if (!(k in novo)) delete o[k];
  } catch (e) {
    falhas++;
    console.warn(`${tag} NÃO atualizado: ${e.message}. O preço antigo envelhece e some do site sozinho.`);
  }
}

if (!SECO && mudou) writeFileSync(ARQ, JSON.stringify(ofertas, null, 2) + '\n');
console.log(mudou ? 'ofertas.json atualizado.' : 'nada mudou em ofertas.json.');
process.exit(falhas === ofertas.length && ofertas.length > 0 ? 1 : 0);
