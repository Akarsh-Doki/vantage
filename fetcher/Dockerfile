# Stage 1: compile a fully static binary.
FROM golang:1.26 AS build
WORKDIR /src
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /fetcher .

# Stage 2: distroless — no shell, no libc, minimal attack surface for the
# one service that touches user-supplied URLs.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /fetcher /fetcher
ENV PORT=8080
EXPOSE 8080
# distroless has no curl; the binary probes its own /health endpoint.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD ["/fetcher", "healthcheck"]
ENTRYPOINT ["/fetcher"]
