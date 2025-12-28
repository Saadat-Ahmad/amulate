"use client"

import React from "react"
import Link from "next/link"
import { Github, Linkedin, Instagram, Twitter } from "lucide-react"

export default function Footer() {

  return (
    <footer className="bg-secondary border-t mt-10">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left - Branding */}
        <div className="text-center md:text-left">
             <Link href="/" className="text-lg text-accent font-semibold">autoTrader</Link>
        </div>

        {/* Center - Nav Links */}
        <div className="flex space-x-10">
          <Link href="/workflows" className="hover:text-primary text-sm transition-colors">Workflows</Link>
          <Link href="/dynamicPricing" className="hover:text-primary text-sm transition-colors">Dynamic Pricing</Link>
          <Link href="/assist" className="hover:text-primary text-sm transition-colors">ERP Assist</Link>
        </div>

        {/* Right - Socials and Theme */}
        <div className="flex items-center space-x-4">
                  <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <Instagram className="w-5 h-5" />
          </a>

          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <Github className="w-5 h-5" />
          </a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <Linkedin className="w-5 h-5" />
          </a>
          
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Bottom - Copyright */}
      <div className="text-center text-xs text-accent pb-4">
        &copy; {new Date().getFullYear()} autoTrader. All rights reserved.
      </div>
    </footer>
  )
}
