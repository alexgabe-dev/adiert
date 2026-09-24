'use client';

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Camera, Menu, X, ArrowRight, Heart } from 'lucide-react';

import { ModalDialog } from '@/components/ui/ModalDialog';
import { useModalActions } from '@/components/providers/ModalProvider';

export const Header: React.FC = () => {
  const menuTitleId = useId();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openRegister, openSubmit } = useModalActions();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Ádi története', href: '#adi-tortenete' },
    { label: 'Hogyan működik?', href: '#hogyan-mukodik' },
    { label: 'Ranglista', href: '#ranglista' },
    { label: 'Iskoláknak', href: '#iskolaknak' },
    { label: 'GYIK', href: '#gyik' },
    { label: 'Tanári belépés', href: '/tanar' },
  ];

  return (
    <header
      id="main-header"
      style={{
        paddingTop: `calc(${isScrolled ? '0.875rem' : '1.125rem'} + env(safe-area-inset-top))`,
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 py-3.5'
          : 'bg-white/80 backdrop-blur-xs py-4.5'
      }`}
    >
      <div className="safe-content max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side: Intentionally Minimal Wordmark */}
        <Link
          href="/"
          id="header-brand"
          className="flex items-center gap-2.5 text-[#0B1535] hover:opacity-90 transition-opacity group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Heart className="w-4.5 h-4.5 fill-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Ádiért<span className="text-blue-600 font-black">.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1 lg:gap-2" aria-label="Fő navigáció">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[#0B1535]/80 hover:text-blue-600 font-medium text-sm px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden xl:flex items-center gap-3">
          <button
            type="button"
            onClick={() => openSubmit()}
            id="header-submit-cta"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4.5 py-2.5 rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Gyűjtés beküldése</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => openSubmit()}
            aria-label="Gyűjtés beküldése"
            className="flex size-11 items-center justify-center bg-blue-50 text-blue-600 rounded-xl"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-haspopup="dialog"
            className="flex size-11 items-center justify-center text-slate-700 hover:text-blue-600 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <ModalDialog
          labelId={menuTitleId}
          onClose={() => setMobileMenuOpen(false)}
          className="ml-auto flex h-full max-w-sm flex-col rounded-2xl p-4 sm:p-6"
        >
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 id={menuTitleId} className="text-lg font-extrabold">
              Ádiért.
            </h2>
            <button
              type="button"
              data-autofocus
              aria-label="Menü bezárása"
              onClick={() => setMobileMenuOpen(false)}
              className="flex size-11 items-center justify-center rounded-xl bg-slate-50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div
            id="mobile-navigation"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain"
          >
            <nav aria-label="Mobil navigáció" className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#0B1535] font-medium text-base min-h-12 flex items-center py-2.5 px-3 rounded-lg hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSubmit();
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-xs"
              >
                <Camera className="w-5 h-5" />
                <span>Gyűjtés beküldése</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openRegister();
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-800 font-semibold py-2.5 px-4 rounded-xl"
              >
                <span>Iskola csatlakoztatása</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </header>
  );
};
