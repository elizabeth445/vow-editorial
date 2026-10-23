import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/cormorant-garamond/cyrillic-400.css";
import "@fontsource/cormorant-garamond/cyrillic-400-italic.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import App from "./App";
import "lenis/dist/lenis.css";
import "./styles.css";
import "./refinement.css";
import "./interactions.css";
import "./readability.css";
import "./atelier.css";
// Keep the annotation tool and its code entirely out of production builds.
const Agentation = import.meta.env.DEV
  ? React.lazy(() =>
      import("agentation").then(({ Agentation }) => ({ default: Agentation })),
    )
  : null;
// Optional developer tooling must never take down the invitation itself.
class AnnotationBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    {Agentation && (
      <AnnotationBoundary>
      <React.Suspense fallback={null}>
        <Agentation />
      </React.Suspense>
      </AnnotationBoundary>
    )}
  </React.StrictMode>,
);
