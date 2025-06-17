#!/usr/bin/env node

/**
 * Utility script to manually process pending URL metadata
 * Usage: node scripts/process-metadata.js
 */

const BASE_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'

async function processMetadata() {
  try {
    console.log('🔍 Checking metadata processing stats...')
    
    // Check current stats
    const statsResponse = await fetch(`${BASE_URL}/api/metadata`)
    const stats = await statsResponse.json()
    
    if (!stats.success) {
      throw new Error('Failed to fetch metadata stats')
    }
    
    console.log(`📊 Current stats:`)
    console.log(`   Pending: ${stats.stats.pending}`)
    console.log(`   Successful: ${stats.stats.successful}`)
    console.log(`   Failed: ${stats.stats.failed}`)
    console.log(`   Total: ${stats.stats.total}`)
    
    if (stats.stats.pending === 0) {
      console.log('✅ No pending URLs to process!')
      return
    }
    
    console.log(`\n🚀 Processing ${stats.stats.pending} pending URLs...`)
    
    // Process pending URLs
    const processResponse = await fetch(`${BASE_URL}/api/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const result = await processResponse.json()
    
    if (!result.success) {
      throw new Error(`Processing failed: ${result.error}`)
    }
    
    console.log(`✅ Processing complete!`)
    console.log(`   Processed: ${result.processed}`)
    console.log(`   Successful: ${result.successful}`)
    console.log(`   Failed: ${result.failed}`)
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

processMetadata() 