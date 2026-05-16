import { Outlet, Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { cn } from "./ui/utils";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Submit Startup", path: "/submit-startup" },
    { name: "Mentor Matching", path: "/mentor-matching" },
    { name: "Funder Matching", path: "/funder-matching" },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/30 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-xl md:text-2xl tracking-tighter text-emerald-700 flex-shrink-0">
            MyHack
          </Link>
          <div className="flex items-center gap-2 lg:gap-8 overflow-x-auto no-scrollbar">
            <nav className="hidden md:flex items-center gap-1 lg:gap-6 whitespace-nowrap">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-xs lg:text-sm font-medium transition-colors hover:text-emerald-700 relative py-2 px-1 lg:px-2",
                    location.pathname === link.path ? "text-emerald-700" : "text-slate-600"
                  )}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 lg:gap-4 border-l pl-2 lg:pl-8 border-slate-200 flex-shrink-0">
              {user ? (
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-emerald-200" />
                    ) : (
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-medium border border-emerald-200">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-xs lg:text-sm font-medium text-slate-700 hidden lg:block whitespace-nowrap">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="text-xs lg:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-xs lg:text-sm font-medium bg-emerald-600 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
