using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PasswordController : ControllerBase
{
    private readonly PasswordResetService
        _passwordResetService;

    public PasswordController(
        PasswordResetService passwordResetService
    )
    {
        _passwordResetService =
            passwordResetService;
    }

    [HttpPost("forgot")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request
    )
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        await _passwordResetService
            .RequestPasswordResetAsync(
                request.Email
            );

        return Ok(
            new
            {
                message =
                    "If an account exists for this email, a password reset link has been sent."
            }
        );
    }

    [HttpPost("validate-token")]
    public async Task<IActionResult> ValidateToken(
        [FromBody] ValidateResetTokenRequest request
    )
    {
        var isValid =
            await _passwordResetService
                .ValidateTokenAsync(
                    request.Token
                );

        return Ok(
            new
            {
                valid = isValid
            }
        );
    }

    [HttpPost("reset")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request
    )
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            await _passwordResetService
                .ResetPasswordAsync(
                    request.Token,
                    request.NewPassword,
                    request.ConfirmPassword
                );

            return Ok(
                new
                {
                    message =
                        "Your password has been reset successfully."
                }
            );
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new
                {
                    message = exception.Message
                }
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(
                new
                {
                    message = exception.Message
                }
            );
        }
    }
}