#!/usr/bin/env bash
# Makes the photographs in site/images with FLUX.1-schnell (Apache-2.0) through mflux, then sizes and compresses them.
# Every picture is generated: no stock or third-party photographs. Run it on Apple silicon.
#
#   uv tool install mflux
#   HF_HOME=/path/with/space scripts/images.sh            # all images
#   HF_HOME=/path/with/space scripts/images.sh obj-bell   # one image (for a new seed, edit its line below)
#   CONVERT_ONLY=1 scripts/images.sh                       # only size and compress the kept raw images again
#
# The weights are the mflux 8-bit conversion of FLUX.1-schnell: mflux-community/flux-1-schnell-mflux-q8.
set -euo pipefail
cd "$(dirname "$0")/.."
RAW=${RAW_DIR:-./.raw}
OUT=site/images
MODEL=mflux-community/flux-1-schnell-mflux-q8
STYLE="professional documentary photograph, natural light, realistic colours, sharp focus, high detail, no text, no signage, no lettering, no watermark"
mkdir -p "$RAW" "$OUT"

# kind|name|seed|prompt[|crop]. Kinds: hero (980x392), wide (960x540), square (680x680). The optional crop (an
# ImageMagick geometry on the 1280x720 raw image) cuts out a part with stray lettering before the resize.
LIST=$(cat <<'EOF'
hero|hero-museum|11|a two-storey heritage sandstone customs house with a small clock tower and a verandah, on a grassy foreshore beside a calm blue bay in coastal Australia, tall Norfolk Island pine trees, an old timber jetty, late afternoon golden light, wide angle architectural photograph
hero|hero-lighthouse|23|a white stone lighthouse tower on a rugged green headland above the ocean in coastal Australia at dusk, pink and orange sky, waves on dark rocks below, wide landscape photograph
hero|hero-hall|31|interior of a spacious heritage maritime museum gallery in an old sandstone warehouse, a restored wooden surf rowing boat hung from the timber roof trusses, glass display cases, polished timber floor, warm light, no people
wide|ex-lighthouse-keepers|41|interior of a lighthouse lamp room, a large antique glass Fresnel lens with concentric brass-framed prisms glowing warmly, the ocean visible through the windows at blue hour
wide|ex-southern-reef|53|underwater photograph of the broken weathered timber ribs and keel of a very old wooden shipwreck half buried in pale sand on the sea floor, covered in kelp and marine growth, a school of small silver fish, blue-green water, sun rays from above, scuba diver's photograph
wide|ex-boats-of-the-bay|62|a traditional wooden clinker fishing boat with a plain unpainted hull under restoration on trestles in a timber boat shed workshop, wood shavings, hand planes and clamps on a bench, warm window light, no people
wide|ex-charting-the-coast|78|a small nineteenth-century two-masted wooden survey ship at anchor in a quiet bay below green headlands, a rowing boat with distant sailors taking soundings with a lead line, soft morning light, calm water, historical reconstruction photograph
wide|ex-figureheads|84|three antique carved wooden ship figureheads, each the full upper body of a woman leaning forward as from a ship's bow, painted in faded white, blue and gold, mounted high on a whitewashed brick wall in a heritage museum gallery, warm spotlights
wide|ev-shanty-night|97|an evening folk music concert inside a heritage maritime museum, a small band seen from behind the audience with a fiddle player, an accordion player and a guitarist on a low stage, wooden boats and lanterns around them, warm festive light, people seen from behind
wide|ev-knot-workshop|102|thick natural manila ropes tied in classic sailor knots, a bowline, a reef knot and a figure eight, laid out on an old wooden workbench, coils of rope, a wooden pulley block and a brass shackle, warm light
wide|ev-twilight-tour|113|a gravel walking track along a grassy coastal headland leading to a white lighthouse at twilight, a small group of people walking away from the camera wearing jackets, deep blue sky with first stars
wide|ev-wooden-boat-festival|128|classic wooden sailing boats with varnished timber hulls and colourful painted topsides moored side by side along an old timber jetty on a sunny bay, sails neatly furled on the booms, triangular bunting flags, blue water, people strolling on the jetty seen from behind|1138x640+70+0
wide|ev-curators-talk|132|a highly detailed museum model of a three-masted sailing ship with rigging and cream sails inside a glass display case in a dark museum gallery, plain dark background, soft gallery spotlight, nothing else in the frame|960x540+240+110
square|obj-wheel|154|an antique teak and brass ship's steering wheel with eight turned spokes and a polished brass hub, standing upright on a dark plinth, museum object photograph, soft studio light, dark background
square|obj-figurehead|152|an antique ship's figurehead carved from wood, the upper body of a woman with dark hair leaning forward, a flowing blue and white painted gown with gilded trim, the lower part curving into a carved scroll, mounted on a timber wall bracket, museum object photograph, dark grey background, soft studio light
square|obj-lantern|167|an antique weathered copper and brass ship's signal lantern with a ring handle on top, glass globe protected by brass guard wires, green patina, standing on an old dark wooden table, museum object photograph, dramatic soft side light, dark background
square|obj-bell|173|a polished brass ship's bell with a rope pull hanging from a varnished timber frame, museum object photograph against a plain dark background, soft studio light, plain bell with no engraving
square|obj-diving-helmet|182|an antique copper and brass deep sea diving helmet with three round glass windows and bolts, museum object photograph on a plain dark plinth, dark background, soft studio light
square|obj-ship-in-bottle|192|a model sailing ship with white sails inside a plain clear glass bottle with a cork stopper, lying on a small wooden stand, museum object photograph, dark background, soft studio light
wide|gal-keepers-cottage|199|a row of white-painted heritage stone lighthouse keepers' cottages with red roofs below a white lighthouse on a green headland, blue sky, coastal Australia
wide|gal-wreck-timber|211|the weathered wooden ribs of an old shipwreck hull emerging from wet sand on a beach at low tide, soft morning light, reflections, coastal Australia
wide|gal-ship-model|223|a detailed museum model of a small early twentieth century coastal steamship with a black hull and a single funnel, on a timber plinth in a gallery, soft light, dark background
wide|gal-carver-tools|227|traditional wood carving chisels, gouges and a round wooden mallet laid out on a workbench beside a half-carved block of pine, wood shavings, warm window light
wide|gal-foyer|233|the bright entrance foyer of a heritage sandstone museum, polished timber floor, tall arched windows, a large wooden ship's wheel on display, a reception desk, no people, calm daylight
wide|gal-jetty|240|an old timber jetty stretching into a calm bay at dawn, soft pink and blue sky, still water reflections, a small wooden rowing boat floating on the water beside the jetty, tied with a rope, coastal Australia
EOF
)

