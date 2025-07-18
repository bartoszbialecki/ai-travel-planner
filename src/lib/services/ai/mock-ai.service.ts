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
    // Use shorter delay in test environment to avoid timeouts
    const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
    const delay = isTest ? Math.random() * 100 + 50 : Math.random() * 2000 + 1000; // 50-150ms in tests, 1-3s in production
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
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // For same-day trips, return 1 day minimum
    return Math.max(1, days);
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
    if (destination.includes("paris")) {
      return [
        {
          name: "Eiffel Tower",
          description: "Iconic iron tower standing 324 meters tall, symbol of Paris",
          address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
          opening_hours: "09:00-23:45",
          baseCost: 26,
        },
        {
          name: "Louvre Museum",
          description: "World's largest art museum with collection of over 35,000 works",
          address: "Rue de Rivoli, 75001 Paris",
          opening_hours: "09:00-18:00",
          baseCost: 17,
        },
        {
          name: "Arc de Triomphe",
          description: "Monumental arch commemorating Napoleon's victories",
          address: "Place Charles de Gaulle, 75008 Paris",
          opening_hours: "10:00-23:00",
          baseCost: 13,
        },
        {
          name: "Notre-Dame Cathedral",
          description: "Medieval Gothic cathedral, architectural masterpiece",
          address: "6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris",
          opening_hours: "08:00-18:45",
          baseCost: 0,
        },
      ];
    }

    if (destination.includes("rome")) {
      return [
        {
          name: "Colosseum",
          description: "Ancient amphitheater, symbol of Roman Empire's power",
          address: "Piazza del Colosseo, 1, 00184 Roma RM, Italy",
          opening_hours: "08:30-19:00",
          baseCost: 16,
        },
        {
          name: "Vatican City",
          description: "World's smallest state, seat of the Pope",
          address: "Vatican City",
          opening_hours: "07:00-18:00",
          baseCost: 0,
        },
        {
          name: "Trevi Fountain",
          description: "Baroque fountain, one of Rome's most beautiful places",
          address: "Piazza di Trevi, 00187 Roma RM, Italy",
          opening_hours: "24/7",
          baseCost: 0,
        },
      ];
    }

    // Default attractions for other destinations
    const capitalizedDestination = destination.charAt(0).toUpperCase() + destination.slice(1);
    return [
      {
        name: `${capitalizedDestination} City Museum`,
        description: `Interesting museum showcasing the history and culture of ${capitalizedDestination}`,
        address: `Main Street 1, ${capitalizedDestination}`,
        opening_hours: "10:00-18:00",
        baseCost: 15,
      },
      {
        name: `${capitalizedDestination} Central Park`,
        description: `Peaceful park in ${capitalizedDestination} perfect for walks and relaxation`,
        address: `Park Avenue 5, ${capitalizedDestination}`,
        opening_hours: "06:00-22:00",
        baseCost: 0,
      },
      {
        name: `${capitalizedDestination} Local Restaurant`,
        description: `Traditional restaurant in ${capitalizedDestination} serving local dishes`,
        address: `Delicious Street 10, ${capitalizedDestination}`,
        opening_hours: "12:00-22:00",
        baseCost: 25,
      },
    ];
  }
}
