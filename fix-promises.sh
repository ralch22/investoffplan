#!/bin/bash

# src/app/api/health/route.ts
sed -i '' 's/const stats = getCatalogAnalytics();/const stats = await getCatalogAnalytics();/' src/app/api/health/route.ts

# src/app/insights/page.tsx
sed -i '' 's/const stats = getCatalogAnalytics();/const stats = await getCatalogAnalytics();/' src/app/insights/page.tsx

# src/app/map/page.tsx
sed -i '' 's/const stats = getCatalogAnalytics();/const stats = await getCatalogAnalytics();/' src/app/map/page.tsx

# src/lib/site-footer-data.ts
sed -i '' 's/return getAreas()/const areas = await getAreas();\n  return areas/' src/lib/site-footer-data.ts

