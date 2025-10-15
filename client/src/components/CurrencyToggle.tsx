import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

interface ExchangeRates {
  base: string;
  rates: { MXN: number };
  date: string;
}

export function CurrencyToggle() {
  const [currency, setCurrency] = useState<"USD" | "MXN">("USD");
  
  const { data: rates } = useQuery<ExchangeRates>({
    queryKey: ["/api/exchange-rates"],
    refetchInterval: 3600000, // Refetch every hour
  });

  useEffect(() => {
    const stored = localStorage.getItem("preferred-currency");
    if (stored === "MXN" || stored === "USD") {
      setCurrency(stored);
    }
  }, []);

  const toggleCurrency = () => {
    const newCurrency = currency === "USD" ? "MXN" : "USD";
    setCurrency(newCurrency);
    localStorage.setItem("preferred-currency", newCurrency);
    window.dispatchEvent(new CustomEvent("currency-change", { detail: { currency: newCurrency, rate: rates?.rates.MXN || 17.5 } }));
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCurrency}
      className="gap-2"
      data-testid="button-currency-toggle"
    >
      <DollarSign className="h-4 w-4" />
      <span className="font-medium">{currency}</span>
    </Button>
  );
}

// Hook for components to use currency conversion
export function useCurrency() {
  const [currency, setCurrency] = useState<"USD" | "MXN">("USD");
  const [rate, setRate] = useState<number>(17.5);

  const { data: rates } = useQuery<ExchangeRates>({
    queryKey: ["/api/exchange-rates"],
    refetchInterval: 3600000,
  });

  useEffect(() => {
    const stored = localStorage.getItem("preferred-currency");
    if (stored === "MXN" || stored === "USD") {
      setCurrency(stored);
    }
  }, []);

  useEffect(() => {
    if (rates?.rates.MXN) {
      setRate(rates.rates.MXN);
    }
  }, [rates]);

  useEffect(() => {
    const handleCurrencyChange = (e: CustomEvent) => {
      setCurrency(e.detail.currency);
      setRate(e.detail.rate);
    };

    window.addEventListener("currency-change", handleCurrencyChange as EventListener);
    return () => window.removeEventListener("currency-change", handleCurrencyChange as EventListener);
  }, []);

  const formatPrice = (priceRange: string) => {
    // Parse "$285,000 - $450,000 USD" format
    const cleaned = priceRange.replace(/[$,USD]/g, '').trim();
    const parts = cleaned.split('-').map(p => parseInt(p.trim()));
    
    if (currency === "MXN") {
      const min = Math.round(parts[0] * rate);
      const max = parts[1] ? Math.round(parts[1] * rate) : min;
      return `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`;
    }
    
    return priceRange;
  };

  return { currency, rate, formatPrice };
}
