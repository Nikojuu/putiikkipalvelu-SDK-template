# CLAUDE.md

This file provides guidance to Claude Code when working with this storefront template.

## Project Overview

**Next.js 16 + React 19 storefront template** for Putiikkipalvelu e-commerce platform.

- **Purpose**: Frontend template for tenant storefronts
- **Data**: All data fetched via `@putiikkipalvelu/storefront-sdk`
- **Multi-tenant**: Each store gets custom theme (colors, fonts, branding)
- **Focus**: This is a pure frontend project - styling and UI components

## Development Commands

```bash
npm run dev      # Start dev server (localhost:3001)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run linter
npm run email    # Preview email templates
```

## SDK Integration

Full docs: https://www.putiikkipalvelu.fi/fi/docs/sdk

### Client Setup
Located at `src/lib/storefront.ts`:
```typescript
import { createStorefrontClient } from "@putiikkipalvelu/storefront-sdk";

const storefront = createStorefrontClient({
  apiKey: process.env.STOREFRONT_API_KEY,
  baseUrl: process.env.NEXT_PUBLIC_STOREFRONT_API_URL,
});
```

### Available Namespaces
- `storefront.products` - Product catalog (getBySlug, filtered, latest)
- `storefront.categories` - Categories (list, getBySlug)
- `storefront.store` - Store config and SEO
- `storefront.cart` - Cart operations (get, addItem, updateQuantity, removeItem, validate)
- `storefront.checkout` - Payment (stripe, paytrail)
- `storefront.shipping` - Shipping methods and locations
- `storefront.customer` - Auth and profile (login, register, logout, getProfile, updateProfile)

### Types
Import types directly from SDK:
```typescript
import type { Product, Category, CartItem, Customer, Order } from "@putiikkipalvelu/storefront-sdk";
```

### Error Handling
SDK throws typed errors: `NotFoundError`, `ValidationError`, `VerificationRequiredError`

---

## Styling Architecture

### CSS Variables (`src/app/globals.css`)

All colors use HSL format for easy theming:

**Semantic Colors** (shadcn/ui):
```css
--background, --foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--tertiary, --tertiary-foreground
--accent, --accent-foreground
--muted, --muted-foreground
--destructive, --destructive-foreground
--border, --input, --ring
```

**Custom Theme Colors** (current jewelry theme - rename for your store):
```css
--rose-gold: 15 45% 65%;       /* Primary accent */
--champagne: 38 45% 78%;       /* Secondary accent */
--cream: 35 40% 95%;           /* Card backgrounds */
--warm-white: 30 33% 98%;      /* Page background */
--soft-blush: 350 35% 90%;     /* Subtle accent */
--deep-burgundy: 350 45% 30%;  /* Sale badges, warnings */
--charcoal: 20 15% 18%;        /* Text color */
```

### Font System (`src/lib/fonts.ts`)

```typescript
--font-primary   // Headlines (h1), currently: Recursive
--font-secondary // Body text, currently: Ubuntu
```

Usage in Tailwind: `font-primary`, `font-secondary`

### Tailwind Configuration (`tailwind.config.ts`)

- **Colors**: All CSS variables mapped to Tailwind utilities
- **Animations**: `shine`, `shimmer-x`, `shimmer-y`
- **Dark mode**: Enabled via `.dark` class
- **Border radius**: Uses `--radius` variable

### Shadcn/UI

- **Style**: `new-york`
- **Components**: `src/components/ui/` (28+ components)
- **Config**: `components.json`

### Utility Function (`src/lib/utils.ts`)

```typescript
import { cn } from "@/lib/utils";

// Merges Tailwind classes with conflict resolution
cn("px-4 py-2", isActive && "bg-primary", className)
```

### Class Variance Authority (CVA)

Used for component variants (Button, Badge):
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", outline: "...", ghost: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
});
```

### Custom Utility Classes

```css
.text-gradient-gold    /* Gold gradient text */
.text-gradient-rose    /* Rose gradient text */
.shimmer-gold          /* Animated shimmer effect */
.card-lift             /* Hover lift animation */
.diamond-shape         /* Diamond clip-path */
.octagon-clip          /* Octagon clip-path */
.line-ornament         /* Decorative line with center element */
.artistic-border       /* Double-line border effect */
```

### Animation Patterns

- **Framer Motion**: Complex animations, parallax, staggered reveals
- **tailwindcss-animate**: Simple transitions
- **CSS keyframes**: Shimmer effects in `globals.css`

---

## Component Patterns

### Standard Pattern
```tsx
import { cn } from "@/lib/utils";

export function Component({ className, ...props }) {
  return (
    <div className={cn("base-classes", className)} {...props}>
      {/* content */}
    </div>
  );
}
```

### Card with Corner Accents
```tsx
<div className="group relative bg-warm-white p-6">
  {/* Border */}
  <div className="absolute inset-0 border border-rose-gold/10 group-hover:border-rose-gold/25 transition-colors" />

  {/* Corner accents (4 corners) */}
  <div className="absolute top-0 left-0 w-6 h-6 border-l border-t border-rose-gold/30
                  group-hover:w-10 group-hover:h-10 transition-all duration-500" />
</div>
```

### Gradient Dividers
```tsx
<div className="h-[1px] bg-gradient-to-r from-rose-gold/30 to-transparent" />
<div className="h-[1px] bg-gradient-to-r from-transparent via-rose-gold/40 to-transparent" />
```

---

## Theming (Per-Tenant)

To customize for a new store:

1. **Colors**: Edit CSS variables in `src/app/globals.css`
2. **Color names**: Update `tailwind.config.ts` color keys
3. **Fonts**: Change fonts in `src/lib/fonts.ts`
4. **Store config**: Update `src/app/utils/constants.ts`
5. **Find & replace**: Old color names with new across components

---

## CMS Block Types

Dynamic pages from the API contain a `blocks` JSON array. Each block has a `type` field — the storefront must render each type:

`markdown`, `accordion`, `gallery`, `about`, `showcase`, `hero`, `latest_products`, `cta`, `carousel_content`, `opening_hours`, `image_grid`, `text_grid`, `table`

---

## Route Structure

**Storefront** (`src/app/(storefront)/`):
- `/` - Homepage
- `/products/[...slug]` - Product listing & details
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/about`, `/contact`, `/gallery`
- `/privacy-policy`, `/terms`

**Auth** (`src/app/(auth)/`):
- `/login`, `/register`
- `/mypage`, `/myinfo`, `/myorders`, `/mywishlist`

---

## Key Files

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Tailwind customization |
| `src/app/globals.css` | CSS variables & utilities |
| `src/lib/fonts.ts` | Font configuration |
| `src/lib/utils.ts` | `cn()` utility |
| `src/lib/storefront.ts` | SDK client |
| `src/components/ui/` | Shadcn components |
| `src/app/utils/constants.ts` | Store configuration |

---

## Skills Available

### `/pupun-korvat-styling` - Jewelry Theme

Complete styling guide for the current jewelry theme. Contains:
- **Phase 1-10**: Page-by-page component styling
- **Foundation**: Colors, fonts, gradients
- **Decorative patterns**: Corner accents, diamonds, dividers
- **Animation patterns**: Framer Motion, CSS transitions
- **Completion checklist**: Track styling progress

Run `/pupun-korvat-styling` when applying or documenting theme styling.

---

## TypeScript

- Strict mode enabled
- Path aliases: `@/*` → `src/*`
- JSX transform: `react-jsx`
