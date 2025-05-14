import { z } from 'zod';

// Helper function to check if a string is a valid IPv4 or IPv6
const isIp = (value: string): boolean => z.string().ip().safeParse(value).success;

// Helper function to check if a string is a valid CIDR
const isCidr = (value: string): boolean => {
  if (!value.includes('/')) return false;
  const parts = value.split('/');
  if (parts.length !== 2) return false;
  const ipPart = parts[0];
  const prefixPart = parts[1];

  if (!isIp(ipPart)) return false;
  
  // Ensure prefix is a number
  if (!/^\d+$/.test(prefixPart)) return false;
  const prefixNum = parseInt(prefixPart, 10);
  if (isNaN(prefixNum)) return false;

  if (z.string().ip({ version: "v4" }).safeParse(ipPart).success) { // IPv4 CIDR
      return prefixNum >= 0 && prefixNum <= 32;
  }
  // Check for IPv6 explicitly because z.string().ip() without version validates both
  // and we need to distinguish for prefix length.
  const ipv6Check = z.string().ip({ version: "v6" }).safeParse(ipPart);
  if (ipv6Check.success) { // IPv6 CIDR
      return prefixNum >= 0 && prefixNum <= 128;
  }
  return false; 
};

// Helper function to check if a string is a valid IP range
const isIpRange = (value: string): boolean => {
  if (!value.includes('-')) return false;
  const parts = value.split('-');
  if (parts.length !== 2) return false;
  const startIp = parts[0];
  const endIp = parts[1];
  // Basic validation: check if both parts are valid IPs.
  // More advanced validation (e.g., startIp < endIp) could be added but Palo Alto CLI usually handles it.
  return isIp(startIp) && isIp(endIp);
};

export const networkObjectSchema = z.object({
  name: z.string()
    .min(1, { message: "Name is required." })
    .max(63, { message: "Name must be 63 characters or less." })
    .regex(/^[a-zA-Z0-9._-]+$/, { message: "Name can only contain alphanumeric characters, underscores, hyphens, and periods." }),
  ipAddress: z.string()
    .min(1, { message: "IP Address/Range/CIDR is required."})
    .refine(value => {
      return isIp(value) || isCidr(value) || isIpRange(value);
    }, { message: "Invalid format. Use IP (e.g., 1.1.1.1), CIDR (e.g., 1.1.1.0/24), or IP Range (e.g., 1.1.1.1-1.1.1.10)." }),
  description: z.string()
    .max(255, { message: "Description must be 255 characters or less." })
    .optional().default(''),
  tag: z.string()
    .max(127, { message: "Tag must be 127 characters or less." })
    .regex(/^[a-zA-Z0-9._-]*$/, { message: "Tag can only contain alphanumeric characters, underscores, hyphens, and periods." }) 
    .optional().default(''),
  objectGroup: z.string()
    .max(63, { message: "Object group must be 63 characters or less." })
    .regex(/^[a-zA-Z0-9._-]*$/, { message: "Object group can only contain alphanumeric characters, underscores, hyphens, and periods." })
    .optional().default(''),
});

export type NetworkObjectFormData = z.infer<typeof networkObjectSchema>;