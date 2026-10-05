import React from 'react'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import {
  PREMIUM_WELCOME_INTRO,
  PREMIUM_WELCOME_SECTIONS,
  premiumWelcomeTitle,
} from '../premium-welcome-content'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
}

const tones: Record<string, { accent: string; tint: string }> = {
  blue: { accent: '#2563eb', tint: '#eff6ff' },
  green: { accent: '#15803d', tint: '#f0fdf4' },
  violet: { accent: '#7c3aed', tint: '#f5f3ff' },
  orange: { accent: '#c2410c', tint: '#fff7ed' },
  rose: { accent: '#be123c', tint: '#fff1f2' },
  cyan: { accent: '#0e7490', tint: '#ecfeff' },
  yellow: { accent: '#a16207', tint: '#fefce8' },
}

const Email = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your SMARTYGYM membership starts here</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>SMARTYGYM</Text>
          <Text style={eyebrow}>YOUR GYM RE-IMAGINED. ANYWHERE, ANYTIME.</Text>
          <Heading style={heading}>{premiumWelcomeTitle(name)}</Heading>
          <Text style={lead}>{PREMIUM_WELCOME_INTRO}</Text>
        </Section>

        <Section style={guide}>
          <Text style={guideTitle}>Your membership, at a glance</Text>
          {PREMIUM_WELCOME_SECTIONS.map((item) => {
            const tone = tones[item.tone] ?? tones.blue
            return (
              <Section key={item.title} style={{ ...card, borderLeft: `4px solid ${tone.accent}` }}>
                <Row>
                  <Column style={{ ...iconCell, backgroundColor: tone.tint }}>
                    <Text style={icon}>{item.icon}</Text>
                  </Column>
                  <Column style={copyCell}>
                    <Heading as="h2" style={{ ...cardTitle, color: tone.accent }}>
                      {item.title}
                    </Heading>
                    <Text style={cardText}>{item.body}</Text>
                    <Button href={item.href} style={{ ...textLink, color: tone.accent }}>
                      {item.action} →
                    </Button>
                  </Column>
                </Row>
              </Section>
            )
          })}
        </Section>

        <Section style={closingBox}>
          <Heading as="h2" style={closingTitle}>Make SMARTYGYM yours</Heading>
          <Text style={closingText}>
            Start wherever feels right today. Your workouts, saved progress and member tools are ready when you are.
          </Text>
          <Button href="https://smartygym.com/smarty-workouts" style={primaryButton}>
            Start exploring
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={signature}>Welcome to SMARTYGYM,</Text>
        <Text style={signatureStrong}>HARIS FALAS</Text>
        <Text style={footer}>BSc Sports Science · EXOS Specialist · CSCS</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => premiumWelcomeTitle(data['name'] as string | undefined),
  displayName: 'Premium member welcome',
  previewData: { name: 'Haris' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 }
const container = { maxWidth: '620px', margin: '0 auto', padding: '24px 18px 32px' }
const header = { borderTop: '6px solid #2563eb', padding: '26px 24px 24px', backgroundColor: '#f8fafc' }
const brand = { margin: 0, color: '#2563eb', fontSize: '22px', lineHeight: '28px', fontWeight: 800 as const }
const eyebrow = { margin: '6px 0 24px', color: '#64748b', fontSize: '10px', lineHeight: '16px', letterSpacing: '1.2px' }
const heading = { margin: '0 0 12px', color: '#0f172a', fontSize: '30px', lineHeight: '36px' }
const lead = { margin: 0, color: '#334155', fontSize: '16px', lineHeight: '25px' }
const guide = { padding: '22px 0 4px' }
const guideTitle = { margin: '0 0 12px', color: '#0f172a', fontSize: '18px', lineHeight: '24px', fontWeight: 700 as const }
const card = { margin: '0 0 12px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }
const iconCell = { width: '48px', height: '48px', borderRadius: '8px', textAlign: 'center' as const, verticalAlign: 'top' as const }
const icon = { margin: '12px 0 0', fontSize: '12px', lineHeight: '22px', fontWeight: 800 as const }
const copyCell = { paddingLeft: '14px', verticalAlign: 'top' as const }
const cardTitle = { margin: '0 0 4px', fontSize: '17px', lineHeight: '22px' }
const cardText = { margin: '0 0 6px', color: '#475569', fontSize: '14px', lineHeight: '21px' }
const textLink = { padding: 0, backgroundColor: 'transparent', fontSize: '13px', fontWeight: 700 as const, textDecoration: 'none' }
const closingBox = { marginTop: '12px', padding: '22px', border: '1px solid #bfdbfe', borderRadius: '8px', textAlign: 'center' as const }
const closingTitle = { margin: '0 0 8px', color: '#0f172a', fontSize: '20px', lineHeight: '26px' }
const closingText = { margin: '0 0 16px', color: '#475569', fontSize: '14px', lineHeight: '22px' }
const primaryButton = { backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: 700 as const, textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '28px 0 18px' }
const signature = { margin: '0 0 3px', color: '#475569', fontSize: '14px', lineHeight: '20px' }
const signatureStrong = { margin: 0, color: '#0f172a', fontSize: '14px', lineHeight: '20px', fontWeight: 800 as const }
const footer = { margin: '2px 0 0', color: '#64748b', fontSize: '12px', lineHeight: '18px' }

export default Email
