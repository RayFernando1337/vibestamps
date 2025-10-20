# UI Components - shadcn/ui Primitives

**Technology**: shadcn/ui (New York style) + Radix UI + Tailwind CSS
**Entry Point**: Individual component files in this directory
**Parent Context**: Extends [../../CLAUDE.md](../../CLAUDE.md) and [../CLAUDE.md](../CLAUDE.md)

This directory contains UI primitive components from shadcn/ui, customized for the Vibestamps design system.

---

## Overview

### What is shadcn/ui?
- **NOT a component library**: Components are copied into your project (you own the code)
- **Built on Radix UI**: Accessible, unstyled primitives
- **Styled with Tailwind**: Fully customizable via Tailwind classes
- **TypeScript**: Full type safety

### Configuration

**File**: [../../components.json](../../components.json)

```json
{
  "style": "new-york",           // Clean, modern style variant
  "rsc": true,                   // React Server Components support
  "tsx": true,                   // TypeScript
  "tailwind": {
    "css": "app/globals.css",    // Global styles location
    "cssVariables": true,        // Use CSS variables for theming
    "prefix": ""                 // No class prefix
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils"
  },
  "iconLibrary": "lucide"        // Lucide React for icons
}
```

---

## Available Components

Current components in this directory:

| Component | Purpose | Radix UI Base |
|-----------|---------|---------------|
| [button.tsx](button.tsx) | Buttons with variants | `@radix-ui/react-slot` |
| [card.tsx](card.tsx) | Content containers | None (pure Tailwind) |
| [input.tsx](input.tsx) | Text input fields | None (native `<input>`) |
| [progress.tsx](progress.tsx) | Progress bars | `@radix-ui/react-progress` |
| [tooltip.tsx](tooltip.tsx) | Hover tooltips | `@radix-ui/react-tooltip` |
| [textarea.tsx](textarea.tsx) | Multi-line text input | None (native `<textarea>`) |
| [theme-toggle.tsx](theme-toggle.tsx) | Dark/light mode toggle | Custom (next-themes) |
| [ghibli-background.tsx](ghibli-background.tsx) | Animated background | Custom |

---

## Component Patterns

### 1. Button Component

**File**: [button.tsx](button.tsx)

#### Variant System (CVA)
```typescript
// ✅ DO: Use class-variance-authority for variants
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  // Base classes (always applied)
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-emerald-600 text-white shadow hover:bg-emerald-500",
        destructive: "bg-rose-600 text-white hover:bg-rose-500",
        outline: "border border-slate-200 bg-white hover:bg-sky-50",
        secondary: "bg-sky-100 text-sky-700 hover:bg-sky-200",
        ghost: "hover:bg-slate-100",
        link: "text-emerald-600 underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-11 px-7 text-base",
        icon: "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)
```

**Reference**: [button.tsx:7-36](button.tsx#L7-L36)

#### Component Implementation
```typescript
// ✅ DO: Combine component props with variant props
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"  // Polymorphic component

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

**Reference**: [button.tsx:38-59](button.tsx#L38-L59)

#### Usage Examples
```tsx
// Default button
<Button>Click Me</Button>

// With variant
<Button variant="outline">Secondary Action</Button>

// With size
<Button size="lg">Large Button</Button>

// Multiple props
<Button variant="destructive" size="sm" disabled>Delete</Button>

// Custom className (merged with variants)
<Button className="w-full">Full Width</Button>

// With icon
<Button>
  <IconName className="mr-1" />
  With Icon
</Button>
```

---

### 2. Card Component

**File**: [card.tsx](card.tsx)

#### Composition Pattern
```typescript
// ✅ DO: Create composable sub-components
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  )
)

const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)

const CardTitle = ({ className, ...props }) => (
  <div className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
)

const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)
```

#### Usage Example
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

---

### 3. Tooltip Component

**File**: [tooltip.tsx](tooltip.tsx)

#### Provider + Trigger + Content Pattern
```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"

// Usage
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip text here</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Customization Patterns

