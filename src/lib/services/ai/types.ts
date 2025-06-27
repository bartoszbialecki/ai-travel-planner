export interface AIActivity {
  name: string;
  description: string;
  address: string;
  opening_hours: string;
  cost: number;
  activity_order: number;
}

export interface AIDay {
  day_number: number;
  activities: AIActivity[];
}

export interface AITravelPlanResponse {
  days: AIDay[];
}

export interface AIGenerationRequest {
  destination: string;
  start_date: string;
  end_date: string;
  adults_count: number;
  children_count: number;
  budget_total?: number | null;
  budget_currency?: string | null;
  travel_style?: string | null;
}

export interface AIGenerationResult {
  success: boolean;
  data?: AITravelPlanResponse;
  error?: string;
  processing_time_ms: number;
}
