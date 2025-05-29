# Nigerian Chess Rating System (NCR)

A modern web platform that manages chess tournaments, calculates Elo-based ratings, and tracks player performance for all 36 Nigerian states and the FCT.

## Table of Contents
1. Features
2. Tech Stack
3. Project Structure
4. Getting Started
   1. Prerequisites
   2. Clone & Install
   3. Local Development
   4. Docker Compose
5. Useful Scripts
6. Contribution Guidelines
7. Community & Support
8. License

---

## 1. Features
- Role-based portal for **Players**, **Tournament Organizers**, and **Rating Officers**  
- Swiss pairing engine with color balancing & bye handling  
- Elo rating engine with Nigeria-specific K-factors, rating floor, +100 bonus rule  
- Separate ratings for Classical, Rapid & Blitz  
- Title verification (GM, IM, WGM, NM, …) with badges  
- State / city filtering and regional leader-boards  
- Dashboards & analytics: rating graphs, rating distribution, tournament metrics  
- PDF / Excel tournament reports & automated email notifications  
- Built for offline-first with background sync (future roadmap)  

---

## 2. Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18 + TypeScript, Vite, Tailwind CSS, Redux Toolkit, Axios |
| Backend    | Node.js 18, Express 4, Prisma ORM, Zod, JWT, Helmet |
| Database   | PostgreSQL 14 |
| Dev & Ops  | Docker & Compose, GitHub Actions, Husky + lint-staged, Jest/Vitest |
| Infra (roadmap) | Terraform, AWS Fargate/ECS, CloudWatch/Grafana |

---

## 3. Project Structure

```
ncr-system/
 ├─ frontend/    # React app
 ├─ backend/     # Express API + Prisma schema
 ├─ infra/       # Docker, Terraform, deployment
 ├─ docs/        # Specs, architecture, roadmap
 ├─ .github/     # CI/CD workflows, issue templates
 └─ README.md
```

Detailed directories are documented in [`docs/project-structure.md`](docs/project-structure.md).

---

## 4. Getting Started

### 4.1 Prerequisites
- **Git 2+**
- **Node 18+** (bundled npm 9+)
- **PostgreSQL 14+**
- (Optional) **Docker 20+** & **Docker Compose v2**

Verify:
```bash
git --version
node -v
npm -v
psql --version
docker -v   # optional
```

### 4.2 Clone & Install
```bash
git clone https://github.com/your-org/ncr-system.git
cd ncr-system
npm install            # installs root dev tools (husky, lint-staged)
```

### 4.3 Local Development (manual)
1. **Backend**
   ```bash
   cd backend
   cp .env.example .env            # add DB creds + JWT_SECRET
   createdb ncr_dev                # create database
   npm install
   npm run prisma:migrate
   npm run dev                     # http://localhost:5000/api/v1
   ```
2. **Frontend**
   ```bash
   cd ../frontend
   cp .env.example .env            # VITE_API_BASE_URL=http://localhost:5000/api/v1
   npm install
   npm run dev                     # http://localhost:5173
   ```

### 4.4 Docker Compose (one-liner)
```bash
docker compose up --build
# Frontend -> http://localhost:5173
# Backend  -> http://localhost:5000/api/v1
# PG Admin (optional) -> http://localhost:8080
```

---

## 5. Useful Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `/backend` | `npm run dev` | Start API with nodemon + ts-node |
|           | `npm run prisma:migrate` | Apply migrations & generate client |
|           | `npm test` | Jest + Supertest unit/integration tests |
| `/frontend` | `npm run dev` | Start Vite dev server with HMR |
|             | `npm test` | Vitest + React Testing Library |
| repo root | `npm run lint` | Run ESLint on all packages |
|           | `npm run format` | Prettier formatting |

---

## 6. Contribution Guidelines

We 💚 contributions!

1. **Fork** the repo & create your feature branch  
   ```bash
   git checkout -b feat/awesome-feature
   ```
2. **Commit** with [Conventional Commits](https://www.conventionalcommits.org).  
   `feat(auth): add login with OTP`
3. **Push** and open a **Pull Request** against `main`.  
   The CI pipeline will lint, test, and build your changes.
4. At least **1 approving review** is required before merge.

Coding style is enforced via **ESLint + Prettier**. Pre-commit hooks run automatically with Husky.

Need an issue? Search existing tickets or create one using the provided template.

---

## 7. Community & Support
- 💬 **Discussions**: GitHub Discussions tab  
- 🐞 **Bugs / Feature requests**: GitHub Issues  
- 📧 **Email**: ncf-support@chess.ng

We’re piloting with local chess federations. Feedback from players and organizers is highly valued!

---

## 8. License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full text.
