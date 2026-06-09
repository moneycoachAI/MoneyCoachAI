using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetsController : ControllerBase
{
    private readonly BudgetService _budgetService;

    public BudgetsController(BudgetService budgetService)
    {
        _budgetService = budgetService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateBudgetRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _budgetService.CreateBudgetAsync(userId, request);

        return Ok("Budget created successfully");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var budgets = await _budgetService.GetBudgetsAsync(userId);

        return Ok(budgets);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var budget = await _budgetService.GetBudgetByIdAsync(id, userId);

        if (budget == null)
        {
            return NotFound("Budget not found");
        }

        return Ok(budget);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, UpdateBudgetRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var updated = await _budgetService.UpdateBudgetAsync(id, userId, request);

        if (!updated)
        {
            return NotFound("Budget not found");
        }

        return Ok("Budget updated successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var deleted = await _budgetService.DeleteBudgetAsync(id, userId);

        if (!deleted)
        {
            return NotFound("Budget not found");
        }

        return Ok("Budget deleted successfully");
    }
}