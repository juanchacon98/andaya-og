import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { formatUsd, formatEur, convertTo } from "@/lib/currency";

interface ExchangeRateDisplayProps {
  amountBs: number;
  provider?: string;
  currency?: 'USD' | 'EUR';
  className?: string;
}

export function ExchangeRateDisplay({
  amountBs,
  provider = 'bcv',
  currency = 'USD',
  className = ''
}: ExchangeRateDisplayProps) {
  const { rate, loading, stale } = useExchangeRate({ provider, code: currency });

  if (loading) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Cargando tasa...
      </div>
    );
  }

  if (!rate) {
    return (
      <div className={`text-sm text-destructive ${className}`}>
        Tasa no disponible
      </div>
    );
  }

  const converted = convertTo(currency, amountBs, rate.value, 'VES');
  const formatted = currency === 'USD' ? formatUsd(converted) : formatEur(converted);

  const fetchDate = new Date(rate.fetched_at);
  const tooltipContent = `1 ${currency} = Bs ${rate.value.toFixed(4)} • Proveedor: ${rate.provider.toUpperCase()} • Actualizado: ${fetchDate.toLocaleString('es-VE')}`;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-muted-foreground">
        ≈ {formatted}
      </span>
      {stale && (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
          Desactualizada
        </Badge>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
            {rate.source?.derived && (
              <p className="text-xs mt-1 text-yellow-600">* EUR calculado desde USD</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}