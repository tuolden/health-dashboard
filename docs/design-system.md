# Health Dashboard Design System

A comprehensive design system following **Atomic Design** methodology for the modular health dashboard application, optimized for vertical screen layouts.

## 🎯 Overview

The Health Dashboard Design System provides a unified visual language and component library that ensures consistency across all widgets and UI elements. It includes:

- **Color System**: Semantic color palette with widget variants
- **Typography**: Hierarchical text styles with semantic tokens
- **Icons**: Font Awesome SVG icon library
- **Components**: Reusable UI building blocks
- **Developer Tools**: Grid overlay for layout debugging

## 🎨 Color System

### Global Colors

| Token | Value | Usage |
|-------|-------|-------|
| `app-background` | `#F4F6FA` | Main application background |
| `font-primary` | `#101316` | Primary text color |

### Widget Background Variants

| Token | Value | Color | Usage |
|-------|-------|-------|-------|
| `widget-default` | `#FFFFFF` | White | Default widget background |
| `widget-purple` | `#DBD4FD` | Purple | Accent widgets |
| `widget-green` | `#E4F0E6` | Green | Success/health metrics |
| `widget-pink` | `#FED5D6` | Pink | Warning/attention |
| `widget-yellow` | `#F1F7DB` | Yellow | Energy/activity |
| `widget-grey` | `#E0E1E5` | Grey | Neutral/secondary |
| `widget-light-purple` | `#F2E3FE` | Light Purple | Soft accent |
| `widget-dark-blue` | `#E3ECF9` | Dark Blue | Information/data |

### Usage

```tsx
// Tailwind classes
<div className="bg-widget-green">...</div>

// Design System utility
import { getWidgetBackgroundClass } from '@/DesignSystem'
const bgClass = getWidgetBackgroundClass('green')
```

## 📝 Typography System

### Font Stack

- **Headings**: Poppins (Google Fonts)
- **Body**: Inter (Google Fonts)

### Semantic Typography Tokens

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `title` | 2rem | Bold | Page titles |
| `title-lg` | 3rem | Bold | Large page titles |
| `subtitle` | 1.25rem | SemiBold | Section headers |
| `widget-title` | 1.125rem | Medium | Widget titles |
| `label` | 0.875rem | Medium | UI labels |
| `body` | 1rem | Regular | Body text |
| `metric` | 2.25rem | Bold | Large numbers |
| `metric-lg` | 3rem | Bold | Extra large numbers |

### Usage

```tsx
// Tailwind utility classes
<h1 className="text-title">Dashboard</h1>
<p className="text-body">Regular text</p>
<span className="text-metric">1,234</span>

// Design System utility
import { getTypographyClass } from '@/DesignSystem'
const textClass = getTypographyClass('widget-title')
```

## 🎯 Icon System

### Font Awesome Integration

The design system uses **Font Awesome Free SVG icons** for consistent iconography.

### Icon Component

```tsx
import { Icon } from '@/DesignSystem'

// Basic usage
<Icon name="water" className="w-4 h-4 text-blue-500" />

// With animation
<Icon name="refresh" spin className="w-4 h-4" />

// Available icons
water, droplet, steps, walking, heart, heartRate, weight, 
calories, fire, chart, clock, refresh, alert, error, warning, 
info, location, target, plus, minus, check, close, settings
```

## 🧱 UI Components

### Button

```tsx
import { Button } from '@/DesignSystem'

<Button variant="primary" size="md" icon="refresh">
  Refresh Data
</Button>

// Variants: primary, secondary, success, warning, danger, ghost
// Sizes: xs, sm, md, lg
```

### Card

```tsx
import { Card } from '@/DesignSystem'

<Card variant="green" padding="md" shadow="md" hover>
  Widget content
</Card>

// Variants: default, purple, green, pink, yellow, grey, light-purple, dark-blue
```

### Badge

```tsx
import { Badge } from '@/DesignSystem'

<Badge variant="success" icon="check">
  Goal Reached
</Badge>

// Variants: default, primary, success, warning, danger, info
```

### Alert

```tsx
import { Alert } from '@/DesignSystem'

<Alert variant="warning" title="Low Battery" dismissible>
  Your device battery is running low.
</Alert>
```

### ProgressBar

```tsx
import { ProgressBar } from '@/DesignSystem'

<ProgressBar 
  value={75} 
  max={100} 
  variant="primary" 
  showLabel 
  animated 
/>
```

### TopNavBar

```tsx
import { TopNavBar } from '@/DesignSystem'

<TopNavBar 
  title="Health Dashboard"
  items={navItems}
  actions={<Button>Settings</Button>}
/>
```

## 🔧 Developer Tools

### Grid Overlay

A development-only tool for visualizing the layout grid.

**Keyboard Shortcut**: `Ctrl/Cmd + Shift + G`

```tsx
import { GridOverlay } from '@/DesignSystem'

<GridOverlay columns={4} rows={8} />
```

Features:
- Visual grid lines with opacity
- Grid information panel
- Keyboard toggle
- Only renders in development mode

## 📱 Vertical Screen Optimizations

The design system is specifically optimized for vertical/portrait screen layouts:

### Responsive Grid

```css
/* Single column on narrow screens */
grid-template-columns: 1fr;

/* Two columns on wider phones */
@media (min-width: 640px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Three columns on tablets */
@media (min-width: 768px) {
  grid-template-columns: repeat(3, 1fr);
}
```

### Navigation

- Fixed top navigation with minimal height (4rem)
- Maximizes content area for vertical scrolling
- Touch-friendly interaction targets

### Typography

- Optimized line heights for vertical reading
- Semantic sizing that scales appropriately
- Clear hierarchy for scanning content

## 🚀 Getting Started

### Installation

The design system is already integrated into the project. Import components as needed:

```tsx
import { 
  Button, 
  Card, 
  Icon, 
  Badge, 
  Alert,
  ProgressBar,
  TopNavBar 
} from '@/DesignSystem'
```

### Creating New Widgets

1. Use `BaseWidget` as the foundation
2. Apply semantic typography tokens
3. Use design system components
4. Follow the color palette
5. Ensure vertical layout optimization

```tsx
import BaseWidget from '@/components/BaseWidget'
import { Icon, ProgressBar, Badge } from '@/DesignSystem'

const MyWidget = (props) => (
  <BaseWidget {...props}>
    <div className="space-y-3">
      <div className="text-center">
        <Icon name="heart" className="w-5 h-5 text-danger" />
        <span className="text-metric">72</span>
        <p className="text-label text-mutedText">BPM</p>
      </div>
      <ProgressBar value={72} max={100} variant="danger" />
    </div>
  </BaseWidget>
)
```

## 📋 Best Practices

1. **Consistency**: Always use design system tokens and components
2. **Accessibility**: Ensure proper contrast and semantic markup
3. **Performance**: Use SVG icons, not icon fonts
4. **Responsive**: Test on various vertical screen sizes
5. **Animation**: Use subtle animations for feedback
6. **Documentation**: Document custom components

## 🔄 Version History

- **v1.0.0**: Initial design system implementation
  - Color palette with widget variants
  - Typography system with semantic tokens
  - Font Awesome icon integration
  - Core UI components
  - Developer grid overlay
  - Vertical screen optimizations

---

*This design system is specifically optimized for vertical screen layouts and health/fitness data visualization.*
