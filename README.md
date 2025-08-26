# 🎶 SpotiApp: Stack Tecnológico y Guía de Ejecución Local 🎧

Este repositorio contiene **SpotiApp**, un proyecto full-stack desarrollado para mi portfolio. A continuación, detallo las tecnologías utilizadas y los pasos para ejecutar la aplicación en tu entorno local.

---

## 🚀 Stack Tecnológico

### 💻 Frontend (SpotiApp-Client)

* **Next.js**
* **TypeScript** 
* **Tailwind CSS** 
* **Sonner** 
* **`@radix-ui` / `shadcn/ui`:**

### 🐍 Backend (SpotiApp-API)

* **FastAPI** 
* **PostgreSQL**

---

## 🛠️ Cómo Ejecutar SpotiApp Localmente

Sigue estos pasos para poner en marcha SpotiApp en tu máquina.

### Requisitos Previos

Asegúrate de tener instalado lo siguiente:

* **Node.js** (versión 18 o superior) y un gestor de paquetes (npm, pnpm o yarn).
* **Python** (versión 3.10 o superior) con `pip` y `venv`.
* **PostgreSQL** (instalado y corriendo, o acceso a una instancia).
* **Git**.

### 1. Configuración del Backend (FastAPI)

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/agushdev/spoti.git](https://github.com/agushdev/spoti.git)
    cd spoti/back
    ```
2.  **Crea y activa un entorno virtual:**
    ```bash
    python -m venv .venv
    # Para macOS/Linux:
    source .venv/bin/activate
    # Para Windows:
    .venv\Scripts\activate
    ```
3.  **Instala las dependencias de Python:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configura la Base de Datos PostgreSQL:**
    * Crea una nueva base de datos (ej. `spoti_db_local`).
    * Crea un archivo `.env` en la carpeta `spoti/back` con tu URL de conexión a la base de datos (¡reemplaza `user`, `password`, `host`, `port` según corresponda!):
        ```env
        DATABASE_URL="postgresql+asyncpg://user:password@host:port/spoti_db_local"
        ```
5.  **Aplica las migraciones de la base de datos (o se crearán automáticamente):**
    * Si usas Alembic: `alembic upgrade head`
    * De lo contrario, FastAPI creará las tablas al iniciar si la base de datos está vacía.
6.  **Inicia el servidor de FastAPI:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    El backend estará disponible en `http://localhost:8000`.

---

### 2. Configuración del Frontend (Next.js)

1.  **Navega a la carpeta del frontend:**
    ```bash
    cd ../front
    ```
2.  **Instala las dependencias de Node.js:**
    ```bash
    pnpm install # O usa npm install / yarn install
    ```
3.  **Configura la variable de entorno para el API:**
    * Crea un archivo `.env.local` en la carpeta `spoti/front` y apunta al backend local:
        ```env
        NEXT_PUBLIC_API_BASE="http://localhost:8000"
        ```
4.  **Inicia el servidor de desarrollo de Next.js:**
    ```bash
    pnpm dev # O usa npm run dev / yarn dev
    ```
    El frontend estará disponible en `http://localhost:3000`.

---

### ▶️ Uso de la Aplicación (Localmente)

1.  Abre tu navegador y visita `http://localhost:3000`.
2.  Podrás interactuar con la aplicación. Recuerda que para añadir canciones o carátulas, necesitarás pegar **URLs públicas** de archivos de audio (ej. de Internet Archive) e imágenes (ej. de Cloudinary o Imgur), ya que la aplicación no gestiona el almacenamiento directo de archivos.
