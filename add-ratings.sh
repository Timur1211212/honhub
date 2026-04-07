#!/bin/bash
HEROES_DIR="/var/www/honhub/public/heroes"
TODAY=$(date +%Y-%m-%d)

# Таблица рейтингов (герой:рейтинг:количество_голосов)
declare -A RATINGS=(
    ["gauntlet"]="4.5:28"      # Перчатка
    ["andromeda"]="4.2:18"     # Андромеда
    ["electrician"]="4.8:32"   # Электрик
    ["magmus"]="4.6:22"        # Магмус
    ["deadwood"]="4.3:15"      # Дедвуд
    ["chronos"]="4.9:41"       # Хронос
    ["accursed"]="4.1:19"      # Аккурсед
    ["devourer"]="4.4:26"      # Деваурер
    ["pharaoh"]="4.7:31"       # Фараон
    ["pebbles"]="4.0:14"       # Пэбблз
    ["behemoth"]="4.5:27"      # Бегемот
    ["legionnaire"]="4.6:29"   # Легионер
    ["glacius"]="4.3:21"       # Гласиус
    ["witchslayer"]="4.7:35"   # Витч Слэер
    ["pyromancer"]="4.4:24"    # Пиромант
    ["valkyrie"]="4.6:33"      # Валькирия
    ["swiftblade"]="4.5:26"    # Свифтблейд
    ["monkey"]="4.2:17"        # Манки
    ["nomad"]="4.4:23"         # Номад
    ["scout"]="3.8:12"         # Скаут
)

for file in $(find "$HEROES_DIR" -name "*.html"); do
  hero=$(basename "$file" .html)
  rating_data="${RATINGS[$hero]}"
  
  if [ -n "$rating_data" ]; then
    rating="${rating_data%:*}"
    votes="${rating_data#*:}"
  else
    rating="4.0"
    votes="10"
  fi

  name=$(grep -oP '<h1>\K[^<]+' "$file" | head -1)
  desc=$(grep -oP '<meta name="description" content="\K[^"]+' "$file" | head -1)
  name=${name//\"/\\\"}
  desc=${desc//\"/\\\"}
  
  cat > /tmp/jl << J
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "$name",
  "description": "$desc",
  "image": "https://honhub.ru/images/$hero.webp",
  "author": {"@type": "Person", "name": "HonHub"},
  "publisher": {"@type": "Organization", "name": "HonHub"},
  "mainEntityOfPage": "https://honhub.ru/heroes/$hero",
  "datePublished": "$TODAY",
  "dateModified": "$TODAY",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "$rating",
    "reviewCount": "$votes",
    "bestRating": "5",
    "worstRating": "1"
  }
}
</script>
J
  sed -i '/application\/ld+json/,/<\/script>/d' "$file"
  sed -i "s|</head>|$(cat /tmp/jl)\n</head>|" "$file"
  echo "✅ Обновлен: $hero (рейтинг: $rating, голосов: $votes)"
done
rm -f /tmp/jl
echo "🎉 Готово!"
