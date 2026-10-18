'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/period-lock');

const CLOSED = ['2026-08', '2026-09'];
const phieu = { closedPeriods: CLOSED, periodOf: r => r['Ngày'] };                                  // dữ liệu phát sinh
const donGia = { closedPeriods: CLOSED, rangeOf: r => ({ from: r['Hiệu lực từ'], to: r['Hiệu lực đến'] }) }; // dữ liệu có hiệu lực

test('chứng từ thuộc kỳ đã chốt → locked, kỳ mở → none', () => {
  assert.deepEqual(L.impact({ 'Ngày': '15/09/2026' }, phieu), { kind: 'locked', periods: ['2026-09'] });
  assert.deepEqual(L.impact({ 'Ngày': new Date(2026, 9, 1) }, phieu), { kind: 'none', periods: [] });
  assert.deepEqual(L.impact({ 'Ngày': '2026-08' }, { closedPeriods: CLOSED, periodOf: r => r['Ngày'] }), { kind: 'locked', periods: ['2026-08'] });
});

test('đơn giá có hiệu lực chồng lên kỳ đã chốt → retro, liệt kê đúng các kỳ', () => {
  assert.deepEqual(L.impact({ 'Hiệu lực từ': '2026-08-20', 'Hiệu lực đến': '' }, donGia).periods, ['2026-08', '2026-09']);
  assert.deepEqual(L.impact({ 'Hiệu lực từ': '01/09/2026', 'Hiệu lực đến': '30/09/2026' }, donGia), { kind: 'retro', periods: ['2026-09'] });
  assert.equal(L.impact({ 'Hiệu lực từ': '01/10/2026', 'Hiệu lực đến': '' }, donGia).kind, 'none');
  assert.equal(L.impact({ 'Hiệu lực từ': '', 'Hiệu lực đến': '31/07/2026' }, donGia).kind, 'none');
});

test("ô 'Hiệu lực đến' kiểu Time=0 của Sheets (1899) = còn hiệu lực", () => {
  const r = { 'Hiệu lực từ': new Date(2026, 0, 1), 'Hiệu lực đến': new Date(1899, 11, 30) };
  assert.deepEqual(L.impact(r, donGia).periods, ['2026-08', '2026-09']);
});

test('affects: chỉ kỳ thực sự dùng dòng đó mới bị tính', () => {
  const daDung = { '2026-09': new Set(['NV01']) };
  const p = { ...donGia, affects: (ky, r) => !!(daDung[ky] && daDung[ky].has(r['Mã NV'])) };
  assert.deepEqual(L.impact({ 'Mã NV': 'NV01', 'Hiệu lực từ': '2026-01-01' }, p).periods, ['2026-09']);
  assert.equal(L.impact({ 'Mã NV': 'NV02', 'Hiệu lực từ': '2026-01-01' }, p).kind, 'none');
});

test('thay đổi = hợp trước và sau: dời ra khỏi kỳ chốt vẫn bị bắt', () => {
  const a = L.classifyChange({ 'Ngày': '20/09/2026' }, { 'Ngày': '01/10/2026' }, phieu);
  assert.deepEqual([a.kind, a.allowed, a.periods], ['locked', false, ['2026-09']]);
  assert.match(a.message, /9\/2026 — phải mở chốt/);
  const b = L.classifyChange({ 'Hiệu lực từ': '2026-09-01' }, { 'Hiệu lực từ': '2026-10-01' }, donGia);
  assert.deepEqual([b.kind, b.allowed, b.periods], ['retro', true, ['2026-09']]);
  assert.match(b.message, /Hồi tố/);
  assert.equal(L.classifyChange(null, { 'Ngày': '01/10/2026' }, phieu).kind, 'none', 'thêm mới ở kỳ mở');
  assert.equal(L.classifyChange({ 'Ngày': '01/08/2026' }, null, phieu).kind, 'locked', 'xóa chứng từ kỳ đã chốt');
});

test('không có kỳ chốt hoặc không có chính sách → none; kỳ sai định dạng bị từ chối', () => {
  assert.equal(L.impact({ 'Ngày': '01/09/2026' }, { closedPeriods: [], periodOf: r => r['Ngày'] }).kind, 'none');
  assert.equal(L.impact({ x: 1 }, { closedPeriods: CLOSED }).kind, 'none');
  assert.throws(() => L.impact({ 'Ngày': '01/09/2026' }, { closedPeriods: ['2026-9'], periodOf: r => r['Ngày'] }), /yyyy-MM/);
});

test('changedFields cho nhật ký trước/sau', () => {
  const c = L.changedFields({ _id: 1, 'Đơn giá': 950000, 'Ghi chú': '' }, { _id: 2, 'Đơn giá': 980000, 'Ghi chú': 'tăng giá' });
  assert.deepEqual(c.map(x => x.text), ['Ghi chú: ∅ → tăng giá', 'Đơn giá: 950000 → 980000']);
});

test('tiện ích kỳ và ngày', () => {
  assert.deepEqual(L.monthBounds('2028-02'), { start: '2028-02-01', end: '2028-02-29' });
  assert.equal(L.periodLabel('2026-09'), '9/2026');
  assert.equal(L.toISODate('31/02/2026'), null);
  assert.equal(L.periodOfDate('05/10/2026'), '2026-10');
});
