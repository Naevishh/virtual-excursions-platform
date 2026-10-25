from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routers import attractions, categories, districts, route

create_db_and_tables()

app = FastAPI(
    title="Virtual Excursions Platform API",
    description="Backend для учебного проекта: виртуальные экскурсии по Минску и Минской области",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "Virtual Excursions Platform API",
        "status": "ok",
        "docs": "/docs",
    }


app.include_router(
    categories.router,
    prefix="/api/categories",
    tags=["categories"],
)
app.include_router(
    districts.router,
    prefix="/api/districts",
    tags=["districts"],
)
app.include_router(
    attractions.router,
    prefix="/api/attractions",
    tags=["attractions"],
)
app.include_router(
    route.router,
    prefix="/api",
    tags=["route"],
)
