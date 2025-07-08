# frontend/Dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./

RUN npm install

# 開発用のため、buildは行わない
# RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "dev"]
