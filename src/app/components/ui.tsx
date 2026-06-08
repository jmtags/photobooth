import { ReactNode } from "react";
import { Check, Zap, Shield, Printer } from "lucide-react";

// ─── Color tokens ────────────────────────────────────────────────────────────
export const C = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  success: "#22C55E",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  danger: "#EF4444",
  warning: "#F59E0B",
};

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  type = "button",
  fullWidth,
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[52px]",
    lg: "px-8 py-4 text-lg min-h-[60px]",
  };
  const variants = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-lg shadow-blue-200",
    secondary: "bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] shadow-sm",
    danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-lg shadow-red-200",
    ghost: "bg-transparent text-[#64748B] hover:bg-[#F8FAFC]",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E2E8F0] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current
              ? "w-6 bg-[#22C55E]"
              : i === current
              ? "w-6 bg-[#2563EB]"
              : "w-2 bg-[#E2E8F0]"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-[#64748B]">
        {current + 1} / {total}
      </span>
    </div>
  );
}

// ─── Screen shell ─────────────────────────────────────────────────────────────
export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`h-full min-h-full bg-[#F8FAFC] flex flex-col font-[Inter,sans-serif] ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };
  return (
    <div className={`flex items-center gap-2 font-bold ${sz[size]} text-[#0F172A]`}>
      <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="6" height="7" rx="1" fill="white" />
          <rect x="10" y="2" width="6" height="7" rx="1" fill="white" opacity="0.7" />
          <rect x="2" y="11" width="6" height="5" rx="1" fill="white" opacity="0.7" />
          <rect x="10" y="11" width="6" height="5" rx="1" fill="white" />
        </svg>
      </div>
      <span>ID Kiosk</span>
    </div>
  );
}

// ─── Feature chip ─────────────────────────────────────────────────────────────
const featureIcons = {
  fast: Zap,
  quality: Shield,
  print: Printer,
};
export function FeatureChip({
  icon,
  label,
}: {
  icon: keyof typeof featureIcons;
  label: string;
}) {
  const Icon = featureIcons[icon];
  return (
    <Card className="flex flex-col items-center gap-2 p-4 flex-1 min-w-[100px]">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
        <Icon size={20} color="#2563EB" />
      </div>
      <span className="text-xs font-semibold text-[#0F172A] text-center">{label}</span>
    </Card>
  );
}

// ─── Option card ──────────────────────────────────────────────────────────────
export function OptionCard({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer min-w-[88px] flex-1 ${
        selected
          ? "border-[#2563EB] bg-blue-50"
          : "border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:bg-blue-50/30"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          selected ? "bg-[#2563EB]" : "bg-[#F8FAFC]"
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-xs font-semibold text-center leading-tight ${
          selected ? "text-[#2563EB]" : "text-[#0F172A]"
        }`}
      >
        {label}
      </span>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center">
          <Check size={12} color="white" />
        </div>
      )}
    </button>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#E2E8F0] last:border-0">
      <div>
        <p className="font-semibold text-[#0F172A] text-sm">{label}</p>
        {description && <p className="text-xs text-[#64748B] mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
          value ? "bg-[#2563EB]" : "bg-[#E2E8F0]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-[#0F172A]">{title}</h2>
      {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: "pending" | "done" | "active" }) {
  const styles = {
    pending: "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]",
    active: "bg-blue-50 text-[#2563EB] border border-[#93C5FD]",
    done: "bg-green-50 text-[#22C55E] border border-green-200",
  };
  const labels = { pending: "Pending", active: "Processing", done: "Done" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Back/nav header ─────────────────────────────────────────────────────────
export function NavHeader({
  onBack,
  title,
  step,
  totalSteps,
}: {
  onBack?: () => void;
  title: string;
  step?: number;
  totalSteps?: number;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-white">
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <Logo size="sm" />
      </div>
      <div className="flex flex-col items-center">
        <span className="font-semibold text-[#0F172A] text-sm">{title}</span>
      </div>
      <div>
        {step !== undefined && totalSteps !== undefined && (
          <StepIndicator current={step} total={totalSteps} />
        )}
      </div>
    </div>
  );
}
