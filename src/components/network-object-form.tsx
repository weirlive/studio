
"use client";

import type { NetworkObjectFormData } from '@/lib/schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { networkObjectSchema } from '@/lib/schemas';
import { suggestObjectName } from '@/ai/flows/suggest-object-name';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Download, Loader2 } from 'lucide-react';

export function NetworkObjectForm() {
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [isSuggestingName, setIsSuggestingName] = useState(false);
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

  const handleSuggestName = async () => {
    if (!aiDescription.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a description for AI name suggestion.',
        variant: 'destructive',
      });
      return;
    }
    setIsSuggestingName(true);
    try {
      const result = await suggestObjectName({ description: aiDescription });
      form.setValue('name', result.suggestedName, { shouldValidate: true });
      toast({
        title: 'Name Suggested!',
        description: `AI suggested: ${result.suggestedName}`,
      });
    } catch (error) {
      console.error('Error suggesting name:', error);
      toast({
        title: 'Error Suggesting Name',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggestingName(false);
    }
  };

  const onSubmit = (data: NetworkObjectFormData) => {
    setIsSubmittingConfig(true);
    let configLines: string[] = [];
    const ipValue = data.ipAddress;

    if (ipValue.includes('-')) { // Validated by Zod to be a proper range if it contains '-'
      configLines.push(`set address ${data.name} ip-range ${ipValue}`);
    } else { // Single IP or CIDR
      configLines.push(`set address ${data.name} ip-netmask ${ipValue}`);
    }
    
    if (data.description) {
      configLines.push(`set address ${data.name} description "${data.description.replace(/"/g, '\\"')}"`);
    }
    if (data.tag) {
      configLines.push(`set address ${data.name} tag ${data.tag}`);
    }
    if (data.objectGroup && data.name) {
      // Note: Palo Alto CLI typically requires the group to exist or be created in the same transaction.
      // This command adds an existing object to an existing group.
      configLines.push(`set address-group ${data.objectGroup} static add [ ${data.name} ]`);
    }

    const fullConfig = configLines.join('\n');
    
    try {
      const blob = new Blob([fullConfig], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.name || 'network_object'}_config.txt`;
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
          Enter the details for your Palo Alto Networks object.
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
                  <FormLabel>Object Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., web-server-prod-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 pt-2 pb-4">
              <FormLabel htmlFor="aiDescription">Smart Name Suggestion (Optional)</FormLabel>
              <div className="flex items-center gap-2">
                <Input 
                  id="aiDescription"
                  placeholder="Describe the object, e.g., 'Primary DNS server for guest network'" 
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={handleSuggestName} disabled={isSuggestingName}>
                  {isSuggestingName ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Suggest
                </Button>
              </div>
               <FormDescription>
                Let AI help you pick a descriptive name based on its purpose.
              </FormDescription>
            </div>
            
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
