# MULTIVERSE 404 — Pixel-aligned energy-map assets

Source: supplied 1536×1024 RGBA tree. All maps are 1536×1024, with no cropping, shifting, or upscaling.

Files:
- tree_reference.png — exact original tree
- tree_emissive.png — grayscale energy emission on black
- tree_emissive_cyan.png / tree_emissive_violet.png — channel-separated energy
- tree_intensity.png — broader glow strength
- tree_glow_soft.png — broad halo
- tree_flow_rg.png — R/G signed direction vector, B emissive intensity (read as linear data, not sRGB color)
- branch_*.png — 7 individually activatable branch energy masks
- portal_positions.json — normalized positions, pixel positions and flow-path guides
- alignment_preview.png — visual sanity check

Rendering: Overlay emissive or branch masks with screen/additive blending; animate a procedural traveling wave using branch paths or RG direction and the emissive mask. Keep all texture UVs identical. The branch masks are automatically partitioned approximations based on the supplied tree geometry, not manually painted vein tracing. Portal positions follow the uploaded guidance and may need artistic adjustment in the actual site.

WARNING: tree_flow_rg.png encodes a tangent-field approximation from branch polylines. It is not an exact per-vein optical-flow solution. Do not interpret its RGB as a visual color overlay.
