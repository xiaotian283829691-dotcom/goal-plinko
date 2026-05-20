# Asset: Bottom Multiplier Slots

## Usage
The landing zones at the bottom of the Plinko board. Each slot shows a multiplier value (0.5x, 1.1x, 3x, 10x, etc.). Colors gradient from center (low value, muted) to edges (high value, vibrant). Styled as miniature goal nets or goal-mouth shapes.

## Image Spec
- **Size**: 64x48 px each, PNG with transparent background
- **Quantity**: 5 color tiers
- **File naming**: `slot-tier-{1-5}.png`

## Color Tiers (center → edge)

1. **Tier 1 (0.3x-0.5x)** — Gray/dark silver, muted, "miss" feeling
2. **Tier 2 (0.9x-1.1x)** — Soft white/light gray, neutral "break even"
3. **Tier 3 (1.3x-1.8x)** — Green glow, "small win"
4. **Tier 4 (3x-5x)** — Orange/amber glow, "nice win"
5. **Tier 5 (10x-100x+)** — Gold with radiant glow, "jackpot" — the most visually exciting

## Prompt Template (repeat for each tier)

> A small game UI element shaped like a miniature goal net or goal mouth, viewed from the front. The net/frame glows in [TIER COLOR]. Subtle depth effect. Clean vector-game style, not photorealistic. Transparent background. The shape should suggest "a ball lands here" — like a catching pocket or goal. Render at 64x48 pixels.

## Style Notes
- These sit side by side at the bottom of the board, forming a row of 13 slots
- Higher tiers should feel progressively more exciting and premium
- Tier 5 (gold/jackpot) should have a subtle particle/glow effect that reads at small size
- Must look clean when placed adjacent — no overlapping glow bleeds
