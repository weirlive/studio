
"use client";

import type { SubnetCalculatorFormData } from '@/lib/schemas';
import type { SubnetCalculationResult } from '@/lib/ip-utils';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subnetCalculatorSchema } from '@/lib/schemas';
import { calculateSubnetDetails } from '@/lib/ip-utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calculator, Info } from 'lucide-react';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

export function SubnetCalculatorForm() {
  const [calculationResult, setCalculationResult] = useState<SubnetCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SubnetCalculatorFormData>({
    resolver: zodResolver(subnetCalculatorSchema),
    defaultValues: {
      ipAddress: '',
      cidr: 24,
    },
  });

  const onSubmit = (data: SubnetCalculatorFormData) => {
    setError(null);
    setCalculationResult(null);
    const result = calculateSubnetDetails(data.ipAddress, data.cidr);
    if (result) {
      setCalculationResult(result);
    } else {
      setError("Failed to calculate subnet details. Please check your input.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-3xl flex items-center gap-2">
          <Calculator className="h-8 w-8" /> IPv4 Subnet Calculator
        </CardTitle>
        <CardDescription>
          Enter an IPv4 address and CIDR prefix to calculate subnet details.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 192.168.1.10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cidr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CIDR Prefix</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
                <Info size={16} /> {error}
              </div>
            )}
            <CardFooter className="flex justify-end p-0 pt-6">
              <Button 
                type="submit"
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Calculate
              </Button>
            </CardFooter>
          </form>
        </Form>

        {calculationResult && (
          <>
            <Separator className="my-8" />
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-center">Calculation Results</h3>
              <Card className="bg-muted/30 shadow-inner">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {[
                    { label: "IP Address", value: calculationResult.ipAddress },
                    { label: "CIDR Prefix", value: `/${calculationResult.cidr}` },
                    { label: "Network Address", value: calculationResult.networkAddress, important: true },
                    { label: "Broadcast Address", value: calculationResult.broadcastAddress, important: true },
                    { label: "Subnet Mask", value: calculationResult.subnetMask },
                    { label: "Wildcard Mask", value: calculationResult.wildcardMask },
                    { label: "Total Hosts", value: calculationResult.totalHosts.toLocaleString() },
                    { label: "Usable Hosts", value: calculationResult.usableHosts.toLocaleString(), important: true },
                    { label: "Usable Host Range", value: calculationResult.usableHostRange, important: true, fullWidth: true },
                    { label: "IP Type", value: <Badge variant={calculationResult.isPublic ? "default" : "secondary"}>{calculationResult.isPublic ? 'Public' : 'Private'}</Badge>, fullWidth: false}
                  ].map((item, index) => (
                    <div key={index} className={`flex flex-col ${item.fullWidth ? 'md:col-span-2' : ''}`}>
                      <span className="font-medium text-muted-foreground">{item.label}:</span>
                      <span className={`break-all ${item.important ? 'text-lg font-semibold text-primary' : ''}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
