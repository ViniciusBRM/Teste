// Testes do núcleo de cálculo (script id="core" em src/cartellino.html).
// Rodar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src', 'cartellino.html'), 'utf8');
const code = /<script id="core">([\s\S]*?)<\/script>/.exec(html)[1];
const C = vm.runInNewContext(`${code}\n;Core`, {});

const S = { ...C.defaults(), feriados: 'IT', tolerancia: 10, almocoMin: 60, entradaPrevista: '08:30', inicio: '2026-01-01' };
const rec = (date, type, p = {}, extra = {}) => ({ ...C.newRec(date, type), p, ...extra });
const TODAY = '2026-10-01';

test('Páscoa', () => {
  assert.equal(C.easter(2025), '2025-04-20');
  assert.equal(C.easter(2026), '2026-04-05');
  assert.equal(C.easter(2027), '2027-03-28');
});

test('feriados da Itália e do Brasil', () => {
  const it26 = C.holidaysOf(2026, 'IT', '');
  assert.equal(it26.get('2026-04-06'), "Lunedì dell'Angelo");
  assert.equal(it26.get('2026-10-04'), "San Francesco d'Assisi");
  assert.equal(C.holidaysOf(2025, 'IT', '').has('2025-10-04'), false);
  const br26 = C.holidaysOf(2026, 'BR', '');
  assert.equal(br26.get('2026-04-03'), 'Sexta-feira Santa');
  assert.equal(br26.get('2026-11-20'), 'Dia da Consciência Negra');
  const local = C.holidaysOf(2026, 'IT', "07/12 Sant'Ambrogio, 31/02 inválido");
  assert.equal(local.get('2026-12-07'), "Sant'Ambrogio");
  assert.equal(local.has('2026-02-31'), false);
});

test('dia normal dentro da tolerância conta como cumprido', () => {
  const d = C.computeDay('2026-09-29', rec('2026-09-29', 'trabalho', { in: '08:30', lo: '12:30', li: '13:30', out: '17:38' }), S, TODAY, null);
  assert.equal(d.worked, 488);
  assert.equal(d.lunch, 60);
  assert.equal(d.saldo, 0);
  assert.equal(d.status, 'cumprida');
});

test('horas extras, almoço curto e atraso geram alertas', () => {
  const d = C.computeDay('2026-09-29', rec('2026-09-29', 'trabalho', { in: '08:50', lo: '12:30', li: '13:10', out: '18:50' }), S, TODAY, null);
  assert.equal(d.worked, 560);
  assert.equal(d.saldo, 80);
  assert.equal(d.status, 'extra');
  assert.equal(d.late, 20);
  assert.ok(d.flags.some(f => /Intervalo de almoço/.test(f.t)));
});

test('marcação incompleta não gera saldo', () => {
  const d = C.computeDay('2026-09-29', rec('2026-09-29', 'trabalho', { in: '08:30', lo: '12:30', out: '17:30' }), S, TODAY, null);
  assert.equal(d.status, 'incompleta');
  assert.equal(d.saldo, 0);
  assert.match(d.flags[0].t, /Uscita almoço/);
});

test('dia em andamento hoje', () => {
  const d = C.computeDay(TODAY, rec(TODAY, 'trabalho', { in: '08:30', lo: '12:30', li: '13:30' }), S, TODAY, 15 * 60);
  assert.equal(d.ongoing, true);
  assert.equal(d.worked, 5.5 * 60);
  assert.equal(d.saldo, 0);
});

