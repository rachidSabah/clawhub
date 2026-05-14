import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const {
      messages,
      modelConfigId,
      temperature = 0.7,
      maxTokens = 4096,
    } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get the model config with auxiliary models (fallback chain)
    const config = modelConfigId
      ? await db.modelConfig.findUnique({ where: { id: modelConfigId } })
      : null;

    const zai = await ZAI.create();

    // Try primary model first, then fallback to auxiliary models
    const models: string[] = [config?.modelId || 'default'];
    if (config?.auxiliaryModels) {
      try {
        const aux = JSON.parse(config.auxiliaryModels);
        if (Array.isArray(aux)) models.push(...aux);
      } catch {
        // auxiliaryModels is not valid JSON, skip
      }
    }

    let lastError: string | null = null;
    for (const model of models) {
      try {
        const completion = await zai.chat.completions.create({
          messages: messages.map(
            (m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })
          ),
          temperature,
          max_tokens: maxTokens,
        });

        return Response.json({
          content: completion.choices[0]?.message?.content || '',
          model,
          usage: completion.usage,
        });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'Unknown model error';
        console.warn(
          `Model ${model} failed, trying next fallback:`,
          lastError
        );
        continue;
      }
    }

    return Response.json(
      { error: `All models failed. Last error: ${lastError}` },
      { status: 502 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
