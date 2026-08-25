import swaggerJsDoc from 'swagger-jsdoc';
import { env } from '../config/env.js';

const swaggerOptions: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TeamSpace API (Notion + Trello + Slack Mini SaaS)',
      version: '1.0.0',
      description:
        'Comprehensive REST API featuring JWT + Refresh Token Auth, Multi-tenancy RBAC, Nested Page Trees, Notion Blocks with Transactions, Trello Boards & Cards with Atomic Move Transactions + Audit Logs, Slack Channel Chat with Cursor Pagination, Polymorphic Comments, Redis Caching, File Uploads, and BullMQ Background Workers.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token (obtained from /api/auth/login or /api/auth/register)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            avatarUrl: { type: 'string' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            icon: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'] },
          },
        },
        Page: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            workspaceId: { type: 'string' },
            title: { type: 'string' },
            icon: { type: 'string' },
            type: { type: 'string', enum: ['doc', 'board', 'channel'] },
            parentId: { type: 'string', nullable: true },
            position: { type: 'number' },
          },
        },
        Block: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            pageId: { type: 'string' },
            type: {
              type: 'string',
              enum: ['text', 'heading1', 'heading2', 'heading3', 'todo', 'bullet', 'code', 'callout', 'image'],
            },
            content: { type: 'object' },
            position: { type: 'number' },
          },
        },
        Card: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            listId: { type: 'string' },
            pageId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            position: { type: 'number' },
            assigneeIds: { type: 'array', items: { type: 'string' } },
            dueDate: { type: 'string', format: 'date-time' },
            labels: { type: 'array', items: { type: 'string' } },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            pageId: { type: 'string' },
            userId: { type: 'string' },
            content: { type: 'string' },
            attachments: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            targetType: { type: 'string', enum: ['page', 'block', 'card'] },
            targetId: { type: 'string' },
            userId: { type: 'string' },
            content: { type: 'string' },
            parentId: { type: 'string', nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsDoc(swaggerOptions);
