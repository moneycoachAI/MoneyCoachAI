using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserSettingsController : ControllerBase
{
    private readonly UserSettingsService _userSettingsService;

    public UserSettingsController(UserSettingsService userSettingsService)
    {
        _userSettingsService = userSettingsService;
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _userSettingsService.GetOrCreateSettingsAsync(GetUserId());
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings(UpdateUserSettingsDto dto)
    {
        var settings = await _userSettingsService.UpdateSettingsAsync(
            GetUserId(),
            dto
        );

        return Ok(settings);
    }
}