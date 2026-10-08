"use client";
import { useEffect, useRef } from "react";
import { addToast } from "@heroui/react";
import { getAllExamDrafts, removeExamDraftByKey } from "@/hooks/useExamDraft";

const SYNC_INTERVAL_MS = 2 * 60 * 1000; // Tenta a cada 2 minutos se online

export function ExamDraftAutoSync() {
  const isSyncingRef = useRef(false);

  const syncPendingDrafts = async () => {
    if (isSyncingRef.current || typeof window === "undefined" || !navigator.onLine) {
      return;
    }

    const drafts = getAllExamDrafts();
    if (drafts.length === 0) return;

    isSyncingRef.current = true;
    let syncedCount = 0;

    for (const { key, payload } of drafts) {
      try {
        const response = await fetch("/api/schedulings/exame/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funcionarioId: payload.schedulingId,
            codigoExame: payload.codigosExame,
            formulario: payload.formulario,
            sala: payload.sala || "AUTOMATICO",
            profissional: payload.profissional || undefined,
          }),
        });

        if (response.ok) {
          removeExamDraftByKey(key);
          syncedCount++;
        }
      } catch (err) {
        console.warn(`[DRAFT_AUTO_SYNC] Falha ao sincronizar rascunho ${key}:`, err);
      }
    }

    if (syncedCount > 0) {
      try {
        addToast({
          title: "Sincronização Automática",
          description: `${syncedCount} exame(s) salvo(s) offline foram regularizados com sucesso!`,
          color: "success",
        });
      } catch {
        console.log(`[DRAFT_AUTO_SYNC] ${syncedCount} rascunhos sincronizados.`);
      }
    }

    isSyncingRef.current = false;
  };

  useEffect(() => {
    // Executa ao carregar e ao voltar conexão de rede
    syncPendingDrafts();

    const handleOnline = () => {
      syncPendingDrafts();
    };

    window.addEventListener("online", handleOnline);
    const intervalId = setInterval(syncPendingDrafts, SYNC_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}
