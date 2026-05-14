import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAILLM from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, input = '' } = body

    if (!name) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 })
    }

    // Find the skill by name
    const skill = await db.skill.findFirst({
      where: { name, isActive: true },
    })

    if (!skill) {
      return NextResponse.json({ error: `Skill "${name}" not found or inactive` }, { status: 404 })
    }

    // Substitute {{input}} variables in the skill content
    let resolvedContent = skill.content
    if (input) {
      // Replace {{input}} placeholder
      resolvedContent = resolvedContent.replace(/\{\{input\}\}/g, input)
      // Also support {{INPUT}} and {{ user_input }}
      resolvedContent = resolvedContent.replace(/\{\{INPUT\}\}/g, input)
      resolvedContent = resolvedContent.replace(/\{\{\s*user_input\s*\}\}/g, input)
    }

    // Extract other variables like {{variable_name}} that weren't substituted
    const remainingVars = [...new Set(resolvedContent.match(/\{\{(\w+)\}\}/g) || [])]
    if (remainingVars.length > 0 && !input) {
      // If there are unsubstituted variables and no input was provided,
      // use the input as a generic substitution for all remaining vars
      for (const v of remainingVars) {
        resolvedContent = resolvedContent.replace(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), input || '')
      }
    }

    // Execute the skill prompt through z-ai-web-dev-sdk
    try {
      const ai = new ZAILLM()
      const completion = await ai.chat.completions.create({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: `You are executing the "${skill.name}" skill. ${skill.description || ''}`,
          },
          {
            role: 'user',
            content: resolvedContent,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      })

      const result = completion.choices?.[0]?.message?.content || 'No result returned'

      return NextResponse.json({
        success: true,
        skillName: skill.name,
        input: input || null,
        result,
        metadata: {
          model: 'glm-4-flash',
          tokenUsage: completion.usage || null,
        },
      })
    } catch (aiError: unknown) {
      const errMsg = aiError instanceof Error ? aiError.message : 'AI execution failed'
      return NextResponse.json({
        success: false,
        skillName: skill.name,
        error: errMsg,
      }, { status: 502 })
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[skills/execute] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
