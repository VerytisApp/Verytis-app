import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
    description: 'Execute the action',
    parameters: z.object({
        query: z.string()
    }),
    execute: async ({ query }) => 'Done'
});

console.log(JSON.stringify(myTool, null, 2));
