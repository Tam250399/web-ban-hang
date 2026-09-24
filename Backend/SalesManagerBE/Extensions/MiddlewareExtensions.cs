using SalesManagerBE.Middlewares;

namespace SalesManagerBE.Extensions
{
    public static class MiddlewareExtensions
    {
        /// <summary>
        /// Kích hoạt Middleware xử lý lỗi tập trung toàn cục
        /// </summary>
        public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        {
            return app.UseMiddleware<ExceptionHandlingMiddleware>();
        }
    }
}
