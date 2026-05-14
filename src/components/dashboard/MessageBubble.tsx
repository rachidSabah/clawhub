'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Bot, User, Wrench, Eye, Lightbulb, Copy, Check } from 'lucide-react'
import type { Message, MessageRole } from '@/lib/types'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion } from 'framer-motion'

const roleConfig: Record<MessageRole, { icon: typeof Bot; label: string; color: string }> = {
  'user': { icon: User, label: 'You', color: 'bg-primary text-primary-foreground' },
  'assistant': { icon: Bot, label: 'ClawHub', color: 'bg-emerald-500/10 text-emerald-600' },
  'system': { icon: Wrench, label: 'System', color: 'bg-amber-500/10 text-amber-600' },
  'agent-thought': { icon: Lightbulb, label: 'Thought', color: 'bg-violet-500/10 text-violet-600' },
  'agent-action': { icon: Wrench, label: 'Action', color: 'bg-cyan-500/10 text-cyan-600' },
  'agent-observation': { icon: Eye, label: 'Observation', color: 'bg-blue-500/10 text-blue-600' },
}

interface ParsedSegment {
  type: 'text' | 'code-block' | 'inline-code' | 'bold' | 'italic' | 'link' | 'heading' | 'image'
  content: string
  language?: string
  href?: string
  alt?: string
}

function parseMarkdown(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  let remaining = content

  while (remaining.length > 0) {
    // Check for code blocks (```language\n...\n```)
    const codeBlockMatch = remaining.match(/^```(\w*)\n([\s\S]*?)```/)
    if (codeBlockMatch) {
      segments.push({ type: 'code-block', content: codeBlockMatch[2], language: codeBlockMatch[1] || 'text' })
      remaining = remaining.slice(codeBlockMatch[0].length)
      // consume trailing newlines
      remaining = remaining.replace(/^\n+/, '')
      continue
    }

    // Check for image markdown: ![alt](url)
    const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (imageMatch) {
      segments.push({ type: 'image', content: imageMatch[2], alt: imageMatch[1] })
      remaining = remaining.slice(imageMatch[0].length)
      continue
    }

    // Check for heading (## heading)
    const headingMatch = remaining.match(/^(#{1,6})\s+(.+?)(\n|$)/)
    if (headingMatch) {
      segments.push({ type: 'heading', content: headingMatch[2] })
      remaining = remaining.slice(headingMatch[0].length)
      continue
    }

    // Find the next special token
    const nextSpecial = remaining.search(/[`*_\[!#]/)
    if (nextSpecial === -1) {
      // No more special tokens, rest is plain text
      if (remaining) segments.push({ type: 'text', content: remaining })
      break
    }

    // Add any plain text before the special token
    if (nextSpecial > 0) {
      segments.push({ type: 'text', content: remaining.slice(0, nextSpecial) })
      remaining = remaining.slice(nextSpecial)
    }

    // Inline code (`code`)
    const inlineCodeMatch = remaining.match(/^`([^`]+)`/)
    if (inlineCodeMatch) {
      segments.push({ type: 'inline-code', content: inlineCodeMatch[1] })
      remaining = remaining.slice(inlineCodeMatch[0].length)
      continue
    }

    // Bold (**text** or __text__)
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      segments.push({ type: 'bold', content: boldMatch[1] })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic (*text* or _text_)
    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      segments.push({ type: 'italic', content: italicMatch[1] })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      segments.push({ type: 'link', content: linkMatch[1], href: linkMatch[2] })
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // If none matched, consume one character and continue
    segments.push({ type: 'text', content: remaining[0] })
    remaining = remaining.slice(1)
  }

  return segments
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useMemo(() => [false], [])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    // We need a simple state toggle, but using a workaround for no state
    const btn = document.activeElement as HTMLButtonElement
    if (btn) {
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
      setTimeout(() => {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'
      }, 2000)
    }
  }

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
          aria-label="Copy code"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '12px', padding: '12px' }}
        showLineNumbers={code.split('\n').length > 3}
      >
        {code.trimEnd()}
      </SyntaxHighlighter>
    </div>
  )
}

function RenderSegments({ segments }: { segments: ParsedSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'text':
            return <span key={i}>{seg.content}</span>
          case 'code-block':
            return <CodeBlock key={i} code={seg.content} language={seg.language || 'text'} />
          case 'inline-code':
            return (
              <code key={i} className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-emerald-600 dark:text-emerald-400">
                {seg.content}
              </code>
            )
          case 'bold':
            return <strong key={i} className="font-semibold">{seg.content}</strong>
          case 'italic':
            return <em key={i}>{seg.content}</em>
          case 'link':
            return (
              <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:underline">
                {seg.content}
              </a>
            )
          case 'heading':
            return <div key={i} className="font-semibold text-base mt-2 mb-1">{seg.content}</div>
          case 'image':
            // Check if it's a base64 data image
            if (seg.content.startsWith('data:image')) {
              return (
                <img key={i} src={seg.content} alt={seg.alt || 'Generated image'}
                  className="max-w-full rounded-lg my-2 border border-border" />
              )
            }
            return (
              <img key={i} src={seg.content} alt={seg.alt || 'Image'}
                className="max-w-full rounded-lg my-2 border border-border" />
            )
          default:
            return <span key={i}>{seg.content}</span>
        }
      })}
    </>
  )
}

export function MessageBubble({ message }: { message: Message & { isStreaming?: boolean } }) {
  const config = roleConfig[message.role] || roleConfig.assistant
  const Icon = config.icon
  const isUser = message.role === 'user'

  const segments = useMemo(() => parseMarkdown(message.content), [message.content])

  return (
    <motion.div
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', config.color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className={cn('flex-1 min-w-0 rounded-xl px-4 py-3 text-sm', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted/50')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{config.label}</span>
          {message.isStreaming && (
            <motion.span
              className="text-[10px] text-muted-foreground"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              typing...
            </motion.span>
          )}
        </div>
        <div className="break-words leading-relaxed">
          <RenderSegments segments={segments} />
        </div>
      </div>
    </motion.div>
  )
}
