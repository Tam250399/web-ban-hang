using Microsoft.AspNetCore.Mvc;
using SalesManagerBE.Services;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IMinioService _minio;
        private const string Bucket = "products";

        public UploadController(IMinioService minio) { _minio = minio; }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File không hợp lệ." });

            var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!allowed.Contains(file.ContentType))
                return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, png, webp, gif)." });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File không được vượt quá 5MB." });

            var ext = Path.GetExtension(file.FileName);
            var objectName = $"{Guid.NewGuid()}{ext}";

            using var stream = file.OpenReadStream();
            var url = await _minio.UploadFileAsync(Bucket, objectName, stream, file.ContentType);

            return Ok(new { url });
        }
    }
}
