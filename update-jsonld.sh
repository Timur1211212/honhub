#!/bin/bash
HEROES_DIR="/var/www/honhub/public/heroes"
TODAY=$(date +%Y-%m-%d)

for file in $(find "$HEROES_DIR" -name "*.html"); do
  hero=$(basename "$file" .html)
  name=$(grep -oP '<h1>\K[^<]+' "$file" | head -1)
  desc=$(grep -oP '<meta name="description" content="\K[^"]+' "$file" | head -1)
  name=${name//\"/\\\"}
  desc=${desc//\"/\\\"}
  
  cat > /tmp/jl << J
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"$name","description":"$desc","image":"https://honhub.ru/logo/401690.jpg","author":{"@type":"Person","name":"HonHub"},"publisher":{"@type":"Organization","name":"HonHub"},"mainEntityOfPage":"https://honhub.ru/heroes/$hero","datePublished":"$TODAY","dateModified":"$TODAY"}</script>
J
  sed -i '/application\/ld+json/,/<\/script>/d' "$file"
  sed -i "s|</head>|$(cat /tmp/jl)\n</head>|" "$file"
  echo "✅ $hero"
done
rm -f /tmp/jl
