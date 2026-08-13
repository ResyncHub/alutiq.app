import { describe, expect, it } from "vitest";
import { quickAddCustomerSchema } from "./customer";

describe("quickAddCustomerSchema", () => {
  it("przyjmuje samą nazwę", () => {
    const r = quickAddCustomerSchema.parse({ name: "Jan Kowalski" });
    expect(r.name).toBe("Jan Kowalski");
    expect(r.phone).toBeNull();
  });

  it("przyjmuje sam telefon (bez nazwy)", () => {
    const r = quickAddCustomerSchema.parse({ phone: "887298671" });
    expect(r.phone).toBe("887298671");
    expect(r.name).toBeNull();
  });

  it("przyjmuje sam adres (bez nazwy i telefonu)", () => {
    const r = quickAddCustomerSchema.parse({ address: "Malczewskiego 15" });
    expect(r.address).toBe("Malczewskiego 15");
  });

  it("odrzuca całkiem pusty wpis (zasada minimum)", () => {
    expect(() => quickAddCustomerSchema.parse({})).toThrow();
  });

  it("jest idempotentny — parsuje własny wynik z nullami", () => {
    const once = quickAddCustomerSchema.parse({ phone: "887298671" });
    // taki obiekt (z null) trafia z formularza do Server Action i jest parsowany ponownie
    expect(() => quickAddCustomerSchema.parse(once)).not.toThrow();
    const twice = quickAddCustomerSchema.parse(once);
    expect(twice).toEqual(once);
  });

  it("waliduje niepoprawny e-mail", () => {
    expect(() => quickAddCustomerSchema.parse({ phone: "1", email: "zły-email" })).toThrow();
  });
});
