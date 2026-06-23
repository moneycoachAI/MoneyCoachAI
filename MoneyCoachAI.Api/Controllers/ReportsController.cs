using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;
using MoneyCoachAI.Api.DTOs;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;
    private readonly SuggestionService _suggestionService;
    private readonly DashboardService _dashboardService;
    private readonly PdfReportService _pdfReportService;

    public ReportsController(
        ReportService reportService,
        SuggestionService suggestionService,
        DashboardService dashboardService,
        PdfReportService pdfReportService)
    {
        _reportService = reportService;
        _suggestionService = suggestionService;
        _dashboardService = dashboardService;
        _pdfReportService = pdfReportService;
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

    [HttpGet("monthly-pdf")]
    public async Task<IActionResult> ExportMonthlyPdf(
    int month,
    int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var suggestions = await _suggestionService.GetSuggestionsAsync(
            userId,
            month,
            year);

        var aiInsights = await _dashboardService.GetAiAdvisorInsightsAsync(
            userId,
            month,
            year);

        var dashboardCards = await _dashboardService.GetMonthlyCardsAsync(
            userId,
            year);

        var selectedCard = dashboardCards.FirstOrDefault(card =>
            card.Month == month &&
            card.Year == year);

        if (selectedCard == null)
        {
            return NotFound("No dashboard data found for selected month.");
        }

        var pdfData = new MonthlyReportPdfResponse
        {
            TotalIncome = selectedCard.TotalIncome,
            TotalSpent = selectedCard.TotalSpent,
            Savings = selectedCard.Savings,
            SavingsRate = selectedCard.SavingsRate,

            Suggestions = suggestions
                .Select(suggestion => suggestion.Message)
                .ToList(),

            AiInsights = aiInsights
                .Select(insight => insight.Message)
                .ToList()
        };

        var pdfBytes = _pdfReportService.GenerateMonthlyReportPdf(
            month,
            year,
            pdfData);

        return File(
            pdfBytes,
            "application/pdf",
            $"MoneyCoachAI_Report_{month}_{year}.pdf");
    }


}   