# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "run", "start"]
