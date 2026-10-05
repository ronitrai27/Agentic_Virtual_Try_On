---
title: Subagents
description: Delegate context-heavy tasks to specialized subagents while keeping the main agent focused.
url: "https://ai-sdk.dev/docs/agents/subagents"
docs_index: /llms.txt
---

> For an index of all documentation, see [/llms.txt](/llms.txt).

A subagent is an agent that a parent agent can invoke. The parent delegates work via a tool, and the subagent executes autonomously before returning a result.

## How It Works

1. **Define a subagent** with its own model, instructions, and tools
2. **Create a tool that calls it** for the main agent to use
3. **Subagent runs independently with its own context window**
4. **Return a result** (optionally streaming progress to the UI)
5. **Control what the model sees** using `toModelOutput` to summarize

## When to Use Subagents

Subagents add latency and complexity. Use them when the benefits outweigh the costs:

| Use Subagents When                              | Avoid Subagents When           |
| ----------------------------------------------- | ------------------------------ |
| Tasks require exploring large amounts of tokens | Tasks are simple and focused   |
| You need to parallelize independent research    | Sequential processing suffices |
| Context would grow beyond model limits          | Context stays manageable       |
| You want to isolate tool access by capability   | All tools can safely coexist   |

## Why Use Subagents?

### Offloading Context-Heavy Tasks

Some tasks require exploring large amounts of information—reading files, searching codebases, or researching topics. Running these in the main agent consumes context quickly, making the agent less coherent over time.

With subagents, you can:

- Spin up a dedicated agent that uses hundreds of thousands of tokens
- Have it return only a focused summary (perhaps 1,000 tokens)
- Keep your main agent's context clean and coherent

The subagent does the heavy lifting while the main agent stays focused on orchestration.

### Parallelizing Independent Work

For tasks like exploring a codebase, you can spawn multiple subagents to research different areas simultaneously. Each returns a summary, and the main agent synthesizes the findings—without paying the context cost of all that exploration.

### Specialized Orchestration

A less common but valid pattern is using a main agent purely for orchestration, delegating to specialized subagents for different types of work. For example:

- An exploration subagent with read-only tools for researching codebases
- A coding subagent with file editing tools
- An integration subagent with tools for a specific platform or API

This creates a clear separation of concerns, though context offloading and parallelization are the more common motivations for subagents.

## Basic Subagent Without Streaming

The simplest subagent pattern requires no special machinery. Your main agent has a tool that calls another agent in its `execute` function:

```ts
import { ToolLoopAgent, tool } from 'ai';
import { z } from 'zod';

// Define a subagent for research tasks
const researchSubagent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  instructions: `You are a research agent.
Summarize your findings in your final response.`,
  tools: {
    read: readFileTool, // defined elsewhere
    search: searchTool, // defined elsewhere
  },
});

// Create a tool that delegates to the subagent
const researchTool = tool({
  description: 'Research a topic or question in depth.',
  inputSchema: z.object({
    task: z.string().describe('The research task to complete'),
  }),
  execute: async ({ task }, { abortSignal }) => {
    const result = await researchSubagent.generate({
      prompt: task,
      abortSignal,
    });
    return result.text;
  },
});

// Main agent uses the research tool
const mainAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  instructions: 'You are a helpful assistant that can delegate research tasks.',
  tools: {
    research: researchTool,
  },
});
```

This works well when you don't need to show the subagent's progress in the UI. The tool call blocks until the subagent completes, then returns the final text response.

### Handling Cancellation

When the user cancels a request, the `abortSignal` propagates to the subagent. Always pass it through to ensure cleanup:

```ts
execute: async ({ task }, { abortSignal }) => {
  const result = await researchSubagent.generate({
    prompt: task,
    abortSignal, // Cancels subagent if main request is aborted
  });
  return result.text;
},
```

If you abort the signal, the subagent stops executing and throws an `AbortError`. The main agent's tool execution fails, which stops the main loop.

To avoid errors about incomplete tool calls in subsequent messages, use `convertToModelMessages` with `ignoreIncompleteToolCalls`:

```ts
import { convertToModelMessages } from 'ai';

const modelMessages = await convertToModelMessages(messages, {
  ignoreIncompleteToolCalls: true,
});
```

This filters out tool calls that don't have corresponding results. Learn more in the [convertToModelMessages](/docs/reference/ai-sdk-ui/convert-to-model-messages) reference.

## Streaming Subagent Progress

