import { getAllScripts } from "@/app/actions/library";
import { ScriptsTable } from "@/components/scripts-table";

export default async function ScriptsPage() {
  const scripts = await getAllScripts();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">Scripts</h2>
        <p className="text-sm text-muted-foreground">
          Browse and manage your scripts.
        </p>
      </div>

      <ScriptsTable scripts={scripts} />
    </div>
  );
}
