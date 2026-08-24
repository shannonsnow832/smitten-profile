export const RULES = `
- Always use useState<any[]>([]) never useState([])
- Always use inline ternaries or pre-typed variables for Badge/Button variant props
- All Dialog onOpenChange: (open: boolean) =>
- All Select onValueChange: (value: string) =>
- File line limit (400 lines) is an AI Studio-specific rule. It is NOT confirmed whether Lovable enforces or respects this same limit. Treat Lovable-generated files as unverified until checked manually against actual line count in Git.
- This app has exactly one user type: participants. Never mix user types in a component.
- NEVER USE EM DASHES in any code, comment, string, or user facing copy. Use a hyphen or colon.
- Supabase email OTP codes are 8 digits, never 6. Any OTP input renders 8 boxes and validates token.length === 8.
- Never hard delete participant data. Soft delete only.
- All profile reads and writes go through the intake RPCs. Never PATCH the profiles table directly.
- Free account holders are PARTICIPANTS, never "members." Member and membership refer to paid tiers only.
`;
