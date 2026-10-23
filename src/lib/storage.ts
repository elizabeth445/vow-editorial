import { z } from 'zod';
export const responseSchema=z.object({guestId:z.string(),name:z.string().trim().min(2,"Вкажіть ім’я: щонайменше 2 символи").max(100,"Не більше 100 символів"),attendance:z.enum(['yes','no']),count:z.number().int().min(1),diet:z.string().max(200),message:z.string().max(1500,"Не більше 1500 символів"),savedAt:z.string()});
export type RSVPSubmission=z.infer<typeof responseSchema>;
const key='ma-rsvp-v1';
export const storage={
all():RSVPSubmission[]{try{const raw=JSON.parse(localStorage.getItem(key)||'[]');return z.array(responseSchema).parse(raw)}catch{return []}},
get(id:string){return this.all().find(r=>r.guestId===id)},
save(value:RSVPSubmission){const parsed=responseSchema.parse(value);localStorage.setItem(key,JSON.stringify([...this.all().filter(r=>r.guestId!==value.guestId),parsed]));},
clear(){localStorage.removeItem(key)}
};
