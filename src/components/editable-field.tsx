"use client";

import { useState, useEffect } from "react";

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  onEditingChange?: (editing: boolean) => void;
}

export function EditableField({
  value,
  onSave,
  className = "",
  placeholder = "Click to edit...",
  onEditingChange,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!editing) {
      setLocalValue(value);
    }
  }, [value, editing]);

  function handleBlur() {
    setEditing(false);
    onEditingChange?.(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`field-sizing-content w-full rounded border border-ring bg-transparent px-1 -mx-1 py-0 outline-none ring-2 ring-ring/30 resize-none ${className}`}
      />
    );
  }

  return (
    <p
      onClick={() => { setEditing(true); onEditingChange?.(true); }}
      className={`cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors whitespace-pre-wrap ${className}`}
    >
      {value || placeholder}
    </p>
  );
}