### 1. Customizing Variants
```typescript
// ✅ DO: Add new variants by modifying the CVA definition
const buttonVariants = cva(
  "base classes...",
  {
    variants: {
      variant: {
        default: "...",
        // ✅ ADD: New custom variant
        success: "bg-green-600 text-white hover:bg-green-500"
      },
      size: {
        // ✅ ADD: New custom size
        xs: "h-8 px-3 text-xs"
      }
    }
  }
)
```

### 2. Extending Components
```typescript
// ✅ DO: Wrap shadcn components with custom logic
import { Button } from "@/components/ui/button"

export function LoadingButton({
  isLoading,
  children,
  ...props
}: { isLoading: boolean } & React.ComponentProps<typeof Button>) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading ? "Loading..." : children}
    </Button>
  )
}
```

### 3. Using `cn()` Utility
```typescript
// ✅ DO: Use cn() to merge classes (handles conflicts)
import { cn } from "@/lib/utils"

<Button className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class",
  customClassName
)} />
```

**What `cn()` does**:
- Combines `clsx` (conditional classes) + `tailwind-merge` (resolves conflicts)
- Example: `cn("px-4", "px-2")` → `"px-2"` (last wins)

---

## Design Tokens (CSS Variables)

### Location
Defined in [../../app/globals.css](../../app/globals.css)

### Custom Color Palette
```css
/* Emerald theme (primary) */
--emerald-600: oklch(0.646 0.222 41.116)
--emerald-700: oklch(0.6 0.118 184.704)

/* Sky theme (accents) */
--sky-600: oklch(0.828 0.189 84.429)
--sky-700: oklch(0.769 0.188 70.08)

/* Rose theme (destructive) */
--destructive: oklch(0.577 0.245 27.325)
```

### Usage
```tsx
// ✅ DO: Use design tokens, not hardcoded colors
<div className="bg-emerald-600 text-white">       ✅ Design token
<div className="text-sky-700 dark:text-sky-300">  ✅ Responsive to theme

// ❌ DON'T: Hardcode arbitrary colors
<div className="bg-blue-500 text-white">           ❌ Not in design system
```

---

## Dark Mode Support

### How It Works
- **Theme Provider**: `next-themes` in [../../app/layout.tsx](../../app/layout.tsx#L37)
- **CSS Classes**: `.dark` class added to `<html>` when dark mode active
- **Tailwind Prefix**: Use `dark:` prefix for dark mode styles

### Patterns
```tsx
// ✅ DO: Provide light and dark variants
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
  <p className="text-emerald-700 dark:text-emerald-300">Text</p>
</div>

// ✅ DO: Use CSS variables that adapt to theme
<Button className="bg-primary text-primary-foreground">
  Theme-aware button
</Button>
```

### Theme Toggle
**File**: [theme-toggle.tsx](theme-toggle.tsx)

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle"

// Usage: Button that toggles between light/dark mode
<ThemeToggle />
```

---

## Adding New Components

### Step-by-Step Process

#### 1. Use shadcn CLI
```bash
bunx --bun shadcn@latest add <component-name>
```

Example:
```bash
bunx --bun shadcn@latest add dialog
bunx --bun shadcn@latest add dropdown-menu
bunx --bun shadcn@latest add select
```

#### 2. Verify Installation
```bash
# Check new file created
ls -la components/ui/<component-name>.tsx

# Check dependencies added
cat package.json | grep -i radix
```

#### 3. Review Component Source
```bash
# Read the component code
cat components/ui/<component-name>.tsx

# Look for:
# - Props interface
# - Variants (if any)
# - Radix UI dependencies
# - Default styles
```

#### 4. Customize (Optional)
```typescript
// Modify variants, colors, or behavior
// Example: Add custom variant to button
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ... existing variants
        custom: "bg-purple-600 hover:bg-purple-500"  // New variant
      }
    }
  }
)
```

#### 5. Test
- Import and use in a component
- Test all variants
- Test dark mode
- Test responsive behavior

---

## Common Gotchas

### 1. Missing Radix UI Package
❌ **ERROR**: `Cannot find module '@radix-ui/react-...'`

✅ **FIX**: Install missing dependency
```bash
bun add @radix-ui/react-<component>
```

### 2. Variant Not Working
❌ **WRONG**: Variant prop not applying
```tsx
<Button variant="custom">Click</Button>  // No effect
```

✅ **FIX**: Add variant to CVA definition
```typescript
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        custom: "bg-custom-color"  // Must be defined here
      }
    }
  }
)
```

### 3. CSS Variable Not Defined
❌ **ERROR**: `bg-primary` not working

✅ **FIX**: Define in `globals.css`
```css
:root {
  --primary: oklch(0.205 0 0);
}

