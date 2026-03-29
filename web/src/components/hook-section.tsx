"use client";

import { useState, useTransition } from "react";
import type { HookVariant } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EditableField } from "@/components/editable-field";
import { updateHook, selectHook, regenerateHook } from "@/app/actions/editor";
import { RefreshCw } from "lucide-react";

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
  const [regenerating, setRegenerating] = useState(false);
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

  async function handleRegenerateHook() {
    setRegenerating(true);
    try {
      const result = await regenerateHook(scriptId, activeTab);
      if (result.success && result.visual && result.voiceover) {
        setLocalHooks((prev) =>
          prev.map((h) =>
            h.variant === activeTab
              ? { ...h, visual: result.visual!, voiceover: result.voiceover! }
              : h
          )
        );
        onTextEdited?.();
      }
    } catch {
      // silently fail
    }
    setRegenerating(false);
  }

  if (localHooks.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Hook Variants
      </h3>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center gap-2">
          <TabsList>
            {localHooks.map((hook) => (
              <TabsTrigger key={hook.variant} value={hook.variant}>
                {hook.variant}
              </TabsTrigger>
            ))}
          </TabsList>
          {regenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <button
              type="button"
              onClick={handleRegenerateHook}
              className="h-7 w-7 flex items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Regenerate this hook variant"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
        {localHooks.map((hook) => (
          <TabsContent key={hook.variant} value={hook.variant}>
            <div className="pt-3">
              <div className="grid grid-cols-2 gap-4">
              <EditableField
                value={hook.visual}
                onSave={(val) =>
                  handleHookSave(hook.variant, "visual", val)
                }
                className="text-base italic text-muted-foreground leading-relaxed"
              />
              <EditableField
                value={hook.voiceover}
                onSave={(val) =>
                  handleHookSave(hook.variant, "voiceover", val)
                }
                className="text-base text-foreground leading-relaxed"
              />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
