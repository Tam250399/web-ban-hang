namespace SalesManagerBE.Models.Dtos
{
    public class VerifyTwoFactorDto
    {
        public string TempToken { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class ResendTwoFactorDto
    {
        public string TempToken { get; set; } = string.Empty;
    }
}
