"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { updateScriptStatus } from "@/app/actions/library";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TruncatedText } from "./truncated-text";
import { MetricsCard } from "./metrics-card";
import type { ScriptWithVideo } from "@/lib/types";

function statusBg(status: string): string {
  switch (status) {
    case "ready":
      return "bg-blue-100";
    case "done":
      return "bg-green-100";
    default:
      return "bg-gray-100";
  }
}

interface ScriptsTableProps {
  scripts: ScriptWithVideo[];
}

export function ScriptsTable({ scripts: initialScripts }: ScriptsTableProps) {
  const [scripts, setScripts] = useState(initialScripts);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
    const validStatus = newStatus as "draft" | "ready" | "done";
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, status: validStatus } : s))
    );
    await updateScriptStatus(scriptId, validStatus);
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
            <th className="text-center py-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              YT Stats
            </th>
          </tr>
        </thead>
        <tbody>
          {scripts.map((script) => (
            <React.Fragment key={script.id}>
              <tr className="border-b hover:bg-zinc-50">
                <td className="py-3 px-2">
                  <Link
                    href={`/script/${script.id}`}
                    className="block max-w-[280px] hover:text-primary transition-colors cursor-pointer"
                  >
                    <TruncatedText
                      text={script.title}
                      className="text-sm text-foreground font-medium max-w-[320px]"
                    />
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
                  <Select
                    key={`status-${script.id}-${script.status}`}
                    defaultValue={script.status}
                    onValueChange={(val) => handleStatusChange(script.id, val)}
                  >
                    <SelectTrigger size="sm" className={`w-auto cursor-pointer ${statusBg(script.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" alignItemWithTrigger={false}>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="ready">ready</SelectItem>
                      <SelectItem value="done">done</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-2 text-center">
                  {script.video && script.metrics ? (
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === script.id ? null : script.id
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium">
                        {script.metrics.views >= 1000
                          ? `${(script.metrics.views / 1000).toFixed(1)}K`
                          : script.metrics.views}
                      </span>
                      {expandedId === script.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
              {expandedId === script.id && script.metrics && (
                <tr>
                  <td colSpan={5} className="py-3 px-4 bg-zinc-50/50">
                    <MetricsCard metrics={script.metrics} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
