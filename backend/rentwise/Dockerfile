FROM python:3.12-slim

WORKDIR /usr/src/rentwise

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y netcat-openbsd

COPY requirements.txt .
RUN pip install --default-timeout=100 --retries=5 -r requirements.txt

COPY ./entrypoint.sh .
RUN sed -i 's/\r$//g' /usr/src/rentwise/entrypoint.sh
RUN chmod +x /usr/src/rentwise/entrypoint.sh

COPY . .

ENTRYPOINT ["/usr/src/rentwise/entrypoint.sh"]