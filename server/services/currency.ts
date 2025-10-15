// Currency conversion service using exchangerate-api.com
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

interface ExchangeRates {
  base: string;
  rates: { [key: string]: number };
  date: string;
}

let cachedRates: ExchangeRates | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && now - lastFetch < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(EXCHANGE_API_URL);
    if (!response.ok) {
      throw new Error(`Exchange API error: ${response.statusText}`);
    }
    
    cachedRates = await response.json();
    lastFetch = now;
    return cachedRates!;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    
    // Return fallback rate if API fails
    if (cachedRates) return cachedRates;
    
    return {
      base: "USD",
      rates: { MXN: 17.5 }, // Fallback approximate rate
      date: new Date().toISOString(),
    };
  }
}

export function convertUSDToMXN(usdAmount: number, rate: number): number {
  return Math.round(usdAmount * rate);
}

export function parsePrice(priceRange: string): { min: number; max: number } {
  // Parse "$285,000 - $450,000 USD" format
  const cleaned = priceRange.replace(/[$,USD]/g, '').trim();
  const parts = cleaned.split('-').map(p => parseInt(p.trim()));
  
  return {
    min: parts[0] || 0,
    max: parts[1] || parts[0] || 0,
  };
}