size_of() {
  case "$1" in
    hero) echo "1280 512 980x392" ;;
    wide) echo "1280 720 960x540" ;;
    square) echo "1024 1024 680x680" ;;
  esac
}

generate() {
  local kind=$1 name=$2 seed=$3 prompt=$4
  read -r w h final < <(size_of "$kind")
  # mflux does not overwrite: it would write name_1.png and leave the old file in place.
  rm -f "$RAW/$name.png"
  mflux-generate --model "$MODEL" --base-model schnell --steps 4 --seed "$seed" \
    --width "$w" --height "$h" --prompt "$prompt, $STYLE" --output "$RAW/$name.png"
}

compress() {
  local kind=$1 name=$2 crop=$3 src
  read -r w h final < <(size_of "$kind")
  src=("$RAW/$name.png")
  if [ -n "$crop" ]; then src+=(-crop "$crop" +repage); fi
  magick "${src[@]}" -resize "$final^" -gravity center -extent "$final" -strip -interlace JPEG -quality 82 "$OUT/$name.jpg"
  magick "${src[@]}" -resize "240x180^" -gravity center -extent 240x180 -strip -quality 80 "$OUT/$name-thumb.jpg"
}

while IFS='|' read -r kind name seed prompt crop; do
  if [ $# -gt 0 ] && [[ " $* " != *" $name "* ]]; then continue; fi
  if [ -z "${CONVERT_ONLY:-}" ]; then generate "$kind" "$name" "$seed" "$prompt"; fi
  compress "$kind" "$name" "$crop"
done <<< "$LIST"
