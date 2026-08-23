export function formatEUR(cents: number): string {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function generateSlots(start: Date, end: Date, durationMin: number, intervalMin: number = 30): Date[] {
  const slots: Date[] = [];
  let cursor = new Date(start);
  while (addMinutes(cursor, durationMin) <= end) {
    slots.push(new Date(cursor));
    cursor = addMinutes(cursor, intervalMin);
  }
  return slots;
}
