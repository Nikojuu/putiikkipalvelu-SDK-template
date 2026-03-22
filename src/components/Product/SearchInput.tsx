"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

export function SearchInput() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentQuery = searchParams.get("q") || "";
  const [value, setValue] = useState(currentQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  const updateSearch = useCallback(
    (newValue: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newValue.trim()) {
        params.set("q", newValue.trim());
        params.set("page", "1");
      } else {
        params.delete("q");
        if (params.get("sort") === "relevance") {
          params.delete("sort");
        }
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, searchParams, router]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSearch(newValue);
    }, 400);
  };

  const handleClear = () => {
    setValue("");
    updateSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateSearch(value);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Hae tuotteita..."
        className="w-full pl-10 pr-10 py-2 border border-charcoal/10 bg-warm-white
                   text-sm font-secondary text-charcoal placeholder:text-charcoal/40
                   focus:outline-none focus:border-rose-gold/40 transition-colors duration-300"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
          aria-label="Tyhjennä haku"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
