FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./

RUN useradd -r -s /bin/false appuser && chown -R appuser:appuser /app
USER appuser

CMD ["python", "main.py"]