When you want to show incremental progress as the subagent works, use [**preliminary tool results**](/docs/ai-sdk-core/tools-and-tool-calling#preliminary-tool-results). This pattern uses a generator function that yields partial updates to the UI.

### How Preliminary Tool Results Work

Change your `execute` function from a regular function to an async generator (`async function*`). Each `yield` sends a preliminary result to the frontend:

```ts
execute: async function* ({ /* input */ }) {
  // ... do work ...
  yield partialResult;
  // ... do more work ...
  yield updatedResult;
}
```

### Building the Complete Message

Each `yield` **replaces** the previous output entirely (it does not append). This means you need a way to accumulate the subagent's response into a complete message that grows over time.

The `readUIMessageStream` utility handles this. It reads each chunk from the stream and builds an ever-growing `UIMessage` containing all parts received so far:

```ts
import { readUIMessageStream, toUIMessageStream, tool } from 'ai';
import { z } from 'zod';

const researchTool = tool({
  description: 'Research a topic or question in depth.',
  inputSchema: z.object({
    task: z.string().describe('The research task to complete'),
  }),
  execute: async function* ({ task }, { abortSignal }) {
    // Start the subagent with streaming
    const result = await researchSubagent.stream({
      prompt: task,
      abortSignal,
    });

    // Each iteration yields a complete, accumulated UIMessage
    for await (const message of readUIMessageStream({
      stream: toUIMessageStream({ stream: result.stream }),
    })) {
      yield message;
    }
  },
});
```

Each yielded `message` is a complete `UIMessage` containing all the subagent's parts up to that point (text, tool calls, and tool results). The frontend simply replaces its display with each new message.

## Controlling What the Model Sees

Here's where subagents become powerful for context management. The full `UIMessage` with all the subagent's work is stored in the message history and displayed in the UI. But you can control what the main agent's model actually sees using `toModelOutput`.

### How It Works

The `toModelOutput` function maps the tool's output to the tokens sent to the model:

```ts
const researchTool = tool({
  description: 'Research a topic or question in depth.',
  inputSchema: z.object({
    task: z.string().describe('The research task to complete'),
  }),
  execute: async function* ({ task }, { abortSignal }) {
    const result = await researchSubagent.stream({
      prompt: task,
      abortSignal,
    });

    for await (const message of readUIMessageStream({
      stream: toUIMessageStream({ stream: result.stream }),
    })) {
      yield message;
    }
  },
  toModelOutput: ({ output: message }) => {
    // Extract just the final text as a summary
    const lastTextPart = message?.parts.findLast(p => p.type === 'text');
    return {
      type: 'text',
      value: lastTextPart?.text ?? 'Task completed.',
    };
  },
});
```

With this setup:

- **Users see**: The full subagent execution—every tool call, every intermediate step
- **The model sees**: Just the final summary text

The subagent might use 100,000 tokens exploring and reasoning, but the main agent only consumes the summary. This keeps the main agent coherent and focused.

### Write Subagent Instructions for Summarization

For `toModelOutput` to extract a useful summary, your subagent must produce one. Add explicit instructions like this:

```ts
const researchSubagent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  instructions: `You are a research agent. Complete the task autonomously.

IMPORTANT: When you have finished, write a clear summary of your findings as your final response.
This summary will be returned to the main agent, so include all relevant information.`,
  tools: {
    read: readFileTool,
    search: searchTool,
  },
});
```

Without this instruction, the subagent might not produce a comprehensive summary. It could simply say "Done", leaving `toModelOutput` with nothing useful to extract.

## Rendering Subagents in the UI (with useChat)

To display streaming progress, check the tool part's `state` and `preliminary` flag.

### Tool Part States

| State              | Description                                |
| ------------------ | ------------------------------------------ |
| `input-streaming`  | Tool input being generated                 |
| `input-available`  | Tool ready to execute                      |
| `output-available` | Tool produced output (check `preliminary`) |
| `output-error`     | Tool execution failed                      |

### Detecting Streaming vs Complete

```tsx
const hasOutput = part.state === 'output-available';
const isStreaming = hasOutput && part.preliminary === true;
const isComplete = hasOutput && !part.preliminary;
```

### Type Safety for Subagent Output

Export types alongside your agents for use in UI components:

```ts title="lib/agents.ts"
import { ToolLoopAgent, InferAgentUIMessage } from 'ai';

export const mainAgent = new ToolLoopAgent({
  // ... configuration with researchTool
});

// Export the main agent message type for the chat UI
export type MainAgentMessage = InferAgentUIMessage<typeof mainAgent>;
```

### Render Messages and Subagent Output

This example uses the types defined above to render both the main agent's messages and the subagent's streamed output:

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import type { MainAgentMessage } from '@/lib/agents';

export function Chat() {
  const { messages } = useChat<MainAgentMessage>();

  return (
    <div>
      {messages.map(message =>
        message.parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              return <p key={i}>{part.text}</p>;
            case 'tool-research':
              return (
                <div>
                  {part.state !== 'input-streaming' && (
                    <div>Research: {part.input.task}</div>
                  )}
                  {part.state === 'output-available' && (
                    <div>
                      {part.output.parts.map((nestedPart, i) => {
                        switch (nestedPart.type) {
                          case 'text':
                            return <p key={i}>{nestedPart.text}</p>;
                          default:
                            return null;
                        }
                      })}
                    </div>
                  )}
                </div>
              );
            default:
              return null;
          }
        }),
      )}
    </div>
  );
}
```

## Caveats

### No Tool Approvals in Subagents

Subagent tools cannot use approval flows such as `toolApproval` (or the
deprecated `needsApproval`). All tools must execute automatically without user
confirmation.

### Subagent Context is Isolated

Each subagent invocation starts with a fresh context window. This is one of the key benefits of subagents: they don't inherit the accumulated context from the main agent, which is exactly what allows them to do heavy exploration without bloating the main conversation.

If you need to give a subagent access to the conversation history, the `messages` are available in the tool's execute function alongside `abortSignal`:

```ts
execute: async ({ task }, { abortSignal, messages }) => {
  const result = await researchSubagent.generate({
    messages: [
      ...messages, // The main agent's conversation history
      { role: 'user', content: task }, // The specific task for this invocation
    ],
    abortSignal,
  });
  return result.text;
},
```

Use this sparingly since passing full history defeats some of the context isolation benefits.

### Streaming Adds Complexity

The basic pattern (no streaming) is simpler to implement and debug. Only add streaming when you need to show real-time progress in the UI.

---

For a semantic overview of all documentation, see [/sitemap.md](/sitemap.md)

For an index of all available documentation, see [/llms.txt](/llms.txt)

For agent-facing discovery, including API and MCP surfaces, see [/agents.md](/agents.md)

---
title: Workflow Patterns
description: Learn workflow patterns for building reliable agents with the AI SDK.
url: "https://ai-sdk.dev/docs/agents/workflows"
docs_index: /llms.txt
---

> For an index of all documentation, see [/llms.txt](/llms.txt).

Combine the building blocks from the [overview](/docs/agents/overview) with these patterns to add structure and reliability to your agents:

- [Sequential Processing](#sequential-processing-chains) - Steps executed in order
- [Parallel Processing](#parallel-processing) - Independent tasks run simultaneously
- [Evaluation/Feedback Loops](#evaluator-optimizer) - Results checked and improved iteratively
- [Orchestration](#orchestrator-worker) - Coordinating multiple components
- [Routing](#routing) - Directing work based on context

## Choose Your Approach

Consider these key factors:

- **Flexibility vs Control** - How much freedom does the LLM need vs how tightly you must constrain its actions?
- **Error Tolerance** - What are the consequences of mistakes in your use case?
- **Cost Considerations** - More complex systems typically mean more LLM calls and higher costs
- **Maintenance** - Simpler architectures are easier to debug and modify

**Start with the simplest approach that meets your needs**. Add complexity only when required by:

1. Breaking down tasks into clear steps
2. Adding tools for specific capabilities
3. Implementing feedback loops for quality control
4. Introducing multiple agents for complex workflows

Let's look at examples of these patterns in action.

## Patterns with Examples

These patterns, adapted from [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents), serve as building blocks you can combine to create comprehensive workflows. Each pattern addresses specific aspects of task execution. Combine them thoughtfully to build reliable solutions for complex problems.

## Sequential Processing (Chains)

The simplest workflow pattern executes steps in a predefined order. Each step's output becomes input for the next step, creating a clear chain of operations. Use this pattern for tasks with well-defined sequences, like content generation pipelines or data transformation processes.

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

async function generateMarketingCopy(input: string) {
  const model = "anthropic/claude-sonnet-5.5";

  // First step: Generate marketing copy
  const { text: copy } = await generateText({
    model,
    prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal.`,
  });

  // Perform quality check on copy
  const { output: qualityMetrics } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        hasCallToAction: z.boolean(),
        emotionalAppeal: z.number().min(1).max(10),
        clarity: z.number().min(1).max(10),
      }),
    }),
    prompt: `Evaluate this marketing copy for:
    1. Presence of call to action (true/false)
    2. Emotional appeal (1-10)
    3. Clarity (1-10)

    Copy to evaluate: ${copy}`,
  });

  // If quality check fails, regenerate with more specific instructions
  if (
    !qualityMetrics.hasCallToAction ||
    qualityMetrics.emotionalAppeal < 7 ||
    qualityMetrics.clarity < 7
  ) {
    const { text: improvedCopy } = await generateText({
      model,
      prompt: `Rewrite this marketing copy with:
      ${!qualityMetrics.hasCallToAction ? '- A clear call to action' : ''}
      ${qualityMetrics.emotionalAppeal < 7 ? '- Stronger emotional appeal' : ''}
      ${qualityMetrics.clarity < 7 ? '- Improved clarity and directness' : ''}

      Original copy: ${copy}`,
    });
    return { copy: improvedCopy, qualityMetrics };
  }

  return { copy, qualityMetrics };
}
```

## Routing

This pattern lets the model decide which path to take through a workflow based on context and intermediate results. The model acts as an intelligent router, directing the flow of execution between different branches of your workflow. Use this when handling varied inputs that require different processing approaches. In the example below, the first LLM call's results determine the second call's model size and system prompt.

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

async function handleCustomerQuery(query: string) {
  const model = "anthropic/claude-sonnet-5.5";

  // First step: Classify the query type
  const { output: classification } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        reasoning: z.string(),
        type: z.enum(['general', 'refund', 'technical']),
        complexity: z.enum(['simple', 'complex']),
      }),
    }),
    prompt: `Classify this customer query:
    ${query}

    Determine:
    1. Query type (general, refund, or technical)
    2. Complexity (simple or complex)
    3. Brief reasoning for classification`,
  });

  // Route based on classification
  // Set model and system prompt based on query type and complexity
  const { text: response } = await generateText({
    model:
      classification.complexity === 'simple'
        ? 'openai/gpt-6-luna'
        : 'openai/gpt-6-astra',
    instructions: {
      general:
        'You are an expert customer service agent handling general inquiries.',
      refund:
        'You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.',
      technical:
        'You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.',
    }[classification.type],
    prompt: query,
  });

  return { response, classification };
}
```

