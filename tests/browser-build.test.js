'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { build, OUT } = require('../scripts/build-browser');
const src = require('../src');

test('dist/hak-report-standard.js đã được dựng lại từ src (không lệch)', () => {
  assert.equal(fs.readFileSync(OUT, 'utf8'), build(), 'chạy: node scripts/build-browser.js');
});

test('bản trình duyệt chạy trong môi trường KHÔNG có module/require, chỉ có self + Intl', () => {
  const ctx = { Intl, console }; ctx.self = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(OUT, 'utf8'), ctx);
  const H = ctx.HAKReport;
  assert.equal(typeof H, 'object');
  assert.equal(H.formatVND(1234567.5), '1.234.568');
  assert.equal(H.formatVND(-0.2), '0');
  assert.equal(H.formatNumber(-0.004, { minDecimals: 2, maxDecimals: 2 }), '0,00');
  assert.equal(H.formatExact('12345678901234567890.5', { mode: 'integer' }), '12.345.678.901.234.567.891');
  assert.equal(H.formatDateISO('2026-10-05'), '05/10/2026');
  assert.throws(() => H.formatDateISO('2026-02-29'), (e) => e.name === 'RangeError');   // khác realm (vm) nên so theo tên
  assert.equal(H.formatConfigured(-0.4, {}, 'money'), '0');
});

test('bản dựng cho cùng kết quả với src trên bộ giá trị mẫu (kể cả số âm, làm tròn, lớn)', () => {
  const dist = require(OUT);
  for (const k of Object.keys(src)) assert.equal(typeof dist[k], typeof src[k], k);
  const nums = [0, -0, 1, -1, 0.5, -0.5, 0.285, 1.005, 2.675, -0.001, 1234567.891, -1234567.891, 99999999999.995, Number.MAX_SAFE_INTEGER];
  for (const n of nums) for (const o of [{}, { maxDecimals: 0 }, { minDecimals: 2, maxDecimals: 2 }, { maxDecimals: 6 }]) assert.equal(dist.formatNumber(n, o), src.formatNumber(n, o), `${n} ${JSON.stringify(o)}`);
  for (const s of ['0', '-0.004', '0.999', '-999.995', '1234.5678']) assert.equal(dist.formatExact(s), src.formatExact(s), s);
});
