> ## Documentation Index
> Fetch the complete documentation index at: https://docs.platform.decart.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Virtual Try-On

> Dress people in live or recorded video with text prompts, garment images, or both.

Try on clothing and accessories in realtime. Stream a live camera feed, describe the outfit or provide a reference image of the garment, and Lucy VTON will realistically dress the subject while preserving motion and body shape — all with minimal latency.

## Quick start (Realtime)

<CodeGroup>
  ```tsx JavaScript SDK theme={null}
  import { createDecartClient, models } from "@decartai/sdk";

  const model = models.realtime("lucy-vton-latest");

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: {
      frameRate: model.fps,
      width: model.width,
      height: model.height,
    },
  });

  const client = createDecartClient({ apiKey: "your-api-key-here" });

  const realtimeClient = await client.realtime.connect(stream, {
    model,
    mirror: "auto",
    onRemoteStream: (editedStream) => {
      document.querySelector("#video-output").srcObject = editedStream;
    },
  });

  // Try on with a garment image and descriptive prompt
  const garmentFile = document.querySelector('input[type="file"]').files[0];
  await realtimeClient.set({
    prompt: "Substitute the current top with a navy blue hoodie with a white cross logo on the chest",
    image: garmentFile,
    enhance: false,
  });

  // Disconnect when done
  realtimeClient.disconnect();
  ```

  ```python Python SDK theme={null}
  from decart import models
  from decart.realtime import RealtimeClient, RealtimeConnectOptions
  from decart.types import ModelState

  model = models.realtime("lucy-vton-latest")

  realtime_client = await RealtimeClient.connect(
      api_key="your-api-key-here",
      stream=camera_stream,
      options=RealtimeConnectOptions(
          model=model,
          initial_state=ModelState(
              prompt="Substitute the current top with a red leather jacket with a zip front",
          ),
          on_remote_stream=lambda edited_stream: handle_stream(edited_stream),
      ),
  )

  # Change outfit on the fly
  await realtime_client.set_prompt("Substitute the current top with a blue denim jacket with a relaxed fit")

  # Disconnect when done
  await realtime_client.disconnect()
  ```

  ```kotlin Android SDK theme={null}
  import ai.decart.sdk.DecartClient
  import ai.decart.sdk.DecartClientConfig
  import ai.decart.sdk.RealtimeModels
  import ai.decart.sdk.realtime.ConnectOptions
  import ai.decart.sdk.realtime.InitialPrompt

  val client = DecartClient(context, DecartClientConfig(apiKey = "your-api-key"))
  val realtime = client.realtime

  realtime.initialize(eglBase)

  realtime.connect(
      localVideoTrack = cameraTrack,
      localAudioTrack = null,
      options = ConnectOptions(
          model = RealtimeModels.LUCY_VTON_3_5,
          onRemoteVideoTrack = { track ->
              remoteRenderer.addSink(track)
          },
          initialPrompt = InitialPrompt("Substitute the current top with a red leather jacket with a zip front")
      )
  )

  // Change outfit on the fly
  realtime.setPrompt("Substitute the current top with a blue denim jacket with a relaxed fit", enhance = true)
  ```

  ```swift Swift SDK theme={null}
  import DecartSDK

  let config = DecartConfiguration(apiKey: "your-api-key-here")
  let client = DecartClient(decartConfiguration: config)

  let model = Models.realtime(.lucyVton3_5)

  let realtimeManager = try await client.realtime.connect(
      stream: cameraStream,
      model: model,
      initialState: .init(prompt: "Substitute the current top with a red leather jacket with a zip front")
  ) { editedStream in
      // Display the edited video
      videoView.stream = editedStream
  }

  // Change outfit on the fly
  try await realtimeManager.setPrompt("Substitute the current top with a blue denim jacket with a relaxed fit")
  ```
</CodeGroup>

### Realtime Parameters