## Parallel Processing

Break down tasks into independent subtasks that execute simultaneously. This pattern uses parallel execution to improve efficiency while maintaining the benefits of structured workflows. For example, analyze multiple documents or process different aspects of a single input concurrently (like code review).

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

// Example: Parallel code review with multiple specialized reviewers
async function parallelCodeReview(code: string) {
  const model = "anthropic/claude-sonnet-5.5";

  // Run parallel reviews
  const [securityReview, performanceReview, maintainabilityReview] =
    await Promise.all([
      generateText({
        model,
        instructions:
          'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.',
        output: Output.object({
          schema: z.object({
            vulnerabilities: z.array(z.string()),
            riskLevel: z.enum(['low', 'medium', 'high']),
            suggestions: z.array(z.string()),
          }),
        }),
        prompt: `Review this code:
      ${code}`,
      }),

      generateText({
        model,
        instructions:
          'You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.',
        output: Output.object({
          schema: z.object({
            issues: z.array(z.string()),
            impact: z.enum(['low', 'medium', 'high']),
            optimizations: z.array(z.string()),
          }),
        }),
        prompt: `Review this code:
      ${code}`,
      }),

      generateText({
        model,
        instructions:
          'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',
        output: Output.object({
          schema: z.object({
            concerns: z.array(z.string()),
            qualityScore: z.number().min(1).max(10),
            recommendations: z.array(z.string()),
          }),
        }),
        prompt: `Review this code:
      ${code}`,
      }),
    ]);

  const reviews = [
    { ...securityReview.output, type: 'security' },
    { ...performanceReview.output, type: 'performance' },
    { ...maintainabilityReview.output, type: 'maintainability' },
  ];

  // Aggregate results using another model instance
  const { text: summary } = await generateText({
    model,
    instructions: 'You are a technical lead summarizing multiple code reviews.',
    prompt: `Synthesize these code review results into a concise summary with key actions:
    ${JSON.stringify(reviews, null, 2)}`,
  });

  return { reviews, summary };
}
```

## Orchestrator-Worker

A primary model (orchestrator) coordinates the execution of specialized workers. Each worker optimizes for a specific subtask, while the orchestrator maintains overall context and ensures coherent results. This pattern excels at complex tasks requiring different types of expertise or processing.

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

async function implementFeature(featureRequest: string) {
  // Orchestrator: Plan the implementation
  const { output: implementationPlan } = await generateText({
    model: "anthropic/claude-sonnet-5.5",
    output: Output.object({
      schema: z.object({
        files: z.array(
          z.object({
            purpose: z.string(),
            filePath: z.string(),
            changeType: z.enum(['create', 'modify', 'delete']),
          }),
        ),
        estimatedComplexity: z.enum(['low', 'medium', 'high']),
      }),
    }),
    instructions:
      'You are a senior software architect planning feature implementations.',
    prompt: `Analyze this feature request and create an implementation plan:
    ${featureRequest}`,
  });

  // Workers: Execute the planned changes
  const fileChanges = await Promise.all(
    implementationPlan.files.map(async file => {
      // Each worker is specialized for the type of change
      const workerSystemPrompt = {
        create:
          'You are an expert at implementing new files following best practices and project patterns.',
        modify:
          'You are an expert at modifying existing code while maintaining consistency and avoiding regressions.',
        delete:
          'You are an expert at safely removing code while ensuring no breaking changes.',
      }[file.changeType];

      const { output: change } = await generateText({
        model: "anthropic/claude-sonnet-5.5",
        output: Output.object({
          schema: z.object({
            explanation: z.string(),
            code: z.string(),
          }),
        }),
        instructions: workerSystemPrompt,
        prompt: `Implement the changes for ${file.filePath} to support:
        ${file.purpose}

        Consider the overall feature context:
        ${featureRequest}`,
      });

      return {
        file,
        implementation: change,
      };
    }),
  );

  return {
    plan: implementationPlan,
    changes: fileChanges,
  };
}
```

