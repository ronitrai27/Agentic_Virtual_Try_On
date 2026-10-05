On this page

# Build AI agents

Build TypeScript agents and AI applications with one API for models, tools, structured output, and streaming across Next.js, Vue, Svelte, Node.js, and other frameworks.

[Build an agent](https://ai-sdk.dev/docs/agents/building-agents)[Read AI SDK docs](https://ai-sdk.dev/docs)

Build an agentGenerate textGenerate structured data

agent.ts

```
import { ToolLoopAgent, tool } from 'ai';
import { z } from 'zod';
 
const agent = new ToolLoopAgent({
  model: 'anthropic/claude-fable-5.1',
  tools: {
    getWeather: tool({
      description: 'Get the current weather for a location',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => ({
        location,
        temperature: 72,
        condition: 'sunny',
      }),
    }),
  },
});
 
const { text } = await agent.generate({
  prompt: "What's the weather in Tokyo?",
});
 
console.log(text);
```

index.ts

```
import { generateText } from 'ai';
 
const { text } = await generateText({
  model: 'openai/gpt-6-astra',
  prompt: 'Explain quantum entanglement in one paragraph.',
});
 
console.log(text);
```

classify.ts

```
import { generateObject } from 'ai';
import { z } from 'zod';
 
const { object } = await generateObject({
  model: 'openai/gpt-6-astra',
  schema: z.object({
    sentiment: z.enum(['positive', 'neutral', 'negative']),
  }),
  prompt: 'Classify the sentiment: I love this product.',
});
 
console.log(object);
```

## Add models, tools, and streaming

- Unified provider API. Switch between models by changing two lines of code
- Structured outputs. Generate type-safe JSON with `generateObject` and `streamObject`
- Tool calling. Let models interact with external systems
- Streaming first. Stream text, objects, and UI to your frontend
- Framework support. Works with React, Next.js, Vue, Svelte, and Node.js

## Generating text

At the center of the AI SDK is [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core/overview), which provides a unified API to call any LLM.

The following example shows how to generate text with the AI SDK using OpenAI's GPT-6 Astra:

```
import { generateText } from 'ai';
 
const { text } = await generateText({
  model: 'openai/gpt-6-astra',
  prompt: 'Explain the concept of quantum entanglement.',
});
```

The unified interface lets you switch providers by changing the model string. For example, to use Anthropic's Claude Fable 5.1:

```
import { generateText } from 'ai';
 
const { text } = await generateText({
  model: 'anthropic/claude-fable-5.1',
  prompt: 'How many people will live in the world in 2040?',
});
```

## Generating structured data

While text generation can be useful, you might want to generate structured JSON data. For example, you might want to extract information from text, classify data, or generate synthetic data. AI SDK Core provides two functions ([`generateObject`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) and [`streamObject`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object)) to generate structured data, allowing you to constrain model outputs to a specific schema.

The following example shows how to generate a type-safe recipe that conforms to a zod schema:

```
import { generateObject } from 'ai';
import { z } from 'zod';
 
const { object } = await generateObject({
  model: 'openai/gpt-6-astra',
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

## Give agents tools

The AI SDK supports tool calling out of the box, allowing it to interact with external systems and perform discrete tasks. The following example shows how to use tool calling with the AI SDK:

```
import { generateText, tool } from 'ai';
import { z } from 'zod';
 
const { text } = await generateText({
  model: 'openai/gpt-6-astra',
  prompt: 'What is the weather like today in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get the weather in a location',
      inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
});
```

## Getting started with the AI SDK

The AI SDK is available as a package. To install it, run the following command:

pnpmyarnnpmbun

Terminal

```
pnpm i ai
```

Terminal

```
yarn add ai
```

Terminal

```
npm i ai
```

Terminal

```
bun add ai
```

See the [AI SDK Getting Started](https://ai-sdk.dev/docs/getting-started) guide for more information on how to get started with the AI SDK.

Follow [Build AI agents with AI Gateway and AI SDK](/kb/guide/ai-gateway-and-ai-sdk) to set up authentication, stream responses, and add tools and model fallbacks.

## Use Vercel Connect with AI SDK

Vercel Connect supplies short-lived OAuth tokens to MCP clients built with AI SDK, so models can call tools from services such as Linear without storing provider credentials in your application. The `connectAuthProvider()` helper requests credentials and supports user consent flows.

Follow the [AI SDK and MCP tutorial](/docs/connect/frameworks/ai-sdk-and-mcp) to configure Vercel Connect, make MCP tools available to an AI SDK application, and handle tool approval.

## Use Jev with AI SDK

[Jev](/kb/jev-from-typesafe-ai), an evaluation model from TypeSafe AI, returns typed choices, scores, and boolean probabilities that your application can use to classify requests, route work, and assess proposed actions. Call Jev through AI Gateway with the experimental `evaluate` API in AI SDK 7 or later.

Learn how to [classify, route, and score with Jev and AI SDK](/kb/guide/typesafe-jev-and-ai-sdk), or follow [Route form submissions with Jev and AI SDK](/kb/guide/jev-ai-sdk-form-router) to build a form router with configurable destinations and a fallback model for uncertain decisions.

## Build with a template

Start with an AI SDK template to build a chatbot or route form submissions with Jev:

## More resources

[### AI SDK documentation Read the official AI SDK reference and guides.](https://ai-sdk.dev/docs)[### AI SDK examples Browse runnable examples for common patterns.](https://ai-sdk.dev/cookbook)[### AI SDK guides Step-by-step guides for building AI features.](https://vercel.com/kb/ai-sdk)[### AI SDK templates Start from a production-ready Vercel template.](https://vercel.com/templates?type=ai)

Related Vercel documentation

## Cross-link map: AI SDK (/docs/ai-sdk)

> From the Vercel docs graph (built 2026-10-05T05:39:47.698Z), spanning vercel.com docs + KB, nextjs.org, ai-sdk.dev, and other Vercel documentation sites. Full graph as JSON: [https://vercel.com/docs/graph.json](https://vercel.com/docs/graph.json)

### Semantically closest pages

- [AI SDK with AI Gateway](https://vercel.com/docs/ai-gateway/sdks-and-apis/ai-sdk?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=semantic&surface=html) — Build AI-powered TypeScript applications using the AI SDK with AI Gateway for unified access to 200+ models.
- [Building AI apps on Vercel: an overview](https://vercel.com/kb/guide/how-to-build-ai-app?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=semantic&surface=html) — Learn the key AI concepts and tools for building and scaling AI apps.
- [AI SDK for Python with AI Gateway](https://vercel.com/docs/ai-gateway/sdks-and-apis/ai-sdk-python?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=semantic&surface=html) — Build AI-powered Python applications using the AI SDK for Python with AI Gateway for unified access to 200+ models.
- [AI SDK by Vercel](https://ai-sdk.dev/docs/introduction?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=semantic&surface=html) — The AI SDK is the TypeScript toolkit for building AI applications and agents with React, Next.js, Vue, Svelte, Node.js,
- [Node.js](https://ai-sdk.dev/docs/getting-started/nodejs?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=semantic&surface=html) — Learn how to build your first agent with the AI SDK and Node.js.

### This page links to (6)

- [Overview](https://ai-sdk.dev/docs/ai-sdk-core/overview?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=outbound&surface=html) — An overview of AI SDK Core.
- [Getting Started](https://ai-sdk.dev/docs/getting-started?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=outbound&surface=html) — Welcome to the AI SDK documentation!
- [AI SDK and MCP with Vercel Connect](https://vercel.com/docs/connect/frameworks/ai-sdk-and-mcp?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=outbound&surface=html) — Connect an AI SDK app to an OAuth-protected MCP server with Vercel Connect, then handle user consent and tool approval.
- [Build AI agents with AI Gateway and AI SDK](https://vercel.com/kb/guide/ai-gateway-and-ai-sdk?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=outbound&surface=html) — Build AI agents on Vercel with AI Gateway and AI SDK, then make them reliable, capable, and durable with Sandbox, Chat S
- [Route form submissions with Jev and AI SDK](https://vercel.com/kb/guide/jev-ai-sdk-form-router?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=outbound&surface=html) — Route form submissions to the right team with the Jev x AI SDK Form Router template. Jev routes clear cases and a fallba
- [How to classify, route, and score with Jev and AI SDK](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=outbound&surface=html) — Use Jev from TypeSafe AI with AI SDK's experimental \\`evaluate\\` API to classify, route, score, and verify inside your a

### Pages that link here (10)

By site: vercel-kb (2) · vercel-web (2) · vercel-docs (6)

#### From vercel-kb

- [How to architect an AI evaluation dashboard on Vercel](https://vercel.com/kb/guide/ai-evaluation-dashboard-architecture-on-vercel?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — Map eval orchestration, traces, and run storage to AI Gateway, Observability, and Marketplace Postgres, and learn when s
- [Private enterprise agents on Vercel](https://vercel.com/kb/guide/private-enterprise-agents-vercel?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — Design private enterprise agents that call internal APIs and databases with Vercel Functions, Secure Compute, AI Gateway

#### From vercel-web

- [Agentic Infrastructure](https://vercel.com/blog/agentic-infrastructure?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html)
- [Zero Data Retention on AI Gateway](https://vercel.com/blog/zdr-on-ai-gateway?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html)

#### From vercel-docs

- [AI Gateway Framework Integrations](https://vercel.com/docs/ai-gateway/ecosystem/framework-integrations?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — Connect LangChain, LiteLLM, LlamaIndex, Mastra, Pydantic AI, TanStack AI, and other frameworks to Vercel AI Gateway with
- [Mastra with AI Gateway](https://vercel.com/docs/ai-gateway/ecosystem/framework-integrations/mastra?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — Learn how to integrate Vercel AI Gateway with Mastra to access multiple AI models through a unified interface.
- [Glossary](https://vercel.com/docs/glossary?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — Learn about the terms and concepts used in Vercel's products and documentation.
- [AI SDK with MCP](https://vercel.com/docs/mcp/integrations/ai-sdk?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — Connect the AI SDK to an MCP server on Vercel, discover its tools, and call them with models served through AI Gateway.
- [Products](https://vercel.com/docs/products?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — Browse Vercel products for building, deploying, securing, observing, and scaling web applications.
- [Projects overview](https://vercel.com/docs/projects?from=graph&source_path=%2Fdocs%2Fai-sdk&source_site=vercel-docs&relationship=inbound&surface=html) — A project is where you deploy and operate frontend apps, APIs, backends, containers, and agent workloads on Vercel.