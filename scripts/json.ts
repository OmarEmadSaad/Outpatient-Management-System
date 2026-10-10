export const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

export const at = (value: unknown, ...keys: string[]): unknown => {
  let current = value;
  for (const key of keys) {
    if (!isObject(current)) return undefined;
    current = Reflect.get(current, key);
  }
  return current;
};

export const textAt = (value: unknown, ...keys: string[]): string => {
  const found = at(value, ...keys);
  return typeof found === "string" ? found : "";
};

export const keysOf = (value: unknown): string[] =>
  isObject(value) ? Object.keys(value) : [];

export const entriesOf = (value: unknown): [string, unknown][] =>
  isObject(value) ? Object.entries(value) : [];

export const valuesOf = (value: unknown): unknown[] =>
  isObject(value) ? Object.values(value) : [];

export const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stable(at(value, key))}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
};

export const sameJson = (a: unknown, b: unknown): boolean =>
  stable(a) === stable(b);
