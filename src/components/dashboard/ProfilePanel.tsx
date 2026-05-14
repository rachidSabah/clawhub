'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { updateUserProfile } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { User, FileText, FolderOpen, Save } from 'lucide-react'

export function ProfilePanel() {
  const { userProfile, loadUserProfile } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [homeDir, setHomeDir] = useState('')
  const [soulMd, setSoulMd] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [loadUserProfile])

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '')
      setEmail(userProfile.email || '')
      setHomeDir(userProfile.homeDir || '')
      setSoulMd(userProfile.soulMd || '')
    }
  }, [userProfile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUserProfile({
        name,
        homeDir,
        soulMd,
      })
      loadUserProfile()
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-4">
      {/* User Info */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-emerald-500" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 text-[11px]"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-7 text-[11px]"
              placeholder="email@example.com"
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <FolderOpen className="w-3 h-3" /> Home Directory
            </label>
            <Input
              value={homeDir}
              onChange={(e) => setHomeDir(e.target.value)}
              className="h-7 text-[11px]"
              placeholder="/path/to/workspace"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-[8px] h-4 px-1 bg-emerald-500/10 text-emerald-600">
              {userProfile?.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {userProfile?.lastActiveAt && (
              <span className="text-[9px] text-muted-foreground">
                Last active: {new Date(userProfile.lastActiveAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SOUL.md Persona */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            SOUL.md Persona
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Define your AI agent&apos;s personality, behavior, and core instructions.
          </p>
          <Textarea
            value={soulMd}
            onChange={(e) => setSoulMd(e.target.value)}
            className="min-h-[120px] text-[10px] font-mono"
            placeholder={`# My Agent Persona\n\nYou are a helpful AI assistant that...\n\n## Core Values\n- ...\n\n## Behavior\n- ...`}
          />
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">{soulMd.length} chars</span>
            <Button
              size="sm"
              className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-3 h-3 mr-1" /> {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Preview */}
      {userProfile?.preferences && Object.keys(userProfile.preferences).length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1">
              {Object.entries(userProfile.preferences).map(([key, value]) => (
                <div key={key} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
