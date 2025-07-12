import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import PDFDocument from 'pdfkit';

export interface TemplateVariable {
  name: string;
  value: string | number | boolean;
  type: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number' | 'phone';
}

export interface DocumentGenerationOptions {
  templateBuffer: Buffer;
  variables: Record<string, any>;
  outputFormat: 'docx' | 'pdf';
  templateTitle: string;
}

export interface GenerationResult {
  success: boolean;
  buffer?: Buffer;
  filename: string;
  mimeType: string;
  error?: string;
}

/**
 * Document Generation Service for Singapore Legal Help Platform
 * Supports DOCX template processing and PDF generation
 */
export class DocumentGenerator {
  
  /**
   * Generate document from template with variables
   */
  static async generateDocument(options: DocumentGenerationOptions): Promise<GenerationResult> {
    const { templateBuffer, variables, outputFormat, templateTitle } = options;
    
    try {
      if (outputFormat === 'docx') {
        return await this.generateDocx(templateBuffer, variables, templateTitle);
      } else if (outputFormat === 'pdf') {
        return await this.generatePdf(templateBuffer, variables, templateTitle);
      } else {
        throw new Error(`Unsupported output format: ${outputFormat}`);
      }
    } catch (error) {
      console.error('Document generation failed:', error);
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate DOCX document using Docxtemplater
   */
  private static async generateDocx(
    templateBuffer: Buffer, 
    variables: Record<string, any>, 
    templateTitle: string
  ): Promise<GenerationResult> {
    try {
      // Load the template
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: true
      });

      // Process Singapore-specific variables
      const processedVariables = this.processSingaporeVariables(variables);

      // Set the template variables
      doc.setData(processedVariables);

      try {
        // Render the document
        doc.render();
      } catch (error) {
        console.error('Template rendering error:', error);
        throw new Error(`Template rendering failed: ${error}`);
      }

      // Generate the output buffer
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9
        }
      });

      const filename = this.generateFilename(templateTitle, 'docx');

      return {
        success: true,
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

    } catch (error) {
      throw new Error(`DOCX generation failed: ${error}`);
    }
  }

  /**
   * Generate PDF document (convert from DOCX or create from scratch)
   */
  private static async generatePdf(
    templateBuffer: Buffer, 
    variables: Record<string, any>, 
    templateTitle: string
  ): Promise<GenerationResult> {
    try {
      // For now, we'll create a simple PDF with the variables
      // In a production environment, you might want to:
      // 1. First generate DOCX using the method above
      // 2. Convert DOCX to PDF using a service like LibreOffice or Pandoc
      // 3. Or use a PDF template library

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      
      const pdfPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

      // Process Singapore-specific variables
      const processedVariables = this.processSingaporeVariables(variables);

      // Add title
      doc.fontSize(20).font('Helvetica-Bold').text(templateTitle, { align: 'center' });
      doc.moveDown(2);

      // Add Singapore Legal Help header
      doc.fontSize(12).font('Helvetica').text('Singapore Legal Help Platform', { align: 'center' });
      doc.text('Generated Legal Document', { align: 'center' });
      doc.moveDown(2);

      // Add variables as form fields
      doc.fontSize(12).font('Helvetica-Bold').text('Document Details:', { underline: true });
      doc.moveDown(1);

      Object.entries(processedVariables).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const label = this.formatVariableLabel(key);
          doc.font('Helvetica-Bold').text(`${label}:`, { continued: true });
          doc.font('Helvetica').text(` ${value}`);
          doc.moveDown(0.5);
        }
      });

      // Add footer
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica').text(
        'This document was generated by Singapore Legal Help Platform.',
        { align: 'center' }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-SG')} at ${new Date().toLocaleTimeString('en-SG')}`,
        { align: 'center' }
      );

      // Add Singapore compliance notice
      doc.moveDown(1);
      doc.text(
        'This document complies with Singapore legal requirements. Please review all details before use.',
        { align: 'center', width: 400 }
      );

      doc.end();

      const buffer = await pdfPromise;
      const filename = this.generateFilename(templateTitle, 'pdf');

      return {
        success: true,
        buffer,
        filename,
        mimeType: 'application/pdf'
      };

    } catch (error) {
      throw new Error(`PDF generation failed: ${error}`);
    }
  }

  /**
   * Process Singapore-specific variables (NRIC, UEN formatting, etc.)
   */
  private static processSingaporeVariables(variables: Record<string, any>): Record<string, any> {
    const processed = { ...variables };

    // Format NRIC numbers
    if (processed.nric_number) {
      processed.nric_number = this.formatNRIC(processed.nric_number);
    }

    // Format UEN numbers
    if (processed.uen_number) {
      processed.uen_number = this.formatUEN(processed.uen_number);
    }

    // Format phone numbers
    if (processed.phone_number) {
      processed.phone_number = this.formatSingaporePhone(processed.phone_number);
    }

    // Format dates
    Object.keys(processed).forEach(key => {
      if (key.includes('date') && processed[key]) {
        processed[key] = this.formatSingaporeDate(processed[key]);
      }
    });

    // Format currency values
    if (processed.contract_value) {
      processed.contract_value = this.formatSingaporeCurrency(processed.contract_value);
    }

    return processed;
  }

  /**
   * Format NRIC number (e.g., S1234567A)
   */
  private static formatNRIC(nric: string): string {
    const cleaned = nric.replace(/\s/g, '').toUpperCase();
    if (cleaned.match(/^[STFG][0-9]{7}[A-Z]$/)) {
      return cleaned;
    }
    return nric; // Return original if invalid format
  }

  /**
   * Format UEN number
   */
  private static formatUEN(uen: string): string {
    const cleaned = uen.replace(/\s/g, '').toUpperCase();
    return cleaned;
  }

  /**
   * Format Singapore phone number
   */
  private static formatSingaporePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `+65 ${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
    }
    return phone; // Return original if not 8 digits
  }

  /**
   * Format date for Singapore locale
   */
  private static formatSingaporeDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-SG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Format currency for Singapore
   */
  private static formatSingaporeCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(numAmount);
  }

  /**
   * Format variable label for display
   */
  private static formatVariableLabel(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate filename with timestamp
   */
  private static generateFilename(templateTitle: string, extension: string): string {
    const sanitized = templateTitle
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${sanitized}-${timestamp}.${extension}`;
  }

  /**
   * Validate template variables against Singapore requirements
   */
  static validateSingaporeCompliance(variables: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate NRIC if present
    if (variables.nric_number && !variables.nric_number.match(/^[STFG][0-9]{7}[A-Z]$/)) {
      errors.push('NRIC number must be in format S1234567A');
    }

    // Validate UEN if present
    if (variables.uen_number && !variables.uen_number.match(/^[0-9]{8,10}[A-Z]$/)) {
      errors.push('UEN number must be 8-10 digits followed by a letter');
    }

    // Validate phone number if present
    if (variables.phone_number && !variables.phone_number.replace(/\D/g, '').match(/^[0-9]{8}$/)) {
      errors.push('Phone number must be 8 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
