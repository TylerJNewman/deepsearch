import type { Message } from "ai";

export const ciData: { input: Message[]; expected: string }[] = [
  {
    input: [
      {
        id: "4",
        role: "user",
        content:
          "Why do the Gottmans recommend a 'six-second kiss' as a ritual of connection for couples?",
      },
    ],
    expected:
      "The Gottmans recommend a six-second kiss because a kiss of that duration is long enough to release oxytocin, a hormone that creates a sense of bonding, connection, and psychological safety between partners.",
  },
  {
    input: [
      {
        id: "5",
        role: "user",
        content:
          "In Gottman Method Couples Therapy, what does the term 'flooding' describe?",
      },
    ],
    expected:
      "In the Gottman Method, 'flooding' describes a physiological state of fight-or-flight where the body is overwhelmed by stress hormones like cortisol and adrenaline during a conflict. This state makes it impossible to listen, process information, or engage in creative problem-solving.",
  },
  {
    input: [
      {
        id: "6",
        role: "user",
        content:
          "What is the Gottman-approved strategy for managing 'flooding' during a conflict?",
      },
    ],
    expected:
      "The Gottman-approved strategy is to take a time-out. The person feeling flooded should state they need a break, specify a time they will return to the conversation (e.g., in 30 minutes), and then spend the break doing something self-soothing and distracting, not ruminating on the fight.",
  },
  {
    input: [
      {
        id: "7",
        role: "user",
        content:
          "What are the components of the 'ATTUNE' framework developed by the Gottmans for building connection?",
      },
    ],
    expected:
      "The ATTUNE framework consists of six components: Awareness of your partner's emotion; Turning toward the emotion; Tolerance of different viewpoints; Understanding your partner's perspective; Non-defensive responding to your partner; and responding with Empathy.",
  },
  {
    input: [
      {
        id: "8",
        role: "user",
        content:
          "According to Dr. John Gottman's research, which partner is more likely to bring up issues in a heterosexual relationship, and what is the stated percentage?",
      },
    ],
    expected:
      "According to Dr. Gottman's research, women are the ones who bring up issues in a heterosexual relationship 80% of the time.",
  },
  {
    input: [
      {
        id: "9",
        role: "user",
        content:
          "How do the Gottmans differentiate between expressing criticism versus stating a positive need?",
      },
    ],
    expected:
      "The Gottmans differentiate them based on their focus. Criticism is an attack on the partner's character, often using 'you' statements. Stating a positive need involves using 'I' statements to describe your own feelings about a situation and then clearly stating what you need your partner to do to help resolve it.",
  },
  {
    input: [
      {
        id: "10",
        role: "user",
        content:
          "What physiological reason does Dr. John Gottman's research offer for why men are more prone to 'stonewalling' during arguments?",
      },
    ],
    expected:
      "Dr. Gottman's research suggests men are more prone to stonewalling because they become physiologically flooded (aroused) more easily and it takes longer for them to calm down. Stonewalling becomes a protective mechanism to prevent themselves from escalating the conflict or saying something they'll regret.",
  },
  {
    input: [
      {
        id: "11",
        role: "user",
        content:
          "In the Gottman framework, what defines a 'gridlocked' perpetual problem?",
      },
    ],
    expected:
      "A 'gridlocked' perpetual problem is an unsolvable issue that the couple cannot discuss without getting stuck. The conversation becomes a power struggle where each person feels their core identity is being attacked, leading to repeated, unproductive, and emotionally painful arguments.",
  },
  {
    input: [
      {
        id: "12",
        role: "user",
        content:
          "What is the 'Magic Ratio' of positive to negative interactions that Dr. John Gottman's research identified in successful couples during conflict?",
      },
    ],
    expected:
      "The 'Magic Ratio' identified by Dr. Gottman's research is 5 to 1. This means that for every one negative interaction during conflict, successful couples have five or more positive interactions (like humor, affection, or validation).",
  },
  {
    input: [
      {
        id: "13",
        role: "user",
        content:
          "What is the Gottman concept of 'Building Love Maps,' and what is the primary technique they recommend for keeping them current?",
      },
    ],
    expected:
      "'Building Love Maps' is the Gottman concept for knowing your partner’s inner psychological world: their hopes, dreams, fears, and history. The primary technique they recommend for keeping them current is to ask each other open-ended questions regularly.",
  },
]; 