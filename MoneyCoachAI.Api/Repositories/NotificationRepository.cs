using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class NotificationRepository
{
    private readonly IMongoCollection<Notification> _notifications;

    public NotificationRepository(DatabaseService databaseService)
    {
        _notifications = databaseService.NotificationsCollection;
    }

    public async Task<List<Notification>> GetByUserIdAsync(string userId)
    {
        return await _notifications
            .Find(notification => notification.UserId == userId)
            .SortByDescending(notification => notification.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Notification>> GetUnreadByUserIdAsync(string userId)
    {
        return await _notifications
            .Find(notification => notification.UserId == userId && !notification.IsRead)
            .SortByDescending(notification => notification.CreatedAt)
            .ToListAsync();
    }

    public async Task CreateAsync(Notification notification)
    {
        await _notifications.InsertOneAsync(notification);
    }

    public async Task MarkAsReadAsync(string id, string userId)
    {
        await _notifications.UpdateOneAsync(
            notification => notification.Id == id && notification.UserId == userId,
            Builders<Notification>.Update.Set(notification => notification.IsRead, true)
        );
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        await _notifications.UpdateManyAsync(
            notification => notification.UserId == userId && !notification.IsRead,
            Builders<Notification>.Update.Set(notification => notification.IsRead, true)
        );
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _notifications.DeleteOneAsync(
            notification => notification.Id == id && notification.UserId == userId
        );
    }

    public async Task<bool> ExistsByReferenceKeyAsync(string userId, string referenceKey)
    {
        return await _notifications
            .Find(notification =>
                notification.UserId == userId &&
                notification.ReferenceKey == referenceKey)
            .AnyAsync();
    }
}