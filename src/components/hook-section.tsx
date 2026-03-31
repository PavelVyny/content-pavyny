"use client";

import { useState, useTransition } from "react";
import type { HookVariant } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EditableField } from "@/components/editable-field";
import { updateHook, selectHook, regenerateHookField } from "@/app/actions/editor";
import { RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";

interface HookSectionProps {
  hooks: HookVariant[];
  selectedHook: string | null;
  scriptId: number;
  onTextEdited?: () => void;
}

export function HookSection({
  hooks,
  selectedHook,
  scriptId,
  onTextEdited,
}: HookSectionProps) {
  const defaultTab = selectedHook || hooks[0]?.variant || "A";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [localHooks, setLocalHooks] = useState(hooks);
  const [regenerating, setRegenerating] = useState<{ variant: string; field: "visual" | "voiceover" } | null>(null);
  const [guidedEdit, setGuidedEdit] = useState<{ variant: string; field: "visual" | "voiceover" } | null>(null);
  const [guidedPrompt, setGuidedPrompt] = useState("");
  const [, startTransition] = useTransition();

  function handleTabChange(newVariant: unknown) {
    const variant = newVariant as string;
    setActiveTab(variant);
    startTransition(() => {
      selectHook(scriptId, variant);
    });
  }

  function handleHookSave(
    variant: string,
    field: "visual" | "voiceover",
    value: string
  ) {
    setLocalHooks((prev) =>
      prev.map((h) =>
        h.variant === variant ? { ...h, [field]: value } : h
      )
    );
    startTransition(() => {
      updateHook(scriptId, variant, field, value);
    });
    onTextEdited?.();
  }

  async function handleRegenerateField(variant: string, field: "visual" | "voiceover", prompt?: string) {
    setRegenerating({ variant, field });
    setGuidedEdit(null);
    setGuidedPrompt("");
    try {
      const result = await regenerateHookField(scriptId, variant, field, prompt);
      if (result.success && result.value) {
        setLocalHooks((prev) =>
          prev.map((h) =>
            h.variant === variant ? { ...h, [field]: result.value! } : h
          )
        );
        onTextEdited?.();
      } else {
        toast.error("Regeneration failed: " + (result.error || "Unknown error"));
      }
    } catch {
      toast.error("Regeneration failed unexpectedly");
    }
    setRegenerating(null);
  }

  if (localHooks.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Hook Variants
      </h3>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {localHooks.map((hook) => (
            <TabsTrigger key={hook.variant} value={hook.variant}>
              {hook.variant}
            </TabsTrigger>
          ))}
        </TabsList>
        {localHooks.map((hook) => (
          <TabsContent key={hook.variant} value={hook.variant}>
            <div className="pt-3 group/hook relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Visual */}
                <div>
                  <EditableField
                    value={hook.visual}
                    onSave={(val) => handleHookSave(hook.variant, "visual", val)}
                    className="text-base italic text-muted-foreground leading-relaxed"
                  />
                  {guidedEdit?.variant === hook.variant && guidedEdit.field === "visual" && (
                    <div className="mt-2 flex gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={guidedPrompt}
                        onChange={(e) => setGuidedPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && guidedPrompt.trim()) handleRegenerateField(hook.variant, "visual", guidedPrompt.trim());
                          if (e.key === "Escape") { setGuidedEdit(null); setGuidedPrompt(""); }
                        }}
                        placeholder="Describe what to change..."
                        className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800 cursor-pointer"
                        onClick={() => { if (guidedPrompt.trim()) handleRegenerateField(hook.variant, "visual", guidedPrompt.trim()); }}
                      >Go</button>
                    </div>
                  )}
                </div>

                {/* Voiceover */}
                <div>
                  <EditableField
                    value={hook.voiceover}
                    onSave={(val) => handleHookSave(hook.variant, "voiceover", val)}
                    className="text-base text-foreground leading-relaxed"
                  />
                  {guidedEdit?.variant === hook.variant && guidedEdit.field === "voiceover" && (
                    <div className="mt-2 flex gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={guidedPrompt}
                        onChange={(e) => setGuidedPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && guidedPrompt.trim()) handleRegenerateField(hook.variant, "voiceover", guidedPrompt.trim());
                          if (e.key === "Escape") { setGuidedEdit(null); setGuidedPrompt(""); }
                        }}
                        placeholder="Describe what to change..."
                        className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800 cursor-pointer"
                        onClick={() => { if (guidedPrompt.trim()) handleRegenerateField(hook.variant, "voiceover", guidedPrompt.trim()); }}
                      >Go</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual controls — absolute left */}
              <div className="absolute -left-9 top-5 flex flex-col items-center gap-1 opacity-0 group-hover/hook:opacity-100 transition-opacity">
                {regenerating?.variant === hook.variant && regenerating.field === "visual" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <button type="button" title="Regenerate visual" className="h-5 w-5 flex items-center justify-center rounded cursor-pointer hover:bg-accent" onClick={() => handleRegenerateField(hook.variant, "visual")}>
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button type="button" title="Edit visual with prompt" className="h-5 w-5 flex items-center justify-center rounded cursor-pointer hover:bg-accent" onClick={() => { setGuidedEdit({ variant: hook.variant, field: "visual" }); setGuidedPrompt(""); }}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>

              {/* Voiceover controls — absolute right */}
              <div className="absolute -right-9 top-5 flex flex-col items-center gap-1 opacity-0 group-hover/hook:opacity-100 transition-opacity">
                {regenerating?.variant === hook.variant && regenerating.field === "voiceover" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <button type="button" title="Regenerate voiceover" className="h-5 w-5 flex items-center justify-center rounded cursor-pointer hover:bg-accent" onClick={() => handleRegenerateField(hook.variant, "voiceover")}>
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button type="button" title="Edit voiceover with prompt" className="h-5 w-5 flex items-center justify-center rounded cursor-pointer hover:bg-accent" onClick={() => { setGuidedEdit({ variant: hook.variant, field: "voiceover" }); setGuidedPrompt(""); }}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
