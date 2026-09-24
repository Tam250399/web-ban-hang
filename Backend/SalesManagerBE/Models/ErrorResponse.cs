using System.Text.Json.Serialization;

namespace SalesManagerBE.Models
{
    /// <summary>
    /// Định dạng chuẩn JSON đồng nhất cho toàn bộ phản hồi lỗi của hệ thống
    /// </summary>
    public class ErrorResponse
    {
        [JsonPropertyName("status")]
        public int Status { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("errors")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public object? Errors { get; set; }

        [JsonPropertyName("detail")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Detail { get; set; }

        [JsonPropertyName("traceId")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? TraceId { get; set; }

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public ErrorResponse() { }

        public ErrorResponse(int status, string message, object? errors = null, string? detail = null, string? traceId = null)
        {
            Status = status;
            Message = message;
            Errors = errors;
            Detail = detail;
            TraceId = traceId;
            Timestamp = DateTime.UtcNow;
        }
    }
}
