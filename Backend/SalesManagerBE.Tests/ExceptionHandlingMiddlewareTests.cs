using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using SalesManagerBE.Exceptions;
using SalesManagerBE.Middlewares;
using SalesManagerBE.Models;
using Xunit;

namespace SalesManagerBE.Tests
{
    public class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Production";
        public string ApplicationName { get; set; } = "SalesManagerBE";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = null!;
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    public class ExceptionHandlingMiddlewareTests
    {
        private readonly TestWebHostEnvironment _env;
        private readonly NullLogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddlewareTests()
        {
            _env = new TestWebHostEnvironment { EnvironmentName = "Production" };
            _logger = new NullLogger<ExceptionHandlingMiddleware>();
        }

        private static (DefaultHttpContext Context, MemoryStream BodyStream) CreateHttpContext()
        {
            var context = new DefaultHttpContext();
            var stream = new MemoryStream();
            context.Response.Body = stream;
            return (context, stream);
        }

        private static async Task<ErrorResponse> ReadResponseBodyAsync(MemoryStream stream)
        {
            stream.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(stream);
            var json = await reader.ReadToEndAsync();
            return JsonSerializer.Deserialize<ErrorResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            })!;
        }

        [Fact]
        public async Task NormalRequest_ShouldPassThrough_WithoutException()
        {
            var (context, _) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (innerContext) =>
                {
                    innerContext.Response.StatusCode = 200;
                    return Task.CompletedTask;
                },
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal(200, context.Response.StatusCode);
        }

        [Fact]
        public async Task UnhandledException_ShouldReturn500_WithLoiHeThongMessage()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new InvalidOperationException("Something bad crashed the server!"),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);
            Assert.Contains("application/json", context.Response.ContentType);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(500, errorResponse.Status);
            Assert.Equal("Lỗi hệ thống", errorResponse.Message);
            Assert.NotNull(errorResponse.TraceId);
        }

        [Fact]
        public async Task BadRequestException_ShouldReturn400_WithCustomMessage()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new BadRequestException("Dữ liệu đầu vào không hợp lệ."),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(400, errorResponse.Status);
            Assert.Equal("Dữ liệu đầu vào không hợp lệ.", errorResponse.Message);
        }

        [Fact]
        public async Task NotFoundException_ShouldReturn404_WithCustomMessage()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new NotFoundException("Không tìm thấy sản phẩm có ID 999."),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(404, errorResponse.Status);
            Assert.Equal("Không tìm thấy sản phẩm có ID 999.", errorResponse.Message);
        }

        [Fact]
        public async Task KeyNotFoundException_ShouldReturn404()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new KeyNotFoundException("Không tìm thấy danh mục."),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(404, errorResponse.Status);
            Assert.Equal("Không tìm thấy danh mục.", errorResponse.Message);
        }

        [Fact]
        public async Task UnauthorizedException_ShouldReturn401()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new UnauthorizedException("Phiên đăng nhập đã hết hạn."),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.Unauthorized, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(401, errorResponse.Status);
            Assert.Equal("Phiên đăng nhập đã hết hạn.", errorResponse.Message);
        }

        [Fact]
        public async Task ForbiddenException_ShouldReturn403()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new ForbiddenException("Chỉ Quản trị viên mới được phép xóa."),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.Forbidden, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(403, errorResponse.Status);
            Assert.Equal("Chỉ Quản trị viên mới được phép xóa.", errorResponse.Message);
        }

        [Fact]
        public async Task ConflictException_ShouldReturn409()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new ConflictException("Mã sản phẩm đã tồn tại."),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.Conflict, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(409, errorResponse.Status);
            Assert.Equal("Mã sản phẩm đã tồn tại.", errorResponse.Message);
        }

        [Fact]
        public async Task DbUpdateException_ShouldReturn400_WithConstraintMessage()
        {
            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new DbUpdateException("Foreign key violation"),
                logger: _logger,
                env: _env
            );

            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.Equal(400, errorResponse.Status);
            Assert.Contains("ràng buộc dữ liệu", errorResponse.Message);
        }

        [Fact]
        public async Task DevelopmentEnvironment_ShouldIncludeDetailStack()
        {
            var devEnv = new TestWebHostEnvironment { EnvironmentName = "Development" };

            var (context, stream) = CreateHttpContext();
            var middleware = new ExceptionHandlingMiddleware(
                next: (_) => throw new Exception("Test dev crash"),
                logger: _logger,
                env: devEnv
            );

            await middleware.InvokeAsync(context);

            Assert.Equal(500, context.Response.StatusCode);

            var errorResponse = await ReadResponseBodyAsync(stream);
            Assert.NotNull(errorResponse.Detail);
            Assert.Contains("Test dev crash", errorResponse.Detail);
        }
    }
}
