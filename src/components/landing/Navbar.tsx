"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#050a18]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-shadow group-hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]">
            <span className="text-sm font-bold text-[#050a18]">BA</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Bookkeeper<span className="text-teal-400">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white group"
            >
              {link.label}
              <span className="absolute inset-x-4 -bottom-px h-px scale-x-0 bg-gradient-to-r from-teal-400/0 via-teal-400 to-teal-400/0 transition-transform group-hover:scale-x-100" />
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/get-started"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-[#050a18] shadow-[0_0_20px_rgba(45,212,191,0.25)] transition-all hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:brightness-110"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="relative z-50 rounded-lg p-2 text-slate-300 transition-colors hover:text-white lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-0 z-40 bg-[#050a18]/98 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex flex-col items-center justify-center min-h-screen gap-2 px-6">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-6 py-3 text-center text-lg font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-col gap-3 w-full max-w-xs"
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  href="/get-started"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-6 py-3 text-sm font-semibold text-[#050a18]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
