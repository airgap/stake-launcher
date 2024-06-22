export const timeUntil = (target: number): string => {
  const now = new Date().getTime();
  let diff = target - now;

  if (diff <= 0) return "0s";

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  diff -= days * 24 * 60 * 60 * 1000;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  diff -= hours * 60 * 60 * 1000;

  const minutes = Math.floor(diff / (60 * 1000));
  diff -= minutes * 60 * 1000;

  const seconds = Math.floor(diff / 1000);

  let result = "";

  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
  if ((minutes > 0 || hours > 0) && days < 1) result += `${seconds}s`;

  return result.trim();
};
