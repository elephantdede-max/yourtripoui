export const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Paris: { lat: 48.858, lng: 2.347 },
  Lyon: { lat: 45.764, lng: 4.835 },
  Marseille: { lat: 43.296, lng: 5.381 },
  Bordeaux: { lat: 44.837, lng: -0.580 },
  Nice: { lat: 43.710, lng: 7.262 },
  Toulouse: { lat: 43.604, lng: 1.443 },
  Lille: { lat: 50.633, lng: 3.059 },
  Nantes: { lat: 47.218, lng: -1.553 },
  Angers: { lat: 47.472, lng: -0.555 },
  Monaco: { lat: 43.738, lng: 7.425 },
  Strasbourg: { lat: 48.573, lng: 7.752 },
  Montpellier: { lat: 43.611, lng: 3.877 },
  Toulon: { lat: 43.125, lng: 5.931 },
};

export const CITIES = [
  'Paris', 'Lyon', 'Marseille', 'Lille', 'Toulouse', 'Nantes',
  'Angers', 'Nice', 'Monaco', 'Strasbourg', 'Bordeaux', 'Montpellier', 'Toulon',
] as const;

export const CITY_EMOJIS: Record<string, string> = {
  Paris: '🗼',
  Lyon: '🦁',
  Marseille: '🌊',
  Lille: '🇫🇷',
  Toulouse: '🌹',
  Nantes: '🏰',
  Angers: '🎭',
  Nice: '☀️',
  Monaco: '👑',
  Strasbourg: '🎄',
  Bordeaux: '🍷',
  Montpellier: '🌻',
  Toulon: '⛵',
};
