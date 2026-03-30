"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteScript } from "@/app/actions/generate";

export function DeleteScriptButton({ scriptId }: { scriptId: number }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        if (confirm("Delete this script?")) {
          await deleteScript(scriptId);
          router.push("/scripts");
        }
      }}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
      title="Delete script"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
