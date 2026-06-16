using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncomesController : ControllerBase
{
    private readonly IncomeService _incomeService;

    public IncomesController(IncomeService incomeService)
    {
        _incomeService = incomeService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateIncome(
        CreateIncomeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var incomeId = await _incomeService.CreateIncomeAsync(
            userId,
            request);

        return Ok(incomeId);
    }

    [HttpGet]
    public async Task<IActionResult> GetIncomes()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var incomes = await _incomeService.GetIncomesAsync(userId);

        return Ok(incomes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetIncomeById(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var income = await _incomeService.GetIncomeByIdAsync(
            id,
            userId);

        if (income == null)
        {
            return NotFound();
        }

        return Ok(income);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateIncome(
        string id,
        UpdateIncomeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var updated = await _incomeService.UpdateIncomeAsync(
            id,
            userId,
            request);

        if (!updated)
        {
            return NotFound();
        }

        return Ok("Income updated successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteIncome(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var deleted = await _incomeService.DeleteIncomeAsync(
            id,
            userId);

        if (!deleted)
        {
            return NotFound();
        }

        return Ok("Income deleted successfully");
    }
}