# 08 - Commercial License & Contact

## Commercial License Page (`/license`)

### Hero Section
```jsx
<div className="license-page">
  <HeroSection className="gradient-dark">
    <Container>
      <Badge>Enterprise Ready</Badge>
      <HeroTitle>
        Commercial License for Professional Teams
      </HeroTitle>
      <HeroSubtitle>
        Get priority support, custom integrations, and SLA guarantees 
        for your production deployments
      </HeroSubtitle>
      
      <CTAButtons>
        <Button size="lg" variant="primary">
          Contact Sales
          <ArrowRight />
        </Button>
        <Button size="lg" variant="ghost">
          View Pricing
        </Button>
      </CTAButtons>
      
      <TrustBadges>
        <TrustItem>
          <Icon name="shield-check" />
          <span>SOC 2 Compliant</span>
        </TrustItem>
        <TrustItem>
          <Icon name="lock" />
          <span>Enterprise Security</span>
        </TrustItem>
        <TrustItem>
          <Icon name="award" />
          <span>99.9% SLA</span>
        </TrustItem>
      </TrustBadges>
    </Container>
  </HeroSection>
  
  {/* Comparison Table */}
  <ComparisonSection>
    <Container>
      <SectionHeader>
        <h2>Choose the Right License</h2>
        <p>Compare features between open source and commercial licenses</p>
      </SectionHeader>
      
      <ComparisonTable>
        <TableHeader>
          <TableRow>
            <TableHead>Features</TableHead>
            <TableHead>
              <PlanHeader>
                <PlanName>Open Source</PlanName>
                <PlanPrice>Free Forever</PlanPrice>
              </PlanHeader>
            </TableHead>
            <TableHead featured>
              <PlanHeader>
                <Badge>Recommended</Badge>
                <PlanName>Commercial</PlanName>
                <PlanPrice>Custom Pricing</PlanPrice>
              </PlanHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          <FeatureRow>
            <FeatureName>
              <Icon name="check" />
              All Core Features
            </FeatureName>
            <FeatureCell included>✓</FeatureCell>
            <FeatureCell included featured>✓</FeatureCell>
          </FeatureRow>
          
          <FeatureRow>
            <FeatureName>
              <Icon name="users" />
              Community Support
            </FeatureName>
            <FeatureCell included>✓</FeatureCell>
            <FeatureCell included featured>✓</FeatureCell>
          </FeatureRow>
          
          <FeatureRow>
            <FeatureName>
              <Icon name="headphones" />
              Priority Support
            </FeatureName>
            <FeatureCell>—</FeatureCell>
            <FeatureCell included featured>
              24/7 Support
            </FeatureCell>
          </FeatureRow>
          
          <FeatureRow>
            <FeatureName>
              <Icon name="shield" />
              SLA Guarantee
            </FeatureName>
            <FeatureCell>—</FeatureCell>
            <FeatureCell included featured>
              99.9% Uptime
            </FeatureCell>
          </FeatureRow>
          
          <FeatureRow>
            <FeatureName>
              <Icon name="puzzle" />
              Custom Integrations
            </FeatureName>
            <FeatureCell>—</FeatureCell>
            <FeatureCell included featured>✓</FeatureCell>
          </FeatureRow>
          
          <FeatureRow>
            <FeatureName>
              <Icon name="briefcase" />
              White-label Options
            </FeatureName>
            <FeatureCell>—</FeatureCell>
            <FeatureCell included featured>✓</FeatureCell>
          </FeatureRow>
          
          <FeatureRow>
            <FeatureName>
              <Icon name="code" />
              Custom Agent Development
            </FeatureName>
            <FeatureCell>—</FeatureCell>
            <FeatureCell included featured>✓</FeatureCell>
          </FeatureRow>
          
          <FeatureRow>
            <FeatureName>
              <Icon name="server" />
              On-premise Deployment
            </FeatureName>
            <FeatureCell>—</FeatureCell>
            <FeatureCell included featured>✓</FeatureCell>
          </FeatureRow>
        </TableBody>
      </ComparisonTable>
    </Container>
  </ComparisonSection>
  
  {/* Benefits Section */}
  <BenefitsSection>
    <Container>
      <SectionHeader>
        <h2>Enterprise Benefits</h2>
        <p>Everything you need for production-ready deployments</p>
      </SectionHeader>
      
      <BenefitsGrid>
        <BenefitCard>
          <BenefitIcon className="gradient-primary">
            <Icon name="headphones" />
          </BenefitIcon>
          <BenefitTitle>Priority Support</BenefitTitle>
          <BenefitDescription>
            Get direct access to our engineering team with guaranteed 
            response times and dedicated support channels
          </BenefitDescription>
          <BenefitFeatures>
            <li>24/7 availability</li>
            <li>1-hour response time</li>
            <li>Dedicated Slack channel</li>
            <li>Video support calls</li>
          </BenefitFeatures>
        </BenefitCard>
        
        <BenefitCard>
          <BenefitIcon className="gradient-accent">
            <Icon name="settings" />
          </BenefitIcon>
          <BenefitTitle>Custom Integrations</BenefitTitle>
          <BenefitDescription>
            We'll build custom integrations for your specific tech stack 
            and workflow requirements
          </BenefitDescription>
          <BenefitFeatures>
            <li>Custom API endpoints</li>
            <li>Enterprise SSO</li>
            <li>Proprietary tool integration</li>
            <li>Custom agent development</li>
          </BenefitFeatures>
        </BenefitCard>
        
        <BenefitCard>
          <BenefitIcon className="gradient-secondary">
            <Icon name="shield" />
          </BenefitIcon>
          <BenefitTitle>Security & Compliance</BenefitTitle>
          <BenefitDescription>
            Enterprise-grade security with compliance certifications 
            and audit support
          </BenefitDescription>
          <BenefitFeatures>
            <li>SOC 2 Type II</li>
            <li>GDPR compliant</li>
            <li>Custom security reviews</li>
            <li>Audit logs</li>
          </BenefitFeatures>
        </BenefitCard>
      </BenefitsGrid>
    </Container>
  </BenefitsSection>
  
  {/* Contact Form Section */}
  <ContactSection id="contact">
    <Container>
      <div className="contact-grid">
        {/* Form Side */}
        <ContactFormCard className="glass">
          <FormHeader>
            <h2>Get in Touch</h2>
            <p>Tell us about your needs and we'll create a custom package</p>
          </FormHeader>
          
          <ContactForm>
            <FormRow>
              <FormField>
                <Label required>First Name</Label>
                <Input 
                  placeholder="John"
                  value={formData.firstName}
                  error={errors.firstName}
                />
              </FormField>
              
              <FormField>
                <Label required>Last Name</Label>
                <Input 
                  placeholder="Doe"
                  value={formData.lastName}
                  error={errors.lastName}
                />
              </FormField>
            </FormRow>
            
            <FormField>
              <Label required>Work Email</Label>
              <Input 
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                error={errors.email}
              />
              <FieldHint>We'll only use this for business inquiries</FieldHint>
            </FormField>
            
            <FormField>
              <Label required>Company</Label>
              <Input 
                placeholder="Acme Corp"
                value={formData.company}
                error={errors.company}
              />
            </FormField>
            
            <FormRow>
              <FormField>
                <Label>Company Size</Label>
                <Select value={formData.companySize}>
                  <option>Select size</option>
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-500 employees</option>
                  <option>500+ employees</option>
                </Select>
              </FormField>
              
              <FormField>
                <Label>Country</Label>
                <Select value={formData.country}>
                  <option>Select country</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  {/* More countries */}
                </Select>
              </FormField>
            </FormRow>
            
            <FormField>
              <Label>Phone Number</Label>
              <PhoneInput 
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
              />
            </FormField>
            
            <FormField>
              <Label required>How can we help?</Label>
              <CheckboxGroup>
                <Checkbox value="license">
                  Commercial License
                </Checkbox>
                <Checkbox value="support">
                  Enterprise Support
                </Checkbox>
                <Checkbox value="integration">
                  Custom Integration
                </Checkbox>
                <Checkbox value="training">
                  Team Training
                </Checkbox>
                <Checkbox value="consulting">
                  Consulting Services
                </Checkbox>
              </CheckboxGroup>
            </FormField>
            
            <FormField>
              <Label>Message</Label>
              <Textarea 
                placeholder="Tell us more about your project and requirements..."
                rows={5}
                value={formData.message}
              />
              <CharCounter>
                {formData.message.length}/1000
              </CharCounter>
            </FormField>
            
            <FormField>
              <Label>Budget Range</Label>
              <RadioGroup value={formData.budget}>
                <Radio value="<10k">Less than $10,000</Radio>
                <Radio value="10-50k">$10,000 - $50,000</Radio>
                <Radio value="50-100k">$50,000 - $100,000</Radio>
                <Radio value=">100k">More than $100,000</Radio>
                <Radio value="discuss">Prefer to discuss</Radio>
              </RadioGroup>
            </FormField>
            
            <FormField>
              <Checkbox required>
                I agree to the{' '}
                <Link href="/privacy">Privacy Policy</Link> and{' '}
                <Link href="/terms">Terms of Service</Link>
              </Checkbox>
            </FormField>
            
            <FormField>
              <Checkbox>
                Send me updates about new features and releases
              </Checkbox>
            </FormField>
            
            <FormActions>
              <Button 
                type="submit" 
                variant="primary" 
                size="lg"
                fullWidth
                loading={isSubmitting}
              >
                Send Message
                <ArrowRight />
              </Button>
            </FormActions>
            
            {/* Success Message */}
            {submitted && (
              <SuccessMessage>
                <Icon name="check-circle" />
                <div>
                  <SuccessTitle>Message sent successfully!</SuccessTitle>
                  <SuccessText>
                    We'll get back to you within 24 hours.
                  </SuccessText>
                </div>
              </SuccessMessage>
            )}
          </ContactForm>
        </ContactFormCard>
        
        {/* Info Side */}
        <ContactInfo>
          <InfoCard className="glass">
            <InfoTitle>Direct Contact</InfoTitle>
            <InfoItems>
              <InfoItem>
                <Icon name="mail" />
                <div>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>
                    <a href="mailto:sales@agentwise.dev">
                      sales@agentwise.dev
                    </a>
                  </InfoValue>
                </div>
              </InfoItem>
              
              <InfoItem>
                <Icon name="calendar" />
                <div>
                  <InfoLabel>Schedule a Call</InfoLabel>
                  <InfoValue>
                    <Link href="/schedule">
                      Book a demo →
                    </Link>
                  </InfoValue>
                </div>
              </InfoItem>
            </InfoItems>
          </InfoCard>
          
          <InfoCard className="glass">
            <InfoTitle>Response Time</InfoTitle>
            <ResponseTimes>
              <ResponseTime>
                <ResponseLabel>Sales Inquiries</ResponseLabel>
                <ResponseValue>Within 24 hours</ResponseValue>
              </ResponseTime>
              <ResponseTime>
                <ResponseLabel>Support (Commercial)</ResponseLabel>
                <ResponseValue>Within 1 hour</ResponseValue>
              </ResponseTime>
            </ResponseTimes>
          </InfoCard>
          
          <TestimonialCard className="glass">
            <Quote>
              "Agentwise transformed our development process. The commercial 
              license gave us the support and customization we needed."
            </Quote>
            <TestimonialAuthor>
              <Avatar src="/testimonial.jpg" />
              <div>
                <AuthorName>Sarah Chen</AuthorName>
                <AuthorRole>CTO at TechCorp</AuthorRole>
              </div>
            </TestimonialAuthor>
          </TestimonialCard>
        </ContactInfo>
      </div>
    </Container>
  </ContactSection>
  
  {/* FAQ Section */}
  <FAQSection>
    <Container>
      <SectionHeader>
        <h2>Frequently Asked Questions</h2>
      </SectionHeader>
      
      <FAQGrid>
        <FAQItem>
          <FAQQuestion>
            What's included in the commercial license?
          </FAQQuestion>
          <FAQAnswer>
            The commercial license includes priority support, custom 
            integrations, SLA guarantees, white-label options, and 
            dedicated account management.
          </FAQAnswer>
        </FAQItem>
        
        <FAQItem>
          <FAQQuestion>
            Can I start with open source and upgrade later?
          </FAQQuestion>
          <FAQAnswer>
            Absolutely! Many of our commercial customers started with 
            the open source version. We'll help you migrate seamlessly.
          </FAQAnswer>
        </FAQItem>
        
        <FAQItem>
          <FAQQuestion>
            Do you offer custom pricing for startups?
          </FAQQuestion>
          <FAQAnswer>
            Yes, we have special pricing for qualified startups. 
            Contact us to discuss your needs.
          </FAQAnswer>
        </FAQItem>
      </FAQGrid>
    </Container>
  </FAQSection>
</div>
```

