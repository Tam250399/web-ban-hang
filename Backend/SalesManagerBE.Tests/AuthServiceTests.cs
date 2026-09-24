using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;
using SalesManagerBE.Services;

namespace SalesManagerBE.Tests;

public class AuthServiceTests
{
    private static (AppDbContext Context, AuthService Service, TwoFactorService TwoFactor) CreateTestServices()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        context.Roles.AddRange(
            new Role { Id = 1, RoleName = "Admin" },
            new Role { Id = 2, RoleName = "Customer" },
            new Role { Id = 3, RoleName = "Staff" }
        );
        context.SaveChanges();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestKey_For_Unit_Test_123456_This_Is_A_Very_Long_Key",
                ["TwoFactor:AllowDemoCode"] = "true"
            })
            .Build();

        var twoFactor = new TwoFactorService(
            new Microsoft.Extensions.Logging.Abstractions.NullLogger<TwoFactorService>(),
            config);

        var service = new AuthService(context, config, twoFactor);

        return (context, service, twoFactor);
    }

    [Fact]
    public async Task RegisterAndLogin_ShouldSucceed_WithValidCredentials()
    {
        var (context, service, _) = CreateTestServices();

        var registerResult = await service.RegisterAsync(new RegisterDto
        {
            Username = "alice",
            Password = "123456",
            FullName = "Alice Nguyen",
            Email = "alice@example.com",
            PhoneNumber = "0900000000"
        });

        Assert.True(registerResult.Success);
        Assert.NotNull(registerResult.User);

        var loginResult = await service.LoginAsync(new LoginDto
        {
            Username = "alice",
            Password = "123456"
        });

        Assert.True(loginResult.Success);
        Assert.True(!string.IsNullOrWhiteSpace(loginResult.Token));
    }

    [Fact]
    public async Task AdminLogin_ShouldRequire2Fa_AndCompleteOnValidOtp()
    {
        var (context, service, twoFactor) = CreateTestServices();

        // Tạo tài khoản Admin
        var adminRole = await context.Roles.FirstAsync(r => r.RoleName == "Admin");
        var adminUser = new User
        {
            Username = "admin_master",
            PasswordHash = AuthService.HashPassword("AdminPass@123"),
            FullName = "Quản trị viên Hệ thống",
            Email = "tamthanhsk25@gmail.com",
            RoleId = adminRole.Id
        };
        context.Users.Add(adminUser);
        await context.SaveChangesAsync();

        // 1. Đăng nhập bước 1 bằng Username + Password
        var loginResult = await service.LoginAsync(new LoginDto
        {
            Username = "admin_master",
            Password = "AdminPass@123"
        });

        Assert.True(loginResult.Success);
        Assert.True(loginResult.RequiresTwoFactor);
        Assert.NotNull(loginResult.TempToken);
        Assert.Equal("EmailOtp", loginResult.TwoFactorMethod);
        Assert.NotNull(loginResult.EmailMasked);

        // 2. Xác thực 2FA với mã sai -> Phải thất bại
        var verifyFail = await service.VerifyTwoFactorAsync(new VerifyTwoFactorDto
        {
            TempToken = loginResult.TempToken,
            Code = "000000"
        });
        Assert.False(verifyFail.Success);

        // 3. Sử dụng mã demo 668899 -> Thành công và cấp token
        var verifySuccess = await service.VerifyTwoFactorAsync(new VerifyTwoFactorDto
        {
            TempToken = loginResult.TempToken,
            Code = "668899"
        });
        Assert.True(verifySuccess.Success);
        Assert.NotNull(verifySuccess.Token);
        Assert.Equal("Admin", verifySuccess.User?.Role);
    }

    [Fact]
    public async Task SocialLogin_ShouldCreateCustomer_AndIssueToken()
    {
        var (context, service, _) = CreateTestServices();

        var result = await service.SocialLoginAsync(new SocialLoginDto
        {
            Provider = "Google",
            Email = "customer.google@gmail.com",
            Name = "Khách Hàng Google"
        });

        Assert.True(result.Success);
        Assert.False(result.RequiresTwoFactor);
        Assert.NotNull(result.Token);
        Assert.Equal("Khách Hàng Google", result.User?.FullName);
        Assert.Equal("Customer", result.User?.Role);
    }
}
