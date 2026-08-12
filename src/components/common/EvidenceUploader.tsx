import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LocalEvidence {
  id: string;
  name: string;
  url: string;
}

/**
 * Mobile-first evidence capture. `capture="environment"` opens the rear camera
 * directly on mobile browsers. Files stay client-side in this prototype;
 * a real implementation would upload to object storage via a service.
 */
export function EvidenceUploader({
  items,
  onChange,
}: {
  items: LocalEvidence[];
  onChange: (next: LocalEvidence[]) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function accept(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, url: URL.createObjectURL(f) }));
    if (next.length === 0) {
      setError("Only image files can be attached as evidence.");
      return;
    }
    setError(null);
    onChange([...items, ...next]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => cameraRef.current?.click()} className="rounded-[6px]">
          <Camera className="mr-1.5 h-4 w-4" aria-hidden /> Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => galleryRef.current?.click()}
          className="rounded-[6px]"
        >
          <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden /> Add from device
        </Button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => accept(e.target.files)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => accept(e.target.files)}
        />
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No photos attached yet. At least one clear photo of the site makes verification much faster.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it) => (
            <li key={it.id} className="relative overflow-hidden rounded-[6px] border border-border">
              <img src={it.url} alt={it.name} className="h-24 w-full object-cover" />
              <button
                type="button"
                aria-label={`Remove ${it.name}`}
                onClick={() => onChange(items.filter((x) => x.id !== it.id))}
                className="absolute top-1 right-1 rounded-full bg-card/90 p-1 text-foreground shadow-overlay"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
