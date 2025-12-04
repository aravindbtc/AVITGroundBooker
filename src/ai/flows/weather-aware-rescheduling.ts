'use server';

/**
 * @fileOverview A weather-aware rescheduling AI agent.
 *
 * - weatherAwareRescheduling - A function that handles the weather-aware rescheduling process.
 * - WeatherAwareReschedulingInput - The input type for the weatherAwareRescheduling function.
 * - WeatherAwareReschedulingOutput - The return type for the weatherAwareRescheduling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherAwareReschedulingInputSchema = z.object({
  bookingId: z.string().describe('The ID of the booking to reschedule.'),
  userId: z.string().describe('The ID of the user who made the booking.'),
  weatherForecast: z
    .string()
    .describe(
      'The weather forecast for the time of the booking.  Must include the probability of rain.'
    ),
  pastPreferences: z
    .string()
    .describe(
      'The past booking preferences of the user, including preferred days and times.'
    ),
  groundAvailability: z
    .string()
    .describe(
      'The availability of the ground, including which slots are available and which are booked.'
    ),
});
export type WeatherAwareReschedulingInput = z.infer<
  typeof WeatherAwareReschedulingInputSchema
>;

const WeatherAwareReschedulingOutputSchema = z.object({
  rescheduleSuggestion: z
    .string()
    .describe(
      'A suggestion for a new booking time, taking into account the weather forecast, user preferences, and ground availability.'
    ),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why the suggested reschedule time was chosen.'
    ),
});
export type WeatherAwareReschedulingOutput = z.infer<
  typeof WeatherAwareReschedulingOutputSchema
>;

export async function weatherAwareRescheduling(
  input: WeatherAwareReschedulingInput
): Promise<WeatherAwareReschedulingOutput> {
  return weatherAwareReschedulingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherAwareReschedulingPrompt',
  input: {schema: WeatherAwareReschedulingInputSchema},
  output: {schema: WeatherAwareReschedulingOutputSchema},
  prompt: `You are an AI assistant that helps users reschedule their cricket ground bookings due to inclement weather.

You will receive the following information:
- The booking ID: {{{bookingId}}}
- The user ID: {{{userId}}}
- The weather forecast: {{{weatherForecast}}}
- The user's past booking preferences: {{{pastPreferences}}}
- The ground availability: {{{groundAvailability}}}

Your task is to suggest a new booking time that takes into account the weather forecast, the user's preferences, and the ground availability.

If the weather forecast indicates a high probability of rain (>50%), you should suggest a new booking time that is on a day and time when it is not raining, and that matches the user's preferences as closely as possible.

Consider the ground availability when suggesting a new booking time.  The new booking time must be available.

Output the rescheduleSuggestion and reasoning fields.
`,
});

const weatherAwareReschedulingFlow = ai.defineFlow(
  {
    name: 'weatherAwareReschedulingFlow',
    inputSchema: WeatherAwareReschedulingInputSchema,
    outputSchema: WeatherAwareReschedulingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
