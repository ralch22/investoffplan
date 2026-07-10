"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { NavCommunity } from "@/lib/nav-data";

interface NavDataValue {
  topCommunities: NavCommunity[];
}

const NavDataContext = createContext<NavDataValue>({ topCommunities: [] });

/** Mounted in both root layouts; feeds the header mega menu with server data. */
export function NavDataProvider({
  topCommunities,
  children,
}: NavDataValue & { children: ReactNode }) {
  return (
    <NavDataContext.Provider value={{ topCommunities }}>
      {children}
    </NavDataContext.Provider>
  );
}

export function useNavData(): NavDataValue {
  return useContext(NavDataContext);
}
