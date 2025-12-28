"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Copy } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/navbar/Navbar"
import Footer from "@/components/footer/footer"
import { InteractiveGridPattern } from "@/components/ui/shadcn-io/interactive-grid-pattern"

export default function HomePage() {

  const redirectBilling = () => {
    location.href = "#solutions"
  }

  const solutions = [
    {
      title: "Automated Workflow",
      image: "/workflow.png",
      line: "Automated stock puchasing and product sale",
      description: "Autmation workflows that finds a suitable vendor and also analyses the prices of competitor selling similar product to determine an optimal selling price for maximising profits.",
      link: "workflows",
    },
    {
      title: "Dynamic Pricing",
      image: "/dynamic.jpg",
      line: "Regulating the price for increased profits",
      description: "Increasing and decreasing the price of a commodity in real-time based on market demand, seasonality, and customer behavior. The Flexible selling price allows for increase in revenue in times of high demand",
      link: "dynamicPricing",
    },
    {
      title: "ERP Assist",
      image: "/optimisation.jpg",
      line: "Intelligent assist for ERP manager",
      description: "Provides the ERP manager with competitior analysis, vendor shortlistings, auto redordering of high demand commodities, quaterly performance reports of all the commities in the manager's enterprise.",
      link: "intelligentAssist",
    }
  ]
const developers = [
    {
      title: "Mohammad Faraz",
      image: "/faraz.jpeg",
      line: "AI Developer",
      description: "Developed and designed the AI agent workflows and all ML aspects of the program",
      link: "https://www.linkedin.com/in/mohammadfarazrajput/",
    },
    {
      title: "Syed Saadat Ahmad",
      image: "/Saadat.jpg",
      line: "Full Stack Developer",
      description: "Development of the full stack application and handling cron jobs and user database.",
      link: "https://www.linkedin.com/in/syedsaadatahmad/",
    }
  ]

  const steps = [
    {
      title: "Supply Chain Data collection",
      description: "Retrieves the data for various suppliers available for the product",
    },
    {
      title: "Find the best supplier",
      description: "Based on ratings and the wholesale price offered, a supplier is selected.",
    },
    {
      title: "Find Competitor selling price data",
      description: "Collect the data for all the competitors selling the same product that you are planning to sell",
    },

    {
      title: "Optimise selling price",
      description: "Optimise your selling price for most profits.",
    },
    
  ]

  return (
    <div className="relative">
        <InteractiveGridPattern className="absolute"/>
  <Navbar />
  <main className="container mx-auto px-4 py-12 max-w-4xl space-y-20">
    <div className="relative z-10 pb-20">

      {/* Introduction */}
      <section className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        <Link href={"/"}>
        <Image
          src="/logo.png"
          alt="logo"
          width={250}
          height={250}
          className="rounded-lg object-cover transition duration-300 ease-in-out hover:scale-110 hover:translate-1.5"
        />
        </Link>
        <div className="space-y-2">
          <h2 className="text-5xl"><span className="text-accent">autoTrader</span></h2>
          <h3 className="text-xl pt-4.5 mb-0 pb-0">AI Driven Supply Chain and Demand Solutions<br/></h3>
          <p className="text-muted-foreground pt-5">User frienldy automated and semi-automated solutions for your business</p>
          <Button onClick={redirectBilling} variant="destructive" className="mt-3 transition duration-300 text-xs ease-in-out hover:scale-110 sm:text-base">
          Start Now
          </Button>
        </div>
      </section>

      {/* Automated Workflow */}
      <section id="workflow" className="mt-30">
        <h2 className="text-2xl text-accent font-semibold mb-6">Automated Supply Chain and Demand model</h2>
        <div className="pl-6 pb-8 space-y-8 border-l-2 border-dotted">
          {steps.map((exp, idx) => (
            <div key={idx} className="relative">
              <span className="absolute left-[-33px] top-1 w-4 h-4 bg-accent rounded-full border-2 border-foregound"></span>
              <h3 className="font-semibold">{exp.title}</h3>
              <p className="pt-2">{exp.description}</p>
            </div>
          ))}
          </div>
          <div className="pl-6 mt-0 pt-0 space-y-8 border-l-2 border-none">
            <div className="relative">
              <span className="absolute left-[-33px] top-1 w-4 h-4 bg-accent rounded-full border-2 border-foregound"></span>
              <h3 className="font-semibold">Implement Dynamic Pricing</h3>
              <p className="pt-2">Dynamically increase or decrease the price based on the demand at that moment of time </p>
            </div>
        </div>
      </section>

      {/* Solutions Grid Section */}
<section id="solutions" className="mt-20">
  <h2 className="text-2xl text-accent font-semibold mb-6">All solutions by autoTrader</h2>
  <div className="grid lg:grid-cols-3 md:grid-cols-1 md:p-3.5 gap-6">
    {solutions.map((solution, idx) => (
      <Link key={idx} href={solution.link} target="_blank" className="group relative">
        <Card className="relative overflow-hidden rounded-1xl border bg-auto backdrop-invert-25 hover:shadow-2xl transition duration-300 ease-in-out hover:scale-110 hover:backdrop-invert-100">
          <CardContent className="pt-0 space-y-3">
            <Image
              src={solution.image}
              alt={solution.title}
              width={500}
              height={300}
              className="rounded-1xl object-cover max-h-full w-full hover:opacity-0"
            />
            <CardTitle className="text-lg text-accent font-bold">{solution.title}</CardTitle>
            <CardTitle className="text-sm">{solution.line}</CardTitle>
            
            {/* Description on hover */}
        <div className="absolute inset-0 p-4 text-sm bottom-0 left-0 right-0 top-0 h-full w-full overflow-hidden bg-bg opacity-0 transition duration-300 ease-in-out hover:opacity-100">
              <CardTitle className="text-lg text-accent font-bold hover">{solution.title}</CardTitle>
            <CardTitle className="mt-4 text-sm">{solution.description}</CardTitle>
            </div>
          </CardContent>
        </Card>
      </Link>
    ))}
  </div>
</section>


      {/* Developers */}
     <section id="team" className="py-20">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-accent">
      About the Developers
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
      {developers.map((developer, idx) => (
        <Link 
          key={idx} 
          href={developer.link} 
          target="_blank" 
          className="group block h-full"
        >
          <Card className="h-full overflow-hidden rounded-xl border border-border/40 bg-card backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl hover:shadow-accent/10">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 h-full">
              {/* Image Container */}
              <div className="md:w-1/3 flex-shrink-0">
                <div className="relative overflow-hidden rounded-lg aspect-square">
                  <Image
                    src={developer.image}
                    alt={developer.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
              
              {/* Content Container */}
              <div className="md:w-2/3 flex flex-col justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-accent mb-2">
                    {developer.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mb-3">
                    {developer.line}
                  </p>
                  <p className="text-sm text-foreground/80 line-clamp-3">
                    {developer.description}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center text-sm text-accent font-medium">
                  <span>View Profile</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  </div>
</section>
      </div>
    </main>

    <Footer/>
    </div>
  )
}
