using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller managing the work task lifecycle, filtering, state transitions, and deletions.
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

        /// <summary>
        /// Extracts authenticated user's unique identifier from JWT identity claims.
        /// </summary>
        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>
        /// Extracts authenticated user's role designation from JWT identity claims.
        /// </summary>
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role) ?? "User";

        /// <summary>
        /// Retrieves filtered tasks according to search terms, state, priority, and team assignments (GET /api/tasks).
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
        /// Provisions a new task entity (Admin and Manager roles only) (POST /api/tasks).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.CreateTaskAsync(dto, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return CreatedAtAction(nameof(GetTaskById), new { id = data!.Id }, data);
        }

        /// <summary>
        /// Modifies an existing task entity (Admin and Manager roles only) (PUT /api/tasks/{id}).
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.UpdateTaskAsync(id, dto, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Executes a workflow state machine transition (ToDo -> InProgress -> Done) (PATCH /api/tasks/{id}/status).
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _taskService.UpdateTaskStatusAsync(id, dto.Status, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Logically soft-deletes a task (Admin and Manager roles only) (DELETE /api/tasks/{id}).
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var (success, message) = await _taskService.DeleteTaskAsync(id, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}
