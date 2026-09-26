# WebGIS Thạnh Phước – Hệ thống tra cứu quy hoạch xã Thạnh Phước

Website tĩnh (HTML/CSS/JS thuần, không build step) hiển thị bản đồ địa
chính – quy hoạch xã Thạnh Phước, dựng từ dữ liệu xuất bởi **qgis2web**
và giao diện theo thiết kế Figma *"Webgis Thanh Phuoc Demo"*.

> ⚠️ Dữ liệu chỉ phục vụ khóa luận tốt nghiệp / nghiên cứu học thuật,
> **không có giá trị pháp lý**.

## 1. Cấu trúc thư mục

```
webgis/
├── index.html          Trang chính – bản đồ & tra cứu (mở lên là thấy ngay)
├── landing.html         Trang phụ – giới thiệu dự án (bấm logo trên bản đồ để tới)
├── css/
│   ├── base.css          Design tokens (màu/ font/ reset) dùng chung 2 trang
│   ├── app.css           Giao diện trang bản đồ
│   ├── landing.css       Giao diện trang giới thiệu
│   └── leaflet.css       Thư viện Leaflet (giữ nguyên từ gói qgis2web)
├── js/
│   ├── leaflet.js        Thư viện Leaflet 1.9.4 (giữ nguyên, chạy offline)
│   ├── colors.js         Bảng màu ký hiệu (trích xuất từ style gốc qgis2web)
│   ├── app.js            Toàn bộ logic bản đồ / tra cứu / đo đạc
│   └── landing.js        Tương tác trang giới thiệu (menu, FAQ, marquee, đếm số)
├── data/                 4 lớp dữ liệu GeoJSON (dạng .js) xuất từ qgis2web
│   ├── THUA_DAT_2.js      Lớp thửa đất (ranh + thuộc tính hiện trạng)
│   ├── QH_Clean_v3_3.js   Lớp quy hoạch (ranh + màu loại đất)
│   ├── QH_THUA_1.js       Tỷ lệ diện tích mỗi thửa nằm trong quy hoạch
│   └── QH_CHI_TIET_0.js   Chi tiết từng loại đất quy hoạch theo thửa
├── images/               Toàn bộ 36 tài nguyên hình từ Figma (đã dùng hết)
└── fonts/                Chỗ đặt font tự host (tùy chọn – xem fonts/README.txt)
```

Không có tệp `node_modules`, không cần build: mở thẳng bằng máy chủ web
tĩnh là chạy được.

## 2. Cách chạy

Trình duyệt chặn `fetch`/module khi mở trực tiếp bằng `file://`, và ảnh
vệ tinh cần tải qua HTTP, nên hãy chạy qua một máy chủ tĩnh đơn giản:

```bash
cd webgis
python3 -m http.server 8080
# rồi mở http://localhost:8080/index.html
```

Hoặc dùng bất kỳ static server nào khác (VS Code "Live Server", `npx serve`,
Nginx, Apache…). Không cần cấu hình backend, không cần cơ sở dữ liệu.

## 3. Trang chính (`index.html`) – Tra cứu

- **Mở lên là vào ngay bản đồ tra cứu** (landing chỉ là trang phụ, vào qua
  logo góc dưới phải).
- **Tra cứu** theo 3 kiểu (tab căn đều, có thanh trượt xanh chỉ mục đang
  chọn): Số tờ/thửa, Chủ sử dụng, Tọa độ (VN‑2000 hoặc vĩ độ/kinh độ).
  Gõ tới đâu gợi ý hiện tới đó; bấm kết quả hoặc bấm thẳng vào thửa trên
  bản đồ để xem **Thông tin thửa đất**, **Tỷ lệ quy hoạch** (thanh %),
  và **Chi tiết quy hoạch** theo từng loại đất.
- **Nút quay lại** nằm hẳn bên ngoài panel, ở góc trên bên phải của panel
  (không che nội dung panel).
- **Thanh tỉ lệ** (scale bar) của bản đồ luôn được panel tra cứu tránh ra,
  không bao giờ bị che.
- **Lớp bản đồ**: bật/tắt độc lập lớp *Thửa đất* / *Quy hoạch*, kéo thanh
  trượt để chỉnh độ trong suốt từng lớp (thanh trượt dùng đúng khung
  `thanhdotrongsuot.svg` gốc, phần đã kéo được tô màu xanh thương hiệu).
