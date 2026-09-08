using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller managing the work task lifecycle, subtasks, filtering, state transitions, and deletions.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private int CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 1;
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role) ?? "User";
        private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

        /// <summary>
        /// Retrieves filtered tasks (GET /api/tasks).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetTasks([FromQuery] TaskFilterDto filter)
        {
            var tasks = await _taskService.GetTasksAsync(filter, CurrentUserId, CurrentUserRole);
            return Ok(tasks);
        }

        /// <summary>
        /// Retrieves detailed information for a single task by ID (GET /api/tasks/{id}).
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(int id)
        {
            var task = await _taskService.GetTaskByIdAsync(id, CurrentUserId, CurrentUserRole);
            if (task == null)
            {
                return NotFound(new { message = "Task not found or access denied." });
            }
            return Ok(task);
        }

        /// <summary>
        /// Provisions a new task entity (POST /api/tasks).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.CreateTaskAsync(dto, CurrentUserId, CurrentUserRole, ClientIp);
            if (!success) return BadRequest(new { message });

            return CreatedAtAction(nameof(GetTaskById), new { id = data!.Id }, data);
        }

        /// <summary>
        /// Modifies an existing task entity (PUT /api/tasks/{id}).
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.UpdateTaskAsync(id, dto, CurrentUserId, CurrentUserRole, ClientIp);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Executes a workflow state machine transition (PATCH /api/tasks/{id}/status).
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.UpdateTaskStatusAsync(id, dto.Status, CurrentUserId, CurrentUserRole, ClientIp);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Logically soft-deletes a task (DELETE /api/tasks/{id}).
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var (success, message) = await _taskService.DeleteTaskAsync(id, CurrentUserId, CurrentUserRole, ClientIp);
            if (!success) return BadRequest(new { message });

            return Ok(new { message });
        }

        /// <summary>
        /// Adds a subtask to a task (POST /api/tasks/{id}/subtasks).
        /// </summary>
        [HttpPost("{id}/subtasks")]
        public async Task<IActionResult> AddSubTask(int id, [FromBody] CreateSubTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.AddSubTaskAsync(id, dto, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Updates a subtask (PUT /api/tasks/{id}/subtasks/{subTaskId}).
        /// </summary>
        [HttpPut("{id}/subtasks/{subTaskId}")]
        public async Task<IActionResult> UpdateSubTask(int id, int subTaskId, [FromBody] UpdateSubTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.UpdateSubTaskAsync(subTaskId, dto, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Deletes a subtask (DELETE /api/tasks/{id}/subtasks/{subTaskId}).
        /// </summary>
        [HttpDelete("{id}/subtasks/{subTaskId}")]
        public async Task<IActionResult> DeleteSubTask(int id, int subTaskId)
        {
            var (success, message) = await _taskService.DeleteSubTaskAsync(subTaskId, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return Ok(new { success = true, message });
        }
    }
}
