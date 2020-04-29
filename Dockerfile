FROM node:13
WORKDIR /app
CMD ls -ltr && npm install && npm start