- **Nền bản đồ**: Vệ tinh (Esri World Imagery) / Sáng / Tối.
- **Công cụ khác**: định vị GPS, về toàn cảnh xã, đo khoảng cách (m/km),
  phóng to/thu nhỏ.
- **Sao chép thông tin** thửa đất dạng văn bản; **Chỉ đường** mở Google Maps
  tới tâm thửa.
- Toàn bộ giao diện responsive: desktop, tablet, và điện thoại (panel tra
  cứu chuyển thành cửa sổ trượt ở cạnh dưới màn hình).

## 4. Trang phụ (`landing.html`) – Giới thiệu

Về Website (giới thiệu + số liệu nổi bật) → Chức năng (4 nhóm công cụ) →
Đối tác (dải logo chạy vòng lặp mượt, không dừng khi rê chuột) → **Lời
cảm ơn** (tách hẳn thành khối riêng, không gộp với phần Đối tác) → Miễn
trừ trách nhiệm → FAQ. Thanh điều hướng và footer đã được thu hẹp chiều
rộng so với bản nháp để cân đối với phần nội dung.

## 5. Dữ liệu & hệ tọa độ

- Dữ liệu thửa đất/quy hoạch giữ nguyên từ gói qgis2web (EPSG:4326 –
  WGS84 – để vẽ trên Leaflet).
- Ô "Tọa độ" trong tra cứu chấp nhận **VN‑2000** (kinh tuyến trục 105°45′,
  múi 3°, k₀ = 0.9999 – đúng thông số ghi trên trang giới thiệu) hoặc
  vĩ độ/kinh độ thường; việc đổi tọa độ tính trực tiếp bằng công thức
  Transverse Mercator trong `js/app.js`, không gọi dịch vụ ngoài.
- Màu sắc các loại đất/quy hoạch được trích xuất lại từ đúng bảng style
  (`style_THUA_DAT_2_0`, `style_QH_Clean_v3_3_0`) trong `index.html` gốc
  của qgis2web, lưu ở `js/colors.js` – không bịa màu.

## 6. Về hình ảnh & thiết kế

- **Toàn bộ 36 tệp trong `images/`** của bản gốc đều được sử dụng — không
  thêm bất kỳ hình ảnh/icon nào từ bên ngoài.
- Các icon có hậu tố **"overlay"** (`Four_star_Overlay.svg`, `MapOverlay.svg`)
  được dùng làm **mask** (SVG `<mask>`) phủ màu thương hiệu lên khối hình
  học ở trang giới thiệu, đúng như hướng dẫn.
- Các nút bật/tắt, thanh trượt, nền panel… đều dùng đúng ảnh
  `Button On/Off.svg`, `LayerControlPanel.svg`, `thanhdotrongsuot.svg`,
  `LayerPanelBackground.svg`, `SearchPanel ContentBackground.svg`… thay vì
  vẽ lại bằng CSS thuần.
- Font chữ: cấu hình sẵn cho **Raleway** (chữ) và **Inter** (số liệu) theo
  design system, tự động dự phòng sang font hệ thống nếu chưa có file
  font (xem `fonts/README.txt`) — không gọi Google Fonts CDN để tối ưu
  bảo mật/quyền riêng tư ngoại tuyến.

## 7. Bảo mật & an ninh mạng đã áp dụng

- **CSP chặt (`Content-Security-Policy`)** trên cả 2 trang: chỉ cho phép
  script cùng nguồn (`script-src 'self'`), chặn `object-src`, `frame`,
  không cho nhúng form ngoài; trang bản đồ chỉ mở thêm đúng domain ảnh vệ
  tinh Esri (`img-src ... https://server.arcgisonline.com`).
- **Chống clickjacking**: script tự kiểm tra nếu trang bị nhúng trong
  `<iframe>` khác domain thì tự thoát ra ngoài; nếu không gỡ được (bị
  chặn bởi CSP của trang nhúng) thì tự xoá nội dung trang.
- **`referrer-policy: no-referrer`**, không tải bất kỳ script/font/ảnh nào
  từ CDN của bên thứ ba (Leaflet, font, icon… đều lưu cục bộ).
