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
    <main className="flex-1 flex flex-col">
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (step === 'archived') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <BugBanner />
        <ScreenRenderer />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BugBanner />
      <Header />
      <ScreenRenderer />
      <Footer />
    </div>
  );
};
export default Index;
