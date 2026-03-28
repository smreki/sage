import { sleep } from "@/lib/utils/sleep";

import type { AIProviderClient, AIProviderSession } from "@/lib/ai/providers";

export async function shutdownProvider(session: AIProviderSession | undefined, client: AIProviderClient | undefined) {
  if (!client) {
    return;
  }

  await Promise.race([
    client.shutdown(session),
    sleep(3_000)
  ]);
}
