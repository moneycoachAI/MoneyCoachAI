using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
	private readonly ProfileService _profileService;

	public ProfileController(ProfileService profileService)
	{
		_profileService = profileService;
	}

	private string GetUserId()
	{
		return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
	}

	[HttpGet]
	public async Task<IActionResult> GetProfile()
	{
		var profile = await _profileService.GetProfileAsync(GetUserId());

		if (profile == null)
		{
			return NotFound("User not found");
		}

		return Ok(profile);
	}

	[HttpPut]
	public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
	{
		var profile = await _profileService.UpdateProfileAsync(
			GetUserId(),
			dto
		);

		if (profile == null)
		{
			return NotFound("User not found");
		}

		return Ok(profile);
	}

	[HttpPut("change-password")]
	public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
	{
		var isChanged = await _profileService.ChangePasswordAsync(
			GetUserId(),
			dto
		);

		if (!isChanged)
		{
			return BadRequest("Invalid current password or passwords do not match");
		}

		return Ok(new
		{
			message = "Password changed successfully"
		});
	}
}