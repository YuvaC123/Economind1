import { SiteHeader } from '@/components/landing/site-header'
import { HeroSection } from '@/components/landing/hero-section'
import { FeatureCards } from '@/components/landing/feature-cards'
import { HowItWorks } from '@/components/landing/how-it-works'
import { CompareSection } from '@/components/landing/compare-section'
import { CTASection } from '@/components/landing/cta-section'
import { SiteFooter } from '@/components/landing/site-footer'

export default function Page() {
  return (
    <main className="w-full">
      <SiteHeader />
      <HeroSection />
      <FeatureCards />
      <HowItWorks />
      <CompareSection />
      <CTASection />
      <SiteFooter />
    </main>
  )
}
