using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesManagerBE.Services;

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
        /// Tải ảnh lên lưu trữ MinIO và trả về URL của hình ảnh
        /// </summary>
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File không hợp lệ." });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File không được vượt quá 5MB." });

            var header = new byte[12];
            int bytesRead;
            using (var headerStream = file.OpenReadStream())
            {
                bytesRead = await headerStream.ReadAsync(header.AsMemory(0, header.Length));
            }

            var detected = DetectImageType(header, bytesRead);
            if (detected == null)
                return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, png, webp, gif)." });

            var objectName = $"{Guid.NewGuid()}{detected.Value.Extension}";

            using var uploadStream = file.OpenReadStream();
            var url = await _minio.UploadFileAsync(Bucket, objectName, uploadStream, detected.Value.ContentType);

            return Ok(new { url });
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
