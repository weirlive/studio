
import { z } from 'zod';

// Helper function to check if a string is a valid IPv4
const isIPv4 = (value: string): boolean => z.string().ip({ version: "v4" }).safeParse(value).success;

// Helper function to check if a string is a valid IP range
const isIpRange = (value: string): boolean => {
  if (!value.includes('-')) return false;
  const parts = value.split('-');
  if (parts.length !== 2) return false;
  const startIp = parts[0];
  const endIp = parts[1];
  return isIPv4(startIp) && isIPv4(endIp); // Changed to isIPv4
};

// Helper function to check if a string is a valid FQDN
const isFqdn = (value: string): boolean => {
  if (!value || value.length === 0 || value.length > 253) return false;
  const fqdnRegex = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63}(?<!-))*$/;
  if (!fqdnRegex.test(value)) return false;
  if (isIPv4(value)) return false; // Changed to isIPv4
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
          const ips = value.split(/[\s,]+/).map(ip => ip.trim()).filter(ip => ip.length > 0);
          if (ips.length === 0) return false;
          return ips.every(ip => isIPv4(ip)); // Changed to isIPv4
        },
        { message: "Invalid IP address format. Please provide valid IPv4 addresses, separated by commas or spaces (e.g., 1.1.1.1 2.2.2.2 or 1.1.1.1,2.2.2.2)." }
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


// Schema for Subnet Calculator (Removed)
// export const subnetCalculatorSchema = z.object({
//   ipAddress: z.string().refine(isIPv4, {
//     message: "Invalid IPv4 address format (e.g., 192.168.1.1).",
//   }),
//   cidr: z.coerce // coerce allows string input to be converted to number
//     .number({ invalid_type_error: "CIDR must be a number." })
//     .min(0, { message: "CIDR prefix must be between 0 and 32." })
//     .max(32, { message: "CIDR prefix must be between 0 and 32." }),
// });

// export type SubnetCalculatorFormData = z.infer<typeof subnetCalculatorSchema>; // Removed
