/**
 * Tests for client/src/hooks/useAutocomplete.ts
 *
 * Validates debounced search, clear, and edge cases.
 */
import { renderHook, act } from "@testing-library/react";
import { useAutocomplete } from "../../client/src/hooks/useAutocomplete";

// Mock the api module
jest.mock("../../client/src/services/api", () => ({
  searchItems: jest.fn(),
}));

import { searchItems } from "../../client/src/services/api";
const mockSearch = searchItems as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  mockSearch.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useAutocomplete", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useAutocomplete());
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("sets query immediately on search", () => {
    const { result } = renderHook(() => useAutocomplete());
    act(() => result.current.search("Sto"));
    expect(result.current.query).toBe("Sto");
  });

  it("clears results for empty query", () => {
    const { result } = renderHook(() => useAutocomplete());
    act(() => result.current.search("Sto"));
    act(() => result.current.search(""));
    expect(result.current.results).toEqual([]);
    expect(result.current.isOpen).toBe(false);
  });

  it("debounces and fetches results", async () => {
    mockSearch.mockResolvedValue([
      { id: "1", name: "Stone", textureUrl: "", type: "block" },
    ]);

    const { result } = renderHook(() => useAutocomplete());
    act(() => result.current.search("Sto"));

    // Before debounce fires
    expect(mockSearch).not.toHaveBeenCalled();

    // Advance past debounce delay
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(mockSearch).toHaveBeenCalledWith("Sto", undefined);
    expect(result.current.results).toHaveLength(1);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("keeps isOpen false when API returns empty array", async () => {
    mockSearch.mockResolvedValue([]);

    const { result } = renderHook(() => useAutocomplete());
    act(() => result.current.search("xyz"));

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it("handles API errors gracefully", async () => {
    mockSearch.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useAutocomplete());
    act(() => result.current.search("err"));

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("clear() resets everything", async () => {
    mockSearch.mockResolvedValue([
      { id: "1", name: "Stone", textureUrl: "", type: "block" },
    ]);

    const { result } = renderHook(() => useAutocomplete());
    act(() => result.current.search("Sto"));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    act(() => result.current.clear());
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.isOpen).toBe(false);
  });

  it("cancels previous debounce on rapid typing", async () => {
    mockSearch.mockResolvedValue([]);

    const { result } = renderHook(() => useAutocomplete());
    act(() => result.current.search("S"));
    act(() => result.current.search("St"));
    act(() => result.current.search("Sto"));

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    // Only the last call should fire
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith("Sto", undefined);
  });

  it("passes mode parameter to searchItems", async () => {
    mockSearch.mockResolvedValue([
      { id: "1", name: "Stone Sword", textureUrl: "", type: "tool" },
    ]);

    const { result } = renderHook(() => useAutocomplete("crafting"));
    act(() => result.current.search("Sto"));

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(mockSearch).toHaveBeenCalledWith("Sto", "crafting");
  });
});
