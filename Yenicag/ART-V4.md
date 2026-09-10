# Art and cutout animation · v4

The user requested less babyish Wild Ones-inspired pets with moving head, arms and legs. Heads generated with the built-in image_gen tool (no CLI/API fallback); game-native bodies and weapons are articulated in Canvas.

## Assets and animation

- Final immutable atlas: `public/assets/heads-flash-v4.png`.
- `public/cartoon.js`: one-time chroma key, automatic per-cell alpha bounds and cached head sprites. Head pivots separately from torso. Two-bone arm joints keep hands at rotated weapon grips.
- `public/fighter-rig.js`: pure cosmetic idle, distance-driven steps, airborne tuck, landing compression, head aim and recoil/hurt poses. Physics and ballistic muzzle unchanged.
- `public/game.js`: fixed-step animation clock and landing/hurt event envelopes; network walk phase uses actual travelled distance.
- Existing v3 full-body atlas retained for rollback but no longer requested by the client.

Visual direction reference searched: [Wild Ones gameplay screenshots](https://vidabytes.com/2011/05/wild-ones-divertido-juego-online-tipo.html). No third-party character sprites copied.

## Generation prompt
Use case: stylized-concept. Production game asset: SIX disembodied ANIMAL HEADS ONLY for a cutout-animated side-view artillery browser game. A single 1536x1024 atlas, exactly 3 columns x 2 rows of equally spaced head sprites on perfectly flat solid chroma MAGENTA #FF00FF. No magenta in heads.
Top row orange fox, slate-gray raccoon, off-white rabbit. Bottom row tawny owl, brown bear, smoky gray cat. Each head faces RIGHT in nearly side view, one dominant visible eye, tiny second eye if visible. Confident mischievous competitive expressions: half-lowered eyelids, SMALL dark pupils in off-white eye shapes, thick arched brows, sideways smirk. NOT babies, NOT cute plush toys, NOT sparkling enormous Disney eyes. Closer to scrappy sarcastic pets in old Wild Ones Facebook / 2009 Flash web games. Slightly scruffy angular cheek tufts and asymmetry, long fox muzzle, compact rabbit ears. Flat medium-saturation color areas, heavy charcoal outlines, one hard cel shadow, no realistic fur, no gradients or gloss, no 3D, no rounded preschool aesthetic. Original character designs.
Each head fully isolated with generous magenta margin in its own 512x512 cell. All same visual scale. Heads ONLY, ending at jaw, NO bodies, NO neck scarves, NO shoulders, NO arms or feet, no accessories, no weapons, no scene, no text or labels. These heads will pivot at the bottom jaw over separately animated bodies. Keep the exact 3x2 layout.

## Final background revision
Change ONLY the background of the attached six-head atlas. Replace every dark background area and halo with perfectly flat saturated MAGENTA RGB(255,0,255), #FF00FF. This is a CHROMA KEY production asset. No shadows, no gradients, no textures, no black background, no checkerboard. Preserve the six heads and their exact positions, shapes and outlines unchanged. Only the area outside the animal heads becomes solid magenta.

## Verification

22 node tests, including pose transitions, collision/muzzle invariance and joint mirroring. Browser QA: all six species, two aim angles/directions, guns and grenades; six distinct rendered motion poses; actual move/jump/landing/recovery; missing atlas fallback; desktop/mobile and two-client online move/jump/fire/turn flow.

