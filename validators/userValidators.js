const { z } = require('zod');

const updateSettingsSchema = z.object({
    newUsername: z.string().trim().min(3).max(30).optional(),
    newPassword: z.string().min(6).max(100).optional()
}).refine((input) => Boolean(input.newUsername || input.newPassword), {
    message: 'Degisiklik icin en az bir alan gereklidir.'
});

module.exports = { updateSettingsSchema };
