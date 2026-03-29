import { YouTubeConnectCard } from "@/components/youtube-connect-card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your YouTube connection and app preferences.
        </p>
      </div>

      <section>
        <h3 className="text-base font-medium text-zinc-800 mb-3">
          YouTube Integration
        </h3>
        <YouTubeConnectCard />
      </section>
    </div>
  );
}
