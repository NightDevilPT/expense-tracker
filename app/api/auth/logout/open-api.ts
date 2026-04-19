// app/api/auth/logout/open-api.ts
import { OpenAPIV3 } from 'openapi-types'
import { emptySuccessResponse } from '@/lib/swagger/schemas'

export const logoutPaths: OpenAPIV3.PathsObject = {
  '/api/auth/logout': {
    post: {
      summary: 'Logout',
      description: 'Logout current user and clear authentication cookies',
      tags: ['Authentication'],
      responses: {
        '200': {
          description: 'Logout successful - Authentication cookies cleared',
          headers: {
            'Set-Cookie': {
              description: 'Clears authentication cookies',
              schema: {
                type: 'string',
                example: 'accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
              }
            }
          },
          content: {
            'application/json': {
              schema: emptySuccessResponse(),
              example: {
                success: true,
                message: 'Logged out successfully',
                data: null,
                meta: {
                  timestamp: '2024-01-01T00:00:00.000Z',
                  executionTimeMs: 12
                }
              }
            }
          }
        },
        '500': { $ref: '#/components/responses/InternalServerError' }
      },
      security: [{ cookieAuth: [] }]
    }
  }
}

export const logoutSchemas: Record<string, OpenAPIV3.SchemaObject> = {}
export const logoutTags: OpenAPIV3.TagObject[] = []