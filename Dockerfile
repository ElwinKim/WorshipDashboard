FROM node:12
COPY server.js package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD [ "npm", "start" ]