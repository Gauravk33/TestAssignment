# TeamSpace Documentation

TeamSpace is a modern mini-SaaS platform combining Notion-style dynamic documents, Trello-style kanban boards, and Slack-style real-time channels with granular Role-Based Access Control (RBAC).

## Architecture Overview
- **Backend (`/api`)**: Node.js, Express, TypeScript, Mongoose, Redis, Socket.io, BullMQ
- **Frontend (`/client`)**: React 18, Vite, TypeScript, Zustand, React Router, React Hook Form, Lucide Icons
- **Database**: MongoDB (via Mongoose ODM) with replica-set/transaction support
- **Cache & Message Broker**: Redis 7
- **Deployment**: Docker Compose
