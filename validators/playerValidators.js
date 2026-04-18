const { z } = require('zod');

const playersQuerySchema = z.object({
    tier: z.string().optional(),
    pos: z.string().optional(),
    search: z.string().optional(),
    names: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    sort: z.enum(['rating', 'pace', 'age', 'name']).default('rating'),
    order: z.enum(['asc', 'desc']).default('desc')
});

const playerPayloadSchema = z.object({
    name: z.string().trim().min(2).max(80),
    team: z.string().trim().min(1).max(80).optional(),
    pos: z.string().trim().min(1).max(10),
    rating: z.coerce.number().int().min(1).max(99),
    age: z.coerce.number().int().min(14).max(50),
    pace: z.coerce.number().int().min(1).max(99),
    shoot: z.coerce.number().int().min(1).max(99).optional(),
    pass: z.coerce.number().int().min(1).max(99).optional(),
    drib: z.coerce.number().int().min(1).max(99).optional(),
    def: z.coerce.number().int().min(1).max(99).optional(),
    phy: z.coerce.number().int().min(1).max(99).optional()
});

module.exports = { playersQuerySchema, playerPayloadSchema };
