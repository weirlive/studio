
'use server';

export interface SubnetCalculationResult {
  ipAddress: string;
  cidr: number;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  totalHosts: number;
  usableHosts: number;
  usableHostRange: string;
  wildcardMask: string;
  isPublic: boolean;
}

/**
 * Converts an IPv4 address string to its 32-bit integer representation.
 * @param ip The IPv4 address string (e.g., "192.168.1.1").
 * @returns The 32-bit integer representation, or null if invalid.
 */
export function ipToLong(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let long = 0;
  for (let i = 0; i < 4; i++) {
    const part = parseInt(parts[i], 10);
    if (isNaN(part) || part < 0 || part > 255) return null;
    long = (long << 8) | part;
  }
  return long >>> 0; // Ensure unsigned
}

/**
 * Converts a 32-bit integer representation of an IPv4 address to its string form.
 * @param long The 32-bit integer.
 * @returns The IPv4 address string.
 */
export function longToIp(long: number): string {
  return `${(long >>> 24) & 0xff}.${(long >>> 16) & 0xff}.${(long >>> 8) & 0xff}.${long & 0xff}`;
}

/**
 * Calculates the 32-bit integer subnet mask from a CIDR prefix.
 * @param cidr The CIDR prefix (0-32).
 * @returns The subnet mask as a 32-bit integer, or null if CIDR is invalid.
 */
function cidrToMaskLong(cidr: number): number | null {
  if (cidr < 0 || cidr > 32) return null;
  if (cidr === 0) return 0;
  return (0xffffffff << (32 - cidr)) >>> 0;
}

/**
 * Checks if an IP address is public or private.
 * @param ipLong The 32-bit integer representation of the IP address.
 * @returns True if public, false if private.
 */
function checkIsPublic(ipLong: number): boolean {
    // Class A private: 10.0.0.0 to 10.255.255.255
    if ((ipLong >= 0x0A000000) && (ipLong <= 0x0AFFFFFF)) return false;
    // Class B private: 172.16.0.0 to 172.31.255.255
    if ((ipLong >= 0xAC100000) && (ipLong <= 0xAC1FFFFF)) return false;
    // Class C private: 192.168.0.0 to 192.168.255.255
    if ((ipLong >= 0xC0A80000) && (ipLong <= 0xC0A8FFFF)) return false;
    // Loopback: 127.0.0.0 to 127.255.255.255
    if ((ipLong >= 0x7F000000) && (ipLong <= 0x7FFFFFFF)) return false;
    // APIPA: 169.254.0.0 to 169.254.255.255
    if ((ipLong >= 0xA9FE0000) && (ipLong <= 0xA9FEFFFF)) return false;
    return true;
}


/**
 * Calculates various details of an IPv4 subnet.
 * @param ip The IPv4 address string.
 * @param cidr The CIDR prefix (0-32).
 * @returns An object with subnet details, or null if inputs are invalid.
 */
export function calculateSubnetDetails(ip: string, cidr: number): SubnetCalculationResult | null {
  const ipLong = ipToLong(ip);
  if (ipLong === null) return null;

  const maskLong = cidrToMaskLong(cidr);
  if (maskLong === null) return null;

  const networkAddressLong = (ipLong & maskLong) >>> 0;
  const broadcastAddressLong = (networkAddressLong | (~maskLong >>> 0)) >>> 0;
  const subnetMask = longToIp(maskLong);
  const wildcardMask = longToIp(~maskLong >>> 0);

  let totalHosts: number;
  let usableHosts: number;
  let usableHostRange: string;

  if (cidr === 32) {
    totalHosts = 1;
    usableHosts = 1; // The IP itself
    usableHostRange = longToIp(networkAddressLong);
  } else if (cidr === 31) {
    totalHosts = 2;
    usableHosts = 2;
    usableHostRange = `${longToIp(networkAddressLong)} - ${longToIp(broadcastAddressLong)}`;
  } else {
    totalHosts = Math.pow(2, 32 - cidr);
    usableHosts = Math.max(0, totalHosts - 2);
    if (usableHosts > 0) {
      usableHostRange = `${longToIp(networkAddressLong + 1)} - ${longToIp(broadcastAddressLong - 1)}`;
    } else {
      usableHostRange = "N/A";
    }
  }
  
  const isPublic = checkIsPublic(ipLong);

  return {
    ipAddress: ip,
    cidr,
    subnetMask,
    networkAddress: longToIp(networkAddressLong),
    broadcastAddress: longToIp(broadcastAddressLong),
    totalHosts,
    usableHosts,
    usableHostRange,
    wildcardMask,
    isPublic,
  };
}
