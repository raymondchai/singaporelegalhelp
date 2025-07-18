// Enhanced Document Generation Service
// Singapore Legal Help Platform - Advanced Features

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import PDFDocument from 'pdfkit';

export interface EnhancedTemplateVariable {
  name: string;
  value: string | number | boolean;
  type: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number' | 'phone';
  conditionalLogic?: {
    showIf?: { field: string; value: any };
    hideIf?: { field: string; value: any };
    requireIf?: { field: string; value: any };
  };
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    singaporeSpecific?: boolean;
  };
  dependencies?: string[];
  calculatedFrom?: string; // Formula for calculated fields
}

export interface DocumentGenerationOptions {
  templateBuffer: Buffer;
  variables: Record<string, any>;
  outputFormat: 'docx' | 'pdf';
  templateTitle: string;
  templateId?: string;
  userId?: string;
  generateVersion?: boolean;
  includeWatermark?: boolean;
  legalNotices?: string[];
}

export interface GenerationResult {
  success: boolean;
  buffer?: Buffer;
  filename: string;
  mimeType: string;
  version?: string;
  generatedAt: string;
  templateId?: string;
  userId?: string;
  error?: string;
  warnings?: string[];
}

export interface DocumentVersion {
  id: string;
  templateId: string;
  userId: string;
  version: string;
  variables: Record<string, any>;
  generatedAt: string;
  filename: string;
}

/**
 * Enhanced Document Generation Service for Singapore Legal Help Platform
 * Supports advanced features like versioning, conditional logic, and enhanced validation
 */
export class EnhancedDocumentGenerator {
  