## Form Validation & Submission

### Frontend Validation
```typescript
// Form validation
const validateForm = () => {
  const errors = {}
  
  if (!formData.firstName) errors.firstName = 'Required'
  if (!formData.lastName) errors.lastName = 'Required'
  if (!formData.email) errors.email = 'Required'
  if (!isValidEmail(formData.email)) errors.email = 'Invalid email'
  if (!formData.company) errors.company = 'Required'
  
  return errors
}

// Form submission
const handleSubmit = async (e) => {
  e.preventDefault()
  
  const errors = validateForm()
  if (Object.keys(errors).length > 0) {
    setErrors(errors)
    return
  }
  
  setIsSubmitting(true)
  
  try {
    await submitToSupabase(formData)
    await sendNotificationEmail(formData)
    await trackConversion(formData)
    setSubmitted(true)
  } catch (error) {
    showError('Failed to send message')
  } finally {
    setIsSubmitting(false)
  }
}
```

### Supabase Integration
```sql
-- Contact form submissions table
CREATE TABLE commercial_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  company_size VARCHAR(50),
  country VARCHAR(100),
  phone VARCHAR(50),
  interests TEXT[],
  message TEXT,
  budget_range VARCHAR(50),
  newsletter_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'new',
  assigned_to UUID REFERENCES users(id),
  notes TEXT
);

-- Email notification trigger
CREATE OR REPLACE FUNCTION notify_sales_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Send email to sales team
  PERFORM send_email(
    'sales@agentwise.dev',
    'New Commercial Inquiry',
    format('New inquiry from %s at %s', 
      NEW.first_name || ' ' || NEW.last_name,
      NEW.company)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

**Note**: The commercial license page should clearly communicate value, make it easy to contact sales, and include comprehensive form validation with Supabase integration.