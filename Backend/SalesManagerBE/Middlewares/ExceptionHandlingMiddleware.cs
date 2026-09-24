using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Exceptions;
using SalesManagerBE.Models;

namespace SalesManagerBE.Middlewares
{
    /// <summary>
    /// Middleware xử lý lỗi toàn cục (Global Exception Handling)
    /// Tự động bắt mọi Exception trong pipeline và chuẩn hóa thành phản hồi JSON đồng nhất
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogWarning("Phản hồi đã bắt đầu gửi, không thể áp dụng ExceptionHandlingMiddleware.");
                throw ex;
            }

            var (statusCode, message, errors) = MapExceptionToResponse(ex);

            // Ghi log tương ứng với mức độ nghiêm trọng
            if (statusCode >= 500)
            {
                _logger.LogError(ex, "[GlobalException] Lỗi hệ thống ({StatusCode}) khi xử lý {Method} {Path}: {Message}",
                    statusCode, context.Request.Method, context.Request.Path, ex.Message);
            }
            else
            {
                _logger.LogWarning("[GlobalException] Lỗi nghiệp vụ ({StatusCode}) tại {Method} {Path}: {Message}",
                    statusCode, context.Request.Method, context.Request.Path, message);
            }

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json; charset=utf-8";

            var detail = _env.IsDevelopment() ? ex.ToString() : null;
            var response = new ErrorResponse(
                status: statusCode,
                message: message,
                errors: errors,
                detail: detail,
                traceId: context.TraceIdentifier
            );

            await JsonSerializer.SerializeAsync(context.Response.Body, response, JsonOptions);
        }

        private static (int StatusCode, string Message, object? Errors) MapExceptionToResponse(Exception ex)
        {
            return ex switch
            {
                AppException appEx => (
                    appEx.StatusCode,
                    appEx.Message,
                    appEx.Errors
                ),

                KeyNotFoundException or FileNotFoundException => (
                    (int)HttpStatusCode.NotFound,
                    string.IsNullOrWhiteSpace(ex.Message) ? "Không tìm thấy tài nguyên yêu cầu." : ex.Message,
                    null
                ),

                UnauthorizedAccessException => (
                    (int)HttpStatusCode.Unauthorized,
                    string.IsNullOrWhiteSpace(ex.Message) ? "Không có quyền truy cập." : ex.Message,
                    null
                ),

                BadHttpRequestException or ArgumentException or FormatException => (
                    (int)HttpStatusCode.BadRequest,
                    string.IsNullOrWhiteSpace(ex.Message) ? "Yêu cầu không hợp lệ." : ex.Message,
                    null
                ),

                DbUpdateConcurrencyException => (
                    (int)HttpStatusCode.Conflict,
                    "Dữ liệu đã bị thay đổi bởi phiên làm việc khác. Vui lòng làm mới trang và thử lại.",
                    null
                ),

                DbUpdateException => (
                    (int)HttpStatusCode.BadRequest,
                    "Không thể lưu hoặc xóa dữ liệu này vì vi phạm ràng buộc dữ liệu liên quan trong hệ thống.",
                    null
                ),

                // Lỗi hệ thống không lường trước (500)
                _ => (
                    (int)HttpStatusCode.InternalServerError,
                    "Lỗi hệ thống",
                    null
                )
            };
        }
    }
}
