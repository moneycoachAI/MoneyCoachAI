using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly ExpenseService _expenseService;

    public ExpensesController(ExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateExpenseRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _expenseService.CreateExpenseAsync(userId, request);

        return Ok("Expense created successfully");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var expenses = await _expenseService.GetExpensesAsync(userId);

        return Ok(expenses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var expense = await _expenseService.GetExpenseByIdAsync(id, userId);

        if (expense == null)
        {
            return NotFound("Expense not found");
        }

        return Ok(expense);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, UpdateExpenseRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var updated = await _expenseService.UpdateExpenseAsync(id, request, userId);

        if (!updated)
        {
            return NotFound("Expense not found");
        }

        return Ok("Expense updated successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var deleted = await _expenseService.DeleteExpenseAsync(id, userId);

        if (!deleted)
        {
            return NotFound("Expense not found");
        }

        return Ok("Expense deleted successfully");
    }
}