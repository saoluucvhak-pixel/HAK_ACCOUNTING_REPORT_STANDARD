'use strict';
/**
 * Khóa kỳ — phân loại ảnh hưởng của một thay đổi dữ liệu tới các kỳ ĐÃ CHỐT.
 * Tổng quát hóa từ LuongHAK_Offline/core/period-guard.js (LUONG_HAK, nhánh audit/luong-hak-offline-v10-3-quality),
 * bỏ phần riêng của bảng lương để dùng cho lương, kho, quỹ, công nợ…
 *
 * Ba loại:
 *   "locked" — dữ liệu PHÁT SINH thuộc kỳ đã chốt (phiếu nhập/xuất, chấm công, phiếu chi…)
 *              → KHÔNG cho sửa; muốn sửa phải mở chốt.
 *   "retro"  — dữ liệu CÓ HIỆU LỰC THEO THỜI GIAN (đơn giá, danh mục, hợp đồng, phụ lục…) mà khoảng hiệu lực chồng lên kỳ đã chốt
 *              → cho lưu nhưng phải cảnh báo + ghi nhật ký; số liệu kỳ đã chốt KHÔNG tự đổi, muốn áp dụng phải mở chốt và chốt lại.
 *   "none"   — không ảnh hưởng kỳ đã chốt.
 *
 * Kỳ dạng "yyyy-MM". Ngày nhận Date hoặc chuỗi "yyyy-MM-dd" / "dd/MM/yyyy".
 */

const PERIOD_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function assertPeriod(p) {
  if (typeof p !== 'string' || !PERIOD_RE.test(p)) throw new RangeError(`Kỳ không hợp lệ: ${p} (cần yyyy-MM)`);
  return p;
}

function pad(n) { return String(n).padStart(2, '0'); }

/** Ngày → "yyyy-MM-dd" hoặc null. Từ chối ngày sai lịch; Date năm ≤ 1900 (ô Time=0 của Sheets) = trống. */
function toISODate(v) {
  if (v === null || v === undefined || v === '' || v === 0) return null;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime()) || v.getFullYear() <= 1900) return null;
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/), y, mo, d;
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [y, mo, d] = [+m[3], +m[2], +m[1]];
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** Kỳ của một ngày: "2026-09-15" → "2026-09". */
function periodOfDate(v) { const d = toISODate(v); return d ? d.slice(0, 7) : null; }

/** Ngày đầu/cuối kỳ. */
function monthBounds(period) {
  assertPeriod(period);
  const [y, m] = period.split('-').map(Number);
  return { start: `${period}-01`, end: `${period}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}` };
}

/** "2026-09" → "9/2026". */
function periodLabel(period) { assertPeriod(period); const [y, m] = period.split('-'); return `${+m}/${y}`; }

/**
 * Ảnh hưởng của MỘT dòng (ở một trạng thái) tới các kỳ đã chốt.
 * @param {Object|null} row
 * @param {Object} policy
 * @param {string[]} policy.closedPeriods                 các kỳ đã chốt, vd ["2026-08","2026-09"]
 * @param {function(Object):(string|Date|null)} [policy.periodOf]  dữ liệu PHÁT SINH: trả kỳ "yyyy-MM" hoặc ngày chứng từ
 * @param {function(Object):{from:*, to:*}|null} [policy.rangeOf] dữ liệu CÓ HIỆU LỰC: trả khoảng hiệu lực (to trống = còn hiệu lực)
 * @param {function(string, Object):boolean} [policy.affects]     tùy chọn: kỳ đã chốt có thực sự dùng dòng này không
 *        (vd hồ sơ của 1 nhân viên chỉ ảnh hưởng kỳ có nhân viên đó trong bảng lương đã chốt)
 * @return {{kind: "locked"|"retro"|"none", periods: string[]}}
 */
function impact(row, policy) {
  const closed = [...new Set((policy && policy.closedPeriods) || [])].map(assertPeriod).sort();
  const none = { kind: 'none', periods: [] };
  if (!row || !closed.length) return none;
  const affects = typeof policy.affects === 'function' ? policy.affects : () => true;
  if (typeof policy.periodOf === 'function') {
    const raw = policy.periodOf(row);
    const p = typeof raw === 'string' && PERIOD_RE.test(raw) ? raw : periodOfDate(raw);
    return p && closed.includes(p) && affects(p, row) ? { kind: 'locked', periods: [p] } : none;
  }
  if (typeof policy.rangeOf === 'function') {
    const rg = policy.rangeOf(row);
    if (!rg) return none;
    const from = toISODate(rg.from), to = toISODate(rg.to);
    const hit = closed.filter(p => {
      const b = monthBounds(p);
      return (!from || from <= b.end) && (!to || to >= b.start) && affects(p, row);
    });
    return hit.length ? { kind: 'retro', periods: hit } : none;
  }
  return none;
}

/**
 * Ảnh hưởng của một THAY ĐỔI = hợp ảnh hưởng trước và sau khi sửa.
 * (Dời ngày hiệu lực RA KHỎI kỳ đã chốt vẫn là hồi tố; dời chứng từ từ kỳ đã chốt sang kỳ mở vẫn là locked.)
 * Thêm mới: before = null. Xóa: after = null.
 */
function classifyChange(before, after, policy) {
  const a = impact(before, policy), b = impact(after, policy);
  const kind = a.kind === 'locked' || b.kind === 'locked' ? 'locked' : (a.kind === 'retro' || b.kind === 'retro' ? 'retro' : 'none');
  const periods = [...new Set(a.periods.concat(b.periods))].sort();
  return {
    kind, periods,
    allowed: kind !== 'locked',
    message: kind === 'locked' ? `Thuộc kỳ đã chốt ${periods.map(periodLabel).join(', ')} — phải mở chốt mới sửa được`
      : kind === 'retro' ? `Hồi tố: ảnh hưởng kỳ đã chốt ${periods.map(periodLabel).join(', ')}. Số liệu đã chốt không đổi; muốn áp dụng phải mở chốt và chốt lại`
        : '',
  };
}

/** Các cột thay đổi giữa 2 trạng thái — để ghi nhật ký trước/sau. */
function changedFields(before, after, ignore = ['_id']) {
  const skip = new Set(ignore), keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const show = v => {
    if (v === null || v === undefined || v === '') return '∅';
    return toISODate(v) && Object.prototype.toString.call(v) === '[object Date]' ? toISODate(v) : String(v);
  };
  const out = [];
  for (const k of [...keys].sort()) {
    if (skip.has(k)) continue;
    const a = show(before && before[k]), b = show(after && after[k]);
    if (a !== b) out.push({ field: k, before: a, after: b, text: `${k}: ${a} → ${b}` });
  }
  return out;
}

module.exports = { impact, classifyChange, changedFields, monthBounds, periodLabel, periodOfDate, toISODate };
