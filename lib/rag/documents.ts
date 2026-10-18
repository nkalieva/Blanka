export type RagDocument = {
  source: string
  content: string
}

export const RAG_DOCUMENTS: RagDocument[] = [
  {
    source: 'worker-handbook.md',
    content: `# Blanka Worker Handbook

## Check-In Procedures
Workers must check in using the Blanka app at least 5 minutes before their shift starts. The check-in button activates when you are within 500 meters of the client location. If you cannot check in, contact your manager immediately via the app chat.

## Check-Out Procedures
After completing all tasks, take photos of the cleaned areas and upload them to the shift record before checking out. The check-out button only appears after photos are uploaded. Skipping this step will delay payment.

## Cancellation Policy
If you need to cancel a shift, notify your manager at least 24 hours in advance. Last-minute cancellations less than 2 hours before the shift may result in a formal warning. Three warnings lead to contract review.

## Equipment and Supplies
Blanka provides all cleaning equipment and supplies. Workers must not bring personal cleaning products unless specifically requested by the manager. Report any damaged equipment immediately through the app before the shift begins.

## Client Communication
Workers must not communicate directly with clients about scheduling, payments, or complaints. All client concerns must be routed through the manager. Be professional and polite at all times during the shift.

## Safety Guidelines
If you encounter any safety hazard, biohazard, or situation that makes you feel unsafe, leave the premises immediately and call emergency services if necessary. Then notify your manager as urgent via the app chat.

## Quality Standards
Each shift requires completing all tasks on the checklist provided in the app. Do not mark tasks complete without performing them. Quality inspections occur randomly and without prior notice.

## Payment and Hours
Pay is calculated based on hours tracked by app check-in and check-out times. Overtime is paid at 1.5x the regular rate for hours worked beyond 8 in a single day. Pay cycles are bi-weekly.`,
  },
  {
    source: 'service-faq.md',
    content: `# Blanka Service FAQ

## What happens if I cannot access the property?
If you cannot access the property, take a photo of the entrance area and immediately contact your manager via the app chat marked as urgent. Wait 15 minutes in case the client is running late. Your manager will resolve the situation within 30 minutes. You will be compensated for your wait time.

## What cleaning products does Blanka use?
Blanka uses eco-friendly professional-grade cleaning products safe for children and pets. The standard kit includes multi-surface cleaner, bathroom disinfectant, floor cleaner, and glass cleaner. Special requests such as fragrance-free products must be pre-arranged through the manager at least 48 hours before the shift.

## How do I report a damaged item at a client property?
Photograph the damage immediately with a timestamp visible. Do not touch or move the damaged item. Report it through the app as an urgent message to your manager. Fill in the incident report form in the app before leaving the property. Blanka has insurance that covers accidental damages caused during shifts.

## What are the Blanka working hours?
Blanka operates Monday through Saturday from 8:00 AM to 6:00 PM. Shifts are typically 3 to 6 hours long. Sunday shifts are available only for recurring premium clients and require 48 hours advance notice from the manager.

## How do I request time off?
Submit time-off requests through the app at least 7 days in advance. Holiday periods including Christmas and New Year require 30 days advance notice. Emergency time off must be communicated directly to your manager with a reason provided.

## What should I do if a client requests a task not on my checklist?
Politely explain that you can only complete tasks listed in your current shift checklist. Additional services can be arranged through the manager for future visits. Never accept cash payments directly from clients under any circumstances.

## How are tips handled?
Clients may add tips through the Blanka app after shift completion. Tips are transferred to workers within the next pay cycle. Cash tips offered directly by clients must be reported to the manager and processed through the formal payment system.

## What is the dress code?
Workers must wear the Blanka uniform consisting of a blue polo shirt and dark trousers during all shifts. Uniforms are provided after onboarding. Closed-toe shoes are required for safety reasons at all times.`,
  },
]
