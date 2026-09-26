# WebGIS Thạnh Phước – Hệ thống tra cứu quy hoạch xã Thạnh Phước

Website tĩnh (HTML/CSS/JS thuần, **không cần build step**) hiển thị bản đồ
địa chính – quy hoạch xã Thạnh Phước, dựng từ dữ liệu xuất bởi **qgis2web**.
Dự án phục vụ mục đích học tập / khóa luận tốt nghiệp.

> ⚠️ Dữ liệu chỉ mang tính chất tham khảo cho mục đích học thuật, không có
> giá trị pháp lý. Tên chủ sử dụng đất đã được ẩn danh một phần (xem mục
> [Dữ liệu & quyền riêng tư](#dữ-liệu--quyền-riêng-tư)).

## Tính năng

- **Tra cứu thửa đất** theo 3 kiểu: số tờ/thửa, tên chủ sử dụng, hoặc tọa
  độ (VN-2000 hoặc vĩ độ/kinh độ thường) — gợi ý theo thời gian thực khi gõ.
- **Thông tin chi tiết thửa đất**: diện tích, hiện trạng, chủ sử dụng, địa
  chỉ, tỷ lệ diện tích nằm trong quy hoạch (hiển thị dạng vòng tròn %) và
  chi tiết từng loại đất quy hoạch trên thửa.
- **Lớp bản đồ**: bật/tắt và chỉnh độ trong suốt độc lập cho lớp *Thửa
  đất* và *Quy hoạch*; nhận diện (identify) khi click/hover trực tiếp
  trên bản đồ.
- **Nền bản đồ**: Vệ tinh (Esri World Imagery) / Sáng / Tối.
- **Công cụ bản đồ**: định vị GPS, về toàn cảnh xã, đo khoảng cách, phóng
  to/thu nhỏ, sao chép thông tin thửa, mở chỉ đường bằng Google Maps.
- **Trang giới thiệu** (`landing.html`): giới thiệu dự án, số liệu nổi
  bật, đối tác, lời cảm ơn, FAQ.
- Giao diện responsive (desktop / tablet / mobile) và hỗ trợ accessibility
  (ARIA roles, `prefers-reduced-motion`, điều hướng bàn phím).

## Công nghệ sử dụng

- HTML / CSS / JavaScript thuần (ES5+), không framework, không bước build.
- [Leaflet 1.9.4](https://leafletjs.com/) (vendor sẵn trong `js/leaflet.js`,
  chạy hoàn toàn offline).
- Dữ liệu địa lý dạng GeoJSON xuất ra file `.js` bởi qgis2web.

## Cấu trúc thư mục

```
webgis-thanh-phuoc/
├── index.html            Trang chính – bản đồ & tra cứu
├── landing.html           Trang phụ – giới thiệu dự án
├── css/
│   ├── base.css            Design tokens (màu/ font/ reset) dùng chung
│   ├── app.css             Giao diện trang bản đồ
│   ├── landing.css         Giao diện trang giới thiệu
│   └── leaflet.css         Thư viện Leaflet
├── js/
│   ├── leaflet.js          Thư viện Leaflet 1.9.4
│   ├── colors.js           Bảng màu ký hiệu loại đất/quy hoạch
│   ├── app.js              Toàn bộ logic bản đồ / tra cứu / đo đạc
│   └── landing.js          Tương tác trang giới thiệu (menu, FAQ, marquee…)
├── data/                  4 lớp dữ liệu GeoJSON (dạng .js) xuất từ qgis2web
│   ├── THUA_DAT_2.js        Lớp thửa đất (ranh + thuộc tính hiện trạng)
│   ├── QH_Clean_v3_3.js     Lớp quy hoạch (ranh + màu loại đất)
│   ├── QH_THUA_1.js         Tỷ lệ diện tích mỗi thửa nằm trong quy hoạch
│   └── QH_CHI_TIET_0.js     Chi tiết từng loại đất quy hoạch theo thửa
├── images/                Tài nguyên hình ảnh / icon (SVG, PNG)
├── fonts/                 Font tự host (Inter, Raleway – .woff2)
├── scripts/
│   └── mask_owner_names.py Script ẩn danh tên chủ sử dụng đất
├── LICENSE
└── README.md
```

## Cách chạy

Trình duyệt chặn `fetch` khi mở trực tiếp bằng `file://`, nên cần chạy qua
một máy chủ tĩnh đơn giản:

```bash
git clone <đường-dẫn-repo-của-bạn>
cd webgis-thanh-phuoc
python3 -m http.server 8080
# rồi mở http://localhost:8080/index.html
```

Có thể dùng bất kỳ static server nào khác (VS Code "Live Server",
`npx serve`, Nginx, Apache…). Không cần backend, không cần cơ sở dữ liệu,
không cần cài đặt dependency nào.

## Dữ liệu & hệ tọa độ

- Dữ liệu thửa đất/quy hoạch dùng hệ **WGS84 (EPSG:4326)** để vẽ trên
  Leaflet.
- Ô tra cứu "Tọa độ" chấp nhận **VN-2000** (kinh tuyến trục 105°45′, múi
  chiếu 3°, k₀ = 0.9999) hoặc vĩ độ/kinh độ thường; phép chiếu Transverse
  Mercator được tự cài đặt trực tiếp trong `js/app.js`, không gọi dịch vụ
  ngoài.
- Bảng màu các loại đất/quy hoạch (`js/colors.js`) trích xuất từ style gốc
  của qgis2web.

## Bảo mật

- **CSP (Content-Security-Policy) chặt**: chỉ cho phép script cùng nguồn
  (`script-src 'self'`), chặn `object-src`/`form-action`, chỉ mở thêm
  đúng domain ảnh vệ tinh Esri.
- **Chống clickjacking**: tự phát hiện và thoát nếu trang bị nhúng trong
  `<iframe>` khác domain.
- `referrer-policy: no-referrer`; không tải script/font/ảnh từ CDN bên thứ
  ba — mọi thứ (Leaflet, font, icon) đều lưu cục bộ.
- Toàn bộ dữ liệu hiển thị đi qua `textContent`, **không dùng `innerHTML`**
  với dữ liệu động ⇒ tránh XSS. Ô tìm kiếm được lọc ký tự điều khiển và
  giới hạn độ dài.
- Không có backend/database/cookie ⇒ không có bề mặt tấn công phía server.


## Giới hạn đã biết

- Nền bản đồ *Vệ tinh* cần kết nối Internet (gọi tới
  `server.arcgisonline.com`); nền *Sáng*/*Tối* hoạt động hoàn toàn ngoại
  tuyến.
- Là sản phẩm học thuật, chưa tối ưu cho tập dữ liệu quy mô hàng triệu
  thửa (hiện tại xử lý mượt với hàng chục nghìn thửa).

## Giấy phép

Mã nguồn phát hành theo giấy phép MIT — xem file [`LICENSE`](LICENSE).
Thư viện [Leaflet](https://leafletjs.com/) đi kèm trong `js/leaflet.js`
giữ nguyên giấy phép BSD-2-Clause gốc của nó. Ảnh vệ tinh nền bản đồ: ©
Esri World Imagery. Dữ liệu trong `data/` không thuộc phạm vi giấy phép
này (xem chi tiết trong file `LICENSE`).

## Lời cảm ơn

Dự án thực hiện trong khuôn khổ khóa luận tốt nghiệp, với sự hỗ trợ dữ
liệu từ Văn phòng Đăng ký đất đai – UBND xã Thạnh Phước.
