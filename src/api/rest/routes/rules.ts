import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateRuleRequest, UpdateRuleRequest, CreateRuleSchema, UpdateRuleSchema } from '../../../models/rule';
import { RuleService } from '../../../cache/rule-service';

export const ruleRoutes = (
  app: FastifyInstance,
  ruleService: RuleService
) => {
  /**
   * POST /v1/rules
   * Create a new rate limit rule
   */
  app.post<{ Body: CreateRuleRequest }>(
    '/v1/rules',
    {
      schema: {
        description: 'Create a new rate limit rule',
        tags: ['Rules'],
        body: {
          type: 'object',
          required: ['name', 'algorithm', 'limit', 'window', 'keys'],
          properties: {
            name: { type: 'string' },
            algorithm: { type: 'string', enum: ['token_bucket', 'fixed_window', 'sliding_window'] },
            limit: { type: 'number', minimum: 1 },
            window: { type: 'number', minimum: 1 },
            keys: { type: 'array', items: { type: 'object' } },
            webhookUrl: { type: 'string', format: 'uri' },
            thresholds: { type: 'array', items: { type: 'number' } },
            enabled: { type: 'boolean' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateRuleRequest }>, reply: FastifyReply) => {
      try {
        const validated = CreateRuleSchema.parse(request.body);
        const rule = await ruleService.createRule(validated);
        return reply.status(201).send(rule);
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Invalid request',
        });
      }
    }
  );

  /**
   * GET /v1/rules/:id
   * Get a rule by ID
   */
  app.get<{ Params: { id: string } }>(
    '/v1/rules/:id',
    {
      schema: {
        description: 'Get a rate limit rule by ID',
        tags: ['Rules'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const rule = await ruleService.getRule(request.params.id);
        if (!rule) {
          return reply.status(404).send({ error: 'Rule not found' });
        }
        return reply.send(rule);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  /**
   * GET /v1/rules
   * Get all rules
   */
  app.get(
    '/v1/rules',
    {
      schema: {
        description: 'Get all rate limit rules',
        tags: ['Rules'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const rules = await ruleService.getAllRules();
        return reply.send({ rules, count: rules.length });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  /**
   * PUT /v1/rules/:id
   * Update a rule
   */
  app.put<{ Params: { id: string }; Body: UpdateRuleRequest }>(
    '/v1/rules/:id',
    {
      schema: {
        description: 'Update a rate limit rule',
        tags: ['Rules'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateRuleRequest }>, reply: FastifyReply) => {
      try {
        const validated = UpdateRuleSchema.parse(request.body);
        const rule = await ruleService.updateRule(request.params.id, validated);
        if (!rule) {
          return reply.status(404).send({ error: 'Rule not found' });
        }
        return reply.send(rule);
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Invalid request',
        });
      }
    }
  );

  /**
   * DELETE /v1/rules/:id
   * Delete a rule
   */
  app.delete<{ Params: { id: string } }>(
    '/v1/rules/:id',
    {
      schema: {
        description: 'Delete a rate limit rule',
        tags: ['Rules'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const deleted = await ruleService.deleteRule(request.params.id);
        if (!deleted) {
          return reply.status(404).send({ error: 'Rule not found' });
        }
        return reply.status(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
};
