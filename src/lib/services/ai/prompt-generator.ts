import type { AIGenerationRequest } from "./types";

export function generateTravelPlanPrompt(request: AIGenerationRequest): string {
  const travelStyleText = request.travel_style
    ? `\n- Travel Style: ${getTravelStyleDescription(request.travel_style)}`
    : "";

  const budgetText = request.budget_total
    ? `\n- Budget: ${request.budget_total} ${request.budget_currency || "PLN"}`
    : "";

  const familyConsiderations =
    request.children_count > 0
      ? `\n- Family-friendly considerations: Include activities suitable for children aged 5-12, consider shorter attention spans, and plan for regular breaks.`
      : "";

  const duration = calculateTripDuration(request.start_date, request.end_date);
  const activitiesPerDay = Math.max(3, Math.min(6, Math.floor(8 / duration)));

  return `Generate a detailed travel plan for the following parameters:

- Destination: ${request.destination}
- Period: ${request.start_date} to ${request.end_date} (${duration} days total)
- Group: ${request.adults_count} adults, ${request.children_count} children${budgetText}${travelStyleText}

Requirements:
- Create exactly ${duration} days of activities (day_number from 1 to ${duration})
- Plan ${activitiesPerDay} activities per day (considering opening hours and travel time)
- Include opening hours for all attractions
- Provide estimated costs in ${request.budget_currency || "PLN"}
- Optimize sightseeing order based on location proximity
- Consider family preferences and accessibility${familyConsiderations}
- Each activity must include: name, description, address, opening hours, cost, and order
- Ensure realistic travel times between locations
- Include a mix of cultural, entertainment, and dining experiences
- Consider local transportation options and walking distances

IMPORTANT: You must generate activities for ALL ${duration} days. Each day should have day_number from 1 to ${duration}.

Return the response in JSON format according to the provided schema.`;
}

function getTravelStyleDescription(style: string): string {
  switch (style) {
    case "active":
      return "Active - intensive sightseeing, lots of movement";
    case "relaxation":
      return "Relaxation - peaceful pace, rest";
    case "flexible":
      return "Flexible - balanced pace";
    default:
      return "Standard";
  }
}

function calculateTripDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the difference in days, including both start and end dates
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date

  return Math.max(1, diffDays); // Ensure at least 1 day
}
