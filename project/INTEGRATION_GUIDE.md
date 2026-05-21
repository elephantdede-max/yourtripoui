# Integration Guide: Connecting Places Database to Experience Generation

## 🔗 Architecture Overview

```
User Input (Preferences)
    ↓
Query Builder (places-query.ts)
    ↓
Database (places table)
    ↓
AI Engine (engine.ts) - MODIFY THIS
    ↓
Daily Experience Output
```

## 📝 Current Flow

The app currently:
1. Uses `src/lib/ai-engine` to generate day plans
2. Uses hardcoded `PLACES` array from `src/data/places.ts`
3. Generates experiences based on local data only

## ✨ New Flow with Database

### Step 1: Modify `src/lib/ai-engine

Replace hardcoded places with dynamic database queries:

```typescript
import { queryPlaces, getRandomPlaces } from '@/lib/places-query';

export async function buildMultiDayPlan(config: PlanConfig, ugcData: UGCEntry[]): Promise<MultiDayPlan> {
  const days: DayPlan[] = [];

  for (let i = 0; i < config.days.length; i++) {
    const dayConfig = config.days[i];
    
    // Build filters from user preferences
    const filters = {
      budget: [dayConfig.budget],
      experience_type: dayConfig.experience_type || [],
      ambiance: dayConfig.ambiance || [],
      place_type: dayConfig.place_type || [],
      discovery_level: dayConfig.discovery_level || ['mix des deux'],
      city: config.city,
    };

    // Query database instead of using hardcoded data
    const availablePlaces = await queryPlaces(filters);

    // Generate day plan from database results
    const dayPlan = generateDayFromPlaces(
      availablePlaces,
      dayConfig,
      config.startTime,
      config.endTime
    );

    days.push(dayPlan);
  }

  return {
    city: config.city,
    startDate: config.startDate,
    endDate: config.endDate,
    days,
  };
}
```

### Step 2: Create Sequencing Algorithm

```typescript
// In src/lib/ai-engine

function generateDayFromPlaces(
  places: Place[],
  dayConfig: DayConfig,
  startTime: string,
  endTime: string
): DayPlan {
  // Sort by ideal_moment for temporal sequencing
  const sorted = places.sort((a, b) => {
    const momentOrder = {
      'matin': 0,
      'brunch': 1,
      'déjeuner': 2,
      'après-midi': 3,
      'fin de journée': 4,
      'apéritif': 5,
      'dîner': 6,
      'soirée': 7,
      'nuit': 8,
    };
    return (momentOrder[a.ideal_moment] || 5) - (momentOrder[b.ideal_moment] || 5);
  });

  // Select places and sequence by duration
  const steps: PlanStep[] = [];
  let currentTime = parseTime(startTime);

  for (const place of sorted) {
    const endTimeNum = parseTime(endTime);
    const availableTime = endTimeNum - currentTime;

    // Skip if place takes longer than remaining time
    if (place.duration > availableTime) continue;

    const step: PlanStep = {
      id: place.id,
      name: place.name,
      type: place.type as any,
      desc: place.description,
      time: formatTime(currentTime),
      endTime: formatTime(currentTime + place.duration),
      dur: place.duration,
      score: 4.5, // Could be based on ratings
      community: false,
      ver: false,
      needsReservation: place.reservable,
      vid: null,
    };

    steps.push(step);
    currentTime += place.duration + 15; // 15 min buffer between activities
  }

  return {
    title: dayConfig.name || `Day ${days.length + 1}`,
    dayLabel: `Jour ${days.length + 1}`,
    date: new Date().toISOString().split('T')[0],
    startTime,
    endTime,
    count: steps.length,
    steps,
  };
}
```

### Step 3: Add Filter UI Components

Create a new component for advanced filtering:

