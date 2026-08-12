import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search",
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 rounded-[6px] bg-card pr-9 pl-9"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-[6px] p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
