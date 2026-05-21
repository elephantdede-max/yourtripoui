# Places Database Documentation

## Overview

The `places` table is a unified database structure for storing all types of local experiences (restaurants, bars, museums, parks, theaters). It's designed to support Claude-generated JSON datasets and enable AI-powered daily experience generation.

## Table Structure

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `name` | TEXT | Place name (e.g., "Musée du Louvre") |
| `type` | TEXT | Place type: `restaurant`, `bar`, `museum`, `park`, `theater` |
| `category` | TEXT | Sub-category (e.g., "bistrot", "cocktail", "impressionnisme") |
| `cuisine` | TEXT | For restaurants: cuisine type (optional) |
| `description` | TEXT | Detailed description of the place |
| `city` | TEXT | City name (default: "Paris") |

### Experience Classification (JSONB Arrays)

These fields use JSON arrays to support multi-value selections:

| Field | Type | Values |
|-------|------|--------|
| `experience_type` | JSONB | `["culturel", "gastronomie", "chill", "aventure", "date"]` |
| `ambiance` | JSONB | `["calme", "romantique", "festif", "entre amis", "solo"]` |
| `place_type` | JSONB | `["culture", "urbain", "nature", "mix", "shopping"]` |

### Operational Fields

| Field | Type | Description |
|-------|------|-------------|
| `duration` | INTEGER | Duration in minutes |
| `reservable` | BOOLEAN | Whether reservations are needed/available |
| `opening_days` | JSONB | Days open: `["lundi", "mardi", ..., "dimanche"]` |
| `opening_period` | TEXT | Seasonal availability (e.g., "toute l'année", "avril à octobre") |

### Budget & Pricing

| Field | Type | Description |
|-------|------|-------------|
| `budget` | TEXT | Budget level: `économique`, `modéré`, `flexible`, `premium` |
| `budget_reason` | TEXT | Explanation of pricing (e.g., "~40-50€ par personne") |

### AI Context Fields

| Field | Type | Description |
|-------|------|-------------|
| `discovery_level` | TEXT | `lieux connus`, `mix des deux`, `endroits cachés` |
| `ideal_moment` | TEXT | When to visit: `matin`, `après-midi`, `soirée`, `dîner`, `brunch`, etc. |
| `why_in_day` | TEXT | Context for AI: why this place fits in a day |

### Metadata

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

## Indexes

For optimal query performance:

- **Type-based**: `idx_places_type`, `idx_places_budget`, `idx_places_discovery_level`
- **Time-based**: `idx_places_ideal_moment`, `idx_places_reservable`
- **Location**: `idx_places_city`
- **JSONB arrays**: `idx_places_experience_type`, `idx_places_ambiance`, `idx_places_place_type`, `idx_places_opening_days`

## Row Level Security (RLS)

- **Read**: Anyone can read all places (public discovery)
- **Write**: Only authenticated users can insert/update/delete
- **Future**: Admin role for restricted write access

## JSON Dataset Import Workflow

### Step 1: Prepare Your JSON

Your Claude-generated JSON should follow this structure:

```json
[
  {
    "name": "Musée du Louvre",
    "type": "museum",
    "category": "art classique",
    "description": "The largest museum in the world...",
    "duration": 180,
    "experience_type": ["culturel"],
    "budget": "modéré",
    "budget_reason": "~17€ l'entrée",
    "ambiance": ["entre amis", "calme"],
    "place_type": ["culture", "urbain"],
    "discovery_level": "lieux connus",
    "ideal_moment": "matin",
    "why_in_day": "Open with a targeted wing...",
    "reservable": true,
    "opening_days": ["lundi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
    "opening_period": "toute l'année"
  }
]
```

### Step 2: Use the Import Edge Function

Call the `/functions/v1/import-places` endpoint:

```typescript
import { importPlacesFromJSON } from '@/lib/places-query';

const result = await importPlacesFromJSON(jsonDataArray, 'Paris');
console.log(`Imported ${result.imported} places`);
```

### Step 3: Verify Import

Query the database to verify:

```typescript
import { getPlacesStats } from '@/lib/places-query';

const stats = await getPlacesStats();
console.log(`Total places: ${stats.total}`, stats.byType);
```

## Querying Examples

### Filter by Type and Budget

```typescript
import { queryPlaces } from '@/lib/places-query';

const restaurantDeals = await queryPlaces({
  type: ['restaurant'],
  budget: ['économique', 'modéré'],
  city: 'Paris',
});
```

### Get Places by Multiple Tags

```typescript
const romanticCulturalPlaces = await queryPlaces({
  experience_type: ['culturel', 'date'],
  ambiance: ['romantique', 'calme'],
  ideal_moment: ['soirée'],
});
```

### Get Places Available on Specific Day

```typescript
const sundayPlaces = await queryPlaces({
  opening_available: 'dimanche',
  limit: 20,
});
```

### Get Random Places for Experience Generation

```typescript
const randomDaily = await getRandomPlaces({
  budget: ['modéré'],
  discovery_level: ['mix des deux', 'endroits cachés'],
  ideal_moment: ['matin', 'après-midi', 'soirée'],
}, 5);
```

### Get Places by Single Tag

```typescript
const culturalPlaces = await getPlacesByTags({
  experience_type: 'culturel',
});
```

## AI Experience Generation Algorithm

The system uses the following approach:

1. **User Input**: Collect user preferences
   - Budget level
   - Experience types desired
   - Ambiance preferences
   - Time slots available
   - Discovery vs. known places

2. **Query Construction**: Build dynamic filters
   - Match user preferences with JSONB fields
   - Check opening availability for that day
   - Apply budget constraints

3. **Place Selection**: AI selects from results
   - Use `why_in_day` for contextual fit
   - Use `ideal_moment` for temporal sequencing
   - Use `duration` for time slot management

4. **Daily Planning**: Sequence places
   - Sort by `ideal_moment` (matin → après-midi → soirée)
   - Ensure no time conflicts
   - Maintain thematic coherence

## Supported Place Types

1. **Restaurant** (`type: 'restaurant'`)
   - Fast food, bistrot, gastronomique
   - Fields: cuisine, budget_reason

2. **Bar** (`type: 'bar'`)
   - Cocktail, wine, beer, café
   - Ideal moments: fin de journée, soirée, nuit

3. **Museum** (`type: 'museum'`)
   - Art, history, science, specialized
   - Ideal moments: matin, après-midi

4. **Park** (`type: 'park'`)
   - Gardens, green spaces, natural areas
   - Ideal moments: matin, après-midi

5. **Theater** (`type: 'theater'`)
   - Theater, opera, comedy, concerts
   - Ideal moments: soirée, night
   - Always reservable

## Bulk Operations

### Import Multiple Datasets

```typescript
import { importAllDatasets } from '@/lib/import-datasets';

// Import all available datasets
const results = await importAllDatasets('Paris');
```

### Batch Insert (Edge Function)

The import endpoint supports batch processing:
- Up to 1,000 places per request
- Automatic validation
- Rollback on error

## Performance Considerations

- **JSONB Indexes**: Queries on array fields use GIN indexes for O(log n) lookup
- **Text Search**: Add full-text search indexes if needed for descriptions
- **Pagination**: Use `limit` for large result sets
- **Caching**: Consider caching filtered results in client state

## Future Enhancements

- [ ] Full-text search on descriptions
- [ ] Location-based filtering (lat/lng)
- [ ] Rating system for user feedback
- [ ] Photo/media storage
- [ ] Multi-city support
- [ ] Custom user collections/favorites
- [ ] AI-generated daily experiences endpoint
