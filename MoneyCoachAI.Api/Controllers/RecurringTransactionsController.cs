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

    [HttpGet]
    public async Task<IActionResult> GetRecurringTransactions()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var transactions =
            await _service.GetRecurringTransactionsAsync(userId);

        return Ok(transactions);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRecurringTransaction(
        CreateRecurringTransactionRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _service.CreateRecurringTransactionAsync(
            userId,
            request);

        return Ok("Recurring transaction created successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecurringTransaction(
        string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _service.DeleteRecurringTransactionAsync(
            id,
            userId);

        return Ok("Recurring transaction deleted successfully");
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateRecurringTransactions(
    int month,
    int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var generatedCount =
        await _service.GenerateForMonthAsync(
        userId,
        month,
        year);

        if (generatedCount == 0)
        {
            return Ok("Recurring transactions already exist for the selected month.");
        }

        if (generatedCount == 1)
        {
            return Ok("1 recurring transaction generated successfully.");
        }

        return Ok($"{generatedCount} recurring transactions generated successfully.");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRecurringTransaction(
    string id,
    CreateRecurringTransactionRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var updated =
            await _service.UpdateRecurringTransactionAsync(
                id,
                userId,
                request);

        if (!updated)
        {
            return NotFound("Recurring transaction not found");
        }

        return Ok("Recurring transaction updated successfully");
    }
}