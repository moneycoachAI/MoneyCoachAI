using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;
    private readonly ReportService _reportService;

    public DashboardController(
        DashboardService dashboardService,
        ReportService reportService)
    {
        _dashboardService = dashboardService;
        _reportService = reportService;
    }

    [HttpGet("monthly-cards")]
    public async Task<IActionResult> GetMonthlyCards(int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var cards = await _dashboardService.GetMonthlyCardsAsync(
            userId,
            year);

        return Ok(cards);
    }

    [HttpGet("top-category")]
    public async Task<IActionResult> GetTopCategory(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var result = await _reportService.GetTopCategoryAsync(
            userId,
            month,
            year);

        return Ok(result);
    }
}