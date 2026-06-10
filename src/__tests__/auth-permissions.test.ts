import { describe, expect, test } from "vitest";

import { hasPermission, parsePermissions, type Permissions } from "@/lib/utils";

describe("parsePermissions", () => {
  test("parses valid permissions JSON", () => {
    expect(
      parsePermissions(JSON.stringify({ reports: ["view", "edit"], projects: ["create"] }))
    ).toEqual({
      reports: ["view", "edit"],
      projects: ["create"],
    });
  });

  test("returns an empty object for invalid JSON", () => {
    expect(parsePermissions("{invalid-json")).toEqual({});
  });
});

describe("hasPermission", () => {
  test("allows ADMIN regardless of module permissions", () => {
    const permissions: Permissions = {};

    expect(hasPermission(permissions, "ADMIN", "reports", "view")).toBe(true);
    expect(hasPermission(permissions, "ADMIN", "settings", "delete")).toBe(true);
  });

  test("checks module and action access for USER roles", () => {
    const permissions: Permissions = {
      reports: ["view", "edit"],
      projects: ["view", "create"],
    };

    expect(hasPermission(permissions, "USER", "reports", "view")).toBe(true);
    expect(hasPermission(permissions, "USER", "reports", "delete")).toBe(false);
    expect(hasPermission(permissions, "USER", "settings", "view")).toBe(false);
    expect(hasPermission(permissions, "USER", "projects", "create")).toBe(true);
  });
});
