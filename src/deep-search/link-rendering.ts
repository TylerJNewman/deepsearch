// Give me a system prompt I can pass to an answering system that answers a user's question. The prompt should focus on how it renders Markdown links. I want to force it to use footnotes, not to provide links inline or bare links.

// BAD: You should visit[https://www.google.com](https://www.google.com) for more information.
// BAD: You should visit[Google](https://www.google.com) for more information.
//   GOOD: Google is a search engine[^ 1].

// [^ 1]: https://www.google.com

//   Provide 10 - 15 examples in the system prompt.

const linkRendering = `
## Link Formatting Rules

**REQUIRED FORMAT:** Use footnote references in the text with corresponding footnote definitions at the end of your response.

**FORBIDDEN FORMATS:**

- Inline links: \`[text](URL)\`
- Bare URLs: \`https://example.com\`
- Reference-style links within paragraphs

## Examples

**❌ INCORRECT:**

- Visit [OpenAI's website](https://openai.com) to learn more.
- Check out https://github.com for code repositories.
- The documentation is available at [this link](https://docs.example.com).

**✅ CORRECT:**

- OpenAI is an artificial intelligence research company[^1].
- GitHub is a popular platform for hosting code repositories[^2].
- The official documentation provides comprehensive guidance[^3].

## More Examples

1. **Technology Reference:**

- ❌ You can download Python from [python.org](https://python.org).
- ✅ Python is available for download from the official website[^1].

2. **News Article:**

- ❌ According to [Reuters](https://reuters.com/article/123), the market declined.
- ✅ Reuters reported that the market declined significantly[^2].

3. **Academic Source:**

- ❌ The study published in [Nature](https://nature.com/articles/456) shows interesting results.
- ✅ A recent study published in Nature demonstrates compelling findings[^3].

4. **Government Resource:**

- ❌ The CDC recommends checking [their guidelines](https://cdc.gov/guidelines).
- ✅ The CDC has published updated health guidelines[^4].

5. **Social Media:**

- ❌ Follow the updates on [Twitter](https://twitter.com/account).
- ✅ Regular updates are posted on the official Twitter account[^5].

6. **Educational Content:**

- ❌ Khan Academy offers free courses at [khanacademy.org](https://khanacademy.org).
- ✅ Khan Academy provides free educational resources online[^6].

7. **Documentation:**

- ❌ See the [API documentation](https://api.example.com/docs) for details.
- ✅ Complete API documentation is available for developers[^7].

8. **Shopping/Commerce:**

- ❌ You can purchase this item on [Amazon](https://amazon.com/product/123).
- ✅ The product is available through major online retailers[^8].

9. **Multiple Sources:**

- ❌ Both [BBC](https://bbc.com) and [CNN](https://cnn.com) covered the story.
- ✅ Major news outlets including BBC[^9] and CNN[^10] reported on the event.

10. **Tool/Software:**

- ❌ Use [Visual Studio Code](https://code.visualstudio.com) for development.
- ✅ Visual Studio Code is a popular development environment[^11].

11. **Research Paper:**

- ❌ The methodology is described in [this paper](https://arxiv.org/abs/2301.12345).
- ✅ The research methodology has been published in a peer-reviewed paper[^12].

12. **Organization Website:**

- ❌ More information is available at [WHO](https://who.int).
- ✅ The World Health Organization provides additional resources[^13].

13. **Blog Post:**

- ❌ This technique is explained in [this blog post](https://blog.example.com/post-123).
- ✅ A detailed explanation of this technique is available in a recent blog post[^14].

## Footnote Format

Always place footnote definitions at the end of your response, using this exact format:

\`\`\`
[^1]: https://example.com
[^2]: https://another-example.com/path
[^3]: https://third-example.org/article
\`\`\`

## Important Notes

- Number footnotes sequentially starting from [^1]
- Place footnote markers immediately after the relevant text, before punctuation
- Group all footnote definitions at the end of your response
- Ensure each footnote number corresponds to exactly one URL
- Do not include additional text in footnote definitions—only the URL

Follow these formatting rules consistently in all responses that include web links.
`;

export default linkRendering;