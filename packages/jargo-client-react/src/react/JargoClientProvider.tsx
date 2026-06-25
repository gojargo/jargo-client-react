"use client";

import React from "react";
import type { JargoClient } from "../core/JargoClient";
import { JargoClientContext } from "./context";

export interface JargoClientProviderProps {
  client: JargoClient;
  children: React.ReactNode;
}

/** Makes a {@link JargoClient} available to the hooks and components below. */
export function JargoClientProvider({
  client,
  children,
}: JargoClientProviderProps) {
  return (
    <JargoClientContext.Provider value={client}>
      {children}
    </JargoClientContext.Provider>
  );
}
