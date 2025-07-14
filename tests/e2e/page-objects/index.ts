// Page Object Model exports
export { BasePage } from "./base-page";
export { LoginPage, type LoginCredentials } from "./login-page";
export { GenerationForm, type PlanFormData } from "./generation-form";
export { StatusModal, type GenerationStatus } from "./status-modal";
export { GenerationPage } from "./generation-page";

// Re-export commonly used types for convenience
export type { Page, Locator } from "@playwright/test";
