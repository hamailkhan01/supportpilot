import type { KbDocument, Settings } from "./types";

// Sample knowledge base for "Quillbase", a fictional team-notes SaaS used for the live demo.
// Replace it from the dashboard with any business's real docs.

const now = Date.UTC(2026, 10, 1);

export const SAMPLE_DOCS: KbDocument[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    updatedAt: now,
    content: `# Getting Started with Quillbase

Quillbase is a shared workspace where teams write notes, docs and meeting minutes together in real time.

## Creating your workspace
Sign up at quillbase.example with your work email. Your first workspace is created automatically. You can rename it from Settings > Workspace.

## Inviting teammates
Go to Settings > Members and click Invite. Enter one or more email addresses. Invited people get an email link that expires after 7 days. Admins can resend an invite at any time.

## Importing existing notes
You can import Markdown files, Notion exports (.zip) and Google Docs. Go to New > Import and choose the source. Imports of up to 2 GB are supported.`,
  },
  {
    id: "pricing",
    title: "Pricing & Plans",
    updatedAt: now,
    content: `# Pricing & Plans

## Free plan
Free forever for up to 3 members. Includes 1 workspace, 500 pages and 30 days of page history.

## Pro plan
$8 per member per month billed yearly, or $10 per member billed monthly. Unlimited pages, unlimited page history, guest access and integrations.

## Business plan
$15 per member per month billed yearly. Everything in Pro plus SSO (SAML), audit logs, advanced permissions and priority support with a 4-hour response time.

## Discounts
Students and teachers get Pro free with a valid school email. Registered non-profits get 50% off any paid plan. Contact sales for teams above 200 members.

## Free trial
Every new workspace gets a 14-day Pro trial. No credit card is required, and you drop to the Free plan automatically if you do not upgrade.`,
  },
  {
    id: "billing",
    title: "Billing & Refunds",
    updatedAt: now,
    content: `# Billing & Refunds

## Payment methods
We accept Visa, Mastercard, American Express and PayPal. Business plans can also pay by invoice (bank transfer) for yearly subscriptions over $1,000.

## Refund policy
Monthly plans can be cancelled at any time and stay active until the end of the billing period; monthly payments are not refunded. Yearly plans can get a full refund within 30 days of purchase. After 30 days, yearly plans are not refundable but you keep access until the term ends.

To request a refund, email billing@quillbase.example from the account owner's email with your workspace name.

## Changing or cancelling a plan
Go to Settings > Billing. Upgrades take effect immediately and are prorated. Downgrades take effect at the next renewal date.

## Invoices
All invoices are available under Settings > Billing > Invoices and can be downloaded as PDF. You can add a company name, address and VAT number to invoices.`,
  },
  {
    id: "integrations",
    title: "Integrations",
    updatedAt: now,
    content: `# Integrations

Integrations are available on Pro and Business plans.

## Slack
Connect Slack from Settings > Integrations > Slack. You can share pages to channels, get notified when someone mentions you, and create a page from any Slack message with the "Save to Quillbase" shortcut.

## Google Drive
Embed Google Docs, Sheets and Slides directly inside a page. Files keep their original Google permissions.

## GitHub
Paste a GitHub issue or pull request link to show a live preview with its status.

## Zapier and API
Quillbase has a REST API and a Zapier app. API keys are created under Settings > Developers. The API allows 100 requests per minute per workspace.`,
  },
  {
    id: "security",
    title: "Security & Privacy",
    updatedAt: now,
    content: `# Security & Privacy

## Data storage
Customer data is hosted on AWS in the EU (Frankfurt) and US (Virginia) regions. You choose the region when creating a workspace, and it cannot be changed later.

## Encryption
All data is encrypted in transit with TLS 1.2+ and at rest with AES-256.

## Compliance
Quillbase is SOC 2 Type II certified and GDPR compliant. A Data Processing Agreement (DPA) is available for Business customers on request.

## Two-factor authentication
Every user can enable 2FA from Profile > Security using an authenticator app. Business admins can require 2FA for the whole workspace.

## Data export and deletion
Admins can export the whole workspace as Markdown and HTML from Settings > Workspace > Export. Deleted workspaces are permanently erased after 30 days.`,
  },
  {
    id: "troubleshooting",
    title: "Account & Troubleshooting",
    updatedAt: now,
    content: `# Account & Troubleshooting

## Resetting your password
Click "Forgot password" on the login page. The reset link is valid for 1 hour. If you sign in with Google or SSO, reset the password with that provider instead.

## Pages not syncing
Check your internet connection, then refresh the page. Quillbase works offline in the desktop app and syncs when you reconnect. If a page still does not sync, clear the browser cache or log out and back in.

## Desktop and mobile apps
Apps are available for macOS, Windows, iOS and Android. Linux users can use the web app or the AppImage beta.

## Contacting support
Free and Pro users can reach support by email at help@quillbase.example, with replies within 24 hours on business days. Business plan customers get priority support with a 4-hour response time and a live chat option.`,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  businessName: "Quillbase",
  assistantName: "Quill",
  welcomeMessage: "Hi! I'm Quill, the Quillbase support assistant. Ask me about plans, billing, integrations or your account.",
  tone: "friendly",
  brandColor: "#4f46e5",
  suggestedQuestions: [
    "Can I get a refund on a yearly plan?",
    "How much is the Pro plan?",
    "Do you integrate with Slack?",
    "Where is my data stored?",
  ],
};