## Evaluator-Optimizer

Add quality control to workflows with dedicated evaluation steps that assess intermediate results. Based on the evaluation, the workflow proceeds, retries with adjusted parameters, or takes corrective action. This creates robust workflows capable of self-improvement and error recovery.

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

async function translateWithFeedback(text: string, targetLanguage: string) {
  let currentTranslation = '';
  let iterations = 0;
  const MAX_ITERATIONS = 3;

  // Initial translation
  const { text: translation } = await generateText({
    model: "anthropic/claude-sonnet-5.5",
    instructions: 'You are an expert literary translator.',
    prompt: `Translate this text to ${targetLanguage}, preserving tone and cultural nuances:
    ${text}`,
  });

  currentTranslation = translation;

  // Evaluation-optimization loop
  while (iterations < MAX_ITERATIONS) {
    // Evaluate current translation
    const { output: evaluation } = await generateText({
      model: "anthropic/claude-sonnet-5.5",
      output: Output.object({
        schema: z.object({
          qualityScore: z.number().min(1).max(10),
          preservesTone: z.boolean(),
          preservesNuance: z.boolean(),
          culturallyAccurate: z.boolean(),
          specificIssues: z.array(z.string()),
          improvementSuggestions: z.array(z.string()),
        }),
      }),
      instructions: 'You are an expert in evaluating literary translations.',
      prompt: `Evaluate this translation:

      Original: ${text}
      Translation: ${currentTranslation}

      Consider:
      1. Overall quality
      2. Preservation of tone
      3. Preservation of nuance
      4. Cultural accuracy`,
    });

    // Check if quality meets threshold
    if (
      evaluation.qualityScore >= 8 &&
      evaluation.preservesTone &&
      evaluation.preservesNuance &&
      evaluation.culturallyAccurate
    ) {
      break;
    }

    // Generate improved translation based on feedback
    const { text: improvedTranslation } = await generateText({
      model: "anthropic/claude-sonnet-5.5",
      instructions: 'You are an expert literary translator.',
      prompt: `Improve this translation based on the following feedback:
      ${evaluation.specificIssues.join('\n')}
      ${evaluation.improvementSuggestions.join('\n')}

      Original: ${text}
      Current Translation: ${currentTranslation}`,
    });

    currentTranslation = improvedTranslation;
    iterations++;
  }

  return {
    finalTranslation: currentTranslation,
    iterationsRequired: iterations,
  };
}
```

---

For a semantic overview of all documentation, see [/sitemap.md](/sitemap.md)

For an index of all available documentation, see [/llms.txt](/llms.txt)

For agent-facing discovery, including API and MCP surfaces, see [/agents.md](/agents.md)

