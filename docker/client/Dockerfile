FROM node:20-alpine

WORKDIR /app

# Install deps (leveraging layer cache)
COPY client/package.json client/package-lock.json ./
RUN npm install

# Copy client source
COPY client/ .

EXPOSE 5173

CMD ["npm", "run", "dev"]
