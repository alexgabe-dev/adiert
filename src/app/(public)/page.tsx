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
import { getCachedPublicHomeData } from '@/features/public-data/repository';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getCachedPublicHomeData();
  return (
    <ModalProvider>
      <div className="flex min-h-screen flex-col bg-white text-[#0B1535]">
        <Header />
        <main className="flex-1">
          <HeroSection
            participatingSchoolCount={data.campaign?.participatingSchoolCount ?? 0}
            dataAvailable={data.available}
          />
          <LiveStatsBar campaign={data.campaign} dataAvailable={data.available} />
          <HowItWorksSection />
          <ReceiptVerificationDemo />
          <LeaderboardSection schools={data.leaderboard} dataAvailable={data.available} />
          <GamificationTeaser
            approvedBottleCount={data.campaign?.approvedBottleCount ?? 0}
            dataAvailable={data.available}
          />
          <QrCodeCtaSection />
          <NewsSection items={data.news} />
          <FaqSection />
        </main>
        <Footer />
      </div>
    </ModalProvider>
  );
}
