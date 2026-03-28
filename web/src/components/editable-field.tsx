"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
}

export function EditableField({
  value,
  onSave,
  className = "",
  placeholder = "Click to edit...",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync localValue with prop when it changes externally (e.g. after regeneration)
  // but only when not currently editing
  useEffect(() => {
    if (!editing) {
      setLocalValue(value);
    }
  }, [value, editing]);

  function handleBlur() {
    setEditing(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  }

  if (editing) {
    return (
      <Textarea
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`min-h-0 ${className}`}
      />
    );
  }

  return (
    // NOTE: Parent buttons (like regenerate) should use onMouseDown + preventDefault()
    // to avoid blur-before-click issues when this field is in edit mode nearby.
    <p
      onClick={() => setEditing(true)}
      className={`cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors ${className}`}
    >
      {value || placeholder}
    </p>
  );
}
