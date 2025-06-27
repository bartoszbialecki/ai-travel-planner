import type { AIGenerationRequest } from "./types";

export function generateTravelPlanPrompt(request: AIGenerationRequest): string {
  const travelStyleText = request.travel_style
    ? `\n- Styl podróży: ${getTravelStyleDescription(request.travel_style)}`
    : "";

  const budgetText = request.budget_total
    ? `\n- Budżet: ${request.budget_total} ${request.budget_currency || "PLN"}`
    : "";

  return `Wygeneruj szczegółowy plan podróży dla następujących parametrów:

- Destynacja: ${request.destination}
- Okres: ${request.start_date} - ${request.end_date}
- Liczba osób: ${request.adults_count} dorosłych, ${request.children_count} dzieci${budgetText}${travelStyleText}

Wymagania:
- Planuj na każdy dzień osobno
- Uwzględnij godziny otwarcia atrakcji
- Podaj szacowane koszty w ${request.budget_currency || "PLN"}
- Optymalizuj kolejność zwiedzania (bliskość lokalizacji)
- Uwzględnij preferencje rodzinne (jeśli są dzieci)
- Każda aktywność powinna mieć opis, adres, godziny otwarcia i koszt

Zwróć odpowiedź w formacie JSON:
{
  "days": [
    {
      "day_number": 1,
      "activities": [
        {
          "name": "Nazwa atrakcji",
          "description": "Szczegółowy opis atrakcji",
          "address": "Pełny adres",
          "opening_hours": "09:00-18:00",
          "cost": 25,
          "activity_order": 1
        }
      ]
    }
  ]
}`;
}

function getTravelStyleDescription(style: string): string {
  switch (style) {
    case "active":
      return "Aktywny - intensywne zwiedzanie, dużo ruchu";
    case "relaxation":
      return "Relaksacyjny - spokojne tempo, odpoczynek";
    case "flexible":
      return "Elastyczny - zrównoważone tempo";
    default:
      return "Standardowy";
  }
}
