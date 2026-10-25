from app.database import SessionLocal, create_db_and_tables
from app.models import Attraction, Category, District


CATEGORIES = [
    {"slug": "castles", "name": "Замки", "icon": "castle", "color": "#8b5cf6"},
    {"slug": "religious", "name": "Религиозные сооружения", "icon": "church", "color": "#f59e0b"},
    {"slug": "memorials", "name": "Мемориальные комплексы", "icon": "memorial", "color": "#ef4444"},
    {"slug": "museums", "name": "Музеи", "icon": "museum", "color": "#10b981"},
]

DISTRICTS = [
    {"slug": "minsk", "name": "Минск", "type": "city"},
    {"slug": "minsk-district", "name": "Минский район", "type": "district"},
    {"slug": "lahoysk-district", "name": "Логойский район", "type": "district"},
    {"slug": "nesvizh-district", "name": "Несвижский район", "type": "district"},
    {"slug": "karelichy-district", "name": "Кореличский район", "type": "district"},
    {"slug": "stowbtsy-district", "name": "Столбцовский район", "type": "district"},
]

ATTRACTIONS = [
    {
        "slug": "mir-castle",
        "name": "Мирский замок",
        "category_slug": "castles",
        "district_slug": "karelichy-district", # Исправлено
        "latitude": 53.8539,
        "longitude": 26.4719,
        "short_description": "Средневековый замок, объект Всемирного наследия ЮНЕСКО.",
        "full_description": (
            "Мирский замок — памятник оборонного зодчества XV–XVI веков, "
            "один из самых узнаваемых символов Беларуси."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Mir_Castle",
        "is_accessible": True,
    },
    {
        "slug": "nesvizh-castle",
        "name": "Несвижский замок",
        "category_slug": "castles",
        "district_slug": "nesvizh-district", # Исправлено
        "latitude": 53.7025,
        "longitude": 26.9836,
        "short_description": "Дворцово-замковый комплекс Радзивиллов.",
        "full_description": (
            "Несвижский замок — крупный дворцово-замковый комплекс, "
            "связанный с родом Радзивиллов и включённый в список ЮНЕСКО."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Nesvizh_Castle",
        "is_accessible": True,
    },
    {
        "slug": "nesvizh-body-of-god-church",
        "name": "Костёл Божьего Тела",
        "category_slug": "religious",
        "district_slug": "nesvizh-district", # Исправлено
        "latitude": 53.7036,
        "longitude": 26.9847,
        "short_description": "Костёл в Несвиже, памятник архитектуры XVI века.",
        "full_description": (
            "Костёл Божьего Тела — один из важнейших архитектурных объектов Несвижа, "
            "связанный с ансамблем замка Радзивиллов."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Church_of_the_Body_of_God,_Nesvizh",
        "is_accessible": True,
    },
    {
        "slug": "minsk-red-church",
        "name": "Костёл Святых Симеона и Елены",
        "category_slug": "religious",
        "district_slug": "minsk",
        "latitude": 53.9037,
        "longitude": 27.5658,
        "short_description": "Известный минский костёл, часто называют Красным костёлом.",
        "full_description": (
            "Костёл Святых Симеона и Елены — неофициально Красный костёл, "
            "одно из заметных религиозных сооружений Минска."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Church_of_St._Simon_and_Helena,_Minsk",
        "is_accessible": True,
    },
    {
        "slug": "minsk-holy-spirit-cathedral",
        "name": "Кафедральный собор Сошествия Святого Духа",
        "category_slug": "religious",
        "district_slug": "minsk",
        "latitude": 53.9009,
        "longitude": 27.5686,
        "short_description": "Православный кафедральный собор в Минске.",
        "full_description": (
            "Собор Сошествия Святого Духа — один из главных православных храмов Минска."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Cathedral_of_the_Holy_Spirit,_Minsk",
        "is_accessible": True,
    },
    {
        "slug": "minsk-mary-magdalene-church",
        "name": "Церковь равноапостольной Марии Магдалины",
        "category_slug": "religious",
        "district_slug": "minsk",
        "latitude": 53.9095,
        "longitude": 27.5435,
        "short_description": "Православная церковь в Минске.",
        "full_description": (
            "Церковь равноапостольной Марии Магдалины — православный храм, "
            "расположенный в Минске."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Church_of_Mary_Magdalene,_Minsk",
        "is_accessible": True,
    },
    {
        "slug": "khatyn-memorial",
        "name": "Мемориальный комплекс «Хатынь»",
        "category_slug": "memorials",
        "district_slug": "lahoysk-district", # Исправлено
        "latitude": 54.3681,
        "longitude": 28.0414,
        "short_description": "Мемориал, посвящённый жертвам сожжённой деревни Хатынь.",
        "full_description": (
            "«Хатынь» — мемориальный комплекс, созданный на месте трагедии "
            "военных лет и символизирующий память о сожжённых деревнях Беларуси."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Khatyn",
        "is_accessible": True,
    },
    {
        "slug": "kurgan-slavy",
        "name": "Курган Славы",
        "category_slug": "memorials",
        "district_slug": "minsk-district", # Исправлено: находится в Минском районе
        "latitude": 53.9064,
        "longitude": 27.8736,
        "short_description": "Мемориальный комплекс в честь освобождения Беларуси.",
        "full_description": (
            "Курган Славы — монументальный мемориал, посвящённый операции «Багратион» "
            "и освобождению Беларуси в годы Великой Отечественной войны."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Kurgan_Slavy",
        "is_accessible": True,
    },
    {
        "slug": "minsk-soviet-soldiers-cemetery",
        "name": "Мемориальное кладбище советских солдат",
        "category_slug": "memorials",
        "district_slug": "minsk",
        "latitude": 53.9135,
        "longitude": 27.5655,
        "short_description": "Мемориал в Минске, посвящённый советским воинам.",
        "full_description": (
            "Мемориальное кладбище советских солдат — место памяти и захоронений "
            "воинов, погибших в годы Великой Отечественной войны."
        ),
        "photo_url": None,
        "source_url": None,
        "is_accessible": True,
    },
    {
        "slug": "national-historical-museum",
        "name": "Национальный исторический музей Республики Беларусь",
        "category_slug": "museums",
        "district_slug": "minsk",
        "latitude": 53.9045,
        "longitude": 27.5665,
        "short_description": "Крупнейший исторический музей Минска.",
        "full_description": (
            "Национальный исторический музей Республики Беларусь хранит коллекции, "
            "отражающие историю белорусских земель от древности до нового времени."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/National_Historical_Museum_of_Belarus",
        "is_accessible": True,
    },
    {
        "slug": "wwii-museum",
        "name": "Белорусский государственный музей истории Великой Отечественной войны",
        "category_slug": "museums",
        "district_slug": "minsk",
        "latitude": 53.8995,
        "longitude": 27.5645,
        "short_description": "Главный музей военной истории в Минске.",
        "full_description": (
            "Музей истории Великой Отечественной войны посвящён событиям "
            "1941–1945 годов и вкладу Беларуси в Победу."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Belarusian_State_Museum_of_the_Great_Patriotic_War_History",
        "is_accessible": True,
    },
    {
        "slug": "folk-architecture-museum",
        "name": "Музей народной архитектуры и быта",
        "category_slug": "museums",
        "district_slug": "minsk-district", # Исправлено: музей находится в д. Озерцо, Минский район
        "latitude": 53.8333,
        "longitude": 27.3833,
        "short_description": "Музей под открытым небом в Озерцо (Строчицы).",
        "full_description": (
            "Музей народной архитектуры и быта представляет традиционные постройки "
            "и предметы крестьянского быта Беларуси. Расположен в Минском районе."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Museum_of_Folk_Architecture_and_Ethnography,_Belarus",
        "is_accessible": True,
    },
    {
        "slug": "modern-art-museum",
        "name": "Белорусский государственный музей современного искусства",
        "category_slug": "museums",
        "district_slug": "minsk",
        "latitude": 53.9025,
        "longitude": 27.5675,
        "short_description": "Музей современного искусства в Минске.",
        "full_description": (
            "Музей современного искусства представляет коллекции белорусского "
            "и зарубежного искусства XX–XXI веков."
        ),
        "photo_url": None,
        "source_url": "https://en.wikipedia.org/wiki/Belarusian_State_Museum_of_Modern_Art",
        "is_accessible": True,
    },
]


def seed():
    create_db_and_tables()

    with SessionLocal() as session:
        session.query(Attraction).delete()
        session.query(District).delete()
        session.query(Category).delete()
        session.commit()

        category_map = {}
        for item in CATEGORIES:
            obj = Category(**item)
            session.add(obj)
            session.flush()
            category_map[item["slug"]] = obj.id

        district_map = {}
        for item in DISTRICTS:
            obj = District(**item)
            session.add(obj)
            session.flush()
            district_map[item["slug"]] = obj.id

        for item in ATTRACTIONS:
            obj = Attraction(
                name=item["name"],
                slug=item["slug"],
                category_id=category_map[item["category_slug"]],
                district_id=district_map[item["district_slug"]],
                latitude=item["latitude"],
                longitude=item["longitude"],
                short_description=item["short_description"],
                full_description=item.get("full_description"),
                photo_url=item.get("photo_url"),
                source_url=item.get("source_url"),
                is_accessible=item.get("is_accessible", True),
                is_published=True,
            )
            session.add(obj)

        session.commit()

    print("Seed completed.")
    print(f"Categories: {len(CATEGORIES)}")
    print(f"Districts: {len(DISTRICTS)}")
    print(f"Attractions: {len(ATTRACTIONS)}")


if __name__ == "__main__":
    seed()
