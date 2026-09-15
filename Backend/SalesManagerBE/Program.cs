using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Minio;
using SalesManagerBE.Data;
using SalesManagerBE.Hubs;
using SalesManagerBE.Models;
using SalesManagerBE.Services;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
    o.MultipartBodyLengthLimit = 5 * 1024 * 1024);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? builder.Configuration["Cors:AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy => {
        policy.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});

builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "Jwt:Key chưa được cấu hình. Đặt qua appsettings.Development.json (chỉ máy dev, không commit) " +
        "hoặc biến môi trường Jwt__Key ở các môi trường khác.");
}
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SalesManagerBE";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SalesManagerFE";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrEmpty(context.Token) &&
                context.Request.Cookies.TryGetValue("access_token", out var cookieToken) &&
                !string.IsNullOrEmpty(cookieToken))
            {
                context.Token = cookieToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IMinioService, MinioService>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();
builder.Services.AddScoped<IProductExcelService, ProductExcelService>();
builder.Services.AddScoped<IStockExcelService, StockExcelService>();
builder.Services.AddSingleton<ChatPresenceService>();

var minioEndpoint = builder.Configuration["Minio:Endpoint"] ?? "localhost:9000";
var minioAccessKey = builder.Configuration["Minio:AccessKey"];
var minioSecretKey = builder.Configuration["Minio:SecretKey"];
if (string.IsNullOrWhiteSpace(minioAccessKey) || string.IsNullOrWhiteSpace(minioSecretKey))
{
    minioAccessKey = "minioadmin";
    minioSecretKey = "minioadmin";
    if (!builder.Environment.IsDevelopment())
    {
        Console.Error.WriteLine(
            "CẢNH BÁO: Minio:AccessKey/Minio:SecretKey chưa được cấu hình, đang dùng thông tin đăng nhập " +
            "mặc định của MinIO (minioadmin). Hãy đặt qua biến môi trường Minio__AccessKey/Minio__SecretKey.");
    }
}
var minioUseSsl = builder.Configuration.GetValue("Minio:UseSSL", false);

builder.Services.AddMinio(configureSource => configureSource
    .WithEndpoint(minioEndpoint)
    .WithCredentials(minioAccessKey, minioSecretKey)
    .WithSSL(minioUseSsl));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/chathub");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
    if (adminRole != null && !await db.Users.AnyAsync(u => u.RoleId == adminRole.Id))
    {
        var bootstrapPassword = builder.Configuration["AdminBootstrap:Password"];
        if (!string.IsNullOrWhiteSpace(bootstrapPassword))
        {
            db.Users.Add(new User
            {
                Username = "admin",
                PasswordHash = AuthService.HashPassword(bootstrapPassword),
                FullName = "Quản trị viên",
                RoleId = adminRole.Id,
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
            app.Logger.LogWarning(
                "Đã tạo tài khoản admin đầu tiên (username: admin) từ AdminBootstrap:Password. " +
                "Hãy đăng nhập và đổi mật khẩu ngay, sau đó gỡ AdminBootstrap:Password khỏi cấu hình.");
        }
        else
        {
            app.Logger.LogWarning(
                "Chưa có tài khoản Admin nào trong hệ thống. Đặt biến môi trường AdminBootstrap__Password " +
                "(hoặc AdminBootstrap:Password trong appsettings) rồi khởi động lại ứng dụng để tạo tài khoản admin đầu tiên.");
        }
    }
}

app.Run();
