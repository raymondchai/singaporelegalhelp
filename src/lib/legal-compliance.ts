// Legal Compliance and Quality Assurance for Singapore Legal Help
// Implements response validation, professional disclaimers, and compliance checks

export interface ComplianceCheck {
  isCompliant: boolean
  issues: ComplianceIssue[]
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
}

export interface ComplianceIssue {
  type: 'legal_advice' | 'unauthorized_practice' | 'misleading_info' | 'privacy_concern' | 'accuracy_concern'
  severity: 'warning' | 'error' | 'critical'
  message: string
  suggestion: string
}

export interface ResponseValidation {
  isValid: boolean
  confidence: number
  qualityScore: number
  issues: string[]
  enhancements: string[]
}

export class LegalComplianceService {
  private readonly prohibitedPhrases = [
    // Direct legal advice indicators
    'you should definitely',
    'i recommend you',
    'you must do',
    'the best option is',
    'i advise you to',
    'my legal opinion',
    'as your lawyer',
    'i guarantee',
    'you will win',
    'you have no case',
    
    // Unauthorized practice indicators
    'i am a lawyer',
    'as a qualified lawyer',
    'i can represent you',
    'i will handle your case',
    'hire me as',
    'my legal services',
    
    // Misleading certainty
    'this will definitely',
    'you are guaranteed',
    'there is no doubt',
    'absolutely certain',
    'without question'
  ]

  private readonly requiredDisclaimers = [
    'general information',
    'not legal advice',
    'consult',
    'qualified lawyer',
    'singapore'
  ]

  private readonly sensitiveTopics = [
    'criminal charges',
    'court proceedings',
    'legal representation',
    'specific case advice',
    'urgent legal matters',
    'immigration status',
    'visa applications',
    'deportation',
    'arrest',
    'police investigation'
  ]

  validateResponse(response: string, query: string, confidence: number): ResponseValidation {
    const issues: string[] = []
    const enhancements: string[] = []
    let qualityScore = 100

    // Check for prohibited phrases
    const prohibitedFound = this.prohibitedPhrases.filter(phrase => 
      response.toLowerCase().includes(phrase.toLowerCase())
    )
    
    if (prohibitedFound.length > 0) {
      issues.push(`Contains prohibited phrases: ${prohibitedFound.join(', ')}`)
      qualityScore -= 30
    }

    // Check for required disclaimers
    const disclaimerPresent = this.requiredDisclaimers.some(disclaimer =>
      response.toLowerCase().includes(disclaimer.toLowerCase())
    )

    if (!disclaimerPresent) {
      issues.push('Missing required legal disclaimer')
      qualityScore -= 20
    }

    // Check response length and structure
    if (response.length < 50) {
      issues.push('Response too short - may not be helpful')
      qualityScore -= 15
    }

    if (response.length > 2000) {
      enhancements.push('Consider breaking down long responses into sections')
      qualityScore -= 5
    }

    // Check for Singapore-specific context
    const singaporeTerms = ['singapore', 'sg', 'acra', 'mom', 'ica', 'hdb', 'cpf']
    const hasSingaporeContext = singaporeTerms.some(term =>
      response.toLowerCase().includes(term) || query.toLowerCase().includes(term)
    )

    if (!hasSingaporeContext) {
      enhancements.push('Consider adding Singapore-specific context')
      qualityScore -= 10
    }

    // Confidence-based adjustments
    if (confidence < 0.5) {
      issues.push('Low confidence response - may need human review')
      qualityScore -= 25
    } else if (confidence < 0.7) {
      enhancements.push('Medium confidence - consider additional sources')
      qualityScore -= 10
    }

    return {
      isValid: issues.length === 0,
      confidence,
      qualityScore: Math.max(0, qualityScore),
      issues,
      enhancements
    }
  }

