using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs.Investments;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvestmentsController : ControllerBase
{
    private readonly InvestmentService _investmentService;

    public InvestmentsController(InvestmentService investmentService)
    {
        _investmentService = investmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvestments()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var investments =
            await _investmentService.GetInvestmentsAsync(userId);

        return Ok(investments);
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvestment(
        CreateInvestmentRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _investmentService.CreateInvestmentAsync(userId, request);

        return Ok("Investment created successfully");
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var summary =
            await _investmentService.GetSummaryAsync(userId);

        return Ok(summary);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvestment(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _investmentService.DeleteInvestmentAsync(id, userId);

        return Ok("Investment deleted successfully");
    }

    [HttpGet("allocation")]
    public async Task<IActionResult> GetAllocation()
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var data =
            await _investmentService.GetAllocationAsync(userId);

        return Ok(data);
    }
}