using System.Net;

namespace SalesManagerBE.Exceptions
{
    /// <summary>
    /// Lớp Exception cơ sở cho các lỗi nghiệp vụ trong hệ thống
    /// </summary>
    public class AppException : Exception
    {
        public int StatusCode { get; }
        public object? Errors { get; }

        public AppException(string message, int statusCode = (int)HttpStatusCode.BadRequest, object? errors = null)
            : base(message)
        {
            StatusCode = statusCode;
            Errors = errors;
        }

        public AppException(string message, Exception innerException, int statusCode = (int)HttpStatusCode.BadRequest, object? errors = null)
            : base(message, innerException)
        {
            StatusCode = statusCode;
            Errors = errors;
        }
    }

    /// <summary>
    /// Lỗi yêu cầu không hợp lệ (400 Bad Request)
    /// </summary>
    public class BadRequestException : AppException
    {
        public BadRequestException(string message, object? errors = null)
            : base(message, (int)HttpStatusCode.BadRequest, errors)
        {
        }
    }

    /// <summary>
    /// Lỗi không tìm thấy tài nguyên (404 Not Found)
    /// </summary>
    public class NotFoundException : AppException
    {
        public NotFoundException(string message)
            : base(message, (int)HttpStatusCode.NotFound)
        {
        }
    }

    /// <summary>
    /// Lỗi chưa đăng nhập hoặc token không hợp lệ (401 Unauthorized)
    /// </summary>
    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message = "Phiên làm việc không hợp lệ hoặc đã hết hạn.")
            : base(message, (int)HttpStatusCode.Unauthorized)
        {
        }
    }

    /// <summary>
    /// Lỗi không có quyền truy cập (403 Forbidden)
    /// </summary>
    public class ForbiddenException : AppException
    {
        public ForbiddenException(string message = "Bạn không có quyền thực hiện thao tác này.")
            : base(message, (int)HttpStatusCode.Forbidden)
        {
        }
    }

    /// <summary>
    /// Lỗi xung đột dữ liệu (409 Conflict)
    /// </summary>
    public class ConflictException : AppException
    {
        public ConflictException(string message)
            : base(message, (int)HttpStatusCode.Conflict)
        {
        }
    }
}
