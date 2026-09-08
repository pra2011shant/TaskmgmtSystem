using System.Security.Claims;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AttachmentsController : ControllerBase
    {
        private readonly IAttachmentService _attachmentService;

        public AttachmentsController(IAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        private (int UserId, string Role) GetUserInfo()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdClaim, out var userId);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";
            return (userId, role);
        }

        [HttpPost("tasks/{taskId}")]
        public async Task<IActionResult> Upload(int taskId, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            // Max 25 MB file limit
            if (file.Length > 25 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size exceeds 25 MB limit." });
            }

            var (userId, _) = GetUserInfo();
            var (success, message, data) = await _attachmentService.UploadAttachmentAsync(taskId, file, userId);

            if (!success)
            {
                return BadRequest(new { message });
            }

            return Ok(data);
        }

        [HttpGet("tasks/{taskId}")]
        public async Task<IActionResult> GetByTaskId(int taskId)
        {
            var attachments = await _attachmentService.GetAttachmentsByTaskIdAsync(taskId);
            return Ok(attachments);
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var result = await _attachmentService.GetAttachmentFileAsync(id);
            if (result == null || result.Value.FileBytes == null)
            {
                return NotFound(new { message = "Attachment file not found." });
            }

            return File(result.Value.FileBytes, result.Value.ContentType, result.Value.FileName);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (userId, role) = GetUserInfo();
            var (success, message) = await _attachmentService.DeleteAttachmentAsync(id, userId, role);

            if (!success)
            {
                return BadRequest(new { message });
            }

            return Ok(new { success = true, message });
        }
    }
}
