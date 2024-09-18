FROM node AS stage-one

# Install DEB dependencies and others.
RUN echo 'deb [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian stretch main contrib non-free' > /etc/apt/sources.list \
    && echo 'deb [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian stretch-proposed-updates main non-free contrib' >> /etc/apt/sources.list \
    && echo 'deb [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian stretch-backports main non-free contrib' >> /etc/apt/sources.list \
    && echo 'deb [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian-security stretch/updates main contrib non-free' >> /etc/apt/sources.list \
    && echo 'deb-src [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian stretch main contrib non-free' >> /etc/apt/sources.list \
    && echo 'deb-src [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian stretch-proposed-updates main contrib non-free' >> /etc/apt/sources.list \
	&& echo 'deb-src [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian stretch-backports main contrib non-free' >> /etc/apt/sources.list \
	&& echo 'deb-src [arch=amd64] http://mirrors.aliyun.com/debian-archive/debian-security stretch/updates main contrib non-free' >> /etc/apt/sources.list

RUN \
	set -x \
	&& apt-get update -y \
	&& apt-get install -y net-tools build-essential valgrind python3-pip
RUN mkdir -p /server/projects/media-server
RUN mkdir -p /server/projects/nestjs-axios
RUN mkdir -p /server/projects/nestjs-redis
WORKDIR /server
ADD commitlint.config.js ./server
ADD lerna.json ./
ADD package.json ./
ADD pnpm-lock.yaml ./
ADD pnpm-workspace.yaml ./
ADD projects/media-server/package.json ./projects/media-server
ADD projects/media-server/tsconfig.json ./projects/media-server
ADD projects/media-server/tsconfig.build.json ./projects/media-server
ADD projects/media-server/nest-cli.json ./projects/media-server
ADD projects/media-server/.npmrc ./projects/media-server/.npmrc
COPY projects/media-server/src ./projects/media-server/src
COPY projects/nestjs-axios ./projects/nestjs-axios
COPY projects/nestjs-redis ./projects/nestjs-redis
RUN npm install -g pnpm pm2
ENV http_proxy=10.2.110.140:26001
ENV https_proxy=10.2.110.140:26001
RUN cd projects/media-server && pnpm i && pnpm run build

