import { z } from 'zod';

export const networkObjectSchema = z.object({
  name: z.string()
    .min(1, { message: "Name is required." })
    .max(63, { message: "Name must be 63 characters or less." })
    .regex(/^[a-zA-Z0-9._-]+$/, { message: "Name can only contain alphanumeric characters, underscores, hyphens, and periods." }),
  ipAddress: z.string()
    .min(1, { message: "IP Address is required."})
    .ip({ message: "Invalid IP address format (IPv4 or IPv6)." }),
  description: z.string()
    .max(255, { message: "Description must be 255 characters or less." })
    .optional().default(''),
  tag: z.string()
    .max(127, { message: "Tag must be 127 characters or less." })
    .regex(/^[a-zA-Z0-9._-]*$/, { message: "Tag can only contain alphanumeric characters, underscores, hyphens, and periods." }) // Common tag restrictions
    .optional().default(''),
  objectGroup: z.string()
    .max(63, { message: "Object group must be 63 characters or less." })
    .regex(/^[a-zA-Z0-9._-]*$/, { message: "Object group can only contain alphanumeric characters, underscores, hyphens, and periods." })
    .optional().default(''),
});

export type NetworkObjectFormData = z.infer<typeof networkObjectSchema>;
