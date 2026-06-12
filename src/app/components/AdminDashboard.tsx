import { useMemo, useState } from "react";
import { Card, StatusBadge, Btn } from "./ui";
import {
  LayoutDashboard,
  ShoppingBag,
  Printer,
  LayoutTemplate,
  Settings,
  Users,
  TrendingUp,
  DollarSign,
  Star,
  Menu,
  X,
  LogOut,
  ChevronRight,
  MonitorSmartphone,
  TabletSmartphone,
  Maximize,
  Minimize,
  ScanFace,
  Images,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { time: "9am", prints: 4 },
  { time: "10am", prints: 8 },
  { time: "11am", prints: 12 },
  { time: "12pm", prints: 18 },
  { time: "1pm", prints: 14 },
  { time: "2pm", prints: 22 },
  { time: "3pm", prints: 30 },
  { time: "4pm", prints: 25 },
  { time: "5pm", prints: 19 },
];

const orders = [
  { id: "#1042", customer: "John D.", size: "2x2", time: "3:42 PM", status: "done" as const },
  { id: "#1041", customer: "Sarah M.", size: "Passport", time: "3:28 PM", status: "done" as const },
  { id: "#1040", customer: "Mike R.", size: "Mixed", time: "3:15 PM", status: "active" as const },
  { id: "#1039", customer: "Lisa K.", size: "1x1", time: "2:58 PM", status: "done" as const },
  { id: "#1038", customer: "Tom W.", size: "2x2", time: "2:44 PM", status: "done" as const },
  { id: "#1037", customer: "Anna B.", size: "Passport", time: "2:30 PM", status: "pending" as const },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "history", label: "Print History", icon: Printer },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "settings", label: "Settings", icon: Settings },
];

interface Props {
  onExit: () => void;
  appMode: "id-photo" | "photo-booth";
  onAppModeChange: (mode: "id-photo" | "photo-booth") => void;
  layoutMode: "auto" | "portrait" | "landscape";
  onLayoutModeChange: (mode: "auto" | "portrait" | "landscape") => void;
  kioskMode: boolean;
  fullscreenActive: boolean;
  onToggleKioskMode: () => void;
  onToggleFullscreen: () => void;
}

