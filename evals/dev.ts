import type { Message } from "ai";

export const devData: { input: Message[]; expected: string }[] = [
  {
    input: [
      {
        id: "1",
        role: "user",
        content:
          "In the Gottman Method, what are the 'Four Horsemen of the Apocalypse' and which one is considered the most predictive of relationship failure?",
      },
    ],
    expected:
      "The Four Horsemen of the Apocalypse are criticism, contempt, defensiveness, and stonewalling. Among these, contempt is considered the most predictive of divorce. Contempt involves statements from a position of moral superiority, including behaviors like sarcasm, cynicism, name-calling, eye-rolling, and mockery.",
  },
  {
    input: [
      {
        id: "2",
        role: "user",
        content:
          "What percentage of relationship problems do the Gottmans identify as 'perpetual' or unsolvable?",
      },
    ],
    expected:
      "Drs. John and Julie Gottman's research indicates that 69% of all relationship problems are perpetual, meaning they are unsolvable and will be a recurring theme throughout the relationship.",
  },
  {
    input: [
      {
        id: "3",
        role: "user",
        content:
          "What does the Gottman Institute's research reveal about the importance of 'turning toward' bids for connection for relationship success?",
      },
    ],
    expected:
      "The Gottmans' research found that couples who stay together and are happy turn towards each other's bids for connection 86% of the time. In contrast, couples who end up divorcing only turn towards bids 33% of the time.",
  },
]; 