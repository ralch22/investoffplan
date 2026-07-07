#!/bin/bash

# Fix projects-page.tsx
sed -i '' 's/import { useMemo, useState, Suspense } from "react";/import { useMemo, useState, Suspense, useEffect } from "react";/' src/app/projects/projects-page.tsx
sed -i '' 's/setApiData(data);/setApiData(data as any);/' src/app/projects/projects-page.tsx

# Fix project-map.tsx
sed -i '' 's/if (active) setApiProjects(data.projects);/if (active) setApiProjects((data as any).projects);/' src/components/project-map.tsx

# Fix catalog-browser.ts
sed -i '' 's/then(r => r.json())/then(r => r.json() as Promise<any>)/' src/lib/catalog-browser.ts

