export function SpeakerDeckIcon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.025 13.875H4.687a4.688 4.688 0 0 1 0-9.375h6.227a1.875 1.875 0 0 1 0 3.75H4.594a.937.937 0 1 0 0 1.875h5.431a4.687 4.687 0 1 1 0 9.375H1.875a1.875 1.875 0 1 1 0-3.75h8.15a.938.938 0 0 0 0-1.875Zm4.223 5.625a5.63 5.63 0 0 0 1.688-1.875h3.94A4.125 4.125 0 0 0 24 13.5V8.625A4.125 4.125 0 0 0 19.875 4.5h-6.647a5.6 5.6 0 0 1 1.06 3.75h5.587a.375.375 0 0 1 .375.375V13.5a.375.375 0 0 1-.375.375h-4.271a5.626 5.626 0 0 1-5.556 5.625Z" />
    </svg>
  );
}
