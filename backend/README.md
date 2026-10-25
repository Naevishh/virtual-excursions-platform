# Virtual Excursions Platform Backend

Backend учебного проекта для виртуальных экскурсий по Минску и Минской области.

## Stack
- Python
- FastAPI
- PostgreSQL
- PostGIS
- SQLAlchemy
- OSRM demo API для маршрутов

## Запуск

1. Поднять базу:
```bash
docker compose up -d
```

2. Создать виртуальное окружение:
```bash
python -m venv .venv
```

Активация в Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

Активация в Windows CMD:
```cmd
.\.venv\Scripts\activate.bat
```

3. Установить зависимости:
```bash
pip install -r requirements.txt
```

4. Создать `.env` из `.env.example` (уже создан автоматически).

5. Наполнить базу:
```bash
python -m app.seed
```

6. Запустить API:
```bash
uvicorn app.main:app --reload
```

7. Открыть Swagger:
```
http://127.0.0.1:8000/docs
```
