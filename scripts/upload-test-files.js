const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadTestFiles() {
  try {
    console.log('Starting test file upload...')
    
    const userId = '706ae395-3cb8-400c-a144-f5bf0d6429e6'
    
    // Upload employment contract
    const contractContent = fs.readFileSync(path.join(__dirname, '../test-files/employment-contract.txt'))
    const contractPath = `${userId}/documents/employment-contract.pdf`
    
    const { data: contractData, error: contractError } = await supabase.storage
      .from('legal-documents')
      .upload(contractPath, contractContent, {
        contentType: 'application/pdf',
        upsert: true
      })
    
    if (contractError) {
      console.error('Error uploading contract:', contractError)
    } else {
      console.log('✅ Employment contract uploaded:', contractData.path)
    }
    
    // Upload legal memo
    const memoContent = fs.readFileSync(path.join(__dirname, '../test-files/legal-memo.txt'))
    const memoPath = `${userId}/documents/memo.docx`
    
    const { data: memoData, error: memoError } = await supabase.storage
      .from('legal-documents')
      .upload(memoPath, memoContent, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      })
    
    if (memoError) {
      console.error('Error uploading memo:', memoError)
    } else {
      console.log('✅ Legal memo uploaded:', memoData.path)
    }
    
    console.log('Test file upload completed!')
    
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

uploadTestFiles()
