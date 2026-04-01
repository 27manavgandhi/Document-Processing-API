# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies for build
RUN npm ci

COPY src ./src

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]