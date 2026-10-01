# DESIGN SYSTEM: SAMURAI & SUMI-E FLUID AESTHETICS (武士道と墨絵)

## Design Read
> **Reading this as:** Master-level Japanese Samurai & Sumi-e calligraphic portfolio paired with real-time Navier-Stokes dye whorl fluid dynamics. Blends traditional Japanese sword-forging craftsmanship (*Katana, Tamahagane, Kamon, Hanko*) with GPU shader computing, featuring calligraphic serifs (*Shippori Mincho*), classical Roman inscriptions (*Cinzel*), and razor-cut kissaki button geometry.

---

## Dial Configuration
- **DESIGN_VARIANCE:** `8` (Asymmetric visual hierarchy, organic offsets, curated bento composition)
- **MOTION_INTENSITY:** `7` (Continuous autonomous Navier-Stokes dye dispersion, blade-cut mouse stirring, kinetic springs)
- **VISUAL_DENSITY:** `3` (Disciplined Ma/間 negative space, generous line heights, breathable editorial typography)

---

## Color Tokens & Theme Architecture

### Mode: Dark ("The Night Shinobi & Katana Steel" // 漆黒と玉鋼)
- `--background`: `#090a0f` (Deep obsidian lacquer void)
- `--surface-1`: `rgba(14, 16, 24, 0.88)` (High-density smoked glass armor)
- `--surface-2`: `rgba(22, 25, 38, 0.94)` (Elevated blade-rest card)
- `--foreground`: `#f4f4f7` (Polished blade steel white)
- `--muted`: `#9ba1b0` (Nocturnal mist gray)
- `--border`: `rgba(217, 56, 58, 0.22)` (Subtle vermilion lacquer boundary)
- `--border-hover`: `rgba(217, 56, 58, 0.65)` (Bright vermilion strike glow)
- `--accent`: `#d9383a` (Traditional Shu-iro vermilion seal red // 朱色)
- `--accent-fg`: `#ffffff` (White on vermilion)
- `--accent-glow`: `rgba(217, 56, 58, 0.35)` (Reflective vermilion dispersion)
- `--gold`: `#c59b27` (Kin-cha tsuba guard gold // 金茶)
- `--scrim`: `linear-gradient(180deg, rgba(9, 10, 15, 0) 0%, rgba(9, 10, 15, 0.96) 100%)`
- **Fluid Shader Ramp**:
  - `c0: [0.035, 0.038, 0.05]` (Obsidian lacquer base)
  - `c4: [0.92, 0.93, 0.96]` (Luminescent blade steel mist)
  - `accent: [0.85, 0.20, 0.22]` (Traditional vermilion red ink droplets)

### Mode: Light ("The Washi Scroll & Flowing Sumi-e Ink" // 和紙と墨痕)
- `--background`: `#fbfaf6` (Raw fibrous washi paper ivory // 和紙)
- `--surface-1`: `rgba(255, 255, 255, 0.90)` (Refined translucent rice paper)
- `--surface-2`: `rgba(246, 244, 238, 0.96)` (Double-layered washi surface)
- `--foreground`: `#11141a` (Pure unrefined sumi calligraphy black // 墨)
- `--muted`: `#575a66` (Diluted ink wash charcoal // 薄墨)
- `--border`: `rgba(17, 20, 26, 0.12)` (Minimal ink brush outline)
- `--border-hover`: `rgba(185, 28, 28, 0.45)` (Vermilion seal wax highlight)
- `--accent`: `#b91c1c` (Hanko vermilion stamp wax // 印章朱肉)
- `--accent-fg`: `#ffffff` (Washi white on seal red)
- `--accent-glow`: `rgba(185, 28, 28, 0.22)` (Soft stamp dispersion)
- `--gold`: `#a17c18` (Antiqued gold leaf // 箔)
- `--scrim`: `linear-gradient(180deg, rgba(251, 250, 246, 0) 0%, rgba(251, 250, 246, 0.96) 100%)`
- **Fluid Shader Ramp**:
  - `c0: [0.985, 0.98, 0.965]` (Ivory washi scroll base)
  - `c4: [0.015, 0.02, 0.025]` (Deep soot sumi-e ink plume)
  - `accent: [0.75, 0.15, 0.18]` (Hanko vermilion wax drop)

---

## Typography Hierarchy
- **Primary Display & Headings**: `Shippori Mincho` (しっぽり明朝)
  - Authentic brushstroke contrast, organic Mincho serifs, elegant horizontal strokes.
  - Tracking: `-0.025em`, leading `1.15`.
- **Inscriptions & Monograms**: `Cinzel`
  - Chiseled classical proportions for Latin subtitles, Roman titles, and structural labels.
  - Letter-spacing: `0.06em` to `0.16em` for kickers.
- **Body & Continuous Reading**: `Plus Jakarta Sans`
  - Crisp modern geometric readability for paragraphs and descriptions.
  - Leading `1.65`, `max-width: 68ch`.
- **Code & Shader Metrics**: `Fira Code`
  - Monospace technical precision for frame budgets, memory allocation, and status readouts.

---

## Samurai Motifs & Geometric Components

### 1. Katana Kissaki Chamfer Buttons (`.btn-primary`, `.btn-secondary`)
- Razor-cut polygon edges evoking a samurai sword's angled tip (*kissaki*):
  `clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));`
- Interactive hover shifts with red glow reflection.

### 2. Katana Blade-Edge Dividers (`.katana-divider`)
- Linear gradient divider with central diamond tsuba mark:
  - Gradient: `linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--foreground) 50%, var(--accent) 70%, transparent 100%)`
  - Central 45-degree diamond crest with glowing vermilion accent.

### 3. Hanko Seal Stamps (`.hanko-seal`, `.contact-hanko-seal`, `.media-kamon-stamp`)
- Square vermilion seal stamp with authentic kanji characters (`刀匠`, `拝謁`, `斬`, `墨`, `影`, `蒔`).
- Inset and drop shadows recreating wet ink and wax stamping.

### 4. Interactive Blade-Cursor (`.cursor`)
- Fine reticle ring with center vermilion hanko dot (`.cursor-blade-hanko`).
- Expands to 48px on hoverable elements with screen/multiply blending.

### 5. Authentic Sourced Photography (Strictly Zero AI)
- Katana forged tamahagane steel (Unsplash `photo-1590486803833-1c5dc8ddd4c8`)
- Sumi-e brush ink dispersion (Unsplash `photo-1579783900882-c0d3dad7b119`)
- Kyoto nocturnal mist cityscape (Unsplash `photo-1503899036084-c55cdd92da26`)
- Kyoto traditional temple rooflines (Unsplash `photo-1493976040374-85c8e12f0c0e`)