- Toàn bộ nội dung hiển thị từ dữ liệu (tên chủ sử dụng, địa chỉ, ô tìm
  kiếm…) được ghi ra DOM bằng `textContent`, **không dùng `innerHTML`**
  với dữ liệu động → tránh XSS. Ô tìm kiếm được lọc ký tự điều khiển và
  giới hạn độ dài trước khi xử lý.
- Không có backend, không cơ sở dữ liệu, không cookie, không thu thập dữ
  liệu người dùng ⇒ không có bề mặt tấn công phía máy chủ.
- Khi mở bằng `file://` (không qua server), script tự phát hiện và ẩn các
  hiệu ứng CSS mask không được trình duyệt hỗ trợ ở chế độ này, tránh vỡ
  giao diện.

## 8. Các điểm đã chỉnh theo phản hồi

1. `index.html` (trang tra cứu) là trang mở lên thấy ngay; `landing.html`
   là trang phụ, vào qua logo ở góc bản đồ.
2. Thanh 3 tab tra cứu dùng `grid 3 cột đều` + thanh trượt nền, không còn
   bị lệch ở bất kỳ độ rộng nào.
3. Nút quay lại (`.back-btn`) đặt tuyệt đối **ngoài** panel, tại góc trên
   bên phải của panel.
4. Panel tra cứu không còn che thanh tỉ lệ: khi panel mở, thanh tỉ lệ tự
   dịch sang phải, ra ngoài panel.
5. `thanhdotrongsuot.svg` được dùng làm khung thanh trượt, phần đã kéo
   (`.slider__fill`) tô gradient màu thương hiệu chồng lên trên.
6. "Đối tác" và "Lời cảm ơn" là 2 khối `<section>` riêng biệt, có tiêu đề
   và nội dung khác nhau (Lời cảm ơn nêu tên trường, viện, GVHD, đơn vị
   hỗ trợ dữ liệu).
7. Dải logo đối tác dùng CSS animation tuyến tính vô hạn (nhân đôi danh
   sách để loop liền mạch), khoảng cách giữa logo được giãn rộng
   (`--gap: 64px`), và **không dừng lại khi rê chuột vào** (chỉ phóng to
   nhẹ logo đang hover, track vẫn chạy).
8. Thanh điều hướng (`.nav__bar`) và footer (`.footer__bar`) được giới
   hạn chiều rộng (`min(980px, 92vw)` / `min(760px, 92vw)`) thay vì kéo
   hết chiều ngang màn hình.

## 9. Giới hạn đã biết

