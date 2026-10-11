FROM mcr.microsoft.com/devcontainers/javascript-node:22

USER root

RUN sed -i 's/^Components: main$/Components: main non-free/' \
        /etc/apt/sources.list.d/debian.sources \
    && apt-get \
        -o Acquire::Retries=3 \
        -o Acquire::http::Timeout=30 \
        -o Acquire::https::Timeout=30 \
        update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
        --no-install-recommends \
        python3.13-venv \
        unrar \
    && rm -rf /var/lib/apt/lists/*