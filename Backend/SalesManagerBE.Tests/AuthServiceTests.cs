using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;
using SalesManagerBE.Services;

namespace SalesManagerBE.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task RegisterAndLogin_ShouldSucceed_WithValidCredentials()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        context.Roles.AddRange(new Role { Id = 1, RoleName = "Admin" }, new Role { Id = 2, RoleName = "Customer" }, new Role { Id = 3, RoleName = "Staff" });
        await context.SaveChangesAsync();

        var service = new AuthService(context, new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestKey_For_Unit_Test_123456_This_Is_A_Very_Long_Key"
            })
            .Build());

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
}
