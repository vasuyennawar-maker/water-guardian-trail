import type { AIAssessment, IssueCategory } from "@/types";
import { request } from "./client";

/**
 * MOCK AI triage. Responses are generated locally and are NOT a real model
 * output. Shape matches what a `/ai/assess` endpoint would return so a real
 * service (vision + text triage) can be dropped in without UI changes.
 * The UI must always present these as hedged assessments, never verdicts.
 */
const TEMPLATES: Partial<Record<IssueCategory, Omit<AIAssessment, "model" | "generatedAt">>> = {
  sewage_discharge: {
    possibleIssue: "Untreated sewage discharge into a surface water body",
    estimatedSeverity: "critical",
    possibleCause: "Possible overflow or bypass from a nearby sewer line",
    confidence: 0.81,
    reason:
      "Descriptions of dark turbid flow with odour at a pipe outfall commonly indicate domestic sewage rather than storm runoff. Field verification is required.",
  },
  industrial_pollution: {
    possibleIssue: "Possible untreated industrial effluent release",
    estimatedSeverity: "critical",
    possibleCause: "Possible bypass of an effluent treatment connection",
    confidence: 0.68,
    reason:
      "Non-natural colouration near an industrial estate suggests effluent, but composition cannot be established without laboratory sampling.",
  },
  plastic_waste: {
    possibleIssue: "Solid and plastic waste accumulation along the water edge",
    estimatedSeverity: "high",
    possibleCause: "Possible gap in collection frequency at a high-footfall site",
    confidence: 0.74,
    reason:
      "Clustered polythene and organic matter along a bank edge is typically an accumulation pattern rather than a single dumping event.",
  },
  ecological_concern: {
    possibleIssue: "Localised aquatic mortality event",
    estimatedSeverity: "high",
    possibleCause: "Possible dissolved-oxygen depletion or a toxicity event",
    confidence: 0.62,
    reason:
      "Mortality clustered in a shallow zone has several plausible causes. Water sampling is needed before any cause is attributed.",
  },
  waste_dumping: {
    possibleIssue: "Waste dumping on a shoreline or bank",
    estimatedSeverity: "medium",
    possibleCause: "Possible unauthorised disposal from a nearby site",
    confidence: 0.76,
    reason:
      "Piled material above the waterline is consistent with tipping rather than natural deposition.",
  },
};

const FALLBACK: Omit<AIAssessment, "model" | "generatedAt"> = {
  possibleIssue: "Possible degradation of the reported water body",
  estimatedSeverity: "medium",
  possibleCause: "Cause not determinable from the submitted evidence alone",
  confidence: 0.54,
  reason:
    "The submitted evidence suggests a change in water condition, but the available signals are not specific enough to narrow the cause. A field verifier should inspect the site.",
};

export const aiService = {
  async assess(input: { category: IssueCategory; description: string }): Promise<AIAssessment> {
    return request(
      "/ai/assess",
      () => ({
        ...(TEMPLATES[input.category] ?? FALLBACK),
        model: "mock-vision-triage-v0",
        generatedAt: new Date().toISOString(),
      }),
      1200,
    );
  },
};
