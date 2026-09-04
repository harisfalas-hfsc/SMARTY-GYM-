import React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  amount?: string
  attempt?: number
  nextAttempt?: string
  manageUrl?: string
  final?: boolean
}

const Email = ({ name, amount, attempt, nextAttempt, manageUrl, final }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{final ? 'Your membership has been paused' : 'We could not take your membership payment'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>SMARTY GYM</Text>
        <Heading style={heading}>
          {final ? 'Your membership has been paused' : 'We could not take your payment'}
        </Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi,'}</Text>
        <Text style={text}>
          {final
            ? 'After several attempts your membership payment did not go through, so your membership is now paused. You can restart it any time — nothing is lost.'
            : `Your membership payment${amount ? ` of ${amount}` : ''} was declined${
                attempt ? ` (attempt ${attempt})` : ''
              }. This is usually an expired card or a temporary block from the bank.`}
        </Text>
        {!final && nextAttempt ? (
          <Text style={text}>
            We will try again automatically on {nextAttempt}. Updating your card now makes sure the next
            attempt succeeds.
          </Text>
        ) : null}
        {manageUrl ? (
          <Button href={manageUrl} style={button}>
            {final ? 'Restart my membership' : 'Update my card'}
          </Button>
        ) : null}
        <Text style={text}>
          You can update your card, pay an unpaid invoice, see your receipts or cancel any time from
          My account.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Haris Falas — BSc Sports Science, EXOS Specialist, CSCS</Text>
        <Text style={footer}>Smarty Gym</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data['final'] ? 'Your Smarty Gym membership has been paused' : 'Your Smarty Gym payment did not go through',
  displayName: 'Payment failed (member)',
  previewData: {
    name: 'Alex',
    amount: '€9.99',
    attempt: 1,
    nextAttempt: '10 September 2026',
    manageUrl: 'https://smartygym.com/account',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '2px', color: '#2563eb', fontWeight: 700 as const }
const heading = { fontSize: '22px', color: '#0b1220', margin: '8px 0 12px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#1f2937' }
const button = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  padding: '12px 20px',
  borderRadius: '12px',
  display: 'inline-block',
  textDecoration: 'none',
  margin: '8px 0 4px',
}
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const footer = { fontSize: '13px', lineHeight: '20px', color: '#6b7280' }

export default Email
