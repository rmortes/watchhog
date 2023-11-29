# Use the official Deno Docker image as the base image
FROM denoland/deno:alpine AS install

ADD main.ts .

RUN ["deno", "compile", "--output", "watchhog", "--allow-all", "main.ts"]

FROM python:3.11-slim

# RUN apt-get update
# RUN apt-get install -y wget unzip
# RUN apt-get install -y libc6-amd64-cross

# RUN ln -s /usr/x86_64-linux-gnu/lib64/ /lib64

# ENV LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/lib64:/usr/x86_64-linux-gnu/lib"

COPY --from=install watchhog watchhog
COPY engines engines

ENTRYPOINT "./watchhog"