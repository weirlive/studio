
"use client";

import type { NetworkObjectFormData } from '@/lib/schemas';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { networkObjectSchema } from '@/lib/schemas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

export function NetworkObjectForm() {
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);
  const { toast } = useToast();

  const form = useForm<NetworkObjectFormData>({
    resolver: zodResolver(networkObjectSchema),
    defaultValues: {
      zone: '',
      objectType: 'host',
      hostIp: '',
      // ipRange and fqdn will be undefined initially, which is fine for conditional rendering
      description: '',
      tag: '',
      objectGroup: '',
    },
  });

  const objectType = form.watch('objectType');

  const onSubmit = (data: NetworkObjectFormData) => {
    setIsSubmittingConfig(true);
    let configLines: string[] = [];
    const generatedObjectNames: string[] = [];
    let downloadFileNamePrefix: string = data.zone;

    if (data.objectType === 'host') {
      const ips = data.hostIp.split(',').map(ip => ip.trim()).filter(ip => ip);

      if (ips.length === 0) {
        toast({
          title: "Input Error",
          description: "Please provide at least one valid IP address for host type.",
          variant: "destructive",
        });
        setIsSubmittingConfig(false);
        return;
      }

      downloadFileNamePrefix += `_HST_${ips[0].replace(/:/g, '_')}`; // Keep dots for IPv4, replace colons for IPv6

      ips.forEach(ip => {
        const ipSuffix = ip.replace(/:/g, '_'); // Keep dots for IPv4, replace colons for IPv6
        const objectName = `${data.zone}_HST_${ipSuffix}`;
        generatedObjectNames.push(objectName);

        if (objectName.length > 63) {
            toast({
                title: 'Warning: Object Name Too Long',
                description: `The generated name "${objectName}" (${objectName.length} chars) may exceed firewall limits. Consider shortening zone.`,
                variant: 'destructive',
                duration: 7000,
            });
        }
        configLines.push(`set address ${objectName} ip-netmask ${ip}`);
        if (data.description) {
          configLines.push(`set address ${objectName} description "${data.description.replace(/"/g, '\\"')}"`);
        }
        if (data.tag) {
          configLines.push(`set address ${objectName} tag ${data.tag}`);
        }
      });
    } else if (data.objectType === 'range' && data.ipRange) {
      const valueSuffix = data.ipRange.split('-')[0].replace(/:/g, '_'); // Keep dots for IPv4, replace colons for IPv6
      const objectName = `${data.zone}_ADR_${valueSuffix}`;
      generatedObjectNames.push(objectName);
      downloadFileNamePrefix += `_ADR_${valueSuffix}`;

      if (objectName.length > 63) {
          toast({
              title: 'Warning: Object Name Too Long',
              description: `The generated name "${objectName}" (${objectName.length} chars) may exceed firewall limits. Consider shortening zone.`,
              variant: 'destructive',
              duration: 7000,
          });
      }
      configLines.push(`set address ${objectName} ip-range ${data.ipRange}`);
      if (data.description) {
        configLines.push(`set address ${objectName} description "${data.description.replace(/"/g, '\\"')}"`);
      }
      if (data.tag) {
        configLines.push(`set address ${objectName} tag ${data.tag}`);
      }
    } else if (data.objectType === 'fqdn' && data.fqdn) {
      const valueSuffix = data.fqdn.replace(/\./g, '-'); // For FQDN, still replace dots with hyphens
      const objectName = `${data.zone}_FQDN_${valueSuffix}`;
      generatedObjectNames.push(objectName);
      downloadFileNamePrefix += `_FQDN_${valueSuffix}`;
      
      if (objectName.length > 63) {
          toast({
              title: 'Warning: Object Name Too Long',
              description: `The generated name "${objectName}" (${objectName.length} chars) may exceed firewall limits. Consider shortening zone.`,
              variant: 'destructive',
              duration: 7000,
          });
      }
      configLines.push(`set address ${objectName} fqdn ${data.fqdn}`);
      if (data.description) {
        configLines.push(`set address ${objectName} description "${data.description.replace(/"/g, '\\"')}"`);
      }
      if (data.tag) {
        configLines.push(`set address ${objectName} tag ${data.tag}`);
      }
    }

    if (data.objectGroup && generatedObjectNames.length > 0) {
      configLines.push(`set address-group ${data.objectGroup} static add [ ${generatedObjectNames.join(' ')} ]`);
    }

    const fullConfig = configLines.join('\n');
    const downloadFileName = `${downloadFileNamePrefix || 'network_objects'}_config.txt`;
    
    try {
      const blob = new Blob([fullConfig], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Configuration Generated!',
        description: 'Your configuration file has been downloaded.',
      });
    } catch (error) {
      console.error("Error generating file:", error);
      toast({
        title: 'File Generation Error',
        description: 'Could not generate or download the configuration file.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingConfig(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Define Network Object</CardTitle>
        <CardDescription>
          Enter details for your Palo Alto Networks object. The final name will be: ZONE_TYPE_IP/FQDNSuffix (e.g., DMZ_HST_1.1.1.1).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="zone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.G., DMZ, TRUST, UNTRUST" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                    />
                  </FormControl>
                  <FormDescription>The firewall zone for this object (used in naming).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator />

            <FormField
              control={form.control}
              name="objectType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Object Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear other fields when object type changes
                        if (value !== 'host') form.setValue('hostIp', '', {shouldValidate: true});
                        if (value !== 'range') form.setValue('ipRange', '', {shouldValidate: true});
                        if (value !== 'fqdn') form.setValue('fqdn', '', {shouldValidate: true});
                      }}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="host" />
                        </FormControl>
                        <FormLabel className="font-normal">Host (Single/Multiple IPs)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="range" />
                        </FormControl>
                        <FormLabel className="font-normal">IP Range</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fqdn" />
                        </FormControl>
                        <FormLabel className="font-normal">FQDN</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {objectType === 'host' && (
              <FormField
                control={form.control}
                name="hostIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host IP Address(es)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 192.168.1.10 or 1.1.1.1,2.2.2.2" {...field} />
                    </FormControl>
                    <FormDescription>Enter a single IPv4/IPv6 address or multiple comma-separated IP addresses.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {objectType === 'range' && (
              <FormField
                control={form.control}
                name="ipRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address Range</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 192.168.1.10-192.168.1.20" {...field} />
                    </FormControl>
                    <FormDescription>Enter an IP range (e.g., startIP-endIP).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {objectType === 'fqdn' && (
              <FormField
                control={form.control}
                name="fqdn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FQDN (Fully Qualified Domain Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., www.example.com" {...field} />
                    </FormControl>
                    <FormDescription>Enter a valid FQDN.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Separator />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A BRIEF DESCRIPTION OF THE OBJECT'S PURPOSE." 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.G., PROD, PCI, WEB" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                    />
                  </FormControl>
                   <FormDescription>
                    Assign a tag for organization and policy matching.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="objectGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add to Object Group (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.G., INTERNAL-SERVERS-GROUP" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                    />
                  </FormControl>
                  <FormDescription>
                    Specify an address group to add this object to. The group must already exist on the firewall.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter className="flex justify-end p-0 pt-6">
              <Button 
                type="submit" 
                disabled={isSubmittingConfig || !form.formState.isValid} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                {isSubmittingConfig ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Generate & Download Configuration
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

