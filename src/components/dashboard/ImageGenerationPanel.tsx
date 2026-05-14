'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Image, Loader2, Download } from 'lucide-react'

export function ImageGenerationPanel() {
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState('1024x1024')
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState<Array<{ prompt: string; image: string; timestamp: string }>>([])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/chat/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), size }),
      })
      const data = await res.json()
      if (data.image) {
        setImages(prev => [{ prompt: prompt.trim(), image: data.image, timestamp: new Date().toISOString() }, ...prev])
        setPrompt('')
      } else if (data.error) {
        console.error('Image generation error:', data.error)
      }
    } catch (error) {
      console.error('Image generation failed:', error)
    }
    setGenerating(false)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="text-sm"
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <div className="flex gap-2">
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1024x1024">1024 × 1024</SelectItem>
              <SelectItem value="768x1344">768 × 1344</SelectItem>
              <SelectItem value="1344x768">1344 × 768</SelectItem>
              <SelectItem value="1152x864">1152 × 864</SelectItem>
              <SelectItem value="1440x720">1440 × 720</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="flex-1 h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {images.map((img, i) => (
          <Card key={i}>
            <CardContent className="p-2">
              <img src={`data:image/png;base64,${img.image}`} alt={img.prompt} className="w-full rounded-lg" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">{img.prompt}</span>
                <a href={`data:image/png;base64,${img.image}`} download={`clawhub-image-${i}.png`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
        {images.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Generate images from text descriptions</p>
          </div>
        )}
      </div>
    </div>
  )
}