  /**
   * Generate document with enhanced features
   */
  static async generateDocument(options: DocumentGenerationOptions): Promise<GenerationResult> {
    const { 
      templateBuffer, 
      variables, 
      outputFormat, 
      templateTitle, 
      templateId,
      userId,
      generateVersion = true,
      includeWatermark = false,
      legalNotices = []
    } = options;
    
    try {
      // Process variables with conditional logic and calculations
      const processedVariables = await this.processEnhancedVariables(variables);
      
      // Add Singapore-specific formatting
      const singaporeFormattedVariables = this.processSingaporeVariables(processedVariables);
      
      // Add legal compliance notices
      const finalVariables = this.addLegalNotices(singaporeFormattedVariables, legalNotices);
      
      let result: GenerationResult;
      
      if (outputFormat === 'docx') {
        result = await this.generateEnhancedDocx(
          templateBuffer, 
          finalVariables, 
          templateTitle,
          includeWatermark
        );
      } else if (outputFormat === 'pdf') {
        result = await this.generateEnhancedPdf(
          templateBuffer, 
          finalVariables, 
          templateTitle,
          includeWatermark
        );
      } else {
        throw new Error(`Unsupported output format: ${outputFormat}`);
      }
      
      // Add metadata
      result.generatedAt = new Date().toISOString();
      result.templateId = templateId;
      result.userId = userId;
      
      // Generate version if requested
      if (generateVersion && result.success) {
        result.version = this.generateVersionString();
      }
      
      return result;
      
    } catch (error) {
      console.error('Enhanced document generation failed:', error);
      return {
        success: false,
        filename: '',
        mimeType: '',
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Process variables with conditional logic and calculations
   */
  private static async processEnhancedVariables(variables: Record<string, any>): Promise<Record<string, any>> {
    const processed = { ...variables };
    
    // Process calculated fields
    if (processed.loan_amount && processed.interest_rate && processed.repayment_period_months) {
      const monthlyRate = parseFloat(processed.interest_rate) / 100 / 12;
      const numPayments = parseInt(processed.repayment_period_months);
      const principal = parseFloat(processed.loan_amount);
      
      if (monthlyRate > 0) {
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                              (Math.pow(1 + monthlyRate, numPayments) - 1);
        processed.monthly_payment = monthlyPayment.toFixed(2);
        processed.total_payment = (monthlyPayment * numPayments).toFixed(2);
        processed.total_interest = (monthlyPayment * numPayments - principal).toFixed(2);
      }
    }
    
    // Process CPF contribution logic
    if (processed.work_permit_type) {
      const citizenTypes = ['Singapore Citizen', 'PR'];
      processed.cpf_required = citizenTypes.includes(processed.work_permit_type) ? 'Yes' : 'No';
      
      if (processed.cpf_required === 'Yes' && processed.monthly_salary) {
        const salary = parseFloat(processed.monthly_salary);
        processed.employee_cpf = (salary * 0.20).toFixed(2); // 20% employee contribution
        processed.employer_cpf = (salary * 0.17).toFixed(2); // 17% employer contribution
      }
    }
    
    // Process property-specific calculations
    if (processed.monthly_rent && processed.property_type) {
      const rent = parseFloat(processed.monthly_rent);
      
      // Calculate typical security deposit (1-2 months)
      if (!processed.security_deposit) {
        processed.security_deposit = processed.property_type === 'HDB Flat' ? 
          rent.toFixed(2) : (rent * 2).toFixed(2);
      }
      
      // Calculate annual rent
      processed.annual_rent = (rent * 12).toFixed(2);
    }
    
    return processed;
  }
  
  /**
   * Enhanced DOCX generation with advanced features
   */
  private static async generateEnhancedDocx(
    templateBuffer: Buffer, 
    variables: Record<string, any>, 
    templateTitle: string,
    includeWatermark: boolean = false
  ): Promise<GenerationResult> {
    try {
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: true,
        nullGetter: (part) => {
          console.warn(`Template variable not found: ${part.value}`);
          return `[${part.value}]`; // Show missing variables clearly
        }
      });

      // Set the template variables
      doc.setData(variables);

      try {
        doc.render();
      } catch (error) {
        console.error('Template rendering error:', error);
        throw new Error(`Template rendering failed: ${error}`);
      }

      const buffer = doc.getZip().generate({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${templateTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.docx`;

      return {
        success: true,
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('DOCX generation error:', error);
      throw error;
    }
  }
  
  /**
   * Enhanced PDF generation with legal compliance features
   */
  private static async generateEnhancedPdf(
    templateBuffer: Buffer, 
    variables: Record<string, any>, 
    templateTitle: string,
    includeWatermark: boolean = false
  ): Promise<GenerationResult> {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: templateTitle,
          Author: 'Singapore Legal Help',
          Subject: 'Legal Document',
          Creator: 'Singapore Legal Help Document Builder',
          Producer: 'Enhanced Document Generator v2.0'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      return new Promise((resolve) => {
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `${templateTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.pdf`;

          resolve({
            success: true,
            buffer,
            filename,
            mimeType: 'application/pdf',
            generatedAt: new Date().toISOString()
          });
        });

        // Add watermark if requested
        if (includeWatermark) {
          this.addWatermark(doc);
        }

        // Generate PDF content
        this.generatePdfContent(doc, variables, templateTitle);
        
        doc.end();
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
  
  /**
   * Add watermark to PDF
   */
  private static addWatermark(doc: PDFKit.PDFDocument): void {
    doc.save()
       .rotate(45, { origin: [300, 400] })
       .fontSize(60)
       .fillColor('gray', 0.1)
       .text('DRAFT', 200, 300, { align: 'center' })
       .restore();
  }
  
  /**
   * Generate PDF content from variables
   */
  private static generatePdfContent(
    doc: PDFKit.PDFDocument, 
    variables: Record<string, any>, 
    templateTitle: string
  ): void {
    // Header
    doc.fontSize(20).fillColor('black').text(templateTitle, { align: 'center' });
    doc.moveDown(2);
    
    // Document content based on variables
    Object.entries(variables).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.fontSize(12).text(`${label}: ${value}`, { continued: false });
        doc.moveDown(0.5);
      }
    });
    
    // Footer with legal notice
    doc.fontSize(8)
       .fillColor('gray')
       .text('This document was generated by Singapore Legal Help. Please review carefully and consult a lawyer if needed.', 
             50, doc.page.height - 100, { align: 'center', width: doc.page.width - 100 });
  }
  
  /**
   * Process Singapore-specific variable formatting
   */
  private static processSingaporeVariables(variables: Record<string, any>): Record<string, any> {
    const processed = { ...variables };
    
    // Format NRIC
    if (processed.nric_number) {
      processed.nric_number = processed.nric_number.toUpperCase();
    }
    
    // Format phone numbers
    if (processed.phone_number && processed.phone_number.length === 8) {
      processed.phone_number = `+65 ${processed.phone_number.substring(0, 4)} ${processed.phone_number.substring(4)}`;
    }
    
    // Format currency
    ['monthly_salary', 'loan_amount', 'monthly_rent', 'security_deposit', 'contract_value'].forEach(field => {
      if (processed[field]) {
        const amount = parseFloat(processed[field]);
        processed[field] = new Intl.NumberFormat('en-SG', {
          style: 'currency',
          currency: 'SGD'
        }).format(amount);
      }
    });
    
    // Format dates
    ['contract_date', 'start_date', 'end_date', 'date_of_birth'].forEach(field => {
      if (processed[field]) {
        const date = new Date(processed[field]);
        processed[field] = date.toLocaleDateString('en-SG', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    });
    
    return processed;
  }
  
  /**
   * Add legal compliance notices
   */
  private static addLegalNotices(
    variables: Record<string, any>, 
    notices: string[]
  ): Record<string, any> {
    const processed = { ...variables };
    
    // Add standard Singapore legal notices
    const standardNotices = [
      'This document is governed by Singapore law.',
      'Please review all terms carefully before signing.',
      'Consult a qualified lawyer for complex legal matters.',
      'This document was generated using Singapore Legal Help platform.'
    ];
    
    processed.legal_notices = [...standardNotices, ...notices].join('\n\n');
    processed.generation_date = new Date().toLocaleDateString('en-SG');
    processed.generation_time = new Date().toLocaleTimeString('en-SG');
    
    return processed;
  }
  
  /**
   * Generate version string
   */
  private static generateVersionString(): string {
    const now = new Date();
    return `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }
}
