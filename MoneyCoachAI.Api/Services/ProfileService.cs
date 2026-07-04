using BCrypt.Net;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class ProfileService
{
    private readonly UserRepository _userRepository;

    public ProfileService(UserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<User?> GetProfileAsync(string userId)
    {
        return await _userRepository.GetByIdAsync(userId);
    }

    public async Task<User?> UpdateProfileAsync(
        string userId,
        UpdateProfileDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return null;

        user.FullName = dto.FullName;
        user.PhoneNumber = dto.PhoneNumber;

        await _userRepository.UpdateAsync(user);

        return user;
    }

    public async Task<bool> ChangePasswordAsync(
        string userId,
        ChangePasswordDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return false;

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return false;

        if (dto.NewPassword != dto.ConfirmPassword)
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        await _userRepository.UpdateAsync(user);

        return true;
    }
}