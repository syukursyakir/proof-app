// Pre-built skill chips so the candidate-skills step is instant (no AI wait) and
// curated. COMMON applies to every role; BY_CATEGORY adds role-type specifics.
// Keys must match the category labels in RolePicker.

export const COMMON_SKILLS = [
  "Communication",
  "Reliability",
  "Teamwork",
  "Problem-solving",
  "Adaptability",
  "Time management",
  "Attention to detail",
  "Initiative",
];

export const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Customer & Support": [
    "Empathy",
    "De-escalation",
    "Active listening",
    "Patience",
    "Product knowledge",
    "Conflict resolution",
    "Multitasking",
  ],
  "Sales & Marketing": [
    "Persuasion",
    "Objection handling",
    "Negotiation",
    "Prospecting",
    "Closing",
    "Relationship building",
    "Market awareness",
  ],
  "Software & Tech": [
    "Data structures",
    "Algorithms",
    "Debugging",
    "System design",
    "Code quality",
    "Version control (Git)",
    "Testing",
    "API design",
  ],
  "Finance & Admin": [
    "Numeracy",
    "Bookkeeping",
    "Spreadsheets / Excel",
    "Accuracy",
    "Reconciliation",
    "Compliance",
    "Reporting",
  ],
  Operations: [
    "Process improvement",
    "Logistics",
    "Inventory management",
    "Scheduling",
    "Vendor management",
    "Quality control",
  ],
  "Retail & Hospitality": [
    "Cash handling",
    "Upselling",
    "POS systems",
    "Food safety",
    "Service speed",
    "Cleanliness standards",
  ],
  "Healthcare & Care": [
    "Patient care",
    "Compassion",
    "Safeguarding",
    "Record keeping",
    "Hygiene standards",
    "Medication awareness",
  ],
};

// Category specifics first (most relevant), then the common batch — de-duped.
export function skillsForCategory(category: string | null): string[] {
  const specific = (category && SKILLS_BY_CATEGORY[category]) || [];
  const seen = new Set<string>();
  return [...specific, ...COMMON_SKILLS].filter((s) => {
    const k = s.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
