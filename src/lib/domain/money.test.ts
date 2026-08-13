import { describe, expect, it } from "vitest";
import {
  formatPln,
  grossFromNet,
  netFromGross,
  parsePlnToGr,
  roundHalfUp,
  sumGr,
} from "./money";

describe("roundHalfUp", () => {
  it("zaokrągla 0,5 w górę co do wartości bezwzględnej", () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(-2.5)).toBe(-3);
    expect(roundHalfUp(2.4)).toBe(2);
    expect(roundHalfUp(2.6)).toBe(3);
  });

  it("nie gubi grosza przez błąd float (76,5 -> 77)", () => {
    // 333 * 23 / 100 = 76,59
    expect(roundHalfUp((333 * 23) / 100)).toBe(77);
  });
});

describe("grossFromNet", () => {
  it("VAT 0% (firma zwolniona) — brutto = netto", () => {
    expect(grossFromNet(10000, 0)).toEqual({ netGr: 10000, vatGr: 0, grossGr: 10000 });
  });

  it("VAT 23% od 100,00 zł = 123,00 zł", () => {
    expect(grossFromNet(10000, 23)).toEqual({ netGr: 10000, vatGr: 2300, grossGr: 12300 });
  });

  it("odrzuca kwoty niecałkowite", () => {
    expect(() => grossFromNet(100.5, 23)).toThrow();
  });
});

describe("netFromGross", () => {
  it("odwraca brutto do netto przy 23%", () => {
    const { netGr, vatGr, grossGr } = netFromGross(12300, 23);
    expect(grossGr).toBe(12300);
    expect(netGr).toBe(10000);
    expect(vatGr).toBe(2300);
    expect(netGr + vatGr).toBe(grossGr);
  });

  it("netto + VAT zawsze równa się brutto (bez gubienia grosza)", () => {
    for (const gross of [1, 99, 12345, 99999]) {
      const b = netFromGross(gross, 23);
      expect(b.netGr + b.vatGr).toBe(gross);
    }
  });
});

describe("sumGr", () => {
  it("sumuje grosze", () => {
    expect(sumGr([1000, 250, 99])).toBe(1349);
  });
  it("odrzuca wartości niecałkowite", () => {
    expect(() => sumGr([100, 1.5])).toThrow();
  });
});

describe("parsePlnToGr", () => {
  it("parsuje przecinek i spacje", () => {
    expect(parsePlnToGr("1 234,50")).toBe(123450);
    expect(parsePlnToGr("1234.5")).toBe(123450);
    expect(parsePlnToGr("0,01")).toBe(1);
  });
  it("zwraca null dla śmieci", () => {
    expect(parsePlnToGr("abc")).toBeNull();
    expect(parsePlnToGr("")).toBeNull();
  });
});

describe("formatPln", () => {
  it("formatuje grosze jako PLN", () => {
    // Intl wstawia wąską spację jako separator tysięcy — sprawdzamy fragmenty
    const out = formatPln(123450);
    expect(out).toContain("234");
    expect(out).toContain("zł");
  });
});
