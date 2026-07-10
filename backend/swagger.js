'use strict';

/**
 * Swagger / OpenAPI setup. Builds the spec from JSDoc annotations in the route
 * files and mounts Swagger UI at /api-docs.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'VR Business Portal API',
    version: '1.0.0',
    description:
      'Accounts, Groups (Entitlements) and Group Assignments for the VR Business Portal. ' +
      'Designed to be aggregated later by the SailPoint Web Services Connector.'
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local development' },
    { url: '/', description: 'Current host (e.g. Render)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Account: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'VR_EMP_001' },
          employeeNumber: { type: 'string', example: 'VR_EMP_001' },
          name: { type: 'string', example: 'adele.vance' },
          displayName: { type: 'string', example: 'Adele Vance' },
          givenName: { type: 'string' },
          familyName: { type: 'string' },
          email: { type: 'string', example: 'AdeleV@6cnky1.onmicrosoft.com' },
          secondaryEmail: { type: 'string' },
          phoneNumber: { type: 'string' },
          secondaryPhoneNumber: { type: 'string' },
          manager: { type: 'string' },
          accountId: { type: 'string', example: 'WS-NA-200001' },
          username: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          locked: { type: 'boolean' },
          department: { type: 'string' },
          region: { type: 'string' },
          accountType: { type: 'string' },
          groups: { type: 'array', items: { type: 'string' }, example: ['WS-ENT100'] }
        }
      },
      AccountInput: {
        type: 'object',
        required: ['username', 'firstName', 'lastName', 'email'],
        properties: {
          username: { type: 'string', example: 'jane.doe' },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', example: 'jane.doe@vrpaper.com' },
          department: { type: 'string', example: 'IT' },
          region: { type: 'string', example: 'India' },
          accountType: { type: 'string', example: 'Employee' },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          locked: { type: 'boolean', example: false },
          groups: { type: 'array', items: { type: 'string' }, example: ['WS-ENT100'] }
        }
      },
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'WS-ENT200' },
          name: { type: 'string', example: 'Web Elevated Account' },
          description: { type: 'string' },
          created: { type: 'string', format: 'date-time' },
          displayName: { type: 'string', example: 'Web Elevated Account' }
        }
      },
      GroupInput: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string', example: 'WS-ENT600' },
          name: { type: 'string', example: 'Reporting Access' },
          description: { type: 'string', example: 'Read-only reporting access' },
          displayName: { type: 'string', example: 'Reporting Access' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const spec = swaggerJsdoc({
  definition,
  apis: [path.join(__dirname, 'routes', '*.js')]
});

/** Mounts Swagger UI (and the raw JSON) onto the Express app. */
function mountSwagger(app) {
  app.get('/api-docs.json', (req, res) => res.json(spec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'VR Business Portal API'
  }));
}

module.exports = { spec, mountSwagger };