```typescript
// src/components/PlaceFilterPanel.tsx

import { queryPlaces } from '@/lib/places-query';

export function PlaceFilterPanel() {
  const [filters, setFilters] = useState({
    budget: [],
    experience_type: [],
    ambiance: [],
  });

  const handleFilter = async () => {
    const results = await queryPlaces(filters);
    // Update app state with results
  };

  return (
    <div className="space-y-4">
      <MultiSelect
        label="Budget"
        options={['économique', 'modéré', 'flexible', 'premium']}
        value={filters.budget}
        onChange={(budget) => setFilters({ ...filters, budget })}
      />
      
      <MultiSelect
        label="Experience Type"
        options={['culturel', 'gastronomie', 'chill', 'aventure', 'date']}
        value={filters.experience_type}
        onChange={(experience_type) => setFilters({ ...filters, experience_type })}
      />

      <MultiSelect
        label="Ambiance"
        options={['calme', 'romantique', 'festif', 'entre amis', 'solo']}
        value={filters.ambiance}
        onChange={(ambiance) => setFilters({ ...filters, ambiance })}
      />

      <button onClick={handleFilter} className="btn btn-primary">
        Générer un plan
      </button>
    </div>
  );
}
```

### Step 4: Update UGC Integration

Merge database places with user-generated content:

```typescript
async function buildMultiDayPlan(config: PlanConfig, ugcData: UGCEntry[]): Promise<MultiDayPlan> {
  // Get from database
  const dbPlaces = await queryPlaces(filters);
  
  // Transform UGC to same format
  const ugcPlaces = ugcData.map((entry) => ({
    ...entry,
    community: true,
    created_at: new Date(),
  }));

  // Combine
  const allPlaces = [...dbPlaces, ...ugcPlaces];

  // Generate plan
  return generateMultiDayPlan(allPlaces, config);
}
```

### Step 5: Add Caching for Performance

```typescript
// src/lib/places-cache.ts

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
let lastQuery: any = null;
let lastResult: any = null;
let lastQueryTime = 0;

export async function cachedQueryPlaces(filters: PlaceFilters) {
  const now = Date.now();
  
  if (
    lastQuery === JSON.stringify(filters) &&
    now - lastQueryTime < CACHE_DURATION
  ) {
    return lastResult;
  }

  const result = await queryPlaces(filters);
  lastQuery = JSON.stringify(filters);
  lastResult = result;
  lastQueryTime = now;

  return result;
}
```

## 🎯 Migration Checklist

- [ ] Import all 179 places from JSON datasets
- [ ] Verify import with `getPlacesStats()`
- [ ] Modify `buildMultiDayPlan()` to query database
- [ ] Update filters in UI components
- [ ] Test experience generation with database
- [ ] Add caching for performance
- [ ] Implement temporal sequencing (ideal_moment)
- [ ] Merge UGC data with database places
- [ ] Test with different budget/experience combinations
- [ ] Deploy to production

## 📊 Performance Metrics

Expected performance after optimization:
- Query 179 places with filters: **< 100ms**
- Generate day plan: **< 500ms**
- Build multi-day plan: **< 2 seconds**

## 🧪 Testing Scenarios

### Scenario 1: Budget-Conscious Visitor
```typescript
const budget = 'économique';
const experience_type = ['chill', 'culturel'];
// Should return ~40 places under €20
```

### Scenario 2: Romantic Date
```typescript
const ambiance = ['romantique', 'calme'];
const experience_type = ['date'];
const ideal_moment = ['soirée', 'dîner'];
// Should return ~25 romantic evening spots
```

### Scenario 3: Adventure Seeker
```typescript
const discovery_level = ['endroits cachés'];
const experience_type = ['aventure'];
// Should return ~30 hidden gems
```

### Scenario 4: Family Day
```typescript
const place_type = ['nature', 'culture'];
const ambiance = ['entre amis', 'festif'];
// Should return ~50 family-friendly places
```

## 🔄 Continuous Improvement

After launch:
1. Track which places are most recommended
2. Update ratings based on user feedback
3. Add more cities' data
4. Implement user preferences learning
5. Create seasonal recommendations

## 📚 Related Files

- `PLACES_DATABASE.md` - Full schema documentation
- `IMPORT_WORKFLOW.md` - Import instructions
- `src/lib/places-query.ts` - Query utilities
- `supabase/functions/import-places/index.ts` - Import API
- `src/data/engine.ts` - Current engine (to modify)
