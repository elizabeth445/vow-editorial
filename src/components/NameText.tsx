/** Match the monogram's classic ampersand wherever the couple's names appear. */
export function NameText({ text }: { text: string }) {
  return (
    <>
      {text.split("&").map((part, index) => (
        <span key={index}>
          {index > 0 && <span className="name-amp">&amp;</span>}
          {part}
        </span>
      ))}
    </>
  );
}
