"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

export type KanbanCandidate = {
  id: string;
  name: string;
  roleTitle: string;
  status: "completed" | "advanced" | "rejected";
  score: number | null;
  band: string | null;
};

function scoreClasses(band: string | null): string {
  switch (band) {
    case "Strong":
      return "bg-green-100 text-green-700";
    case "Recommended":
      return "bg-accent/15 text-accent-soft";
    case "Borderline":
      return "bg-amber-100 text-amber-700";
    case "Not recommended":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

export default function KanbanBoard({
  initial,
}: {
  initial: KanbanCandidate[];
}) {
  const router = useRouter();
  const { dict } = useSiteLocale();
  const k = dict.employer.kanban;
  const [cards, setCards] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const COLUMNS: {
    key: KanbanCandidate["status"];
    label: string;
    dot: string;
  }[] = [
    { key: "completed", label: k.awaitingReview, dot: "bg-blue-400" },
    { key: "advanced", label: k.advanced, dot: "bg-green-500" },
    { key: "rejected", label: k.rejected, dot: "bg-red-400" },
  ];

  async function moveTo(id: string, status: KanbanCandidate["status"]) {
    setDragId(null);
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    try {
      const res = await fetch("/api/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("move failed");
      router.refresh();
    } catch {
      setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: card.status } : c)));
    }
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = cards.filter((c) => c.status === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.key);
            }}
            onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setOverCol(null);
              const id = e.dataTransfer.getData("text/plain") || dragId;
              setDragId(null);
              if (id) void moveTo(id, col.key);
            }}
            className={`rounded-2xl border p-3 transition-colors ${
              overCol === col.key
                ? "border-accent bg-accent/5"
                : "border-border bg-card/30"
            }`}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <h2 className="text-sm font-semibold">{col.label}</h2>
              <span className="tnum rounded-full bg-card px-2 py-0.5 text-xs text-muted">
                {items.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 p-5 text-center text-xs text-muted">
                  {k.dropHere}
                </div>
              )}
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(c.id);
                    e.dataTransfer.setData("text/plain", c.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setDragId(null)}
                  className={`group cursor-grab rounded-xl border border-border bg-card/60 p-4 shadow-sm transition-all active:cursor-grabbing ${
                    dragId === c.id ? "opacity-50" : "hover:border-accent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate font-medium">{c.name}</span>
                    <span
                      className={`tnum shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${scoreClasses(
                        c.band,
                      )}`}
                    >
                      {c.score != null ? `${c.score}/100` : "—"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{c.roleTitle}</p>
                  <Link
                    href={`/candidates/${c.id}`}
                    className="mt-3 inline-block text-xs font-medium text-accent-soft opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {k.viewVerdict}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
