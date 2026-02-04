FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# standalone จะมี server.js + node_modules ที่จำเป็นอยู่ในนั้น
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

# # ===== 3) runner: ตัวรันจริง (เล็ก/สะอาด) =====
# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production

# # copy เฉพาะที่จำเป็นต่อการรัน
# COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/node_modules ./node_modules

# EXPOSE 3000
# CMD ["npm", "start"]