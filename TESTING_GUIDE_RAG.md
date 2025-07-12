# RAG System Testing Guide
## Singapore Legal Help Platform - AI Integration Testing

### Overview
This guide provides comprehensive testing procedures for the aiXplain RAG (Retrieval-Augmented Generation) system integration, ensuring accuracy, compliance, and performance standards.

## 🧪 Testing Categories

### 1. Unit Testing
**Location**: `src/tests/rag-system.test.ts`

#### Query Processing Tests
- ✅ Intent recognition accuracy
- ✅ Category classification
- ✅ Keyword extraction
- ✅ Urgency detection
- ✅ Singapore entity recognition

#### Compliance Tests
- ✅ Legal advice detection
- ✅ Disclaimer validation
- ✅ Unauthorized practice detection
- ✅ Risk level assessment
- ✅ Human escalation triggers

#### Caching Tests
- ✅ Cache key generation
- ✅ Similar query detection
- ✅ Cache hit/miss logic
- ✅ Expiration handling

**Run Tests:**
```bash
npm test src/tests/rag-system.test.ts
```

### 2. Integration Testing

#### API Endpoint Testing
Test all RAG-related API endpoints:

**AI Query API** (`/api/ai/query`)
```bash
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question": "What are employment rights in Singapore?",
    "category": "employment_law",
    "sessionId": "test-session"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Employment rights in Singapore...",
    "confidence": 0.85,
    "sources": [...],
    "followUpQuestions": [...],
    "disclaimer": "This information is for general guidance..."
  }
}
```

**AI Initialization API** (`/api/ai/initialize`)
```bash
curl -X POST http://localhost:3000/api/ai/initialize \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Compliance Monitoring API** (`/api/admin/compliance`)
```bash
curl -X GET http://localhost:3000/api/admin/compliance \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3. Performance Testing

#### Load Testing
Test system performance under various loads:

**Concurrent Query Test:**
```javascript
// Test 50 concurrent queries
const queries = Array(50).fill().map((_, i) => 
  fetch('/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer TOKEN' },
    body: JSON.stringify({ question: `Test query ${i}` })
  })
)

Promise.all(queries).then(responses => {
  console.log(`Completed ${responses.length} queries`)
  // Measure response times, success rates
})
```

**Performance Benchmarks:**
- ✅ Response time < 3 seconds (95th percentile)
- ✅ Cache hit rate > 30%
- ✅ Concurrent query handling (50+ simultaneous)
- ✅ Memory usage < 512MB
- ✅ Error rate < 1%

#### Cache Performance
```bash
# Test cache effectiveness
curl -X GET http://localhost:3000/api/ai/query/health
```

**Expected Metrics:**
- Cache hit rate: >30%
- Average response time: <2s
- Memory cache size: <100MB

### 4. Accuracy Validation

#### Legal Content Accuracy Tests
Test with known legal scenarios:

**Employment Law Test Cases:**
1. "What is the minimum notice period for termination?"
   - Expected: Reference to Employment Act
   - Confidence: >0.8
   - Sources: Employment legislation

2. "Can my employer reduce my salary without consent?"
   - Expected: Clear explanation of contract terms
   - Compliance: No direct legal advice
   - Disclaimer: Present

**Business Law Test Cases:**
1. "How to register a company in Singapore?"
   - Expected: ACRA process steps
   - Intent: Procedure
   - Category: business_law

2. "What licenses do I need for F&B business?"
   - Expected: Multiple licensing requirements
   - Sources: Government guidelines

#### Compliance Validation
Test responses for legal compliance:

**High-Risk Scenarios:**
```javascript
const testCases = [
  {
    query: "Should I sue my employer?",
    expectedRisk: "high",
    shouldEscalate: true
  },
  {
    query: "I was arrested, what should I do?",
    expectedRisk: "high",
    shouldEscalate: true
  }
]
```

### 5. User Acceptance Testing

