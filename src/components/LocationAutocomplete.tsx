import { useState, useEffect, useRef } from "react";
import { MapPin, Plane, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Location } from "@/types/location";
import locationsData from "@/data/ve_locations.json";

const locations = locationsData as Location[];

interface LocationAutocompleteProps {
  value: Location | null;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Ciudad, aeropuerto...",
  className = "",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value?.label || "");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Location[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setQuery(value.label);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const filtered = locations.filter((loc) =>
        loc.label.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 8));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    
    if (!newQuery.trim()) {
      onChange(null);
    }
  };

  const handleSelect = (location: Location) => {
    setQuery(location.label);
    onChange(location);
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "airport":
        return <Plane className="h-4 w-4 text-muted-foreground" />;
      case "district":
        return <Building2 className="h-4 w-4 text-muted-foreground" />;
      default:
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleSelect(location)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
              type="button"
            >
              {getIcon(location.type)}
              <div className="flex-1">
                <div className="font-medium text-sm">{location.label}</div>
                {location.state && (
                  <div className="text-xs text-muted-foreground">{location.state}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
          <p className="text-sm text-muted-foreground">
            No se encontraron ubicaciones. Intenta con otra búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
