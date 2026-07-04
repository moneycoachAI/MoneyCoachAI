using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notificationService;

    public NotificationsController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var notifications = await _notificationService.GetNotificationsAsync(GetUserId());
        return Ok(notifications);
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnreadNotifications()
    {
        var notifications = await _notificationService.GetUnreadNotificationsAsync(GetUserId());
        return Ok(notifications);
    }

    [HttpPost]
    public async Task<IActionResult> CreateNotification(CreateNotificationDto dto)
    {
        var notification = await _notificationService.CreateNotificationAsync(
            GetUserId(),
            dto
        );

        return Ok(notification);
    }

    [HttpPut("read/{id}")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        await _notificationService.MarkAsReadAsync(id, GetUserId());
        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(GetUserId());
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(string id)
    {
        await _notificationService.DeleteNotificationAsync(id, GetUserId());
        return NoContent();
    }
}