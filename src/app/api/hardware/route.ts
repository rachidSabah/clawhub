import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import os from 'os'

export async function GET() {
  try {
    let existing = await db.hardwareProfile.findFirst()
    
    const platform = os.platform()
    const arch = os.arch()
    const cpuCores = os.cpus().length
    const cpuModel = os.cpus()[0]?.model || 'Unknown'
    const totalRamGB = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10

    let gpuInfo: string | null = null
    try {
      if (platform === 'linux') {
        const gpu = execSync('lspci 2>/dev/null | grep -i vga || echo "Unknown"', { encoding: 'utf8', timeout: 5000 }).trim()
        gpuInfo = JSON.stringify({ gpu })
      } else if (platform === 'win32') {
        const gpu = execSync('wmic path win32_VideoController get name 2>nul | findstr /v "Name" || echo "Unknown"', { encoding: 'utf8', timeout: 5000 }).trim()
        gpuInfo = JSON.stringify({ gpu })
      }
    } catch { gpuInfo = null }

    if (existing) {
      existing = await db.hardwareProfile.update({
        where: { id: existing.id },
        data: { platform, arch, cpuCores, cpuModel, totalRamGB, gpuInfo, updatedAt: new Date() },
      })
    } else {
      existing = await db.hardwareProfile.create({
        data: { platform, arch, cpuCores, cpuModel, totalRamGB, gpuInfo },
      })
    }

    // Compute recommended settings
    const recommendedModels = []
    if (totalRamGB >= 32 && cpuCores >= 8) recommendedModels.push('heavy', 'balanced', 'light')
    else if (totalRamGB >= 16 && cpuCores >= 4) recommendedModels.push('balanced', 'light')
    else recommendedModels.push('light')

    const maxContextWindow = totalRamGB >= 32 ? 200000 : totalRamGB >= 16 ? 128000 : 32000
    const maxConcurrent = Math.max(1, Math.floor(cpuCores / 2))

    return NextResponse.json({
      hardware: existing,
      recommendations: {
        performanceProfile: recommendedModels[0],
        maxContextWindow,
        maxConcurrentAgents: maxConcurrent,
        suggestedTemperature: totalRamGB >= 16 ? 0.7 : 0.5,
        canRunLocalModels: totalRamGB >= 16 && cpuCores >= 4,
      },
    })
  } catch (error) {
    console.error('Hardware detection failed:', error)
    return NextResponse.json({ error: 'Hardware detection failed' }, { status: 500 })
  }
}
