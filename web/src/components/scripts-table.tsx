"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  updateScriptStatus,
  getVoiceoverText,
} from "@/app/actions/library";
import type { Script } from "@/lib/types";

function scoreColor(total: number): string {
  if (total >= 35) return "text-green-600";
  if (total >= 25) return "text-yellow-600";
  return "text-red-600";
}

function statusBg(status: string): string {
  switch (status) {
    case "ready":
      return "bg-green-100";
    case "recorded":
      return "bg-blue-100";
    default:
      return "bg-gray-100";
  }
}

interface ScriptsTableProps {
  scripts: Script[];
}

export function ScriptsTable({ scripts: initialScripts }: ScriptsTableProps) {
  const [scripts, setScripts] = useState(initialScripts);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (scripts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          No scripts yet. Generate your first script to get started.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Generate Script
        </Link>
      </div>
    );
  }

  async function handleStatusChange(scriptId: number, newStatus: string) {
    const validStatus = newStatus as "draft" | "ready" | "recorded";
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, status: validStatus } : s))
    );
    await updateScriptStatus(scriptId, validStatus);
  }

  async function handleCopy(scriptId: number) {
    try {
      const result = await getVoiceoverText(scriptId);
      if (result.success && result.text) {
        await navigator.clipboard.writeText(result.text);
        setCopiedId(scriptId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // clipboard failed silently
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Title
            </th>
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Format
            </th>
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Created
            </th>
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </th>
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Score
            </th>
            <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {scripts.map((script) => (
            <tr key={script.id} className="border-b hover:bg-zinc-50">
              <td className="py-3 px-2">
                <Link
                  href={`/script/${script.id}`}
                  className="text-foreground hover:underline font-medium max-w-[200px] truncate block"
                >
                  {script.title}
                </Link>
              </td>
              <td className="py-3 px-2">
                <Badge variant="outline">{script.format}</Badge>
              </td>
              <td className="py-3 px-2 text-muted-foreground">
                {new Date(script.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="py-3 px-2">
                <select
                  value={script.status}
                  onChange={(e) =>
                    handleStatusChange(script.id, e.target.value)
                  }
                  className={`text-xs rounded border px-2 py-1 ${statusBg(script.status)}`}
                >
                  <option value="draft">draft</option>
                  <option value="ready">ready</option>
                  <option value="recorded">recorded</option>
                </select>
              </td>
              <td className="py-3 px-2">
                {script.antiSlopScore ? (
                  <span className={scoreColor(script.antiSlopScore.total)}>
                    {script.antiSlopScore.total}/50
                  </span>
                ) : (
                  <span className="text-muted-foreground">&mdash;</span>
                )}
              </td>
              <td className="py-3 px-2">
                <button
                  onClick={() => handleCopy(script.id)}
                  className={`text-xs border rounded px-2 py-1 transition-colors ${
                    copiedId === script.id
                      ? "bg-green-600 text-white border-green-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Copy voiceover text"
                >
                  {copiedId === script.id ? "Copied!" : "Copy"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
