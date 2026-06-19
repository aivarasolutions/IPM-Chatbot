import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      // Header
      "app.title": "IPM Property Expert",
      "app.subtitle": "Vacation Rental Management",
      
      // Welcome Screen
      "welcome.title": "IPM Property Management Expert",
      "welcome.subtitle": "Ask about vacation rental management, owner earnings, marketing, and property performance.",
      
      // Property Card
      "property.priceRange": "Price Range",
      "property.viewDetails": "View Details",
      "property.featuredProperties": "Featured Properties",
      "property.loading": "Properties loading...",
      
      // Chat
      "chat.inputPlaceholder": "Ask about property management, rentals, or getting started...",
      "chat.send": "Send",
      "chat.suggestedQuestions": "Suggested questions:",
      
      // Lead Form
      "lead.title": "Property Management Inquiry",
      "lead.subtitle": "Tell us about your property and goals",
      "lead.step1Title": "Contact Information",
      "lead.step2Title": "Property Details",
      "lead.step3Title": "Management Preferences",
      "lead.name": "Full Name",
      "lead.email": "Email Address",
      "lead.phone": "Phone Number",
      "lead.citizenship": "Country of Residence",
      "lead.budget": "Property Value (Estimate)",
      "lead.experience": "Owner Experience",
      "lead.location": "Property Location",
      "lead.timeline": "Readiness to Start",
      "lead.notes": "Additional Notes",
      "lead.next": "Next",
      "lead.back": "Back",
      "lead.submit": "Submit Inquiry",
      "lead.cancel": "Cancel",
      
      // Experience Levels
      "experience.firstTime": "First Time Owner",
      "experience.some": "Currently Self-Managing",
      "experience.extensive": "Working with Another Manager",
      
      // Timeline
      "timeline.3months": "Ready to start now",
      "timeline.3to6": "Within 1-3 months",
      "timeline.6to12": "3-6 months",
      "timeline.exploring": "Just exploring options",
      
      // Currency
      "currency.usd": "USD",
      "currency.mxn": "MXN",
    }
  },
  es: {
    translation: {
      // Header
      "app.title": "IPM Experto en Propiedades",
      "app.subtitle": "Gestión de Alquileres Vacacionales",
      
      // Welcome Screen
      "welcome.title": "Experto en Gestión de Propiedades IPM",
      "welcome.subtitle": "Pregunte sobre gestión de alquileres vacacionales, ganancias de propietarios, marketing y rendimiento de propiedades.",
      
      // Property Card
      "property.priceRange": "Rango de Precio",
      "property.viewDetails": "Ver Detalles",
      "property.featuredProperties": "Propiedades Destacadas",
      "property.loading": "Cargando propiedades...",
      
      // Chat
      "chat.inputPlaceholder": "Pregunte sobre gestión de propiedades, alquileres o cómo empezar...",
      "chat.send": "Enviar",
      "chat.suggestedQuestions": "Preguntas sugeridas:",
      
      // Lead Form
      "lead.title": "Consulta de Gestión de Propiedades",
      "lead.subtitle": "Cuéntenos sobre su propiedad y objetivos",
      "lead.step1Title": "Información de Contacto",
      "lead.step2Title": "Detalles de la Propiedad",
      "lead.step3Title": "Preferencias de Gestión",
      "lead.name": "Nombre Completo",
      "lead.email": "Correo Electrónico",
      "lead.phone": "Número de Teléfono",
      "lead.citizenship": "País de Residencia",
      "lead.budget": "Valor de la Propiedad (Estimado)",
      "lead.experience": "Experiencia como Propietario",
      "lead.location": "Ubicación de la Propiedad",
      "lead.timeline": "Disponibilidad para Comenzar",
      "lead.notes": "Notas Adicionales",
      "lead.next": "Siguiente",
      "lead.back": "Atrás",
      "lead.submit": "Enviar Consulta",
      "lead.cancel": "Cancelar",
      
      // Experience Levels
      "experience.firstTime": "Primer Propietario",
      "experience.some": "Actualmente Auto-Gestionando",
      "experience.extensive": "Trabajando con Otro Gestor",
      
      // Timeline
      "timeline.3months": "Listo para comenzar ahora",
      "timeline.3to6": "En 1-3 meses",
      "timeline.6to12": "En 3-6 meses",
      "timeline.exploring": "Solo explorando opciones",
      
      // Currency
      "currency.usd": "USD",
      "currency.mxn": "MXN",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
