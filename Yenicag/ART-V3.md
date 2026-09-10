# Flash-inspired art · v3

Built-in image_gen tool, not API/CLI. Original six-pet atlas; no third-party game assets copied.

Final source: `public/assets/pets-flash-v3.png`. Source uses a dedicated magenta key; `public/cartoon.js` removes it once in memory, crops per pet, and caches 144px-high sprites. Production body height remains 72 world pixels. Source is deliberately retained unchanged. The first transparency attempt returned an opaque checkerboard and was rejected.

## Generation prompt
Use case: stylized-concept. Asset type: transparent game character sprite atlas for a side-view browser artillery game.
Create ONE sprite sheet containing six original cute animal fighters in exactly 3 columns and 2 rows, equal-sized grid cells, no lines. Order: top row orange fox, gray raccoon, cream rabbit; bottom row brown owl, honey brown bear, lavender gray cat.
Style: nostalgic 2009 Facebook Flash cartoon game like Wild Ones, not pixel art. Simple slightly wonky hand-drawn rounded silhouettes, thick dark brown outlines, large expressive eyes, broad flat warm pastel color fills, just one small shadow tone, charming and playful, softly antialiased edges. NO glossy 3D, no painterly fur detail, no cinematic lighting, no military realism.
Each pet standing upright, full body in three-quarter SIDE view facing RIGHT, head large, compact chubby body, two stubby feet on same baseline within each cell. Simple colored neckerchief, otherwise fur body, no armor. Arms absent, so the engine can animate separate arms holding weapons; unobstructed torso sides, NO weapons or props. Each character fits a roughly 44 wide x 72 tall game silhouette, ears included; short cute rabbit ears. Tail small and close to body. All six consistent scale, centered in their cells, generous transparent margin, fully separated for cropping.
Background: genuinely transparent alpha, no checkerboard painted in, no backdrop, no ground shadow, no text, no labels, no watermark. 1536x1024 landscape atlas.

## Cutout revision (rejected opaque background)
Edit this six-animal sprite atlas. Remove the entire brown/black background and all glow, replacing it with TRUE TRANSPARENT ALPHA (RGBA alpha=0), not a black fill and not a checkerboard image. Preserve the six animals, exact grid positions, full feet, outlines and colors. Remove the hanging foreground arms/wings from each torso, replacing that area with continuous body fur; animated arms will be added in game. Keep the same original friendly early Facebook Flash game cartoon style. Nothing else, no ground shadows, no text.

## Final production revision
Edit the provided atlas for game engine chroma-key compositing. Replace ALL checkerboard background with a SINGLE perfectly flat solid vivid magenta #FF00FF color. NO texture, no gradient, no shadows in the background. No magenta inside the animals. Keep all six animal designs, exact dimensions, positions, outlines, full bodies and feet unchanged. Change the owl's green scarf to teal. This is a production sprite sheet, the engine will key out the magenta.

