/**
 * Unit tests for validation schemas
 */

import {
  emailSchema,
  phoneSchema,
  nricSchema,
  uenSchema,
  templateVariableSchema,
  templateSchema,
  userRegistrationSchema,
  validateWithSchema,
  getValidationErrors,
  createTemplateVariableFormSchema,
} from '../validation-schemas'
import { z } from 'zod'

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ]

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        '',
      ]

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow()
      })
    })
  })

  describe('phoneSchema', () => {
    it('should validate Singapore phone numbers', () => {
      const validPhones = [
        '91234567',
        '81234567',
        '61234567',
        '9123-4567', // with dash
        '9123 4567', // with space
      ]

      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow()
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '1234567', // too short
        '123456789', // too long
        '51234567', // wrong starting digit
        'abcdefgh', // non-numeric
        '',
      ]

      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow()
      })
    })

    it('should clean phone numbers by removing non-digits', () => {
      const result = phoneSchema.parse('9123-4567')
      expect(result).toBe('91234567')
    })
  })

  describe('nricSchema', () => {
    it('should validate Singapore NRIC numbers', () => {
      const validNRICs = [
        'S1234567A',
        'T9876543B',
        'F1111111C',
        'G2222222D',
      ]

      validNRICs.forEach(nric => {
        expect(() => nricSchema.parse(nric)).not.toThrow()
      })
    })

    it('should reject invalid NRIC numbers', () => {
      const invalidNRICs = [
        'S123456A', // too short
        'S12345678A', // too long
        'X1234567A', // invalid prefix
        'S1234567', // missing suffix
        's1234567a', // lowercase (should be converted)
        '',
      ]

      invalidNRICs.forEach(nric => {
        expect(() => nricSchema.parse(nric)).toThrow()
      })
    })

    it('should convert to uppercase', () => {
      const result = nricSchema.parse('s1234567a')
      expect(result).toBe('S1234567A')
    })
  })

  describe('uenSchema', () => {
    it('should validate Singapore UEN numbers', () => {
      const validUENs = [
        '12345678A',
        '1234567890B',
        '123456789C',
      ]

      validUENs.forEach(uen => {
        expect(() => uenSchema.parse(uen)).not.toThrow()
      })
    })

    it('should reject invalid UEN numbers', () => {
      const invalidUENs = [
        '1234567A', // too short
        '12345678901A', // too long
        '12345678', // missing letter
        'ABCDEFGHA', // all letters
        '',
      ]

      invalidUENs.forEach(uen => {
        expect(() => uenSchema.parse(uen)).toThrow()
      })
    })
  })

  describe('templateVariableSchema', () => {
    it('should validate a complete template variable', () => {
      const validVariable = {
        variable_name: 'full_name',
        display_name: 'Full Name',
        variable_type: 'text' as const,
        is_required: true,
        default_value: '',
        description: 'Enter your full name',
        category: 'personal' as const,
      }

      expect(() => templateVariableSchema.parse(validVariable)).not.toThrow()
    })

    it('should require essential fields', () => {
      const invalidVariable = {
        // missing variable_name and display_name
        variable_type: 'text',
      }

      expect(() => templateVariableSchema.parse(invalidVariable)).toThrow()
    })

    it('should validate variable types', () => {
      const validTypes = ['text', 'textarea', 'email', 'date', 'select', 'number', 'phone']
      
      validTypes.forEach(type => {
        const variable = {
          variable_name: 'test',
          display_name: 'Test',
          variable_type: type,
        }
        expect(() => templateVariableSchema.parse(variable)).not.toThrow()
      })
    })
  })

  describe('templateSchema', () => {
    it('should validate a complete template', () => {
      const validTemplate = {
        title: 'Employment Contract',
        description: 'Standard employment contract template',
        category: 'Employment',
        subscription_tier: 'free' as const,
        price_sgd: 0,
        difficulty_level: 'basic' as const,
        estimated_time_minutes: 30,
        singapore_compliant: true,
        legal_review_required: true,
      }

      expect(() => templateSchema.parse(validTemplate)).not.toThrow()
    })

    it('should enforce price limits', () => {
      const invalidTemplate = {
        title: 'Test Template',
        description: 'Test description',
        category: 'Test',
        price_sgd: -10, // negative price
      }

      expect(() => templateSchema.parse(invalidTemplate)).toThrow()
    })
  })

  describe('userRegistrationSchema', () => {
    it('should validate a complete registration', () => {
      const validRegistration = {
        email: 'test@example.com',
        password: 'Password123',
        confirm_password: 'Password123',
        full_name: 'John Doe',
        user_type: 'individual' as const,
        terms_accepted: true,
      }

      expect(() => userRegistrationSchema.parse(validRegistration)).not.toThrow()
    })

    it('should require password confirmation to match', () => {
      const invalidRegistration = {
        email: 'test@example.com',
        password: 'Password123',
        confirm_password: 'DifferentPassword',
        full_name: 'John Doe',
        terms_accepted: true,
      }

      expect(() => userRegistrationSchema.parse(invalidRegistration)).toThrow()
    })

    it('should enforce password complexity', () => {
      const weakPasswords = [
        'password', // no uppercase or numbers
        'PASSWORD', // no lowercase or numbers
        '12345678', // no letters
        'Pass1', // too short
      ]

      weakPasswords.forEach(password => {
        const registration = {
          email: 'test@example.com',
          password,
          confirm_password: password,
          full_name: 'John Doe',
          terms_accepted: true,
        }
        expect(() => userRegistrationSchema.parse(registration)).toThrow()
      })
    })
  })

  describe('validateWithSchema', () => {
    it('should return success for valid data', () => {
      const schema = z.object({ name: z.string() })
      const result = validateWithSchema(schema, { name: 'John' })
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John')
      }
    })

    it('should return errors for invalid data', () => {
      const schema = z.object({ name: z.string() })
      const result = validateWithSchema(schema, { name: 123 })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1)
      }
    })
  })

  describe('getValidationErrors', () => {
    it('should format Zod errors correctly', () => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
      })

      try {
        schema.parse({ name: 'A', email: 'invalid' })
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = getValidationErrors(error)
          expect(errors).toHaveProperty('name')
          expect(errors).toHaveProperty('email')
        }
      }
    })
  })

  describe('createTemplateVariableFormSchema', () => {
    it('should create schema for template variables', () => {
      const variables = [
        {
          variable_name: 'full_name',
          display_name: 'Full Name',
          variable_type: 'text',
          is_required: true,
        },
        {
          variable_name: 'email',
          display_name: 'Email',
          variable_type: 'email',
          is_required: true,
        },
        {
          variable_name: 'phone',
          display_name: 'Phone',
          variable_type: 'phone',
          is_required: false,
        },
      ]

      const schema = createTemplateVariableFormSchema(variables)
      
      // Valid data should pass
      const validData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
      }
      expect(() => schema.parse(validData)).not.toThrow()

      // Invalid email should fail
      const invalidData = {
        full_name: 'John Doe',
        email: 'invalid-email',
      }
      expect(() => schema.parse(invalidData)).toThrow()
    })

    it('should handle optional fields correctly', () => {
      const variables = [
        {
          variable_name: 'optional_field',
          display_name: 'Optional Field',
          variable_type: 'text',
          is_required: false,
        },
      ]

      const schema = createTemplateVariableFormSchema(variables)
      
      // Should pass without the optional field
      expect(() => schema.parse({})).not.toThrow()
      
      // Should pass with the optional field
      expect(() => schema.parse({ optional_field: 'value' })).not.toThrow()
    })
  })
})
