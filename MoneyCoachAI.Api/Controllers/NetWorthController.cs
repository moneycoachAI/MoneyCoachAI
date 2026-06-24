using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs.NetWorth;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NetWorthController : ControllerBase
{
    private readonly NetWorthService _netWorthService;

    public NetWorthController(NetWorthService netWorthService)
    {
        _netWorthService = netWorthService;
    }

    [HttpGet]
    public async Task<IActionResult> GetItems()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var items = await _netWorthService.GetItemsAsync(userId);

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> CreateItem(CreateNetWorthItemRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _netWorthService.CreateItemAsync(userId, request);

        return Ok("Net worth item created successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteItem(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        await _netWorthService.DeleteItemAsync(id, userId);

        return Ok("Net worth item deleted successfully");
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var summary = await _netWorthService.GetSummaryAsync(userId);

        return Ok(summary);
    }
}