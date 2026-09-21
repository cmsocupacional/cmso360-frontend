import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { JWT } from "@/lib/jwt/jwt";
import { NEST_URL } from "@/config/constants";

export async function POST(req: Request) {
  try {
    const ck = await cookies();
    let authToken = ck.get("auth_token")?.value;
    const refreshToken = ck.get("refresh_token")?.value;

    let validToken: string | null = null;

    if (authToken) {
      const payload = await JWT.verifyJwt(authToken);
      if (payload) {
        validToken = authToken;
      }
    }

    // Se auth_token não for válido, tenta renovar via refresh_token
    if (!validToken && refreshToken) {
      const refreshPayload = await JWT.verifyJwt(refreshToken);
      if (refreshPayload) {
        const { iat, exp, ...userInfo } = refreshPayload as any;
        const newToken = await JWT.signJwt(userInfo, "1h");
        const newRefreshToken = await JWT.signJwt(userInfo, "7d");

        ck.set("auth_token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          path: "/",
          maxAge: 60 * 60,
        });

        ck.set("refresh_token", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });

        validToken = newToken;
      }
    }

    if (!validToken) {
      return NextResponse.json(
        { message: "Token de autenticacao ausente ou expirado" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const response = await fetch(`${NEST_URL}soc/sincronizar-prontuario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("[BFF:soc/sincronizar-prontuario]", error);

    return NextResponse.json(
      { message: "Falha ao processar requisicao interna." },
      { status: 500 },
    );
  }
}
