import { client } from "../lib/openai.ts";
import { Forecast } from "./forecast.ts";

const context = `Your goal is to answer the question "Will it rain today?".

Your answer should only be either "No", "Hmm...probably not", "Maybe", "Hmm...yeah probably", "Yes", "Look outside", with the order being least likely to most likely. You should be more concern giving false negative (less likely) than false positive, and therefore pick the next answer up in the likeliness scale unless it's clear "No"

The user prompts you accept is in JSON following this format 
\`\`\`ts
type Input = {
  temperature: {
    min: number,
    max: number,
  },
  precipitation: {
    sum: number,
    hours: number,
    probability: {
      min: number,
      max: number,
      mean: number
   },
  rain: number,
  showers: number.
}
\`\`\`

with this information on each fields
precipitation probability: Probability in percentages of precipitation with more than 0.1 mm. Probability is based on ensemble weather models with 0.25° (~27 km) resolution
rain: the sum of rain from large scale weather systems in millimeters
showers: the sum of showers from convective precipitation in millimeters
temperature: Air temperature at 2 meters above ground in celcius`;

export const prediction = async (forecast: Forecast) => {
  const { choices } = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: context },
      { role: "user", content: JSON.stringify(forecast) },
    ],
  });

  const result = choices
    .filter(({ message }) => message.role === "assistant")
    .map(({ message }) => message.content)
    .filter((content): content is string => !!content)[0];

  return result;
};
