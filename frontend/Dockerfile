# Authix landing page (Create React App via CRACO)
# Build args:
#   REACT_APP_BACKEND_URL  - public URL of the backend service
#                            Set this as a Build Variable in Railway.

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# CRA bakes env vars at build time, so accept them as ARGs.
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
RUN yarn global add serve@14

COPY --from=builder /app/build ./build

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
