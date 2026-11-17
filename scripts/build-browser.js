'use strict';
/**
 * Dựng bản dùng được trên TRÌNH DUYỆT (không bundler) từ chính các file nguồn trong src/ — cùng một mã, không viết lại.
 *   node scripts/build-browser.js          → ghi dist/hak-report-standard.js
 *   node scripts/build-browser.js --check  → thoát 1 nếu dist chưa cập nhật (CI)
 * Trình duyệt: <script src="hak-report-standard.js"> → window.HAKReport.formatNumber / formatVND / formatExact / formatDateISO / …
 * Node/CommonJS: require('./dist/hak-report-standard.js') cho kết quả tương đương require('./src').
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODULES = ['exact-format', 'index', 'precision-settings', 'moisture-settings', 'system-settings'];
const OUT = path.join(ROOT, 'dist', 'hak-report-standard.js');

function build() {
  const body = MODULES.map((name) => {
    const src = fs.readFileSync(path.join(ROOT, 'src', name + '.js'), 'utf8').replace(/^'use strict';\r?\n/, '').replace(/\r\n/g, '\n').trimEnd();
    return `  defs[${JSON.stringify('./' + name)}] = function (module, exports, require) {\n${src.split('\n').map((l) => (l ? '    ' + l : l)).join('\n')}\n  };`;
  }).join('\n');
  return `/* HAK Accounting Report Standard — bản dùng cho trình duyệt (TỰ SINH từ src/ bằng scripts/build-browser.js — không sửa tay). */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HAKReport = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var defs = {}, cache = {};
  function req(name) {
    if (cache[name]) return cache[name].exports;
    if (!defs[name]) throw new Error('Không có module ' + name);
    var m = cache[name] = { exports: {} };
    defs[name](m, m.exports, req);
    return m.exports;
  }
${body}
  var api = {};
  ['./index', './precision-settings', './moisture-settings', './system-settings'].forEach(function (n) {
    var e = req(n);
    Object.keys(e).forEach(function (k) { if (!(k in api)) api[k] = e[k]; });
  });
  api.system = req('./system-settings');       // format/normalize/resolve của cấu hình v2 (trùng tên với module khác nên để riêng)
  api.moisture = req('./moisture-settings');
  api.precision = req('./precision-settings');
  return api;
});
`;
}

if (require.main === module) {
  const out = build();
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== out) { console.error('dist/hak-report-standard.js chưa cập nhật — chạy: node scripts/build-browser.js'); process.exit(1); }
    console.log('dist đã cập nhật');
  } else { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, out); console.log('Đã ghi', OUT); }
}
module.exports = { build, OUT };
