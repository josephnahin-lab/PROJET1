FROM node:22-alpine

ARG DOCKER_UID=1000
ARG DOCKER_GID=1000

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN chown -R "${DOCKER_UID}:${DOCKER_GID}" /app

ENV HOME=/tmp
USER ${DOCKER_UID}:${DOCKER_GID}

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
