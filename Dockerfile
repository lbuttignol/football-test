FROM node:latest
WORKDIR /app
CMD ls -ltr && npm install && npm start