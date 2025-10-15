import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = language.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
      data-testid="button-language-toggle"
    >
      <Languages className="h-4 w-4" />
      <span className="font-medium">{language.startsWith("es") ? "ES" : "EN"}</span>
    </Button>
  );
}