#### Chat Interface Testing
1. **Welcome Component**
   - ✅ Category selection works
   - ✅ Sample questions populate input
   - ✅ Responsive design

2. **Message Display**
   - ✅ User/AI messages clearly distinguished
   - ✅ Confidence scores displayed
   - ✅ Sources shown correctly
   - ✅ Follow-up questions clickable

3. **Real-time Features**
   - ✅ Typing indicators
   - ✅ Error handling
   - ✅ Rate limiting messages

#### Admin Interface Testing
1. **Compliance Dashboard**
   - ✅ Metrics display correctly
   - ✅ Risk distribution charts
   - ✅ Recent queries list
   - ✅ Time range filters

2. **Performance Monitoring**
   - ✅ Cache statistics
   - ✅ Response time metrics
   - ✅ Query volume tracking

### 6. Security Testing

#### Authentication & Authorization
- ✅ API endpoints require valid tokens
- ✅ Admin endpoints restricted to admin users
- ✅ Rate limiting prevents abuse
- ✅ User data isolation (RLS)

#### Data Protection
- ✅ Query logs anonymized appropriately
- ✅ Sensitive information not cached
- ✅ PDPA compliance maintained

### 7. Error Handling Testing

#### API Error Scenarios
```bash
# Test invalid requests
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"invalid": "request"}'

# Test rate limiting
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/ai/query \
    -H "Authorization: Bearer TOKEN" \
    -d '{"question": "test"}' &
done
```

#### Expected Error Responses:
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing/invalid token)
- 429: Rate Limited
- 500: Internal Server Error

### 8. Database Testing

#### Schema Validation
```sql
-- Test AI query logs table
SELECT COUNT(*) FROM ai_query_logs WHERE created_at > NOW() - INTERVAL '1 day';

-- Test RAG cache table
SELECT COUNT(*) FROM rag_cache WHERE expires_at > NOW();

-- Test cache cleanup function
SELECT cleanup_expired_rag_cache();
```

#### Data Integrity
- ✅ Foreign key constraints work
- ✅ RLS policies enforced
- ✅ Indexes improve query performance
- ✅ Cleanup functions work correctly

## 🚀 Automated Testing Pipeline

### GitHub Actions Workflow
```yaml
name: RAG System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
      - name: Performance tests
        run: npm run test:performance
```

### Test Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📊 Success Criteria

### Functional Requirements
- ✅ All unit tests pass (100%)
- ✅ Integration tests pass (100%)
- ✅ Legal accuracy >90% for test cases
- ✅ Compliance checks catch violations
- ✅ Cache system improves performance

### Performance Requirements
- ✅ Response time <3s (95th percentile)
- ✅ Cache hit rate >30%
- ✅ Handle 100+ concurrent users
- ✅ Memory usage <512MB
- ✅ Error rate <1%

### Quality Requirements
- ✅ Code coverage >80%
- ✅ No critical security vulnerabilities
- ✅ All compliance checks pass
- ✅ User acceptance criteria met

## 🔧 Troubleshooting

### Common Issues
1. **OpenAI API Errors**
   - Check API key validity
   - Verify rate limits
   - Monitor usage quotas

2. **Cache Performance**
   - Check database connections
   - Verify cache expiration settings
   - Monitor memory usage

3. **Compliance Failures**
   - Review response content
   - Check disclaimer presence
   - Validate risk assessments

### Debug Commands
```bash
# Check system health
curl http://localhost:3000/api/ai/query/health

# View recent logs
docker logs singapore-legal-help

# Database diagnostics
psql -c "SELECT * FROM get_rag_cache_stats();"
```

## 📝 Test Reports

Generate comprehensive test reports:
```bash
npm run test:report
```

Reports include:
- Test coverage metrics
- Performance benchmarks
- Compliance validation results
- Error analysis
- Recommendations for improvements

---

**Next Steps:**
1. Run complete test suite
2. Address any failing tests
3. Performance optimization if needed
4. User acceptance testing
5. Production deployment validation
