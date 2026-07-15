# 🌊 DonorFlow Backend API

[![NestJS](https://img.shields.io/badge/NestJS-v10.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**DonorFlow** is a secure, multi-tenant SaaS backend platform designed to empower NGOs and non-profit organizations in Pakistan with modern donor relationship management (CRM) and fundraising campaign tools.

---

## 🚀 Key Features

- 🔐 **Enterprise-Grade Security**: JWT authentication via HttpOnly cookies, bcrypt password hashing, and strict rate limiting.
- 👥 **Role-Based Access Control (RBAC)**: Granular permissions for Super Admin, Organization Admin, Staff, and Public Donors.
- 🏢 **Strict Multi-Tenancy**: Automatic data isolation ensuring organizations can only access their own campaigns, donors, and donations.
- 📢 **Campaign Management**: Full CRUD operations, auto-generated public donation URLs, and dynamic QR code generation.
- 🤝 **Donor Mini-CRM**: Advanced search, pagination, soft-deletion, and bulk CSV import/export capabilities.
- 📊 **Real-time Metrics**: Aggregated dashboard stats and downloadable financial reports.
- 📖 **Auto-Generated API Docs**: Comprehensive Swagger/OpenAPI documentation for seamless frontend integration.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [NestJS](https://nestjs.com/) (Node.js) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Authentication** | Passport.js, JWT, `cookie-parser` |
| **Validation** | `class-validator`, `class-transformer` |
| **Documentation** | `@nestjs/swagger` |
| **Utilities** | `qrcode`, `csv-parser`, `@nestjs/throttler` |

---

## 📂 Project Structure

```text
src/
├── auth/               # Authentication, JWT strategies, and guards
├── campaigns/          # Campaign CRUD, QR codes, and public routes
├── common/             # Shared decorators (@Roles, @Public, @CurrentUser) and guards
├── donors/             # Donor CRM, search, CSV import/export
├── organizations/      # Multi-tenant organization profile management
├── prisma/             # Prisma service and database connection logic
├── users/              # User management and seeding
├── app.module.ts       # Root application module
└── main.ts             # Application entry point, global pipes, and Swagger setup
