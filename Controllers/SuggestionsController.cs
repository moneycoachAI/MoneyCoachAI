using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuggestionController : ControllerBase
{
    private readonly SuggestionService _suggestionService;

    public SuggestionController(SuggestionService suggestionService)
    {
        _suggestionService = suggestionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSuggestions(int month, int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var suggestions = await _suggestionService.GetSuggestionsAsync(userId, month, year);

        return Ok(suggestions);
    }
}