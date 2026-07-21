using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);

        if (result == null)
        {
            return BadRequest("User already exists");
        }

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized("Invalid email or password");
        }

        return Ok(result);
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin(
        GoogleLoginRequest request)
    {
        var result = await _authService.GoogleLoginAsync(request);

        if (result == null)
        {
            return Unauthorized("Google authentication failed");
        }

        return Ok(result);
    }
}