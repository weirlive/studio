
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
    let valueSuffix: string = '';
    let commandValue: string = '';
    let addressTypeCommand: string = '';

    switch (data.objectType) {
      case 'host':
        valueSuffix = data.hostIp.replace(/\./g, '-').replace(/:/g, '_'); // Replace : for IPv6 compatibility in names
        commandValue = data.hostIp;
        addressTypeCommand = `ip-netmask ${commandValue}`;
        break;
      case 'range':
        valueSuffix = data.ipRange.split('-')[0].replace(/\./g, '-').replace(/:/g, '_');
        commandValue = data.ipRange;
        addressTypeCommand = `ip-range ${commandValue}`;
        break;
      case 'fqdn':
        valueSuffix = data.fqdn.replace(/\./g, '-');
        commandValue = data.fqdn;
        addressTypeCommand = `fqdn ${commandValue}`;
        break;
    }

    const finalObjectName = `${data.zone}_${valueSuffix}`;
    
    // Check final object name length (PAN-OS usually 63 chars for address objects)
    if (finalObjectName.length > 63) {
        toast({
            title: 'Warning: Object Name Too Long',
            description: `The generated name "${finalObjectName}" (${finalObjectName.length} chars) may exceed firewall limits. Consider shortening zone.`,
            variant: 'destructive',
            duration: 7000,
        });
    }

    configLines.push(`set address ${finalObjectName} ${addressTypeCommand}`);
    
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
          Enter details for your Palo Alto Networks object. The final name will be: Zone_IP/FQDNSuffix.
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
                    <Input placeholder="e.g., dmz, trust, untrust" {...field} />
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="host" />
                        </FormControl>
                        <FormLabel className="font-normal">Host (Single IP)</FormLabel>
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
                    <FormLabel>Host IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 192.168.1.10 or 2001:db8::1" {...field} />
                    </FormControl>
                    <FormDescription>Enter a single IPv4 or IPv6 address.</FormDescription>
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
