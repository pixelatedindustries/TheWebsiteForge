/**
 * Proof-wall content types (technical / UI).
 */
import type { ProjectCategory } from "~~/shared/site";

/** A website-type card shown in the ProofWall section. */
export interface WebsiteType {
  category: ProjectCategory;
  title: string;
  description: string;
  bestFor: string;
  pieces: string[];
  icon: "dashboard" | "cart" | "layers" | "gallery" | "app" | "target";
  accent: string;
}
