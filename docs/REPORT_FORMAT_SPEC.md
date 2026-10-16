# HAK — đặc tả khung trình bày báo cáo (bản dự thảo)

> Đây là khung kỹ thuật đề xuất, **chưa phải chuẩn kế toán hoặc mẫu biểu pháp lý đã được phê duyệt**.

## Cấu trúc chung
1. Đơn vị lập, tên báo cáo, kỳ báo cáo và ngày xuất.
2. Điều kiện lọc/phạm vi dữ liệu dùng để lập báo cáo.
3. Bảng dữ liệu với đơn vị tính và số thứ tự khi cần.
4. Dòng cộng, đối chiếu tổng chi tiết và tổng hợp.
5. Ghi chú, người lập, người kiểm tra, người phê duyệt (tùy nghiệp vụ).

## Quy ước kiểm tra
- Ngày: định dạng nhất quán trong báo cáo, có múi giờ khi dữ liệu cần.
- Số: số thập phân theo đơn vị tính, không làm tròn trước khi tổng hợp.
- Tiền tệ: định dạng theo đồng tiền và quy tắc của nghiệp vụ; không giả định USD luôn có phần thập phân.
- Excel/PDF/in: phải dùng cùng tập dòng và cùng điều kiện lọc.
- Phân trang: lặp tiêu đề cột, tránh tách dòng tổng cộng và chữ ký không hợp lý.
- Công thức tổng: kiểm tra bằng test độc lập.

## Kế thừa
Đối chiếu mẫu thực tế của từng ứng dụng HAK trước khi xác lập tiêu chuẩn chính thức.
