namespace ManagementSystem.DTOs
{
    /// <summary>
    /// Aggregated executive dashboard KPI metrics, status distributions, and recent feeds.
    /// </summary>
    public class DashboardSummaryDto
    {
        public int TotalTasks { get; set; }
        public int ToDoTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int DoneTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int TotalTeams { get; set; }
        public int TotalUsers { get; set; }
        public int UnreadNotifications { get; set; }

        public List<PriorityStatDto> TasksByPriority { get; set; } = new List<PriorityStatDto>();
        public List<TaskDto> RecentTasks { get; set; } = new List<TaskDto>();
        public List<NotificationDto> RecentNotifications { get; set; } = new List<NotificationDto>();
    }

    /// <summary>
    /// Priority breakdown aggregation item for workload charts.
    /// </summary>
    public class PriorityStatDto
    {
        public string Priority { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
