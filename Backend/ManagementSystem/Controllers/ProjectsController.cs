using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// REST API Controller for Managing Enterprise Projects, Milestones, and Progress Deliverables.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectsController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        private int CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 1;

        /// <summary>
        /// Retrieves all projects with milestone summaries and task completion progress.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            try
            {
                var projects = await _projectService.GetProjectsAsync();
                return Ok(projects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load projects", details = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves a single project by ID with its nested milestones and tasks.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProjectById(int id)
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null) return NotFound(new { message = "Project not found" });
            return Ok(project);
        }

        /// <summary>
        /// Creates a new high-level project container (Admin/Manager).
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _projectService.CreateProjectAsync(dto, CurrentUserId);
            if (!success) return BadRequest(new { message });

            return CreatedAtAction(nameof(GetProjectById), new { id = data!.Id }, data);
        }

        /// <summary>
        /// Adds a milestone deliverable target to an existing project.
        /// </summary>
        [HttpPost("{id}/milestones")]
        public async Task<IActionResult> AddMilestone(int id, [FromBody] CreateMilestoneDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _projectService.AddMilestoneAsync(id, dto, CurrentUserId);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }
    }
}
