using Microsoft.Extensions.DependencyInjection;

namespace MoneyCoachAI.Api.Services;

public class RecurringReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;

    public RecurringReminderBackgroundService(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope =
                    _serviceProvider.CreateScope();

                var recurringNotificationService =
                    scope.ServiceProvider.GetRequiredService<
                        RecurringNotificationService>();

                await recurringNotificationService
                    .GenerateNotificationsAsync(
                        DateTime.Now);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Recurring reminder error: {ex.Message}");
            }

            await Task.Delay(
                TimeSpan.FromHours(1),
                stoppingToken);
        }
    }
}