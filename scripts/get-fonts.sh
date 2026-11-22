#!/bin/sh
# Downloads the Archivo variable font (SIL Open Font License) into src/static/fonts/.
# Run this once on a computer with internet access, then commit the font file.
# We host the font ourselves so visitors do not connect to Google (GDPR).
set -e
cd "$(dirname "$0")/.."
mkdir -p src/static/fonts
BASE="https://raw.githubusercontent.com/google/fonts/main/ofl/archivo"
curl -fL "$BASE/Archivo%5Bwdth%2Cwght%5D.ttf" -o /tmp/archivo.ttf
curl -fL "$BASE/OFL.txt" -o src/static/fonts/OFL.txt

# Convert to WOFF2 (about 70% smaller). Needs fonttools: pip3 install fonttools brotli
if python3 -c "import fontTools, brotli" 2>/dev/null; then
  # Keep Latin characters only (English and Portuguese).
  python3 -m fontTools.subset /tmp/archivo.ttf \
    --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,U+2215" \
    --layout-features='*' --flavor=woff2 --output-file=src/static/fonts/archivo.woff2
  echo "Done: src/static/fonts/archivo.woff2"
else
  echo "fonttools is not installed. Run: pip3 install fonttools brotli   then run this script again."
  exit 1
fi
