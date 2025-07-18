# 🌐 AWS Amplify Custom Domain Setup
## Singapore Legal Help Platform - singaporelegalhelp.com.sg

> **⚠️ IMPORTANT**: This guide provides **ADDITIVE** configurations only. Do NOT modify existing working code.

---

## 🎯 **Current Status**
- ✅ **AWS Amplify Deployment**: Working at `https://main.d2s0gf51rcbiy5.amplifyapp.com/`
- ✅ **Build Configuration**: `amplify.yml` working correctly
- ✅ **Next.js Configuration**: Optimized for AWS Amplify
- 🎯 **Target**: Add custom domain `https://www.singaporelegalhelp.com.sg`

---

## 🔧 **Step 1: Domain Configuration in AWS Amplify Console**

### **1.1 Access Domain Management**
1. Go to AWS Amplify Console
2. Select your `singapore-legal-help` app
3. Click on **"Domain management"** in the left sidebar
4. Click **"Add domain"**

### **1.2 Add Custom Domain**
```
Primary Domain: singaporelegalhelp.com.sg
Subdomain: www.singaporelegalhelp.com.sg
```

**Configuration:**
- **Domain**: `singaporelegalhelp.com.sg`
- **Subdomain prefix**: `www`
- **Branch**: `main` (your current working branch)

---

## 🔒 **Step 2: SSL Certificate Setup**

### **2.1 AWS Certificate Manager (ACM)**
AWS Amplify will automatically:
- Create SSL certificate via AWS Certificate Manager
- Configure HTTPS redirect
- Handle certificate renewal

### **2.2 DNS Validation**
You'll need to add DNS records to your domain registrar:
```
Type: CNAME
Name: _acme-challenge.www.singaporelegalhelp.com.sg
Value: [AWS will provide this value]
```

---

## 🌐 **Step 3: DNS Configuration**

### **3.1 Required DNS Records**
Add these records to your domain registrar (e.g., GoDaddy, Namecheap):

```dns
# Primary domain
Type: CNAME
Name: www
Value: [AWS Amplify will provide - looks like: d2s0gf51rcbiy5.amplifyapp.com]

# Root domain redirect (optional)
Type: A
Name: @
Value: [AWS Amplify IP - will be provided]
```

### **3.2 Verification Process**
1. AWS will validate domain ownership
2. SSL certificate will be issued
3. Domain will be activated (usually takes 15-45 minutes)

---

## ⚙️ **Step 4: Environment Variables Update**

### **4.1 Update App URL in Amplify Console**
In AWS Amplify Console → Environment variables:

```env
# Update this ONLY after domain is active
NEXT_PUBLIC_APP_URL=https://www.singaporelegalhelp.com.sg
NEXTAUTH_URL=https://www.singaporelegalhelp.com.sg
```

### **4.2 Supabase Configuration Update**
In your Supabase project settings:
1. Go to Authentication → URL Configuration
2. Add to **Redirect URLs**:
   ```
   https://www.singaporelegalhelp.com.sg/auth/callback
   https://www.singaporelegalhelp.com.sg/auth/confirm
   ```

---

## 🔍 **Step 5: Testing and Verification**

### **5.1 Domain Verification Checklist**
```bash
# Test SSL certificate
curl -I https://www.singaporelegalhelp.com.sg

# Test redirect (if configured)
curl -I https://singaporelegalhelp.com.sg

# Test health endpoint
curl https://www.singaporelegalhelp.com.sg/api/health

# Test authentication flow
# Visit: https://www.singaporelegalhelp.com.sg/auth/signin
```

### **5.2 Performance Testing**
```bash
# Test response time
curl -w "%{time_total}" https://www.singaporelegalhelp.com.sg

# Test from Singapore
# Use online tools like GTmetrix or Pingdom from Singapore location
```

---

## 📊 **Step 6: Monitoring Setup**

### **6.1 AWS CloudWatch Integration**
AWS Amplify automatically provides:
- **Build logs**: Monitor deployment status
- **Access logs**: Track user traffic
- **Performance metrics**: Response times and errors

### **6.2 Custom Monitoring Endpoints**
Your existing monitoring endpoints will work:
- **Health Check**: `https://www.singaporelegalhelp.com.sg/api/health`
- **System Metrics**: `https://www.singaporelegalhelp.com.sg/api/admin/metrics/system`
- **Admin Dashboard**: `https://www.singaporelegalhelp.com.sg/admin/monitoring`

---

## 🚨 **Troubleshooting Guide**

### **Common Issues and Solutions**

#### **Issue 1: Domain Not Resolving**
```bash
# Check DNS propagation
nslookup www.singaporelegalhelp.com.sg
dig www.singaporelegalhelp.com.sg

# Solution: Wait 24-48 hours for DNS propagation
```

#### **Issue 2: SSL Certificate Issues**
```bash
# Check certificate status
openssl s_client -connect www.singaporelegalhelp.com.sg:443

# Solution: Verify DNS validation records are correct
```

#### **Issue 3: Authentication Redirect Issues**
- **Problem**: Login redirects to old domain
- **Solution**: Update Supabase redirect URLs (Step 4.2)

#### **Issue 4: API Endpoints Not Working**
- **Problem**: CORS or environment variable issues
- **Solution**: Verify NEXT_PUBLIC_APP_URL is updated

---

## 📋 **Pre-Domain Setup Checklist**

Before starting domain setup, ensure:
- [ ] Current deployment is stable and working
- [ ] All environment variables are properly configured
- [ ] Database connections are working
- [ ] Payment systems are functional
- [ ] Admin access is working

---

## 🎯 **Post-Domain Setup Tasks**

After domain is active:
- [ ] Update all documentation with new domain
- [ ] Update README.md with live demo link
- [ ] Configure Google Analytics (if using)
- [ ] Set up monitoring alerts
- [ ] Update social media links
- [ ] Test all functionality on new domain

---

## 📞 **Support Resources**

### **AWS Amplify Documentation**
- [Custom Domain Setup](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
- [SSL Certificate Management](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domain-troubleshoot-guide.html)

### **DNS Configuration Help**
- Most domain registrars provide DNS management interfaces
- Contact your domain registrar support if needed
- DNS changes can take 24-48 hours to propagate globally

---

## ⚠️ **Important Notes**

1. **DO NOT** modify existing `amplify.yml` - it's working correctly
2. **DO NOT** change Next.js configuration - it's optimized for AWS
3. **DO NOT** update environment variables until domain is fully active
4. **BACKUP** current working configuration before making changes
5. **TEST** thoroughly on temp domain before switching DNS

---

**🎉 Once completed, your Singapore Legal Help platform will be live at:**
**`https://www.singaporelegalhelp.com.sg`**

This setup maintains all your existing functionality while adding the professional custom domain you need!
