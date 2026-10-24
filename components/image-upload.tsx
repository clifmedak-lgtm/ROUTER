import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { useSignUpload, usePaymentConfig } from "../queries/app";
import { Spinner } from "./layout";

/** Uploads an image straight to Cloudinary using a server-signed request. */
export function ImageUpload({
  kind,
  label,
  value,
  onChange,
}: {
  kind: "driver-photo" | "license";
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const cfg = usePaymentConfig();
  const sign = useSignUpload();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (cfg.data && !cfg.data.uploads) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-cream/50 p-4 text-xs text-muted">
        {label}: photo uploads will be enabled soon.
      </div>
    );
  }

  const pick = async (file: File) => {
    setErr(null);
    setBusy(true);
    try {
      const s = await sign.mutateAsync({ kind });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", s.apiKey);
      fd.append("timestamp", String(s.timestamp));
      fd.append("folder", s.folder);
      fd.append("signature", s.signature);
      const res = await fetch(s.uploadUrl, { method: "POST", body: fd });
      const data = (await res.json()) as { secure_url?: string; error?: { message: string } };
      if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
      onChange(data.secure_url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-line bg-white p-3 transition hover:bg-cream/50">
      {value ? (
        <img src={value} alt="" className="size-14 rounded-lg object-cover" />
      ) : (
        <span className="grid size-14 place-items-center rounded-lg bg-cream">{busy ? <Spinner /> : <ImagePlus className="size-5 text-muted" />}</span>
      )}
      <span className="text-sm">
        <span className="block font-medium">{label}</span>
        <span className="text-xs text-muted">{err ?? (value ? "Tap to replace" : "JPG or PNG")}</span>
      </span>
      <input type="file" aria-label={label} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
    </label>
  );
}
