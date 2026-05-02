# Authix backend (FastAPI + Discord bot)
# Used by TWO Railway services:
#   1. authix-backend  -> default CMD (uvicorn server:app)
#   2. authix-bot      -> Start Command override: "python bot.py"
FROM python:3.11-slim

# System deps needed for Pillow / captcha image rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libjpeg-dev \
        zlib1g-dev \
        libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .



# Default = backend service. Bot service overrides this in Railway settings.
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port $PORT"]
