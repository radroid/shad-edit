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

### Telemetry & Monitoring

The application uses Sentry for error tracking and performance monitoring:

- **Error Tracking**: All errors in the preview system are automatically captured with context (component type, props, property values).
- **Performance Monitoring**: Component render times are tracked via `convex.operation.duration` metrics.
- **Cache Operations**: Guest edit cache reads, writes, and clears are instrumented with breadcrumbs.
- **Tailwind Modifier**: Parse and modification operations are tracked to identify performance bottlenecks.

**Available Metrics**:
- `convex.operation.duration` - Convex query/mutation latency
- Guest editor usage breadcrumbs (edit, save, clear, migrate actions)
- Cache operation breadcrumbs (read, write, clear, migrate)
- Tailwind modifier operation breadcrumbs (parse, modify, apply)

**Alert Configuration**:
- Critical errors in component rendering trigger immediate alerts
- Cache quota exceeded errors are filtered (non-critical)
- Performance degradation alerts can be configured for render times > 500ms

**Runbook**:
1. Check Sentry dashboard for error trends
2. Review performance metrics for slow operations
3. Investigate cache operation failures (usually quota-related)
4. Monitor Tailwind modifier parse errors (indicates malformed code)


