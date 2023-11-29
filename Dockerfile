FROM --platform=linux/amd64 alpine/git:latest as download

# Download and include dependencies
ADD .git .git
RUN ["git", "submodule", "update", "--init", "--remote", "--recursive"]

RUN "pwd"
RUN ["mkdir", "engines"]
RUN ["cp", "-R", "include/qBittorrent/src/searchengine/nova3/.", "engines"]
RUN ["cp", "-R", "include/search-plugins/nova3/engines/.", "engines"]

ADD engines engines

FROM --platform=linux/amd64 denoland/deno:alpine AS install

# Compile API binary so that we can run it without Deno installed
ADD main.ts .
RUN ["deno", "compile", "--output", "watchhog", "--allow-all", "main.ts"]

FROM --platform=linux/amd64 python:3.11-slim
WORKDIR /run/watchhog

COPY --from=install watchhog watchhog
COPY --from=download /git/engines engines

EXPOSE 8080
ENTRYPOINT "./watchhog"