import type { ComponentType, HTMLAttributes } from "react";
interface GhostFibersProps extends HTMLAttributes<HTMLDivElement> {
 glowColor?: string; lineColor?: string; secondaryColor?: string;
 speed?: number; scale?: number; rotation?: number; rollSpeed?: number;
 layers?: number; waves?: number; twist?: number; threads?: number;
 volume?: number; spread?: number; density?: number; thickness?: number;
 flow?: number; fiberStyle?: string; tips?: number; foldGlow?: number;
 perspective?: number; depthOfField?: number; focusDepth?: number;
 particles?: number; sparkle?: number; glow?: number; brightness?: number;
 vignette?: number; grain?: number; mouseInteraction?: boolean;
 hoverEffect?: string; pulseOnClick?: boolean; intro?: boolean;
 lightMode?: boolean; paused?: boolean; dpr?: number;
}
declare const GhostFibers: ComponentType<GhostFibersProps>;
export default GhostFibers;
