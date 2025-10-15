import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      // Header
      "app.title": "IPM Chatbot",
      "app.subtitle": "International Property Management",
      
      // Welcome Screen
      "welcome.title": "Welcome to IPM",
      "welcome.subtitle": "Your trusted partner for international property investment. Ask me anything about cross-border real estate, investment opportunities, or property management.",
      
      // Property Card
      "property.priceRange": "Price Range",
      "property.viewDetails": "View Details",
      "property.featuredProperties": "Featured Properties",
      "property.loading": "Properties loading...",
      
      // Chat
      "chat.inputPlaceholder": "Ask about international property investment...",
      "chat.send": "Send",
      "chat.suggestedQuestions": "Suggested questions:",
      
      // Lead Form
      "lead.title": "Investment Inquiry",
      "lead.subtitle": "Help us understand your investment goals",
      "lead.step1Title": "Contact Information",
      "lead.step2Title": "Investment Details",
      "lead.step3Title": "Investment Preferences",
      "lead.name": "Full Name",
      "lead.email": "Email Address",
      "lead.phone": "Phone Number",
      "lead.citizenship": "Citizenship",
      "lead.budget": "Investment Budget",
      "lead.experience": "Investment Experience",
      "lead.location": "Preferred Location",
      "lead.timeline": "Investment Timeline",
      "lead.notes": "Additional Notes",
      "lead.next": "Next",
      "lead.back": "Back",
      "lead.submit": "Submit Inquiry",
      "lead.cancel": "Cancel",
      
      // Experience Levels
      "experience.firstTime": "First Time Investor",
      "experience.some": "Some Experience",
      "experience.extensive": "Extensive Experience",
      
      // Timeline
      "timeline.3months": "Within 3 months",
      "timeline.3to6": "3-6 months",
      "timeline.6to12": "6-12 months",
      "timeline.exploring": "Just exploring",
      
      // Currency
      "currency.usd": "USD",
      "currency.mxn": "MXN",
    }
  },
  es: {
    translation: {
      // Header
      "app.title": "IPM Chatbot",
      "app.subtitle": "Administración Internacional de Propiedades",
      
      // Welcome Screen
      "welcome.title": "Bienvenido a IPM",
      "welcome.subtitle": "Su socio de confianza para inversiones inmobiliarias internacionales. Pregúnteme cualquier cosa sobre bienes raíces transfronterizos, oportunidades de inversión o administración de propiedades.",
      
      // Property Card
      "property.priceRange": "Rango de Precio",
      "property.viewDetails": "Ver Detalles",
      "property.featuredProperties": "Propiedades Destacadas",
      "property.loading": "Cargando propiedades...",
      
      // Chat
      "chat.inputPlaceholder": "Pregunte sobre inversión inmobiliaria internacional...",
      "chat.send": "Enviar",
      "chat.suggestedQuestions": "Preguntas sugeridas:",
      
      // Lead Form
      "lead.title": "Consulta de Inversión",
      "lead.subtitle": "Ayúdenos a entender sus objetivos de inversión",
      "lead.step1Title": "Información de Contacto",
      "lead.step2Title": "Detalles de Inversión",
      "lead.step3Title": "Preferencias de Inversión",
      "lead.name": "Nombre Completo",
      "lead.email": "Correo Electrónico",
      "lead.phone": "Número de Teléfono",
      "lead.citizenship": "Ciudadanía",
      "lead.budget": "Presupuesto de Inversión",
      "lead.experience": "Experiencia de Inversión",
      "lead.location": "Ubicación Preferida",
      "lead.timeline": "Cronograma de Inversión",
      "lead.notes": "Notas Adicionales",
      "lead.next": "Siguiente",
      "lead.back": "Atrás",
      "lead.submit": "Enviar Consulta",
      "lead.cancel": "Cancelar",
      
      // Experience Levels
      "experience.firstTime": "Primer Inversionista",
      "experience.some": "Algo de Experiencia",
      "experience.extensive": "Experiencia Extensa",
      
      // Timeline
      "timeline.3months": "Dentro de 3 meses",
      "timeline.3to6": "3-6 meses",
      "timeline.6to12": "6-12 meses",
      "timeline.exploring": "Solo explorando",
      
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
