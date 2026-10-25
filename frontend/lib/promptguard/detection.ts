import type { Analysis, Finding, Policy } from './types'

interface Rule {
  category: string
  detail: string
  severity: Finding['severity']
  weight: number
  pattern: RegExp
}

// Heuristic prompt-injection / jailbreak detection rules.
const RULES: Rule[] = [
  {
    category: 'Prompt Injection',
    detail: 'Attempt to override prior instructions',
    severity: 'high',
    weight: 45,
    pattern: /ignore (all )?(previous|prior|above|earlier) (instructions|prompts|context)/i,
  },
  {
    category: 'System Prompt Extraction',
    detail: 'Request to reveal hidden system prompt',
    severity: 'critical',
    weight: 50,
    pattern: /(reveal|show|print|repeat|expose|leak).{0,20}(system|hidden|initial) prompt/i,
  },
  {
    category: 'Safety Bypass',
    detail: 'Attempt to disable safety or guardrails',
    severity: 'critical',
    weight: 50,
    pattern: /(disable|turn off|bypass|remove|ignore).{0,20}(safety|guardrails?|filters?|moderation|restrictions?)/i,
  },
  {
    category: 'Jailbreak',
    detail: 'Known jailbreak persona invocation',
    severity: 'high',
    weight: 40,
    pattern: /\b(DAN|do anything now|developer mode|jailbreak|unfiltered mode)\b/i,
  },
  {
    category: 'Role Manipulation',
    detail: 'Attempt to reassign the assistant role',
    severity: 'medium',
    weight: 30,
    pattern: /you are (now )?(a |an )?(unrestricted|evil|rogue|admin|root|god mode)/i,
  },
  {
    category: 'Credential Exfiltration',
    detail: 'Request for secrets, keys or credentials',
    severity: 'critical',
    weight: 48,
    pattern: /(api[_ ]?key|password|secret|token|credentials?|private key)/i,
  },
  {
    category: 'Data Exfiltration',
    detail: 'Attempt to dump databases or user records',
    severity: 'high',
    weight: 38,
    pattern: /(dump|exfiltrate|send me|email me).{0,30}(database|users?|records?|customer data)/i,
  },
  {
    category: 'Encoding Obfuscation',
    detail: 'Suspicious base64 / obfuscated payload',
    severity: 'medium',
    weight: 25,
    pattern: /(base64|rot13|decode this|\b[A-Za-z0-9+/]{40,}={0,2}\b)/,
  },
  {
    category: 'Instruction Smuggling',
    detail: 'Hidden directive markers detected',
    severity: 'medium',
    weight: 28,
    pattern: /(\[system\]|<system>|###\s*instruction|BEGIN SYSTEM)/i,
  },
]

export function analyzePrompt(content: string, policy: Policy): Analysis {
  const findings: Finding[] = []
  let score = 0

  for (const rule of RULES) {
    if (rule.pattern.test(content)) {
      findings.push({
        category: rule.category,
        detail: rule.detail,
        severity: rule.severity,
      })
      score += rule.weight
    }
  }

  // Mild noise so benign traffic isn't always exactly zero.
  const baseline = Math.min(12, Math.round(content.length / 40))
  const risk = Math.min(100, score + (findings.length ? 0 : baseline))

  let decision: Analysis['decision'] = 'ALLOW'
  if (risk >= policy.blockThreshold) decision = 'BLOCK'
  else if (risk >= policy.reviewThreshold) decision = 'REVIEW'

  const categories = Array.from(
    new Set(findings.map((f) => f.category))
  );

  const reason =
    decision === 'ALLOW'
      ? 'No malicious patterns detected. Message conforms to policy.'
      : `${categories.join(', ')} detected. Risk score ${risk} exceeds the ${
          decision === 'BLOCK' ? 'block' : 'review'
        } threshold.`;

  const latencyMs = 0;

  return {
    score,
    risk,
    decision,
    reason,
    latencyMs,
    findings: findings.map((f) => ({
      category: f.category,
      severity: f.severity,
      detail: f.detail,
    })),
  };
}