import PageMeta from './common/PageMeta'

// Thẻ meta của riêng trang chủ, đặt ở route `index` chứ không nằm trong
// TrangChu. Lý do: TrangChu vẫn hiển thị khi route con /san-pham/:id đang mở,
// nên nếu để PageMeta bên trong nó thì trang chi tiết sẽ có HAI thẻ description
// và hai thẻ canonical chọi nhau.
function HomeMeta() {
  return (
    <PageMeta description="Cửa hàng VLXD Lý Sáu — nhà phân phối xi măng Sài Sơn. Xi măng, sắt thép, gạch, cát đá chính hãng, giao tận công trình tại Quốc Oai, Hà Nội." />
  )
}

export default HomeMeta
