using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class NotificationService
{
    private readonly NotificationRepository _notificationRepository;

    public NotificationService(NotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<List<Notification>> GetNotificationsAsync(string userId)
    {
        return await _notificationRepository.GetByUserIdAsync(userId);
    }

    public async Task<List<Notification>> GetUnreadNotificationsAsync(string userId)
    {
        return await _notificationRepository.GetUnreadByUserIdAsync(userId);
    }

    public async Task<Notification> CreateNotificationAsync(
        string userId,
        CreateNotificationDto dto
    )
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = dto.Title,
            Message = dto.Message,
            Type = dto.Type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.CreateAsync(notification);

        return notification;
    }

    public async Task MarkAsReadAsync(string id, string userId)
    {
        await _notificationRepository.MarkAsReadAsync(id, userId);
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId);
    }

    public async Task DeleteNotificationAsync(string id, string userId)
    {
        await _notificationRepository.DeleteAsync(id, userId);
    }

    public async Task CreateSystemNotificationAsync(
    string userId,
    string title,
    string message,
    string type,
    string referenceKey)
    {
        var alreadyExists = await _notificationRepository.ExistsByReferenceKeyAsync(
            userId,
            referenceKey
        );

        if (alreadyExists)
        {
            return;
        }

        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceKey = referenceKey,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.CreateAsync(notification);
    }
}