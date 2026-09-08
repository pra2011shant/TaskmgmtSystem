using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs(
            [FromQuery] string? entityName,
            [FromQuery] string? entityId,
            [FromQuery] int? userId,
            [FromQuery] string? action,
            [FromQuery] int limit = 100)
        {
            var logs = await _auditService.GetLogsAsync(entityName, entityId, userId, action, limit);
            return Ok(logs);
        }
    }
}
