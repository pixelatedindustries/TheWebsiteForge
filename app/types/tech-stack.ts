/**
 * Tech-stack marquee types (technical / UI).
 */

/** Identifier for a tech-stack glyph rendered by LogoMarquee. */
export type TechIcon =
  | "html"
  | "css"
  | "tailwind"
  | "nuxt"
  | "csharp"
  | "java"
  | "python"
  | "xml"
  | "aspnet"
  | "typescript"
  | "vue"
  | "node"
  | "sql"
  | "git"
  | "azure";

/** A single technology shown in the logo marquee. */
export interface TechStackItem {
  name: string;
  icon: TechIcon;
  color: string;
}
