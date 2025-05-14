
import { z } from 'zod';

// Helper function to check if a string is a valid IPv4 or IPv6
const isIp = (value: string): boolean => z.string().ip().safeParse(value).success;

// Helper function to check if a string is a valid IP range
const isIpRange = (value: string): boolean => {
  if (!value.includes('-')) return false;
  const parts = value.split('-');
  if (parts.length !== 2) return false;
  const startIp = parts[0];
  const endIp = parts[1];
  return isIp(startIp) && isIp(endIp);
};

// Helper function to check if a string is a valid FQDN
const isFqdn = (value: string): boolean => {
  if (!value || value.length === 0 || value.length > 253) return false;
  // Basic FQDN regex: labels separated by dots, LDH rule (letters, digits, hyphen)
  // No leading/trailing hyphens in labels. Labels 1-63 chars.
  const fqdnRegex = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63}(?<!-))*$/;
  if (!fqdnRegex.test(value)) return false;
  // Ensure it's not an IP address
  if (isIp(value)) return false;
  // Check TLD presence
  const labels = value.split('.');
  if (labels.length < 2 || labels[labels.length -1].length < 2) return false;
  return true;
};


const baseSchemaFields = {
  zone: z.string()
    .min(1, { message: "Zone is required." })
    .max(31, { message: "Zone must be 31 characters or less." })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Zone can only contain alphanumeric characters, underscores, and hyphens." }),
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
};

export const networkObjectSchema = z.discriminatedUnion("objectType", [
  z.object({
    ...baseSchemaFields,
    objectType: z.literal("host"),
    hostIp: z.string()
      .min(1, { message: "At least one IP address is required." })
      .refine(
        (value) => {
          if (!value) return false;
          // Split by commas or one or more whitespace characters, then trim and filter empty strings
          const ips = value.split(/[\s,]+/).map(ip => ip.trim()).filter(ip => ip.length > 0);
          if (ips.length === 0) return false; // Ensure at least one IP after processing
          return ips.every(ip => isIp(ip));
        },
        { message: "Invalid IP address format. Please provide valid IPv4 or IPv6 addresses, separated by commas or spaces (e.g., 1.1.1.1 2.2.2.2 or 1.1.1.1,2.2.2.2)." }
      ),
  }),
  z.object({
    ...baseSchemaFields,
    objectType: z.literal("range"),
    ipRange: z.string().refine(isIpRange, { message: "Invalid IP range format (e.g., 1.1.1.1-1.1.1.10)." }),
  }),
  z.object({
    ...baseSchemaFields,
    objectType: z.literal("fqdn"),
    fqdn: z.string().refine(isFqdn, { message: "Invalid FQDN format (e.g., example.com)." }),
  }),
]);

export type NetworkObjectFormData = z.infer<typeof networkObjectSchema>;
