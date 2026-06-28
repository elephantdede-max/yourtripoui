/**
 * Stations de métro Paris (RATP open data)
 * Données : nom, coordonnées, lignes desservies
 * Couvre les lignes 1-14 + RER A/B central (~80 stations principales)
 */

export interface MetroStation {
  name: string;
  lat: number;
  lng: number;
  lines: string[];
}

export const PARIS_METRO_STATIONS: MetroStation[] = [
  // ─── Ligne 1 ───
  { name: 'La Défense',              lat: 48.8917, lng: 2.2381, lines: ['1', 'RER A'] },
  { name: 'Porte Maillot',           lat: 48.8779, lng: 2.2840, lines: ['1'] },
  { name: 'Charles de Gaulle - Étoile', lat: 48.8748, lng: 2.2950, lines: ['1', '2', '6', 'RER A'] },
  { name: 'George V',                lat: 48.8722, lng: 2.3007, lines: ['1'] },
  { name: 'Franklin D. Roosevelt',   lat: 48.8686, lng: 2.3093, lines: ['1', '9'] },
  { name: 'Champs-Élysées - Clemenceau', lat: 48.8682, lng: 2.3146, lines: ['1', '13'] },
  { name: 'Concorde',                lat: 48.8657, lng: 2.3211, lines: ['1', '8', '12'] },
  { name: 'Tuileries',               lat: 48.8643, lng: 2.3294, lines: ['1'] },
  { name: 'Palais Royal - Musée du Louvre', lat: 48.8628, lng: 2.3367, lines: ['1', '7'] },
  { name: 'Louvre - Rivoli',         lat: 48.8607, lng: 2.3411, lines: ['1'] },
  { name: 'Châtelet',                lat: 48.8584, lng: 2.3474, lines: ['1', '4', '7', '11', '14', 'RER A', 'RER B', 'RER D'] },
  { name: 'Hôtel de Ville',          lat: 48.8573, lng: 2.3517, lines: ['1', '11'] },
  { name: 'Saint-Paul',              lat: 48.8555, lng: 2.3614, lines: ['1'] },
  { name: 'Bastille',                lat: 48.8531, lng: 2.3691, lines: ['1', '5', '8'] },
  { name: 'Gare de Lyon',            lat: 48.8443, lng: 2.3735, lines: ['1', '14', 'RER A', 'RER D'] },
  { name: 'Nation',                  lat: 48.8485, lng: 2.3955, lines: ['1', '2', '6', '9', 'RER A'] },
  { name: 'Château de Vincennes',    lat: 48.8444, lng: 2.4407, lines: ['1'] },

  // ─── Ligne 2 ───
  { name: 'Porte Dauphine',          lat: 48.8716, lng: 2.2754, lines: ['2'] },
  { name: 'Pigalle',                 lat: 48.8825, lng: 2.3373, lines: ['2', '12'] },
  { name: 'Anvers',                  lat: 48.8826, lng: 2.3441, lines: ['2'] },
  { name: 'Barbès - Rochechouart',   lat: 48.8838, lng: 2.3492, lines: ['2', '4'] },
  { name: 'Père Lachaise',           lat: 48.8636, lng: 2.3879, lines: ['2', '3'] },
  { name: 'Place de Clichy',         lat: 48.8835, lng: 2.3275, lines: ['2', '13'] },

  // ─── Ligne 3 ───
  { name: 'Saint-Lazare',            lat: 48.8753, lng: 2.3251, lines: ['3', '12', '13', '14', 'RER E'] },
  { name: 'Opéra',                   lat: 48.8714, lng: 2.3325, lines: ['3', '7', '8', 'RER A'] },
  { name: 'Bourse',                  lat: 48.8689, lng: 2.3416, lines: ['3'] },
  { name: 'Réaumur - Sébastopol',    lat: 48.8662, lng: 2.3522, lines: ['3', '4'] },
  { name: 'République',              lat: 48.8676, lng: 2.3633, lines: ['3', '5', '8', '9', '11'] },
  { name: 'Gambetta',                lat: 48.8654, lng: 2.3990, lines: ['3'] },

  // ─── Ligne 4 ───
  { name: 'Porte de Clignancourt',   lat: 48.8975, lng: 2.3447, lines: ['4'] },
  { name: 'Gare du Nord',            lat: 48.8807, lng: 2.3553, lines: ['4', '5', 'RER B', 'RER D', 'RER E'] },
  { name: 'Gare de l\'Est',          lat: 48.8762, lng: 2.3590, lines: ['4', '5', '7'] },
  { name: 'Strasbourg - Saint-Denis', lat: 48.8696, lng: 2.3554, lines: ['4', '8', '9'] },
  { name: 'Les Halles',              lat: 48.8615, lng: 2.3464, lines: ['4', 'RER A', 'RER B', 'RER D'] },
  { name: 'Cité',                    lat: 48.8554, lng: 2.3469, lines: ['4'] },
  { name: 'Saint-Michel',            lat: 48.8534, lng: 2.3441, lines: ['4', 'RER B', 'RER C'] },
  { name: 'Odéon',                   lat: 48.8520, lng: 2.3389, lines: ['4', '10'] },
  { name: 'Saint-Germain-des-Prés',  lat: 48.8538, lng: 2.3336, lines: ['4'] },
  { name: 'Saint-Sulpice',           lat: 48.8511, lng: 2.3325, lines: ['4'] },
  { name: 'Montparnasse - Bienvenüe', lat: 48.8424, lng: 2.3219, lines: ['4', '6', '12', '13'] },
  { name: 'Denfert-Rochereau',       lat: 48.8333, lng: 2.3324, lines: ['4', '6', 'RER B'] },
  { name: 'Porte d\'Orléans',        lat: 48.8232, lng: 2.3253, lines: ['4'] },

  // ─── Ligne 5 ───
  { name: 'Place d\'Italie',         lat: 48.8311, lng: 2.3556, lines: ['5', '6', '7'] },

  // ─── Ligne 6 ───
  { name: 'Trocadéro',               lat: 48.8635, lng: 2.2871, lines: ['6', '9'] },
  { name: 'Bir-Hakeim',              lat: 48.8540, lng: 2.2885, lines: ['6'] },
  { name: 'Pasteur',                 lat: 48.8419, lng: 2.3119, lines: ['6', '12'] },

  // ─── Ligne 7 ───
  { name: 'Pyramides',               lat: 48.8654, lng: 2.3340, lines: ['7', '14'] },
  { name: 'Pont Neuf',               lat: 48.8590, lng: 2.3417, lines: ['7'] },
  { name: 'Jussieu',                 lat: 48.8462, lng: 2.3553, lines: ['7', '10'] },

  // ─── Ligne 8 ───
  { name: 'La Motte-Picquet - Grenelle', lat: 48.8478, lng: 2.2999, lines: ['6', '8', '10'] },
  { name: 'École Militaire',         lat: 48.8551, lng: 2.3056, lines: ['8'] },
  { name: 'Invalides',               lat: 48.8606, lng: 2.3140, lines: ['8', '13', 'RER C'] },
  { name: 'Madeleine',               lat: 48.8702, lng: 2.3243, lines: ['8', '12', '14'] },
  { name: 'Grands Boulevards',       lat: 48.8717, lng: 2.3434, lines: ['8', '9'] },
  { name: 'Ledru-Rollin',            lat: 48.8520, lng: 2.3762, lines: ['8'] },

  // ─── Ligne 9 ───
  { name: 'Iéna',                    lat: 48.8643, lng: 2.2950, lines: ['9'] },
  { name: 'Saint-Augustin',          lat: 48.8745, lng: 2.3186, lines: ['9'] },
  { name: 'Richelieu - Drouot',      lat: 48.8718, lng: 2.3389, lines: ['8', '9'] },
  { name: 'Oberkampf',               lat: 48.8649, lng: 2.3692, lines: ['5', '9'] },
  { name: 'Voltaire',                lat: 48.8593, lng: 2.3815, lines: ['9'] },

  // ─── Ligne 10 ───
  { name: 'Sèvres - Babylone',       lat: 48.8516, lng: 2.3267, lines: ['10', '12'] },
  { name: 'Mabillon',                lat: 48.8528, lng: 2.3358, lines: ['10'] },
  { name: 'Cluny - La Sorbonne',     lat: 48.8504, lng: 2.3445, lines: ['10'] },

  // ─── Ligne 11 ───
  { name: 'Arts et Métiers',         lat: 48.8657, lng: 2.3559, lines: ['3', '11'] },
  { name: 'Rambuteau',               lat: 48.8612, lng: 2.3525, lines: ['11'] },
  { name: 'Belleville',              lat: 48.8722, lng: 2.3766, lines: ['2', '11'] },
  { name: 'Pyrénées',                lat: 48.8745, lng: 2.3835, lines: ['11'] },
  { name: 'Mairie des Lilas',        lat: 48.8800, lng: 2.4150, lines: ['11'] },

  // ─── Ligne 12 ───
  { name: 'Mairie d\'Issy',          lat: 48.8243, lng: 2.2738, lines: ['12'] },
  { name: 'Notre-Dame-des-Champs',   lat: 48.8462, lng: 2.3267, lines: ['12'] },
  { name: 'Rennes',                  lat: 48.8484, lng: 2.3275, lines: ['12'] },
  { name: 'Trinité - d\'Estienne d\'Orves', lat: 48.8761, lng: 2.3324, lines: ['12'] },
  { name: 'Marx Dormoy',             lat: 48.8867, lng: 2.3603, lines: ['12'] },

  // ─── Ligne 13 ───
  { name: 'Châtillon - Montrouge',   lat: 48.8093, lng: 2.3022, lines: ['13'] },
  { name: 'Plaisance',               lat: 48.8323, lng: 2.3179, lines: ['13'] },
  { name: 'Duroc',                   lat: 48.8472, lng: 2.3164, lines: ['10', '13'] },
  { name: 'Miromesnil',              lat: 48.8743, lng: 2.3144, lines: ['9', '13'] },
  { name: 'Liège',                   lat: 48.8788, lng: 2.3271, lines: ['13'] },

  // ─── Ligne 14 ───
  { name: 'Olympiades',              lat: 48.8268, lng: 2.3661, lines: ['14'] },
  { name: 'Bibliothèque François Mitterrand', lat: 48.8298, lng: 2.3754, lines: ['14', 'RER C'] },
  { name: 'Cour Saint-Émilion',      lat: 48.8338, lng: 2.3866, lines: ['14'] },
  { name: 'Bercy',                   lat: 48.8400, lng: 2.3791, lines: ['6', '14'] },
  { name: 'Pont Cardinet',           lat: 48.8853, lng: 2.3128, lines: ['14'] },
  { name: 'Porte de Clichy',         lat: 48.8943, lng: 2.3132, lines: ['13', '14', 'RER C'] },
  { name: 'Mairie de Saint-Ouen',    lat: 48.9087, lng: 2.3338, lines: ['14'] },
  { name: 'Saint-Denis - Pleyel',    lat: 48.9197, lng: 2.3439, lines: ['14'] },
];

// ─── Haversine ───
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Trouve la station la plus proche d'un point.
 * Retourne null si aucune station dans 2 km (zone hors Paris).
 */
export function findNearestStation(lat: number, lng: number): { station: MetroStation; distanceM: number } | null {
  if (!lat || !lng) return null;
  let nearest: MetroStation | null = null;
  let minDist = Infinity;
  for (const s of PARIS_METRO_STATIONS) {
    const d = distanceKm(lat, lng, s.lat, s.lng);
    if (d < minDist) { minDist = d; nearest = s; }
  }
  if (!nearest || minDist > 2) return null;
  return { station: nearest, distanceM: Math.round(minDist * 1000) };
}

/**
 * Trouve la(les) ligne(s) commune(s) entre 2 stations.
 * Retourne tableau (peut être vide = correspondance nécessaire).
 */
export function commonLines(from: MetroStation, to: MetroStation): string[] {
  return from.lines.filter(l => to.lines.includes(l));
}