  checkCompliance(response: string, query: string, userContext?: any): ComplianceCheck {
    const issues: ComplianceIssue[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const recommendations: string[] = []

    // Check for direct legal advice
    const directAdviceIndicators = [
      'you should',
      'i recommend',
      'you must',
      'the best approach',
      'you need to'
    ]

    const hasDirectAdvice = directAdviceIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    )

    if (hasDirectAdvice) {
      issues.push({
        type: 'legal_advice',
        severity: 'warning',
        message: 'Response may contain direct legal advice',
        suggestion: 'Rephrase to provide general information instead of specific advice'
      })
      riskLevel = 'medium'
    }

    // Check for sensitive topics
    const containsSensitiveTopic = this.sensitiveTopics.some(topic =>
      query.toLowerCase().includes(topic) || response.toLowerCase().includes(topic)
    )

    if (containsSensitiveTopic) {
      issues.push({
        type: 'privacy_concern',
        severity: 'error',
        message: 'Query or response involves sensitive legal matters',
        suggestion: 'Add stronger disclaimer and recommend immediate legal consultation'
      })
      riskLevel = 'high'
      recommendations.push('Recommend immediate consultation with qualified lawyer')
    }

    // Check for unauthorized practice indicators
    const unauthorizedPracticeFound = this.prohibitedPhrases
      .filter(phrase => phrase.includes('lawyer') || phrase.includes('represent'))
      .some(phrase => response.toLowerCase().includes(phrase))

    if (unauthorizedPracticeFound) {
      issues.push({
        type: 'unauthorized_practice',
        severity: 'critical',
        message: 'Response may constitute unauthorized practice of law',
        suggestion: 'Remove any language that suggests legal representation or professional services'
      })
      riskLevel = 'high'
    }

    // Check disclaimer adequacy
    const hasAdequateDisclaimer = this.hasAdequateDisclaimer(response)
    if (!hasAdequateDisclaimer) {
      issues.push({
        type: 'legal_advice',
        severity: 'warning',
        message: 'Inadequate or missing legal disclaimer',
        suggestion: 'Add comprehensive disclaimer about general information vs legal advice'
      })
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('Response meets compliance standards')
    } else {
      recommendations.push('Review and address identified compliance issues')
      if (riskLevel === 'high') {
        recommendations.push('Consider human review before publishing response')
      }
    }

    return {
      isCompliant: issues.filter(i => i.severity === 'critical' || i.severity === 'error').length === 0,
      issues,
      riskLevel,
      recommendations
    }
  }

  private hasAdequateDisclaimer(response: string): boolean {
    const response_lower = response.toLowerCase()
    
    // Check for key disclaimer elements
    const hasGeneralInfo = response_lower.includes('general information') || 
                          response_lower.includes('informational purposes')
    const hasNotAdvice = response_lower.includes('not legal advice') || 
                        response_lower.includes('not constitute legal advice')
    const hasConsultation = response_lower.includes('consult') && 
                           (response_lower.includes('lawyer') || response_lower.includes('attorney'))
    
    return hasGeneralInfo && hasNotAdvice && hasConsultation
  }

  generateStandardDisclaimer(riskLevel: 'low' | 'medium' | 'high' = 'medium'): string {
    const baseDisclaimer = "This information is for general guidance only and does not constitute legal advice. Please consult with a qualified Singapore lawyer for advice specific to your situation."
    
    const disclaimers = {
      low: baseDisclaimer,
      medium: `${baseDisclaimer} Laws and regulations may change, and individual circumstances can significantly affect legal outcomes.`,
      high: `⚠️ IMPORTANT LEGAL NOTICE: ${baseDisclaimer} This matter may require immediate legal attention. Do not delay in seeking professional legal counsel. The information provided should not be relied upon for making legal decisions.`
    }
    
    return disclaimers[riskLevel]
  }

  enhanceResponseWithCompliance(response: string, complianceCheck: ComplianceCheck): string {
    let enhancedResponse = response

    // Add disclaimer if missing or inadequate
    if (!this.hasAdequateDisclaimer(response)) {
      const disclaimer = this.generateStandardDisclaimer(complianceCheck.riskLevel)
      enhancedResponse += `\n\n${disclaimer}`
    }

    // Add specific warnings for high-risk responses
    if (complianceCheck.riskLevel === 'high') {
      enhancedResponse += '\n\n🚨 This appears to be a complex legal matter that requires professional legal advice. Please contact a qualified Singapore lawyer immediately.'
    }

    // Add source attribution
    enhancedResponse += '\n\n📖 Information based on Singapore legal resources and general legal principles.'

    return enhancedResponse
  }

  // Method to check if query requires human escalation
  requiresHumanEscalation(query: string, confidence: number): boolean {
    const escalationTriggers = [
      'urgent',
      'emergency',
      'court date',
      'summons',
      'arrest',
      'police',
      'deportation',
      'criminal charge',
      'lawsuit',
      'legal action'
    ]

    const hasUrgentKeywords = escalationTriggers.some(trigger =>
      query.toLowerCase().includes(trigger)
    )

    return hasUrgentKeywords || confidence < 0.4
  }
}
