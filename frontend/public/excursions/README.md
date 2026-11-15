# Картинки для точек экскурсий

Положите фото сюда по схеме `<slug-объекта>/<номер-точки>.jpg`, например:

```
excursions/mir-castle/1.jpg     — Въездная башня
excursions/mir-castle/2.jpg     — Внутренний двор
excursions/khatyn-memorial/1.jpg — «Непокорённый человек»
```

Список объектов, точек и их порядок — в `backend/app/seed_excursions.py`.
Если файла нет, в интерфейсе показывается заглушка — экскурсия всё равно работает.
Вместо локального файла можно указать внешний URL: ключ `"image_url"` у точки в `seed_excursions.py`.

## Несвижский замок — расширенная экскурсия (14 слайдов)

| Файл | Слайд |
|---|---|
| `nesvizh-castle/1.jpg` | Несвижский дворец Радзивиллов |
| `nesvizh-castle/2.jpg` | До каменного замка |
| `nesvizh-castle/3.jpg` | Сиротка закладывает замок |
| `nesvizh-castle/4.jpg` | Несвижская ординация |
| `nesvizh-castle/5.jpg` | Неприступная крепость |
| `nesvizh-castle/6.jpg` | Рыбонька и Пане Коханку |
| `nesvizh-castle/7.jpg` | Библиотека, архив и галерея |
| `nesvizh-castle/8.jpg` | Театр Франциски Урсулы |
| `nesvizh-castle/9.jpg` | Парадные залы |
| `nesvizh-castle/10.jpg` | Наполеон и закат |
| `nesvizh-castle/11.jpg` | Мария де Кастеллан и парки |
| `nesvizh-castle/12.jpg` | XX век |
| `nesvizh-castle/13.jpg` | Пожар и возрождение |
| `nesvizh-castle/14.jpg` | Чёрная дама |
