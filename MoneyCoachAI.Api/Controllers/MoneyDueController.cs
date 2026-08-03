using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs.MoneyDue;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MoneyDueController : ControllerBase
{
    private readonly MoneyDueService _moneyDueService;

    public MoneyDueController(MoneyDueService moneyDueService)
    {
        _moneyDueService = moneyDueService;
    }

    private string UserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException(
            "Authenticated user ID was not found.");

    [HttpGet]
    public async Task<ActionResult<List<MoneyDueResponse>>> GetAll()
    {
        var items = await _moneyDueService.GetByUserIdAsync(UserId);

        return Ok(items.Select(MapToResponse));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MoneyDueResponse>> GetById(string id)
    {
        var item = await _moneyDueService.GetByIdAsync(id, UserId);

        if (item is null)
        {
            return NotFound();
        }

        return Ok(MapToResponse(item));
    }

    [HttpPost]
    public async Task<ActionResult<MoneyDueResponse>> Create(
        CreateMoneyDueRequest request)
    {
        try
        {
            var item = new MoneyDue
            {
                DueType = request.DueType,
                Title = request.Title,
                PartyName = request.PartyName,
                Category = request.Category,
                OtherDescription = request.OtherDescription,
                HasInterest = request.HasInterest,
                PrincipalAmount = request.PrincipalAmount,
                InterestRate = request.InterestRate,
                InterestPeriod = request.InterestPeriod,
                InterestPeriods = request.InterestPeriods,
                InterestMethod = request.InterestMethod,
                TotalAmount = request.TotalAmount,
                DueDate = request.DueDate,
                ReminderDaysBefore = request.ReminderDaysBefore,
                Description = request.Description,
                
            };

            var created = await _moneyDueService.CreateAsync(
                item,
                UserId);

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.Id },
                MapToResponse(created));
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { message = error.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        UpdateMoneyDueRequest request)
    {
        try
        {
            var item = new MoneyDue
            {
                DueType = request.DueType,
                Title = request.Title,
                PartyName = request.PartyName,
                Category = request.Category,
                OtherDescription = request.OtherDescription,
                HasInterest = request.HasInterest,
                PrincipalAmount = request.PrincipalAmount,
                InterestRate = request.InterestRate,
                InterestPeriod = request.InterestPeriod,
                InterestPeriods = request.InterestPeriods,
                InterestMethod = request.InterestMethod,
                TotalAmount = request.TotalAmount,
                DueDate = request.DueDate,
                ReminderDaysBefore = request.ReminderDaysBefore,
                Description = request.Description,
                
            };

            var updated = await _moneyDueService.UpdateAsync(
                id,
                UserId,
                item);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { message = error.Message });
        }
    }



    [HttpPost("{id}/settlements")]
    public async Task<IActionResult> RecordSettlement(
        string id,
        RecordMoneyDueSettlementRequest request)
    {
        try
        {
            var updated =
                await _moneyDueService.RecordSettlementAsync(
                    id,
                    UserId,
                    request.Amount,
                    request.SettlementDate,
                    request.Description);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { message = error.Message });
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new { message = error.Message });
        }
    }

    [HttpPut("{moneyDueId}/settlements/{settlementId}")]
    public async Task<ActionResult<MoneyDueResponse>> UpdateSettlement(
        string moneyDueId,
        string settlementId,
        UpdateMoneyDueSettlementRequest request)
    {
        try
        {
            var updated = await _moneyDueService.UpdateSettlementAsync(
                UserId,
                moneyDueId,
                settlementId,
                request.Amount,
                request.SettlementDate,
                request.Description);

            return Ok(MapToResponse(updated));
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { message = error.Message });
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(new { message = error.Message });
        }
    }

    [HttpDelete("{moneyDueId}/settlements/{settlementId}")]
    public async Task<IActionResult> DeleteSettlement(
        string moneyDueId,
        string settlementId)
    {
        try
        {
            await _moneyDueService.DeleteSettlementAsync(
                UserId,
                moneyDueId,
                settlementId);

            return NoContent();
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(new { message = error.Message });
        }
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(string id)
    {
        try
        {
            var updated =
                await _moneyDueService.CancelAsync(id, UserId);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new { message = error.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted =
            await _moneyDueService.DeleteAsync(id, UserId);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    

    private static MoneyDueResponse MapToResponse(MoneyDue item)
    {
        return new MoneyDueResponse
        {
            Id = item.Id,
            DueType = item.DueType,
            Title = item.Title,
            PartyName = item.PartyName,
            Category = item.Category,
            OtherDescription = item.OtherDescription,
            HasInterest = item.HasInterest,
            PrincipalAmount = item.PrincipalAmount,
            InterestRate = item.InterestRate,
            InterestPeriod = item.InterestPeriod,
            InterestPeriods = item.InterestPeriods,
            InterestMethod = item.InterestMethod,
            InterestAmount = item.InterestAmount,
            TotalAmount = item.TotalAmount,
            SettledAmount = item.SettledAmount,

            Settlements = (item.Settlements ?? [])
                .OrderByDescending(x => x.SettlementDate)
                .Select(x => new MoneyDueSettlementResponse
                {
                    Id = x.Id,
                    Amount = x.Amount,
                    SettlementDate = x.SettlementDate,
                    Description = x.Description,
                    CreatedAt = x.CreatedAt
                })
                .ToList(),

            RemainingAmount = item.RemainingAmount,
            DueDate = item.DueDate,
            ReminderDaysBefore = item.ReminderDaysBefore,
            Description = item.Description,
            Status = item.Status,
            IsOverdue = item.IsOverdue,
            CreatedAt = item.CreatedAt,
            CompletedAt = item.CompletedAt
        };
    }
}