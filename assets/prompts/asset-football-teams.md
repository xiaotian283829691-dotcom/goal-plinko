# Asset: Team-Colored Footballs

## Usage
When users pick a World Cup team allegiance (Phase 3), the ball skin changes to their team's colors. These replace the default black/white football during gameplay.

## Image Spec
- **Size**: 128x128 px each, PNG with transparent background
- **Quantity**: 8 images (one per team)
- **File naming**: `ball-{country}.png`

## Teams & Color Schemes

1. **Brazil** — Yellow base, green pentagons, blue accent
2. **Argentina** — Light blue & white stripes pattern on ball surface
3. **France** — Navy blue base, red & white accent pentagons
4. **Germany** — Black base, red & gold accent pentagons
5. **USA** — White base, red & navy blue stars/stripes pattern
6. **Mexico** — Dark green base, white & red accent pentagons
7. **Spain** — Red base, yellow accent pentagons
8. **England** — White base, navy blue cross pattern, red accent

## Prompt Template (repeat for each team)

> A soccer ball icon, 3D rendered style with soft lighting from top-left. The traditional hexagonal/pentagonal pattern is colored in [TEAM COLORS DESCRIBED ABOVE] instead of classic black and white. Slight glossy highlight on the upper-left surface. Clean edges, no shadow, transparent background. The ball should clearly evoke the [COUNTRY] national team colors while remaining recognizable as a football. Render at 128x128 pixels.

## Style Notes
- Must match the default football's shape, size, lighting, and glossiness exactly — only colors differ
- Team colors should be instantly recognizable (e.g., Brazil = yellow/green, not ambiguous)
- Maintain readability at 24px display size
