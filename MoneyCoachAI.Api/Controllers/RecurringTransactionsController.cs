using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs.RecurringTransactions;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecurringTransactionsController : ControllerBase
{
    private readonly RecurringTransactionService _service;

    public RecurringTransactionsController(
        RecurringTransactionService service)
    {
        _service = service;
    }

    private string? UserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetRecurringTransactions()
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var data =
            await _service.GetRecurringTransactionsAsync(UserId);

        return Ok(data);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardReminders()
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var reminders =
            await _service.GetDashboardRemindersAsync(UserId);

        return Ok(reminders);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRecurringTransaction(
        CreateRecurringTransactionRequest request)
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var recurring =
            await _service.CreateRecurringTransactionAsync(
                UserId,
                request);

        return Ok(recurring);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRecurringTransaction(
        string id,
        CreateRecurringTransactionRequest request)
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var updated =
            await _service.UpdateRecurringTransactionAsync(
                id,
                UserId,
                request);

        if (!updated)
        {
            return NotFound();
        }

        return Ok("Recurring reminder updated successfully.");
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteReminder(
        string id)
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var result =
            await _service.CompleteOccurrenceAsync(
                id,
                UserId);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpPost("{id}/pause")]
    public async Task<IActionResult> PauseReminder(
        string id)
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var success =
            await _service.SetActiveStatusAsync(
                id,
                UserId,
                false);

        if (!success)
        {
            return NotFound();
        }

        return Ok("Recurring reminder paused.");
    }

    [HttpPost("{id}/resume")]
    public async Task<IActionResult> ResumeReminder(
        string id)
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var success =
            await _service.SetActiveStatusAsync(
                id,
                UserId,
                true);

        if (!success)
        {
            return NotFound();
        }

        return Ok("Recurring reminder resumed.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecurringTransaction(
        string id)
    {
        if (UserId == null)
        {
            return Unauthorized();
        }

        var deleted =
            await _service.DeleteRecurringTransactionAsync(
                id,
                UserId);

        if (!deleted)
        {
            return NotFound();
        }

        return Ok("Recurring reminder deleted.");
    }
}