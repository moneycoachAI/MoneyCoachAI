using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs.FinancialGoals;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinancialGoalsController : ControllerBase
{
    private readonly FinancialGoalService _goalService;

    public FinancialGoalsController(FinancialGoalService goalService)
    {
        _goalService = goalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetGoals()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var goals = await _goalService.GetGoalsAsync(userId);

        return Ok(goals);
    }

    [HttpPost]
    public async Task<IActionResult> CreateGoal(
        CreateFinancialGoalRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _goalService.CreateGoalAsync(userId, request);

        return Ok("Financial goal created successfully");
    }

    [HttpPut("{goalId}/progress")]
    public async Task<IActionResult> AddProgress(
        string goalId,
        decimal amount)
    {
        await _goalService.UpdateProgressAsync(goalId, amount);

        return Ok("Goal progress updated successfully");
    }

    [HttpDelete("{goalId}")]
    public async Task<IActionResult> DeleteGoal(string goalId)
    {
        await _goalService.DeleteGoalAsync(goalId);

        return Ok("Financial goal deleted successfully");
    }
}