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

