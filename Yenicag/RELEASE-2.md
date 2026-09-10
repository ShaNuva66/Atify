# Yeniçağ — Yüksek Zemin

Retro palette and code-drawn pixel characters replace the mismatched painted
sprites. Portraits, held weapons and battlefield characters share the same art.
Hands, barrel direction and projectile origin share a single weapon transform.

The three maps now have distinct ridges, valleys and five destructible platforms.
Characters land using their previous and current foot positions, drop when support
breaks, and can fire while jumping. Bots move over time and can seek a platform.

Shared world geometry defines body bounds, terrain, movement and platform landing
for client and server. Projectiles sweep the entire frame displacement and choose
the earliest body/platform/terrain collision. Blast distance uses the body bounds.
Online shots broadcast the server's current player poses and facing direction.

Verification: 16 Node tests; desktop and 390px browser checks; two-browser room,
movement, airborne shooting and turn transfer. Debug hitboxes: `?hitboxes=1`.
Browser test access is restricted to localhost with `?test=1`.

The existing host-authority damage protocol is retained; this release does not
implement a fully server-authoritative combat simulation or reconnect recovery.