test('eventos especiais: férias, atestado, falta, compensação, trasferta e feriado', () => {
  const day = '2026-09-28'; // segunda-feira
  assert.equal(C.computeDay(day, rec(day, 'ferias'), S, TODAY, null).saldo, 0);
  const at = C.computeDay(day, rec(day, 'atestado'), S, TODAY, null);
  assert.equal(at.abono, 480);
  assert.equal(at.saldo, 0);
  const parcial = C.computeDay(day, rec(day, 'licenca', { in: '08:30', lo: '12:30', li: '13:30', out: '15:30' }, { abono: 'partial', abonoMin: 120 }), S, TODAY, null);
  assert.equal(parcial.worked, 360);
  assert.equal(parcial.abono, 120);
  assert.equal(parcial.saldo, 0);
  const falta = C.computeDay(day, rec(day, 'falta'), S, TODAY, null);
  assert.equal(falta.saldo, -480);
  assert.equal(falta.status, 'falta');
  assert.equal(C.computeDay(day, rec(day, 'compensacao'), S, TODAY, null).saldo, -480);
  const tr = C.computeDay(day, rec(day, 'trasferta', {}, { local: 'Milano' }), S, TODAY, null);
  assert.equal(tr.credited, 480);
  assert.equal(tr.saldo, 0);
  const fer = C.computeDay('2026-06-02', rec('2026-06-02', 'feriado', { in: '09:00', out: '12:00' }), S, TODAY, null);
  assert.equal(fer.expected, 0);
  assert.equal(fer.saldo, 180);
});

test('dia útil passado sem registro fica pendente; feriado não', () => {
  assert.equal(C.computeDay('2026-09-30', null, S, TODAY, null).status, 'pendente');
  assert.equal(C.computeDay('2026-06-02', null, S, TODAY, null).status, 'feriado');
  assert.equal(C.computeDay('2026-09-27', null, S, TODAY, null).status, 'livre');
});

test('resumo soma horas, extras, débitos e trasferte', () => {
  const days = [
    C.computeDay('2026-09-28', rec('2026-09-28', 'trabalho', { in: '08:30', lo: '12:30', li: '13:30', out: '18:30' }), S, TODAY, null),
    C.computeDay('2026-09-29', rec('2026-09-29', 'falta'), S, TODAY, null),
    C.computeDay('2026-09-30', rec('2026-09-30', 'trasferta', {}, { local: 'Torino' }), S, TODAY, null),
  ];
  const s = C.summarize(days, TODAY);
  assert.equal(s.worked, 540);
  assert.equal(s.expected, 1440);
  assert.equal(s.extra, 60);
  assert.equal(s.debit, -480);
  assert.equal(s.faltas, 1);
  assert.equal(s.trasferta, 1);
  assert.deepEqual({ ...s.places }, { Torino: 1 });
});

test('saldo de férias por ano', () => {
  const recs = [rec('2026-08-10', 'ferias'), rec('2026-08-11', 'ferias'), rec('2026-08-15', 'ferias'), rec('2026-12-21', 'ferias')];
  const f = C.ferias(recs, S, TODAY, 2026);
  assert.deepEqual({ ...f }, { total: 22, used: 2, planned: 1, remaining: 19 });
});

test('CSV usa ponto e vírgula, BOM e neutraliza fórmulas', () => {
  const d = C.computeDay('2026-09-28', rec('2026-09-28', 'trabalho', { in: '08:30', out: '12:30' }, { note: '=HYPERLINK("x")' }), S, TODAY, null);
  const out = C.csv([d]);
  assert.ok(out.startsWith('﻿Data;Dia;Tipo'));
  assert.ok(out.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(out.includes('-04:00'));
});

test('duração em texto', () => {
  assert.equal(C.dur(485), '8h 05m');
  assert.equal(C.sDur(-30), '−30m');
  assert.equal(C.durToMin('+12:30'), 750);
  assert.equal(C.durToMin('-1,5'), -90);
  assert.equal(C.durToMin('abc'), null);
});

test('dados de exemplo cobrem os tipos e não quebram o cálculo', () => {
  const months = C.demo(TODAY, 10 * 60, S);
  const recs = Object.values(months).flatMap(m => Object.values(m.days));
  assert.ok(recs.length > 50);
  const types = new Set(recs.map(r => r.type));
  for (const t of ['trabalho', 'smart', 'trasferta', 'ferias', 'folga', 'compensacao', 'atestado', 'licenca', 'falta']) assert.ok(types.has(t), t);
  for (const r of recs) {
    const d = C.computeDay(r.date, r, S, TODAY, 10 * 60);
    assert.ok(Number.isFinite(d.saldo));
    assert.ok(!d.flags.some(f => f.lvl === 'err'), `${r.date} fora de ordem`);
  }
});
