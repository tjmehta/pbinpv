FROM node:0.10.38

# APP
WORKDIR /pbinpv
ADD ./package.json /pbinpv/package.json
RUN npm install
ADD . /pbinpv
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000
CMD npm start