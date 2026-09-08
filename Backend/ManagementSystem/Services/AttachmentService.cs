using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    public interface IAttachmentService
    {
        Task<(bool Success, string Message, TaskAttachmentDto? Data)> UploadAttachmentAsync(int taskId, IFormFile file, int currentUserId);
        Task<(byte[]? FileBytes, string ContentType, string FileName)?> GetAttachmentFileAsync(int attachmentId);
        Task<(bool Success, string Message)> DeleteAttachmentAsync(int attachmentId, int currentUserId, string role);
        Task<List<TaskAttachmentDto>> GetAttachmentsByTaskIdAsync(int taskId);
    }

    public class AttachmentService : IAttachmentService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<AttachmentService> _logger;

        public AttachmentService(AppDbContext context, IWebHostEnvironment environment, ILogger<AttachmentService> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        public async Task<(bool Success, string Message, TaskAttachmentDto? Data)> UploadAttachmentAsync(int taskId, IFormFile file, int currentUserId)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null)
                {
                    return (false, "Task not found.", null);
                }

                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "Tasks", taskId.ToString());
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                var attachment = new TaskAttachment
                {
                    TaskId = taskId,
                    FileName = file.FileName,
                    StoragePath = filePath,
                    ContentType = file.ContentType,
                    FileSize = file.Length,
                    UploadedById = currentUserId,
                    CreatedDate = DateTime.UtcNow
                };

                _context.TaskAttachments.Add(attachment);
                await _context.SaveChangesAsync();

                var user = await _context.Users.FindAsync(currentUserId);

                var dto = new TaskAttachmentDto
                {
                    Id = attachment.Id,
                    TaskId = attachment.TaskId,
                    FileName = attachment.FileName,
                    ContentType = attachment.ContentType,
                    FileSize = attachment.FileSize,
                    UploadedById = attachment.UploadedById,
                    UploadedByUserName = user?.FullName ?? "User",
                    CreatedDate = attachment.CreatedDate,
                    DownloadUrl = $"/api/attachments/{attachment.Id}/download"
                };

                return (true, "File uploaded successfully.", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file for Task ID {TaskId}", taskId);
                return (false, "Error occurred while uploading attachment.", null);
            }
        }

        public async Task<(byte[]? FileBytes, string ContentType, string FileName)?> GetAttachmentFileAsync(int attachmentId)
        {
            var attachment = await _context.TaskAttachments.FindAsync(attachmentId);
            if (attachment == null || !File.Exists(attachment.StoragePath))
            {
                return null;
            }

            var bytes = await File.ReadAllBytesAsync(attachment.StoragePath);
            return (bytes, attachment.ContentType, attachment.FileName);
        }

        public async Task<(bool Success, string Message)> DeleteAttachmentAsync(int attachmentId, int currentUserId, string role)
        {
            var attachment = await _context.TaskAttachments.FindAsync(attachmentId);
            if (attachment == null) return (false, "Attachment not found.");

            if (attachment.UploadedById != currentUserId && role != "Admin" && role != "Manager")
            {
                return (false, "Unauthorized to delete this attachment.");
            }

            attachment.IsDeleted = true;
            attachment.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            try
            {
                if (File.Exists(attachment.StoragePath))
                {
                    File.Delete(attachment.StoragePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not delete physical file at {Path}", attachment.StoragePath);
            }

            return (true, "Attachment deleted.");
        }

        public async Task<List<TaskAttachmentDto>> GetAttachmentsByTaskIdAsync(int taskId)
        {
            var attachments = await _context.TaskAttachments
                .AsNoTracking()
                .Where(a => a.TaskId == taskId)
                .Include(a => a.UploadedByUser)
                .OrderByDescending(a => a.CreatedDate)
                .ToListAsync();

            return attachments.Select(a => new TaskAttachmentDto
            {
                Id = a.Id,
                TaskId = a.TaskId,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                UploadedById = a.UploadedById,
                UploadedByUserName = a.UploadedByUser?.FullName ?? "User",
                CreatedDate = a.CreatedDate,
                DownloadUrl = $"/api/attachments/{a.Id}/download"
            }).ToList();
        }
    }
}
