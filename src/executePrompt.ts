// /* eslint-disable prettier/prettier */
// /* eslint-disable import/prefer-default-export */
// // services/claudeService.ts

// import axios from 'axios';
// import { createTypedResponse } from './createTypedResponse';
// import logger from './logger';
// import { processClaudeResponse } from './processClaudeResponse';

// export async function callClaudeAPI({
//   messages,
//   model = 'claude-3-opus-20240229',
//   max_tokens = 40000,
//   temperature = 0.7,
//   includeRawResponse = false,
//   currentApplication,
//   currentView,
//   sampleApp,
//   eventHandler,
// }) {
//   const systemPrompt = `
// This sample app is ${sampleApp}
// The current app ${currentApplication}
// ${currentView && 'The current page the user is on is ' + currentView}
// ${currentApplication && 'The current page the user is on is ' + currentApplication}
// ... // (keep the rest of your system prompt here)
// `;

//   const enhancedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

//   const claudeResponse = await axios.post(
//     'https://api.anthropic.com/v1/messages',
//     {
//       messages: enhancedMessages,
//       model,
//       max_tokens,
//       temperature,
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': process.env.CLAUDE_API_KEY, // Preferably stored securely
//         'anthropic-version': '2023-06-01',
//       },
//     }
//   );

//   const responseText = claudeResponse.data.content[0].text;
//   const { operationType, data, error } = processClaudeResponse(responseText);

//   const typedResponse = createTypedResponse(operationType || 'UNKNOWN_OPERATION', data, {
//     originalResponseId: claudeResponse.data.id,
//     processingError: error,
//     rawResponse: includeRawResponse ? responseText : undefined,
//   });

//   logger.info(`Processed Claude response as ${operationType || 'UNKNOWN_OPERATION'}`, {
//     hasError: !!error,
//     requestId: claudeResponse.data.id,
//   });

//   return typedResponse;
// }
