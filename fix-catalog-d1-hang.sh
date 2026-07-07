#!/bin/bash
sed -i '' 's/const isStaticBuild = .*/const isStaticBuild = process.env.NEXT_IS_BUILD === "1";/' src/lib/catalog.ts
