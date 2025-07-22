import type { Message } from "ai";

export const evaluationQuestions: { input: Message[]; expected: string }[] = [
  {
    input: [
      {
        id: "1",
        role: "user",
        content: "In the Gottman Method, what are the 'Four Horsemen of the Apocalypse' and which one is considered the most predictive of relationship failure?",
      },
    ],
    expected: "The Four Horsemen of the Apocalypse are criticism, contempt, defensiveness, and stonewalling. Among these, contempt is considered the most predictive of divorce. Contempt involves statements from a position of moral superiority, including behaviors like sarcasm, cynicism, name-calling, eye-rolling, and mockery.",
  },
  {
    input: [
      {
        id: "2",
        role: "user",
        content: "What percentage of relationship problems do the Gottmans identify as 'perpetual' or unsolvable?",
      },
    ],
    expected: "Drs. John and Julie Gottman's research indicates that 69% of all relationship problems are perpetual, meaning they are unsolvable and will be a recurring theme throughout the relationship.",
  },
  {
    input: [
      {
        id: "3",
        role: "user",
        content: "What does the Gottman Institute's research reveal about the importance of 'turning toward' bids for connection for relationship success?",
      },
    ],
    expected: "The Gottmans' research found that couples who stay together and are happy turn towards each other's bids for connection 86% of the time. In contrast, couples who end up divorcing only turn towards bids 33% of the time.",
  },
  {
    input: [
      {
        id: "4",
        role: "user",
        content: "Why do the Gottmans recommend a 'six-second kiss' as a ritual of connection for couples?",
      },
    ],
    expected: "The Gottmans recommend a six-second kiss because a kiss of that duration is long enough to release oxytocin, a hormone that creates a sense of bonding, connection, and psychological safety between partners.",
  },
  {
    input: [
      {
        id: "5",
        role: "user",
        content: "In Gottman Method Couples Therapy, what does the term 'flooding' describe?",
      },
    ],
    expected: "In the Gottman Method, 'flooding' describes a physiological state of fight-or-flight where the body is overwhelmed by stress hormones like cortisol and adrenaline during a conflict. This state makes it impossible to listen, process information, or engage in creative problem-solving.",
  },
  {
    input: [
      {
        id: "6",
        role: "user",
        content: "What is the Gottman-approved strategy for managing 'flooding' during a conflict?",
      },
    ],
    expected: "The Gottman-approved strategy is to take a time-out. The person feeling flooded should state they need a break, specify a time they will return to the conversation (e.g., in 30 minutes), and then spend the break doing something self-soothing and distracting, not ruminating on the fight.",
  },
  // {
  //   input: [
  //     {
  //       id: "7",
  //       role: "user",
  //       content: "What are the components of the 'ATTUNE' framework developed by the Gottmans for building connection?",
  //     },
  //   ],
  //   expected: "The ATTUNE framework consists of six components: Awareness of your partner's emotion; Turning toward the emotion; Tolerance of different viewpoints; Understanding your partner's perspective; Non-defensive responding to your partner; and responding with Empathy.",
  // },
  // {
  //   input: [
  //     {
  //       id: "8",
  //       role: "user",
  //       content: "According to Dr. John Gottman's research, which partner is more likely to bring up issues in a heterosexual relationship, and what is the stated percentage?",
  //     },
  //   ],
  //   expected: "According to Dr. Gottman's research, women are the ones who bring up issues in a heterosexual relationship 80% of the time.",
  // },
  // {
  //   input: [
  //     {
  //       id: "9",
  //       role: "user",
  //       content: "How do the Gottmans differentiate between expressing criticism versus stating a positive need?",
  //     },
  //   ],
  //   expected: "The Gottmans differentiate them based on their focus. Criticism is an attack on the partner's character, often using 'you' statements. Stating a positive need involves using 'I' statements to describe your own feelings about a situation and then clearly stating what you need your partner to do to help resolve it.",
  // },
  // {
  //   input: [
  //     {
  //       id: "10",
  //       role: "user",
  //       content: "What physiological reason does Dr. John Gottman's research offer for why men are more prone to 'stonewalling' during arguments?",
  //     },
  //   ],
  //   expected: "Dr. Gottman's research suggests men are more prone to stonewalling because they become physiologically flooded (aroused) more easily and it takes longer for them to calm down. Stonewalling becomes a protective mechanism to prevent themselves from escalating the conflict or saying something they'll regret.",
  // },
  // {
  //   input: [
  //     {
  //       id: "11",
  //       role: "user",
  //       content: "In the Gottman framework, what defines a 'gridlocked' perpetual problem?",
  //     },
  //   ],
  //   expected: "A 'gridlocked' perpetual problem is an unsolvable issue that the couple cannot discuss without getting stuck. The conversation becomes a power struggle where each person feels their core identity is being attacked, leading to repeated, unproductive, and emotionally painful arguments.",
  // },
  // {
  //   input: [
  //     {
  //       id: "12",
  //       role: "user",
  //       content: "What is the 'Magic Ratio' of positive to negative interactions that Dr. John Gottman's research identified in successful couples during conflict?",
  //     },
  //   ],
  //   expected: "The 'Magic Ratio' identified by Dr. Gottman's research is 5 to 1. This means that for every one negative interaction during conflict, successful couples have five or more positive interactions (like humor, affection, or validation).",
  // },
  // {
  //   input: [
  //     {
  //       id: "13",
  //       role: "user",
  //       content: "What is the Gottman concept of 'Building Love Maps,' and what is the primary technique they recommend for keeping them current?",
  //     },
  //   ],
  //   expected: "'Building Love Maps' is the Gottman concept for knowing your partner’s inner psychological world: their hopes, dreams, fears, and history. The primary technique they recommend for keeping them current is to ask each other open-ended questions regularly.",
  // },
  // {
  //   input: [
  //     {
  //       id: "14",
  //       role: "user",
  //       content: "Dr. John Gottman often cites a German study regarding a daily ritual for couples. What did this study find about men who kiss their wives goodbye before leaving for work?",
  //     },
  //   ],
  //   expected: "The 10-year German study cited by Dr. Gottman found that men who kiss their wives goodbye when they leave for work live, on average, four years longer than men who do not.",
  // },
  // {
  //   input: [
  //     {
  //       id: "15",
  //       role: "user",
  //       content: "What is a simple but powerful tool Dr. John Gottman personally uses and recommends for de-escalating conflict and improving listening?",
  //     },
  //   ],
  //   expected: "Dr. John Gottman personally uses and recommends a notebook and pen. He takes notes when his wife, Dr. Julie Gottman, needs to talk about something important. This action helps him stay calm, listen better, and shows her that he values what she has to say.",
  // },
  // {
  //   input: [
  //     {
  //       id: "16",
  //       role: "user",
  //       content: "In the Gottman Method, what is considered the ultimate cause of most failed relationships, and how is this concept defined?",
  //     },
  //   ],
  //   expected: "The Gottmans state that betrayal is at the heart of every failed relationship. Betrayal is defined broadly as any action that breaks trust or demonstrates a lack of loyalty, such as disrespect, emotional unavailability, or siding with others against your partner, not just infidelity.",
  // },
  // {
  //   input: [
  //     {
  //       id: "17",
  //       role: "user",
  //       content: "What are 'repair attempts' according to the Gottman Method, and what makes them effective during a conflict?",
  //     },
  //   ],
  //   expected: "A 'repair attempt' is any action or statement used to de-escalate tension during a conflict. For a repair to be effective, the other partner must accept it. The Gottmans found that repairs focused on emotion (e.g., 'I'm starting to feel defensive') work, while rational, business-like repairs (e.g., 'Let's be rational about this') typically fail.",
  // },
  // {
  //   input: [
  //     {
  //       id: "18",
  //       role: "user",
  //       content: "How does the Gottman Method describe the relationship between friendship and passion in a long-term partnership?",
  //     },
  //   ],
  //   expected: "The Gottman Method posits that a deep friendship is the foundation for lasting passion and a great sex life. The emotional connection, trust, and admiration built through friendship create the psychological safety and intimacy necessary for eroticism to thrive.",
  // },
  // {
  //   input: [
  //     {
  //       id: "19",
  //       role: "user",
  //       content: "Why do the Gottmans say it's critical to honor your partner's dreams, even if they seem incompatible with your own?",
  //     },
  //   ],
  //   expected: "The Gottmans say honoring your partner's dreams is crucial because it supports their life's purpose and individual identity. Gridlocked conflicts often stem from unacknowledged dreams. Supporting these dreams, even if you don't share them, builds trust and shows you value your partner as an individual, which is essential for long-term success.",
  // },
  // {
  //   input: [
  //     {
  //       id: "20",
  //       role: "user",
  //       content: "What does the research cited by Dr. John Gottman reveal about the connection between cuddling and sexual satisfaction in a relationship?",
  //     },
  //   ],
  //   expected: "The research cited by Dr. Gottman shows a very strong connection. A large study found that 96% of couples who do not cuddle reported having an awful sex life. This highlights the importance of non-sexual physical affection in creating the intimacy required for sexual satisfaction.",
  // },
];