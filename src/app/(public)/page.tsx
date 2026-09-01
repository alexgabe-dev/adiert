import { ModalProvider } from '@/components/providers/ModalProvider';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FaqSection } from '@/components/sections/FaqSection';
import { GamificationTeaser } from '@/components/sections/GamificationTeaser';
import { HeroSection } from '@/components/sections/HeroSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { LeaderboardSection } from '@/components/sections/LeaderboardSection';
import { LiveStatsBar } from '@/components/sections/LiveStatsBar';
import { NewsSection } from '@/components/sections/NewsSection';
import { QrCodeCtaSection } from '@/components/sections/QrCodeCtaSection';
import { ReceiptVerificationDemo } from '@/components/sections/ReceiptVerificationDemo';

export default function HomePage() {
  return (
    <ModalProvider>
      <div className="flex min-h-screen flex-col bg-white text-[#0B1535]">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <LiveStatsBar />
          <HowItWorksSection />
          <ReceiptVerificationDemo />
          <LeaderboardSection />
          <GamificationTeaser />
          <QrCodeCtaSection />
          <NewsSection />
          <FaqSection />
        </main>
        <Footer />
      </div>
    </ModalProvider>
  );
}
