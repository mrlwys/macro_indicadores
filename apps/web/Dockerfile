FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "-w", "@macro/web", "--", "--host", "0.0.0.0", "--port", "5173"]
