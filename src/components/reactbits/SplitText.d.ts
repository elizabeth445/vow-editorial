import type { ComponentType, ElementType } from "react";
interface SplitTextProps {
  text: string;
  disabled?: boolean;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: Record<string, number | string>;
  to?: Record<string, number | string>;
  textAlign?: "left" | "center" | "right" | "inherit";
  tag?: ElementType;
  trigger?: "load" | "view" | "click" | "hover";
  mask?: boolean;
  effect?: string;
  onLetterAnimationComplete?: () => void;
}
declare const SplitText: ComponentType<SplitTextProps>;
export default SplitText;
