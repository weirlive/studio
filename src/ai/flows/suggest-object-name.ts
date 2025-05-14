'use server';

/**
 * @fileOverview Provides a smart name suggestion for a network object based on its description.
 *
 * - suggestObjectName - A function that suggests a name for a network object.
 * - SuggestObjectNameInput - The input type for the suggestObjectName function.
 * - SuggestObjectNameOutput - The return type for the suggestObjectName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestObjectNameInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the network object for which a name is needed.'),
});
export type SuggestObjectNameInput = z.infer<typeof SuggestObjectNameInputSchema>;

const SuggestObjectNameOutputSchema = z.object({
  suggestedName: z.string().describe('The suggested name for the network object.'),
});
export type SuggestObjectNameOutput = z.infer<typeof SuggestObjectNameOutputSchema>;

export async function suggestObjectName(
  input: SuggestObjectNameInput
): Promise<SuggestObjectNameOutput> {
  return suggestObjectNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestObjectNamePrompt',
  input: {schema: SuggestObjectNameInputSchema},
  output: {schema: SuggestObjectNameOutputSchema},
  prompt: `You are an expert network engineer. Based on the description provided, suggest a suitable name for the network object.

Description: {{{description}}}

Suggest a name that is concise, descriptive, and follows common networking naming conventions.`,
});

const suggestObjectNameFlow = ai.defineFlow(
  {
    name: 'suggestObjectNameFlow',
    inputSchema: SuggestObjectNameInputSchema,
    outputSchema: SuggestObjectNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
