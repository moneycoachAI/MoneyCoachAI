using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly AIAdvisorService _aiAdvisorService;

    public AIController(AIAdvisorService aiAdvisorService)
    {
        _aiAdvisorService = aiAdvisorService;
    }

    [HttpPost("advice")]
    public async Task<IActionResult> GetAdvice(AIAdviceRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var response = await _aiAdvisorService.GetAdviceAsync(
            userId,
            request);

        return Ok(response);
    }
}