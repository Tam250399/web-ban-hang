using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesManagerBE.Exceptions;
using SalesManagerBE.Services;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly IMinioService _minio;
        private const string Bucket = "products";

        private static readonly (string ContentType, string Extension, byte[][] Signatures)[] AllowedImageSignatures =
        {
            ("image/jpeg", ".jpg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } }),
            ("image/png",  ".png", new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } }),
            ("image/gif",  ".gif", new[] { new byte[] { 0x47, 0x49, 0x46, 0x38, 0x37, 0x61 }, new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39, 0x61 } }),
        };

        public UploadController(IMinioService minio) { _minio = minio; }

        [HttpPost("image")]
        /// <summary>
        /// Tải ảnh lên, tự động tối ưu hóa và chuyển đổi sang định dạng WebP (giảm 50-70% dung lượng), sau đó lưu vào MinIO
        /// </summary>
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new BadRequestException("File không hợp lệ.");

            if (file.Length > 10 * 1024 * 1024)
                throw new BadRequestException("File không được vượt quá 10MB.");

            var header = new byte[12];
            int bytesRead;
            using (var headerStream = file.OpenReadStream())
            {
                bytesRead = await headerStream.ReadAsync(header.AsMemory(0, header.Length));
            }

            var detected = DetectImageType(header, bytesRead);
            if (detected == null)
                throw new BadRequestException("Chỉ chấp nhận file ảnh (jpg, png, webp, gif).");

            Stream uploadStream;
            string contentType;
            string objectName;

            try
            {
                using var inputStream = file.OpenReadStream();
                using var image = await Image.LoadAsync(inputStream);

                // Giới hạn kích thước ảnh tối đa 1920x1920 để tối ưu dung lượng hiển thị
                if (image.Width > 1920 || image.Height > 1920)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = new Size(1920, 1920),
                        Mode = ResizeMode.Max
                    }));
                }

                var outputStream = new MemoryStream();
                var encoder = new WebpEncoder
                {
                    Quality = 80,
                    FileFormat = WebpFileFormatType.Lossy
                };

                await image.SaveAsWebpAsync(outputStream, encoder);
                outputStream.Seek(0, SeekOrigin.Begin);

                uploadStream = outputStream;
                contentType = "image/webp";
                objectName = $"{Guid.NewGuid()}.webp";
            }
            catch
            {
                // Fallback nếu không convert được (ví dụ gif động nhiều frame)
                uploadStream = file.OpenReadStream();
                contentType = detected.Value.ContentType;
                objectName = $"{Guid.NewGuid()}{detected.Value.Extension}";
            }

            using (uploadStream)
            {
                var url = await _minio.UploadFileAsync(Bucket, objectName, uploadStream, contentType);
                return Ok(new { url });
            }
        }

        private static (string ContentType, string Extension)? DetectImageType(byte[] header, int length)
        {
            foreach (var (contentType, extension, signatures) in AllowedImageSignatures)
            {
                foreach (var signature in signatures)
                {
                    if (length >= signature.Length && header.AsSpan(0, signature.Length).SequenceEqual(signature))
                        return (contentType, extension);
                }
            }

            if (length >= 12 &&
                header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F' &&
                header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P')
                return ("image/webp", ".webp");

            return null;
        }
    }
}
