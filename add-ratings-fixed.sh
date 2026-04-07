#!/bin/bash
HEROES_DIR="/var/www/honhub/public/heroes"
TODAY=$(date +%Y-%m-%d)
declare -A RATINGS=(["gauntlet"]="4.5:28" ["andromeda"]="4.2:18" ["electrician"]="4.8:32" ["magmus"]="4.6:22" ["deadwood"]="4.3:15" ["chronos"]="4.9:41" ["accursed"]="4.1:19" ["devourer"]="4.4:26" ["pharaoh"]="4.7:31" ["pebbles"]="4.0:14" ["behemoth"]="4.5:27" ["legionnaire"]="4.6:29" ["glacius"]="4.3:21" ["witchslayer"]="4.7:35" ["pyromancer"]="4.4:24" ["valkyrie"]="4.6:33" ["swiftblade"]="4.5:26" ["monkey"]="4.2:17" ["nomad"]="4.4:23" ["scout"]="3.8:12")
for file in $(find "$HEROES_DIR" -name "*.html"); do
  hero=$(basename "$file" .html)
  rating_data="${RATINGS[$hero]}"
  if [ -n "$rating_data" ]; then
    rating="${rating_data%:*}"
    votes="${rating_data#*:}"
  else
    rating="4.0"; votes="10"
  fi
  name=$(grep -oP '<h1>\K[^<]+' "$file" | head -1)
  desc=$(grep -oP '<meta name="description" content="\K[^"]+' "$file" | head -1)
  name=${name//\"/\\\"}; desc=${desc//\"/\\\"}
  json='<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"'$name'","description":"'$desc'","image":"https://honhub.ru/images/'$hero'.webp","author":{"@type":"Person","name":"HonHub"},"publisher":{"@type":"Organization","name":"HonHub"},"mainEntityOfPage":"https://honhub.ru/heroes/'$hero'","datePublished":"'$TODAY'","dateModified":"'$TODAY'","aggregateRating":{"@type":"AggregateRating","ratingValue":"'$rating'","reviewCount":"'$votes'","bestRating":"5","worstRating":"1"}}</script>'
  sed -i "/<script type=\"application\/ld+json\">/,/<\/script>/c\\$json" "$file"
  echo "✅ $hero ($rating)"
done
echo "🎉 Готово!"
