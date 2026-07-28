/** Generate a collision-resistant unique id using the Web Crypto API. */
export function createId(): string {
  return crypto.randomUUID();
}
