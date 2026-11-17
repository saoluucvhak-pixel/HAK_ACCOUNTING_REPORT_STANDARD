'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), F=require('../src');
test('format vi-VN',()=>{assert.equal(F.formatNumber(1250000.75),'1.250.000,75');assert.equal(F.formatVND(1250000),'1.250.000');assert.equal(F.formatNumber(null),'');assert.equal(F.formatDateISO('2026-10-16'),'16/10/2026');assert.throws(()=>F.formatDateISO('2026-02-31'));});
test('schema and alignments',()=>{const c=F.validateColumns([{key:'date',type:'date'},{key:'amount',type:'money'},{key:'account',type:'code'}]);assert.deepEqual(c.map(x=>x.align),['center','right','left']);assert.throws(()=>F.validateColumns([{key:'x'},{key:'x'}]));});

test('số âm làm tròn về 0 hiển thị "0" / "0,00", không "-0"; số âm thật giữ dấu', () => {
  const { formatNumber, formatVND, noNegativeZero } = require('../src');
  assert.equal(formatNumber(-0), '0');
  assert.equal(formatNumber(-0.001, { maxDecimals: 0 }), '0');
  assert.equal(formatNumber(-0.004, { minDecimals: 2, maxDecimals: 2 }), '0,00');
  assert.equal(formatVND(-0.4), '0');
  assert.equal(formatVND(-1000), '-1.000');
  assert.equal(formatNumber(-1234.5), '-1.234,5');
  assert.equal(formatNumber(-0.5, { maxDecimals: 0 }), '-1');            // làm tròn nửa ra xa 0: không phải số 0 âm
  assert.equal(noNegativeZero('-0,00'), '0,00'); assert.equal(noNegativeZero('-0,5'), '-0,5'); assert.equal(noNegativeZero('-10'), '-10');
  const { formatConfigured } = require('../src/precision-settings');
  assert.equal(formatConfigured(-0.4, {}, 'money'), '0');
  const sys = require('../src/system-settings');
  assert.equal(sys.format(-0.001, {}, 'quantity'), '0,00');
});
