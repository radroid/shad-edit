## Component Preview System

The preview system keeps marketplace cards, overlays, and the project editor in sync so designers always see real shadcn/ui components.

### Core Module

- `src/lib/component-renderer.tsx` exposes `renderComponentPreview` and `getDefaultComponentProps` to render a supported component type with supplied Tailwind-aware props.
- Supported primitives: button, input, card, dialog, navigation menu, badge, label, switch, select, tabs. Extend the switch statement when adding more shadcn/ui exports.

### Marketplace Usage

- `ComponentsList` fetches catalog entries and passes type hints to `ComponentCard`.
- `ComponentCard` wraps the preview in a gradient background + grid texture for contrast, scaling the component to 125%.
- `ComponentOverlay` provides a larger canvas with theme context and call-to-action to jump into the project editor.

### Editor Canvas

- `ComponentPreview` consumes the same renderer with project theme tokens, enabling live property updates. Selection outlines and device presets are drawn around the rendered component instead of modifying it directly.
- When no element metadata exists, the renderer builds a fallback root element so property editing still works.

### Visibility & Contrast Improvements

- Light background container (`bg-background`, rounded border) ensures high contrast even for dark-themed components.
- Minimum preview height of `300px` avoids cramped layouts.
- Hover/focus states use Tailwind transitions with `hover:shadow-lg hover:shadow-cyan-500/10` to create depth.

### Adding New Component Types

1. Update `ComponentType` union and renderer switch with JSX for the new shadcn component.
2. Provide default props via `getDefaultComponentProps`.
3. Extend `property-extractor.ts` to detect the component, exposing relevant editable properties.
4. Optionally add demo entries in `ComponentsList` fallback data.

### Testing

- Check `/marketplace` cards render without console errors for the new type.
- Open a card overlay; ensure the preview respects theme tokens and property defaults.
- Load the associated project editor page; property changes should immediately re-render the component.

