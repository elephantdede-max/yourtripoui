# Quick Reference Card

## 🎯 What You Have

| Component | Status | Location |
|-----------|--------|----------|
| Places Table | ✅ Created | Supabase Database |
| Import Function | ✅ Deployed | `/functions/v1/import-places` |
| Query Library | ✅ Ready | `src/lib/places-query.ts` |
| Documentation | ✅ Complete | 4 markdown files |
| Data (179 places) | 📦 Ready to import | 5 JSON files |

## 🚀 Get Started (Copy-Paste)

### 1. Import Data
```typescript
import { importPlacesFromJSON } from '@/lib/places-query';

// One line per dataset type
const theaters = await importPlacesFromJSON(parisTheatresData, 'Paris');
const bars = await importPlacesFromJSON(parisBarsData, 'Paris');
const museums = await importPlacesFromJSON(parisMuseumsData, 'Paris');
const restaurants = await importPlacesFromJSON(parisRestaurantsData, 'Paris');
const parks = await importPlacesFromJSON(parisParksData, 'Paris');
```

### 2. Check Import
```typescript
import { getPlacesStats } from '@/lib/places-query';

const stats = await getPlacesStats();
console.log(stats); // { total: 179, byType: {...} }
```

### 3. Query Places
```typescript
import { queryPlaces } from '@/lib/places-query';

const results = await queryPlaces({
  type: ['restaurant'],
  budget: ['modéré'],
  experience_type: ['date'],
  ideal_moment: ['dîner'],
});
```

## 📊 Database Fields at a Glance

### Identification
- `name` - Place name
- `type` - restaurant|bar|museum|park|theater
- `category` - Sub-category
- `cuisine` - (restaurants)

### Classification
- `experience_type` - ['culturel', 'gastronomie', 'chill', 'aventure', 'date']
- `ambiance` - ['calme', 'romantique', 'festif', 'entre amis', 'solo']
- `place_type` - ['culture', 'urbain', 'nature', 'mix', 'shopping']

### Operations
- `duration` - Minutes
- `reservable` - Need reservation?
- `opening_days` - Days open
- `opening_period` - Seasonal availability

### Money & Time
- `budget` - économique|modéré|flexible|premium
- `budget_reason` - Price explanation
- `ideal_moment` - matin|après-midi|soirée|dîner|brunch|snack
- `why_in_day` - AI context

## 🎮 Common Queries

### Romantic Dinner
```typescript
queryPlaces({
  experience_type: ['date'],
  ambiance: ['romantique'],
  ideal_moment: ['dîner'],
  budget: ['modéré', 'flexible'],
})
```

### Budget Day Out
```typescript
queryPlaces({
  budget: ['économique'],
  discovery_level: ['mix des deux', 'endroits cachés'],
})
```

### Morning Culture
```typescript
queryPlaces({
  type: ['museum', 'theater'],
  ideal_moment: ['matin'],
  experience_type: ['culturel'],
})
```

### Hidden Gems
```typescript
queryPlaces({
  discovery_level: ['endroits cachés'],
  budget: ['économique', 'modéré'],
})
```

### Sunday Hangout
```typescript
queryPlaces({
  opening_available: 'dimanche',
  ambiance: ['entre amis', 'festif'],
})
```

### Random Daily Plan
```typescript
import { getRandomPlaces } from '@/lib/places-query';

getRandomPlaces({
  budget: ['modéré'],
  ideal_moment: ['matin', 'après-midi', 'soirée'],
}, 5) // 5 random places
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/lib/places-query.ts` | Query utilities |
| `src/lib/import-datasets.ts` | Import helpers |
| `supabase/functions/import-places/index.ts` | Import API |
| `PLACES_DATABASE.md` | Full schema docs |
| `IMPORT_WORKFLOW.md` | Step-by-step import |
| `INTEGRATION_GUIDE.md` | How to integrate |
| `DATABASE_SETUP_SUMMARY.md` | Complete overview |

## 🔧 Functions Reference

### Query Functions
```typescript
queryPlaces(filters)              // Main query function
getRandomPlaces(filters, count)   // Random selection
getPlacesByTags(tags)             // Tag-based search
getPlacesByIdealMoment(moment)    // Time-based search
importPlacesFromJSON(places, city) // Import data
getPlacesStats()                  // Get statistics
```

## 💾 Data Types

### Place Object
```typescript
{
  id: string;
  name: string;
  type: 'restaurant' | 'bar' | 'museum' | 'park' | 'theater';
  category: string;
  cuisine?: string;
  description: string;
  duration: number;
  experience_type: string[];
  budget: string;
  ambiance: string[];
  place_type: string[];
  discovery_level: string;
  ideal_moment: string;
  why_in_day: string;
  reservable: boolean;
  opening_days: string[];
  opening_period: string;
  city: string;
}
```

### Filter Object
```typescript
{
  type?: string[];
  budget?: string[];
  experience_type?: string[];
  ambiance?: string[];
  place_type?: string[];
  discovery_level?: string[];
  ideal_moment?: string[];
  reservable?: boolean;
  opening_available?: string; // day name
  city?: string;
  limit?: number;
}
```

## ⚡ Performance Tips

- Use `limit` parameter for large queries
- Filter by multiple constraints before pagination
- Cache results in component state
- Pre-filter by `type` when possible
- Use `ideal_moment` for temporal sequencing

## 🐛 Debugging

### Check if data imported:
```typescript
const stats = await getPlacesStats();
console.log(stats.total); // Should be 179
```

### Test a simple query:
```typescript
const places = await queryPlaces({ limit: 5 });
console.log(places.length); // Should be 5
```

### Check opening days:
```typescript
const sundayPlaces = await queryPlaces({
  opening_available: 'dimanche',
});
console.log(sundayPlaces.length); // Check count
```

## 📞 What to Read

- **Just want to import?** → `IMPORT_WORKFLOW.md`
- **Need full schema?** → `PLACES_DATABASE.md`
- **Integrating with app?** → `INTEGRATION_GUIDE.md`
- **Want overview?** → `DATABASE_SETUP_SUMMARY.md`

## ✅ Checklist

- [ ] Imported all 179 places
- [ ] Verified with `getPlacesStats()`
- [ ] Tested basic query
- [ ] Tested filter combinations
- [ ] Updated `engine.ts` (if integrating)
- [ ] Added caching (if needed)
- [ ] Tested temporal sequencing
- [ ] Deployed to production

---

**You're ready to go!** 🚀