.dark {
  --primary: oklch(0.922 0 0);
}
```

### 4. Class Conflicts
❌ **WRONG**: Both padding classes applied
```tsx
<Button className="px-4 px-8">  // Which one wins?
```

✅ **FIX**: Use `cn()` utility
```typescript
<Button className={cn("px-4", condition && "px-8")}>
// cn() resolves conflicts via tailwind-merge
```

### 5. `asChild` Prop Confusion
❌ **WRONG**: Button rendering inside button
```tsx
<Button>
  <Link href="/home">Go Home</Link>  // Results in <button><a></button>
</Button>
```

✅ **FIX**: Use `asChild` prop
```tsx
<Button asChild>
  <Link href="/home">Go Home</Link>  // Results in <a> only
</Button>
```

---

## Accessibility Best Practices

### 1. ARIA Labels
```tsx
// ✅ DO: Provide aria-label for icon-only buttons
<Button size="icon" aria-label="Close dialog">
  <XIcon />
</Button>
```

### 2. Keyboard Navigation
```tsx
// ✅ DO: Ensure focusable elements are keyboard-accessible
<Button onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    handleClick()
  }
}}>
```

### 3. Screen Reader Text
```tsx
// ✅ DO: Use sr-only for screen reader-only text
<Button>
  <span className="sr-only">Delete item</span>
  <TrashIcon />
</Button>
```

---

## Quick Search Commands (JIT Index)

### Find Components
```bash
# List all UI components
ls -la components/ui/*.tsx

# Find component exports
rg -n "^export (function|const)" components/ui

# Find Radix UI usage
rg -n "@radix-ui" components/ui
```

### Find Variants
```bash
# Find CVA variant definitions
rg -n "const.*Variants = cva" components/ui

# Find variant usage
rg -n 'variant: \{' components/ui
```

### Find Custom Styling
```bash
# Find CSS variable usage
rg -n "var\(--" components/ui

# Find dark mode styles
rg -n "dark:" components/ui
```

---

## Documentation Links

- **shadcn/ui**: https://ui.shadcn.com/docs/components/
- **Radix UI**: https://www.radix-ui.com/primitives/docs/overview/introduction
- **Lucide Icons**: https://lucide.dev/icons/
- **CVA (Class Variance Authority)**: https://cva.style/docs
- **Tailwind Merge**: https://github.com/dcastil/tailwind-merge

---

## Component Checklist

When adding or modifying UI components:

- [ ] Component follows shadcn/ui pattern (forwardRef, displayName)
- [ ] Variants defined with CVA (if applicable)
- [ ] Dark mode styles provided (`dark:` prefix)
- [ ] CSS variables used (not hardcoded colors)
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] TypeScript types exported
- [ ] `cn()` utility used for className merging
- [ ] Responsive design tested (mobile, tablet, desktop)

---

## Related Documentation

- **Feature Components**: See [../CLAUDE.md](../CLAUDE.md)
- **Global Styles**: See [../../app/globals.css](../../app/globals.css)
- **Utility Functions**: See [../../lib/CLAUDE.md](../../lib/CLAUDE.md)

---

## Quick Reference

- **Config**: [../../components.json](../../components.json)
- **Add Component**: `bunx --bun shadcn@latest add <name>`
- **Utilities**: `cn()` in [../../lib/utils.ts](../../lib/utils.ts)
- **Design Tokens**: [../../app/globals.css](../../app/globals.css)
- **Theme Toggle**: [theme-toggle.tsx](theme-toggle.tsx)
