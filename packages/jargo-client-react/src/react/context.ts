"use client";

import { createContext } from "react";
import type { JargoClient } from "../core/JargoClient";

export const JargoClientContext = createContext<JargoClient | null>(null);
