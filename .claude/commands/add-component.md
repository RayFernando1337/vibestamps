Add a shadcn/ui component: $ARGUMENTS

## Installation

Run the shadcn CLI to add the component:
```bash
bunx --bun shadcn@latest add $ARGUMENTS
```

This will:
1. Download the component source code
2. Place it in `components/ui/`
3. Add any required dependencies
4. Configure imports in `components.json`

---

## Verify Installation

### Check Files Created
```bash
# List new files in components/ui/
ls -la components/ui/ | grep -i "$ARGUMENTS"
```

### Check Dependencies Added
```bash
# View package.json for new Radix UI packages
cat package.json | grep -A 5 "dependencies"
```

If new dependencies were added, install them:
```bash
bun install
```

---

## Documentation

### 1. Read Component Docs
Visit shadcn/ui documentation:
- **Docs URL**: https://ui.shadcn.com/docs/components/$ARGUMENTS
- Review: Props, usage examples, variants, accessibility notes

### 2. Check Component Source
```bash
# Read the component source code
cat components/ui/$ARGUMENTS.tsx
```

Look for:
- Available props and variants
- Default styling
- Accessibility features (ARIA labels, keyboard navigation)
- Dependencies on other components

---

## Usage Example

Create an example usage in the appropriate location:

### If Feature Component
Add to `components/` directory:
```tsx
// components/Example$ARGUMENTSUsage.tsx
"use client"

import { $ARGUMENTS } from "@/components/ui/$ARGUMENTS"

export function Example$ARGUMENTSUsage() {
  return (
    <$ARGUMENTS>
      {/* Component content */}
    </$ARGUMENTS>
  )
}
```

### If Page Integration
Add to `app/page.tsx` or relevant route:
```tsx
import { $ARGUMENTS } from "@/components/ui/$ARGUMENTS"

// Use in JSX
<$ARGUMENTS variant="default">Content</$ARGUMENTS>
```

---

## Customization

### Styling with Tailwind
shadcn components use Tailwind classes. Customize by:

1. **Passing className prop**:
```tsx
<$ARGUMENTS className="custom-class">Content</$ARGUMENTS>
```

2. **Modifying component source** (if needed):
- Edit `components/ui/$ARGUMENTS.tsx`
- Preserve accessibility features
- Document changes in `components/ui/CLAUDE.md`

### Using Variants
Check component for available variants:
```tsx
<$ARGUMENTS variant="outline" size="sm">Content</$ARGUMENTS>
```

---

## Testing

### Manual Testing
1. **Dev server**: `bun run dev`
2. **Visual verification**: Open http://localhost:3000
3. **Interaction testing**: Click, hover, keyboard navigation
4. **Theme testing**: Toggle dark/light mode
5. **Responsive testing**: Mobile, tablet, desktop

### Accessibility Testing
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader friendly (ARIA labels present)
- [ ] Focus states visible
- [ ] Color contrast meets standards

---

## Update Documentation

### If New Pattern
Add to `components/ui/CLAUDE.md`:
```markdown
### $ARGUMENTS Component

**Usage**:
\`\`\`tsx
import { $ARGUMENTS } from "@/components/ui/$ARGUMENTS"

<$ARGUMENTS variant="default">Content</$ARGUMENTS>
\`\`\`

**Common Props**:
- `variant`: "default" | "outline" | "ghost"
- `size`: "sm" | "md" | "lg"
- `className`: Additional Tailwind classes

**Example**: See `components/Example$ARGUMENTSUsage.tsx`
```

---

## Commit Changes

```bash
git add components/ui/$ARGUMENTS.tsx package.json bun.lock

git commit -m "chore: add shadcn/ui $ARGUMENTS component

Installed using shadcn CLI for consistent styling and accessibility.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Quick Reference

- **Component Location**: `components/ui/$ARGUMENTS.tsx`
- **Documentation**: https://ui.shadcn.com/docs/components/$ARGUMENTS
- **Radix UI Source**: https://www.radix-ui.com/primitives/docs/components/$ARGUMENTS

Component installed successfully! ✅
