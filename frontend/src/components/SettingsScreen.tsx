import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, Settings2, XCircle } from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import { fetchSettings, updateSetting } from "../lib/api";
import type { AppSetting } from "../types";

export function SettingsScreen() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSettings(token);
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = (updated: AppSetting) => {
    setSettings((prev) => prev.map((s) => (s.key === updated.key ? updated : s)));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Settings</h1>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
          <button type="button" className="secondary-button" onClick={load}>
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <SettingRow key={setting.key} setting={setting} onUpdated={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────

function SettingRow({
  setting,
  onUpdated,
}: {
  setting: AppSetting;
  onUpdated: (updated: AppSetting) => void;
}) {
  const { token } = useAuth();
  const [value, setValue] = useState(String(setting.value));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync if parent updates
  useEffect(() => {
    setValue(String(setting.value));
  }, [setting.value]);

  const isDirty = value !== String(setting.value);

  const handleSave = async () => {
    if (!token || !isDirty) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateSetting(
        token,
        setting.key,
        setting.type === "number" ? Number(value) : value
      );
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-subpanel rounded-2xl border border-white/8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
            <Settings2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-white">{setting.label}</p>
            {setting.description && (
              <p className="mt-0.5 text-xs text-slate-500">{setting.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type={setting.type === "number" ? "number" : "text"}
            className="input-field w-28 py-2 text-center text-sm"
            min={setting.type === "number" ? 1 : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            type="button"
            className="primary-button px-4 py-2 text-sm disabled:opacity-50"
            disabled={!isDirty || saving}
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {saveError && (
        <p className="mt-3 text-xs text-rose-300">{saveError}</p>
      )}
      {saved && (
        <p className="mt-3 text-xs text-emerald-400">Saved successfully.</p>
      )}
    </div>
  );
}
