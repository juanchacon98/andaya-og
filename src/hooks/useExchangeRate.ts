import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRateParams {
  provider?: string;
  code?: string;
}

export interface ExchangeRate {
  provider: string;
  code: string;
  buy: number | null;
  sell: number | null;
  value: number;
  fetched_at: string;
  source: any;
}

export interface UseExchangeRateResult {
  rate: ExchangeRate | null;
  loading: boolean;
  stale: boolean;
  hoursSinceUpdate: number;
  error: Error | null;
}

export function useExchangeRate({ 
  provider = 'yadio', 
  code = 'USD' 
}: ExchangeRateParams = {}): UseExchangeRateResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['exchange-rate', provider, code],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fx-latest', {
        body: { provider, code }
      });

      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    refetchInterval: 30 * 60 * 1000, // Refrescar cada 30 minutos
  });

  return {
    rate: data?.rate || null,
    loading: isLoading,
    stale: data?.stale || false,
    hoursSinceUpdate: data?.hours_since_update || 0,
    error: error as Error | null,
  };
}