import { z } from "zod";

const wishSchema = z.object({
  guestId: z.string(),
  star: z.number().int().min(0).max(4),
  message: z
    .string()
    .trim()
    .min(3, "Напишіть побажання: щонайменше 3 символи")
    .max(280, "Не більше 280 символів"),
  savedAt: z.string(),
});
export type Wish = z.infer<typeof wishSchema>;
export const wishes = {
  all(): Wish[] {
    try {
      return z
        .array(wishSchema)
        .parse(JSON.parse(localStorage.getItem("ma-wishes-v1") || "[]"));
    } catch {
      return [];
    }
  },
  get(guestId: string) {
    return this.all().find((wish) => wish.guestId === guestId);
  },
  save(value: Wish) {
    const parsed = wishSchema.parse(value);
    localStorage.setItem(
      "ma-wishes-v1",
      JSON.stringify([
        ...this.all().filter((wish) => wish.guestId !== parsed.guestId),
        parsed,
      ]),
    );
    return parsed;
  },
};
