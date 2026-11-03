/** "12:05" today, "Mon" this week, "3/11" before */
export function shortTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return clock(iso);
  if (now.getTime() - date.getTime() < 6 * 24 * 60 * 60 * 1000) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** "12:05" */
export function clock(iso: string): string {
  const date = new Date(iso);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}
