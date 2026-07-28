export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  credential: string;
}

export interface AuthResponse {
  token: string;

  refreshToken: string;

  accessTokenExpiresAt: string;

  refreshTokenExpiresAt: string;

  userId: string;

  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}