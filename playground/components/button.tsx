interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive";
}

export const CustomButtom = ({
  children,
  className,
  variant = "default",
  ...rest
}: ButtonProps) => {
  const bg =
    variant === "destructive"
      ? "red"
      : variant === "secondary"
        ? "black"
        : "slategray";
  return (
    <button
      {...rest}
      style={{
        padding: "6px 14px",
        background: bg,
        outline: "none",
        border: "none",
        borderRadius: "4px",
        color: "white",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
};