export function AdminDashboard({
  onExit,
  appMode,
  onAppModeChange,
  layoutMode,
  onLayoutModeChange,
  kioskMode,
  fullscreenActive,
  onToggleKioskMode,
  onToggleFullscreen,
}: Props) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    []
  );

  const widgets = [
    { label: "Customers Today", value: "47", icon: Users, color: "#2563EB", bg: "#EFF6FF", change: "+12%" },
    { label: "Total Prints Today", value: "184", icon: Printer, color: "#22C55E", bg: "#F0FDF4", change: "+8%" },
    { label: "Revenue Today", value: "$368", icon: DollarSign, color: "#F59E0B", bg: "#FFFBEB", change: "+15%" },
    { label: "Most Popular Size", value: "2x2", icon: Star, color: "#8B5CF6", bg: "#F5F3FF", change: "Passport #2" },
  ];

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`${
        mobile ? "w-full" : "w-64 hidden md:flex"
      } flex-col bg-white border-r border-[#E2E8F0] h-full flex-shrink-0`}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="7" rx="1" fill="white" />
              <rect x="10" y="2" width="6" height="7" rx="1" fill="white" opacity="0.7" />
              <rect x="2" y="11" width="6" height="5" rx="1" fill="white" opacity="0.7" />
              <rect x="10" y="11" width="6" height="5" rx="1" fill="white" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-[#0F172A] text-sm">ID Kiosk</p>
            <p className="text-[10px] text-[#64748B]">Admin Panel</p>
          </div>
        </div>
        {mobile && (
          <button type="button" onClick={() => setSidebarOpen(false)}>
            <X size={20} color="#64748B" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveNav(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all text-left ${
                active
                  ? "bg-[#2563EB] text-white"
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-semibold">{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onExit}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#EF4444] hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Exit Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex bg-[#F8FAFC] font-[Inter,sans-serif] overflow-hidden">
      <Sidebar />

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white z-10 flex flex-col">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} color="#64748B" />
            </button>
            <div>
              <h1 className="font-bold text-[#0F172A] text-lg capitalize">{activeNav}</h1>
              <p className="text-xs text-[#64748B]">{todayLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Kiosk Online
            </div>
            <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeNav === "dashboard" && (
            <div className="flex flex-col gap-6 max-w-5xl">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {widgets.map((w) => {
                  const Icon = w.icon;
                  return (
                    <Card key={w.label} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: w.bg }}
                        >
                          <Icon size={20} color={w.color} />
                        </div>
                        <span className="text-xs font-semibold text-[#22C55E]">{w.change}</span>
                      </div>
                      <p className="text-2xl font-extrabold text-[#0F172A]">{w.value}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{w.label}</p>
                    </Card>
                  );
                })}
              </div>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Prints Today</h3>
                    <p className="text-xs text-[#64748B]">Hourly activity</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#22C55E] font-semibold">
                    <TrendingUp size={16} />
                    +23%
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                      labelStyle={{ fontWeight: 600, color: "#0F172A" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="prints"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fill="url(#colorPrints)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0F172A]">Recent Orders</h3>
                  <Btn size="sm" variant="ghost">View All</Btn>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F1F5F9]">
                        {["Order", "Customer", "Size", "Time", "Status"].map((h) => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-[#64748B]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-3 font-mono font-semibold text-[#2563EB] text-xs">{order.id}</td>
                          <td className="py-3 px-3 font-semibold text-[#0F172A]">{order.customer}</td>
                          <td className="py-3 px-3 text-[#64748B]">{order.size}</td>
                          <td className="py-3 px-3 text-[#64748B]">{order.time}</td>
                          <td className="py-3 px-3">
                            <StatusBadge status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeNav === "settings" && (
            <div className="flex flex-col gap-6 max-w-4xl">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <Images size={22} color="#4F46E5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#0F172A]">Kiosk Mode</h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      Choose the customer flow shown on the welcome screen.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                  {[
                    {
                      id: "id-photo" as const,
                      title: "ID Photo",
                      desc: "Take one photo, choose ID background and size, then print.",
                    },
                    {
                      id: "photo-booth" as const,
                      title: "Photo Booth",
                      desc: "Automatically take four photos, then print them together on A5.",
                    },
                  ].map((option) => {
                    const active = appMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onAppModeChange(option.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          active
                            ? "border-[#2563EB] bg-blue-50 shadow-sm"
                            : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"
                        }`}
                      >
                        <span className={`font-semibold ${active ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                          {option.title}
                        </span>
                        <p className="text-sm text-[#64748B] mt-2">{option.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <MonitorSmartphone size={22} color="#2563EB" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#0F172A]">Display Settings</h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      Choose how the kiosk frames itself for phones, tablets, and PCs.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                  {[
                    {
                      id: "auto" as const,
                      title: "Auto",
                      desc: "Portrait on phones, landscape on tablets and desktops.",
                    },
                    {
                      id: "portrait" as const,
                      title: "Portrait",
                      desc: "Always use a vertical phone-style layout.",
                    },
                    {
                      id: "landscape" as const,
                      title: "Landscape",
                      desc: "Always use a wider tablet or PC layout.",
                    },
                  ].map((option) => {
                    const active = layoutMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onLayoutModeChange(option.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          active
                            ? "border-[#2563EB] bg-blue-50 shadow-sm"
                            : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <TabletSmartphone size={18} color={active ? "#2563EB" : "#64748B"} />
                          <span className={`font-semibold ${active ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                            {option.title}
                          </span>
                        </div>
                        <p className="text-sm text-[#64748B] mt-2">{option.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Maximize size={22} color="#22C55E" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#0F172A]">Kiosk Fullscreen</h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      Hide the browser chrome while the kiosk is running. The floating button exits fullscreen and brings the browser back.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={onToggleKioskMode}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition-all ${
                      kioskMode ? "border-green-200 bg-green-50" : "border-[#E2E8F0] bg-white"
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-[#0F172A]">Kiosk Mode</p>
                      <p className="text-sm text-[#64748B] mt-1">
                        {kioskMode ? "Fullscreen is preferred while serving customers." : "Use a normal browser window."}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${kioskMode ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                      {kioskMode ? "On" : "Off"}
                    </span>
                  </button>

                  <Btn
                    onClick={onToggleFullscreen}
                    variant={fullscreenActive ? "secondary" : "primary"}
                    className="w-full justify-center"
                  >
                    {fullscreenActive ? <Minimize size={18} /> : <Maximize size={18} />}
                    {fullscreenActive ? "Show Browser" : "Enter Fullscreen"}
                  </Btn>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <ScanFace size={22} color="#F59E0B" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Face Protection</h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      Photo generation is now instructed to keep the original face, expression, and head position unchanged.
                    </p>
                    <p className="text-sm text-[#64748B] mt-3">
                      Background and clothing edits can still happen, but the face should stay much closer to the captured photo.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeNav !== "dashboard" && activeNav !== "settings" && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                {(() => {
                  const item = navItems.find((n) => n.id === activeNav);
                  const Icon = item?.icon || LayoutDashboard;
                  return <Icon size={28} color="#94A3B8" />;
                })()}
              </div>
              <div className="text-center">
                <p className="font-bold text-[#0F172A] capitalize">{activeNav}</p>
                <p className="text-sm text-[#64748B] mt-1">This section is coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