* **`prompt`** — Text description of the outfit change. Use the **substitute** or **add** patterns described in the [VTON 3.5 Prompting Guide](/models/realtime/vton-3.5-prompting).
* **`image`** — A garment reference image to guide the try-on. Supported formats: JPEG, PNG, WebP.
* **`enhance`** — Whether to auto-enhance the prompt (default: `true`). Set to `false` when you provide detailed prompts yourself.
* **`speed`** — Connect-time option. `"fast"` opts into [fast mode](#fast-mode): lower latency and higher throughput, billed at 2x the standard realtime rate. Omit for standard mode.

<Tip>`set()` replaces the entire state — fields you omit are cleared. Always include every field you want to keep.</Tip>

### Fast mode

Fast mode (`speed: "fast"`) gives the session lower latency and higher throughput; output quality is unchanged. It is available for `lucy-2.5` / `lucy-latest` and `lucy-vton-3.5` / `lucy-vton-latest` and is billed at 2x the standard realtime rate for those models. Other models ignore the option. Omit it (the default) for standard mode. See [Pricing](/getting-started/pricing#realtime-models).

Fast mode is a connect-time setting: pass `speed: "fast"` when connecting. Changing it requires a reconnect; it can't be toggled mid-session with `set()`.

<CodeGroup>
  ```tsx JavaScript SDK theme={null}
  const realtimeClient = await client.realtime.connect(stream, {
    model,
    mirror: "auto",
    speed: "fast", // fast mode
    onRemoteStream: (editedStream) => {
      document.querySelector("#video-output").srcObject = editedStream;
    },
  });
  ```

  ```python Python SDK theme={null}
  options = RealtimeConnectOptions(
      model=model,
      on_remote_stream=on_remote_stream,
      speed="fast",  # fast mode
  )
  ```

  ```text Raw WebSocket theme={null}
  wss://api3.decart.ai/v1/stream?api_key=YOUR_API_KEY&model=lucy-vton-3.5&speed=fast
  ```
</CodeGroup>

<Note>
  Standard mode is the *absence* of the option — don't send `speed=standard`. The option ships in [JavaScript](/sdks/javascript-realtime#fast-mode) v0.2.2, [Python](/sdks/python-realtime#fast-mode) v0.2.1, [Android](/sdks/android-realtime#fast-mode) 0.8.1 and [Swift](/sdks/swift-realtime#fast-mode) v0.7.1; on earlier `@decartai/sdk` versions pass `queryParams: { speed: "fast" }` instead.
</Note>

### Using Reference Images

For the best results, provide a **garment reference image** paired with a **descriptive prompt**. This gives the model the clearest signal of what to apply.

```tsx theme={null}
// Best approach: reference image + descriptive prompt
await realtimeClient.set({
  prompt: "Substitute the current top with a black bomber jacket with a blue logo on the chest and a zip front",
  image: garmentFile,
  enhance: false,
});

// Reference image only — the model dresses the person to match
await realtimeClient.set({ image: garmentFile });
```

**Reference image tips:**

* **Clean garment images work best** — just the clothing item, no person wearing it
* **White or plain backgrounds** are ideal
* **At least 512×512 pixels** — the model reproduces what it sees, so a clear image produces better results
* If your source image shows a person wearing the garment, consider using an image editing model to extract just the clothing item first

### Dynamic Outfit Changes

Switch outfits instantly during a live session — call `setPrompt()` or `set()` again at any time without reconnecting:

```tsx theme={null}
// Start with a casual look
realtimeClient.setPrompt("Substitute the current top with a grey crewneck sweatshirt with a large blue logo on the front");

// Switch to formal
realtimeClient.setPrompt("Substitute the current top with a navy blue blazer, worn over a light blue dress shirt");

// Try an accessory
realtimeClient.setPrompt("Add a black baseball cap with a blue logo to the person's head");
```

### Client Token Security

In production, never expose your permanent API key (`dct_*`) to the browser. Instead, create a short-lived **client token** on your server and pass it to the frontend:

```typescript theme={null}
// Server: app/api/tokens/route.ts
import { createDecartClient } from "@decartai/sdk";

export async function POST() {
  const client = createDecartClient({ apiKey: process.env.DECART_API_KEY });
  const token = await client.tokens.create();
  return Response.json(token);
}
```

```typescript theme={null}
// Client: fetch token, then connect
const res = await fetch("/api/tokens", { method: "POST" });
const { apiKey } = await res.json();

const client = createDecartClient({ apiKey }); // short-lived client token, never your dct_ key
const rtClient = await client.realtime.connect(stream, { model, onRemoteStream });
```

<Note>
  Client tokens have a 10-minute TTL. Create a new token each time a user opens a try-on session. Active WebRTC sessions continue working even after the token expires. See the [Client Tokens guide](/getting-started/client-tokens) for details.
</Note>

## Prompting

For how to write effective try-on prompts — patterns, examples, and common mistakes — see the [VTON 3.5 Prompting Guide](/models/realtime/vton-3.5-prompting).

### Generating Prompts with an LLM

For user-uploaded garment images where you don't have a pre-written prompt, you can use any vision LLM (GPT-4o-mini, Claude, Gemini) to auto-generate a descriptive prompt from the garment image:

```typescript theme={null}
// Send the garment image (and optionally a camera frame) to your LLM
const formData = new FormData();
formData.append("image", garmentBlob);
formData.append("personFrame", cameraFrameBlob); // optional — improves accuracy

const res = await fetch("/api/enhance-prompt", { method: "POST", body: formData });
const { prompt } = await res.json();
// → "Substitute the grey crewneck sweater with a blue and pink flame print hoodie with an oversized fit"
```

<Tip>
  Sending a camera frame of the person gives the LLM context about what they're currently wearing, so it generates more accurate prompts (e.g. "Substitute the grey sweater" instead of generic "Substitute the current top").
</Tip>

### Extracting Clothing from Model Photos

When users upload photos from fashion websites where a model is wearing the garment, the image contains a person and background rather than a clean garment shot. Use an image editing model to extract just the clothing item on a white background before sending it to the try-on model.

## Batch API

Lucy VTON is also available as a batch/queue model for processing pre-recorded videos asynchronously. Submit a job, poll for completion, then download the result.

<CodeGroup>
  ```bash Curl theme={null}
  # Submit job
  JOB_ID=$(curl -s -X POST https://api.decart.ai/v1/jobs/lucy-vton-3.5 \
    -H "X-API-KEY: $DECART_API_KEY" \
    -F "data=@person.mp4" \
    -F "prompt=Substitute the current top with a red leather jacket with a zip front" \
    -F "reference_image=@garment.jpg" | jq -r '.job_id')

  # Poll until completed
  while true; do
    STATUS=$(curl -s -H "X-API-KEY: $DECART_API_KEY" \
      https://api.decart.ai/v1/jobs/$JOB_ID | jq -r '.status')
    echo "Status: $STATUS"
    [ "$STATUS" = "completed" ] && break
    [ "$STATUS" = "failed" ] && exit 1
    sleep 2
  done

  # Download result
  curl -H "X-API-KEY: $DECART_API_KEY" \
    https://api.decart.ai/v1/jobs/$JOB_ID/content --output output.mp4
  ```

  ```javascript JavaScript SDK theme={null}
  import { createDecartClient, models } from "@decartai/sdk";
  import { readFileSync, writeFileSync } from "fs";

  const client = createDecartClient({ apiKey: "your-api-key-here" });

  const videoBuffer = readFileSync("person.mp4");
  const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

  const imageBuffer = readFileSync("garment.jpg");
  const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });

  const result = await client.queue.submitAndPoll({
    model: models.video("lucy-vton-3.5"),
    prompt: "Substitute the current top with a red leather jacket with a zip front",
    data: videoBlob,
    reference_image: imageBlob,
    onStatusChange: (job) => console.log(`Status: ${job.status}`),
  });

  if (result.status === "completed") {
    const buffer = Buffer.from(await result.data.arrayBuffer());
    writeFileSync("output.mp4", buffer);
  }
  ```

  ```python Python SDK theme={null}
  import asyncio
  from decart import DecartClient, models

  async def virtual_try_on():
      async with DecartClient(api_key="your-api-key-here") as client:
          with open("person.mp4", "rb") as video_file:
              with open("garment.jpg", "rb") as garment_image:
                  result = await client.queue.submit_and_poll({
                      "model": models.video("lucy-vton-3.5"),
                      "prompt": "Substitute the current top with a red leather jacket with a zip front",
                      "data": video_file,
                      "reference_image": garment_image,
                      "on_status_change": lambda job: print(f"Status: {job.status}"),
                  })

          if result.status == "completed":
              with open("output.mp4", "wb") as f:
                  f.write(result.data)

  asyncio.run(virtual_try_on())
  ```
</CodeGroup>

### Batch Parameters

* `data` (**required**) — Input video of the person to dress.
* `prompt` (**optional**) — Text description of the outfit change. Use the substitute/add patterns from the [prompting guide](/models/realtime/vton-3.5-prompting). Defaults to empty string.
* `reference_image` (**optional**) — An image of the garment or accessory to try on.
* `resolution` (**optional**) — Output resolution: `720p` (default).
* `seed` (**optional**) — Seed for reproducible generation (0–4294967295).
* `enhance_prompt` (**optional**) — Whether to enhance the prompt (default: `true`).

### Video Requirements

* **Format:** MP4 (H.264 or VP8 codec)
* **Aspect Ratio:** 16:9 (landscape) or 9:16 (portrait) — a 2:1 (landscape) / 1:2 (portrait) shape is also supported
* **File Size:** Maximum 200MB
* **Output Resolution:** 1280×720 / 720×1280 (16:9 / 9:16) or 1280×640 / 640×1280 (2:1 / 1:2)

VTON infers the aspect ratio from the input video stream and maps it to the nearest supported generation shape.

## Next steps

<CardGroup>
  <Card icon="cube" title="Try in the Platform" href="https://platform.decart.ai/models/lucy-vton">
    Try virtual try-on in the interactive platform.
  </Card>

  <Card icon="code" title="Batch API Reference" href="/api-reference/lucy-vton-latest">
    Full API documentation for the batch virtual try-on endpoint.
  </Card>

  <Card icon="bolt" title="Streaming Best Practices" href="/models/realtime/streaming-best-practices">
    Optimize your realtime integration for the best experience.
  </Card>

  <Card icon="github" title="Try-On Examples" href="https://github.com/DecartAI/tryon-examples">
    Production-ready examples: e-commerce, digital mirror, outfit builder, and more.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

