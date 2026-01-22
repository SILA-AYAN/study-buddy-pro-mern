## Docker (Development)

### Requirements
- Docker Desktop (Windows)

### Run the project with Docker
Open a terminal in the project root directory (where backend and frontend folders are located) and run:

docker compose up --build

### URLs
- Frontend: http://localhost:5173  
- Backend: http://localhost:5000  

### Stop containers
Press Ctrl + C in the running terminal, then execute:

docker compose down

### Reset database (WARNING: this will delete all data)
docker compose down -v

## Environment Variables (.env)

The project includes a `.env.example` file.  
Create a `.env` file by copying it:

Windows manual method:
1. Copy the `.env.example` file  
2. Paste it in the same directory  
3. Rename the copied file to `.env`
## Docker (Production)

Run the production environment with Nginx:

docker compose -f docker-compose.prod.yml up --build

### URLs
- Frontend (Nginx): http://localhost  
- Backend API: http://localhost:5000  

### Stop
docker compose -f docker-compose.prod.yml down

