import { BaseAIService } from "./base-ai.service";
import type { AIGenerationRequest, AIGenerationResult, AITravelPlanResponse } from "./types";

export class MockAIService extends BaseAIService {
  async generateTravelPlan(request: AIGenerationRequest): Promise<AIGenerationResult> {
    const startTime = Date.now();

    if (!this.validateRequest(request)) {
      return {
        success: false,
        error: "Invalid request parameters",
        processing_time_ms: this.calculateProcessingTime(startTime),
      };
    }

    await this.simulateProcessing();

    const mockData = this.generateMockPlan(request);

    return {
      success: true,
      data: mockData,
      processing_time_ms: this.calculateProcessingTime(startTime),
    };
  }

  private async simulateProcessing(): Promise<void> {
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private generateMockPlan(request: AIGenerationRequest): AITravelPlanResponse {
    const daysCount = this.calculateDaysCount(request.start_date, request.end_date);
    const destination = request.destination.toLowerCase();

    const days = [];
    for (let day = 1; day <= daysCount; day++) {
      days.push({
        day_number: day,
        activities: this.generateMockActivities(destination, day, request),
      });
    }

    return { days };
  }

  private calculateDaysCount(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private generateMockActivities(destination: string, day: number, request: AIGenerationRequest) {
    const activitiesPerDay = this.getActivitiesPerDay(request.travel_style);
    const activities = [];

    for (let i = 1; i <= activitiesPerDay; i++) {
      activities.push(this.generateMockActivity(destination, day, i, request));
    }

    return activities;
  }

  private getActivitiesPerDay(travelStyle?: string | null): number {
    switch (travelStyle) {
      case "active":
        return 4;
      case "relaxation":
        return 2;
      case "flexible":
      default:
        return 3;
    }
  }

  private generateMockActivity(destination: string, day: number, order: number, request: AIGenerationRequest) {
    const attractions = this.getAttractionsForDestination(destination);
    const attraction = attractions[(day + order) % attractions.length];

    return {
      name: attraction.name,
      description: attraction.description,
      address: attraction.address,
      opening_hours: attraction.opening_hours,
      cost: this.calculateCost(attraction.baseCost, request.adults_count, request.children_count),
      activity_order: order,
    };
  }

  private calculateCost(baseCost: number, adults: number, children: number): number {
    return baseCost * adults + Math.floor(baseCost * 0.5 * children);
  }

  private getAttractionsForDestination(destination: string) {
    if (destination.includes("paryż") || destination.includes("paris")) {
      return [
        {
          name: "Wieża Eiffla",
          description: "Ikoniczna żelazna wieża o wysokości 324 metrów, symbol Paryża",
          address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
          opening_hours: "09:00-23:45",
          baseCost: 26,
        },
        {
          name: "Luwr",
          description: "Największe muzeum sztuki na świecie z kolekcją ponad 35,000 dzieł",
          address: "Rue de Rivoli, 75001 Paris",
          opening_hours: "09:00-18:00",
          baseCost: 17,
        },
        {
          name: "Łuk Triumfalny",
          description: "Monumentalny łuk upamiętniający zwycięstwa Napoleona",
          address: "Place Charles de Gaulle, 75008 Paris",
          opening_hours: "10:00-23:00",
          baseCost: 13,
        },
        {
          name: "Katedra Notre-Dame",
          description: "Średniowieczna katedra gotycka, arcydzieło architektury",
          address: "6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris",
          opening_hours: "08:00-18:45",
          baseCost: 0,
        },
      ];
    }

    if (destination.includes("rzym") || destination.includes("rome")) {
      return [
        {
          name: "Koloseum",
          description: "Antyczny amfiteatr, symbol potęgi Imperium Rzymskiego",
          address: "Piazza del Colosseo, 1, 00184 Roma RM, Italy",
          opening_hours: "08:30-19:00",
          baseCost: 16,
        },
        {
          name: "Watykan",
          description: "Najmniejsze państwo świata, siedziba papieża",
          address: "Vatican City",
          opening_hours: "07:00-18:00",
          baseCost: 0,
        },
        {
          name: "Fontanna di Trevi",
          description: "Barokowa fontanna, jedno z najpiękniejszych miejsc w Rzymie",
          address: "Piazza di Trevi, 00187 Roma RM, Italy",
          opening_hours: "24/7",
          baseCost: 0,
        },
      ];
    }

    // Default attractions for other destinations
    return [
      {
        name: "Muzeum Miejskie",
        description: "Interesujące muzeum prezentujące historię i kulturę regionu",
        address: "ul. Główna 1, Miasto",
        opening_hours: "10:00-18:00",
        baseCost: 15,
      },
      {
        name: "Park Miejski",
        description: "Spokojny park idealny na spacer i odpoczynek",
        address: "ul. Parkowa 5, Miasto",
        opening_hours: "06:00-22:00",
        baseCost: 0,
      },
      {
        name: "Restauracja Regionalna",
        description: "Lokalna restauracja serwująca tradycyjne dania",
        address: "ul. Smaczna 10, Miasto",
        opening_hours: "12:00-22:00",
        baseCost: 25,
      },
    ];
  }
}
