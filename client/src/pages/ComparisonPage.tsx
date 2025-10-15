import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useCurrency } from "@/components/CurrencyToggle";
import type { Property } from "@shared/schema";

export default function ComparisonPage() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const handleToggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 properties
      }
      return [...prev, propertyId];
    });
  };

  const selectedProps = properties.filter((p) => selectedProperties.includes(p.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif font-semibold text-xl">Property Comparison</h1>
          </div>
          <Badge variant="secondary">
            {selectedProperties.length} / 3 Selected
          </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Property Selection */}
        {selectedProperties.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Properties to Compare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover-elevate ${
                      selectedProperties.includes(property.id)
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => handleToggleProperty(property.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => handleToggleProperty(property.id)}
                        disabled={
                          selectedProperties.length >= 3 &&
                          !selectedProperties.includes(property.id)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 break-words">{property.name}</h3>
                        <p className="text-sm text-muted-foreground break-words">{property.location}</p>
                        <p className="text-sm font-mono mt-2 break-words">{formatPrice(property.priceRange)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        {selectedProps.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 bg-muted font-semibold">Feature</th>
                  {selectedProps.map((prop) => (
                    <th key={prop.id} className="text-left p-4 bg-muted">
                      <div className="min-w-[200px] max-w-[300px]">
                        <h3 className="font-serif font-semibold text-lg mb-1 break-words">{prop.name}</h3>
                        <p className="text-sm text-muted-foreground font-normal break-words">
                          {prop.location}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleToggleProperty(prop.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Price Range</td>
                  {selectedProps.map((prop) => (
                    <td key={prop.id} className="p-4 font-mono break-words max-w-[300px]">
                      {formatPrice(prop.priceRange)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">ROI</td>
                  {selectedProps.map((prop) => (
                    <td key={prop.id} className="p-4">
                      <Badge variant="default">{prop.roi}</Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Country</td>
                  {selectedProps.map((prop) => (
                    <td key={prop.id} className="p-4">
                      {prop.country}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Property Type</td>
                  {selectedProps.map((prop) => (
                    <td key={prop.id} className="p-4 capitalize">
                      {prop.propertyType}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium align-top">Features</td>
                  {selectedProps.map((prop) => (
                    <td key={prop.id} className="p-4 max-w-[300px]">
                      <div className="flex flex-wrap gap-1.5">
                        {prop.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs truncate max-w-[140px]" title={feature}>
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium align-top">Description</td>
                  {selectedProps.map((prop) => (
                    <td key={prop.id} className="p-4 text-sm text-muted-foreground max-w-[300px] break-words">
                      {prop.description}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Add More Button */}
        {selectedProps.length > 0 && selectedProps.length < 3 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Add Another Property</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {properties
                  .filter((p) => !selectedProperties.includes(p.id))
                  .map((property) => (
                    <div
                      key={property.id}
                      className="border rounded-lg p-4 cursor-pointer transition-all hover-elevate"
                      onClick={() => handleToggleProperty(property.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleToggleProperty(property.id)}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{property.name}</h3>
                          <p className="text-sm text-muted-foreground">{property.location}</p>
                          <p className="text-sm font-mono mt-2">
                            {formatPrice(property.priceRange)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
