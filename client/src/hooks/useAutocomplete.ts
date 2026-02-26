import { useState, useCallback, useRef, useEffect } from "react";
import { searchItems } from "../services/api";
import { SearchResult } from "../types";

export function useAutocomplete(mode?: string) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await searchItems(q, mode);
          setResults(data);
          setIsOpen(data.length > 0);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 200);
    },
    [mode],
  );

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { query, results, isOpen, loading, search, setIsOpen, clear };
}
