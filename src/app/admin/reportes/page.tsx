import Link from "next/link";
import type { ReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDateTime, reportStatusLabel } from "@/lib/format";
import { resolveReportAction } from "@/app/actions/admin";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

const REASONS: Record<string, string> = {
  fraude: "Posible fraude", contenido_inapropiado: "Contenido inapropiado", informacion_falsa: "Información falsa", spam: "Spam", otro: "Otro",
};

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const sp = await searchParams;
  const estado = (["OPEN", "RESOLVED", "DISMISSED"] as ReportStatus[]).find((s) => s === sp.estado) ?? "OPEN";
  const reports = await db.report.findMany({
    where: { status: estado },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true, email: true } },
      space: { select: { id: true, title: true } },
      reportedUser: { select: { id: true, name: true } },
    },
  });
  return (
    <>
      <PageHeader title="Reportes" description="Denuncias de la comunidad sobre publicaciones y perfiles." />
      <div className="mb-6 flex gap-2">
        {(["OPEN", "RESOLVED", "DISMISSED"] as ReportStatus[]).map((s) => (
          <Link key={s} href={`/admin/reportes?estado=${s}`} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", estado === s ? "border-ink bg-ink text-white" : "border-gray-300 hover:border-ink")}>{reportStatusLabel[s]}</Link>
        ))}
      </div>
      {reports.length === 0 ? (
        <EmptyState title="No hay reportes en este estado" />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} label={reportStatusLabel[r.status]} />
                <span className="text-sm font-semibold">{REASONS[r.reason] ?? r.reason}</span>
                <span className="text-xs text-ink-muted">· {formatDateTime(r.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm">
                {r.space && <>Publicación: <Link href={`/espacios/${r.space.id}`} className="font-medium underline">{r.space.title}</Link></>}
                {r.reportedUser && <>Perfil: <Link href={`/usuarios/${r.reportedUser.id}`} className="font-medium underline">{r.reportedUser.name}</Link></>}
              </p>
              {r.details && <p className="mt-1 text-sm text-ink-soft">“{r.details}”</p>}
              <p className="mt-1 text-xs text-ink-muted">Reportado por {r.reporter.name} ({r.reporter.email})</p>
              {r.resolutionNote && <p className="mt-2 text-xs text-ink-soft">Nota de resolución: {r.resolutionNote}</p>}
              {r.status === "OPEN" && (
                <form className="mt-4 flex flex-wrap gap-2">
                  <input name="note" placeholder="Nota interna (opcional)" className="min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                  <button formAction={resolveReportAction.bind(null, r.id, "RESOLVED")} className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-white">Marcar resuelto</button>
                  <button formAction={resolveReportAction.bind(null, r.id, "DISMISSED")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold">Desestimar</button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
