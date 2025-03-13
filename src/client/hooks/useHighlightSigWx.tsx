/**
 * replace all parentheses with a span element that highlights the significant weather
 * @param text the text to parse
 * @returns JSX span elements with significant weather highlighted
 */
export function useHighlightSigWx() {
  const highlightSigWx = (text: string | undefined) => {
    if (!text) return null;

    const parts = text.split(/([\(\)])/);
    return parts.map((part, index) => {
      if (part === "(" || part === ")") return null;

      // If the previous part was an opening bracket and next part is a closing bracket
      if (parts[index - 1] === "(" && parts[index + 1] === ")") {
        return (
          <span key={index} className="rounded-sm bg-black px-1 text-white">
            {part.trim()}
          </span>
        );
      }
      return part;
    });
  };

  return { highlightSigWx };
}
