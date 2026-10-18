# HAK Accounting & Reporting Standard V1.0

Independent JavaScript package staged for its own GitHub repository. Does **not** import LUONG_HAK or HAK_SMART_FILTER.

## Nguồn và phiên bản
- Chuẩn V1.0.0 (V10.3), chuyển từ `HAK_LUONG_OFFLINE`, nhánh `design/hak-enterprise-v10-4`, thư mục `HAK_ACCOUNTING_REPORT_STANDARD`, commit `715b043`.
- Thay đổi so với bản nguồn: `formatNumber` từ chối số ≥ 2^53 thay vì hiển thị sai; export `formatExact` từ gói chính; thêm CI Node 18/20/22.

## Features
- Vietnamese thousands grouping and decimal precision.
- dd/MM/yyyy date display with calendar validation.
- Type-based column alignment.
- Declarative report column schema and width constraints.
- Accounting/reporting skill: `skill/SKILL.md`.

## Run
```sh
cd HAK_ACCOUNTING_REPORT_STANDARD
npm test
```

## Example
```js
const F = require('./src');
F.formatNumber(1250000.75); // 1.250.000,75
F.formatDateISO('2026-10-16'); // 16/10/2026
F.validateColumns([{key:'amount',label:'Số tiền',type:'money'}]);
```

## Scope
This release is a standalone **formatting foundation**, not yet a PDF/XLSX renderer. Report layout, export parity and visual-regression rules are specified in the skill but require implementing adapters and tests.

## Khóa kỳ (mới ở 1.1.0)

`src/period-lock.js` (export `periodLock`) — phân loại một thay đổi dữ liệu so với các kỳ đã chốt, tổng quát hóa từ
`LuongHAK_Offline/core/period-guard.js` (LUONG_HAK, nhánh `audit/luong-hak-offline-v10-3-quality`, commit `59fa2f5`):

| Loại | Khi nào | Xử lý |
|---|---|---|
| `locked` | chứng từ phát sinh thuộc kỳ đã chốt (phiếu nhập/xuất, chấm công, phiếu chi…) | chặn sửa/xóa, phải mở chốt |
| `retro` | dữ liệu có hiệu lực (đơn giá, danh mục, hợp đồng) chồng lên kỳ đã chốt | cho lưu, **cảnh báo + ghi nhật ký**; số đã chốt không đổi |
| `none` | không đụng kỳ đã chốt | bình thường |

```js
const { periodLock } = require('@hak/accounting-report-standard');
const policy = { closedPeriods: ['2026-08', '2026-09'], rangeOf: r => ({ from: r['Hiệu lực từ'], to: r['Hiệu lực đến'] }) };
const res = periodLock.classifyChange(truocKhiSua, sauKhiSua, policy);
// { kind: 'retro', periods: ['2026-09'], allowed: true, message: 'Hồi tố: ảnh hưởng kỳ đã chốt 9/2026…' }
periodLock.changedFields(truocKhiSua, sauKhiSua); // [{ field, before, after, text }] cho nhật ký
```
Thay đổi được tính là hợp của trạng thái **trước và sau** — dời ngày ra khỏi kỳ đã chốt vẫn bị bắt. Ô "Hiệu lực đến" kiểu Time=0 của Google Sheets (năm 1899) được hiểu là còn hiệu lực.

Bộ lọc dùng chung cho màn hình/Excel/PDF (mục P1 trong `docs/V2_ROADMAP.md`) nằm ở `HAK_SMART_FILTER` v1.1.0: `createSnapshot` + `sameAsSnapshot`.
