"use client"

import Link from "next/link"
import { Menu, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "next-themes"

const navItems = [
  { name: "Home", href: "/" },
  { name: "Workflows", href: "#workflows" },
  { name: "Solutions", href: "#solutions" },
  { name: "Team", href: "#team" },
]

export default function Navbar() {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="w-full sticky top-0 z-50 bg-secondary shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        {/* Logo/Brand */}
        <Link href="/" className="text-xl font-semibold">
          autoTrader
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            size="icon"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[200px] sm:w-[250px] bg-secondary">
              <div className="flex flex-col space-y-4 mt-6 items-center justify-center">
                <Button
                  variant="ghost"
                  className="w-fit"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  size="icon"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                
                <a href="/cvSaadatAhmad.pdf" download>
                  <button className="text-base font-medium hover:text-primary transition-colors">
                    Resume
                  </button>
                </a>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-base font-medium hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
