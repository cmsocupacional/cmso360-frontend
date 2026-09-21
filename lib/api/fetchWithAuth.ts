/**
 * Envolvente para fetch que tenta automaticamente renovar a sessão via /api/auth/refresh
 * se a requisição original retornar HTTP 401 (Não Autorizado/Token Expirado).
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let response = await fetch(input, init);

  if (response.status === 401) {
    try {
      // Tenta renovar a sessão em background usando o refresh_token
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (refreshRes.ok) {
        // Re-executa a requisição original com os cookies renovados
        response = await fetch(input, init);
      }
    } catch (refreshErr) {
      console.error("[fetchWithAuth] Falha ao tentar renovar sessão:", refreshErr);
    }
  }

  return response;
}
