
"use client";

import type { NetworkObjectFormData } from '@/lib/schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { networkObjectSchema } from '@/lib/schemas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

export function NetworkObjectForm() {
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);
  const { toast } = useToast();

  const form = useForm<NetworkObjectFormData>({
    resolver: zodResolver(networkObjectSchema),
    defaultValues: {
      name: '',
      ipAddress: '',
      description: '',
      tag: '',
      objectGroup: '',
    },
  });

  const onSubmit = (data: NetworkObjectFormData) => {
    setIsSubmittingConfig(true);
    let configLines: string[] = [];
    const ipValue = data.ipAddress;

    let ipForNameSuffix: string;
    if (ipValue.includes('-')) { // Range
      ipForNameSuffix = ipValue.substring(0, ipValue.indexOf('-'));
    } else if (ipValue.includes('/')) { // CIDR
      ipForNameSuffix = ipValue.substring(0, ipValue.indexOf('/'));
    } else { // Single IP
      ipForNameSuffix = ipValue;
    }
    const processedIpSuffix = ipForNameSuffix.replace(/\./g, '-');
    const finalObjectName = `${data.name}-${processedIpSuffix}`;

    if (ipValue.includes('-')) { 
      configLines.push(`set address ${finalObjectName} ip-range ${ipValue}`);
    } else { 
      configLines.push(`set address ${finalObjectName} ip-netmask ${ipValue}`);
    }
    
    if (data.description) {
      configLines.push(`set address ${finalObjectName} description "${data.description.replace(/"/g, '\\"')}"`);
    }
    if (data.tag) {
      configLines.push(`set address ${finalObjectName} tag ${data.tag}`);
    }
    if (data.objectGroup && finalObjectName) {
      configLines.push(`set address-group ${data.objectGroup} static add [ ${finalObjectName} ]`);
    }

    const fullConfig = configLines.join('\n');
    
    try {
      const blob = new Blob([fullConfig], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${finalObjectName || 'network_object'}_config.txt`;
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
          Enter the details for your Palo Alto Networks object. The IP address will be appended to the name.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Object Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., web-server-prod-01" {...field} />
                  </FormControl>
                  <FormDescription>
                    The IP address details will be automatically appended to this name (e.g., name-192-168-1-1).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator />

            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Address / Subnet / Range</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 192.168.1.10, 10.0.0.0/24, or 1.1.1.1-1.1.1.10" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter an IP address (IPv4/IPv6), CIDR (e.g., 192.168.1.0/24), or IP range (e.g., 192.168.1.10-192.168.1.20).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the object's purpose." {...field} />
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
                    <Input placeholder="e.g., Prod, PCI, Web" {...field} />
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
                    <Input placeholder="e.g., Internal-Servers-Group" {...field} />
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
