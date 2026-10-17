'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src');

test('formatNumber: từ 2^53 trở lên báo lỗi thay vì hiển thị số sai', () => {
  assert.throws(() => F.formatNumber(123456789123456789123456789, { maxDecimals: 6 }), RangeError);
  assert.throws(() => F.formatNumber(9007199254740993, { maxDecimals: 0 }), RangeError);
});
test('formatExact: giữ nguyên chữ số của chuỗi thập phân lớn', () => {
  assert.equal(F.formatExact('123456789123456789123456789.123456', { digits: 6 }), '123.456.789.123.456.789.123.456.789,123456');
  assert.equal(F.formatExact('9007199254740993', { digits: 0 }), '9.007.199.254.740.993');
});
test('formatExact được export từ gói chính và làm tròn nửa lên', () => {
  assert.equal(typeof F.formatExact, 'function');
  assert.equal(F.formatExact('-0.005', { digits: 2 }), '-0,01');
  assert.equal(F.formatExact('999.995', { digits: 2 }), '1.000,00');
});
