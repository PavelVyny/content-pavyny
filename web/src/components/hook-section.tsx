"use client";

import { useState, useTransition } from "react";
import type { HookVariant } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EditableField } from "@/components/editable-field";
import { updateHook, selectHook } from "@/app/actions/editor";

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
    startTransition(() => {
      updateHook(scriptId, variant, field, value);
    });
    onTextEdited?.();
  }

  if (hooks.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Hook Variants
      </h3>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {hooks.map((hook) => (
            <TabsTrigger key={hook.variant} value={hook.variant}>
              {hook.variant}
            </TabsTrigger>
          ))}
        </TabsList>
        {hooks.map((hook) => (
          <TabsContent key={hook.variant} value={hook.variant}>
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Visual
                </p>
                <EditableField
                  value={hook.visual}
                  onSave={(val) =>
                    handleHookSave(hook.variant, "visual", val)
                  }
                  className="text-base italic text-muted-foreground leading-relaxed"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Voiceover
                </p>
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
