import { AppProvider, useAppContext } from "@/context/AppContext";
import { Footer } from "@/components/Footer";
import { Gate } from "@/components/screens/Gate";
import { Otp } from "@/components/screens/Otp";
import { AcceptTerms } from "@/components/screens/AcceptTerms";
import { Profile } from "@/components/screens/Profile";
import { Success } from "@/components/screens/Success";
import { Header } from "@/components/Header";
import { Archived } from "@/components/screens/Archived";
import { BugBanner } from "@/components/BugBanner";
const ScreenRenderer = () => {
  const { step } = useAppContext();
  if (step === 'archived') {
    return <Archived />;
  }
  return (
    <main className="flex w-full flex-1 flex-col">
      {step === 'gate' && <Gate />}
      {step === 'otp' && <Otp />}
      {step === 'accept_terms' && <AcceptTerms />}
      {step === 'profile' && <Profile />}
      {step === 'success' && <Success />}
    </main>
  );
};
const Index = () => {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};
const AppLayout = () => {
  const { step, initializing } = useAppContext();
  
  if (initializing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="brand-eyebrow animate-pulse">Loading</div>
      </div>
    );
  }
  
  if (step === 'archived') {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <BugBanner />
        <ScreenRenderer />
      </div>
    );
  }
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BugBanner />
      <Header />
      <ScreenRenderer />
      <Footer />
    </div>
  );
};
export default Index;
