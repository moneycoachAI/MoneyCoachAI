using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportsController(ReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlyReport(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var report = await _reportService.GetMonthlyReportAsync(
            userId,
            month,
            year);

        return Ok(report);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategoryReport(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var report = await _reportService.GetCategoryReportAsync(
            userId,
            month,
            year);

        return Ok(report);
    }

    [HttpGet("budget-summary")]
    public async Task<IActionResult> GetBudgetSummary(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var report = await _reportService.GetBudgetSummaryAsync(
            userId,
            month,
            year);

        return Ok(report);
    }
}