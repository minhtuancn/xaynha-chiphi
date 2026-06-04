type Decimal = { toNumber: () => number };

type Serialized<T> = T extends Decimal
  ? number
  : T extends Date
    ? T
    : T extends Array<infer U>
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

function isDecimal(value: unknown): value is Decimal {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Decimal).toNumber === "function"
  );
}

export function serialize<T>(data: T): Serialized<T> {
  if (data === null || data === undefined) return data as Serialized<T>;
  if (typeof data !== "object") return data as Serialized<T>;
  if (data instanceof Date) return data as Serialized<T>;
  if (isDecimal(data)) return data.toNumber() as Serialized<T>;
  if (Array.isArray(data)) return data.map((item) => serialize(item as unknown as T)) as Serialized<T>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = serialize(value);
  }
  return result as Serialized<T>;
}
