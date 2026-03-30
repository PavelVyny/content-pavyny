import type { VideoFormat } from "./types";

export function getFormatList(): VideoFormat[] {
  return [
    {
      name: "The Bug",
      slug: "the-bug",
      description:
        "Something broke in a funny, dramatic, or surprising way during development",
      beatCount: 4,
    },
    {
      name: "The Satisfaction",
      slug: "the-satisfaction",
      description:
        "A mechanic, visual, or sound effect looks/feels satisfying",
      beatCount: 3,
    },
    {
      name: "Before/After",
      slug: "before-after",
      description: "A feature went through a visible transformation",
      beatCount: 3,
    },
    {
      name: "The Decision",
      slug: "the-decision",
      description: "A design decision or dilemma",
      beatCount: 4,
    },
    {
      name: "The Trick",
      slug: "the-trick",
      description: "A clever solution that made something work",
      beatCount: 4,
    },
    {
      name: "The Fail",
      slug: "the-fail",
      description: "Significant effort that did not work out",
      beatCount: 4,
    },
    {
      name: "The Number",
      slug: "the-number",
      description: "A specific number tells the story",
      beatCount: 4,
    },
  ];
}
