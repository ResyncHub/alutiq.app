import { describe, expect, it } from "vitest";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayInWarsaw,
  warsawDayRangeUtc,
  weekdayMonday1,
} from "./dates";

describe("todayInWarsaw", () => {
  it("zwraca datę warszawską niezależnie od chwili UTC (późny wieczór = już następny dzień)", () => {
    // 2026-03-01 23:30 UTC to w Warszawie 2026-03-02 00:30
    const instant = new Date("2026-03-01T23:30:00Z");
    expect(todayInWarsaw(instant)).toBe("2026-03-02");
  });
});

describe("weekdayMonday1", () => {
  it("poniedziałek = 1, niedziela = 7", () => {
    expect(weekdayMonday1("2026-08-10")).toBe(1); // poniedziałek
    expect(weekdayMonday1("2026-08-16")).toBe(7); // niedziela
  });
});

describe("startOfWeek / endOfWeek", () => {
  it("tydzień zaczyna się w poniedziałek", () => {
    expect(startOfWeek("2026-08-13")).toBe("2026-08-10"); // czw -> pon
    expect(endOfWeek("2026-08-13")).toBe("2026-08-16"); // -> nd
  });
  it("dla poniedziałku start = ten sam dzień", () => {
    expect(startOfWeek("2026-08-10")).toBe("2026-08-10");
  });
});

describe("startOfMonth / endOfMonth", () => {
  it("granice miesiąca", () => {
    expect(startOfMonth("2026-08-13")).toBe("2026-08-01");
    expect(endOfMonth("2026-08-13")).toBe("2026-08-31");
  });
  it("luty w roku przestępnym", () => {
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
  });
});

describe("addDays", () => {
  it("przechodzi przez granicę miesiąca", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("warsawDayRangeUtc — DST", () => {
  it("doba zimowa ma offset +1h (start 23:00 UTC dnia poprzedniego)", () => {
    const { startUtc, endUtc } = warsawDayRangeUtc("2026-01-15");
    expect(startUtc.toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(endUtc.toISOString()).toBe("2026-01-15T23:00:00.000Z");
  });
  it("doba letnia ma offset +2h (start 22:00 UTC dnia poprzedniego)", () => {
    const { startUtc, endUtc } = warsawDayRangeUtc("2026-07-15");
    expect(startUtc.toISOString()).toBe("2026-07-14T22:00:00.000Z");
    expect(endUtc.toISOString()).toBe("2026-07-15T22:00:00.000Z");
  });
});
