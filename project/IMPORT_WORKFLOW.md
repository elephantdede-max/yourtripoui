# Quick Import Workflow

## 🎯 Goal
Import your Claude JSON datasets (theaters, bars, museums, restaurants, parks) into the unified `places` table.

## 📋 What You Have
5 JSON datasets ready to import:
- `paris_theatres_v2.json` - 35 theaters
- `paris_bars_v2.json` - 34 bars  
- `paris_museums_v2.json` - 37 museums
- `paris_restaurants_v2.json` - 42 restaurants
- `paris_parks_v2.json` - 31 parks

**Total: 179 places across 5 categories**

## 🚀 Import Process

### Option 1: Via Edge Function (Recommended)

```typescript
import { importPlacesFromJSON } from '@/lib/places-query';

// Import theaters
const theatersResult = await importPlacesFromJSON(theaterJsonData, 'Paris');
console.log(`✓ Imported ${theatersResult.imported} theaters`);

// Import bars
const barsResult = await importPlacesFromJSON(barsJsonData, 'Paris');
console.log(`✓ Imported ${barsResult.imported} bars`);

// ... repeat for museums, restaurants, parks
```

### Option 2: Bulk Import All Datasets

```typescript
import { importAllDatasets } from '@/lib/import-datasets';

const results = await importAllDatasets('Paris');
console.log(`Imported ${results.length} datasets`);
```

### Option 3: Direct Supabase Insert

```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('places')
  .insert(transformedPlaces)
  .select();

if (error) console.error('Import failed:', error);
else console.log(`Imported ${data.length} places`);
```

## 📊 Verify Import

After importing, verify the data:

```typescript
import { getPlacesStats } from '@/lib/places-query';

const stats = await getPlacesStats();
console.log('Import Summary:', {
  total: stats.total,
  byType: stats.byType,
});

// Expected output:
// {
//   total: 179,
//   byType: {
//     theater: 35,
//     bar: 34,
//     museum: 37,
//     restaurant: 42,
//     park: 31
//   }
// }
```

## 🔍 Query Examples After Import

### Get all romantic dinner spots

```typescript
import { queryPlaces } from '@/lib/places-query';

const dinnerSpots = await queryPlaces({
  experience_type: ['date'],
  ambiance: ['romantique'],
  ideal_moment: ['dîner', 'soirée'],
  budget: ['modéré', 'flexible'],
});
```

### Get morning cultural activities

```typescript
const morningCulture = await queryPlaces({
  type: ['museum', 'theater'],
  experience_type: ['culturel'],
  ideal_moment: ['matin'],
  budget: ['modéré'],
});
```

### Get hidden gems by discovery level

```typescript
const hiddenGems = await queryPlaces({
  discovery_level: ['endroits cachés'],
  budget: ['économique', 'modéré'],
  limit: 20,
});
```

### Get places available on Sundays

```typescript
const sundayPlaces = await queryPlaces({
  opening_available: 'dimanche',
  limit: 30,
});
```

### Generate random daily experience

```typescript
import { getRandomPlaces } from '@/lib/places-query';

const dayPlan = await getRandomPlaces({
  budget: ['modéré'],
  discovery_level: ['mix des deux'],
  ideal_moment: ['matin', 'après-midi', 'soirée'],
}, 5);

// Returns 5 random places matching criteria
```

## 🛠️ Database Schema Reference

### Core Fields
- `name` - Place name
- `type` - 'restaurant' | 'bar' | 'museum' | 'park' | 'theater'
- `category` - Sub-type
- `cuisine` - (restaurants only)
- `description` - Detailed description

### Classifications (JSONB Arrays)
- `experience_type` - ['culturel', 'gastronomie', 'chill', 'aventure', 'date']
- `ambiance` - ['calme', 'romantique', 'festif', 'entre amis', 'solo']
- `place_type` - ['culture', 'urbain', 'nature', 'mix', 'shopping']

### Operational
- `duration` - Minutes
- `reservable` - Boolean
- `opening_days` - Array of days
- `opening_period` - Season/availability

### Pricing
- `budget` - 'économique' | 'modéré' | 'flexible' | 'premium'
- `budget_reason` - Price explanation

### AI Context
- `discovery_level` - 'lieux connus' | 'mix des deux' | 'endroits cachés'
- `ideal_moment` - 'matin', 'après-midi', 'soirée', 'dîner', 'brunch', etc.
- `why_in_day` - Context for inclusion in itinerary

## ✅ Checklist

- [ ] All 5 JSON datasets prepared
- [ ] Data imported into `places` table
- [ ] Stats verified (179 total places)
- [ ] Queries tested and working
- [ ] App integrated with places database
- [ ] Daily experience generation ready

## 🎨 Next Steps for App Integration

1. **Update Engine**: Modify `src/lib/ai-engine` to query from database
2. **Experience Generation**: Use `queryPlaces` filters based on user preferences
3. **Daily Planning**: Sequence places by `ideal_moment` and `duration`
4. **Filtering UI**: Add UI controls for budget, experience type, discovery level
5. **Favorites**: Add user collections for saved places

## 📚 File References

- **Database Schema**: `PLACES_DATABASE.md`
- **Query Helpers**: `src/lib/places-query.ts`
- **Import Utilities**: `src/lib/import-datasets.ts`
- **Edge Function**: `supabase/functions/import-places/index.ts`
- **API Endpoint**: `{SUPABASE_URL}/functions/v1/import-places`

## 🆘 Troubleshooting

### Import Fails: "Places must be an array"
- Ensure JSON is wrapped in `[]`
- Check JSON is valid with JSONLint

### Query Returns Empty
- Verify import completed successfully
- Check filters match actual data
- Run `getPlacesStats()` to verify count

### JSONB Filter Not Working
- Double-check field names (no typos)
- Use proper array syntax: `["value1", "value2"]`
- Test with simple query first

### Performance Issues
- Check indexes are created (automatic)
- Use `limit` on large queries
- Cache results in client state
