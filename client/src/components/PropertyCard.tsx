import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Home } from "lucide-react";
import { useCurrency } from "@/components/CurrencyToggle";
import type { Property } from "@shared/schema";

interface PropertyCardProps {
  property: Property;
  onViewDetails?: (property: Property) => void;
}

export function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const { formatPrice } = useCurrency();
  
  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-property-${property.id}`}>
      <div className="relative aspect-video bg-muted overflow-hidden">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-16 w-16 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground border-0 shadow-lg">
            <TrendingUp className="h-3 w-3 mr-1" />
            {property.roi} ROI
          </Badge>
        </div>
      </div>

      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif font-semibold text-lg leading-tight break-words" data-testid={`text-property-name-${property.id}`}>
            {property.name}
          </h3>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Price Range</span>
          <span className="font-mono font-semibold text-sm" data-testid={`text-price-${property.id}`}>
            {formatPrice(property.priceRange)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {property.features.slice(0, 3).map((feature, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs truncate max-w-[120px]" title={feature}>
              {feature}
            </Badge>
          ))}
          {property.features.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{property.features.length - 3} more
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {property.description}
        </p>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          data-testid={`button-view-details-${property.id}`}
          onClick={() => onViewDetails?.(property)}
          variant="outline"
          className="flex-1"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
