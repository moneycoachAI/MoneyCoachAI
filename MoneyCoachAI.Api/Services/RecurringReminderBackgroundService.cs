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

                var moneyDueNotificationService =
                    scope.ServiceProvider.GetRequiredService<
                        MoneyDueNotificationService>();

                var currentDateTime = DateTime.Now;

                await recurringNotificationService
                    .GenerateNotificationsAsync(currentDateTime);

                await moneyDueNotificationService
                    .GenerateNotificationsAsync(currentDateTime);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Reminder generation error: {ex.Message}");
            }

            await Task.Delay(
                TimeSpan.FromHours(1),
                stoppingToken);
        }
    }
}