FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for stable-baselines3 and compiling certain python packages
RUN apt-get update && apt-get install -y build-essential libopenmpi-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and the trained model
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
