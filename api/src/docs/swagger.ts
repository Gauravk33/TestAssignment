import { env } from '../config/env.js';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'TeamSpace API — Mini SaaS (Notion + Trello + Slack)',
    version: '1.0.0',
    description:
      'Interactive REST API playground for TeamSpace. Includes JWT & Refresh Token Auth, RBAC, Nested Page Trees, Notion Blocks with Transactions, Trello Cards with Atomic Move Transactions & Audit Logs, Slack Channel Chat with Cursor Pagination, Polymorphic Comments, Redis Caching, File Uploads, and BullMQ Background Jobs.',
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
        description: 'Enter your JWT accessToken (obtained from /api/auth/login or /api/auth/register)',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6a8d9240347ba6d6911ea071' },
          name: { type: 'string', example: 'Alex Morgan' },
          email: { type: 'string', example: 'alex@teamspace.dev' },
          avatarUrl: { type: 'string', example: '' },
        },
      },
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6a8d9240347ba6d6911ea073' },
          name: { type: 'string', example: 'Engineering Core' },
          slug: { type: 'string', example: 'engineering-core-9x4a1' },
          icon: { type: 'string', example: '🚀' },
          role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'], example: 'owner' },
        },
      },
      Page: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6a8d9240347ba6d6911ea077' },
          workspaceId: { type: 'string', example: '6a8d9240347ba6d6911ea073' },
          title: { type: 'string', example: 'Sprint Kanban Board' },
          icon: { type: 'string', example: '📋' },
          type: { type: 'string', enum: ['doc', 'board', 'channel'], example: 'board' },
          parentId: { type: 'string', nullable: true, example: null },
          position: { type: 'number', example: 0 },
        },
      },
      Block: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6a8d9240347ba6d6911ea080' },
          pageId: { type: 'string', example: '6a8d9240347ba6d6911ea077' },
          type: {
            type: 'string',
            enum: ['text', 'heading1', 'heading2', 'heading3', 'todo', 'bullet', 'code', 'callout', 'image'],
            example: 'heading1',
          },
          content: { type: 'object', example: { text: 'Product Roadmap Overview' } },
          position: { type: 'number', example: 0 },
        },
      },
      Card: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6a8d9240347ba6d6911ea085' },
          listId: { type: 'string', example: '6a8d9240347ba6d6911ea082' },
          pageId: { type: 'string', example: '6a8d9240347ba6d6911ea077' },
          title: { type: 'string', example: 'Implement Redis Caching' },
          description: { type: 'string', example: 'Cache page trees and individual pages' },
          position: { type: 'number', example: 0 },
          labels: { type: 'array', items: { type: 'string' }, example: ['Backend', 'Performance'] },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6a8d9240347ba6d6911ea090' },
          pageId: { type: 'string', example: '6a8d9240347ba6d6911ea078' },
          userId: { type: 'string', example: '6a8d9240347ba6d6911ea071' },
          content: { type: 'string', example: 'Hey team, new sprint board is ready!' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6a8d9240347ba6d6911ea095' },
          targetType: { type: 'string', enum: ['page', 'block', 'card'], example: 'card' },
          targetId: { type: 'string', example: '6a8d9240347ba6d6911ea085' },
          content: { type: 'string', example: 'Ready for code review.' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // --- 1. HEALTH & ROOT ---
    '/health': {
      get: {
        tags: ['System & Health'],
        summary: 'System health check (MongoDB Atlas + Redis + Uptime)',
        responses: {
          200: { description: 'Services healthy' },
          533: { description: 'Services degraded' },
        },
      },
    },

    // --- 2. AUTHENTICATION ---
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user and generate default workspace',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Gaurav Developer' },
                  email: { type: 'string', example: 'gaurav@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                  workspaceName: { type: 'string', example: 'Gaurav Space' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registered successfully + JWT returned' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in to obtain JWT access token + refresh token cookie',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'gaurav@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Silent token refresh via httpOnly cookie or request body',
        security: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', description: 'Optional if sent via cookie' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Token refreshed' },
          401: { description: 'Invalid or revoked token' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile and workspace memberships',
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out and clear refresh token cookie',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },

    // --- 3. WORKSPACES & MEMBERS ---
    '/api/workspaces': {
      get: {
        tags: ['Workspaces & Members'],
        summary: 'List workspaces for current authenticated user',
        responses: { 200: { description: 'Workspaces list' } },
      },
      post: {
        tags: ['Workspaces & Members'],
        summary: 'Create a new workspace',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Acme Product Team' },
                  icon: { type: 'string', example: '⚡' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Workspace created' } },
      },
    },
    '/api/workspaces/{id}': {
      get: {
        tags: ['Workspaces & Members'],
        summary: 'Get workspace details and member list',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Workspace retrieved' } },
      },
      patch: {
        tags: ['Workspaces & Members'],
        summary: 'Update workspace name or icon (Admin/Owner only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Acme Engineering' },
                  icon: { type: 'string', example: '🔥' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Workspace updated' } },
      },
      delete: {
        tags: ['Workspaces & Members'],
        summary: 'Delete workspace (Owner only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Workspace deleted' } },
      },
    },
    '/api/workspaces/{id}/invite': {
      post: {
        tags: ['Workspaces & Members'],
        summary: 'Invite registered user to workspace (Admin/Owner only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'role'],
                properties: {
                  email: { type: 'string', example: 'colleague@teamspace.dev' },
                  role: { type: 'string', enum: ['admin', 'editor', 'viewer'], example: 'editor' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User invited' } },
      },
    },
    '/api/workspaces/{id}/members/{userId}': {
      patch: {
        tags: ['Workspaces & Members'],
        summary: 'Change member role in workspace (Admin/Owner only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'], example: 'admin' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Role updated' } },
      },
    },
    '/api/workspaces/{workspaceId}/test-role': {
      get: {
        tags: ['Workspaces & Members'],
        summary: 'Verify RBAC middleware requireRole([owner, admin])',
        parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'RBAC verification passed' },
          403: { description: 'Insufficient permissions' },
        },
      },
    },

    // --- 4. PAGES ---
    '/api/pages': {
      post: {
        tags: ['Pages (Doc / Board / Channel)'],
        summary: 'Create a new Page (doc, board, or channel)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workspaceId', 'title', 'type'],
                properties: {
                  workspaceId: { type: 'string', example: '6a8d9240347ba6d6911ea073' },
                  title: { type: 'string', example: 'Product Kanban Board' },
                  type: { type: 'string', enum: ['doc', 'board', 'channel'], example: 'board' },
                  icon: { type: 'string', example: '📋' },
                  parentId: { type: 'string', nullable: true, example: null },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Page created' } },
      },
    },
    '/api/pages/tree': {
      get: {
        tags: ['Pages (Doc / Board / Channel)'],
        summary: 'Get recursive nested page hierarchy tree (Cached in Redis)',
        parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Page tree hierarchy' } },
      },
    },
    '/api/pages/{id}': {
      get: {
        tags: ['Pages (Doc / Board / Channel)'],
        summary: 'Get page by ID (Cached in Redis)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Page retrieved' } },
      },
      patch: {
        tags: ['Pages (Doc / Board / Channel)'],
        summary: 'Update page title, icon, or archive status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Updated Page Title' },
                  icon: { type: 'string', example: '🚀' },
                  isArchived: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Page updated' } },
      },
      delete: {
        tags: ['Pages (Doc / Board / Channel)'],
        summary: 'Delete page and cascade sub-pages/blocks/cards/messages',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Page deleted' } },
      },
    },
    '/api/pages/{id}/move': {
      patch: {
        tags: ['Pages (Doc / Board / Channel)'],
        summary: 'Move page to a new parent or change position in hierarchy',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['position'],
                properties: {
                  parentId: { type: 'string', nullable: true, example: null },
                  position: { type: 'number', example: 1 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Page moved' } },
      },
    },

    // --- 5. NOTION BLOCKS ---
    '/api/blocks': {
      get: {
        tags: ['Notion Blocks'],
        summary: 'List blocks for a doc page',
        parameters: [{ name: 'pageId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Blocks list' } },
      },
      post: {
        tags: ['Notion Blocks'],
        summary: 'Create rich block on a page',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pageId', 'type', 'content'],
                properties: {
                  pageId: { type: 'string', example: '6a8d9240347ba6d6911ea077' },
                  type: {
                    type: 'string',
                    enum: ['text', 'heading1', 'heading2', 'heading3', 'todo', 'bullet', 'code', 'callout', 'image'],
                    example: 'heading1',
                  },
                  content: { type: 'object', example: { text: 'System Architecture' } },
                  position: { type: 'number', example: 0 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Block created' } },
      },
    },
    '/api/blocks/reorder': {
      patch: {
        tags: ['Notion Blocks'],
        summary: 'Reorder blocks atomically inside a MongoDB Transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pageId', 'items'],
                properties: {
                  pageId: { type: 'string', example: '6a8d9240347ba6d6911ea077' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'position'],
                      properties: {
                        id: { type: 'string', example: '6a8d9240347ba6d6911ea080' },
                        position: { type: 'number', example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Blocks reordered atomically' } },
      },
    },
    '/api/blocks/{id}': {
      get: {
        tags: ['Notion Blocks'],
        summary: 'Get single block',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Block retrieved' } },
      },
      patch: {
        tags: ['Notion Blocks'],
        summary: 'Update block content and type (emits block:updated over Socket.io)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'object', example: { text: 'Updated block text', checked: true } },
                  type: { type: 'string', example: 'todo' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Block updated' } },
      },
      delete: {
        tags: ['Notion Blocks'],
        summary: 'Delete block',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Block deleted' } },
      },
    },

    // --- 6. TRELLO LISTS & CARDS ---
    '/api/lists': {
      get: {
        tags: ['Trello Lists & Cards'],
        summary: 'Get board lists for a board page',
        parameters: [{ name: 'pageId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lists retrieved' } },
      },
      post: {
        tags: ['Trello Lists & Cards'],
        summary: 'Create a list on a board page',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pageId', 'title'],
                properties: {
                  pageId: { type: 'string', example: '6a8d9240347ba6d6911ea077' },
                  title: { type: 'string', example: 'In Review' },
                  position: { type: 'number', example: 3 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'List created' } },
      },
    },
    '/api/lists/{id}': {
      patch: {
        tags: ['Trello Lists & Cards'],
        summary: 'Update list title or position',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Done & Verified' },
                  position: { type: 'number', example: 2 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'List updated' } },
      },
      delete: {
        tags: ['Trello Lists & Cards'],
        summary: 'Delete list and its cards',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'List deleted' } },
      },
    },
    '/api/cards': {
      get: {
        tags: ['Trello Lists & Cards'],
        summary: 'Get cards for a board page',
        parameters: [{ name: 'pageId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Cards retrieved' } },
      },
      post: {
        tags: ['Trello Lists & Cards'],
        summary: 'Create card inside a list',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pageId', 'listId', 'title'],
                properties: {
                  pageId: { type: 'string', example: '6a8d9240347ba6d6911ea077' },
                  listId: { type: 'string', example: '6a8d9240347ba6d6911ea082' },
                  title: { type: 'string', example: 'Build Socket.io broadcasting' },
                  description: { type: 'string', example: 'Real-time card sync between tabs' },
                  labels: { type: 'array', items: { type: 'string' }, example: ['Backend', 'Sockets'] },
                  position: { type: 'number', example: 0 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Card created' } },
      },
    },
    '/api/cards/{id}': {
      get: {
        tags: ['Trello Lists & Cards'],
        summary: 'Get card details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Card retrieved' } },
      },
      patch: {
        tags: ['Trello Lists & Cards'],
        summary: 'Update card title, description, assignees, labels, or due date',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Updated card title' },
                  description: { type: 'string', example: 'Updated card description' },
                  labels: { type: 'array', items: { type: 'string' }, example: ['DevOps'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Card updated' } },
      },
      delete: {
        tags: ['Trello Lists & Cards'],
        summary: 'Delete card',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Card deleted' } },
      },
    },
    '/api/cards/{id}/move': {
      patch: {
        tags: ['Trello Lists & Cards'],
        summary: 'Atomic Card Move Transaction (Updates listId + position, writes AuditLog, emits card:moved)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetListId', 'targetPosition'],
                properties: {
                  targetListId: { type: 'string', example: '6a8d9240347ba6d6911ea083' },
                  targetPosition: { type: 'number', example: 0 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Card moved atomically & AuditLog created' } },
      },
    },

    // --- 7. SLACK MESSAGES ---
    '/api/pages/{id}/messages': {
      get: {
        tags: ['Slack Channel Chat'],
        summary: 'Get channel messages with cursor pagination for infinite scroll',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'cursor', in: 'query', schema: { type: 'string' }, description: 'ISO date of oldest message' },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 30 } },
        ],
        responses: { 200: { description: 'Messages list with nextCursor' } },
      },
      post: {
        tags: ['Slack Channel Chat'],
        summary: 'Send channel message (emits channel:message live over WebSockets)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Hello team! The new sprint board is ready.' },
                  attachments: { type: 'array', items: { type: 'string' }, example: [] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Message sent' } },
      },
    },

    // --- 8. POLYMORPHIC COMMENTS ---
    '/api/comments': {
      get: {
        tags: ['Polymorphic Comments'],
        summary: 'Get comments attached to a page, card, or block',
        parameters: [
          { name: 'targetId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'targetType', in: 'query', schema: { type: 'string', enum: ['page', 'block', 'card'] } },
        ],
        responses: { 200: { description: 'Comments list' } },
      },
      post: {
        tags: ['Polymorphic Comments'],
        summary: 'Add comment on any entity (supports nested reply threading)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetType', 'targetId', 'workspaceId', 'content'],
                properties: {
                  targetType: { type: 'string', enum: ['page', 'block', 'card'], example: 'card' },
                  targetId: { type: 'string', example: '6a8d9240347ba6d6911ea085' },
                  workspaceId: { type: 'string', example: '6a8d9240347ba6d6911ea073' },
                  content: { type: 'string', example: 'Reviewing this card implementation.' },
                  parentId: { type: 'string', nullable: true, example: null },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Comment created' } },
      },
    },
    '/api/comments/{id}': {
      patch: {
        tags: ['Polymorphic Comments'],
        summary: 'Edit comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Updated comment content' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Comment updated' } },
      },
      delete: {
        tags: ['Polymorphic Comments'],
        summary: 'Delete comment and nested replies',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Comment deleted' } },
      },
    },

    // --- 9. AUDIT LOGS ---
    '/api/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get paginated audit logs for a workspace',
        parameters: [
          { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
        ],
        responses: { 200: { description: 'Audit logs with pagination metadata' } },
      },
    },

    // --- 10. UNIFIED SEARCH ---
    '/api/search': {
      get: {
        tags: ['Search'],
        summary: 'Unified text search across Pages, Blocks, Cards, and Messages',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', example: 'Kubernetes' } },
          { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Search results grouped by entity' } },
      },
    },

    // --- 11. WORKSPACE ANALYTICS ($facet) ---
    '/api/workspaces/{id}/stats': {
      get: {
        tags: ['Analytics & Aggregations'],
        summary: 'MongoDB $facet aggregation (Cards per list, messages per day, blocks by type, members by role)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Faceted analytics retrieved' } },
      },
    },

    // --- 12. FILE ATTACHMENTS ---
    '/api/attachments': {
      post: {
        tags: ['File Attachments'],
        summary: 'Upload file attachment (Multer storage)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'workspaceId'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  workspaceId: { type: 'string', example: '6a8d9240347ba6d6911ea073' },
                  targetType: { type: 'string', example: 'card' },
                  targetId: { type: 'string', example: '6a8d9240347ba6d6911ea085' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'File uploaded' } },
      },
    },
    '/api/attachments/{id}': {
      get: {
        tags: ['File Attachments'],
        summary: 'Get attachment metadata',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Attachment metadata' } },
      },
      delete: {
        tags: ['File Attachments'],
        summary: 'Delete attachment and file from disk',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Attachment deleted' } },
      },
    },

    // --- 13. BULLMQ JOBS ---
    '/api/jobs/weekly-digest': {
      post: {
        tags: ['BullMQ Background Jobs'],
        summary: 'Enqueue weekly digest generation job into Redis BullMQ queue',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workspaceId'],
                properties: {
                  workspaceId: { type: 'string', example: '6a8d9240347ba6d6911ea073' },
                },
              },
            },
          },
        },
        responses: { 202: { description: 'Job enqueued into BullMQ' } },
      },
    },
    '/api/jobs/weekly-digest/logs': {
      get: {
        tags: ['BullMQ Background Jobs'],
        summary: 'Get weekly digest execution logs processed by BullMQ background worker',
        parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Digest logs list' } },
      },
    },
  },
};
