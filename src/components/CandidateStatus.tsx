import AppealButton from "@/components/AppealButton";
import type { Criterion } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

// Shown when a candidate returns to their link after finishing — closes the loop
// (the #1 complaint about these platforms is being ghosted after investing time).
export default function CandidateStatus({
  status,
  orgName,
  roleTitle,
  rubric,
  token,
}: {
  status: "completed" | "advanced" | "rejected";
  orgName: string | null;
  roleTitle: string;
  rubric: Criterion[];
  token: string;
}) {
  const company = orgName ?? "the hiring team";

  const config = {
    completed: {
      badge: "Under review",
      title: "Your assessment is in",
      body: `Thanks for completing the assessment for ${roleTitle}. ${company} is reviewing it now. A real person makes the final decision — check back here anytime for an update.`,
    },
    advanced: {
      badge: "Moving forward",
      title: "Good news",
      body: `${company} would like to move forward with you for the ${roleTitle} role. They'll be in touch with the next steps — keep an eye on your email.`,
    },
    rejected: {
      badge: "Decision made",
      title: "Thank you for your time",
      body: `${company} has decided to move forward with other candidates for the ${roleTitle} role this time. You were assessed on the same rubric as everyone else — this isn't a reflection of your worth, and we're grateful you took the time.`,
    },
  }[status];

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <Badge domain="status" value={status}>
          {config.badge}
        </Badge>
        <h1 className="mt-4 text-2xl font-semibold">{config.title}</h1>
        <p className="mt-3 text-muted">{config.body}</p>

        {rubric.length > 0 && (
          <Card padding="sm" radius="xl" className="mt-6 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              What you were assessed on
            </p>
            <ul className="mt-2 space-y-1">
              {rubric.map((c) => (
                <li key={c.name} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-accent-soft">•</span>
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {status === "completed" && (
          <>
            <p className="mt-5 text-sm text-muted">
              Feel something was missed or assessed unfairly?
            </p>
            <AppealButton token={token} />
          </>
        )}
      </div>
    </div>
  );
}
