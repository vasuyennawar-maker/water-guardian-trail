import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onReset,
  extra,
}: {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Filters
      </span>
      {filters.map((f) => (
        <Select key={f.key} value={values[f.key] ?? "all"} onValueChange={(v) => onChange(f.key, v)}>
          <SelectTrigger
            aria-label={f.label}
            className="h-9 w-auto min-w-[9.5rem] rounded-[6px] border-border bg-card text-sm"
          >
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {extra}
      {onReset ? (
        <Button variant="ghost" size="sm" className="rounded-[6px]" onClick={onReset}>
          Reset
        </Button>
      ) : null}
    </div>
  );
}
