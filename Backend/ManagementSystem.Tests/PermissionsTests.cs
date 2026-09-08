using ManagementSystem.Helpers;
using ManagementSystem.Models;
using Xunit;

namespace ManagementSystem.Tests
{
    public class PermissionsTests
    {
        [Fact]
        public void AppPermissions_ShouldContain_RequiredCorePermissions()
        {
            Assert.Contains(AppPermissions.TaskCreate, AppPermissions.All);
            Assert.Contains(AppPermissions.TaskDelete, AppPermissions.All);
            Assert.Contains(AppPermissions.TeamCreate, AppPermissions.All);
            Assert.Contains(AppPermissions.UserCreate, AppPermissions.All);
            Assert.Contains(AppPermissions.AuditView, AppPermissions.All);
            Assert.Contains(AppPermissions.ReportsExport, AppPermissions.All);
        }

        [Fact]
        public void TaskItem_ShouldSupport_ExtendedEnums()
        {
            var task = new TaskItem
            {
                Title = "Test Task",
                Priority = TaskPriorityEnum.Critical,
                Status = TaskStatusEnum.Review,
                EstimatedHours = 10,
                ActualHours = 5,
                Category = "Engineering",
                Tags = "csharp,dotnet,test"
            };

            Assert.Equal(TaskPriorityEnum.Critical, task.Priority);
            Assert.Equal(TaskStatusEnum.Review, task.Status);
            Assert.Equal(10, task.EstimatedHours);
            Assert.Equal("Engineering", task.Category);
        }

        [Fact]
        public void SubTask_ShouldInitialize_Correctly()
        {
            var subtask = new SubTask
            {
                TaskId = 1,
                Title = "Subtask 1",
                IsCompleted = false,
                SortOrder = 1
            };

            Assert.Equal("Subtask 1", subtask.Title);
            Assert.False(subtask.IsCompleted);
            Assert.Equal(1, subtask.SortOrder);
        }
    }
}
