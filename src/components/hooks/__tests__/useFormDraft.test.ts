import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormDraft } from "../useFormDraft";
import type { GeneratePlanFormValues } from "../../../types";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("useFormDraft", () => {
  const defaultValues: GeneratePlanFormValues = {
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    adultsCount: 1,
    childrenCount: 0,
    budgetTotal: undefined,
    budgetCurrency: undefined,
    travelStyle: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should return default values when no draft exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("plan-generation-draft");
    });

    it("should load saved draft from localStorage", () => {
      const savedDraft = {
        name: "Paris Trip",
        destination: "Paris",
        startDate: "2024-06-01",
        endDate: "2024-06-10",
        adultsCount: 2,
        childrenCount: 1,
        budgetTotal: 1000,
        budgetCurrency: "EUR",
        travelStyle: "active",
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedDraft));

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual({
        ...defaultValues,
        ...savedDraft,
      });
    });

    it("should merge saved draft with default values", () => {
      const partialDraft = {
        name: "Rome Trip",
        destination: "Rome",
        adultsCount: 3,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(partialDraft));

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual({
        ...defaultValues,
        ...partialDraft,
      });
    });

    it("should handle invalid JSON in localStorage gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid-json");

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
    });

    it("should handle localStorage errors gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
    });

    it("should handle null localStorage gracefully", () => {
      // Simulate environment without localStorage
      Object.defineProperty(window, "localStorage", {
        value: null,
        writable: true,
      });

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);

      // Restore localStorage
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });
    });
  });

  describe("Auto-saving functionality", () => {
    it("should save values to localStorage when they change", () => {
      const { result } = renderHook(() => useFormDraft());

      const newValues = {
        ...defaultValues,
        name: "Barcelona Trip",
        destination: "Barcelona",
        adultsCount: 2,
      };

      act(() => {
        result.current.setValues(newValues);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("plan-generation-draft", JSON.stringify(newValues));
    });

    it("should save partial updates correctly", () => {
      const { result } = renderHook(() => useFormDraft());

      act(() => {
        result.current.setValues((prev) => ({
          ...prev,
          name: "Berlin Trip",
          destination: "Berlin",
        }));
      });

      const expectedValues = {
        ...defaultValues,
        name: "Berlin Trip",
        destination: "Berlin",
      };

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("plan-generation-draft", JSON.stringify(expectedValues));
    });

    it("should handle multiple rapid updates", () => {
      const { result } = renderHook(() => useFormDraft());

      act(() => {
        result.current.setValues((prev) => ({ ...prev, name: "Trip 1" }));
        result.current.setValues((prev) => ({ ...prev, destination: "City 1" }));
        result.current.setValues((prev) => ({ ...prev, adultsCount: 3 }));
      });

      // Should save the final state
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        "plan-generation-draft",
        JSON.stringify({
          ...defaultValues,
          name: "Trip 1",
          destination: "City 1",
          adultsCount: 3,
        })
      );
    });

    it("should handle localStorage setItem errors gracefully", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("localStorage full");
      });

      const { result } = renderHook(() => useFormDraft());

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.setValues({
            ...defaultValues,
            name: "Test Trip",
          });
        });
      }).not.toThrow();
    });
  });

  describe("Draft reset functionality", () => {
    it("should reset values to defaults", () => {
      // Start with saved draft
      const savedDraft = {
        name: "Paris Trip",
        destination: "Paris",
        adultsCount: 2,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedDraft));

      const { result } = renderHook(() => useFormDraft());

      // Verify initial state has saved values
      expect(result.current.values.name).toBe("Paris Trip");

      // Reset draft
      act(() => {
        result.current.resetDraft();
      });

      // Should reset to default values
      expect(result.current.values).toEqual(defaultValues);
    });

    it("should remove draft from localStorage", () => {
      const { result } = renderHook(() => useFormDraft());

      act(() => {
        result.current.resetDraft();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("plan-generation-draft");
    });

    it("should handle localStorage removeItem errors gracefully", () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const { result } = renderHook(() => useFormDraft());

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.resetDraft();
        });
      }).not.toThrow();

      // Should still reset values
      expect(result.current.values).toEqual(defaultValues);
    });

    it("should reset after form submission workflow", () => {
      const { result } = renderHook(() => useFormDraft());

      // Simulate filling out form
      act(() => {
        result.current.setValues({
          ...defaultValues,
          name: "London Trip",
          destination: "London",
          startDate: "2024-07-01",
          endDate: "2024-07-05",
          adultsCount: 2,
        });
      });

      // Verify values are set
      expect(result.current.values.name).toBe("London Trip");
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // Simulate successful form submission
      act(() => {
        result.current.resetDraft();
      });

      // Should be back to defaults
      expect(result.current.values).toEqual(defaultValues);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("plan-generation-draft");
    });
  });

  describe("Complex data types", () => {
    it("should handle undefined values correctly", () => {
      const { result } = renderHook(() => useFormDraft());

      act(() => {
        result.current.setValues({
          ...defaultValues,
          budgetTotal: undefined,
          budgetCurrency: undefined,
          travelStyle: undefined,
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "plan-generation-draft",
        JSON.stringify({
          ...defaultValues,
          budgetTotal: undefined,
          budgetCurrency: undefined,
          travelStyle: undefined,
        })
      );
    });

    it("should handle special string values", () => {
      const { result } = renderHook(() => useFormDraft());

      const specialValues = {
        ...defaultValues,
        name: "Trip with 'quotes' and \"double quotes\"",
        destination: "City with émojis 🏙️ and ñ characters",
      };

      act(() => {
        result.current.setValues(specialValues);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("plan-generation-draft", JSON.stringify(specialValues));
    });

    it("should handle large form data", () => {
      const { result } = renderHook(() => useFormDraft());

      const largeValues = {
        ...defaultValues,
        name: "A".repeat(1000),
        destination: "B".repeat(1000),
      };

      act(() => {
        result.current.setValues(largeValues);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("plan-generation-draft", JSON.stringify(largeValues));
    });
  });

  describe("Edge cases", () => {
    it("should handle corrupted localStorage data", () => {
      mockLocalStorage.getItem.mockReturnValue('{"name":"Test","invalid":}');

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
    });

    it("should handle localStorage returning non-string values", () => {
      mockLocalStorage.getItem.mockReturnValue(123 as unknown as string);

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
    });

    it("should handle extra properties in saved draft", () => {
      const draftWithExtra = {
        name: "Test Trip",
        destination: "Test City",
        extraProperty: "should be ignored",
        anotherExtra: 123,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(draftWithExtra));

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual({
        ...defaultValues,
        name: "Test Trip",
        destination: "Test City",
        // Extra properties should not be included
      });
    });

    it("should handle empty object in localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}));

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
    });

    it("should handle array in localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
    });

    it("should handle function calls in setValues", () => {
      const { result } = renderHook(() => useFormDraft());

      act(() => {
        result.current.setValues((prevValues) => {
          expect(prevValues).toEqual(defaultValues);
          return {
            ...prevValues,
            name: "Updated Trip",
            adultsCount: prevValues.adultsCount + 1,
          };
        });
      });

      expect(result.current.values.name).toBe("Updated Trip");
      expect(result.current.values.adultsCount).toBe(2);
    });

    it("should handle rapid mount/unmount cycles", () => {
      const { unmount: unmount1 } = renderHook(() => useFormDraft());
      unmount1();

      const { unmount: unmount2 } = renderHook(() => useFormDraft());
      unmount2();

      const { result } = renderHook(() => useFormDraft());

      expect(result.current.values).toEqual(defaultValues);
    });
  });

  describe("Performance considerations", () => {
    it("should not cause unnecessary re-renders", () => {
      const { result, rerender } = renderHook(() => useFormDraft());

      const initialSetValues = result.current.setValues;
      const initialResetDraft = result.current.resetDraft;

      rerender();

      // Functions should be stable references
      expect(result.current.setValues).toBe(initialSetValues);
      expect(result.current.resetDraft).toBe(initialResetDraft);
    });

    it("should debounce localStorage writes", () => {
      const { result } = renderHook(() => useFormDraft());

      // Make multiple rapid changes
      act(() => {
        result.current.setValues((prev) => ({ ...prev, name: "A" }));
        result.current.setValues((prev) => ({ ...prev, name: "AB" }));
        result.current.setValues((prev) => ({ ...prev, name: "ABC" }));
      });

      // Should only save the final state
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        "plan-generation-draft",
        JSON.stringify({
          ...defaultValues,
          name: "ABC",
        })
      );
    });
  });
});
