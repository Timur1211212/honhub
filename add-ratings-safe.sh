#!/bin/bash
# Рейтинги героев
declare -A RATINGS=(
    ["gauntlet"]="4.5:28"
    ["andromeda"]="4.2:18"
    ["electrician"]="4.8:32"
    ["magmus"]="4.6:22"
    ["deadwood"]="4.3:15"
    ["chronos"]="4.9:41"
    ["accursed"]="4.1:19"
    ["devourer"]="4.4:26"
    ["pharaoh"]="4.7:31"
    ["legionnaire"]="4.6:29"
    ["glacius"]="4.3:21"
    ["witchslayer"]="4.7:35"
    ["pyromancer"]="4.4:24"
    ["valkyrie"]="4.6:33"
    ["swiftblade"]="4.5:26"
    ["monkey"]="4.2:17"
    ["nomad"]="4.4:23"
    ["scout"]="3.8:12"
)

# Проходим по всем HTML файлам
find public/heroes -name "*.html" | while read file; do
    hero=$(basename "$file" .html)
    rating_data="${RATINGS[$hero]}"
    
    if [ -n "$rating_data" ]; then
        rating="${rating_data%:*}"
        votes="${rating_data#*:}"
        
        # Добавляем рейтинг
        sed -i 's/"dateModified":"[^"]*"/"dateModified":"2026-04-07","aggregateRating":{"@type":"AggregateRating","ratingValue":"'$rating'","reviewCount":"'$votes'","bestRating":"5","worstRating":"1"}/' "$file"
        echo "✅ $hero ($rating ★, $votes голосов)"
    fi
done
echo "🎉 Готово!"
