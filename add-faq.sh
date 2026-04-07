#!/bin/bash
find public/heroes -name "*.html" | while read file; do
  hero_name=$(grep -oP '<h1>\K[^<]+' "$file" | head -1)
  
  # Проверяем, нет ли уже FAQ
  if ! grep -q "FAQPage" "$file"; then
    cat >> "$file" << JSON

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Как играть за $hero_name?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Подробный гайд по $hero_name читайте на HonHub. Изучите способности и рекомендуемые предметы."
      }
    },
    {
      "@type": "Question",
      "name": "Какие предметы собирать $hero_name?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Рекомендуемые предметы для $hero_name смотрите в разделе 'Предметы' на HonHub."
      }
    }
  ]
}
</script>
JSON
    echo "✅ Добавлен FAQ для: $hero_name"
  fi
done
echo "🎉 Готово!"
