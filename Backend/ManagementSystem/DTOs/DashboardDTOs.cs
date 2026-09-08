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
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int TotalTeams { get; set; }
        public int TotalUsers { get; set; }
        public int UnreadNotifications { get; set; }

        public List<PriorityStatDto> TasksByPriority { get; set; } = new List<PriorityStatDto>();
        public List<PriorityDistributionDto> PriorityDistribution { get; set; } = new List<PriorityDistributionDto>();
        public List<StatusDistributionDto> StatusDistribution { get; set; } = new List<StatusDistributionDto>();
        public List<RecentActivityDto> RecentActivities { get; set; } = new List<RecentActivityDto>();
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

    public class PriorityDistributionDto
    {
        public string Priority { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class StatusDistributionDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class RecentActivityDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
