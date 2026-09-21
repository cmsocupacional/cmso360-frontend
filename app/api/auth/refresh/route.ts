import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { JWT } from "@/lib/jwt/jwt";

export async function POST() {
  try {
    const ck = await cookies();
    const refreshToken = ck.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token ausente" },
        { status: 401 },
      );
    }

    const refreshPayload = await JWT.verifyJwt(refreshToken);

    if (!refreshPayload) {
      return NextResponse.json(
        { success: false, message: "Refresh token invalido ou expirado" },
        { status: 401 },
      );
    }

    const { iat, exp, ...userInfo } = refreshPayload as any;

    const newToken = await JWT.signJwt(userInfo, "1h");
    const newRefreshToken = await JWT.signJwt(userInfo, "7d");

    ck.set("auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hora
    });

    ck.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    return NextResponse.json({ success: true, message: "Sessão renovada com sucesso" });
  } catch (error) {
    console.error("[API:auth/refresh] Erro ao renovar sessão:", error);
    return NextResponse.json(
      { success: false, message: "Falha ao renovar token" },
      { status: 500 },
    );
  }
}
