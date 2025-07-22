import type { Message } from "ai";

export const regressionData: { input: Message[]; expected: string }[] = [
  {
    input: [
      {
        id: "14",
        role: "user",
        content:
          "Dr. John Gottman often cites a German study regarding a daily ritual for couples. What did this study find about men who kiss their wives goodbye before leaving for work?",
      },
    ],
    expected:
      "The 10-year German study cited by Dr. Gottman found that men who kiss their wives goodbye when they leave for work live, on average, four years longer than men who do not.",
  },
  {
    input: [
      {
        id: "15",
        role: "user",
        content:
          "What is a simple but powerful tool Dr. John Gottman personally uses and recommends for de-escalating conflict and improving listening?",
      },
    ],
    expected:
      "Dr. John Gottman personally uses and recommends a notebook and pen. He takes notes when his wife, Dr. Julie Gottman, needs to talk about something important. This action helps him stay calm, listen better, and shows her that he values what she has to say.",
  },
  {
    input: [
      {
        id: "16",
        role: "user",
        content:
          "In the Gottman Method, what is considered the ultimate cause of most failed relationships, and how is this concept defined?",
      },
    ],
    expected:
      "The Gottmans state that betrayal is at the heart of every failed relationship. Betrayal is defined broadly as any action that breaks trust or demonstrates a lack of loyalty, such as disrespect, emotional unavailability, or siding with others against your partner, not just infidelity.",
  },
  {
    input: [
      {
        id: "17",
        role: "user",
        content:
          "What are 'repair attempts' according to the Gottman Method, and what makes them effective during a conflict?",
      },
    ],
    expected:
      "A 'repair attempt' is any action or statement used to de-escalate tension during a conflict. For a repair to be effective, the other partner must accept it. The Gottmans found that repairs focused on emotion (e.g., 'I'm starting to feel defensive') work, while rational, business-like repairs (e.g., 'Let's be rational about this') typically fail.",
  },
  {
    input: [
      {
        id: "18",
        role: "user",
        content:
          "How does the Gottman Method describe the relationship between friendship and passion in a long-term partnership?",
      },
    ],
    expected:
      "The Gottman Method posits that a deep friendship is the foundation for lasting passion and a great sex life. The emotional connection, trust, and admiration built through friendship create the psychological safety and intimacy necessary for eroticism to thrive.",
  },
  {
    input: [
      {
        id: "19",
        role: "user",
        content:
          "Why do the Gottmans say it's critical to honor your partner's dreams, even if they seem incompatible with your own?",
      },
    ],
    expected:
      "The Gottmans say honoring your partner's dreams is crucial because it supports their life's purpose and individual identity. Gridlocked conflicts often stem from unacknowledged dreams. Supporting these dreams, even if you don't share them, builds trust and shows you value your partner as an individual, which is essential for long-term success.",
  },
  {
    input: [
      {
        id: "20",
        role: "user",
        content:
          "What does the research cited by Dr. John Gottman reveal about the connection between cuddling and sexual satisfaction in a relationship?",
      },
    ],
    expected:
      "The research cited by Dr. Gottman shows a very strong connection. A large study found that 96% of couples who do not cuddle reported having an awful sex life. This highlights the importance of non-sexual physical affection in creating the intimacy required for sexual satisfaction.",
  },
]; 