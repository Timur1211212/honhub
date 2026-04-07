#!/bin/bash
cd /var/www/honhub/public/heroes
for file in $(find . -name "*.html"); do
  if ! grep -q "application/ld+json" "$file"; then
    name=$(basename "$file" .html)
    sed -i "s|</head>|<script type=\"application/ld+json\">\n{\"@context\":\"https://schema.org\",\"@type\":\"Article\",\"headline\":\"$name\",\"mainEntityOfPage\":\"https://honhub.ru/heroes/$name\"}\n</script>\n</head>|" "$file"
    echo "Added: $name"
  fi
done
