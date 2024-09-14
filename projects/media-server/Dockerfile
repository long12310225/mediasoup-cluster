FROM node:10 AS stage-one

# Install DEB dependencies and others.
RUN \
	set -x \
	&& apt-get update \
	&& apt-get install -y net-tools build-essential valgrind

WORKDIR /service

COPY package.json .
COPY server.js .
COPY config.js .
COPY src ./src
COPY sh/run ./sh/run
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run build