- Ảnh nền vệ tinh cần kết nối Internet (gọi tới `server.arcgisonline.com`
  qua HTTPS); nền *Sáng*/*Tối* hoạt động hoàn toàn ngoại tuyến.
- Đây là sản phẩm học thuật, chưa tối ưu cho tập dữ liệu hàng triệu thửa;
  với ~17.821 thửa hiện tại, việc tra cứu/định vị trên máy khách vẫn mượt.

## 10. Round 3 – sửa theo phản hồi mới nhất

1. **Nút back**: bỏ khối tròn nền trắng phía sau icon, chỉ còn icon +
   hiệu ứng trượt nhẹ khi hover.
2. **Gợi ý "tìm theo chủ"**: tên chủ sử dụng là dòng chính (in đậm), số
   tờ/số thửa chuyển xuống dòng phụ bên dưới (`showResults(..., byOwner)`
   trong `app.js`).
3. **Tiêu đề khối thông tin** ("Thửa đất", "Tỷ lệ quy hoạch", "Chi tiết
   quy hoạch"): `.block__title` đổi sang in đậm (`--fw-extrabold`).
4. **Tỷ lệ quy hoạch**: đổi từ thanh ngang sang **vòng tròn** (SVG ring,
   `stroke-dashoffset` theo %), số % hiển thị ở tâm vòng tròn.
5. **Bỏ tọa độ X, Y** khỏi bảng "Thông tin thửa đất" (vẫn giữ hệ quy đổi
   VN-2000 nội bộ cho nút "Sao chép thông tin").
6. **Chọn được thửa quy hoạch**: thêm chỉ mục (bbox) + point-in-polygon
   riêng cho lớp `QH_Clean_v3_3` (`findQhAt`, `identify()`). Khi lớp quy
   hoạch **bật**, việc rê/click trên bản đồ ưu tiên nhận diện thửa quy
   hoạch trước thửa đất; lớp quy hoạch vẫn **tắt mặc định** lúc vào trang.
   Panel mới `#qhinfo` hiển thị Tên, Mã quy hoạch, Thông tin thêm
   (`TEN_LĐ_QH`, `MA_LĐ_QH`, `TT_QH`), có nút sao chép riêng.
7. **Trang landing**:
   - Khối "Về Website": bản đồ minh họa chuyển hẳn sang cột phải
     (`grid-template-columns`), nội dung chữ căn trái; xếp chồng 1 cột
     trên màn hình ≤900px.
   - Bỏ toàn bộ icon ngôi sao (`SpecialStar.svg`) ở khối "Chức năng" và
     "Lời cảm ơn".
   - Sửa lỗi kỹ thuật khiến marquee đối tác giật khi lặp: trước đây mỗi
     nhóm logo tự chạy animation riêng (`.marquee__group`) nên tới điểm
     lặp bị "nhảy khựng"; nay chỉ animate `.marquee__track` cha
     (translateX 0 → -50%) để 2 nhóm luôn đồng bộ tuyệt đối. Khoảng cách
     giữa logo tăng từ 64px lên 96px.
   - "Lời cảm ơn": tiêu đề chuyển sang chữ đen (bỏ class `.hl-1` xanh);
     đồng bộ khung logo (đặc biệt logo trường IUH đang bị lệch) về cùng
     chiều cao/canh giữa; thu gọn padding/gap cho bố cục gọn hơn.
   - Xóa hẳn khối "Tuyên bố miễn trừ trách nhiệm".
8. **Giảm lag**: nguyên nhân đúng là hiệu ứng bay mượt (`flyToBounds`)
   mỗi lần chọn thửa — trong lúc bay, canvas Leaflet phải vẽ lại toàn bộ
   ~17.821 thửa đất ở mỗi khung hình animation. Đã bỏ hiệu ứng này, thay
   bằng `fitBounds` (nhảy tức thời, chỉ vẽ lại canvas 1 lần).

## 11. Round 4 – sửa theo phản hồi mới nhất

1. **Nút CTA "Mở Bản Đồ Tra Cứu"**: nút dùng ảnh nền cố định 214×66px với
   `object-fit: contain`, khi text dài hơn (so với "Vào WebGIS" ở nav) box
   giãn ra nhưng ảnh nền không giãn theo → chữ tràn ra ngoài viền nút. Đã
   bỏ ảnh nền, vẽ nút bằng CSS (border-radius + gradient) để luôn khít
   theo độ dài chữ, không còn giới hạn cố định.
2. **Khoảng trống trong marquee "Đối tác"**: do chỉ nhân đôi 1 lần (2
   nhóm logo) trong khi khung nhìn (`.marquee`) không nằm trong
   `.container` nên rộng hơn 2 nhóm logo cộng lại trên màn hình lớn, dẫn
   đến khoảng trắng trống giữa vòng lặp. Đã sửa `landing.js` để đo chiều
   rộng 1 nhóm rồi tự nhân bản đủ số lượng lấp kín khung nhìn, và đổi
   keyframe CSS dịch chuyển đúng bằng chiều rộng 1 nhóm (đo thực tế qua
   biến `--marquee-shift`) thay vì cố định "-50%" (chỉ đúng khi có đúng
   2 nhóm).
3. **Bố cục "Lời cảm ơn" trên desktop**: đổi lưới từ 1 hàng 4 cột (2 thẻ
   có logo to, 2 thẻ chỉ có chữ trông trống trải, mất cân đối) sang lưới
   2×2 cân đối hơn, giới hạn `max-width` để không bị dàn quá rộng trên
   màn hình lớn. Thêm icon tròn (`.thanks__badge`) cho 2 thẻ chỉ có chữ
   (Giảng viên hướng dẫn, Cơ quan hỗ trợ dữ liệu) để cân bằng thị giác
   với 2 thẻ có logo.
4. **Thêm thông tin cơ quan hỗ trợ**: thẻ "Cơ quan hỗ trợ dữ liệu" giờ
   có 2 dòng — "Văn phòng Đăng ký đất đai" và dòng phụ "Văn phòng ĐKĐĐ –
   UBND xã Thạnh Phước".
5. **Xóa four_star_overlay trong FAQ**: bỏ 5 khối `<svg class="faq__deco">`
   (dùng mask từ `Four_star_Overlay.svg`) từng nằm ở góc mỗi câu hỏi FAQ;
   giữ nguyên icon `SpecialStar.svg` cạnh câu hỏi (không thuộc phạm vi
   yêu cầu lần này) và mask `mkStar` (vẫn được các `.stat__star` ở hero
   dùng).

## 12. Round 5 – sửa theo phản hồi mới nhất

1. **Vòng tròn "Tỷ lệ quy hoạch"**: thu nhỏ (120px → 92px), đổi màu nét
   vẽ sang xanh đậm hơn (`#4c7a1f` thay vì `--green-2` sáng), thêm hiệu
   ứng tỏa glow quanh vòng tròn (`drop-shadow` kép). Hai dòng "Quy hoạch:
   …" và "Ngoài quy hoạch: …" tách thành 2 dòng riêng (trước đây nối
   chung 1 dòng bằng dấu "·"), có khoảng cách dòng rõ ràng.
2. **Nút "Vào WebGIS" trên navigation bar**: ở bản sửa trước, khi viết
   lại `.cta` bằng CSS (bỏ ảnh nền) để chữa lỗi tràn chữ ở nút lớn, nút
   nav vô tình bị to gần bằng nút CTA lớn ở hero. Đã thu nhỏ lại rõ rệt
   (44px cao, padding 20px, chữ 14px, bóng đổ nhẹ hơn) để phân biệt hẳn
   với nút CTA lớn "Mở Bản Đồ Tra Cứu".

## 13. Đưa lên GitHub

Project đã được `git init` sẵn (nhánh `main`, có commit đầu tiên) và
kèm `.gitignore` + `.gitattributes`. Sau khi giải nén, chỉ cần:

```bash
cd webgis-thanh-phuoc
git remote add origin https://github.com/<tên-tài-khoản>/<tên-repo>.git
git push -u origin main
```

Nếu muốn host luôn bằng **GitHub Pages**: vào Settings → Pages của repo,
chọn nhánh `main`, thư mục `/ (root)`. Trang chính sẽ ở
`https://<tên-tài-khoản>.github.io/<tên-repo>/` (mở `index.html` — bản
đồ tra cứu) và `.../landing.html` cho trang giới thiệu.

### Về thư mục `fonts/`

**Không bắt buộc.** Nếu để trống (chỉ có `fonts/README.txt`), site vẫn
chạy bình thường — CSS có khai báo `local("Raleway")`/`local("Inter")`
và font hệ thống dự phòng (Segoe UI/Helvetica/Arial), nhờ
`font-display: swap` nên không lỗi, không màn hình trắng chờ font.
Đây là lựa chọn tự host thay vì gọi Google Fonts CDN, đúng theo yêu cầu
bảo mật/không phụ thuộc bên thứ ba khi tải trang.

Nếu muốn đúng 100% font thiết kế trên Figma, tải 2 file:
- `Raleway` (Variable Font, giấy phép SIL OFL) tại
  fonts.google.com/specimen/Raleway → mục "Get font" → chọn bản
  Variable/vf → xuất ra `.woff2` — đặt tên đúng
  `fonts/Raleway-Variable.woff2`.
- `Inter` (Variable Font) tại fonts.google.com/specimen/Inter → tương
  tự — đặt tên đúng `fonts/Inter-Variable.woff2`.

Google Fonts trên web thường cho tải `.ttf`; nếu chỉ có `.ttf`, có thể
đổi tên trực tiếp thành `.woff2` **không** hoạt động (khác định dạng
nén) — cần convert thật sự (ví dụ trang `cloudconvert.com` hoặc lệnh
`fonttools varLib.instancer`/`woff2_compress`). Cách nhanh nhất: dùng
google-webfonts-helper (gwfh.mranftl.com) hoặc trang
fontsource.org, chọn Raleway/Inter, tải sẵn bản `.woff2`. Sau khi có 2
file, bỏ vào đúng thư mục `fonts/` với đúng tên ở trên rồi commit —
không cần sửa gì thêm trong CSS.
